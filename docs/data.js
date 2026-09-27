// Nội dung của nền tảng "Bến Số" – Bến Sáng Tạo Vũng Thùng.
// Nội dung khoa học viết ở mức phổ thông, cần giáo viên thẩm định trước khi dùng chính thức.

const STATIONS = [
  {
    id: 1,
    en: {"title": "Why does a basket boat float?", "subject": "Physics · Archimedes' principle", "text": "The round bamboo basket boat (thúng chai) is an icon of Vietnam's central coast. Fishermen use it to go between big boats and the shore. It floats because water pushes up on any object with a force equal to the weight of the water it displaces. The wide, hollow basket displaces a lot of water while staying light — the same reason huge steel ships float."},
    icon: "🛶",
    title: "Vì sao thúng chai nổi?",
    subject: "Vật lý · Lực đẩy Archimedes",
    story:
      "Thúng chai là chiếc thuyền tròn đan bằng tre, được trét kín cho nước không lọt vào. Ngư dân dùng thúng chai để đi từ thuyền lớn vào bờ và đánh bắt gần bờ. Nhìn chiếc thúng nhỏ bé nổi bồng bềnh, nhiều bạn nhỏ thắc mắc: vì sao nó không chìm?",
    science:
      "Mọi vật nhúng trong nước đều bị nước đẩy lên một lực bằng trọng lượng phần nước mà vật chiếm chỗ (nguyên lý Archimedes). Thúng chai rộng và lòng chứa nhiều không khí, nên chiếm chỗ rất nhiều nước trong khi bản thân lại nhẹ. Lực đẩy của nước lớn hơn trọng lượng thúng, vì vậy thúng nổi. Những con tàu bằng thép nặng hàng nghìn tấn cũng nổi được nhờ cùng nguyên lý này: thân tàu rỗng, chiếm chỗ một lượng nước rất lớn.",
    tryit:
      "Về nhà, dùng hai miếng giấy bạc bằng nhau: một miếng gấp thành chiếc 'thúng' tròn, một miếng vo thành cục. Thả cả hai vào chậu nước rồi đặt từng đồng xu vào chiếc 'thúng'. Cái nào nổi? Chiếc thúng chở được bao nhiêu đồng xu?",
    quiz: {
      q: "Vì sao con tàu bằng thép nặng hàng nghìn tấn vẫn nổi được trên biển?",
      options: [
        "Vì thép nhẹ hơn nước",
        "Vì thân tàu rỗng, chứa nhiều không khí nên chiếm chỗ rất nhiều nước",
        "Vì tàu luôn chạy nhanh",
      ],
      answer: 1,
    },
  },
  {
    id: 2,
    en: {"title": "Fishermen's knots", "subject": "Engineering · Friction", "text": "Mooring a boat, joining nets, hauling an anchor — each job needs its own knot: tight under load, easy to untie. Knots hold thanks to friction. Every extra turn of rope around a post multiplies the holding force, so one person holding the rope end lightly can keep a whole boat in place. Try tying a bowline at the practice post!"},
    icon: "➰",
    title: "Nút buộc của ngư dân",
    subject: "Kỹ thuật · Ma sát",
    story:
      "Buộc thuyền vào cọc, nối lưới, kéo neo – mỗi việc trên biển cần một kiểu nút riêng. Nút tốt phải thật chặt khi bị kéo nhưng lại dễ tháo khi cần. Người làng biển thắt nút nhanh đến mức nhìn không kịp.",
    science:
      "Nút dây giữ được là nhờ ma sát giữa các vòng dây với nhau và với cọc. Khi quấn dây quanh cọc, mỗi vòng quấn thêm lại làm lực ma sát tăng lên rất nhanh. Vì vậy chỉ cần quấn vài vòng quanh cọc, một người giữ nhẹ đầu dây cũng có thể giữ được cả con thuyền đang bị sóng kéo. Các kỹ sư cầu, cần cẩu, thang máy đều dùng nguyên lý này.",
    tryit:
      "Tại cọc tập nút của trạm, hãy thử thắt 'nút ghế đơn' theo hình hướng dẫn: tạo một vòng nhỏ, luồn đầu dây lên qua vòng, vòng ra sau thân dây rồi luồn ngược xuống. Kéo thử xem nút có tuột không!",
    quiz: {
      q: "Nếu quấn dây thêm nhiều vòng quanh cọc buộc thuyền thì sao?",
      options: [
        "Dây dễ tuột hơn",
        "Cần ít sức hơn để giữ con thuyền",
        "Không có gì thay đổi",
      ],
      answer: 1,
    },
  },
  {
    id: 3,
    en: {"title": "Tides and the Moon", "subject": "Physics · Tides", "text": "Fishermen read the tides to choose when to sail and when to land. Tides are mainly caused by the Moon's gravity, helped by the Sun. At new moon and full moon, Sun, Earth and Moon line up and the tides are strongest (spring tides); at half moon they are weaker (neap tides)."},
    icon: "🌕",
    title: "Con nước và mặt trăng",
    subject: "Vật lý · Thủy triều",
    story:
      "Người đi biển luôn để ý 'con nước': lúc nào nước lên, lúc nào nước ròng, để chọn giờ ra khơi và cập bến an toàn. Lịch con nước gắn chặt với lịch trăng – vì sao lại như vậy?",
    science:
      "Thủy triều sinh ra chủ yếu do lực hấp dẫn của Mặt Trăng kéo nước biển, cộng thêm một phần lực hút của Mặt Trời. Vào những ngày trăng non và trăng tròn, Mặt Trời – Trái Đất – Mặt Trăng gần như thẳng hàng, hai lực cộng lại nên nước lên cao hơn: đó là triều cường. Vào ngày trăng bán nguyệt, hai lực lệch nhau nên triều yếu hơn. Mỗi vùng biển có nhịp triều riêng tùy hình dạng bờ và đáy biển.",
    tryit:
      "Xoay đĩa 'con nước' tại trạm: đặt Mặt Trăng ở các vị trí khác nhau quanh Trái Đất và xem mực nước thay đổi thế nào. Tối nay nhìn lên trời xem trăng đang tròn hay khuyết nhé!",
    quiz: {
      q: "Triều cường (nước lớn) thường xảy ra vào những ngày nào?",
      options: ["Trăng tròn và trăng non", "Chỉ những ngày có bão", "Chỉ vào mùa hè"],
      answer: 0,
    },
  },
  {
    id: 4,
    en: {"title": "From stars to GPS", "subject": "Astronomy · Navigation technology", "text": "Sailors once found their way by the stars. The Pole Star sits almost still above the North, and its height above the horizon is roughly your latitude — about 16° here in Da Nang, so it sits low. Today a GPS receiver listens to at least four satellites and uses the signal travel time to work out where you are."},
    icon: "🧭",
    title: "Nhìn sao đi biển – từ la bàn đến GPS",
    subject: "Thiên văn · Công nghệ định vị",
    story:
      "Ngày xưa, giữa biển đêm mênh mông, người đi biển tìm hướng bằng sao, mặt trời và gió. Ngày nay, trên thuyền có la bàn, máy định vị vệ tinh và cả điện thoại thông minh. Công nghệ thay đổi, nhưng câu hỏi vẫn như cũ: 'Mình đang ở đâu?'",
    science:
      "Sao Bắc Cực nằm gần trục quay của Trái Đất nên gần như đứng yên trên bầu trời phía Bắc – nhìn thấy nó là biết hướng Bắc. Độ cao của sao Bắc Cực so với đường chân trời gần bằng vĩ độ nơi mình đứng; ở Đà Nẵng (khoảng 16 độ Bắc) sao Bắc Cực nằm khá thấp. La bàn dùng kim nam châm luôn chỉ theo từ trường Trái Đất. Còn máy GPS nhận tín hiệu từ nhiều vệ tinh, đo thời gian tín hiệu bay tới rồi tính ra vị trí; cần ít nhất 4 vệ tinh để biết chính xác vị trí và độ cao.",
    tryit:
      "Mở bản đồ trên điện thoại của bố mẹ và xem chấm xanh vị trí của bạn: đó là GPS đang làm việc! Tối trời quang, thử tìm chòm sao Bắc Đẩu để lần ra sao Bắc Cực.",
    quiz: {
      q: "Máy định vị GPS cần tín hiệu từ ít nhất bao nhiêu vệ tinh để biết vị trí và độ cao?",
      options: ["1 vệ tinh", "4 vệ tinh", "100 vệ tinh"],
      answer: 1,
    },
  },
  {
    id: 5,
    en: {"title": "Salt, fish and fish sauce", "subject": "Chemistry · Biology", "text": "Central Vietnam's coastal villages make fish sauce (nước mắm) by layering anchovies with salt and aging them for months. Salt draws water out of cells (osmosis), so spoilage bacteria cannot grow, while the fish's own enzymes slowly break proteins into amino acids — creating the rich, savoury flavour."},
    icon: "🐟",
    title: "Muối, cá và nước mắm",
    subject: "Hóa học · Sinh học",
    story:
      "Các làng biển miền Trung có nghề làm nước mắm truyền thống: cá cơm tươi được trộn muối theo tỉ lệ, ủ trong chum, thùng suốt nhiều tháng. Cá không hề bị thối mà dần hóa thành thứ nước màu cánh gián thơm ngon.",
    science:
      "Muối hút nước ra khỏi tế bào (hiện tượng thẩm thấu). Vi khuẩn gây thối cũng bị rút nước nên không sinh sôi được – đó là lý do cá ướp muối để được lâu. Trong khi đó, các enzyme có sẵn trong ruột và thịt cá vẫn âm thầm làm việc: chúng cắt nhỏ chất đạm thành các axit amin, tạo nên vị ngọt đậm và 'độ đạm' của nước mắm.",
    tryit:
      "Cắt hai lát dưa leo, rắc muối lên một lát. Sau 15 phút, lát nào 'ra nước'? Đó chính là thẩm thấu!",
    quiz: {
      q: "Vì sao cá ướp muối lại để được lâu, không bị hỏng?",
      options: [
        "Vì muối làm cá lạnh đi",
        "Vì muối rút nước, vi khuẩn gây thối khó sinh sôi",
        "Vì muối có màu trắng",
      ],
      answer: 1,
    },
  },
  {
    id: 6,
    en: {"title": "A plastic bottle's journey to the sea", "subject": "Environment · Waste sorting", "text": "A bottle dropped in the street can travel through drains and rivers to the sea, tangling nets and harming fish and turtles. Ordinary plastic does not rot; sunlight and waves break it into tiny microplastics that can last for centuries. Use less single-use plastic and sort your waste at the Gate."},
    icon: "🧴",
    title: "Hành trình chai nhựa ra biển",
    subject: "Môi trường · Phân loại rác",
    story:
      "Một chai nhựa vứt bên đường có thể theo cống thoát nước, trôi ra sông rồi ra biển. Ngoài khơi, rác nhựa vướng vào lưới, chân vịt, làm hại cá, rùa biển – và ảnh hưởng trực tiếp tới nghề biển của làng.",
    science:
      "Nhựa thông thường không bị vi sinh vật phân hủy như lá cây. Dưới nắng và sóng, nó chỉ vỡ dần thành những mảnh rất nhỏ gọi là vi nhựa, có thể tồn tại hàng trăm năm theo nhiều ước tính. Cá và sinh vật biển có thể ăn nhầm vi nhựa. Cách hiệu quả nhất là giảm dùng đồ nhựa một lần và phân loại rác ngay tại nguồn để nhựa được thu gom, tái chế.",
    tryit:
      "Ở Cổng Bến có thùng rác phân loại. Hôm nay bạn đã bỏ rác đúng thùng chưa? Hãy đếm xem cả nhà dùng bao nhiêu túi nilon trong một ngày.",
    quiz: {
      q: "Chai nhựa trôi ra biển thường sẽ ra sao?",
      options: [
        "Tan hết sau vài tuần",
        "Vỡ dần thành vi nhựa và tồn tại rất lâu",
        "Biến thành cát",
      ],
      answer: 1,
    },
  },
];

