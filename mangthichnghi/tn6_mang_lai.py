"""Thí nghiệm 6 - Mạng lai "Hồ chứa – Cộng hưởng – Nội môi" (HCN) trên dòng dữ liệu thay đổi.

Chắt lọc từ TN1, TN2, TN4:
  1. Hồ chứa (ESN): một lớp nơ-ron ngẫu nhiên CỐ ĐỊNH biến ảnh thành đặc trưng; không bao giờ học.
  2. Cộng hưởng (ART): lớp nút mẫu. Học = chỉ kéo nút thắng cuộc lại gần; lạ quá thì mọc nút mới.
     Không có gì bị ghi đè -> không quên.
  3. Nội môi (Ashby): theo dõi "biến thiết yếu" = tỉ lệ đoán sai trên các lớp ĐÃ BIẾT (tức là
     điều mạng tưởng mình biết nhưng lại sai). Vượt ngưỡng -> "nhảy nấc": thử các bộ nhớ ngữ cảnh
     đã lưu trên vài mẫu gần nhất, bộ nào sống được thì dùng; không bộ nào được thì mở ngữ cảnh mới.
     Ngữ cảnh cũ được cất đi chứ không xoá, nên khi thế giới quay lại thì dùng lại ngay.
  (Đoán sai ở lớp CHƯA biết là "điều mới", không phải "bất thường", nên không kích hoạt nhảy nấc.)

Dòng dữ liệu (chữ số 8x8), mỗi mẫu: mô hình ĐOÁN trước, sau đó mới được biết đáp án rồi học.
  Pha 1  chữ số 0–4                      (học lớp mới)
  Pha 2  chữ số 5–9                      (học lớp mới, không được quên 0–4)
  Pha 3  cả 10 chữ số, ảnh bị đảo màu    (cảm biến hỏng)
  Pha 4  ảnh bình thường, nhãn bị lệch 3 (đầu ra nối nhầm dây: luật đổi, kiến thức cũ thành sai)
  Pha 5  mọi thứ trở lại bình thường     (còn nhớ không?)
"""
import numpy as np
from sklearn.datasets import load_digits

from chung import BoPhanLoaiMLP, duong_dan, luu_json, tb_lech
from tn1_hoc_lien_tuc import FuzzyARTMAP

SO_MAU_MOI_PHA = 800
TEN_PHA = ["1. Chữ số 0–4", "2. Chữ số 5–9", "3. Ảnh đảo màu", "4. Nhãn lệch 3", "5. Trở lại bình thường"]


def tao_dong(seed):
    X, y = load_digits(return_X_y=True)
    X = (X / 16.0).astype(np.float32)
    rng = np.random.default_rng(seed)
    thiet_lap = [(np.isin(y, [0, 1, 2, 3, 4]), False, 0), (np.isin(y, [5, 6, 7, 8, 9]), False, 0),
                 (np.ones_like(y, bool), True, 0), (np.ones_like(y, bool), False, 3),
                 (np.ones_like(y, bool), False, 0)]
    Xs, ys = [], []
    for mask, dao, lech in thiet_lap:
        idx = rng.choice(np.where(mask)[0], SO_MAU_MOI_PHA)
        Xs.append(1.0 - X[idx] if dao else X[idx])
        ys.append((y[idx] + lech) % 10)
    return np.concatenate(Xs), np.concatenate(ys)


# ---------------------------------------------------------------- mạng lai HCN
class HoChua:
    """Lớp ngẫu nhiên cố định (tinh thần ESN): z = chuẩn hoá(tanh(W x + b))."""

    def __init__(self, n_vao=64, n=512, seed=0, bat=True):
        rng = np.random.default_rng(seed)
        self.bat = bat
        self.W = rng.standard_normal((n_vao, n)) * 3.0 / np.sqrt(n_vao)
        self.b = rng.uniform(-1, 1, n)

    def __call__(self, x):
        z = np.tanh(x @ self.W + self.b) if self.bat else x - 0.5
        return z / (np.linalg.norm(z) + 1e-9)


class NguCanh:
    """Một bộ nút mẫu kiểu ART."""

    def __init__(self, d):
        self.P = np.zeros((0, d))
        self.nhan = np.zeros(0, int)

    def du_doan(self, z):
        if len(self.nhan) == 0:
            return -1, 0.0
        s = self.P @ z
        j = int(s.argmax())
        return int(self.nhan[j]), float(s[j])

    def hoc(self, z, y, rho, eta):
        if len(self.nhan):
            s = self.P @ z
            cung = np.where(self.nhan == y)[0]
            if len(cung):
                j = cung[s[cung].argmax()]
                # chỉ học nếu nút cùng nhãn gần nhất đủ giống VÀ thắng mọi nút khác nhãn
                if s[j] >= rho and s[j] >= s.max() - 1e-9:
                    p = self.P[j] + eta * (z - self.P[j])
                    self.P[j] = p / np.linalg.norm(p)
                    return
        self.P = np.vstack([self.P, z])  # mọc nút mới
        self.nhan = np.append(self.nhan, y)


