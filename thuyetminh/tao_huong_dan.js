// Tạo "Tài liệu hướng dẫn trải nghiệm prototype" (.docx) – hình thức trực quan thay cho video mô phỏng.
// Chạy: NODE_PATH=<thư mục node_modules có docx> node tao_huong_dan.js
// Ảnh chụp màn hình lấy từ anh_huong_dan/ (tạo bằng chup_anh_huong_dan.js).
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, ImageRun, LevelFormat, BorderStyle, Footer, PageNumber, PageBreak,
} = require("docx");

const FONT = "Times New Roman";
const PAGE_W = 11906, MARGIN = 1134;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const IMG = (n) => fs.readFileSync(path.join(__dirname, "anh_huong_dan", n + ".jpg"));

const t = (text, o = {}) => new TextRun({ text, font: FONT, size: 26, ...o });
const para = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [t(runs)], spacing: { after: 120, line: 300 }, alignment: AlignmentType.JUSTIFIED, ...o });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: FONT, bold: true, size: 30, color: "0B3D2E" })], spacing: { before: 280, after: 140 } });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: FONT, bold: true, size: 27, color: "023E8A" })], spacing: { before: 220, after: 100 } });
const bullet = (runs) => new Paragraph({ numbering: { reference: "bul", level: 0 }, children: Array.isArray(runs) ? runs : [t(runs)], spacing: { after: 70, line: 290 } });
const num = (runs) => new Paragraph({ numbering: { reference: "num", level: 0 }, children: Array.isArray(runs) ? runs : [t(runs)], spacing: { after: 70, line: 290 } });
const fill = (text) => t(text, { shading: { type: ShadingType.CLEAR, fill: "FFF176", color: "auto" } });

const border = { style: BorderStyle.SINGLE, size: 4, color: "9AA5A0" };
const borders = { top: border, bottom: border, left: border, right: border };
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: none, bottom: none, left: none, right: none };

function table(widthsPct, rows) {
  const widths = widthsPct.map((p) => Math.round((CONTENT_W * p) / 100));
  widths[widths.length - 1] = CONTENT_W - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, ri) => new TableRow({
      tableHeader: ri === 0,
      children: r.map((c, ci) => new TableCell({
        width: { size: widths[ci], type: WidthType.DXA },
        borders,
        shading: ri === 0 ? { fill: "DCEBF5", type: ShadingType.CLEAR, color: "auto" } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [t(c, { size: 23, bold: ri === 0 })], spacing: { after: 40 } })],
      })),
    })),
  });
}

// Hàng ảnh chụp màn hình điện thoại, mỗi ảnh có chú thích bên dưới.
function shots(list) {
  const n = list.length;
  const w = Math.floor(CONTENT_W / n);
  const px = n === 3 ? 170 : 200;
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: Array(n).fill(w),
    rows: [new TableRow({
      children: list.map(([file, cap]) => new TableCell({
        width: { size: w, type: WidthType.DXA },
        borders: noBorders,
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "jpg", data: IMG(file), transformation: { width: px, height: px * 2 }, outline: { type: "solidFill", solidFillType: "rgb", value: "9AA5A0" } })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 160 }, children: [t(cap, { italics: true, size: 21, color: "555555" })] }),
        ],
      })),
    })],
  });
}

const step = (n, title) => new Paragraph({
  children: [new TextRun({ text: `BƯỚC ${n}  `, font: FONT, bold: true, size: 24, color: "FFFFFF", shading: { type: ShadingType.CLEAR, fill: "E4572E", color: "auto" } }), new TextRun({ text: "  " + title, font: FONT, bold: true, size: 28, color: "0B3D2E" })],
  spacing: { before: 280, after: 120 },
});
const tip = (text) => new Paragraph({ children: [t("Mẹo: " + text, { size: 23, italics: true })], shading: { type: ShadingType.CLEAR, fill: "EEF6FB", color: "auto" }, spacing: { before: 80, after: 160 }, indent: { left: 200, right: 200 } });

const c = [];