// Dữ liệu MINH HỌA cho Hòm ý tưởng (do nhóm tác giả soạn để mô tả cách hoạt động).
const SAMPLE_IDEAS = [
  { id: "s1", cat: "Hoạt động", text: "Tối thứ Bảy chiếu phim hoạt hình cho trẻ em trên bãi cỏ", votes: 42 },
  { id: "s2", cat: "Tiện ích", text: "Thêm ghế ngồi dưới bóng cây cho người lớn tuổi ở góc Lý Nhật Quang", votes: 35 },
  { id: "s3", cat: "Hoạt động", text: "Lớp thắt nút dây và kể chuyện nghề biển cho thiếu nhi mỗi Chủ nhật", votes: 28 },
  { id: "s4", cat: "Tiện ích", text: "Kệ đổi sách cũ ở Giàn Thuyền Hoa Giấy", votes: 21 },
  { id: "s5", cat: "An toàn", text: "Lối đi phía Lý Nhật Quang buổi tối hơi tối, nên thêm đèn", votes: 19 },
  { id: "s6", cat: "Hoạt động", text: "Triển lãm ảnh xưa Vũng Thùng do các gia đình góp", votes: 17 },
];

// Báo cáo MẪU: minh họa định dạng báo cáo tháng mà AI sẽ tạo từ góp ý của cư dân.
const SAMPLE_REPORT = {
  period: "Tháng mẫu (dữ liệu minh họa)",
  total: 57,
  valid: 51,
  filtered: 6,
  groups: [
    { name: "Hoạt động cộng đồng", count: 24, note: "Nhu cầu nổi bật: hoạt động buổi tối cuối tuần cho trẻ em (chiếu phim, kể chuyện)." },
    { name: "Tiện ích, cải tạo", count: 16, note: "Chủ yếu xin thêm ghế ngồi có bóng mát và kệ đổi sách." },
    { name: "An toàn, chiếu sáng", count: 7, note: "Tập trung ở lối đi phía đường Lý Nhật Quang buổi tối." },
    { name: "Khác", count: 4, note: "Góp ý về giờ sinh hoạt, vệ sinh sân chơi." },
  ],
  actions: [
    "Thử nghiệm 1 buổi chiếu phim tối thứ Bảy, kết thúc trước 21 giờ, âm lượng thấp.",
    "Kêu gọi doanh nghiệp tài trợ 4 ghế ngồi cho Góc thong thả.",
    "Kiểm tra chiếu sáng lối đi phía Lý Nhật Quang.",
  ],
  forwarded: "2 góp ý là phản ánh sự cố (hỏng thiết bị), đã hướng dẫn người gửi chuyển qua kênh 1022 của thành phố.",
};

