// Tạo bản thuyết minh ý tưởng (.docx).  Chạy: NODE_PATH=<thư mục node_modules có docx> node tao_thuyet_minh.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, ImageRun, LevelFormat, BorderStyle, Footer, PageNumber, PageBreak,
} = require("docx");

const FONT = "Times New Roman";
const PAGE_W = 11906, MARGIN = 1134; // A4, lề 2 cm
const CONTENT_W = PAGE_W - 2 * MARGIN;

// ---------- tiện ích ----------
const t = (text, o = {}) => new TextRun({ text, font: FONT, size: 26, ...o });
const para = (runs, o = {}) =>
  new Paragraph({ children: Array.isArray(runs) ? runs : [t(runs)], spacing: { after: 120, line: 300 }, alignment: AlignmentType.JUSTIFIED, ...o });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: FONT, bold: true, size: 30, color: "0B3D2E" })], spacing: { before: 280, after: 140 } });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: FONT, bold: true, size: 27, color: "023E8A" })], spacing: { before: 200, after: 100 } });
const bullet = (runs) => new Paragraph({ numbering: { reference: "bul", level: 0 }, children: Array.isArray(runs) ? runs : [t(runs)], spacing: { after: 80, line: 290 }, alignment: AlignmentType.JUSTIFIED });
const num = (runs, ref = "num") => new Paragraph({ numbering: { reference: ref, level: 0 }, children: Array.isArray(runs) ? runs : [t(runs)], spacing: { after: 80, line: 290 }, alignment: AlignmentType.JUSTIFIED });
const fill = (text) => t(text, { shading: { type: ShadingType.CLEAR, fill: "FFF176", color: "auto" } });
const caption = (text) => new Paragraph({ alignment: AlignmentType.CENTER, children: [t(text, { italics: true, size: 22, color: "555555" })], spacing: { after: 200 } });

const border = { style: BorderStyle.SINGLE, size: 4, color: "9AA5A0" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(widthsPct, rows, headerFill = "DCEBF5") {
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
        shading: ri === 0 ? { fill: headerFill, type: ShadingType.CLEAR, color: "auto" } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: (Array.isArray(c) ? c : [c]).map((line) =>
          new Paragraph({ children: [typeof line === "string" ? t(line, { size: 23, bold: ri === 0 }) : line], spacing: { after: 40 } })),
      })),
    })),
  });
}
const gap = () => new Paragraph({ children: [], spacing: { after: 120 } });

// ---------- nội dung ----------
const img = fs.readFileSync(path.join(__dirname, "..", "sodo", "so_do_mat_bang.png"));
const children = [];

children.push(
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("CUỘC THI Ý TƯỞNG CÔNG VIÊN ĐỔI MỚI SÁNG TẠO SƠN TRÀ 2026", { bold: true, size: 24, color: "555555" })], spacing: { after: 60 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("Sơn Trà Innovation Fest 2026", { italics: true, size: 22, color: "555555" })], spacing: { after: 300 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("BẢN THUYẾT MINH Ý TƯỞNG", { bold: true, size: 30 })], spacing: { after: 120 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("BẾN SÁNG TẠO VŨNG THÙNG", { bold: true, size: 44, color: "0B3D2E" })], spacing: { after: 60 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [t("Nơi nghề biển gặp công nghệ", { italics: true, size: 30, color: "023E8A" })], spacing: { after: 240 } }),
  para([t("Khu đất dự thi: ", { bold: true }), t("khu đất khoảng 2.000 m² (theo Ban Tổ chức) tại góc giao các đường Ngô Thì Trí – Vũng Thùng 4 – Lý Nhật Quang, khu dân cư Làng cá Nại Hiên Đông, phường Sơn Trà, thành phố Đà Nẵng.")]),
  para([t("Nhóm nội dung dự thi: ", { bold: true }), t("Công năng mới · Hoạt động & trải nghiệm cộng đồng · Công viên xanh, sinh thái · Công viên thông minh · Bản sắc Sơn Trà · Xã hội hóa & vận hành.")]),
  h2("Thông tin tác giả / nhóm tác giả"),
  table([6, 30, 20, 26, 18], [
    ["TT", "Họ và tên", "Số điện thoại", "Email", "Đơn vị (nếu có)"],
    ["1", fill("[Họ tên – trưởng nhóm]"), fill("[SĐT]"), fill("[Email]"), fill("[Đơn vị]")],
    ["2", fill("[Họ tên thành viên]"), fill("[SĐT]"), fill("[Email]"), fill("[Đơn vị]")],
    ["3", fill("[Họ tên thành viên]"), fill("[SĐT]"), fill("[Email]"), fill("[Đơn vị]")],
  ]),
  para([t("Người đăng ký trên hệ thống của Ban Tổ chức: ", { italics: true }), fill("[Họ tên người điền form]")], { spacing: { before: 100, after: 100 } }),
  para([t("Sản phẩm kèm theo: ", { bold: true }), t("(1) Sơ đồ mặt bằng phân khu và ảnh phối cảnh minh họa; (2) Bản thuyết minh này; (3) Prototype nền tảng số “Bến Số” chạy được trên điện thoại tại địa chỉ: "), fill("[link prototype]"), t(" và video demo: "), fill("[link video]"), t(".")]),
  new Paragraph({ children: [new PageBreak()] }),
);

