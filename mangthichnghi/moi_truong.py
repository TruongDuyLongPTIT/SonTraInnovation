"""Con lắc ngược trên xe (CartPole), cùng phương trình và giới hạn với Gymnasium CartPole-v1.

Có thêm các "tổn thương" để thử khả năng tự thích nghi (giống thí nghiệm của Ashby,
người đã đảo ngược dây nối trong máy homeostat của mình):
  - dao_motor: đảo cực động cơ (lệnh trái thành phải).
  - dao_cam_bien_goc: cảm biến góc lắp ngược (đọc θ, θ̇ với dấu ngược lại).
"""
import math

import numpy as np

TOI_DA = 500


class ConLac:
    def __init__(self, seed=0, an_van_toc=False, ton_thuong=None):
        self.rng = np.random.default_rng(seed)
        self.an_van_toc = an_van_toc
        self.dat_ton_thuong(ton_thuong)

    def dat_ton_thuong(self, ton_thuong):
        self.ton_thuong = ton_thuong
        self.g, self.m_xe, self.m_con_lac, self.nua_dai, self.luc = 9.8, 1.0, 0.1, 0.5, 10.0
        self.dao = -1.0 if ton_thuong == "dao_motor" else 1.0
        self.dau_goc = -1.0 if ton_thuong == "dao_cam_bien_goc" else 1.0

    @property
    def so_quan_sat(self):
        return 2 if self.an_van_toc else 4

    def quan_sat(self):
        x, xd, th, thd = self.s
        th, thd = self.dau_goc * th, self.dau_goc * thd
        return np.array([x, th]) if self.an_van_toc else np.array([x, xd, th, thd])

    def dat_lai(self):
        self.s = self.rng.uniform(-0.05, 0.05, 4)
        self.t = 0
        return self.quan_sat()

    def buoc(self, hanh_dong):
        x, xd, th, thd = self.s
        F = self.dao * (self.luc if hanh_dong == 1 else -self.luc)
        tong_m = self.m_xe + self.m_con_lac
        ml = self.m_con_lac * self.nua_dai
        c, s = math.cos(th), math.sin(th)
        tam = (F + ml * thd * thd * s) / tong_m
        thdd = (self.g * s - c * tam) / (self.nua_dai * (4.0 / 3.0 - self.m_con_lac * c * c / tong_m))
        xdd = tam - ml * thdd * c / tong_m
        tau = 0.02
        x, xd = x + tau * xd, xd + tau * xdd
        th, thd = th + tau * thd, thd + tau * thdd
        self.s = np.array([x, xd, th, thd])
        self.t += 1
        nga = abs(x) > 2.4 or abs(th) > 12 * math.pi / 180
        het_gio = self.t >= TOI_DA
        return self.quan_sat(), 1.0, nga, het_gio


def chay_tap(mt, chinh_sach):
    """Chạy một tập; trả về số bước giữ được (điểm)."""
    o = mt.dat_lai()
    if hasattr(chinh_sach, "dat_lai"):
        chinh_sach.dat_lai()
    diem = 0
    while True:
        o, r, nga, het = mt.buoc(chinh_sach(o))
        diem += r
        if nga or het:
            return diem