const EVENTS = [
  { when: "Sáng Chủ nhật hằng tuần", what: "Săn Kho Báu cho thiếu nhi – giải 6 trạm, mở rương, đổi điểm lấy quà nhỏ", who: "Tình nguyện viên / Đoàn thanh niên (đề xuất)" },
  { when: "Tối thứ Bảy cuối tháng", what: "Chiếu phim hoạt hình AI của cuộc thi SIF trên Sân Bến (kết thúc trước 21:00)", who: "Phường phối hợp BTC SIF (đề xuất)" },
  { when: "Hằng quý", what: "Làm mới 'Bảng Đổi mới Sơn Trà' – sản phẩm STEM, tranh vẽ của học sinh, ảnh xưa do cư dân góp", who: "Trường học, UBND phường (đề xuất)" },
  { when: "Mỗi tháng một lần", what: "'Cuối tuần xanh' – nhặt rác, phân loại rác, trồng và chăm cây", who: "Cộng đồng khu dân cư (đề xuất)" },
];

const SPONSORS = [
  { item: "Cây bóng mát dải cây đệm (15 cây)", status: "Đang tìm người đỡ đầu" },
  { item: "Dụng cụ thể dục Góc thong thả", status: "Đang tìm người đỡ đầu" },
  { item: "Biển 6 trạm Hải trình STEM", status: "Đang tìm người đỡ đầu" },
  { item: "Giàn Thuyền Hoa Giấy – khung và hoa giấy", status: "Đang tìm người đỡ đầu" },
];