// 1. Tóm tắt
children.push(
  h1("1. Tóm tắt ý tưởng"),
  para("“Bến Sáng Tạo Vũng Thùng” biến khu đất trống 2.000 m² giữa khu dân cư làng cá thành một “bến” theo đúng nghĩa của làng biển: ngày thường là công viên xanh cho cả khu phố; cuối tuần là sân chơi sáng tạo; và luôn là nơi mà ý tưởng của cộng đồng “cập bến” để công viên được cải tiến liên tục."),
  para("Ý tưởng gồm ba lớp gắn chặt với nhau:"),
  num([t("Không gian xanh cho mọi người: ", { bold: true }), t("bãi cỏ đa năng “Sân Bến”, sân chơi “Thúng Chai” tái sử dụng vật liệu nghề biển, “Góc thong thả” cho người lớn tuổi, dải xanh thấp và vườn mưa dọc ranh giới phía sau.")], "num1"),
  num([t("Hải trình STEM Làng Cá: ", { bold: true }), t("6 trạm dọc lối đi vòng dành cho trẻ em, các lớp học ngoài trời và du khách; mỗi trạm kể một nét của nghề biển bằng ngôn ngữ khoa học – vì sao thúng chai nổi, nút buộc của ngư dân, con nước và mặt trăng, nhìn sao đi biển đến GPS, muối và nước mắm, hành trình chai nhựa ra biển. Trẻ em học khoa học từ chính nghề của ông bà mình.")], "num1"),
  num([t("Bến Số – nền tảng số có AI hỗ trợ: ", { bold: true }), t("quét mã QR là dùng được, không cần cài ứng dụng, không đăng nhập. Người dân đề xuất và bình chọn ý tưởng cho công viên; mỗi tháng AI lọc, gom nhóm và tóm tắt góp ý thành báo cáo một trang để tổ dân phố và phường ra quyết định.")], "num1"),
  para([t("Điểm cốt lõi: ", { bold: true }), t("chi phí thấp, không có thiết bị điện tử ngoài trời phải bảo trì, không cần người trực, đầu tư theo giai đoạn – nhưng mang đúng tinh thần “Công viên Đổi mới Sáng tạo” và chủ đề của Sơn Trà Innovation Fest 2026: “Công nghệ toàn cầu hội ngộ phong cách sống địa phương”.")]),
);

