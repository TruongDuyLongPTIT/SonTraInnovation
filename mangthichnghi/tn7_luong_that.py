"""Thí nghiệm 7 - HCN vs MLP trên 3 luồng dữ liệu thật (chuẩn của ngành học trực tuyến).

  Điện (Elec2)   45.312 mẫu: giá điện NSW (Úc) 1996–98 sẽ tăng hay giảm so với trung bình 24 giờ.
  Covertype      100.000 mẫu đầu: loại rừng trên từng ô đất 30x30 m ở Colorado (7 loại).
  Thời tiết      18.159 ngày: ngày mai ở Bellevue (Mỹ) có mưa không.

Giao thức "đoán trước, học sau" (prequential): với mỗi mẫu theo đúng thứ tự thời gian, mô hình đoán,
rồi mới được biết đáp án và học. Đặc trưng được chuẩn hoá trực tuyến (chỉ dùng thống kê quá khứ).
Siêu tham số chọn trên 5.000 mẫu đầu; điểm báo cáo là trên toàn bộ luồng.

Mốc tham chiếu:
  - "Đoán giống nhãn trước": không học gì, chỉ nói lại đáp án vừa rồi.
  - kNN cửa sổ trượt: nhớ 1.000 mẫu gần nhất, bỏ phiếu 5 láng giềng. Mô hình "nhớ mẫu" thuần tuý.
  - ARF (Adaptive Random Forest, thư viện river): mô hình mạnh nhất hiện nay cho học trên luồng dữ liệu.
"""
import time

import numpy as np

from chung import BoPhanLoaiMLP, duong_dan, luu_json, tb_lech
from du_lieu_that import luong
from hcn import HCN

LUONG = {"elec": ("Điện (Elec2)", None), "covtype": ("Covertype", 100_000), "weather": ("Thời tiết", None)}
SO_SEED = 3
TIEN_TO = 5000


def chuan_hoa_nhan_qua(X):
    """z_t = (x_t - trung bình của x_0..x_{t-1}) / độ lệch chuẩn của x_0..x_{t-1}."""
    c1 = np.cumsum(X, 0, dtype=np.float64)
    c2 = np.cumsum(X.astype(np.float64) ** 2, 0)
    n = np.arange(1, len(X) + 1)[:, None]
    tb = np.vstack([np.zeros((1, X.shape[1])), (c1 / n)[:-1]])
    ps = np.vstack([np.ones((1, X.shape[1])), (c2 / n - (c1 / n) ** 2)[:-1]])
    return ((X - tb) / np.sqrt(np.maximum(ps, 1e-6))).clip(-10, 10).astype(np.float32)


class GiongTruoc:
    def __init__(self, *a, **k):
        self.cu = 0

    def du_doan(self, x):
        return self.cu

    def hoc(self, x, y, du):
        self.cu = y


class KNNCuaSo:
    def __init__(self, d, cua_so=1000, k=5, **_):
        self.X, self.y = np.zeros((cua_so, d), np.float32), np.zeros(cua_so, int)
        self.n, self.w, self.k = 0, cua_so, k

    def du_doan(self, x):
        m = min(self.n, self.w)
        if m == 0:
            return 0
        d = ((self.X[:m] - x) ** 2).sum(1)
        g = np.argpartition(d, min(self.k, m) - 1)[:self.k]
        return int(np.bincount(self.y[:m][g]).argmax())

    def hoc(self, x, y, du):
        self.X[self.n % self.w], self.y[self.n % self.w] = x, y
        self.n += 1


class MLPTrucTuyen:
    def __init__(self, d, so_lop, seed=0, lr=1e-3, **_):
        self.m = BoPhanLoaiMLP(d, so_lop, an=(128, 128), lr=lr, seed=seed)
        self.X, self.y = np.zeros((500, d), np.float32), np.zeros(500, int)
        self.n, self.rng = 0, np.random.default_rng(seed)

    def du_doan(self, x):
        return int(self.m.du_doan(x[None])[0])

    def hoc(self, x, y, du):
        self.X[self.n % 500], self.y[self.n % 500] = x, y
        self.n += 1
        j = self.rng.integers(0, min(self.n, 500), 32)
        self.m.ts, self.m.trang_thai = self.m._buoc(self.m.ts, self.m.trang_thai, self.X[j], self.y[j])


class ARF:
    def __init__(self, d, so_lop, seed=0, **_):
        from river import forest
        self.m = forest.ARFClassifier(n_models=10, seed=seed)

    def du_doan(self, x):
        self._x = {i: float(v) for i, v in enumerate(x)}
        p = self.m.predict_one(self._x)
        return -1 if p is None else int(p)

    def hoc(self, x, y, du):
        self.m.learn_one(self._x, int(y))


def tao(ten, d, so_lop, seed, ts):
    if ten == "Đoán giống nhãn trước":
        return GiongTruoc()
    if ten == "kNN cửa sổ (nhớ 1.000 mẫu)":
        return KNNCuaSo(d)
    if ten == "ARF (river)":
        return ARF(d, so_lop, seed)
    if ten == "MLP trực tuyến (backprop)":
        return MLPTrucTuyen(d, so_lop, seed, lr=ts["mlp_lr"])
    return HCN(d, seed=seed, ho_chua=ts["hcn_ho_chua"], rho=ts["hcn_rho"], ngan_sach=5000,
               noi_moi=(ten == "HCN (đầy đủ)"))


