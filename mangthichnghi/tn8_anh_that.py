"""Thí nghiệm 8 - HCN vs MLP trên ảnh thật: MNIST (chữ số viết tay) và Fashion-MNIST (ảnh quần áo).

Mỗi bộ: 60.000 ảnh huấn luyện, 10.000 ảnh kiểm tra, 28x28 điểm ảnh, 10 lớp.
Ba bài:
  A. Học bình thường: dữ liệu trộn đều, MLP được học 10 lượt (sân nhà của mạng nơ-ron).
     HCN chỉ được xem mỗi ảnh MỘT lần.
  B. Học liên tục: 5 đợt × 2 lớp, không được xem lại đợt cũ (như TN1, nhưng lớn gấp ~50 lần).
  C. Dòng dữ liệu thay đổi (như TN6): 5 pha × 6.000 ảnh; đoán trước, rồi mới được biết đáp án.
Với ảnh, HCN dùng thẳng điểm ảnh (tắt hồ chứa): TN6 cho thấy hồ chứa không giúp gì ở ảnh tĩnh.
"""
import numpy as np

from chung import BoPhanLoaiMLP, DongHo, duong_dan, luu_json, tb_lech
from du_lieu_that import anh
from hcn import HCN

SO_SEED = 3
AN = (256, 256)
PHA = 6000
TEN_PHA = ["1. Lớp 0–4", "2. Lớp 5–9", "3. Ảnh đảo màu", "4. Nhãn lệch 3", "5. Trở lại bình thường"]


def tao_hcn(seed, rho, noi_moi=True):
    return HCN(784, seed=seed, ho_chua=False, rho=rho, ngan_sach=20000, noi_moi=noi_moi)


def chon_rho(Xtr, ytr):
    rng = np.random.default_rng(100)
    p = rng.permutation(len(Xtr))
    a, v = p[:20000], p[50000:55000]
    diem = {}
    for rho in (0.8, 0.9, 0.95):
        m = tao_hcn(100, rho, noi_moi=False)
        m.huan_luyen(Xtr[a], ytr[a])
        diem[rho] = float((m.du_doan_lo(Xtr[v]) == ytr[v]).mean())
    return max(diem, key=diem.get), diem


def bai_A(Xtr, ytr, Xte, yte, seed, rho):
    kq = {}
    rng = np.random.default_rng(seed)
    p = rng.permutation(len(Xtr))
    mlp = BoPhanLoaiMLP(784, 10, an=AN, seed=seed)
    with DongHo() as dh:
        mlp.huan_luyen(Xtr, ytr, so_vong=10, lo=128)
    kq["MLP (10 lượt)"] = {"acc": float((mlp.du_doan(Xte) == yte).mean()), "giay": dh.giay, "tham_so": mlp.so_tham_so}
    mlp1 = BoPhanLoaiMLP(784, 10, an=AN, seed=seed)
    with DongHo() as dh:
        mlp1.huan_luyen(Xtr[p], ytr[p], so_vong=1, lo=128)
    kq["MLP (1 lượt)"] = {"acc": float((mlp1.du_doan(Xte) == yte).mean()), "giay": dh.giay, "tham_so": mlp1.so_tham_so}
    h = tao_hcn(seed, rho)
    with DongHo() as dh:
        h.huan_luyen(Xtr[p], ytr[p])
    kq["HCN (1 lượt)"] = {"acc": float((h.du_doan_lo(Xte) == yte).mean()), "giay": dh.giay, "tham_so": h.so_nut * 784,
                          "so_nut": h.so_nut}
    if seed == 0:  # 1-NN nhớ toàn bộ 60.000 ảnh: mô hình "nhớ mẫu" thuần tuý, để tham chiếu
        A = Xtr / np.linalg.norm(Xtr, axis=1, keepdims=True)
        B = Xte / np.linalg.norm(Xte, axis=1, keepdims=True)
        du = np.concatenate([ytr[np.argmax(B[i:i + 1000] @ A.T, 1)] for i in range(0, len(B), 1000)])
        kq["1-NN (nhớ hết 60.000 ảnh)"] = {"acc": float((du == yte).mean()), "tham_so": int(Xtr.size)}
    return kq


