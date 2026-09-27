"""Thí nghiệm 2 - Chuỗi thời gian hỗn loạn: Echo State Network (mạng hồ chứa) vs LSTM & MLP.

Điểm mạnh được kiểm tra của mạng hồ chứa (họ "lọc thích nghi"):
  A. Dự báo tự hồi quy chuỗi hỗn loạn Mackey-Glass (tau=17): chỉ huấn luyện lớp đọc ra
     bằng hồi quy tuyến tính -> nhanh hơn nhiều bậc so với lan truyền ngược qua thời gian.
  B. Thích nghi trực tuyến khi hệ đổi chế độ (tau 17 -> 30 giữa dòng dữ liệu): lớp đọc ra
     cập nhật từng bước bằng RLS (Recursive Least Squares, bộ lọc thích nghi kinh điển).

Baseline mạng nơ-ron: LSTM và MLP (cửa sổ trễ) huấn luyện bằng backprop + Adam (JAX).
Siêu tham số của MỌI mô hình được chọn trên đoạn kiểm định, không nhìn đoạn test.
"""
import itertools

import jax
import jax.numpy as jnp
import numpy as np
import optax

from chung import DongHo, duong_dan, khoi_tao_mlp, luu_json, mlp, so_tham_so, tb_lech

NGUONG_SAI = 0.3  # "thời gian dự báo đúng": sai số chuẩn hoá còn dưới ngưỡng này
MOC = 84          # mốc dự báo 84 bước, chuẩn kinh điển của Mackey-Glass


# ---------------------------------------------------------------- dữ liệu
def mackey_glass(n, tau_theo_t, seed=0, dt=0.1, lay_mau=10):
    """dx/dt = 0.2 x(t-tau) / (1 + x(t-tau)^10) - 0.1 x(t); tích phân Euler, lấy mẫu mỗi 1 đơn vị."""
    rng = np.random.default_rng(seed)
    lich_su = int(40 / dt)
    x = np.empty(n * lay_mau + lich_su)
    x[:lich_su] = 1.2 + 0.05 * rng.standard_normal(lich_su)
    for i in range(lich_su - 1, len(x) - 1):
        t = (i - lich_su) * dt
        tre = x[i - int(tau_theo_t(t) / dt)]
        x[i + 1] = x[i] + dt * (0.2 * tre / (1 + tre ** 10) - 0.1 * x[i])
    return x[lich_su::lay_mau][:n]


# ---------------------------------------------------------------- Echo State Network
class ESN:
    def __init__(self, N=500, ban_kinh=0.95, ty_le_vao=0.5, ro_ri=0.3, ridge=1e-6, seed=0):
        rng = np.random.default_rng(seed)
        W = rng.standard_normal((N, N)) * (rng.random((N, N)) < 0.05)
        W *= ban_kinh / np.max(np.abs(np.linalg.eigvals(W)))
        self.W, self.Win = W, ty_le_vao * rng.uniform(-1, 1, (N, 2))
        self.a, self.ridge, self.N = ro_ri, ridge, N
        self.Wout = None

    def buoc(self, h, u):
        return (1 - self.a) * h + self.a * np.tanh(self.W @ h + self.Win @ np.array([1.0, u]))

    def trang_thai(self, u, h=None):
        h = np.zeros(self.N) if h is None else h
        H = np.empty((len(u), self.N))
        for t, ut in enumerate(u):
            h = self.buoc(h, ut)
            H[t] = h
        return H, h

    @staticmethod
    def dac_trung(H, u):
        return np.hstack([np.ones((len(H), 1)), u[:, None], H])

    def huan_luyen(self, u, dich, bo_dau=200):
        H, _ = self.trang_thai(u)
        F = self.dac_trung(H, u)[bo_dau:]
        Y = dich[bo_dau:]
        self.Wout = np.linalg.solve(F.T @ F + self.ridge * np.eye(F.shape[1]), F.T @ Y)

    def du_bao_tu_do_nhieu(self, U_khoi_dong, so_buoc):
        """Chạy song song nhiều điểm xuất phát: khởi động bằng dữ liệu thật rồi tự nuôi bằng dự báo."""
        h = np.zeros((len(U_khoi_dong), self.N))
        for u in U_khoi_dong.T:
            h = (1 - self.a) * h + self.a * np.tanh(h @ self.W.T + self.Win[:, 0] + np.outer(u, self.Win[:, 1]))
        y = self.Wout[0] + U_khoi_dong[:, -1] * self.Wout[1] + h @ self.Wout[2:]
        ra = []
        for _ in range(so_buoc):
            ra.append(y)
            h = (1 - self.a) * h + self.a * np.tanh(h @ self.W.T + self.Win[:, 0] + np.outer(y, self.Win[:, 1]))
            y = self.Wout[0] + y * self.Wout[1] + h @ self.Wout[2:]
        return np.stack(ra, 1)

    @property
    def so_tham_so_hoc(self):
        return self.N + 2