// 2. Bối cảnh
children.push(
  h1("2. Bối cảnh và đánh giá khu đất"),
  h2("2.1. Vị trí và hình dạng"),
  bullet("Khu đất nằm ở góc giao ba tuyến đường Ngô Thì Trí, Vũng Thùng 4 và Lý Nhật Quang, thuộc khu dân cư Làng cá Nại Hiên Đông – gần bến neo đậu Vũng Thùng, vịnh Mân Quang, cầu Thuận Phước và cảng Tiên Sa."),
  bullet("Theo số liệu Ban Tổ chức: diện tích khoảng 2.000 m²; các cạnh 82,12 m (phía sau, không giáp đường), 41,15 m (đường Ngô Thì Trí), 38,57 m (đường Vũng Thùng 4), 51,13 m (đường Lý Nhật Quang); góc Ngô Thì Trí – Vũng Thùng 4 được bo tròn."),
  bullet("Ba mặt tiếp giáp đường; cạnh dài 82 m phía sau không giáp đường, tiếp giáp các lô đất/công trình lân cận (hiện trạng sẽ được xác nhận khi khảo sát). Phương án được thiết kế để phù hợp dù phía sau là nhà ở hay đất trống: không che nắng, không gây ồn, không tạo góc khuất."),
  h2("2.2. Ai sẽ đến Bến, và họ cần gì?"),
  para("Khu đất nhỏ nhưng nằm ở vị trí giao thoa: giữa khu dân cư làng cá, gần bến neo đậu Vũng Thùng, cầu Thuận Phước, cảng Tiên Sa và các tuyến du lịch của bán đảo Sơn Trà. Vì vậy công viên cần phục vụ bốn nhóm người dùng, mỗi nhóm một nhu cầu khác nhau nhưng dùng chung một không gian:"),
  table([22, 38, 40], [
    ["Nhóm", "Nhu cầu", "Bến đáp ứng bằng"],
    ["Cư dân khu phố – trẻ em, người lớn tuổi, các gia đình (nhóm chính, dùng hằng ngày)", "Chỗ chơi an toàn cho trẻ gần nhà; chỗ đi bộ, tập thể dục, ngồi nghỉ có bóng mát; không gian sinh hoạt chung của khu phố.", "Sân chơi Thúng Chai nhìn thấy từ vỉa hè; lối đi vòng ~135 m; Góc thong thả; bãi cỏ Sân Bến cho sinh hoạt cộng đồng; Hòm ý tưởng để chính cư dân quyết định công viên thay đổi thế nào."],
    ["Giáo viên và học sinh các trường lân cận (theo đoàn, theo lịch)", "Địa điểm học ngoài lớp gần trường, an toàn, không tốn phí, có nội dung gắn với chương trình khoa học và giáo dục địa phương.", "Hải trình STEM 6 trạm; gợi ý tiết học 60–75 phút; phiếu học tập in sẵn; học sinh không cần điện thoại riêng hay tài khoản; nhóm đủ 6 huy hiệu nhận chứng nhận."],
    ["Du khách trong nước và quốc tế (ghé thăm theo tuyến khám phá làng biển)", "Trải nghiệm văn hóa làng biển chân thực, ngắn gọn, miễn phí; thông tin có tiếng Anh.", "Hành trình tự khám phá 20–30 phút; nội dung tiếng Anh cho 6 trạm; điểm check-in thúng chai; lời nhắc tôn trọng sự yên tĩnh của khu dân cư."],
    ["Cộng đồng đổi mới sáng tạo – sinh viên, startup, các trường", "Nơi giới thiệu dự án, thử nghiệm ý tưởng với cộng đồng thật.", "Bảng Đổi mới Sơn Trà trưng bày luân phiên; workshop cuối tuần ở Nhà Thuyền; chiếu phim hoạt hình AI của cuộc thi SIF."],
  ]),
  para([t("Một buổi sáng ở Bến có thể trông như thế này: ", { bold: true, italics: true }), t("6 giờ, các cụ tập thể dục ở Góc thong thả; 9 giờ, cô giáo dẫn một lớp đến, chia 6 nhóm, mỗi nhóm bắt đầu ở một trạm – nhóm này cãi nhau vì sao thúng chai nổi, nhóm kia tập thắt nút ghế đơn; 10 giờ, một gia đình du khách đi hết hải trình bằng tiếng Anh rồi chụp ảnh bên thúng chai; chiều tối, trẻ em khu phố ra Sân chơi Thúng Chai, còn bố mẹ bình chọn ý tưởng “chiếu phim tối thứ Bảy” trên điện thoại.", { italics: true })]),
  para("Điểm chung của cả bốn nhóm là bản sắc làng cá – thúng chai, bến thuyền, con nước, nghề nước mắm. Đây là “tài sản có sẵn” hiếm có, nhưng thế hệ trẻ ngày càng ít cơ hội tiếp xúc. Bến biến tài sản đó thành nội dung học tập và trải nghiệm, đúng tinh thần một “Công viên Đổi mới Sáng tạo”: đổi mới không phải bằng thiết bị đắt tiền, mà bằng cách làm mới cách cộng đồng học, chơi và cùng quyết định về không gian của mình."),
  h2("2.3. Nguyên tắc thiết kế rút ra"),
  table([30, 70], [
    ["Nguyên tắc", "Cách thể hiện"],
    ["Ưu tiên sinh hoạt hằng ngày", "Mọi không gian được thiết kế trước hết cho người dân dùng mỗi ngày. Các sự kiện cuối tuần (workshop, chiếu phim) tận dụng lại chính bãi cỏ và Nhà Thuyền, không xây công trình riêng chỉ để làm sự kiện."],
    ["Tôn trọng các lô đất lân cận", "Hoạt động ồn đặt sát mặt đường; dọc cạnh 82 m chỉ trồng cây bụi, hoa thấp (≤ 2 m) để không che nắng, không cản gió; cây bóng mát bố trí phía mặt đường; hoạt động kết thúc trước 21:00."],
    ["An toàn giao thông", "Góc giao lộ để tam giác tầm nhìn chỉ trồng cỏ, cây bụi thấp dưới 0,6 m; cổng lùi vào trong."],
    ["Rẻ, bền, dễ bảo trì", "Không có thiết bị điện tử ngoài trời, không có mặt nước đọng; công nghệ đặt ở điện thoại người dùng."],
    ["Bản sắc thật", "Lấy chính nghề biển của khu dân cư làm chất liệu cho không gian, sân chơi và nội dung giáo dục."],
  ]),
  new Paragraph({ children: [new PageBreak()] }),
);

