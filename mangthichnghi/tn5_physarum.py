"""Thí nghiệm 5 - Ý tưởng mới: mạng dòng chảy Physarum có tín hiệu thưởng, dùng để phân loại.

Mô hình (luật thích nghi của nấm nhầy, Tero et al. 2010, thêm một yếu tố thưởng):
  - Mỗi điểm ảnh là một nút "bơm" dòng chảy: dòng = độ sáng (và 1 - độ sáng cho phần tối).
  - 10 nút "cống" nối đất, mỗi cống là một lớp. Dòng chảy ra cống nào nhiều nhất -> dự đoán.
  - Theo định luật Kirchhoff, mỗi nút bơm chia dòng của nó cho các ống theo tỉ lệ độ dẫn D.
  - Học (cục bộ, không gradient): dD/dt = eta * r_c * |Q| - lam * D
      r_c = +1 ở cống đúng, -1 ở cống bị đoán sai, 0 ở cống khác.
    Ống nào mang dòng tới cống đúng thì dày lên, tới cống sai thì mỏng đi, ống không dùng thì teo.

So sánh trên cùng bộ chữ số 8x8 với: MLP (backprop) và hồi quy logistic (mô hình tuyến tính,
cùng sức chứa với mạng dòng chảy này, học bằng gradient).
"""
import itertools

import numpy as np
from sklearn.datasets import load_digits
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

from chung import BoPhanLoaiMLP, duong_dan, luu_json, tb_lech

C = 10


def bom(X):
    return np.hstack([X, 1.0 - X])


class MangPhysarum:
    def __init__(self, eta=0.05, lam=1e-3, so_vong=10, seed=0):
        self.eta, self.lam, self.so_vong = eta, lam, so_vong
        self.rng = np.random.default_rng(seed)
        self.D = None

    def dong_chay(self, s):
        Q = s[:, None] * self.D / self.D.sum(1, keepdims=True)  # dòng qua từng ống
        return Q, Q.sum(0)                                        # dòng ra từng cống

    def huan_luyen(self, X, y):
        S = bom(X)
        if self.D is None:
            self.D = 1.0 + 0.01 * self.rng.random((S.shape[1], C))
        for _ in range(self.so_vong):
            for i in self.rng.permutation(len(S)):
                Q, ra = self.dong_chay(S[i])
                r = np.zeros(C)
                r[y[i]] = 1.0
                du = ra.argmax()
                if du != y[i]:
                    r[du] = -1.0
                self.D = np.maximum(self.D + self.eta * Q * r - self.lam * self.D, 1e-4)

    def du_doan(self, X):
        return (bom(X) @ (self.D / self.D.sum(1, keepdims=True))).argmax(1)

    @property
    def ti_le_ong_con_song(self):
        return float((self.D > 1e-3).mean())


def du_lieu(seed):
    X, y = load_digits(return_X_y=True)
    return train_test_split((X / 16.0).astype(np.float32), y, test_size=0.3, stratify=y, random_state=seed)


def chon_sieu_tham_so():
    Xtr, _, ytr, _ = du_lieu(100)
    Xa, Xv, ya, yv = train_test_split(Xtr, ytr, test_size=0.25, stratify=ytr, random_state=100)
    diem = {}
    for eta, lam in itertools.product([0.05, 0.2, 1.0], [0.0, 1e-4, 1e-3]):
        m = MangPhysarum(eta, lam, seed=100)
        m.huan_luyen(Xa, ya)
        diem[(eta, lam)] = float((m.du_doan(Xv) == yv).mean())
    return max(diem, key=diem.get), diem


