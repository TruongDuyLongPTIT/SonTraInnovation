"""Thí nghiệm 1 - Học liên tục (class-incremental): Fuzzy ARTMAP vs MLP backprop.

Điểm mạnh được kiểm tra: ART (Grossberg) được thiết kế để giải "thế lưỡng nan
ổn định - dẻo dai": học cái mới mà không xoá cái cũ.

Giao thức: bộ chữ số viết tay 8x8 của scikit-learn (1797 ảnh, 10 lớp), chia 10 lớp
thành 5 nhiệm vụ (mỗi nhiệm vụ 2 lớp), học lần lượt, KHÔNG được xem lại dữ liệu cũ.
Sau mỗi nhiệm vụ, đo độ chính xác trên mọi lớp đã học.
"""
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

from chung import BoPhanLoaiMLP, DongHo, duong_dan, luu_json, tb_lech


class MotLangGieng:
    """1-NN: nhớ nguyên mọi mẫu. Chỉ để tham chiếu (cũng không quên, nhưng không nén gì)."""

    def __init__(self):
        self.X, self.y = np.zeros((0, 64)), np.zeros(0, int)

    def huan_luyen(self, X, y):
        self.X, self.y = np.vstack([self.X, X]), np.concatenate([self.y, y])

    def du_doan(self, X):
        d = ((X[:, None, :] - self.X[None]) ** 2).sum(-1)
        return self.y[d.argmin(1)]

    @property
    def so_tham_so(self):
        return int(self.X.size)


class FuzzyARTMAP:
    """Simplified Fuzzy ARTMAP (Carpenter et al. 1992), học nhanh (beta=1), 1 lần duyệt.

    - Mã hoá bù: I = [a, 1-a]  (|I| = số chiều, không cần chuẩn hoá).
    - Chọn loại: T_j = |I ^ w_j| / (alpha + |w_j|), ^ là min theo từng phần tử.
    - Kiểm tra cảnh giác: |I ^ w_j| / |I| >= rho. Sai nhãn -> nâng rho (match tracking).
    - Không loại nào hợp -> tạo loại mới: đây là chỗ mạng "mọc" thêm nơ-ron.
    Việc học chỉ sửa đúng một nơ-ron thắng cuộc, nên kiến thức cũ không bị ghi đè.
    """

    def __init__(self, rho=0.0, alpha=1e-3, beta=1.0, eps=1e-4):
        self.rho, self.alpha, self.beta, self.eps = rho, alpha, beta, eps
        self.W = None
        self.nhan = []

    @staticmethod
    def ma_hoa(X):
        return np.hstack([X, 1.0 - X])

    def hoc_mot(self, I, y):
        M = I.sum()
        if self.W is None:
            self.W = I[None].copy()
            self.nhan.append(y)
            return
        giao = np.minimum(I, self.W).sum(1)
        T = giao / (self.alpha + self.W.sum(1))
        rho = self.rho
        for j in np.argsort(-T):
            khop = giao[j] / M
            if khop < rho:
                continue
            if self.nhan[j] == y:  # cộng hưởng -> học
                self.W[j] = self.beta * np.minimum(I, self.W[j]) + (1 - self.beta) * self.W[j]
                return
            rho = khop + self.eps  # match tracking
        self.W = np.vstack([self.W, I])
        self.nhan.append(y)

    def huan_luyen(self, X, y):
        for I, nhan in zip(self.ma_hoa(X), y):
            self.hoc_mot(I, nhan)

    def du_doan(self, X):
        I = self.ma_hoa(X)
        nhan = np.asarray(self.nhan)
        kq = np.empty(len(I), int)
        for i in range(0, len(I), 256):
            giao = np.minimum(I[i:i + 256, None, :], self.W[None]).sum(-1)
            T = giao / (self.alpha + self.W.sum(1))
            kq[i:i + 256] = nhan[T.argmax(1)]
        return kq

    @property
    def so_tham_so(self):
        return int(self.W.size)


def chay_mot_seed(seed, nhiem_vu, rho_art, so_vong=30, bo_nho_moi_lop=20):
    X, y = load_digits(return_X_y=True)
    X = (X / 16.0).astype(np.float32)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, stratify=y, random_state=seed)
    rng = np.random.default_rng(seed)
    Xtr_j, ytr_j = Xtr, ytr

    mo_hinh = {
        "MLP tuần tự": BoPhanLoaiMLP(64, 10, seed=seed),
        "MLP + phát lại 20 mẫu/lớp": BoPhanLoaiMLP(64, 10, seed=seed),
        "Fuzzy ARTMAP": FuzzyARTMAP(rho=rho_art),
        "Fuzzy ARTMAP gọn (rho=0.6)": FuzzyARTMAP(rho=0.6),
        "1-NN (nhớ hết, tham chiếu)": MotLangGieng(),
    }
    duong_cong = {k: [] for k in mo_hinh}
    thoi_gian = {k: 0.0 for k in mo_hinh}
    bo_nho_X, bo_nho_y = [], []
    da_hoc = []
    for lop in nhiem_vu:
        m = np.isin(ytr, lop)
        Xt, yt = Xtr[m], ytr[m]
        p = rng.permutation(len(Xt))
        Xt, yt = Xt[p], yt[p]
        da_hoc += lop
        for ten, mh in mo_hinh.items():
            with DongHo() as dh:
                if ten.startswith("MLP + phát lại") and bo_nho_X:
                    mh.huan_luyen(np.vstack([Xt, *bo_nho_X]), np.concatenate([yt, *bo_nho_y]), so_vong)
                elif ten.startswith("MLP"):
                    mh.huan_luyen(Xt, yt, so_vong)
                else:
                    mh.huan_luyen(Xt, yt)  # ARTMAP, 1-NN: mỗi mẫu chỉ xem một lần
            thoi_gian[ten] += dh.giay
            mte = np.isin(yte, da_hoc)
            duong_cong[ten].append(float((mh.du_doan(Xte[mte]) == yte[mte]).mean()))
        for c in lop:  # bộ nhớ phát lại nhỏ cho baseline MLP + replay
            idx = np.where(yt == c)[0][:bo_nho_moi_lop]
            bo_nho_X.append(Xt[idx])
            bo_nho_y.append(yt[idx])

    # Cận trên: MLP học chung toàn bộ dữ liệu cùng lúc (không phải học liên tục)
    chung = BoPhanLoaiMLP(64, 10, seed=seed)
    with DongHo() as dh:
        chung.huan_luyen(Xtr_j, ytr_j, so_vong)
    thoi_gian["MLP học chung (cận trên)"] = dh.giay
    duong_cong["MLP học chung (cận trên)"] = [float((chung.du_doan(Xte) == yte).mean())] * len(nhiem_vu)

    # ARTMAP học chung 1 lượt (để thấy thứ tự dữ liệu ảnh hưởng thế nào)
    art_chung = FuzzyARTMAP(rho=rho_art)
    p = rng.permutation(len(Xtr_j))
    art_chung.huan_luyen(Xtr_j[p], ytr_j[p])
    so_nut = {k: len(mo_hinh[k].nhan) for k in ("Fuzzy ARTMAP", "Fuzzy ARTMAP gọn (rho=0.6)")}
    tham_so = {k: mh.so_tham_so for k, mh in mo_hinh.items()}
    tham_so["MLP học chung (cận trên)"] = chung.so_tham_so
    return duong_cong, thoi_gian, so_nut, tham_so, float((art_chung.du_doan(Xte) == yte).mean())


