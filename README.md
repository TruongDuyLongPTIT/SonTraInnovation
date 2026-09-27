# Bến Sáng Tạo Vũng Thùng – Nơi nghề biển gặp công nghệ

Hồ sơ ý tưởng dự thi **Cuộc thi Ý tưởng Công viên Đổi mới Sáng tạo Sơn Trà 2026**
(khu đất ~2.000 m², góc Ngô Thì Trí – Vũng Thùng 4 – Lý Nhật Quang).

- `sodo/` – sơ đồ mặt bằng phân khu (`so_do_mat_bang.png`), script vẽ, câu lệnh tạo ảnh phối cảnh AI.
- `docs/` – prototype web "Săn Kho Báu Vũng Thùng" (tĩnh, chạy được trên GitHub Pages), mã QR (`qr/`, `qr.html`).
- `thuyetminh/` – bản thuyết minh ý tưởng (.docx) và tài liệu hướng dẫn trải nghiệm prototype có ảnh chụp từng bước (thay cho video).

Chạy thử prototype: `cd docs && python3 -m http.server` rồi mở http://localhost:8000
Tạo lại QR khi có địa chỉ web thật: `cd docs && python3 tao_qr.py https://dia-chi-that/`