// 3. Phương án phân khu
children.push(
  h1("3. Phương án không gian"),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: img, transformation: { width: 640, height: 384 } })] }),
  caption("Hình 1. Sơ đồ mặt bằng phân khu (dựng theo số đo các cạnh do Ban Tổ chức cung cấp; sơ đồ ý tưởng, không phải bản vẽ kỹ thuật)."),
  table([22, 24, 12, 42], [
    ["Khu", "Vị trí", "Diện tích (≈)", "Công năng"],
    ["Cổng Bến", "Góc Ngô Thì Trí – Vũng Thùng 4, lùi khỏi góc giao lộ", "110 m²", "Quảng trường nhỏ; bảng bản đồ số và mã QR; “Bảng Đổi mới Sơn Trà” trưng bày luân phiên dự án học sinh, startup; thùng rác phân loại."],
    ["Sân Bến", "Phía Ngô Thì Trí, phần rộng nhất", "480 m²", "Bãi cỏ đa năng: vui chơi, tập thể dục hằng ngày; cuối tuần tổ chức workshop STEM, “Cuối tuần xanh”, chiếu phim hoạt hình."],
    ["Nhà Thuyền (GĐ2)", "Cạnh Sân Bến, trong vòng lối đi", "40 m²", "Giàn che lắp ghép, mái cong như thuyền úp: bóng mát, chỗ workshop, kệ đổi sách. Kết cấu nhẹ, tháo lắp được; triển khai khi được phường chấp thuận."],
    ["Sân chơi Thúng Chai", "Dọc đường Vũng Thùng 4", "210 m²", "Thúng chai đã xử lý dùng làm viền hố cát (có nắp đậy) và bồn cây; khung leo lưới dây đạt chuẩn an toàn tạo dáng lưới cá. Phụ huynh quan sát được từ vỉa hè."],
    ["Góc thong thả", "Phía Lý Nhật Quang, phần hẹp, yên tĩnh", "135 m²", "Dụng cụ thể dục ngoài trời cho người lớn tuổi, bàn cờ, ghế dưới bóng cây."],
    ["Dải xanh thấp + vườn mưa", "Dọc cạnh 82 m phía sau", "325 m²", "Cây bụi, hoa, cỏ cao không quá 2 m – tạo ranh giới mềm mà không che nắng, không cản gió tới các lô đất lân cận; hai vườn mưa trũng nhẹ thấm nước trong ≤ 48 giờ, chống ngập cục bộ."],
    ["Lối đi Hải trình", "Vòng quanh Sân Bến và nhánh ra Lý Nhật Quang, dài ~135 m", "340 m²", "Lối đi thấm nước, rộng ~2,5 m cho xe lăn, xe đẩy; 6 trạm STEM dọc lối đi; nối với 5 lối vào từ 3 mặt đường."],
    ["Phần còn lại", "Xen giữa các khu", "~370 m²", "Thảm cỏ, cây bụi thấp; cây bóng mát đặt dọc mặt đường và quanh sân chơi, góc thong thả."],
  ]),
  para([t("Ghi chú: ", { italics: true }), t("diện tích đo trên sơ đồ, làm tròn; tổng theo số đo cạnh xấp xỉ 2.000–2.200 m² do sơ đồ của Ban Tổ chức không theo tỉ lệ. Loài cây cụ thể sẽ do đơn vị chuyên môn cây xanh lựa chọn.", { italics: true, size: 23 })], { spacing: { before: 100 } }),
  h2("Ảnh phối cảnh minh họa"),
  para([fill("[Chèn ảnh phối cảnh 01 – Toàn cảnh]")]),
  caption("Hình 2. Toàn cảnh Bến Sáng Tạo Vũng Thùng (ảnh minh họa được tạo bằng công cụ AI)."),
  para([fill("[Chèn ảnh phối cảnh 02 – Cổng Bến nhìn từ ngã ba]")]),
  caption("Hình 3. Cổng Bến và tam giác tầm nhìn giao thông (ảnh minh họa được tạo bằng công cụ AI)."),
  para([fill("[Chèn ảnh phối cảnh 03 – Sân chơi Thúng Chai và trạm STEM]")]),
  caption("Hình 4. Sân chơi Thúng Chai và một trạm Hải trình STEM (ảnh minh họa được tạo bằng công cụ AI)."),
);