class HCN:
    def __init__(self, seed=0, rho=0.9, eta=0.1, cua_so=20, nguong=0.5, ho_chua=True, noi_moi=True):
        self.h = HoChua(seed=seed, bat=ho_chua)
        d = 512 if ho_chua else 64
        self.cac_ngu_canh = [NguCanh(d)]
        self.hien = 0
        self.rho, self.eta, self.cua_so, self.nguong, self.noi_moi = rho, eta, cua_so, nguong, noi_moi
        self.bat_ngo = []           # 1 = đoán sai một lớp mình TƯỞNG đã biết
        self.dem_gan = []           # bộ nhớ ngắn hạn: vài mẫu gần nhất
        self.so_lan_nhay = 0
        self._z = None

    def du_doan(self, x):
        self._z = self.h(x)
        return self.cac_ngu_canh[self.hien].du_doan(self._z)[0]

    def hoc(self, x, y, du):
        z = self._z
        nc = self.cac_ngu_canh[self.hien]
        if y in nc.nhan:  # lớp đã biết -> đây là thông tin về "sống được hay không"
            self.bat_ngo.append(int(du != y))
        self.dem_gan = (self.dem_gan + [(z, y)])[-self.cua_so:]
        nc.hoc(z, y, self.rho, self.eta)
        gan = self.bat_ngo[-self.cua_so:]
        if self.noi_moi and len(gan) >= self.cua_so and np.mean(gan) > self.nguong:
            self.nhay_nac()

    def nhay_nac(self):
        """Biến thiết yếu ra khỏi vùng sống được: thử các ngữ cảnh đã cất trên bộ nhớ ngắn hạn."""
        self.so_lan_nhay += 1
        # chỉ xét nửa gần nhất của bộ nhớ ngắn hạn: nửa cũ có thể còn thuộc chế độ trước
        gan = self.dem_gan[-(self.cua_so // 2):]
        diem = [np.mean([nc.du_doan(z)[0] == y for z, y in gan]) for nc in self.cac_ngu_canh]
        tot = int(np.argmax(diem))
        if tot != self.hien and diem[tot] >= 1 - self.nguong:
            self.hien = tot
        else:  # không ngữ cảnh nào sống được -> mở ngữ cảnh mới, gieo bằng bộ nhớ ngắn hạn
            nc = NguCanh(self.cac_ngu_canh[0].P.shape[1])
            for z, y in gan:
                nc.hoc(z, y, self.rho, self.eta)
            self.cac_ngu_canh.append(nc)
            self.hien = len(self.cac_ngu_canh) - 1
        self.bat_ngo = []

    @property
    def so_nut(self):
        return int(sum(len(nc.nhan) for nc in self.cac_ngu_canh))


# ---------------------------------------------------------------- các đối thủ
class MLPTrucTuyen:
    """MLP backprop học trực tuyến: mỗi mẫu mới -> 1 bước Adam trên lô 32 mẫu từ bộ đệm 500 mẫu gần nhất."""

    def __init__(self, seed=0):
        self.m = BoPhanLoaiMLP(64, 10, seed=seed)
        self.X, self.y = [], []
        self.rng = np.random.default_rng(seed)

    def du_doan(self, x):
        return int(self.m.du_doan(x[None])[0])

    def hoc(self, x, y, du):
        self.X = (self.X + [x])[-500:]
        self.y = (self.y + [y])[-500:]
        j = self.rng.integers(0, len(self.X), min(32, len(self.X)))
        self.m.ts, self.m.trang_thai = self.m._buoc(self.m.ts, self.m.trang_thai,
                                                   np.stack([self.X[i] for i in j]),
                                                   np.array([self.y[i] for i in j]))


class ARTMAPTrucTuyen:
    def __init__(self, seed=0):
        self.a = FuzzyARTMAP(rho=0.85)

    def du_doan(self, x):
        return int(self.a.du_doan(x[None])[0]) if self.a.W is not None else -1

    def hoc(self, x, y, du):
        self.a.hoc_mot(FuzzyARTMAP.ma_hoa(x[None])[0], y)


class HoChuaRLS:
    """Hồ chứa (cùng lớp ngẫu nhiên với HCN) + lớp đọc ra tuyến tính cập nhật bằng RLS có hệ số quên."""

    def __init__(self, seed=0, lam=0.995):
        self.h = HoChua(seed=seed)
        self.W = np.zeros((512, 10))
        self.P = np.eye(512) * 10.0
        self.lam = lam

    def du_doan(self, x):
        self._z = self.h(x)
        return int((self._z @ self.W).argmax())

    def hoc(self, x, y, du):
        z = self._z
        Pz = self.P @ z
        k = Pz / (self.lam + z @ Pz)
        self.W += np.outer(k, np.eye(10)[y] - z @ self.W)
        self.P = (self.P - np.outer(k, Pz)) / self.lam


# Bản HCN dùng chung (hcn.py) là bản cuối cùng, cũng dùng ở TN7, TN8. Lớp HCN ở trên là bản đầu tiên, giữ lại để tham khảo.
from hcn import HCN as HCNChung  # noqa: E402

MO_HINH = {
    "MLP trực tuyến (backprop + bộ đệm)": MLPTrucTuyen,
    "Hồ chứa + RLS": HoChuaRLS,
    "Fuzzy ARTMAP": ARTMAPTrucTuyen,
    "HCN bỏ nội môi": lambda seed: HCNChung(64, seed=seed, noi_moi=False),
    "HCN bỏ hồ chứa": lambda seed: HCNChung(64, seed=seed, ho_chua=False, tam=0.5),
    "HCN (đầy đủ)": lambda seed: HCNChung(64, seed=seed),
}


def chay(seed):
    X, y = tao_dong(seed)
    kq = {}
    for ten, lop in MO_HINH.items():
        mh = lop(seed)
        dung = np.zeros(len(y))
        for t in range(len(y)):
            du = mh.du_doan(X[t])
            dung[t] = du == y[t]
            mh.hoc(X[t], y[t], du)
        kq[ten] = {"dung": dung}
        if isinstance(mh, HCNChung):
            kq[ten]["so_nut"] = mh.so_nut
            kq[ten]["so_ngu_canh"] = len(mh.cac_ngu_canh)
            kq[ten]["so_lan_nhay"] = mh.so_lan_nhay
        print(f"seed {seed} | {ten}: {dung.mean():.3f}", flush=True)
    return kq


def main(so_seed=5):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    tat_ca = [chay(s) for s in range(so_seed)]
    N = SO_MAU_MOI_PHA
    tom, duong = {}, {}
    for ten in MO_HINH:
        D = np.array([k[ten]["dung"] for k in tat_ca])  # seed x thời gian
        tom[ten] = {
            "toan_dong": tb_lech(D.mean(1)),
            "tung_pha": {TEN_PHA[p]: tb_lech(D[:, p * N:(p + 1) * N].mean(1)) for p in range(5)},
            "100_mau_dau_moi_pha": {TEN_PHA[p]: tb_lech(D[:, p * N:p * N + 100].mean(1)) for p in range(5)},
        }
        if "so_nut" in tat_ca[0][ten]:
            for k in ("so_nut", "so_ngu_canh", "so_lan_nhay"):
                tom[ten][k] = tb_lech([r[ten][k] for r in tat_ca])
        c = np.cumsum(np.concatenate([np.zeros((len(D), 1)), D], 1), 1)
        w = 50
        duong[ten] = ((c[:, w:] - c[:, :-w]) / w).mean(0).tolist()  # TB trượt 50 mẫu về trước
    luu_json("tn6_mang_lai.json", tom)

    fig, ax = plt.subplots(figsize=(11, 4.5))
    mau = {"MLP trực tuyến (backprop + bộ đệm)": "#d1495b", "Hồ chứa + RLS": "#8fc9cf", "Fuzzy ARTMAP": "#edae49",
           "HCN bỏ nội môi": "#b8a9c9", "HCN bỏ hồ chứa": "#9bc59d", "HCN (đầy đủ)": "#00798c"}
    for ten, v in duong.items():
        ax.plot(np.arange(50, 50 + len(v)), v, color=mau[ten], lw=2.4 if ten == "HCN (đầy đủ)" else 1.3, label=ten)
    for p in range(1, 5):
        ax.axvline(p * N, color="#666", ls=":", lw=1)
    for p, t in enumerate(TEN_PHA):
        ax.text(p * N + 10, 0.03, t, fontsize=8, color="#444")
    ax.set_ylim(0, 1.02)
    ax.set_xlabel("số ảnh đã thấy trong dòng dữ liệu")
    ax.set_ylabel("tỉ lệ đoán đúng (TB 50 ảnh gần nhất)")
    ax.set_title("TN6 · Dòng dữ liệu thay đổi: đoán trước, được biết đáp án rồi mới học (5 seed)")
    ax.grid(alpha=0.3)
    ax.legend(fontsize=8, loc="lower left", bbox_to_anchor=(0.0, 0.08), ncol=2)
    fig.tight_layout()
    fig.savefig(duong_dan("tn6_mang_lai.png"), dpi=130)
    return tom


if __name__ == "__main__":
    import pprint
    pprint.pprint(main())
