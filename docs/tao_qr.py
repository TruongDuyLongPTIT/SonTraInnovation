"""Tạo mã QR cho 6 trạm + Cổng Bến và trang in QR (qr.html).
Chạy lại với địa chỉ thật sau khi đưa web lên mạng:  python3 tao_qr.py https://dia-chi-cua-ban/
"""
import sys, os, qrcode
BASE = (sys.argv[1] if len(sys.argv) > 1 else "https://truongduylongptit.github.io/SonTraInnovation/").rstrip("/") + "/"
os.makedirs("qr", exist_ok=True)
items = [("cong-ben", "Cổng Bến – Trang chủ Bến Số", "")] + \
        [(f"tram-{i}", f"Trạm {i}", f"#/tram/{i}") for i in range(1, 7)]
names = {1: "Vì sao thúng chai nổi?", 2: "Nút buộc của ngư dân", 3: "Con nước và mặt trăng",
         4: "Nhìn sao đi biển → GPS", 5: "Muối, cá và nước mắm", 6: "Hành trình chai nhựa ra biển"}
cards = []
for key, title, h in items:
    url = BASE + h
    qrcode.make(url, box_size=10, border=2).save(f"qr/{key}.png")
    sub = names.get(int(key.split("-")[1]), "") if key.startswith("tram") else "Bản đồ, Hải trình, Hòm ý tưởng"
    cards.append(f'<div class="c"><img src="qr/{key}.png" alt="QR {title}"><b>{title}</b><span>{sub}</span><small>{url}</small></div>')
open("qr.html", "w", encoding="utf-8").write(f"""<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Mã QR – Bến Số</title>
<style>body{{font-family:system-ui,sans-serif;margin:16px;color:#1d2a33}}h1{{font-size:20px}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}}
.c{{border:1px solid #ccc;border-radius:12px;padding:12px;text-align:center;break-inside:avoid}}
.c img{{width:100%;max-width:200px}}.c b{{display:block;font-size:17px;color:#023e8a}}.c span{{display:block}}
.c small{{display:block;color:#777;font-size:10px;word-break:break-all;margin-top:6px}}</style></head>
<body><h1>Mã QR các trạm – Bến Sáng Tạo Vũng Thùng</h1><p>In trang này để thử quét, hoặc dùng trong video demo.</p>
<div class="g">{''.join(cards)}</div></body></html>""")
print("QR ->", BASE)