def main(so_seed=5):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    (eta, lam), bang = chon_sieu_tham_so()
    print("Chọn eta, lam =", eta, lam)
    kq = {"Mạng Physarum có thưởng": [], "Hồi quy logistic (tuyến tính)": [], "MLP (backprop)": []}
    lien_tuc = {"Mạng Physarum có thưởng": [], "MLP tuần tự": []}
    ong = []
    for s in range(so_seed):
        Xtr, Xte, ytr, yte = du_lieu(s)
        m = MangPhysarum(eta, lam, seed=s)
        m.huan_luyen(Xtr, ytr)
        kq["Mạng Physarum có thưởng"].append(float((m.du_doan(Xte) == yte).mean()))
        ong.append(m.ti_le_ong_con_song)
        lr = LogisticRegression(max_iter=2000).fit(bom(Xtr), ytr)
        kq["Hồi quy logistic (tuyến tính)"].append(float((lr.predict(bom(Xte)) == yte).mean()))
        mlp = BoPhanLoaiMLP(64, 10, seed=s)
        mlp.huan_luyen(Xtr, ytr)
        kq["MLP (backprop)"].append(float((mlp.du_doan(Xte) == yte).mean()))

        # học liên tục: cùng giao thức với TN1
        thu_tu = np.random.default_rng(s).permutation(10).tolist()
        nv = [thu_tu[i:i + 2] for i in range(0, 10, 2)]
        p2, m2 = MangPhysarum(eta, lam, seed=s), BoPhanLoaiMLP(64, 10, seed=s)
        dc_p, dc_m, da = [], [], []
        for lop in nv:
            da += lop
            mk = np.isin(ytr, lop)
            p2.huan_luyen(Xtr[mk], ytr[mk])
            m2.huan_luyen(Xtr[mk], ytr[mk], 30)
            mt = np.isin(yte, da)
            dc_p.append(float((p2.du_doan(Xte[mt]) == yte[mt]).mean()))
            dc_m.append(float((m2.du_doan(Xte[mt]) == yte[mt]).mean()))
        lien_tuc["Mạng Physarum có thưởng"].append(dc_p)
        lien_tuc["MLP tuần tự"].append(dc_m)
        print(f"seed {s}: " + ", ".join(f"{k}={v[-1]:.3f}" for k, v in kq.items()) +
              f" | liên tục: Physarum={dc_p[-1]:.3f} MLP={dc_m[-1]:.3f}")

    tom = {"do_chinh_xac (học bình thường)": {k: tb_lech(v) for k, v in kq.items()},
           "hoc_lien_tuc_do_chinh_xac_cuoi": {k: tb_lech(np.array(v)[:, -1]) for k, v in lien_tuc.items()},
           "hoc_lien_tuc_duong_cong_tb": {k: np.mean(v, 0).tolist() for k, v in lien_tuc.items()},
           "ti_le_ong_con_song": tb_lech(ong),
           "sieu_tham_so": {"eta": eta, "lam": lam},
           "bang_chon": {str(k): v for k, v in bang.items()}}
    luu_json("tn5_physarum.json", tom)

    fig, axs = plt.subplots(1, 2, figsize=(10, 3.8))
    ten = list(kq)
    tb = [np.mean(kq[k]) for k in ten]
    sd = [np.std(kq[k]) for k in ten]
    axs[0].barh(ten, tb, xerr=sd, color=["#6a4c93", "#888888", "#d1495b"])
    for i, v in enumerate(tb):
        axs[0].text(0.805, i, f"{v:.3f}", va="center", ha="left", color="white", fontsize=9)
    axs[0].set_xlim(0.8, 1.0)
    axs[0].set_title("Học bình thường (dữ liệu trộn đều)")
    for k, mau in [("Mạng Physarum có thưởng", "#6a4c93"), ("MLP tuần tự", "#d1495b")]:
        v = np.array(lien_tuc[k])
        axs[1].plot(range(1, 6), v.mean(0), "o-", color=mau, label=k)
    axs[1].set_ylim(0, 1.02)
    axs[1].set_xticks(range(1, 6))
    axs[1].set_xlabel("số nhiệm vụ đã học")
    axs[1].set_title("Học liên tục (như TN1)")
    axs[1].legend(fontsize=8)
    axs[1].grid(alpha=0.3)
    fig.suptitle("TN5 · Mạng dòng chảy Physarum có thưởng trên chữ số 8x8 (5 seed)")
    fig.tight_layout()
    fig.savefig(duong_dan("tn5_physarum.png"), dpi=130)
    return tom


if __name__ == "__main__":
    import pprint
    pprint.pprint(main())