# ---------------------------------------------------------------- LSTM (JAX)
def lstm_khoi_tao(key, H):
    k1, k2 = jax.random.split(key)
    W = jax.random.normal(k1, (1 + H, 4 * H)) / jnp.sqrt(1 + H)
    b = jnp.zeros(4 * H).at[H:2 * H].set(1.0)  # thiên lệch cổng quên = 1
    Wo = jax.random.normal(k2, (H, 1)) / jnp.sqrt(H)
    return {"W": W, "b": b, "Wo": Wo, "bo": jnp.zeros(1)}


def lstm_o(p, carry, x):
    h, c = carry
    z = jnp.concatenate([x[None], h]) @ p["W"] + p["b"]
    i, f, g, o = jnp.split(z, 4)
    c = jax.nn.sigmoid(f) * c + jax.nn.sigmoid(i) * jnp.tanh(g)
    h = jax.nn.sigmoid(o) * jnp.tanh(c)
    return (h, c), (h @ p["Wo"] + p["bo"])[0]


def lstm_chay(p, xs):
    H = p["Wo"].shape[0]
    _, ys = jax.lax.scan(lambda cr, x: lstm_o(p, cr, x), (jnp.zeros(H), jnp.zeros(H)), xs)
    return ys


def lstm_tu_do(p, xs_khoi_dong, so_buoc):
    H = p["Wo"].shape[0]
    cr, ys = jax.lax.scan(lambda cr, x: lstm_o(p, cr, x), (jnp.zeros(H), jnp.zeros(H)), xs_khoi_dong)

    def f(state, _):
        cr, y = state
        cr, y2 = lstm_o(p, cr, y)
        return (cr, y2), y

    _, ra = jax.lax.scan(f, (cr, ys[-1]), None, length=so_buoc)
    return ra


class LSTMDuBao:
    def __init__(self, H=64, lr=3e-3, so_lan_lap=3000, dai=200, lo=32, seed=0):
        self.p = lstm_khoi_tao(jax.random.PRNGKey(seed), H)
        self.lr, self.so_lan_lap, self.dai, self.lo = lr, so_lan_lap, dai, lo
        self.rng = np.random.default_rng(seed)
        self.opt = optax.adam(optax.cosine_decay_schedule(lr, so_lan_lap))
        self.st = self.opt.init(self.p)

        def mat_mat(p, X, Y):
            return jnp.mean((jax.vmap(lambda x: lstm_chay(p, x))(X)[:, 20:] - Y[:, 20:]) ** 2)

        @jax.jit
        def buoc(p, st, X, Y):
            l, g = jax.value_and_grad(mat_mat)(p, X, Y)
            g = optax.clip_by_global_norm(1.0).update(g, None)[0]
            u, st = self.opt.update(g, st, p)
            return optax.apply_updates(p, u), st, l

        self._buoc = buoc
        self._tu_do = jax.jit(jax.vmap(lstm_tu_do, in_axes=(None, 0, None)), static_argnums=2)
        self._chay = jax.jit(lstm_chay)

    def huan_luyen(self, u, dich):
        for _ in range(self.so_lan_lap):
            i = self.rng.integers(0, len(u) - self.dai, self.lo)
            X = np.stack([u[j:j + self.dai] for j in i])
            Y = np.stack([dich[j:j + self.dai] for j in i])
            self.p, self.st, _ = self._buoc(self.p, self.st, X, Y)

    def du_bao_tu_do_nhieu(self, U_khoi_dong, so_buoc):
        return np.asarray(self._tu_do(self.p, jnp.asarray(U_khoi_dong), so_buoc))

    @property
    def so_tham_so_hoc(self):
        return int(sum(v.size for v in self.p.values()))


