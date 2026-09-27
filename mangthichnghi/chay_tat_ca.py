"""Chạy lại toàn bộ 5 thí nghiệm; kết quả (json + png) nằm trong ketqua/."""
import tn1_hoc_lien_tuc
import tn2_chuoi_hon_loan
import tn3_tien_hoa
import tn4_can_bang_noi_moi
import tn5_physarum

if __name__ == "__main__":
    for tn in (tn1_hoc_lien_tuc, tn2_chuoi_hon_loan, tn3_tien_hoa, tn4_can_bang_noi_moi, tn5_physarum):
        print("=" * 20, tn.__name__)
        tn.main()
