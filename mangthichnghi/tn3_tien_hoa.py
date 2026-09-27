"""Thí nghiệm 3 - Tiến hoá (NEAT) vs học tăng cường bằng gradient (PPO) trên con lắc ngược.

Điểm mạnh được kiểm tra của tiến hoá:
  - Không cần đạo hàm: chỉ cần một con số "sống được bao lâu".
  - Tự tiến hoá cấu trúc mạng -> lời giải rất nhỏ.
  - Khi mất thông tin vận tốc (quan sát thiếu), NEAT tự tiến hoá kết nối hồi quy (trí nhớ)
    mà không cần lan truyền ngược qua thời gian.

Baseline mạng nơ-ron: PPO (thuật toán policy-gradient chuẩn hiện nay) với MLP 64-64.
Cùng ngân sách: 300.000 bước tương tác với môi trường cho mọi phương pháp.
"""
import os
import random
import tempfile
import time

import numpy as np

from chung import duong_dan, luu_json, tb_lech
from moi_truong import ConLac, chay_tap

NGAN_SACH = 300_000
DAT = 475  # coi là "giải xong" khi điểm kiểm tra trung bình >= 475/500
THU_MUC = os.path.dirname(os.path.abspath(__file__))


def kiem_tra(chinh_sach, an_van_toc, seed, so_tap=20, ton_thuong=None):
    mt = ConLac(seed=10_000 + seed, an_van_toc=an_van_toc, ton_thuong=ton_thuong)
    return float(np.mean([chay_tap(mt, chinh_sach) for _ in range(so_tap)]))


# ---------------------------------------------------------------- NEAT
def cau_hinh_neat(so_vao, truyen_thang, seed):
    import neat
    mau = open(os.path.join(THU_MUC, "neat_config.ini"), encoding="utf-8").read()
    noi_dung = mau.format(so_vao=so_vao, truyen_thang=str(truyen_thang))
    noi_dung = noi_dung.replace("no_fitness_termination = False", "no_fitness_termination = True")
    noi_dung = noi_dung.replace("[NEAT]\n", f"[NEAT]\nseed = {seed}\n")
    with tempfile.NamedTemporaryFile("w", suffix=".ini", delete=False) as f:
        f.write(noi_dung)
    cfg = neat.Config(neat.DefaultGenome, neat.DefaultReproduction, neat.DefaultSpeciesSet,
                      neat.DefaultStagnation, f.name)
    os.unlink(f.name)
    return cfg


class ChinhSachNEAT:
    def __init__(self, genome, cfg):
        import neat
        self.hoi_quy = not cfg.genome_config.feed_forward
        lop = neat.nn.RecurrentNetwork if self.hoi_quy else neat.nn.FeedForwardNetwork
        self.net = lop.create(genome, cfg)

    def dat_lai(self):
        if self.hoi_quy:
            self.net.reset()

    def __call__(self, o):
        return 1 if self.net.activate(o)[0] > 0 else 0


def kich_thuoc_neat(genome, cfg):
    ket_noi = [c for c in genome.connections.values() if c.enabled]
    so_an = len([k for k in genome.nodes if k >= cfg.genome_config.num_outputs])
    hoi_quy = sum(1 for c in ket_noi if c.key[0] >= 0 and c.key[0] == c.key[1]) + \
        sum(1 for c in ket_noi if c.key[0] >= 0 and c.key[1] >= 0 and c.key[0] != c.key[1])
    return {"nut_an": so_an, "ket_noi": len(ket_noi), "tham_so": len(ket_noi) + len(genome.nodes),
            "ket_noi_giua_nut_trong": hoi_quy}


def chay_neat(seed, an_van_toc, ngan_sach=NGAN_SACH):
    import neat
    random.seed(seed)
    np.random.seed(seed)
    so_vao = 2 if an_van_toc else 4
    cfg = cau_hinh_neat(so_vao, truyen_thang=not an_van_toc, seed=seed)
    pop = neat.Population(cfg)
    mt = ConLac(seed=seed, an_van_toc=an_van_toc)
    dem = [0]

    def danh_gia(genomes, cfg):
        for _, g in genomes:
            cs = ChinhSachNEAT(g, cfg)
            diem = [chay_tap(mt, cs) for _ in range(3)]
            dem[0] += int(sum(diem))
            g.fitness = float(np.mean(diem))

    duong, t0 = [], time.perf_counter()
    while dem[0] < ngan_sach:
        tot_nhat = pop.run(danh_gia, 1)
        duong.append((dem[0], kiem_tra(ChinhSachNEAT(tot_nhat, cfg), an_van_toc, seed)))
    giay = time.perf_counter() - t0
    cuoi = kiem_tra(ChinhSachNEAT(tot_nhat, cfg), an_van_toc, seed, so_tap=100)
    return {"duong": duong, "diem_cuoi": cuoi, "giay": giay, "kich_thuoc": kich_thuoc_neat(tot_nhat, cfg),
            "genome": tot_nhat, "cfg": cfg}