# ---------------------------------------------------------------- MLP cửa sổ trễ
class MLPCuaSo:
    def __init__(self, cua_so=30, an=(128, 128), lr=1e-3, so_vong=200, seed=0):
        self.k = cua_so
        self.ts = khoi_tao_mlp(jax.random.PRNGKey(seed), [cua_so, *an, 1])
        self.opt = optax.adam(lr)
        self.st = self.opt.init(self.ts)
        self.so_vong, self.rng = so_vong, np.random.default_rng(seed)

        @jax.jit
        def buoc(ts, st, X, Y):
            g = jax.grad(lambda ts: jnp.mean((mlp(ts, X)[:, 0] - Y) ** 2))(ts)
            u, st = self.opt.update(g, st, ts)
            return optax.apply_updates(ts, u), st

        self._buoc = buoc

        def tu_do(ts, cs, n):
            def f(cs, _):
                y = mlp(ts, cs[None])[0, 0]
                return jnp.concatenate([cs[1:], y[None]]), y
            return jax.lax.scan(f, cs, None, length=n)[1]

        self._tu_do = jax.jit(jax.vmap(tu_do, in_axes=(None, 0, None)), static_argnums=2)

    def cua_so(self, u):
        return np.lib.stride_tricks.sliding_window_view(u, self.k)

    def huan_luyen(self, u, dich):
        X = self.cua_so(u)
        Y = dich[self.k - 1:]
        for _ in range(self.so_vong):
            p = self.rng.permutation(len(X))
            for i in range(0, len(X), 64):
                j = p[i:i + 64]
                self.ts, self.st = self._buoc(self.ts, self.st, X[j], Y[j])

    def du_bao_tu_do_nhieu(self, U_khoi_dong, so_buoc):
        return np.asarray(self._tu_do(self.ts, jnp.asarray(U_khoi_dong[:, -self.k:]), so_buoc))

    @property
    def so_tham_so_hoc(self):
        return so_tham_so(self.ts)


# ---------------------------------------------------------------- phần A: dự báo tự do
def danh_gia_tu_do(mh, x, diem_dau, khoi_dong=300, so_buoc=1500):
    U = np.stack([x[d - khoi_dong:d] for d in diem_dau])
    that = np.stack([x[d:d + so_buoc] for d in diem_dau])
    du = mh.du_bao_tu_do_nhieu(U, so_buoc)
    sai = np.abs(du - that)  # x đã chuẩn hoá về độ lệch chuẩn 1
    vuot = ~(sai <= NGUONG_SAI)  # NaN/inf (dự báo phân kỳ) cũng tính là sai
    tg = np.where(vuot.any(1), vuot.argmax(1), so_buoc)
    with np.errstate(all="ignore"):
        nrmse84 = float(np.sqrt(np.mean((du[:, MOC - 1] - that[:, MOC - 1]) ** 2)))
    nrmse84 = nrmse84 if np.isfinite(nrmse84) else float("inf")
    return float(np.mean(tg)), nrmse84, du, that


def tao_du_lieu_A(seed):
    x = mackey_glass(9500, lambda t: 17.0, seed=seed)[500:]
    tb, lc = x[:3000].mean(), x[:3000].std()
    return (x - tb) / lc


