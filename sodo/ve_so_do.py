"""Vẽ sơ đồ mặt bằng phân khu 'Bến Sáng Tạo Vũng Thùng' theo kích thước cạnh BTC cung cấp.
Hệ tọa độ (m): gốc tại đỉnh A (góc nhọn phía Lý Nhật Quang), x sang phải, y xuống dưới.
"""
import math, cairosvg

S = 13          # px / m
OX, OY = 90, 215  # lề trái / trên (px)

A = (0.0, 12.79); B = (42.55, 41.15); C = (81.12, 41.15); D = (81.12, 0.0)
R = 6.0  # bán kính bo góc C

def p(x, y): return (OX + x * S, OY + y * S)
def pts(poly): return " ".join(f"{p(x,y)[0]:.1f},{p(x,y)[1]:.1f}" for x, y in poly)
def area(poly):
    s = 0
    for i in range(len(poly)):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % len(poly)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2
def top(x): return 12.79 * (1 - x / 81.12)          # cạnh sau A-D
def lnq(x): return 12.79 + 28.36 * x / 42.55          # cạnh Lý Nhật Quang A-B

# ---- ranh giới khu đất (bo góc C) ----
cx, cy = p(C[0] - R, C[1]); ex, ey = p(C[0], C[1] - R)
boundary = (f"M{p(*A)[0]},{p(*A)[1]} L{p(*B)[0]},{p(*B)[1]} L{cx},{cy} "
            f"A{R*S},{R*S} 0 0 0 {ex},{ey} L{p(*D)[0]},{p(*D)[1]} Z")

# ---- các khu ----
buffer_poly = [(x, top(x)) for x in (0, 81.12)] + [(81.12, 4.2), (6, top(6) + 4.2)]
buffer_poly = [(0, 12.79), (81.12, 0), (81.12, 4.2), (8, top(8) + 4.2)]
lawn = [(47, 10.2), (70, 6.8), (75.5, 12), (74.5, 24.5), (66, 26.3), (47, 25.8)]
pavilion_c, pav_rx, pav_ry = (41.5, 19.2), 5.75, 2.6
play = [(44.5, 29.5), (66, 29.5), (66, 39.2), (44.5, 39.2)]
plaza = [(67.5, 28.5), (78.5, 28.5), (78.5, 35.3), (73.5, 39.2), (67.5, 39.2)]
rest = [(17, 21.6), (30, 26.6), (42.5, 29.4), (42.5, 39.3), (30, 31.4), (17, 23.3)]
sight = [(73.12, 41.15), (81.12, 33.15), (81.12, 41.15)]
path_pts = [(35, 13.2), (50, 10.0), (68, 6.8), (76.6, 10.5), (77.4, 20), (74.5, 26.8), (60, 28.0),
            (44, 27.8), (35.5, 25.2), (32.2, 19), (35, 13.2)]
spur_pts = [(32.2, 19), (22, 19.4), (10.3, 19.65)]
def smooth(ptsl, closed=True):
    P = ptsl[:-1] if closed else ptsl
    n = len(P); d = ""
    for i in range(n if closed else n - 1):
        p0 = P[(i - 1) % n] if closed or i > 0 else P[i]; p1 = P[i]; p2 = P[(i + 1) % n]
        p3 = P[(i + 2) % n] if closed or i + 2 < n else P[i + 1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        X = lambda q: f"{p(*q)[0]:.1f},{p(*q)[1]:.1f}"
        if i == 0: d += f"M{X(p1)} "
        d += f"C{X(c1)} {X(c2)} {X(p2)} "
    return d + ("Z" if closed else "")
path_len = sum(math.dist(path_pts[i], path_pts[i + 1]) for i in range(len(path_pts) - 1)) + \
           sum(math.dist(spur_pts[i], spur_pts[i + 1]) for i in range(len(spur_pts) - 1))
rain = [((31, 11.8), 4.0, 1.4), ((61, 5.4), 4.5, 1.2)]
stations = [(1, (51, 27.9)), (2, (37.2, 28.2)), (3, (22, 17.2)), (4, (46, 8.6)),
            (5, (70.5, 4.6)), (6, (79.6, 21))]

trees = [(46, 38.2), (52, 38.2), (64.5, 38.2), (79.6, 25), (79.6, 17), (79.6, 9), (22, 26.2),
         (26.5, 28.8), (40.5, 36.5), (45, 24), (66, 9.8), (48.5, 13), (74.3, 16), (29.5, 21.9)]
shrubs = [(3 + i * 5.4, top(3 + i * 5.4) + 2.0) for i in range(15)]
site_area = area([A, B, C, D]) - (R * R - math.pi * R * R / 4)
A_lawn = area(lawn); A_play = area(play); A_plaza = area(plaza); A_rest = area(rest)
A_buf = area(buffer_poly); A_pav = 2 / 3 * 11.5 * 5.2
A_path = path_len * 2.5

# ---- vẽ ----
W, H = 1600, 960
o = []
o.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
         'font-family="DejaVu Sans">')