def bai_B(Xtr, ytr, Xte, yte, seed, rho):
    rng = np.random.default_rng(seed)
    thu_tu = rng.permutation(10).tolist()
    dot = [thu_tu[i:i + 2] for i in range(0, 10, 2)]
    mh = {"MLP tuần tự": BoPhanLoaiMLP(784, 10, an=AN, seed=seed),
          "MLP + phát lại 100 ảnh/lớp": BoPhanLoaiMLP(784, 10, an=AN, seed=seed),
          "HCN (1 lượt)": tao_hcn(seed, rho)}
    duong = {k: [] for k in mh}
    nho_X, nho_y, da = [], [], []
    for lop in dot:
        m = np.isin(ytr, lop)
        idx = rng.permutation(np.where(m)[0])
        X, y = Xtr[idx], ytr[idx]
        da += lop
        mt = np.isin(yte, da)
        for ten, md in mh.items():
            if ten == "MLP tuần tự":
                md.huan_luyen(X, y, so_vong=5, lo=128)
            elif ten.startswith("MLP + phát lại"):
                XX = np.vstack([X, *nho_X]) if nho_X else X
                yy = np.concatenate([y, *nho_y]) if nho_y else y
                md.huan_luyen(XX, yy, so_vong=5, lo=128)
            else:
                md.huan_luyen(X, y)
            du = md.du_doan(Xte[mt]) if ten.startswith("MLP") else md.du_doan_lo(Xte[mt])
            duong[ten].append(float((du == yte[mt]).mean()))
        for c in lop:
            j = np.where(y == c)[0][:100]
            nho_X.append(X[j]); nho_y.append(y[j])
    return duong


class MLPTrucTuyen:
    def __init__(self, seed):
        self.m = BoPhanLoaiMLP(784, 10, an=AN, seed=seed)
        self.X, self.y = np.zeros((500, 784), np.float32), np.zeros(500, int)
        self.n, self.rng = 0, np.random.default_rng(seed)

    def du_doan(self, x):
        return int(self.m.du_doan(x[None])[0])

    def hoc(self, x, y, du):
        self.X[self.n % 500], self.y[self.n % 500] = x, y
        self.n += 1
        j = self.rng.integers(0, min(self.n, 500), 32)
        self.m.ts, self.m.trang_thai = self.m._buoc(self.m.ts, self.m.trang_thai, self.X[j], self.y[j])


def tao_dong(Xtr, ytr, seed):
    rng = np.random.default_rng(seed)
    cai_dat = [(np.isin(ytr, range(5)), False, 0), (np.isin(ytr, range(5, 10)), False, 0),
               (np.ones_like(ytr, bool), True, 0), (np.ones_like(ytr, bool), False, 3),
               (np.ones_like(ytr, bool), False, 0)]
    Xs, ys = [], []
    for m, dao, lech in cai_dat:
        idx = rng.choice(np.where(m)[0], PHA, replace=False)
        Xs.append(1 - Xtr[idx] if dao else Xtr[idx])
        ys.append((ytr[idx] + lech) % 10)
    return np.concatenate(Xs), np.concatenate(ys)


def bai_C(Xtr, ytr, seed, rho):
    X, y = tao_dong(Xtr, ytr, seed)
    mh = {"MLP trực tuyến (backprop + bộ đệm)": MLPTrucTuyen(seed),
          "HCN bỏ nội môi": tao_hcn(seed, rho, noi_moi=False),
          "HCN (đầy đủ)": tao_hcn(seed, rho)}
    kq = {}
    for ten, md in mh.items():
        dung = np.zeros(len(y))
        for t in range(len(y)):
            du = md.du_doan(X[t])
            dung[t] = du == y[t]
            md.hoc(X[t], y[t], du)
        kq[ten] = dung
    return kq