def chon_rho(seed=100):
    """Chọn độ cảnh giác rho trên tập kiểm định tách từ tập huấn luyện (không dùng tập test)."""
    X, y = load_digits(return_X_y=True)
    X = X / 16.0
    Xtr, _, ytr, _ = train_test_split(X, y, test_size=0.3, stratify=y, random_state=seed)
    Xa, Xv, ya, yv = train_test_split(Xtr, ytr, test_size=0.25, stratify=ytr, random_state=seed)
    diem = {}
    for rho in [0.0, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95]:
        art = FuzzyARTMAP(rho=rho)
        art.huan_luyen(Xa, ya)
        diem[rho] = float((art.du_doan(Xv) == yv).mean())
    return max(diem, key=diem.get), diem


def main(so_seed=5):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    rho, bang_rho = chon_rho()
    print("Chọn rho =", rho, bang_rho)
    tat_ca = {}
    tg_all, nut_all, art_chung_all, ts_all = {}, {}, [], None
    for s in range(so_seed):
        rng = np.random.default_rng(s)
        thu_tu = rng.permutation(10).tolist()
        nhiem_vu = [thu_tu[i:i + 2] for i in range(0, 10, 2)]
        dc, tg, nut, ts, acc_art_chung = chay_mot_seed(s, nhiem_vu, rho)
        for k, v in dc.items():
            tat_ca.setdefault(k, []).append(v)
            tg_all.setdefault(k, []).append(tg[k])
        for k, v in nut.items():
            nut_all.setdefault(k, []).append(v)
        art_chung_all.append(acc_art_chung)
        ts_all = ts
        print(f"seed {s}: " + ", ".join(f"{k}={v[-1]:.3f}" for k, v in dc.items()))

    tom_tat = {}
    for k, v in tat_ca.items():
        v = np.array(v)
        tom_tat[k] = {
            "do_chinh_xac_cuoi": tb_lech(v[:, -1]),
            "duong_cong_tb": v.mean(0).tolist(),
            "thoi_gian_giay": tb_lech(tg_all[k]),
            "so_tham_so": ts_all.get(k),
        }
    tom_tat["_ARTMAP_so_nut_loai"] = {k: tb_lech(v) for k, v in nut_all.items()}
    tom_tat["_ARTMAP_hoc_chung_1_luot"] = tb_lech(art_chung_all)
    tom_tat["_rho"] = rho
    tom_tat["_bang_chon_rho"] = bang_rho
    luu_json("tn1_hoc_lien_tuc.json", tom_tat)

    fig, ax = plt.subplots(figsize=(7, 4.2))
    x = np.arange(1, 6)
    kieu = {"MLP tuần tự": ("#d1495b", "o-"), "MLP + phát lại 20 mẫu/lớp": ("#edae49", "s-"),
            "Fuzzy ARTMAP": ("#00798c", "D-"), "Fuzzy ARTMAP gọn (rho=0.6)": ("#30638e", "^:"),
            "MLP học chung (cận trên)": ("#888888", "--")}
    for k, (mau, ls) in kieu.items():
        v = np.array(tat_ca[k])
        ax.plot(x, v.mean(0), ls, color=mau, label=k, lw=2)
        ax.fill_between(x, v.mean(0) - v.std(0), v.mean(0) + v.std(0), color=mau, alpha=0.15)
    ax.set_xticks(x)
    ax.set_xlabel("Số nhiệm vụ đã học (mỗi nhiệm vụ = 2 chữ số mới)")
    ax.set_ylabel("Độ chính xác trên mọi lớp đã học")
    ax.set_ylim(0, 1.02)
    ax.set_title("TN1 · Học liên tục trên chữ số viết tay (5 seed)")
    ax.grid(alpha=0.3)
    ax.legend(loc="lower left", fontsize=9)
    fig.tight_layout()
    fig.savefig(duong_dan("tn1_hoc_lien_tuc.png"), dpi=130)
    return tom_tat


if __name__ == "__main__":
    import pprint
    pprint.pprint(main())