// Gợi ý tiết học ngoài trời cho giáo viên (khoảng 60–75 phút, lớp 25–35 học sinh).
const LESSON = {
  fit: "Phù hợp học sinh tiểu học cuối cấp và THCS; giáo viên điều chỉnh độ sâu kiến thức theo lớp.",
  steps: [
    { time: "10 phút", title: "Tập trung tại Sân Bến", text: "Giới thiệu làng cá Vũng Thùng và luật chơi. Chia lớp thành 6 nhóm, mỗi nhóm một điện thoại (của giáo viên hoặc phụ huynh đi cùng) hoặc một phiếu in. Kể cho các em truyền thuyết rương báu của lão ngư Tư." },
    { time: "35–45 phút", title: "Xoay vòng 6 trạm", text: "Mỗi nhóm bắt đầu ở một trạm khác nhau để tránh dồn ứ, dừng 6–7 phút/trạm: quét mã, cùng giải câu đố, ghi đáp án và chữ cái nhận được vào phiếu." },
    { time: "10 phút", title: "Tổng kết tại Giàn Thuyền Hoa Giấy / Sân Bến", text: "Các nhóm chia sẻ một điều bất ngờ nhất. Giáo viên chốt: mỗi nghề truyền thống đều ẩn chứa khoa học. Cả lớp ghép mật mã và cùng mở rương báu ở Cổng Bến." },
    { time: "Về nhà", title: "Thí nghiệm mở rộng", text: "Chọn một thí nghiệm 'Thử ngay' (thuyền giấy bạc, dưa leo và muối...) để làm ở nhà, chụp ảnh nộp lại cho giáo viên." },
  ],
  safety: [
    "Tập trung và di chuyển bên trong công viên, không đứng ở góc giao lộ.",
    "Học sinh không cần điện thoại riêng, không cần tài khoản; không thu thập thông tin học sinh.",
    "Nên đăng ký trước với ban quản lý để tránh trùng lịch với lớp khác (đề xuất).",
  ],
};