def phan_A(so_seed=5):
    # --- chọn siêu tham số trên đoạn kiểm định (dữ liệu seed 100, không dùng lại khi test)
    x = tao_du_lieu_A(100)
    u, d = x[:2999], x[1:3000]
    diem_kd = list(range(3300, 3900, 30))
    luoi_esn = list(itertools.product([0.8, 0.95, 1.1], [0.1, 0.5, 1.0], [0.3, 1.0], [1e-8, 1e-6, 1e-4]))
    diem = {}
    for bk, vao, rr, rg in luoi_esn:
        esn = ESN(ban_kinh=bk, ty_le_vao=vao, ro_ri=rr, ridge=rg, seed=100)
        esn.huan_luyen(u, d)
        diem[(bk, vao, rr, rg)] = danh_gia_tu_do(esn, x, diem_kd)[0]
    ch_esn = max(diem, key=diem.get)
    print("ESN chọn", ch_esn, diem[ch_esn])

    diem = {}
    for H, lr in itertools.product([64, 128], [1e-3, 3e-3]):
        m = LSTMDuBao(H=H, lr=lr, seed=100)
        m.huan_luyen(u, d)
        diem[(H, lr)] = danh_gia_tu_do(m, x, diem_kd)[0]
        print("  LSTM", (H, lr), diem[(H, lr)])
    ch_lstm = max(diem, key=diem.get)

    diem = {}
    for k in [20, 40]:
        m = MLPCuaSo(cua_so=k, seed=100)
        m.huan_luyen(u, d)
        diem[k] = danh_gia_tu_do(m, x, diem_kd)[0]
        print("  MLP", k, diem[k])
    ch_mlp = max(diem, key=diem.get)
    print("Chọn: ESN", ch_esn, "LSTM", ch_lstm, "MLP", ch_mlp)

    kq = {"ESN": [], "LSTM": [], "MLP cửa sổ": []}
    vi_du = None
    for s in range(so_seed):
        x = tao_du_lieu_A(s)
        u, d = x[:2999], x[1:3000]
        diem_test = list(range(5500, 7000, 50))
        cac_mh = {
            "ESN": ESN(ban_kinh=ch_esn[0], ty_le_vao=ch_esn[1], ro_ri=ch_esn[2], ridge=ch_esn[3], seed=s),
            "LSTM": LSTMDuBao(H=ch_lstm[0], lr=ch_lstm[1], seed=s),
            "MLP cửa sổ": MLPCuaSo(cua_so=ch_mlp, seed=s),
        }
        for ten, mh in cac_mh.items():
            with DongHo() as dh:
                mh.huan_luyen(u, d)
            tg, e84, du, that = danh_gia_tu_do(mh, x, diem_test)
            kq[ten].append({"tg_dung": tg, "nrmse84": e84, "giay": dh.giay, "tham_so": mh.so_tham_so_hoc})
            if s == 0:
                vi_du = vi_du or {}
                vi_du[ten] = du[0]
                vi_du["thật"] = that[0]
            print(f"A seed {s} {ten}: thời gian đúng={tg:.1f}  NRMSE@84={e84:.3f}  huấn luyện {dh.giay:.1f}s")
    tom = {}
    for ten, ds in kq.items():
        tom[ten] = {k: tb_lech([r[k] for r in ds]) for k in ("tg_dung", "nrmse84", "giay")}
        tom[ten]["tham_so_hoc"] = ds[0]["tham_so"]
    tom["_sieu_tham_so"] = {"ESN(ban_kinh,vao,ro_ri,ridge)": ch_esn, "LSTM(H,lr)": ch_lstm, "MLP cua_so": ch_mlp}
    return tom, vi_du


# ---------------------------------------------------------------- phần B: đổi chế độ, học trực tuyến
DOI_CHE_DO = 3000
NGANG = 10  # dự báo trực tiếp x(t+10)


def tao_du_lieu_B(seed):
    x = mackey_glass(7000, lambda t: 17.0 if t < (DOI_CHE_DO + 500) else 30.0, seed=seed)[500:]
    tb, lc = x[:2000].mean(), x[:2000].std()
    return (x - tb) / lc