// 4. Hải trình STEM
children.push(
  h1("4. Hải trình STEM Làng Cá"),
  para("Mỗi trạm gồm: biển thấp vừa tầm mắt trẻ em bằng vật liệu bền (gỗ xử lý/composite), một chi tiết tương tác cơ học đơn giản (không dùng điện, không dùng nước), phần tóm tắt in trực tiếp trên biển cho người không dùng điện thoại, và mã QR mở nội dung đầy đủ trên Bến Số (bài đọc, nghe đọc, thí nghiệm tại nhà, câu đố nhận huy hiệu)."),
  table([6, 26, 22, 46], [
    ["#", "Trạm", "Kiến thức", "Chi tiết tương tác tại trạm"],
    ["1", "Vì sao thúng chai nổi?", "Vật lý: lực đẩy Archimedes", "Mô hình thúng chai cắt đôi thấy lòng rỗng chứa không khí; gợi ý thí nghiệm thuyền giấy bạc ở nhà."],
    ["2", "Nút buộc của ngư dân", "Kỹ thuật: ma sát, lực kéo", "Cọc tập nút có dây cố định, hình hướng dẫn thắt nút ghế đơn."],
    ["3", "Con nước và mặt trăng", "Vật lý: thủy triều", "Đĩa xoay Mặt Trăng quanh Trái Đất, cửa sổ hiện mức nước tương ứng."],
    ["4", "Nhìn sao đi biển → GPS", "Thiên văn, công nghệ định vị", "Bản đồ sao khắc nổi, chỉ vị trí sao Bắc Cực; so sánh la bàn – GPS."],
    ["5", "Muối, cá và nước mắm", "Hóa học, sinh học", "Hình minh họa hiện tượng thẩm thấu; câu chuyện nghề nước mắm miền Trung."],
    ["6", "Hành trình chai nhựa ra biển", "Môi trường, phân loại rác", "Sơ đồ đường đi của rác từ phố ra biển; gắn với thùng rác phân loại ở Cổng Bến."],
  ]),
  para([t("Giá trị: ", { bold: true }), t("biến công viên thành lớp học ngoài trời cho các trường lân cận; giữ gìn ký ức nghề biển theo cách hấp dẫn thế hệ trẻ; hoàn thành 6 trạm nhận giấy chứng nhận “Nhà Thám Hiểm Bến Sáng Tạo” (không ghi tên, không lưu thông tin cá nhân). Nội dung khoa học viết ở mức phổ thông và sẽ được giáo viên thẩm định trước khi triển khai.")], { spacing: { before: 120 } }),
);

// 5. Bến Số và AI
children.push(
  h1("5. Bến Số – nền tảng số và vai trò của AI"),
  h2("5.1. Chức năng"),
  table([28, 72], [
    ["Chức năng", "Mô tả"],
    ["Bản đồ số, Hải trình", "Quét QR tại cổng hoặc tại trạm để xem bản đồ, nội dung 6 trạm, nghe đọc, làm câu đố, thu thập huy hiệu (lưu trên máy người dùng)."],
    ["Lớp học ngoài trời", "Trang riêng cho giáo viên: gợi ý tiết học 60–75 phút, cách chia nhóm xoay vòng trạm, lưu ý an toàn, phiếu học tập in sẵn."],
    ["Du khách (tiếng Anh)", "Giới thiệu và nội dung 6 trạm bằng tiếng Anh; chuyển ngôn ngữ VI/EN ngay trên trang."],
    ["Hòm ý tưởng và bình chọn", "Người dân đề xuất hoạt động, hạng mục cải tạo và bình chọn ý tưởng của người khác – không cần tên, không đăng nhập."],
    ["Báo cáo AI hằng tháng", "AI lọc, gom nhóm, tóm tắt góp ý thành báo cáo một trang cho tổ dân phố, ban quản lý và phường."],
    ["Lịch hoạt động", "Công khai lịch sinh hoạt cộng đồng, Hải trình Chủ nhật, “Cuối tuần xanh”, các buổi chiếu phim."],
    ["Đỡ đầu cây xanh, thiết bị", "Danh sách hạng mục cần tài trợ và ghi nhận người đỡ đầu bằng một dòng chữ nhỏ – không biển quảng cáo."],
    ["Báo sự cố", "Hướng dẫn phản ánh qua tổng đài 1022 của thành phố – không tạo kênh xử lý trùng lặp."],
  ]),
  h2("5.2. AI được dùng ở đâu, và không dùng ở đâu"),
  bullet([t("Tổng hợp ý kiến cộng đồng: ", { bold: true }), t("mỗi tháng, các góp ý (đã loại bỏ thông tin cá nhân) được đưa cho một mô hình ngôn ngữ lớn để: lọc nội dung rác, xúc phạm, quảng cáo; gom các ý giống nhau và đếm mức độ quan tâm; nhận diện góp ý thực chất là sự cố để hướng dẫn chuyển sang 1022; viết báo cáo một trang kèm đề xuất việc cần làm. AI không cần dữ liệu huấn luyện riêng, không cần cảm biến; chi phí xử lý vài trăm góp ý mỗi tháng rất thấp.")]),
  bullet([t("Sản xuất nội dung: ", { bold: true }), t("AI hỗ trợ vẽ tranh minh họa, tạo bản nháp, đọc giọng nói; mọi nội dung đều được con người biên tập, kiểm tra trước khi công bố.")]),
  bullet([t("Không dùng chatbot trả lời tự do ", { bold: true }), t("cho công chúng, để tránh thông tin sai về lịch sử, văn hóa, tín ngưỡng. AI chỉ đề xuất; con người quyết định.")]),
  h2("5.3. Quyền riêng tư và bảo vệ dữ liệu"),
  bullet("Không đăng nhập, không thu thập dữ liệu của trẻ em; huy hiệu và chứng nhận không ghi tên."),
  bullet("Form góp ý nhắc người dùng không ghi thông tin cá nhân và tự chặn nội dung có số điện thoại, email."),
  bullet("Khi vận hành chính thức: tuân thủ quy định pháp luật về bảo vệ dữ liệu cá nhân; nội dung do cư dân đóng góp (như ảnh xưa) chỉ đăng khi có sự đồng ý của người sở hữu và qua kiểm duyệt; có cơ chế yêu cầu gỡ."),
  h2("5.4. Prototype đã thực hiện"),
  para([t("Nhóm đã xây dựng bản mẫu Bến Số chạy được trên điện thoại (web tĩnh, không cần máy chủ): trang chủ có bản đồ tương tác và lối vào riêng cho trẻ em, giáo viên, du khách, cư dân; 6 trạm với nội dung, nghe đọc, câu đố, huy hiệu và giấy chứng nhận; Hòm ý tưởng với gửi và bình chọn; báo cáo AI mẫu (dữ liệu minh họa); trang lớp học ngoài trời và phiếu học tập in; trang tiếng Anh cho du khách; lịch hoạt động; đỡ đầu; báo sự cố; trang in mã QR cho từng trạm. Địa chỉ: "), fill("[link prototype]"), t(".")]),
);