# ---------------------------------------------------------------- PPO
def chay_ppo(seed, an_van_toc, chong_khung=1, tra_ve_mo_hinh=False, mt=None, ngan_sach=NGAN_SACH,
             tham_so_dau=None, kiem_tra_moi=10_240, ghi_tap=False, ton_thuong_kt=None):
    import jax
    import jax.numpy as jnp
    import optax

    rng = np.random.default_rng(seed)
    mt = mt or ConLac(seed=seed, an_van_toc=an_van_toc)
    d = mt.so_quan_sat * chong_khung

    def khoi_tao(key, sizes, cuoi_nho):
        ts = []
        for i, (a, b) in enumerate(zip(sizes[:-1], sizes[1:])):
            key, k = jax.random.split(key)
            tl = (0.01 if cuoi_nho else 1.0) if i == len(sizes) - 2 else np.sqrt(2)
            ts.append((jax.nn.initializers.orthogonal(tl)(k, (a, b)), jnp.zeros(b)))
        return ts

    def mang(ts, x):
        for W, b in ts[:-1]:
            x = jnp.tanh(x @ W + b)
        W, b = ts[-1]
        return x @ W + b

    k1, k2 = jax.random.split(jax.random.PRNGKey(seed))
    p = tham_so_dau or {"pi": khoi_tao(k1, [d, 64, 64, 2], True), "v": khoi_tao(k2, [d, 64, 64, 1], False)}
    opt = optax.chain(optax.clip_by_global_norm(0.5), optax.adam(3e-4, eps=1e-5))
    st = opt.init(p)

    def mat_mat(p, O, A, logp_cu, adv, ret):
        logits = mang(p["pi"], O)
        logp_all = jax.nn.log_softmax(logits)
        logp = jnp.take_along_axis(logp_all, A[:, None], 1)[:, 0]
        ti_le = jnp.exp(logp - logp_cu)
        adv = (adv - adv.mean()) / (adv.std() + 1e-8)
        l_pi = -jnp.mean(jnp.minimum(ti_le * adv, jnp.clip(ti_le, 0.8, 1.2) * adv))
        l_v = jnp.mean((mang(p["v"], O)[:, 0] - ret) ** 2)
        entropy = -jnp.mean(jnp.sum(jnp.exp(logp_all) * logp_all, -1))
        return l_pi + 0.5 * l_v - 0.01 * entropy  # hệ số như cấu hình chuẩn CleanRL

    @jax.jit
    def cap_nhat(p, st, O, A, L, AD, R):
        g = jax.grad(mat_mat)(p, O, A, L, AD, R)
        u, st = opt.update(g, st, p)
        return optax.apply_updates(p, u), st

    def sang_np(p):
        return {k: [(np.asarray(W), np.asarray(b)) for W, b in v] for k, v in p.items()}

    def np_mang(ts, x):
        for W, b in ts[:-1]:
            x = np.tanh(x @ W + b)
        W, b = ts[-1]
        return x @ W + b

    class ChinhSach:
        """Chính sách tham lam dùng để kiểm tra (có chồng khung nếu cần)."""

        def __init__(self, pn):
            self.pn = pn

        def dat_lai(self):
            self.dem = None

        def __call__(self, o):
            self.dem = np.tile(o, chong_khung) if self.dem is None else np.concatenate([o, self.dem[:-len(o)]])
            return int(np.argmax(np_mang(self.pn["pi"], self.dem)))

    N, gamma, lam = 2048, 0.99, 0.95
    pn = sang_np(p)
    o = mt.dat_lai()
    khung = np.tile(o, chong_khung)
    dem, duong, cac_tap, diem_tap = 0, [], [], 0.0
    t0 = time.perf_counter()
    moc_kt = kiem_tra_moi
    while dem < ngan_sach:
        O = np.empty((N, d)); A = np.empty(N, int); Lp = np.empty(N); R = np.empty(N)
        V = np.empty(N); Vsau = np.empty(N); Ket = np.empty(N, bool)
        for i in range(N):
            logits = np_mang(pn["pi"], khung)
            pr = np.exp(logits - logits.max()); pr /= pr.sum()
            a = int(rng.random() < pr[1])
            O[i], A[i], Lp[i], V[i] = khung, a, np.log(pr[a]), np_mang(pn["v"], khung)[0]
            o, r, nga, het = mt.buoc(a)
            khung_sau = np.concatenate([o, khung[:-len(o)]]) if chong_khung > 1 else o
            R[i] = r
            Vsau[i] = 0.0 if nga else np_mang(pn["v"], khung_sau)[0]
            Ket[i] = nga or het
            diem_tap += r
            khung = khung_sau
            if nga or het:
                cac_tap.append(diem_tap)
                diem_tap = 0.0
                o = mt.dat_lai()
                khung = np.tile(o, chong_khung)
        dem += N
        # GAE (cắt đúng chỗ hết giờ: vẫn bootstrap bằng giá trị trạng thái sau)
        adv = np.zeros(N); g = 0.0
        for i in reversed(range(N)):
            delta = R[i] + gamma * Vsau[i] - V[i]
            g = delta + gamma * lam * (0.0 if Ket[i] else g)
            adv[i] = g
        ret = adv + V
        for _ in range(10):
            idx = rng.permutation(N)
            for j in range(0, N, 64):
                b = idx[j:j + 64]
                p, st = cap_nhat(p, st, O[b], A[b], Lp[b], adv[b], ret[b])
        pn = sang_np(p)
        if dem >= moc_kt:
            duong.append((dem, kiem_tra(ChinhSach(pn), an_van_toc, seed, ton_thuong=ton_thuong_kt)))
            moc_kt += kiem_tra_moi
    giay = time.perf_counter() - t0
    kq = {"duong": duong, "giay": giay,
          "kich_thuoc": {"tham_so": int(sum(W.size + b.size for W, b in pn["pi"]) +
                                        sum(W.size + b.size for W, b in pn["v"]))}}
    kq["diem_cuoi"] = kiem_tra(ChinhSach(pn), an_van_toc, seed, so_tap=100, ton_thuong=ton_thuong_kt)
    if ghi_tap:
        kq["cac_tap"] = cac_tap
    if tra_ve_mo_hinh:
        kq["p"], kq["ChinhSach"] = p, ChinhSach(pn)
    return kq


