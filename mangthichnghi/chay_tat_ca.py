"""Chạy lại toàn bộ 6 thí nghiệm; kết quả (json + png) nằm trong ketqua/."""
import tn1_hoc_lien_tuc
import tn2_chuoi_hon_loan
import tn3_tien_hoa
import tn4_can_bang_noi_moi
import tn5_physarum
import tn6_mang_lai

if __name__ == "__main__":
    for tn in (tn1_hoc_lien_tuc, tn2_chuoi_hon_loan, tn3_tien_hoa, tn4_can_bang_noi_moi, tn5_physarum,
               tn6_mang_lai):
        print("=" * 20, tn.__name__)
        tn.main()
