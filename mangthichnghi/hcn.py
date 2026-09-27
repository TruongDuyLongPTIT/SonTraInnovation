"""Mạng lai HCN (Hồ chứa – Cộng hưởng – Nội môi), bản dùng chung cho dữ liệu lớn.

Khác bản trong tn6_mang_lai.py:
  - số chiều đầu vào tuỳ ý, hồ chứa bật/tắt được;
  - mỗi ngữ cảnh có NGÂN SÁCH NÚT: vượt ngân sách thì thay nút lâu nhất không được dùng đúng
    theo HẠN MỨC NGANG NHAU cho mỗi lớp (bộ nhớ có hạn, giữ tốc độ, nhưng lớp cũ không bị xoá sạch);
  - mảng nút cấp phát trước để thêm nút nhanh;
  - "bất ngờ" = tỉ lệ sai gần đây vượt mức thường ngày của chính lớp đó hơn 40 điểm %, chỉ tính ở
    lớp quen (tránh báo động nhầm khi đang học lớp mới, và không phụ thuộc bộ dữ liệu dễ hay khó);
  - tối đa 20 ngữ cảnh, quá thì bỏ ngữ cảnh lâu nhất không dùng.
"""
import numpy as np


class NguCanh:
    def __init__(self, d, ngan_sach):
        self.P = np.zeros((min(ngan_sach, 1024), d), np.float32)
        self.nhan = np.zeros(len(self.P), int)
        self.lan_dung = np.zeros(len(self.P))
        self.n, self.ngan_sach = 0, ngan_sach
        self.lop_biet = set()
        # Mỗi lớp có "độ chính xác thường ngày" (trung bình trượt chậm). Lớp đã gặp >= 30 lần là lớp quen.
        self.ema, self.dem = {}, {}
        self.lan_cuoi_dung = 0

    def diem(self, z):
        return self.P[:self.n] @ z

    def du_doan(self, z, tra_diem=False):
        if self.n == 0:
            return (-1, 0.0) if tra_diem else -1
        s = self.diem(z)
        j = int(np.argmax(s))
        return (int(self.nhan[j]), float(s[j])) if tra_diem else int(self.nhan[j])

    def du_doan_lo(self, Z):
        if self.n == 0:
            return np.full(len(Z), -1)
        kq = np.empty(len(Z), int)
        for i in range(0, len(Z), 2048):
            kq[i:i + 2048] = self.nhan[:self.n][np.argmax(Z[i:i + 2048] @ self.P[:self.n].T, 1)]
        return kq

    def quen(self, y):
        return self.dem.get(y, 0) >= 30

    def ghi_ket_qua(self, y, dung):
        self.ema[y] = 0.98 * self.ema.get(y, dung) + 0.02 * dung
        self.dem[y] = self.dem.get(y, 0) + 1

    def hoc(self, z, y, rho, eta, t):
        self.lop_biet.add(y)
        if self.n:
            s = self.diem(z)
            cung = np.where(self.nhan[:self.n] == y)[0]
            if len(cung):
                j = cung[np.argmax(s[cung])]
                if s[j] >= rho and s[j] >= s.max() - 1e-9:  # cộng hưởng: chỉ sửa nút thắng
                    p = self.P[j] + eta * (z - self.P[j])
                    self.P[j] = p / (np.linalg.norm(p) + 1e-9)
                    self.lan_dung[j] = t
                    return
        # mọc nút mới
        if self.n >= self.ngan_sach:
            # hết ngân sách: mỗi lớp có hạn mức ngang nhau. Lớp y còn dưới hạn mức thì lấy một nút
            # của lớp đang đông nhất; không thì thay nút lâu nhất không dùng của chính lớp y.
            dem = np.bincount(self.nhan[:self.n], minlength=y + 1)
            han_muc = self.ngan_sach // len(self.lop_biet)
            lop_bo = int(np.argmax(dem)) if dem[y] < han_muc else y
            cung = np.where(self.nhan[:self.n] == lop_bo)[0]
            j = int(cung[np.argmin(self.lan_dung[cung])])
        else:
            if self.n == len(self.P):
                moi = min(2 * len(self.P), self.ngan_sach)
                self.P = np.vstack([self.P, np.zeros((moi - len(self.P), self.P.shape[1]), np.float32)])
                self.nhan = np.concatenate([self.nhan, np.zeros(moi - len(self.nhan), int)])
                self.lan_dung = np.concatenate([self.lan_dung, np.zeros(moi - len(self.lan_dung))])
            j = self.n
            self.n += 1
        self.P[j], self.nhan[j], self.lan_dung[j] = z, y, t