o.append('<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
         '<line x1="0" y1="0" x2="0" y2="8" stroke="#c0392b" stroke-width="2" opacity=".55"/></pattern>'
         '<pattern id="sand" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#b8860b" opacity=".5"/></pattern></defs>')
o.append(f'<rect width="{W}" height="{H}" fill="#fbfaf6"/>')

# đường phố
def road(poly, name, lx, ly, rot):
    o.append(f'<polygon points="{pts(poly)}" fill="#d9d9d9"/>')
    x, y = p(lx, ly)
    o.append(f'<text x="{x}" y="{y}" font-size="17" fill="#555" font-weight="bold" text-anchor="middle" '
             f'transform="rotate({rot} {x} {y})">{name}</text>')
road([(30, 43.4), (90, 43.4), (90, 51.4), (30, 51.4)], "ĐƯỜNG VŨNG THÙNG 4", 60, 48.6, 0)
road([(83.4, -8), (91.4, -8), (91.4, 51.4), (83.4, 51.4)], "ĐƯỜNG NGÔ THÌ TRÍ", 88.4, 22, 90)
n = (-0.555, 0.832)
def off(pt, d): return (pt[0] + n[0] * d, pt[1] + n[1] * d)
a0, b0 = (A[0] - 12 * 0.832, A[1] - 12 * 0.555), (B[0] + 6 * 0.832, B[1] + 6 * 0.555)
road([off(a0, 2.2), off(b0, 2.2), off(b0, 10.2), off(a0, 10.2)], "ĐƯỜNG LÝ NHẬT QUANG", 17.2, 34.8, 33.7)
# nhà dân phía sau
o.append(f'<polygon points="{pts([(-6,12.79+0.5),(81.12,-0.3),(81.12,-5.5),(-6,-5.5)])}" fill="#ece6dc"/>')
x, y = p(38, -1.2)
o.append(f'<text x="{x}" y="{y}" font-size="15" fill="#8a7f70" text-anchor="middle" transform="rotate(-9 {x} {y})">'
         'CÁC LÔ ĐẤT / CÔNG TRÌNH LÂN CẬN (hiện trạng cần xác nhận)</text>')

# nền khu đất
o.append(f'<path d="{boundary}" fill="#e8f3df"/>')
o.append(f'<polygon points="{pts(buffer_poly)}" fill="#cfe8b0" stroke="#8fbf6a" stroke-dasharray="4 3"/>')
for (c, rx, ry) in rain:
    x, y = p(*c)
    o.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx*S}" ry="{ry*S}" fill="#8ecae6" stroke="#219ebc" stroke-width="1.5"/>')
o.append(f'<polygon points="{pts(lawn)}" fill="#b5e48c" stroke="#76a35a" stroke-width="1.5"/>')
o.append(f'<polygon points="{pts(rest)}" fill="#f6d6a8" stroke="#c9975b" stroke-width="1.5"/>')
o.append(f'<polygon points="{pts(play)}" fill="#ffe8a3" stroke="#d4a017" stroke-width="1.5"/>')
o.append(f'<polygon points="{pts(play)}" fill="url(#sand)"/>')
o.append(f'<polygon points="{pts(plaza)}" fill="#e0dcd3" stroke="#8d8577" stroke-width="1.5"/>')
o.append(f'<polygon points="{pts(sight)}" fill="url(#hatch)"/>')
cx0, cy0 = pavilion_c
L, Wd = 11.5, 5.2
hull = f"M{p(cx0-L/2, cy0)[0]},{p(cx0-L/2, cy0)[1]} Q{p(cx0, cy0-Wd)[0]},{p(cx0, cy0-Wd)[1]} {p(cx0+L/2, cy0)[0]},{p(cx0+L/2, cy0)[1]} Q{p(cx0, cy0+Wd)[0]},{p(cx0, cy0+Wd)[1]} {p(cx0-L/2, cy0)[0]},{p(cx0-L/2, cy0)[1]} Z"
o.append(f'<path d="{hull}" fill="#f4a261" stroke="#9c4a1a" stroke-width="2.5" stroke-dasharray="7 4"/>')
for k in (-3, -1, 1, 3):
    a, b = p(cx0 + k, cy0 - 2.3), p(cx0 + k, cy0 + 2.3)
    o.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="#9c4a1a" stroke-width="1.2" opacity=".6"/>')
# thúng chai trong sân chơi
for tx, ty in [(48.5, 34.5), (53.5, 32.5), (58, 36), (62.5, 33)]:
    x, y = p(tx, ty)
    o.append(f'<circle cx="{x}" cy="{y}" r="{1.3*S}" fill="#a47148" stroke="#5e3b1e" stroke-width="2"/>')
    o.append(f'<circle cx="{x}" cy="{y}" r="{0.8*S}" fill="#ffe08a"/>')
