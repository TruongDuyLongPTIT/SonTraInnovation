"""Thí nghiệm 4 - Siêu ổn định (ultrastability) của Ashby vs mạng nơ-ron khi hệ bị hỏng giữa chừng.

Mô hình Ashby (Design for a Brain, 1952): hệ không có hàm mục tiêu, chỉ có "biến thiết yếu"
phải nằm trong vùng sống được. Khi biến thiết yếu vượt vùng (con lắc ngã / xe chạm tường),
"bộ chọn nấc" (uniselector) nhảy các trọng số sang giá trị ngẫu nhiên mới. Khi hệ còn
sống được thì giữ nguyên. Không gradient, không mô hình, không phần thưởng.

Kịch bản: bộ điều khiển đã giữ được con lắc -> đột ngột hỏng (đảo cực động cơ hoặc lắp
ngược cảm biến góc) -> đo mỗi bên mất bao nhiêu bước tương tác để hồi phục.

Đối thủ mạng nơ-ron:
  - PPO + MLP đóng băng sau huấn luyện (cách triển khai phổ biến).
  - PPO + MLP tiếp tục học trực tuyến sau khi hỏng.
"""
import numpy as np

from chung import duong_dan, luu_json, tb_lech
from moi_truong import TOI_DA, ConLac, chay_tap
from tn3_tien_hoa import chay_ppo, kiem_tra

LIEN_TIEP = 5            # hồi phục = 5 tập liên tiếp giữ đủ 500 bước
NGAN_SACH_SAU = 150_000  # số bước tối đa cho giai đoạn sau hỏng
TON_THUONG = ["dao_motor", "dao_cam_bien_goc"]


class Homeostat:
    """Một nơ-ron ngưỡng u = [w·s > 0] với bộ chọn nấc ngẫu nhiên kiểu Ashby."""

    def __init__(self, seed, d=4):
        self.rng = np.random.default_rng(seed)
        self.w = self.rng.uniform(-1, 1, d)
        self.so_lan_nhay = 0

    def __call__(self, o):
        return int(o @ self.w > 0)

    def sau_tap(self, diem):
        if diem < TOI_DA:  # biến thiết yếu đã ra khỏi vùng sống được -> nhảy nấc
            self.w = self.rng.uniform(-1, 1, len(self.w))
            self.so_lan_nhay += 1


def chay_homeostat(hs, mt, ngan_sach):
    """Chạy liên tục đến khi đạt LIEN_TIEP tập đủ 500 bước; trả về số bước đã dùng (None nếu hết ngân sách)."""
    buoc, lien_tiep, diem_cac_tap = 0, 0, []
    while buoc < ngan_sach:
        d = chay_tap(mt, hs)
        buoc += int(d)
        diem_cac_tap.append(d)
        hs.sau_tap(d)
        lien_tiep = lien_tiep + 1 if d >= TOI_DA else 0
        if lien_tiep >= LIEN_TIEP:
            return buoc, diem_cac_tap
    return None, diem_cac_tap


def buoc_hoi_phuc_ppo(duong):
    for buoc, diem in duong:
        if diem >= 475:
            return buoc
    return None


def mot_seed(seed):
    kq = {}
    # ---- giai đoạn 1: học từ đầu trên hệ lành
    mt = ConLac(seed=seed)
    hs = Homeostat(seed)
    b_hs, _ = chay_homeostat(hs, mt, 300_000)
    kq["hoc_tu_dau_homeostat_buoc"] = b_hs
    kq["homeostat_so_lan_nhay_ban_dau"] = hs.so_lan_nhay
    ppo = chay_ppo(seed, False, tra_ve_mo_hinh=True)
    kq["hoc_tu_dau_ppo_buoc"] = buoc_hoi_phuc_ppo(ppo["duong"])
    kq["ppo_diem_truoc_hong"] = ppo["diem_cuoi"]
    kq["homeostat_diem_truoc_hong"] = kiem_tra(hs, False, seed, so_tap=100)
    w_truoc = hs.w.copy()

    # ---- giai đoạn 2: hỏng
    for tt in TON_THUONG:
        r = {}
        # PPO đóng băng
        r["PPO đóng băng: điểm sau hỏng"] = kiem_tra(ppo["ChinhSach"], False, seed, so_tap=100, ton_thuong=tt)
        # PPO học tiếp trực tuyến (kiểm tra tham lam trên hệ ĐÃ HỎNG mỗi 2048 bước; bước kiểm tra không tính)
        mt2 = ConLac(seed=seed + 50, ton_thuong=tt)
        tiep = chay_ppo(seed, False, mt=mt2, ngan_sach=NGAN_SACH_SAU, tham_so_dau=ppo["p"],
                        kiem_tra_moi=2048, ton_thuong_kt=tt)
        r["PPO học tiếp: bước đến hồi phục"] = buoc_hoi_phuc_ppo(tiep["duong"])
        r["PPO học tiếp: điểm cuối"] = tiep["diem_cuoi"]
        r["_ppo_duong"] = tiep["duong"]
        # Homeostat: tiếp tục với cùng luật
        hs2 = Homeostat(seed + 1000)
        hs2.w = w_truoc.copy()
        r["Homeostat: điểm ngay sau hỏng"] = kiem_tra(hs2, False, seed, so_tap=100, ton_thuong=tt)
        mt3 = ConLac(seed=seed + 50, ton_thuong=tt)
        b, cac_tap = chay_homeostat(hs2, mt3, NGAN_SACH_SAU)
        r["Homeostat: bước đến hồi phục"] = b
        r["_hs_tap"] = cac_tap
        r["Homeostat: số lần nhảy nấc"] = hs2.so_lan_nhay
        r["Homeostat: điểm sau hồi phục"] = kiem_tra(hs2, False, seed, so_tap=100, ton_thuong=tt)
        kq[tt] = r
    return kq