class HCN:
    def __init__(self, d_vao, seed=0, ho_chua=True, n_ho=512, tam=0.0, rho=0.9, eta=0.1,
                 cua_so=30, nguong=0.4, noi_moi=True, ngan_sach=5000, toi_da_ngu_canh=20):
        rng = np.random.default_rng(seed)
        self.ho_chua, self.tam = ho_chua, tam
        if ho_chua:
            self.W = (rng.standard_normal((d_vao, n_ho)) * 3.0 / np.sqrt(d_vao)).astype(np.float32)
            self.b = rng.uniform(-1, 1, n_ho).astype(np.float32)
        self.d = n_ho if ho_chua else d_vao
        self.ngan_sach = ngan_sach
        self.cac_ngu_canh = [NguCanh(self.d, ngan_sach)]
        self.hien = 0
        self.rho, self.eta, self.cua_so, self.nguong, self.noi_moi = rho, eta, cua_so, nguong, noi_moi
        self.toi_da_ngu_canh = toi_da_ngu_canh
        self.bat_ngo, self.dem_gan = [], []
        self.so_lan_nhay, self.t = 0, 0

    def ma_hoa(self, X):
        Z = np.tanh(X @ self.W + self.b) if self.ho_chua else X - self.tam
        return (Z / (np.linalg.norm(Z, axis=-1, keepdims=True) + 1e-9)).astype(np.float32)

    # ---- dùng trực tuyến: đoán rồi học từng mẫu
    def du_doan(self, x):
        self._z = self.ma_hoa(x)
        du, self._giong = self.cac_ngu_canh[self.hien].du_doan(self._z, tra_diem=True)
        return du

    def hoc(self, x, y, du):
        self.t += 1
        z, nc = self._z, self.cac_ngu_canh[self.hien]
        nc.lan_cuoi_dung = self.t
        # Bất ngờ = sai NHIỀU HƠN HẲN mức thường ngày ở một lớp quen. Đang học lớp mới thì không tính.
        if nc.quen(y):
            self.bat_ngo.append(int(du != y) - (1 - nc.ema[y]))
        nc.ghi_ket_qua(y, int(du == y))
        self.dem_gan = (self.dem_gan + [(z, y)])[-self.cua_so:]
        nc.hoc(z, y, self.rho, self.eta, self.t)
        gan = self.bat_ngo[-self.cua_so:]
        if self.noi_moi and len(gan) >= self.cua_so and np.mean(gan) > self.nguong:
            self.nhay_nac()

    def nhay_nac(self):
        self.so_lan_nhay += 1
        gan = self.dem_gan[-(self.cua_so // 2):]
        # chấm các ngữ cảnh KHÁC (ngữ cảnh hiện tại là cái đang hỏng, lại vừa học chính các mẫu này)
        diem = [np.mean([nc.du_doan(z) == y for z, y in gan]) if i != self.hien else -1.0
                for i, nc in enumerate(self.cac_ngu_canh)]
        tot = int(np.argmax(diem))
        if tot != self.hien and diem[tot] >= 0.5:
            self.hien = tot
        else:
            nc = NguCanh(self.d, self.ngan_sach)
            for z, y in gan:
                nc.hoc(z, y, self.rho, self.eta, self.t)
            self.cac_ngu_canh.append(nc)
            if len(self.cac_ngu_canh) > self.toi_da_ngu_canh:  # quá nhiều: bỏ ngữ cảnh lâu nhất không dùng
                cu = min(range(len(self.cac_ngu_canh) - 1), key=lambda i: self.cac_ngu_canh[i].lan_cuoi_dung)
                del self.cac_ngu_canh[cu]
            self.hien = len(self.cac_ngu_canh) - 1
        self.cac_ngu_canh[self.hien].lan_cuoi_dung = self.t
        self.bat_ngo = []

    # ---- dùng theo lô (học 1 lượt qua dữ liệu, rồi kiểm tra)
    def huan_luyen(self, X, y):
        for x, nhan in zip(X, y):
            du = self.du_doan(x)
            self.hoc(x, nhan, du)

    def du_doan_lo(self, X):
        return self.cac_ngu_canh[self.hien].du_doan_lo(self.ma_hoa(X))

    @property
    def so_nut(self):
        return int(sum(nc.n for nc in self.cac_ngu_canh))