# ---------------------------------------------------------------- chạy
CAU_HINH = [
    ("đầy đủ", "NEAT (truyền thẳng)", dict(loai="neat", an_van_toc=False)),
    ("đầy đủ", "PPO + MLP", dict(loai="ppo", an_van_toc=False, chong_khung=1)),
    ("ẩn vận tốc", "NEAT (hồi quy)", dict(loai="neat", an_van_toc=True)),
    ("ẩn vận tốc", "PPO + MLP", dict(loai="ppo", an_van_toc=True, chong_khung=1)),
    ("ẩn vận tốc", "PPO + MLP + chồng 2 khung", dict(loai="ppo", an_van_toc=True, chong_khung=2)),
]


def mot_viec(tham):
    bien_the, ten, cfg, seed = tham
    cfg = dict(cfg)
    loai = cfg.pop("loai")
    if loai == "neat":
        kq = chay_neat(seed, cfg["an_van_toc"])
        kq.pop("genome"); kq.pop("cfg")
    else:
        kq = chay_ppo(seed, cfg["an_van_toc"], cfg["chong_khung"])
    print(f"{bien_the} | {ten} | seed {seed}: điểm cuối {kq['diem_cuoi']:.1f}, {kq['giay']:.0f}s, {kq['kich_thuoc']}",
          flush=True)
    return bien_the, ten, seed, kq


def buoc_dat(duong):
    for buoc, diem in duong:
        if diem >= DAT:
            return buoc
    return None