// 6. Vận hành
children.push(
  h1("6. Hoạt động, vận hành và xã hội hóa"),
  h2("6.1. Công viên vận hành được mà không cần người trực"),
  para("Toàn bộ không gian và các trạm STEM hoạt động độc lập; phần số là web tĩnh với chi phí lưu trữ gần như bằng không. Các hoạt động cộng đồng dưới đây là phần cộng thêm – nếu tạm dừng, công viên vẫn phục vụ bình thường."),
  table([28, 44, 28], [
    ["Thời gian", "Hoạt động", "Đơn vị có thể tham gia (đề xuất)"],
    ["Sáng Chủ nhật hằng tuần", "Hải trình STEM cho thiếu nhi, lớp thắt nút, kể chuyện nghề biển", "Đoàn thanh niên, tình nguyện viên, trường học"],
    ["Tối thứ Bảy cuối tháng", "Chiếu phim hoạt hình (ưu tiên phim của cuộc thi “Làm phim hoạt hình bằng AI” – SIF), kết thúc trước 21:00", "UBND phường, Ban Tổ chức SIF"],
    ["Hằng quý", "Làm mới “Bảng Đổi mới Sơn Trà”: dự án học sinh, sinh viên, startup", "Trường học, trung tâm hỗ trợ khởi nghiệp"],
    ["Hằng tháng", "“Cuối tuần xanh”: nhặt rác, phân loại rác, chăm cây", "Cộng đồng khu dân cư"],
    ["Hằng tháng", "Đọc báo cáo AI, chọn 1–3 việc cải tiến", "Tổ dân phố, ban quản lý công viên, UBND phường"],
  ]),
  h2("6.2. Mô hình hợp tác Nhà nước – cộng đồng – doanh nghiệp"),
  bullet([t("Nhà nước (UBND phường): ", { bold: true }), t("chủ quản khu đất, phê duyệt phương án, đầu tư hạng mục nền (cỏ, cây, lối đi), đọc báo cáo và quyết định cải tiến.")]),
  bullet([t("Doanh nghiệp: ", { bold: true }), t("đỡ đầu cây xanh, dụng cụ thể dục, biển trạm STEM, giàn che; hỗ trợ nền tảng số (có thể mời các đơn vị đồng hành của Sơn Trà Innovation Fest). Được ghi nhận minh bạch trên Bến Số và bằng một dòng chữ nhỏ tại hiện vật.")]),
  bullet([t("Cộng đồng, trường học: ", { bold: true }), t("góp ý, bình chọn, tham gia hoạt động, dùng công viên làm lớp học ngoài trời.")]),
);