class ESN_RLS:
    """ESN có lớp đọc ra cập nhật trực tuyến bằng RLS với hệ số quên lam."""

    def __init__(self, esn, lam=0.995, delta=1.0):
        self.e, self.lam = esn, lam
        n = esn.N + 2
        self.w = esn.Wout.copy()
        self.P = np.eye(n) / delta

    def cap_nhat(self, f, y):
        Pf = self.P @ f
        k = Pf / (self.lam + f @ Pf)
        self.w += k * (y - f @ self.w)
        self.P = (self.P - np.outer(k, Pf)) / self.lam


def trung_binh_truot(e, w):
    """Trung bình trượt NHÂN QUẢ: tại t chỉ dùng các giá trị t-w+1..t (không nhìn tương lai)."""
    c = np.cumsum(np.concatenate([[0.0], e]))
    t = np.arange(1, len(e) + 1)
    dau = np.maximum(t - w, 0)
    return (c[t] - c[dau]) / (t - dau)


def vi_du_A(ch, seed=0):
    """Tính lại ví dụ dự báo tự do (seed 0, điểm xuất phát đầu tiên của tập test) để vẽ hình."""
    x = tao_du_lieu_A(seed)
    u, d = x[:2999], x[1:3000]
    cac_mh = {
        "ESN": ESN(ban_kinh=ch["ESN(ban_kinh,vao,ro_ri,ridge)"][0], ty_le_vao=ch["ESN(ban_kinh,vao,ro_ri,ridge)"][1],
                   ro_ri=ch["ESN(ban_kinh,vao,ro_ri,ridge)"][2], ridge=ch["ESN(ban_kinh,vao,ro_ri,ridge)"][3],
                   seed=seed),
        "LSTM": LSTMDuBao(H=ch["LSTM(H,lr)"][0], lr=ch["LSTM(H,lr)"][1], seed=seed),
        "MLP cửa sổ": MLPCuaSo(cua_so=ch["MLP cua_so"], seed=seed),
    }
    vi_du = {}
    for ten, mh in cac_mh.items():
        mh.huan_luyen(u, d)
        _, _, du, that = danh_gia_tu_do(mh, x, [5500])
        vi_du[ten] = du[0]
        vi_du["thật"] = that[0]
    return vi_du