def main(so_seed=5, so_tien_trinh=3):
    import multiprocessing as mp
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    viec = [(b, t, c, s) for b, t, c in CAU_HINH for s in range(so_seed)]
    with mp.get_context("spawn").Pool(so_tien_trinh) as pool:
        ket_qua = pool.map(mot_viec, viec)

    gom = {}
    for b, t, s, kq in ket_qua:
        gom.setdefault((b, t), []).append(kq)
    tom = {}
    fig, axs = plt.subplots(1, 2, figsize=(11, 4), sharey=True)
    mau = {"NEAT (truyền thẳng)": "#00798c", "NEAT (hồi quy)": "#00798c", "PPO + MLP": "#d1495b",
           "PPO + MLP + chồng 2 khung": "#edae49"}
    luoi = np.linspace(0, NGAN_SACH, 61)
    for (b, t), ds in gom.items():
        cac_buoc = [buoc_dat(k["duong"]) for k in ds]
        so_dat = sum(x is not None for x in cac_buoc)
        tom[f"{b} | {t}"] = {
            "diem_cuoi_100_tap": tb_lech([k["diem_cuoi"] for k in ds]),
            "so_seed_dat_475": f"{so_dat}/{len(ds)}",
            "buoc_den_khi_dat (seed đạt)": tb_lech([x for x in cac_buoc if x is not None]) if so_dat else None,
            "tham_so": tb_lech([k["kich_thuoc"]["tham_so"] for k in ds]),
            "kich_thuoc_chi_tiet": [k["kich_thuoc"] for k in ds],
            "giay": tb_lech([k["giay"] for k in ds]),
        }
        # đường cong: nội suy bậc thang điểm kiểm tra theo số bước
        Y = []
        for k in ds:
            xs = np.array([0] + [x for x, _ in k["duong"]])
            ys = np.array([9.0] + [y for _, y in k["duong"]])
            Y.append(ys[np.searchsorted(xs, luoi, side="right") - 1])
        Y = np.array(Y)
        ax = axs[0 if b == "đầy đủ" else 1]
        ax.plot(luoi / 1000, Y.mean(0), color=mau[t], lw=2, label=t)
        ax.fill_between(luoi / 1000, Y.min(0), Y.max(0), color=mau[t], alpha=0.12)
    for ax, tieu_de in zip(axs, ["Quan sát đầy đủ (x, ẋ, θ, θ̇)", "Ẩn vận tốc (chỉ thấy x, θ)"]):
        ax.set_title(tieu_de)
        ax.set_xlabel("nghìn bước tương tác với môi trường")
        ax.axhline(DAT, color="#999", ls=":", lw=1)
        ax.grid(alpha=0.3)
        ax.legend(fontsize=8, loc="lower right")
    axs[0].set_ylabel("điểm kiểm tra (tối đa 500)")
    fig.suptitle("TN3 · NEAT vs PPO trên con lắc ngược (trung bình 5 seed, vùng mờ = min–max)")
    fig.tight_layout()
    fig.savefig(duong_dan("tn3_tien_hoa.png"), dpi=130)
    # Phụ: NEAT ẩn vận tốc có đạt được không nếu cho ngân sách lớn hơn (1 triệu bước)?
    phu = pool_phu(so_seed, so_tien_trinh)
    tom["ẩn vận tốc | NEAT (hồi quy), ngân sách 1 triệu bước (phụ)"] = {
        "diem_cuoi_100_tap": tb_lech([k["diem_cuoi"] for k in phu]),
        "so_seed_dat_475": f"{sum(buoc_dat(k['duong']) is not None for k in phu)}/{len(phu)}",
        "buoc_den_khi_dat (seed đạt)": tb_lech([buoc_dat(k["duong"]) for k in phu if buoc_dat(k["duong"])])
        if any(buoc_dat(k["duong"]) for k in phu) else None,
        "tham_so": tb_lech([k["kich_thuoc"]["tham_so"] for k in phu]),
        "kich_thuoc_chi_tiet": [k["kich_thuoc"] for k in phu],
        "giay": tb_lech([k["giay"] for k in phu]),
    }
    luu_json("tn3_tien_hoa.json", tom)
    return tom


def neat_1trieu(seed):
    kq = chay_neat(seed, True, ngan_sach=1_000_000)
    kq.pop("genome"); kq.pop("cfg")
    print(f"phụ | NEAT hồi quy 1 triệu bước | seed {seed}: điểm cuối {kq['diem_cuoi']:.1f}, {kq['kich_thuoc']}",
          flush=True)
    return kq


def pool_phu(so_seed, so_tien_trinh):
    import multiprocessing as mp
    with mp.get_context("spawn").Pool(so_tien_trinh) as pool:
        return pool.map(neat_1trieu, range(so_seed))


if __name__ == "__main__":
    import pprint
    pprint.pprint(main())