def chay_co_dem(ma, ten, s, md, X, y):
    """Mô hình đối chứng (không phải HCN) được lưu đệm để chạy lại nhanh khi chỉ sửa HCN."""
    import os
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dulieu", f"dem_tn7_{ma}_{ten}_{s}.npy")
    if not ten.startswith("HCN") and os.path.exists(p):
        return np.load(p), None
    t0 = time.perf_counter()
    d = chay(md, X, y)
    g = time.perf_counter() - t0
    if not ten.startswith("HCN"):
        np.save(p, d)
        np.save(p.replace(".npy", "_giay.npy"), g)
    return d, g


def chay(md, X, y):
    dung = np.zeros(len(y))
    for t in range(len(y)):
        du = md.du_doan(X[t])
        dung[t] = du == y[t]
        md.hoc(X[t], y[t], du)
    return dung


def chon_sieu_tham_so(X, y, so_lop):
    Xp, yp = X[:TIEN_TO], y[:TIEN_TO]
    d = X.shape[1]
    lr = {lr: chay(MLPTrucTuyen(d, so_lop, 100, lr=lr), Xp, yp).mean() for lr in (1e-3, 3e-3, 1e-2)}
    h = {(hc, rho): chay(HCN(d, seed=100, ho_chua=hc, rho=rho, ngan_sach=5000), Xp, yp).mean()
         for hc in (False, True) for rho in (0.8, 0.9, 0.95, 0.98)}
    tot_h = max(h, key=h.get)
    return {"mlp_lr": max(lr, key=lr.get), "hcn_ho_chua": tot_h[0], "hcn_rho": tot_h[1]}, \
        {"mlp": {str(k): float(v) for k, v in lr.items()}, "hcn": {str(k): float(v) for k, v in h.items()}}


TEN_MH = ["Đoán giống nhãn trước", "kNN cửa sổ (nhớ 1.000 mẫu)", "ARF (river)",
          "MLP trực tuyến (backprop)", "HCN bỏ nội môi", "HCN (đầy đủ)"]


def main():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    tom = {}
    fig, axs = plt.subplots(3, 1, figsize=(11, 10))
    mau = {"Đoán giống nhãn trước": "#bbbbbb", "kNN cửa sổ (nhớ 1.000 mẫu)": "#9bc59d", "ARF (river)": "#6a4c93",
           "MLP trực tuyến (backprop)": "#d1495b", "HCN bỏ nội môi": "#b8a9c9", "HCN (đầy đủ)": "#00798c"}
    for ax, (ma, (ten_luong, gioi_han)) in zip(axs, LUONG.items()):
        X, y = luong(ma)
        if gioi_han:
            X, y = X[:gioi_han], y[:gioi_han]
        X = chuan_hoa_nhan_qua(X)
        so_lop = int(y.max()) + 1
        ts, bang = chon_sieu_tham_so(X, y, so_lop)
        print(ten_luong, ts, flush=True)
        kq = {}
        for ten in TEN_MH:
            ds, gi = [], []
            for s in range(1 if ten in ("Đoán giống nhãn trước", "kNN cửa sổ (nhớ 1.000 mẫu)") else SO_SEED):
                md = tao(ten, X.shape[1], so_lop, s, ts)
                d, g = chay_co_dem(ma, ten, s, md, X, y)
                if g is None:
                    import os
                    g = float(np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), "dulieu",
                                                   f"dem_tn7_{ma}_{ten}_{s}_giay.npy")))
                ds.append(d)
                gi.append(g)
                extra = f", {md.so_nut} nút, {len(md.cac_ngu_canh)} ngữ cảnh" if isinstance(md, HCN) else ""
                print(f"  {ten} seed {s}: {ds[-1].mean():.4f} ({gi[-1]:.0f}s{extra})", flush=True)
            D = np.array(ds)
            kq[ten] = {"acc": tb_lech(D.mean(1)), "giay": tb_lech(gi)}
            w = max(len(y) // 200, 50)
            c = np.cumsum(np.concatenate([[0], D.mean(0)]))
            ax.plot(np.arange(w, len(y) + 1), (c[w:] - c[:-w]) / w, color=mau[ten],
                    lw=2.2 if ten == "HCN (đầy đủ)" else 1.1, label=f"{ten}: {D.mean():.1%}")
        tom[ten_luong] = {"so_mau": len(y), "sieu_tham_so": ts, "bang_chon": bang, "ket_qua": kq}
        ax.set_title(f"{ten_luong} · {len(y):,} mẫu theo thứ tự thời gian".replace(",", "."), fontsize=10)
        ax.set_ylabel("tỉ lệ đoán đúng")
        ax.grid(alpha=0.3)
        ax.legend(fontsize=7.5, loc="lower right", ncol=2)
    axs[-1].set_xlabel("số mẫu đã thấy (đường = TB trượt về trước)")
    fig.suptitle("TN7 · Luồng dữ liệu thật: đoán trước, được biết đáp án rồi mới học")
    fig.tight_layout()
    fig.savefig(duong_dan("tn7_luong_that.png"), dpi=130)
    luu_json("tn7_luong_that.json", tom)
    return tom


if __name__ == "__main__":
    import pprint
    pprint.pprint(main())