# lối đi vòng
o.append(f'<path d="{smooth(path_pts)}" fill="none" stroke="#d8c7a3" stroke-width="{2.5*S}" stroke-linejoin="round"/>')
o.append(f'<path d="{smooth(spur_pts, False)}" fill="none" stroke="#d8c7a3" stroke-width="{2.2*S}" stroke-linecap="round"/>')
for q in [((70, 28), (70, 41.15)), ((75.5, 27), (79, 30.5), (81.12, 30.5)), ((40, 27), (41, 39.8)),
          ((77.4, 14), (81.12, 14))]:
    o.append(f'<polyline points="{pts(list(q))}" fill="none" stroke="#d8c7a3" stroke-width="{2.2*S}" stroke-linecap="round" stroke-linejoin="round"/>')
# cây
for tx, ty in trees:
    x, y = p(tx, ty)
    o.append(f'<circle cx="{x}" cy="{y}" r="{1.9*S}" fill="#2d6a4f" opacity=".85"/>')
    o.append(f'<circle cx="{x}" cy="{y}" r="3" fill="#1b4332"/>')
for tx, ty in shrubs:
    x, y = p(tx, ty)
    o.append(f'<circle cx="{x}" cy="{y}" r="{0.9*S}" fill="#90be6d"/><circle cx="{x+9}" cy="{y+4}" r="{0.6*S}" fill="#f28482"/>')
# trạm STEM
for num, (sx, sy) in stations:
    x, y = p(sx, sy)
    o.append(f'<circle cx="{x}" cy="{y}" r="14" fill="#0077b6" stroke="#fff" stroke-width="2.5"/>')
    o.append(f'<text x="{x}" y="{y+6}" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle">{num}</text>')
# viền khu đất
o.append(f'<path d="{boundary}" fill="none" stroke="#c0392b" stroke-width="3"/>')

# nhãn khu
def label(txt, x, y, size=15, color="#222", w="bold"):
    X, Y = p(x, y)
    for i, line in enumerate(txt.split("\n")):
        o.append(f'<text x="{X}" y="{Y + i*(size+3)}" font-size="{size}" font-weight="{w}" fill="{color}" text-anchor="middle">{line}</text>')
label("SÂN BẾN\nbãi cỏ đa năng", 61, 16.5, 16)
label("NHÀ THUYỀN\n(GĐ2)", 41.5, 19.0, 11)
label("SÂN CHƠI THÚNG CHAI", 55.2, 30.9, 13)
label("CỔNG BẾN", 73, 31.2, 13)
label("Bảng ĐMST + bản đồ số", 73, 33.0, 10, "#333", "normal")
label("GÓC\nTHONG THẢ", 33, 32.0, 12)
label("DẢI XANH THẤP + VƯỜN MƯA", 22, 12.2, 12, "#3a5a2a")
# kích thước cạnh
def dim(txt, x, y, rot):
    X, Y = p(x, y)
    o.append(f'<text x="{X}" y="{Y}" font-size="14" fill="#c0392b" font-weight="bold" text-anchor="middle" '
             f'transform="rotate({rot} {X} {Y})">{txt}</text>')
dim("82,12 m", 40, 5.5, -9)
dim("41,15 m", 82.6, 22, 90)
dim("38,57 m", 62, 42.6, 0)
dim("51,13 m", 19.8, 28.8, 33.7)

# tiêu đề
o.append('<text x="40" y="48" font-size="30" font-weight="bold" fill="#0b3d2e">BẾN SÁNG TẠO VŨNG THÙNG — SƠ ĐỒ MẶT BẰNG PHÂN KHU</text>')
o.append('<text x="40" y="80" font-size="17" fill="#444">Công viên Đổi mới Sáng tạo Sơn Trà · Khu đất góc Ngô Thì Trí – Vũng Thùng 4 – Lý Nhật Quang · '
         'S = 2.000 m² (theo BTC)</text>')