def phan_B(so_seed, ch):
    ch_esn, ch_lstm, ch_mlp = ch["ESN(ban_kinh,vao,ro_ri,ridge)"], ch["LSTM(H,lr)"], ch["MLP cua_so"]
    import time
    kq = {}
    duong = {}
    for s in range(so_seed):
        x = tao_du_lieu_B(s)
        n = len(x)
        u_tr, d_tr = x[:2000 - NGANG], x[NGANG:2000]
        # --- ESN: huấn luyện ngoại tuyến trên chế độ 1, rồi RLS trực tuyến
        esn = ESN(ban_kinh=ch_esn[0], ty_le_vao=ch_esn[1], ro_ri=ch_esn[2], ridge=ch_esn[3], seed=s)
        esn.huan_luyen(u_tr, d_tr)
        H, _ = esn.trang_thai(x)
        F = esn.dac_trung(H, x)
        du = {k: np.full(n, np.nan) for k in ["ESN + RLS (trực tuyến)", "ESN đóng băng",
                                               "LSTM + SGD trực tuyến", "LSTM đóng băng",
                                               "MLP + SGD trực tuyến"]}
        t0 = time.perf_counter()
        rls = ESN_RLS(esn)
        for t in range(2000, n - NGANG):
            du["ESN + RLS (trực tuyến)"][t + NGANG] = F[t] @ rls.w
            du["ESN đóng băng"][t + NGANG] = F[t] @ esn.Wout
            if t - NGANG >= 0:  # nhãn x(t) vừa đến -> cập nhật cho trạng thái t-NGANG
                rls.cap_nhat(F[t - NGANG], x[t])
        tg_esn = time.perf_counter() - t0

        # --- LSTM: huấn luyện ngoại tuyến rồi tinh chỉnh trực tuyến mỗi bước
        lstm = LSTMDuBao(H=ch_lstm[0], lr=ch_lstm[1], seed=s)
        lstm.huan_luyen(u_tr, d_tr)
        p0 = lstm.p
        chay = jax.jit(lstm_chay)
        du["LSTM đóng băng"][2000 + NGANG:] = np.asarray(chay(p0, jnp.asarray(x)))[2000:n - NGANG]
        opt = optax.adam(1e-3)
        L = 200

        @jax.jit
        def buoc_tt(p, st, xs, ys):
            def mm(p):
                return jnp.mean((lstm_chay(p, xs)[50:] - ys[50:]) ** 2)
            g = jax.grad(mm)(p)
            g = optax.clip_by_global_norm(1.0).update(g, None)[0]
            upd, st = opt.update(g, st, p)
            return optax.apply_updates(p, upd), st

        @jax.jit
        def du_doan_cuoi(p, xs):
            return lstm_chay(p, xs)[-1]

        p, st = p0, opt.init(p0)
        t0 = time.perf_counter()
        for t in range(2000, n - NGANG):
            du["LSTM + SGD trực tuyến"][t + NGANG] = float(du_doan_cuoi(p, jnp.asarray(x[t - L + 1:t + 1])))
            # cặp (đầu vào đến t-NGANG, đích đến t) vừa đủ nhãn
            p, st = buoc_tt(p, st, jnp.asarray(x[t - NGANG - L + 1:t - NGANG + 1]), jnp.asarray(x[t - L + 1:t + 1]))
        tg_lstm = time.perf_counter() - t0

        # --- MLP cửa sổ + SGD trực tuyến
        m = MLPCuaSo(cua_so=ch_mlp, seed=s)
        m.huan_luyen(u_tr, d_tr)
        opt_m = optax.adam(1e-3)
        st_m = opt_m.init(m.ts)
        ts = m.ts

        @jax.jit
        def buoc_m(ts, st, X, Y):
            g = jax.grad(lambda ts: jnp.mean((mlp(ts, X)[:, 0] - Y) ** 2))(ts)
            upd, st = opt_m.update(g, st, ts)
            return optax.apply_updates(ts, upd), st

        du_m = jax.jit(lambda ts, X: mlp(ts, X)[:, 0])
        k = ch_mlp
        t0 = time.perf_counter()
        for t in range(2000, n - NGANG):
            du["MLP + SGD trực tuyến"][t + NGANG] = float(du_m(ts, jnp.asarray(x[None, t - k + 1:t + 1]))[0])
            j = np.arange(t - NGANG - 31, t - NGANG + 1)  # 32 cặp gần nhất đã có nhãn
            X = np.stack([x[i - k + 1:i + 1] for i in j])
            ts, st_m = buoc_m(ts, st_m, jnp.asarray(X), jnp.asarray(x[j + NGANG]))
        tg_mlp = time.perf_counter() - t0

        sai = {kk: (v - x) ** 2 for kk, v in du.items()}
        for kk, e in sai.items():
            truoc = np.sqrt(np.nanmean(e[2500:DOI_CHE_DO]))
            ngay_sau = np.sqrt(np.nanmean(e[DOI_CHE_DO:DOI_CHE_DO + 500]))
            ve_sau = np.sqrt(np.nanmean(e[DOI_CHE_DO + 1500:n]))
            kq.setdefault(kk, []).append((truoc, ngay_sau, ve_sau))
            cuon = np.sqrt(trung_binh_truot(np.nan_to_num(e[2000:]), 100))
            duong.setdefault(kk, []).append(cuon)
        kq.setdefault("_giay_xu_ly_truc_tuyen", []).append({"ESN+RLS": tg_esn, "LSTM+SGD": tg_lstm, "MLP+SGD": tg_mlp})
        print(f"B seed {s}: " + " | ".join(f"{kk}: {np.round(v[-1], 3).tolist()}" for kk, v in kq.items()
                                            if not kk.startswith("_")))
    tom = {}
    for kk, v in kq.items():
        if kk.startswith("_"):
            tom[kk] = {m: tb_lech([r[m] for r in v]) for m in v[0]}
            continue
        v = np.array(v)
        tom[kk] = {"nrmse_truoc_doi": tb_lech(v[:, 0]), "nrmse_500_buoc_sau_doi": tb_lech(v[:, 1]),
                   "nrmse_giai_doan_cuoi": tb_lech(v[:, 2])}
    return tom, {kk: np.mean(v, 0) for kk, v in duong.items()}