def mot_seed_in(seed):
    kq = mot_seed(seed)
    print(f"seed {seed}:", {k: (v if not isinstance(v, dict) else {kk: vv for kk, vv in v.items()
                                                                    if not kk.startswith("_")})
                            for k, v in kq.items()}, flush=True)
    return kq


def ve_hinh(tho):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, axs = plt.subplots(1, 2, figsize=(11, 4.2), sharey=True)
    ten_hong = {"dao_motor": "Đảo cực động cơ", "dao_cam_bien_goc": "Lắp ngược cảm biến góc"}
    for ax, tt in zip(axs, TON_THUONG):
        for i, d in enumerate(tho[tt]):
            xs = [100] + [b for b, _ in d["ppo_duong"]]
            ys = [d["ppo_dong_bang"]] + [y for _, y in d["ppo_duong"]]
            ax.step(xs, ys, where="post", color="#d1495b", alpha=0.7, lw=1.4,
                    label="PPO + MLP học tiếp (điểm kiểm tra)" if i == 0 else None)
            tap = np.array(d["hs_tap"])
            ax.plot(np.maximum(np.cumsum(tap), 100), tap, ".", color="#00798c", ms=3.5, alpha=0.6,
                    label="Homeostat (điểm từng tập)" if i == 0 else None)
        ax.axhline(tho[tt][0]["ppo_dong_bang"], color="#777", lw=1, ls="--", label="PPO đóng băng")
        ax.set_xscale("log")
        ax.set_xlim(100, NGAN_SACH_SAU)
        ax.set_title(ten_hong[tt])
        ax.set_xlabel("số bước tương tác sau khi hỏng (thang log)")
        ax.grid(alpha=0.3)
    axs[0].set_ylabel("số bước giữ được con lắc (tối đa 500)")
    axs[0].legend(fontsize=8, loc="center left")
    fig.suptitle("TN4 · Hồi phục sau khi hỏng: siêu ổn định Ashby vs PPO (5 seed, mỗi đường/chấm là một seed)")
    fig.tight_layout()
    fig.savefig(duong_dan("tn4_can_bang_noi_moi.png"), dpi=130)


def main(so_seed=5, so_tien_trinh=3):
    import multiprocessing as mp
    with mp.get_context("spawn").Pool(so_tien_trinh) as pool:
        tat_ca = pool.map(mot_seed_in, range(so_seed))

    def gom(ds):
        dat = [d for d in ds if d is not None]
        return {"so_seed_hoi_phuc": f"{len(dat)}/{len(ds)}", "buoc": tb_lech(dat) if dat else None}

    tom = {"hoc_tu_dau (hệ lành)": {
        "Homeostat": gom([k["hoc_tu_dau_homeostat_buoc"] for k in tat_ca]),
        "PPO + MLP": gom([k["hoc_tu_dau_ppo_buoc"] for k in tat_ca]),
        "Homeostat: điểm kiểm tra": tb_lech([k["homeostat_diem_truoc_hong"] for k in tat_ca]),
        "PPO: điểm kiểm tra": tb_lech([k["ppo_diem_truoc_hong"] for k in tat_ca]),
    }}
    for tt in TON_THUONG:
        ds = [k[tt] for k in tat_ca]
        tom[tt] = {
            "PPO đóng băng: điểm sau hỏng": tb_lech([d["PPO đóng băng: điểm sau hỏng"] for d in ds]),
            "PPO học tiếp: hồi phục": gom([d["PPO học tiếp: bước đến hồi phục"] for d in ds]),
            "PPO học tiếp: điểm cuối": tb_lech([d["PPO học tiếp: điểm cuối"] for d in ds]),
            "Homeostat: điểm ngay sau hỏng": tb_lech([d["Homeostat: điểm ngay sau hỏng"] for d in ds]),
            "Homeostat: hồi phục": gom([d["Homeostat: bước đến hồi phục"] for d in ds]),
            "Homeostat: số lần nhảy nấc": tb_lech([d["Homeostat: số lần nhảy nấc"] for d in ds]),
            "Homeostat: điểm sau hồi phục": tb_lech([d["Homeostat: điểm sau hồi phục"] for d in ds]),
        }
    tho = {tt: [{"ppo_dong_bang": k[tt]["PPO đóng băng: điểm sau hỏng"], "ppo_duong": k[tt]["_ppo_duong"],
                 "hs_tap": k[tt]["_hs_tap"]} for k in tat_ca] for tt in TON_THUONG}
    luu_json("tn4_du_lieu_tho.json", tho)
    ve_hinh(tho)
    luu_json("tn4_can_bang_noi_moi.json", tom)
    return tom


if __name__ == "__main__":
    import pprint
    pprint.pprint(main())
