// Dữ liệu trò chơi "Săn Kho Báu Vũng Thùng".
// Mỗi MÙA (1 tháng) có bộ câu đố và mật mã kho báu riêng. Trong một mùa, mỗi trạm có nhiều câu đố
// xoay vòng theo ngày, nên quay lại hôm sau sẽ gặp câu khác.
// Nội dung câu đố do giáo viên biên soạn (có thể dùng AI hỗ trợ soạn nháp) và được duyệt trước khi phát hành.

// Mã in dưới mỗi mã QR tại trạm. Mã QR trỏ tới #/q/<mã>. Khi vận hành thật, mã được đổi theo mùa.
const STATION_CODES = { B7TC: 1, K4ND: 2, M9CN: 3, S2GP: 4, N5NM: 5, R6CN: 6 };
const CHEST_CODE = "RUONG";

const LEGEND =
  "Người làng kể rằng lão ngư Tư – tay chèo thúng giỏi nhất bến Vũng Thùng – đã giấu một chiếc rương gỗ ngay trên bãi đất này. " +
  "Lão không để lại bản đồ, chỉ để lại 6 câu đố ở 6 trạm dọc lối đi hình con thuyền. Giải đúng mỗi câu, bạn nhận một mảnh hải đồ " +
  "khắc một chữ cái. Ghép đủ 6 chữ thành mật mã, mang đến Cổng Bến để mở rương!";

const RANKS = [
  { min: 0, name: "Thủy thủ tập sự", icon: "🐚" },
  { min: 300, name: "Ngư dân trẻ", icon: "🎣" },
  { min: 800, name: "Thuyền phó", icon: "⚓" },
  { min: 1500, name: "Thuyền trưởng", icon: "🧭" },
  { min: 3000, name: "Huyền thoại Vũng Thùng", icon: "🐋" },
];

const POINTS = { solve: 100, noHint: 50, hintCost: 30, dailyReturn: 30, chest: 300 };

const REWARDS = [
  { pts: 300, item: "Nhãn dán “Thủy thủ Vũng Thùng”" },
  { pts: 800, item: "Huy hiệu cài áo hình thúng chai" },
  { pts: 1500, item: "Tên được ghi trên Bảng Thuyền Trưởng của mùa" },
];