def ve_hinh(tho):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(2, 1, figsize=(8, 7))
    mau = {"thật": "#222222", "ESN": "#00798c", "LSTM": "#d1495b", "MLP cửa sổ": "#edae49"}
    for k in ["thật", "MLP cửa sổ", "LSTM", "ESN"]:
        v = np.asarray(tho["vi_du_A"][k])
        ax[0].plot(v[:800], color=mau[k], lw=2.6 if k == "thật" else 1.4, ls="-" if k == "thật" else "--",
                   label=k if k != "ESN" else "ESN (gần như trùng đường thật)")
    ax[0].axvline(MOC, color="#999", lw=0.8)
    ax[0].set_title("TN2A · Dự báo tự do Mackey-Glass (mô hình tự nuôi bằng dự báo của chính nó)")
    ax[0].set_xlabel("bước dự báo")
    ax[0].legend(fontsize=8, ncol=4, loc="lower left")
    mau2 = {"ESN + RLS (trực tuyến)": "#00798c", "ESN đóng băng": "#8fc9cf", "LSTM + SGD trực tuyến": "#d1495b",
            "LSTM đóng băng": "#eaa0ab", "MLP + SGD trực tuyến": "#edae49"}
    for k, v in tho["duong_B"].items():
        ax[1].plot(np.arange(2000, 2000 + len(v)), v, color=mau2[k], lw=1.5, label=k)
    ax[1].axvline(DOI_CHE_DO, color="#555", ls=":", lw=1)
    ax[1].text(DOI_CHE_DO + 20, 3, "tau 17 → 30", fontsize=8)
    ax[1].set_yscale("log")
    ax[1].set_title("TN2B · Sai số dự báo x(t+10) khi hệ đổi chế độ (TB trượt 100 bước về trước, 5 seed)")
    ax[1].set_xlabel("thời gian")
    ax[1].set_ylabel("RMSE chuẩn hoá")
    ax[1].legend(fontsize=8, ncol=2, loc="lower right")
    fig.tight_layout()
    fig.savefig(duong_dan("tn2_chuoi_hon_loan.png"), dpi=130)


def main(so_seed=5, chi_phan_B=False):
    """chi_phan_B=True: giữ kết quả phần A đã có trong ketqua/, chỉ chạy lại phần B."""
    import json
    if chi_phan_B:
        with open(duong_dan("tn2_chuoi_hon_loan.json"), encoding="utf-8") as f:
            tomA = json.load(f)["A_du_bao_tu_do"]
        vi_du = vi_du_A(tomA["_sieu_tham_so"])
    else:
        tomA, vi_du = phan_A(so_seed)
    tomB, duong = phan_B(so_seed, tomA["_sieu_tham_so"])
    luu_json("tn2_chuoi_hon_loan.json", {"A_du_bao_tu_do": tomA, "B_doi_che_do": tomB})
    tho = {"vi_du_A": {k: np.asarray(v).tolist() for k, v in vi_du.items()},
           "duong_B": {k: np.asarray(v).tolist() for k, v in duong.items()}}
    luu_json("tn2_du_lieu_tho.json", tho)
    ve_hinh(tho)
    return tomA, tomB


if __name__ == "__main__":
    import pprint
    import sys
    pprint.pprint(main(chi_phan_B="--chi-phan-B" in sys.argv))