# chú giải
LX, LY = 1245, 215
o.append(f'<rect x="{LX-20}" y="{LY-40}" width="370" height="700" rx="10" fill="#fff" stroke="#ccc"/>')
o.append(f'<text x="{LX}" y="{LY-10}" font-size="19" font-weight="bold" fill="#0b3d2e">CHÚ GIẢI</text>')
items = [
    ("#e0dcd3", "Cổng Bến (lùi khỏi góc giao lộ)", f"~{A_plaza:.0f} m²"),
    ("#b5e48c", "Sân Bến – bãi cỏ đa năng", f"~{A_lawn:.0f} m²"),
    ("#f4a261", "Nhà Thuyền – giàn che (GĐ2)", f"~{A_pav:.0f} m²"),
    ("#ffe8a3", "Sân chơi Thúng Chai", f"~{A_play:.0f} m²"),
    ("#f6d6a8", "Góc thong thả (thể dục, bàn cờ)", f"~{A_rest:.0f} m²"),
    ("#cfe8b0", "Dải xanh thấp (bụi, hoa ≤ 2 m)", f"~{A_buf:.0f} m²"),
    ("#8ecae6", "Vườn mưa (thấm ≤ 48 giờ)", ""),
    ("#d8c7a3", f"Lối đi Hải trình (~{path_len:.0f} m)", f"~{A_path:.0f} m²"),
]
y = LY + 22
for col, name, ar in items:
    o.append(f'<rect x="{LX}" y="{y-15}" width="26" height="20" fill="{col}" stroke="#666"/>')
    o.append(f'<text x="{LX+36}" y="{y}" font-size="14" fill="#222">{name}</text>')
    if ar: o.append(f'<text x="{LX+330}" y="{y}" font-size="14" fill="#555" text-anchor="end">{ar}</text>')
    y += 34
o.append(f'<rect x="{LX}" y="{y-15}" width="26" height="20" fill="url(#hatch)" stroke="#666"/>')
o.append(f'<text x="{LX+36}" y="{y}" font-size="14" fill="#222">Tam giác tầm nhìn giao thông:</text>')
o.append(f'<text x="{LX+36}" y="{y+18}" font-size="14" fill="#222">chỉ trồng cỏ, cây bụi &lt; 0,6 m</text>')
y += 52
o.append(f'<circle cx="{LX+13}" cy="{y-5}" r="12" fill="#2d6a4f"/>')
o.append(f'<text x="{LX+36}" y="{y}" font-size="14" fill="#222">Cây bóng mát – bố trí phía mặt đường</text>')
y += 40
o.append(f'<text x="{LX}" y="{y}" font-size="16" font-weight="bold" fill="#0077b6">HẢI TRÌNH STEM LÀNG CÁ</text>')
y += 26
for num, name in [(1, "Vì sao thúng chai nổi?"), (2, "Nút buộc của ngư dân"), (3, "Con nước và mặt trăng"),
                  (4, "Nhìn sao đi biển → GPS"), (5, "Muối, cá và nước mắm"), (6, "Hành trình chai nhựa ra biển")]:
    o.append(f'<circle cx="{LX+13}" cy="{y-5}" r="11" fill="#0077b6"/>')
    o.append(f'<text x="{LX+13}" y="{y}" font-size="13" font-weight="bold" fill="#fff" text-anchor="middle">{num}</text>')
    o.append(f'<text x="{LX+36}" y="{y}" font-size="14" fill="#222">{name}</text>')
    y += 28
y += 8
for line in ["Mỗi trạm: biển thấp tầm trẻ em + chi tiết", "tương tác cơ học (không điện, không nước)",
             "+ mã QR mở nền tảng số “Bến Số”."]:
    o.append(f'<text x="{LX}" y="{y}" font-size="13" fill="#444">{line}</text>'); y += 19

# thước tỉ lệ
x0, y0 = p(0, 47)
o.append(f'<rect x="{x0}" y="{y0}" width="{10*S}" height="8" fill="#333"/><rect x="{x0+10*S}" y="{y0}" width="{10*S}" height="8" fill="#fff" stroke="#333"/>')
o.append(f'<text x="{x0}" y="{y0+26}" font-size="13">0</text><text x="{x0+10*S}" y="{y0+26}" font-size="13" text-anchor="middle">10</text>'
         f'<text x="{x0+20*S}" y="{y0+26}" font-size="13" text-anchor="middle">20 m</text>')
o.append(f'<text x="40" y="{H-22}" font-size="13" fill="#666">Ghi chú: dựng theo số đo các cạnh do BTC cung cấp; sơ đồ BTC không theo tỉ lệ nên hình dạng có thể lệch nhẹ. '
         f'Diện tích tính theo số đo cạnh ≈ {site_area:,.0f} m². Sơ đồ ý tưởng, không phải bản vẽ kỹ thuật.</text>'.replace("2,208", "2.208"))
o.append('</svg>')

svg = "\n".join(o)
open("so_do_mat_bang.svg", "w", encoding="utf-8").write(svg)
cairosvg.svg2png(bytestring=svg.encode(), write_to="so_do_mat_bang.png", output_width=W * 2)
print(f"site≈{site_area:.0f}, lawn {A_lawn:.0f}, play {A_play:.0f}, plaza {A_plaza:.0f}, rest {A_rest:.0f}, "
      f"buffer {A_buf:.0f}, pav {A_pav:.0f}, path {path_len:.0f}m/{A_path:.0f}m2")