def main():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    tom = {}
    fig, axs = plt.subplots(2, 2, figsize=(13, 7.5), gridspec_kw={"width_ratios": [1, 2.6]})
    mau = {"MLP tuần tự": "#d1495b", "MLP + phát lại 100 ảnh/lớp": "#edae49", "HCN (1 lượt)": "#00798c",
           "MLP trực tuyến (backprop + bộ đệm)": "#d1495b", "HCN bỏ nội môi": "#b8a9c9", "HCN (đầy đủ)": "#00798c"}
    for hang, bo in enumerate(["mnist", "fashion"]):
        Xtr, ytr, Xte, yte = anh(bo)
        rho, bang = chon_rho(Xtr, ytr)
        print(bo, "rho =", rho, bang, flush=True)
        A, B, C = [], [], []
        for s in range(SO_SEED):
            A.append(bai_A(Xtr, ytr, Xte, yte, s, rho)); print(bo, "A", s, A[-1], flush=True)
            B.append(bai_B(Xtr, ytr, Xte, yte, s, rho)); print(bo, "B", s, {k: v[-1] for k, v in B[-1].items()}, flush=True)
            C.append(bai_C(Xtr, ytr, s, rho)); print(bo, "C", s, {k: v.mean() for k, v in C[-1].items()}, flush=True)
        t = {"rho": rho, "bang_chon_rho": {str(k): v for k, v in bang.items()}}
        t["A_hoc_binh_thuong"] = {k: {m: tb_lech([a[k][m] for a in A if k in a]) for m in A[0][k]} for k in A[0]}
        t["B_hoc_lien_tuc"] = {k: {"cuoi": tb_lech([b[k][-1] for b in B]), "duong": np.mean([b[k] for b in B], 0).tolist()}
                               for k in B[0]}
        t["C_dong_thay_doi"] = {}
        for k in C[0]:
            D = np.array([c[k] for c in C])
            t["C_dong_thay_doi"][k] = {
                "ca_dong": tb_lech(D.mean(1)),
                "tung_pha": {TEN_PHA[p]: tb_lech(D[:, p * PHA:(p + 1) * PHA].mean(1)) for p in range(5)},
                "500_anh_dau_moi_pha": {TEN_PHA[p]: tb_lech(D[:, p * PHA:p * PHA + 500].mean(1)) for p in range(5)},
            }
            c = np.cumsum(np.concatenate([np.zeros((len(D), 1)), D], 1), 1)
            axs[hang, 1].plot(np.arange(200, D.shape[1] + 1), ((c[:, 200:] - c[:, :-200]) / 200).mean(0),
                              color=mau[k], lw=2.2 if k == "HCN (đầy đủ)" else 1.3, label=k)
        for k in B[0]:
            axs[hang, 0].plot(range(1, 6), np.mean([b[k] for b in B], 0), "o-", color=mau[k], label=k)
        tom[bo] = t
        ten_bo = "MNIST (chữ số)" if bo == "mnist" else "Fashion-MNIST (quần áo)"
        axs[hang, 0].set_title(f"{ten_bo}: học liên tục", fontsize=10)
        axs[hang, 0].set_ylim(0, 1.02); axs[hang, 0].set_xticks(range(1, 6)); axs[hang, 0].grid(alpha=0.3)
        axs[hang, 0].set_xlabel("số đợt đã học")
        axs[hang, 1].set_title(f"{ten_bo}: dòng dữ liệu thay đổi (TB 200 ảnh gần nhất)", fontsize=10)
        axs[hang, 1].set_ylim(0, 1.02); axs[hang, 1].grid(alpha=0.3)
        for p in range(1, 5):
            axs[hang, 1].axvline(p * PHA, color="#666", ls=":", lw=1)
        for p, tp in enumerate(TEN_PHA):
            axs[hang, 1].text(p * PHA + 100, 0.03, tp, fontsize=8, color="#444")
    axs[0, 0].legend(fontsize=8, loc="lower left")
    axs[0, 1].legend(fontsize=8, loc="lower right", bbox_to_anchor=(1, 0.08))
    axs[1, 1].set_xlabel("số ảnh đã thấy")
    fig.suptitle(f"TN8 · HCN vs MLP trên ảnh thật ({SO_SEED} seed)")
    fig.tight_layout()
    fig.savefig(duong_dan("tn8_anh_that.png"), dpi=130)
    luu_json("tn8_anh_that.json", tom)
    return tom


if __name__ == "__main__":
    import pprint
    pprint.pprint(main())