// 7. Lộ trình, chi phí
children.push(
  h1("7. Lộ trình triển khai và nguyên tắc chi phí"),
  table([18, 50, 32], [
    ["Giai đoạn", "Hạng mục", "Ghi chú"],
    ["Giai đoạn 1", "San nền, thảm cỏ, cây xanh, lối đi thấm nước, sân chơi Thúng Chai, 6 trạm STEM, Cổng Bến, thùng rác phân loại, ra mắt Bến Số", "Tạo được công viên hoàn chỉnh để sử dụng ngay"],
    ["Giai đoạn 2", "Nhà Thuyền (giàn che lắp ghép), dụng cụ thể dục, đèn năng lượng mặt trời chiếu xuống lối đi, kệ đổi sách", "Ưu tiên nguồn xã hội hóa, triển khai khi được chấp thuận"],
    ["Liên tục", "Cải tiến theo báo cáo góp ý hằng tháng, làm mới nội dung STEM và Bảng Đổi mới", "Chi phí vận hành phần số gần như bằng không"],
  ]),
  para("Nguyên tắc giữ chi phí hợp lý:", { spacing: { before: 120, after: 60 } }),
  bullet("Không có thiết bị điện tử ngoài trời (màn hình, cảm biến, camera) – tránh chi phí đầu tư, điện năng và bảo trì."),
  bullet("Tái sử dụng vật liệu nghề biển (thúng chai đã xử lý) làm điểm nhấn thay cho công trình, tượng đài đắt tiền."),
  bullet("Không có mặt nước trang trí; vườn mưa dùng đất và cây, không cần bơm."),
  bullet("Phần số dùng web tĩnh; AI chỉ chạy một lần mỗi tháng trên lượng văn bản nhỏ."),
  para([t("Dự toán chi tiết sẽ do đơn vị chuyên môn lập theo đơn giá hiện hành khi phương án được lựa chọn.", { italics: true })]),
);

// 8. Đáp ứng nội dung BTC
children.push(
  h1("8. Đáp ứng các nhóm nội dung của cuộc thi"),
  table([28, 72], [
    ["Nhóm nội dung", "Thể hiện trong ý tưởng"],
    ["Công năng mới", "Học tập (Hải trình STEM), vui chơi, thể thao, đọc sách (kệ đổi sách), triển lãm – khởi nghiệp, khoa học công nghệ (Bảng Đổi mới Sơn Trà)."],
    ["Hoạt động & trải nghiệm cộng đồng", "Hải trình Chủ nhật, chiếu phim cuối tháng, “Cuối tuần xanh”, kể chuyện nghề biển, hoạt động trẻ em."],
    ["Công viên xanh, sinh thái", "Dải xanh thấp, cây bóng mát bản địa, vườn mưa, lối đi thấm nước, đèn năng lượng mặt trời, phân loại rác, tái sử dụng thúng chai."],
    ["Công viên thông minh", "Bản đồ số, mã QR, ứng dụng số không cần cài đặt, AI tổng hợp dữ liệu góp ý, kết nối kênh phản ánh 1022."],
    ["Bản sắc Sơn Trà", "Văn hóa biển, nghề cá, thúng chai, nghề nước mắm, câu chuyện làng cá Vũng Thùng."],
    ["Xã hội hóa & vận hành", "Đỡ đầu cây xanh, thiết bị; hợp tác Nhà nước – cộng đồng – doanh nghiệp; cộng đồng cùng quyết định cải tiến qua Hòm ý tưởng."],
  ]),
);

// 9. Điểm mới
children.push(
  h1("9. Điểm mới so với các mô hình đã có"),
  para("Nhóm tác giả nhận thức rằng từng thành phần riêng lẻ đã xuất hiện ở nơi khác. Điểm mới của ý tưởng nằm ở cách kết hợp và ở cơ chế vận hành:"),
  table([34, 66], [
    ["Mô hình đã có", "Điểm mới của Bến Sáng Tạo Vũng Thùng"],
    ["Gắn mã QR thông tin cho cây xanh, hiện vật, bảo tàng (cung cấp thông tin một chiều)", "QR là cửa vào một hành trình học tập có câu đố, huy hiệu, chứng nhận; nội dung là di sản nghề biển của chính khu dân cư, kể bằng ngôn ngữ khoa học."],
    ["Sân chơi, dụng cụ thể dục tiêu chuẩn", "Sân chơi mang bản sắc (thúng chai, lưới cá) nhưng dùng thiết bị đạt chuẩn an toàn; gắn với trạm STEM."],
    ["Hòm thư góp ý, kênh phản ánh sự cố", "Hòm ý tưởng để cùng thiết kế công viên, có bình chọn; AI tổng hợp thành báo cáo hành động hằng tháng; sự cố được chuyển về kênh 1022 sẵn có."],
    ["Công viên thiết kế một lần rồi giữ nguyên", "Công viên được cải tiến liên tục theo ý kiến cộng đồng; nội dung được làm mới từ các cuộc thi, trường học, startup của địa phương."],
  ]),
);