const SEASONS = [
  {
    id: "s1",
    name: "Mùa 1 · Bí mật Thúng Chai",
    period: "Tháng 10/2026",
    active: true,
    word: "NGUDAN",
    wordHint: "Người ra khơi mỗi sớm, mang cá về cho cả làng.",
    wordReveal: "NGƯ DÂN",
    letters: { 1: "N", 2: "G", 3: "U", 4: "D", 5: "A", 6: "N" },
    puzzles: {
      1: [
        {
          type: "choice",
          q: "Một khối thép 1 tấn thả xuống biển thì chìm nghỉm. Nhưng cũng 1 tấn thép ấy, gò thành thân tàu rỗng thì lại nổi. Bí mật nằm ở đâu?",
          options: ["Thép gò mỏng thì nhẹ đi", "Thân rỗng chiếm chỗ nhiều nước hơn nên lực đẩy của nước lớn hơn", "Tàu được sơn chống nước"],
          answer: 1,
          hint: "Nước đẩy vật lên bằng trọng lượng phần nước bị vật chiếm chỗ.",
        },
        {
          type: "code",
          q: "Ổ khóa số của lão Tư: một thúng chai chiếm chỗ tối đa 0,3 m³ nước trước khi nước tràn vào. Ở nước ngọt, 1 m³ nước nặng 1.000 kg. Thúng (tính cả người và cá) nặng tối đa bao nhiêu kg mà vẫn nổi?",
          answer: ["300"],
          digits: 3,
          hint: "Lực đẩy tối đa = trọng lượng của 0,3 m³ nước.",
        },
      ],
      2: [
        {
          type: "choice",
          q: "Sóng kéo mạnh con thuyền, vậy mà ông Tư chỉ giữ hờ đầu dây đã quấn vài vòng quanh cọc. Vì sao thuyền không trôi?",
          options: ["Mỗi vòng dây quấn thêm làm lực ma sát giữ tăng lên gấp nhiều lần", "Cọc có nam châm", "Dây thấm nước nên dính vào cọc"],
          answer: 0,
          hint: "Nghĩ tới ma sát giữa dây và cọc.",
        },
        {
          type: "order",
          q: "Mảnh giấy của lão Tư bị xé vụn. Hãy xếp lại đúng thứ tự các bước thắt “nút ghế đơn” – nút buộc thuyền quen thuộc:",
          items: ["Tạo một vòng nhỏ trên thân dây", "Luồn đầu dây từ dưới lên qua vòng nhỏ", "Vòng đầu dây ra sau thân dây", "Luồn đầu dây ngược xuống qua vòng nhỏ rồi kéo chặt"],
          hint: "Người đi biển hay nhớ: “con thỏ chui lên khỏi hang, vòng quanh gốc cây, rồi chui xuống hang”.",
        },
      ],
      3: [
        {
          type: "choice",
          q: "Đêm nay trăng tròn vằng vặc. Ông Tư dặn cả xóm: “Sáng mai nước lớn, kéo thuyền lên cao!”. Ông dựa vào đâu?",
          options: ["Trăng tròn thì trời sẽ mưa", "Mặt Trời, Trái Đất, Mặt Trăng gần thẳng hàng, lực hút cộng lại gây triều cường", "Trăng tròn làm gió mạnh hơn"],
          answer: 1,
          hint: "Thủy triều sinh ra chủ yếu do lực hấp dẫn của Mặt Trăng và Mặt Trời.",
        },
        {
          type: "code",
          q: "Mặt Trăng mất khoảng 29,5 ngày để đi hết một vòng từ trăng non tới trăng non. Triều cường xảy ra cả lúc trăng non lẫn trăng tròn. Hai lần triều cường liên tiếp cách nhau khoảng bao nhiêu ngày? (làm tròn)",
          answer: ["15", "14"],
          digits: 2,
          hint: "Một chu kỳ trăng có hai lần triều cường.",
        },
      ],
      4: [
        {
          type: "choice",
          q: "Đêm không trăng, ông Tư ngẩng nhìn sao Bắc Cực để tìm hướng. Ở Đà Nẵng (khoảng 16° vĩ Bắc), ông phải nhìn cao bao nhiêu so với đường chân trời?",
          options: ["Ngay trên đỉnh đầu (90°)", "Khoảng 16°, khá thấp", "Không thể thấy sao Bắc Cực ở Việt Nam"],
          answer: 1,
          hint: "Độ cao sao Bắc Cực gần bằng vĩ độ nơi bạn đứng.",
        },
        {
          type: "code",
          q: "Mật mã la bàn: lấy số vệ tinh TỐI THIỂU mà máy GPS cần để biết vị trí và độ cao, nhân với số hướng chính trên la bàn (Đông, Tây, Nam, Bắc).",
          answer: ["16"],
          digits: 2,
          hint: "GPS cần ít nhất 4 vệ tinh.",
        },
      ],
      5: [
        {
          type: "choice",
          q: "Bà Tư ướp cá cơm với muối, ủ suốt mấy tháng mà cá không hề thối, lại thành nước mắm thơm. Vì sao?",
          options: ["Muối rút nước khỏi tế bào nên vi khuẩn gây thối không sinh sôi được", "Chum đậy kín nên không có không khí", "Cá cơm vốn không bao giờ thối"],
          answer: 0,
          hint: "Rắc muối lên lát dưa leo, sau vài phút sẽ thấy gì?",
        },
        {
          type: "order",
          q: "Xếp lại hành trình làm nước mắm truyền thống của làng biển:",
          items: ["Đánh bắt cá cơm tươi", "Trộn cá với muối theo tỉ lệ", "Ủ trong chum, thùng nhiều tháng", "Rút lấy nước mắm cốt"],
          hint: "Bắt đầu từ biển, kết thúc ở giọt nước mắm đầu tiên.",
        },
      ],
      6: [
        {
          type: "order",
          q: "Một chai nhựa bị vứt bên đường Vũng Thùng 4. Xếp lại hành trình của nó:",
          items: ["Bị vứt bên đường", "Trôi xuống cống thoát nước", "Theo dòng chảy ra sông", "Ra biển và vỡ dần thành vi nhựa"],
          hint: "Nước mưa cuốn rác theo đường nào?",
        },
        {
          type: "choice",
          q: "Cách nào giúp chai nhựa KHÔNG kết thúc ở biển hiệu quả nhất?",
          options: ["Đốt ngoài trời", "Chôn dưới bãi cát", "Phân loại rác tại nguồn để được thu gom, tái chế"],
          answer: 2,
          hint: "Ở Cổng Bến có một vật giúp làm điều này.",
        },
      ],
    },
  },
  { id: "s2", name: "Mùa 2 · Mật mã Con Nước", period: "Tháng 11/2026", active: false, teaser: "Thủy triều, gió mùa và bí mật của những con sóng." },
  { id: "s3", name: "Mùa 3 · Hải đồ Sao Trời", period: "Tháng 12/2026", active: false, teaser: "Định hướng bằng sao, la bàn tự chế và vệ tinh." },
  { id: "s4", name: "Mùa 4 · Bếp Làng Biển", period: "Tháng 1/2027", active: false, teaser: "Khoa học trong nồi cá kho, chum nước mắm và mẻ cá khô." },
];