// ---------- Bìa ----------
c.push(
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("CUỘC THI Ý TƯỞNG CÔNG VIÊN ĐỔI MỚI SÁNG TẠO SƠN TRÀ 2026", { bold: true, size: 24, color: "555555" })], spacing: { after: 300 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("TÀI LIỆU HƯỚNG DẪN TRẢI NGHIỆM PROTOTYPE", { bold: true, size: 30 })], spacing: { after: 120 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("“SĂN KHO BÁU VŨNG THÙNG”", { bold: true, size: 42, color: "0B3D2E" })], spacing: { after: 60 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("Nền tảng số của ý tưởng Bến Sáng Tạo Vũng Thùng – Nơi nghề biển gặp công nghệ", { italics: true, size: 26, color: "023E8A" })], spacing: { after: 240 } }),
  para([t("Tài liệu này là “hình thức trực quan” đi kèm hồ sơ dự thi, thay cho video mô phỏng: hướng dẫn từng bước kèm ảnh chụp màn hình thật của prototype, để Ban Giám khảo có thể tự trải nghiệm trong khoảng 5–10 phút.", { italics: true })]),
  h2("Thông tin truy cập"),
  table([32, 68], [
    ["Mục", "Nội dung"],
    ["Địa chỉ prototype", "[link prototype]"],
    ["Trang in mã QR 6 trạm và rương", "[link prototype]qr.html"],
    ["Thiết bị", "Điện thoại hoặc máy tính, trình duyệt Chrome, Safari, Cốc Cốc, Edge… Không cần cài ứng dụng, không cần đăng ký."],
    ["Xem từ xa (không ở công viên)", "Vào mục Thêm → Chế độ trình diễn để giả lập việc quét mã tại từng trạm (xem Bước 3)."],
  ]),
  para([t("Nhóm tác giả: ", { bold: true }), fill("[Họ tên các thành viên]")], { spacing: { before: 160 } }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---------- Tổng quan ----------
c.push(
  h1("1. Prototype chứng minh điều gì?"),
  para("Prototype là một trang web chạy được trên điện thoại, mô phỏng trải nghiệm thật của người dân, học sinh và du khách tại công viên. Nó chứng minh ba ý tưởng cốt lõi của bài dự thi:"),
  table([28, 72], [
    ["Ý tưởng", "Người xem sẽ thấy"],
    ["Gắn với địa điểm thật", "Câu đố của mỗi trạm bị khóa cho tới khi người chơi đứng tại trạm và quét mã QR trên biển trạm. Không thể giải từ nhà – trò chơi kéo mọi người ra công viên."],
    ["Luôn mới, không nhàm chán", "Mỗi trạm có nhiều câu đố xoay vòng theo ngày; mỗi tháng là một “mùa” với chủ đề và mật mã rương mới. Có điểm thưởng khi quay lại, cấp bậc và quà nhỏ."],
    ["Khoa học từ chính nghề biển", "Mỗi câu đố xoay quanh một nét của làng cá (thúng chai, nút dây, con nước, nhìn sao, nước mắm, rác nhựa) và mở ra “Nhật ký khoa học” giải thích nguyên lý."],
    ["Cộng đồng cùng kiến tạo, có AI hỗ trợ", "Hòm ý tưởng để cư dân đề xuất, bình chọn; báo cáo mẫu cho thấy cách AI tổng hợp góp ý hằng tháng cho phường."],
  ]),
  h2("Xem nhanh trong 5 phút"),
  num("Mở trang chủ, đọc truyền thuyết rương báu (Bước 1)."),
  num("Bấm vào một trạm trên Hải đồ để thấy câu đố đang bị khóa (Bước 2)."),
  num("Vào Thêm → Chế độ trình diễn, bấm “Giả lập quét trạm 1” (Bước 3)."),
  num("Giải câu đố ổ khóa số, nhận mảnh hải đồ đầu tiên (Bước 4–5)."),
  num("Giả lập các trạm còn lại, ghép mật mã NGUDAN để mở rương (Bước 6–7)."),
  num("Xem Thẻ thủy thủ, Mùa chơi, Hòm ý tưởng và Báo cáo AI (Bước 8–10)."),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---------- Các bước ----------
c.push(
  h1("2. Hướng dẫn từng bước"),
  step(1, "Trang chủ – truyền thuyết rương báu"),
  para("Biển đêm chuyển động, trăng và chiếc thúng chai bồng bềnh. Truyền thuyết hiện dần: lão ngư Tư giấu một chiếc rương trên bãi đất và để lại 6 câu đố ở 6 trạm dọc lối đi hình con thuyền. Bên dưới là thẻ thủy thủ (điểm, cấp bậc), 6 ô chữ cái cần thu thập và 4 bước chơi."),
  shots([["01_home", "Trang chủ và truyền thuyết"], ["02_home_steps", "Thẻ thủy thủ, 6 ô mảnh hải đồ, cách chơi"]]),

  step(2, "Hải đồ kho báu – trạm chưa quét thì bị khóa"),
  para("Hải đồ vẽ lại đúng mặt bằng công viên: lối đi hình con thuyền, Giàn Thuyền Hoa Giấy, sân chơi, rương ở Cổng Bến. Các trạm chưa giải hiện dấu “?” nhấp nháy. Bấm vào một trạm khi chưa đến nơi sẽ thấy thông báo khóa: câu đố chỉ mở khi đứng tại trạm và quét mã."),
  shots([["04_map_locked", "Hải đồ: 6 trạm còn dấu “?”"], ["05_station_locked", "Câu đố bị khóa khi chưa quét mã tại trạm"]]),

  step(3, "Quét mã tại trạm (hoặc giả lập khi xem từ xa)"),
  para("Ngoài đời thật, mỗi trạm có một biển gỗ in mã QR và một mã ngắn (ví dụ B7TC). Người chơi quét bằng camera điện thoại, hoặc bấm nút Quét mã giữa thanh điều hướng, hoặc nhập mã ngắn. Ban Giám khảo không ở công viên có thể vào Thêm → Chế độ trình diễn để giả lập việc quét từng trạm."),
  shots([["06_scan", "Trang quét mã và ô nhập mã"], ["07_demo", "Chế độ trình diễn cho Ban Giám khảo"]]),
  tip("Mở trang qr.html trên máy tính rồi dùng điện thoại quét mã trên màn hình – trải nghiệm y như đứng tại trạm."),

  step(4, "Trạm mở – giải câu đố"),
  para("Quét đúng mã, la bàn xoay và câu đố hiện ra trên nền giấy cũ. Có ba dạng câu đố: chọn đáp án, ổ khóa số (phải tính toán) và mảnh giấy bị xé (sắp xếp thứ tự). Ví dụ trạm 1: tính khối lượng tối đa mà thúng chai chở được khi chiếm chỗ 0,3 m³ nước, rồi xoay ổ khóa thành 300."),
  shots([["08_unlocked_code", "Trạm 1 vừa mở – câu đố ổ khóa số"], ["09_code_entered", "Xoay các bánh số thành 3-0-0 và bấm Mở khóa"]]),

  step(5, "Nhận mảnh hải đồ và đọc Nhật ký khoa học"),
  para("Giải đúng: pháo giấy, điểm bay lên, người chơi nhận một mảnh hải đồ khắc chữ cái (trạm 1 là chữ N). Ngay bên dưới là Nhật ký khoa học giải thích nguyên lý (lực đẩy Archimedes), gợi ý thí nghiệm tại nhà và nút nghe đọc."),
  shots([["10_reward", "Mảnh hải đồ chữ N được thêm vào bộ sưu tập"], ["11_science", "Nhật ký khoa học và thí nghiệm tại nhà"]]),

  step(6, "Các dạng câu đố khác: trả lời sai, gợi ý, sắp xếp"),
  para("Trả lời sai sẽ được báo để thử lại. Có thể dùng gợi ý (trừ 30 điểm). Với dạng “mảnh giấy bị xé”, người chơi chạm lần lượt vào các mảnh theo đúng thứ tự – số thứ tự hiện ngay trên mảnh, chạm lại để bỏ chọn – rồi bấm Kiểm tra."),
  shots([["12_choice_wrong_hint", "Chọn sai (đỏ) và gợi ý đã mở"], ["13_order_partial", "Sắp xếp các bước làm nước mắm"]]),

  step(7, "Đủ 6 mảnh – mở rương báu ở Cổng Bến"),
  para("Sau 6 trạm, hải đồ hiện đủ 6 chữ cái. Người chơi đến Cổng Bến, quét mã rương và ghép các chữ thành mật mã theo câu gợi ý “Người ra khơi mỗi sớm, mang cá về cho cả làng”. Đáp án mùa 1: NGUDAN (NGƯ DÂN). Rương mở nắp, phát sáng, cộng 300 điểm."),
  shots([["14_map_full", "Hải đồ đủ 6 mảnh"], ["15_chest_locked", "Ghép mật mã từ 6 chữ"], ["16_chest_open", "Rương mở"]]),

  step(8, "Điểm, thẻ thủy thủ và các mùa chơi"),
  para("Thẻ thủy thủ dùng mã ngẫu nhiên, không ghi tên, lưu điểm và cấp bậc (Thủy thủ tập sự → Huyền thoại Vũng Thùng). Điểm đổi quà nhỏ tại buổi sinh hoạt cuối tuần. Trang Mùa chơi giải thích vì sao trò chơi luôn mới: câu đố đổi mỗi ngày, mùa mới mỗi tháng, giáo viên soạn chủ đề, AI hỗ trợ soạn nháp, con người duyệt. Trang chủ có đồng hồ đếm ngược tới mùa sau."),
  shots([["17_card", "Thẻ thủy thủ và cách tích điểm"], ["18_seasons", "Kho báu không bao giờ cạn"], ["03_home_seasons", "Đếm ngược tới mùa mới"]]),

  step(9, "Dành cho thầy cô và du khách"),
  para("Trang Lớp học ngoài trời gợi ý tiến trình 60–75 phút cho cả lớp, cách chia nhóm xoay vòng trạm và phiếu học tập in sẵn. Trang Visitors giới thiệu 6 trạm bằng tiếng Anh cho du khách."),
  shots([["19_teacher", "Lớp học ngoài trời cho giáo viên"], ["20_visitors", "Trang tiếng Anh cho du khách"]]),

  step(10, "Hòm ý tưởng và báo cáo AI hằng tháng"),
  para("Cư dân đề xuất hoạt động, cải tạo hay chủ đề mùa sau – không cần tên, số điện thoại – và bình chọn ý tưởng của người khác. Trang báo cáo mẫu cho thấy cách AI lọc, gom nhóm và tóm tắt góp ý thành một trang kèm việc cần làm, gửi tổ dân phố và phường; con người ra quyết định."),
  shots([["21_ideas", "Hòm ý tưởng và bình chọn"], ["22_report", "Báo cáo AI mẫu (dữ liệu minh họa)"]]),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---------- Mã trạm và đáp án ----------
c.push(
  h1("3. Mã trạm và đáp án Mùa 1 (dành cho Ban Giám khảo)"),
  para("Mỗi trạm có hai câu đố xoay vòng theo ngày; câu hiển thị phụ thuộc ngày xem. Bảng dưới đây giúp kiểm tra nhanh."),
  table([9, 11, 40, 40], [
    ["Trạm", "Mã", "Câu đố A (đáp án)", "Câu đố B (đáp án)"],
    ["1", "B7TC", "Khối thép và thân tàu rỗng → “Thân rỗng chiếm chỗ nhiều nước hơn…”", "Ổ khóa số → 300"],
    ["2", "K4ND", "Giữ thuyền bằng vài vòng dây → “Mỗi vòng dây quấn thêm làm ma sát tăng…”", "Thắt nút ghế đơn → Tạo vòng nhỏ → Luồn lên → Vòng ra sau → Luồn xuống"],
    ["3", "M9CN", "Trăng tròn, nước lớn → “Mặt Trời, Trái Đất, Mặt Trăng gần thẳng hàng…”", "Ổ khóa số → 15 (chấp nhận 14)"],
    ["4", "S2GP", "Độ cao sao Bắc Cực ở Đà Nẵng → “Khoảng 16°”", "Ổ khóa số → 16"],
    ["5", "N5NM", "Vì sao cá ướp muối không thối → “Muối rút nước…”", "Làm nước mắm → Đánh bắt → Trộn muối → Ủ chum → Rút nước cốt"],
    ["6", "R6CN", "Chai nhựa ra biển → Vứt bên đường → Cống → Sông → Biển", "Cách tốt nhất → “Phân loại rác tại nguồn…”"],
    ["Rương", "RUONG", "Mật mã: NGUDAN (NGƯ DÂN)", ""],
  ]),
  h1("4. Ghi chú kỹ thuật"),
  bullet("Web tĩnh (HTML, CSS, JavaScript), không cần máy chủ, chi phí lưu trữ gần như bằng không; chạy trên điện thoại và máy tính."),
  bullet("Không đăng nhập, không thu thập dữ liệu cá nhân: điểm, mảnh hải đồ, ý tưởng chỉ lưu trên thiết bị của người dùng. Nếu trình duyệt chặn lưu trữ, trò chơi vẫn chạy trong phiên hiện tại."),
  bullet("Quét mã trong trang dùng camera trên Chrome Android; trên iPhone dùng ứng dụng Camera có sẵn hoặc nhập mã ngắn."),
  bullet("Mã trạm mở câu đố trong 2 giờ, tránh việc giải từ xa. Khi vận hành thật, mã QR được đổi theo mùa và bổ sung một máy chủ nhỏ để tổng hợp góp ý, thống kê lượt chơi và quản lý đổi quà."),
  bullet("Dữ liệu ý tưởng, báo cáo AI và lịch hoạt động trong prototype là dữ liệu minh họa. Nội dung khoa học ở mức phổ thông, sẽ được giáo viên thẩm định trước khi triển khai."),
);

const doc = new Document({
  creator: "Nhóm tác giả Bến Sáng Tạo Vũng Thùng",
  title: "Hướng dẫn trải nghiệm prototype – Săn Kho Báu Vũng Thùng",
  styles: {
    default: { document: { run: { font: FONT, size: 26 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 30, bold: true }, paragraph: { outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 27, bold: true }, paragraph: { outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Săn Kho Báu Vũng Thùng – Hướng dẫn trải nghiệm prototype · Trang ", font: FONT, size: 20, color: "777777" }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20, color: "777777" }),
    ] })] }) },
    children: c,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, "Huong_dan_trai_nghiem_prototype.docx");
  fs.writeFileSync(out, buf);
  console.log("OK", out);
});