// 10. Rủi ro
children.push(
  h1("10. Rủi ro và giải pháp phòng tránh"),
  table([30, 70], [
    ["Rủi ro", "Giải pháp"],
    ["Ảnh hưởng tới các lô đất lân cận (che nắng, tiếng ồn, ánh sáng)", "Dọc ranh giới phía sau chỉ trồng cây thấp ≤ 2 m, cây tán lớn đặt phía mặt đường; hoạt động ồn đặt sát mặt đường; kết thúc trước 21:00; đèn thấp chiếu xuống."],
    ["Mất an toàn giao thông tại góc ngã ba", "Tam giác tầm nhìn chỉ trồng cỏ, cây bụi < 0,6 m; cổng lùi vào; lối vào có vỉa hè đệm."],
    ["An toàn trẻ em ở sân chơi", "Thúng chai chỉ làm viền hố cát, bồn cây, ghế – không làm chỗ leo; khung leo đạt tiêu chuẩn an toàn; hố cát có nắp; nền cát/cỏ giảm chấn."],
    ["Muỗi, nước đọng", "Không có mặt nước trang trí; vườn mưa thiết kế thấm hết trong ≤ 48 giờ."],
    ["Cây gãy đổ mùa mưa bão", "Chọn cây bản địa chịu gió, không giòn gãy; cây lớn chỉ trồng phía mặt đường, cách xa ranh giới lô đất lân cận; cắt tỉa định kỳ."],
    ["Góc khuất, mất an ninh ban đêm", "Cây bụi thấp, cây cao tán cao, tầm nhìn thông thoáng; chiếu sáng lối đi."],
    ["Nội dung sai lệch, thiếu chính xác", "Không dùng chatbot tự do; nội dung khoa học do giáo viên thẩm định, nội dung văn hóa – tín ngưỡng chỉ giới thiệu, được phường duyệt."],
    ["Lộ dữ liệu cá nhân", "Không đăng nhập, không thu dữ liệu trẻ em, chặn số điện thoại/email trong góp ý, ẩn thông tin trước khi đưa cho AI."],
    ["Quảng cáo trá hình trong không gian công cộng", "Chỉ ghi nhận tài trợ bằng một dòng chữ nhỏ; không biển quảng cáo, không voucher thương mại."],
    ["Ít người dùng Bến Số", "Tóm tắt in sẵn trên biển trạm; gắn với hoạt động trường học và Hải trình Chủ nhật."],
    ["Hỏng biển trạm, mất mã QR", "Biển rẻ, dễ thay; địa chỉ web ngắn in kèm; tên miền do phường quản lý."],
  ]),
);

// 11. Nhân rộng
children.push(
  h1("11. Khả năng nhân rộng"),
  para("Mô hình được thiết kế thành một “khung” có thể áp dụng cho các khu đất trống, công viên nhỏ khác, đúng tinh thần “Mỗi công viên một ý tưởng”:"),
  bullet("Giữ nguyên nền tảng Bến Số và cơ chế Hòm ý tưởng – báo cáo AI; chỉ thay nội dung các trạm theo câu chuyện của từng nơi (ví dụ: làng nghề, di tích, hệ sinh thái bán đảo Sơn Trà)."),
  bullet("Có thể phát triển thành mạng lưới “Hải trình khoa học Sơn Trà” nối nhiều công viên, phục vụ học sinh và du khách."),
  bullet("Dữ liệu góp ý tích lũy giúp phường hiểu nhu cầu thực tế của cư dân khi quy hoạch các không gian công cộng tiếp theo."),
);

// 12. Cam kết
children.push(
  h1("12. Cam kết của tác giả"),
  bullet("Ý tưởng do nhóm tác giả xây dựng, không sao chép ý tưởng, thiết kế, sản phẩm của tổ chức, cá nhân khác."),
  bullet("Ảnh phối cảnh là ảnh minh họa được tạo bằng công cụ AI; sơ đồ mặt bằng và prototype do nhóm tác giả thực hiện. Không sử dụng hình ảnh, logo có bản quyền của bên thứ ba."),
  bullet("Nội dung khoa học được biên soạn ở mức phổ thông từ kiến thức phổ biến; sẽ được chuyên gia, giáo viên thẩm định trước khi triển khai."),
  bullet("Nhóm tác giả sẵn sàng phối hợp với Ban Tổ chức, UBND phường Sơn Trà để hoàn thiện phương án nếu ý tưởng được lựa chọn."),
  gap(),
  para([t("Đà Nẵng, ngày ", {}), fill("[..]"), t(" tháng 9 năm 2026")], { alignment: AlignmentType.RIGHT }),
  para([t("Đại diện nhóm tác giả", { bold: true })], { alignment: AlignmentType.RIGHT }),
  para([fill("[Họ và tên]")], { alignment: AlignmentType.RIGHT }),
);

const doc = new Document({
  creator: "Nhóm tác giả Bến Sáng Tạo Vũng Thùng",
  title: "Thuyết minh ý tưởng – Bến Sáng Tạo Vũng Thùng",
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
      { reference: "num1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1)", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Bến Sáng Tạo Vũng Thùng – Thuyết minh ý tưởng · Trang ", font: FONT, size: 20, color: "777777" }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20, color: "777777" }),
      ] })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, "Thuyet_minh_Ben_Sang_Tao_Vung_Thung.docx");
  fs.writeFileSync(out, buf);
  console.log("OK", out);
});
