// Bến Số – ứng dụng một trang, định tuyến bằng hash (#/...), không cần máy chủ.
// Không đăng nhập, không thu thập dữ liệu cá nhân: huy hiệu, ý tưởng, bình chọn và ngôn ngữ
// chỉ lưu trên chính thiết bị (localStorage).

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("benso:" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("benso:" + key, JSON.stringify(value));
    } catch (e) {
      /* chế độ ẩn danh hoặc bị chặn lưu trữ: bỏ qua */
    }
  },
};

const app = document.getElementById("app");
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const lang = () => store.get("lang", "vi");

function badges() { return store.get("badges", []); }
function hasBadge(id) { return badges().includes(id); }
function addBadge(id) {
  const b = badges();
  if (!b.includes(id)) { b.push(id); store.set("badges", b); }
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function confetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#f07b54", "#1f8ac0", "#f5c54a", "#3a9d6a", "#7b5ea7"];
  for (let i = 0; i < 36; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = Math.random() * 0.5 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2400);
  }
}

const badgeRow = () =>
  `<div class="badge-row">${STATIONS.map(
    (s) => `<div class="badge ${hasBadge(s.id) ? "on" : ""}" title="${esc(s.title)}">${s.icon}</div>`
  ).join("")}</div>`;

// ---------------- Minh họa ----------------

const HERO_SVG = `
<svg viewBox="0 0 400 150" aria-hidden="true">
  <circle cx="318" cy="40" r="26" fill="#ffe3a3" opacity=".95"/>
  <path d="M0 70 L40 52 L78 64 L118 40 L160 58 L190 50 L220 66 L400 70 L400 150 L0 150Z" fill="#2f6f5e" opacity=".55"/>
  <g class="wave2"><path d="M-30 86 Q10 78 50 86 T130 86 T210 86 T290 86 T370 86 T450 86 V150 H-30Z" fill="#2a7fb3"/></g>
  <g class="bob" transform="translate(96 76)">
    <ellipse cx="0" cy="8" rx="26" ry="9" fill="#7a4a24"/><ellipse cx="0" cy="5" rx="24" ry="6" fill="#a8703c"/>
    <path d="M-20 5 Q0 -4 20 5" stroke="#5e3718" stroke-width="1.5" fill="none"/>
    <line x1="10" y1="3" x2="30" y2="-20" stroke="#5e3718" stroke-width="2"/>
  </g>
  <g class="bob" transform="translate(250 84)" style="animation-delay:.8s">
    <path d="M-40 0 H40 L30 14 H-30Z" fill="#e4572e"/><rect x="-14" y="-16" width="26" height="16" rx="2" fill="#fdf6e7"/>
    <rect x="-8" y="-12" width="6" height="6" fill="#1f8ac0"/><rect x="2" y="-12" width="6" height="6" fill="#1f8ac0"/>
    <line x1="18" y1="-2" x2="18" y2="-34" stroke="#3b3b3b" stroke-width="2"/><path d="M18 -34 L36 -26 L18 -20Z" fill="#f5c54a"/>
  </g>
  <g class="wave1"><path d="M-30 100 Q10 92 50 100 T130 100 T210 100 T290 100 T370 100 T450 100 V150 H-30Z" fill="#13598b"/></g>
  <path d="M0 122 Q100 112 200 122 T400 120 V150 H0Z" fill="#fdf6e7"/>
</svg>`;

// Bản đồ tương tác vẽ lại từ sơ đồ mặt bằng (tọa độ tính bằng mét, gốc tại đỉnh phía Lý Nhật Quang).
const PIN_POS = { 1: [51, 27.9], 2: [37.2, 28.2], 3: [22, 17.2], 4: [46, 8.6], 5: [70.5, 4.6], 6: [79.6, 21] };
function mapSvg() {
  const pins = STATIONS.map((s) => {
    const [x, y] = PIN_POS[s.id];
    const done = hasBadge(s.id);
    return `<a href="#/tram/${s.id}" class="pin" aria-label="Trạm ${s.id}: ${esc(s.title)}">
      <circle class="halo" cx="${x}" cy="${y}" r="2.6" fill="${done ? "#2b9348" : "#f07b54"}"/>
      <circle cx="${x}" cy="${y}" r="2.6" fill="${done ? "#2b9348" : "#f07b54"}" stroke="#fff" stroke-width=".6"/>
      <text x="${x}" y="${y + 1.1}" font-size="3" font-weight="800" fill="#fff" text-anchor="middle">${done ? "✓" : s.id}</text></a>`;
  }).join("");
  return `
  <svg viewBox="-4 -3 92 50" role="img" aria-label="Bản đồ Bến Sáng Tạo Vũng Thùng">
    <rect x="-4" y="43.2" width="96" height="6" fill="#e8e3d8"/><rect x="83.2" y="-3" width="6" height="52" fill="#e8e3d8"/>
    <path d="M0 12.79 L42.55 41.15 L75.12 41.15 A6 6 0 0 0 81.12 35.15 L81.12 0Z" fill="#e7f2dc" stroke="#e4572e" stroke-width=".5"/>
    <path d="M0 12.79 L81.12 0 L81.12 4.2 L8 15.83Z" fill="#cfe8b0"/>
    <path d="M47 10.2 L70 6.8 L75.5 12 L74.5 24.5 L66 26.3 L47 25.8Z" fill="#b5e48c"/>
    <path d="M17 21.6 L30 26.6 L42.5 29.4 L42.5 39.3 L30 31.4 L17 23.3Z" fill="#f6d6a8"/>
    <rect x="44.5" y="29.5" width="21.5" height="9.7" fill="#ffe8a3"/>
    <path d="M67.5 28.5 L78.5 28.5 L78.5 35.3 L73.5 39.2 L67.5 39.2Z" fill="#e0dcd3"/>
    <path d="M35.75 19.2 Q41.5 14 47.25 19.2 Q41.5 24.4 35.75 19.2Z" fill="#f4a261"/>
    <path d="M35 13.2 C40 11 45 11 50 10 C56 9 62 7.5 68 6.8 C72 6.2 76 8 76.6 10.5 C77.5 13 77.6 17 77.4 20 C77.2 23 76.5 26 74.5 26.8 C70 28 65 28 60 28 C55 28 49 28 44 27.8 C40 27.6 37 27 35.5 25.2 C33.5 23 32 21 32.2 19 C32.5 16.5 33.5 14 35 13.2Z" fill="none" stroke="#d8c7a3" stroke-width="2.4"/>
    <path d="M32.2 19 L22 19.4 L10.3 19.65" stroke="#d8c7a3" stroke-width="2.1" fill="none" stroke-linecap="round"/>
    ${[[48.5, 34.5], [53.5, 32.5], [58, 36], [62.5, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#a47148"/><circle cx="${x}" cy="${y}" r=".8" fill="#ffe08a"/>`).join("")}
    ${[[46, 38.2], [52, 38.2], [64.5, 38.2], [79.6, 25], [79.6, 17], [79.6, 9], [22, 26.2], [26.5, 28.8], [40.5, 36.5], [45, 24], [66, 9.8], [48.5, 13], [74.3, 16], [29.5, 21.9]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#2d6a4f" opacity=".85"/>`).join("")}
    <text x="61" y="18" font-size="2.6" font-weight="700" fill="#2d4a22" text-anchor="middle">Sân Bến</text>
    <text x="55" y="31.6" font-size="2" font-weight="700" fill="#7a5b00" text-anchor="middle">Sân chơi Thúng Chai</text>
    <text x="73" y="32" font-size="2" font-weight="700" fill="#555" text-anchor="middle">Cổng Bến</text>
    <text x="41.5" y="19.9" font-size="1.7" font-weight="700" fill="#7a3510" text-anchor="middle">Nhà Thuyền</text>
    <text x="31" y="33.8" font-size="1.8" font-weight="700" fill="#8a5a1c" text-anchor="middle">Góc thong thả</text>
    <text x="60" y="47.2" font-size="2" fill="#777" text-anchor="middle">Đường Vũng Thùng 4</text>
    <text x="86.6" y="22" font-size="2" fill="#777" text-anchor="middle" transform="rotate(90 86.6 22)">Đường Ngô Thì Trí</text>
    <text x="14" y="33" font-size="2" fill="#777" text-anchor="middle" transform="rotate(33.7 14 33)">Đường Lý Nhật Quang</text>
    ${pins}
  </svg>`;
}

// ---------------- Các trang ----------------

function pageHome() {
  const n = badges().length;
  return `
  <section class="hero">
    <span class="eyebrow">Công viên Đổi mới Sáng tạo Sơn Trà</span>
    <h1>Bến Sáng Tạo<br>Vũng Thùng</h1>
    <p>Nơi nghề biển gặp công nghệ. Mỗi chiếc thúng chai, mỗi nút dây, mỗi con nước đều giấu một bí mật khoa học. Bạn đã sẵn sàng ra khơi?</p>
    <div class="cta"><a class="btn" href="#/hai-trinh">🧭 Bắt đầu Hải trình</a><a class="btn light" href="#/y-tuong">💡 Góp ý tưởng</a></div>
    ${HERO_SVG}
  </section>

  <a class="card stat-card" href="#/hai-trinh" style="text-decoration:none;color:inherit">
    <div class="ring" style="--p:${(n / 6) * 100}"><span>${n}/6</span></div>
    <div><b>${n === 6 ? "Bạn đã là Nhà Thám Hiểm Bến Sáng Tạo! 🏅" : n ? "Tiếp tục hải trình nhé!" : "Thu thập 6 huy hiệu làng biển"}</b>
    <div class="muted" style="margin-top:4px">${badgeRow()}</div></div>
  </a>

  <h2>Bạn đến Bến với tư cách…</h2>
  <div class="audiences">
    <a class="aud a1" href="#/hai-trinh"><span class="ic">🧒</span><b>Thám hiểm nhí</b><small>Giải đố 6 trạm, nhận huy hiệu và chứng nhận</small></a>
    <a class="aud a2" href="#/giao-vien"><span class="ic">👩‍🏫</span><b>Thầy cô & lớp học</b><small>Tiết học ngoài trời 60 phút, phiếu học tập in sẵn</small></a>
    <a class="aud a3" href="#/visitors"><span class="ic">🌏</span><b>Du khách · Visitors</b><small>Discover a fishing village through science (EN)</small></a>
    <a class="aud a4" href="#/y-tuong"><span class="ic">🏘️</span><b>Cư dân khu phố</b><small>Đề xuất, bình chọn, cùng thiết kế công viên</small></a>
  </div>

  <h2>Bản đồ Bến</h2>
  <div class="mapwrap">${mapSvg()}
    <div class="legend-mini"><span><i style="background:#f07b54"></i>Trạm STEM – chạm để mở</span><span><i style="background:#b5e48c"></i>Bãi cỏ</span><span><i style="background:#ffe8a3"></i>Sân chơi</span><span><i style="background:#f4a261"></i>Nhà Thuyền</span></div>
  </div>

  <h2>6 trạm Hải trình STEM</h2>
  <div class="scroller">${STATIONS.map((s) => `
    <a class="scard c${s.id}" href="#/tram/${s.id}">
      ${hasBadge(s.id) ? `<span class="done">✓ Đã xong</span>` : `<span class="n">0${s.id}</span>`}
      <div class="big">${s.icon}</div><b>${esc(s.title)}</b><small>${esc(s.subject)}</small>
    </a>`).join("")}
  </div>

  <h2>Tiện ích</h2>
  <div class="card" style="padding:6px 14px">
    <a class="list-station" style="box-shadow:none;margin:0" href="#/lich"><span class="ico" style="background:#1f8ac0">📅</span><span><b>Lịch hoạt động</b><small>Hải trình Chủ nhật, chiếu phim cuối tháng</small></span></a>
    <a class="list-station" style="box-shadow:none;margin:0" href="#/do-dau"><span class="ico" style="background:#3a9d6a">🌳</span><span><b>Đỡ đầu cây xanh, thiết bị</b><small>Doanh nghiệp, gia đình cùng chăm Bến</small></span></a>
    <a class="list-station" style="box-shadow:none;margin:0" href="#/su-co"><span class="ico" style="background:#e4572e">🛠️</span><span><b>Báo sự cố</b><small>Kết nối tổng đài 1022 của thành phố</small></span></a>
  </div>`;
}

function stationList() {
  return STATIONS.map((s) => `
    <a class="list-station" href="#/tram/${s.id}">
      <span class="ico c${s.id}">${s.icon}</span>
      <span><b>${s.id}. ${esc(s.title)}</b><small>${esc(s.subject)}</small></span>
      ${hasBadge(s.id) ? `<span class="tick">✓</span>` : ""}
    </a>`).join("");
}

function pageTrail() {
  const n = badges().length;
  return `
  <h1>Hải trình STEM Làng Cá</h1>
  <p>Sáu trạm dọc lối đi, mỗi trạm kể một nét của nghề biển và bí mật khoa học đằng sau. Trả lời đúng câu đố để nhận huy hiệu!</p>
  <div class="card stat-card" style="margin-top:8px"><div class="ring" style="--p:${(n / 6) * 100}"><span>${n}/6</span></div><div>${badgeRow()}</div></div>
  <div class="mapwrap">${mapSvg()}</div>
  ${stationList()}
  ${n === STATIONS.length ? `<a class="btn" href="#/chung-nhan">🏅 Xem giấy chứng nhận</a>` : ""}`;
}

function pageStation(id) {
  const s = STATIONS.find((x) => x.id === id);
  if (!s) return pageNotFound();
  if (lang() === "en") return pageStationEn(s);
  const done = hasBadge(s.id);
  const next = STATIONS.find((x) => x.id === id + 1);
  return `
  <section class="shead c${s.id}">
    <a href="#/hai-trinh">← Hải trình</a> · Trạm ${s.id}/6
    <div class="big" style="margin-top:12px">${s.icon}</div>
    <h1>${esc(s.title)}</h1>
    <div class="sub">${esc(s.subject)}</div>
    <div class="row" style="margin-top:12px"><button class="btn light small" id="speak">🔊 Nghe đọc</button></div>
  </section>

  <div class="card"><h3 class="section-title"><span>⚓</span>Chuyện làng biển</h3><p>${esc(s.story)}</p></div>
  <div class="card"><h3 class="section-title"><span>🔬</span>Khoa học ở đây</h3><p>${esc(s.science)}</p></div>
  <div class="card"><h3 class="section-title"><span>✋</span>Thử ngay</h3><p>${esc(s.tryit)}</p></div>

  <div class="card" id="quiz">
    <h3 class="section-title"><span>❓</span>Câu đố nhận huy hiệu</h3>
    <p><b>${esc(s.quiz.q)}</b></p>
    ${s.quiz.options.map((o, i) => `<button class="opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${esc(o)}</button>`).join("")}
    <p id="quiz-msg" class="muted">${done ? "Bạn đã có huy hiệu trạm này rồi. Có thể trả lời lại cho vui!" : ""}</p>
  </div>
  <div class="row">
    ${next ? `<a class="btn" href="#/tram/${next.id}">Trạm tiếp theo →</a>` : `<a class="btn" href="#/hai-trinh">Về Hải trình</a>`}
  </div>`;
}

function pageStationEn(s) {
  const next = STATIONS.find((x) => x.id === s.id + 1);
  return `
  <section class="shead c${s.id}">
    <a href="#/visitors">← Visitors</a> · Station ${s.id}/6
    <div class="big" style="margin-top:12px">${s.icon}</div>
    <h1>${esc(s.en.title)}</h1><div class="sub">${esc(s.en.subject)}</div>
  </section>
  <div class="card"><p>${esc(s.en.text)}</p></div>
  <p class="muted">The quiz and badges are available in Vietnamese — switch to VI at the top.</p>
  <div class="row">${next ? `<a class="btn" href="#/tram/${next.id}">Next station →</a>` : `<a class="btn" href="#/visitors">Back</a>`}</div>`;
}

function bindStation(id) {
  const s = STATIONS.find((x) => x.id === id);
  if (!s || lang() === "en") return;
  document.querySelectorAll(".opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      document.querySelectorAll(".opt").forEach((b) => b.classList.remove("right", "wrong"));
      const msg = document.getElementById("quiz-msg");
      if (i === s.quiz.answer) {
        btn.classList.add("right");
        const had = hasBadge(s.id);
        addBadge(s.id);
        msg.textContent = had ? "Chính xác!" : `Chính xác! Bạn nhận huy hiệu ${s.icon} (${badges().length}/6).`;
        if (!had) { toast(`🎉 Nhận huy hiệu ${s.icon}!`); confetti(); }
        if (!had && badges().length === STATIONS.length) setTimeout(() => (location.hash = "#/chung-nhan"), 1400);
      } else {
        btn.classList.add("wrong");
        msg.textContent = "Chưa đúng rồi, đọc lại phần 'Khoa học ở đây' và thử lại nhé!";
      }
    });
  });
  const sp = document.getElementById("speak");
  if (!("speechSynthesis" in window)) { sp.style.display = "none"; return; }
  sp.addEventListener("click", () => {
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); sp.textContent = "🔊 Nghe đọc"; return; }
    const u = new SpeechSynthesisUtterance(`${s.title}. ${s.story} ${s.science}`);
    u.lang = "vi-VN";
    const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith("vi"));
    if (v) u.voice = v;
    u.onend = () => (sp.textContent = "🔊 Nghe đọc");
    speechSynthesis.speak(u);
    sp.textContent = "⏹ Dừng đọc";
  });
}

function pageCert() {
  if (badges().length < STATIONS.length) {
    return `<h1>Giấy chứng nhận</h1><p>Hoàn thành cả 6 trạm để nhận giấy chứng nhận.</p>
      <div class="card">${badgeRow()}</div><a class="btn" href="#/hai-trinh">Tiếp tục Hải trình</a>`;
  }
  return `
  <div class="card cert" style="margin-top:18px">
    <div class="big">🏅</div>
    <span class="eyebrow">Giấy chứng nhận</span>
    <h1>Nhà Thám Hiểm Bến Sáng Tạo</h1>
    <p>Đã hoàn thành 6 trạm Hải trình STEM Làng Cá – hiểu vì sao thúng chai nổi, vì sao nút dây giữ được thuyền, vì sao có con nước…</p>
    <div style="display:flex;justify-content:center">${badgeRow()}</div>
    <p class="muted">Đưa màn hình này cho tình nguyện viên trong buổi Hải trình Chủ nhật để nhận quà nhỏ (đề xuất). Không ghi tên, không lưu thông tin cá nhân.</p>
  </div>
  <button class="btn ghost" id="reset">Chơi lại từ đầu</button>`;
}

function bindCert() {
  const r = document.getElementById("reset");
  if (r) r.addEventListener("click", () => { store.set("badges", []); route(); });
  if (badges().length === STATIONS.length) confetti();
}

function pageTeacher() {
  return `
  <section class="shead a2" style="background:linear-gradient(150deg,#3a7d44,#23542b)">
    <a href="#/">← Trang chủ</a>
    <div class="big" style="margin-top:12px">👩‍🏫</div>
    <h1>Lớp học ngoài trời</h1>
    <div class="sub">Dẫn cả lớp đi Hải trình STEM Làng Cá</div>
  </section>
  <div class="card"><p>${esc(LESSON.fit)} Không cần đăng ký tài khoản, không cần mỗi em một điện thoại.</p>
    <div class="row noprint"><a class="btn small" href="#/phieu">🖨️ Phiếu học tập in sẵn</a><a class="btn ghost small" href="#/hai-trinh">Xem 6 trạm</a></div></div>
  <h2>Gợi ý tiến trình 60–75 phút</h2>
  <div class="card"><div class="timeline">
    ${LESSON.steps.map((st) => `<div class="step"><div class="time">${esc(st.time)}</div><b>${esc(st.title)}</b><p class="muted" style="margin:2px 0 0">${esc(st.text)}</p></div>`).join("")}
  </div></div>
  <h2>Mỗi trạm dạy gì?</h2>
  <div class="card"><table><tr><th>Trạm</th><th>Kiến thức</th></tr>
    ${STATIONS.map((s) => `<tr><td>${s.icon} ${esc(s.title)}</td><td>${esc(s.subject)}</td></tr>`).join("")}
  </table></div>
  <h2>An toàn & lưu ý</h2>
  <div class="card"><ul>${LESSON.safety.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
}

function pageWorksheet() {
  return `
  <p class="noprint muted"><a href="#/giao-vien">← Lớp học ngoài trời</a> · Nhấn Ctrl + P để in</p>
  <div class="card">
    <h1 style="margin-top:0">Phiếu Hải trình STEM Làng Cá</h1>
    <p>Nhóm: ........................................ Lớp: .............. Ngày: ..............</p>
    ${STATIONS.map((s) => `
      <div style="border-top:1px solid #ccc;padding:8px 0">
        <b>Trạm ${s.id}. ${esc(s.title)}</b>
        <p style="margin:4px 0">${esc(s.quiz.q)}</p>
        ${s.quiz.options.map((o, i) => `<div>☐ ${String.fromCharCode(65 + i)}. ${esc(o)}</div>`).join("")}
        <p style="margin:6px 0 0">Điều nhóm em thấy thú vị: .........................................................................</p>
      </div>`).join("")}
  </div>
  <button class="btn noprint" onclick="window.print()">🖨️ In phiếu</button>`;
}

function pageVisitors() {
  return `
  <section class="shead a3" style="background:linear-gradient(150deg,#1f8ac0,#0b2545)">
    <a href="#/">← Home</a>
    <div class="big" style="margin-top:12px">🌏</div>
    <h1>Welcome to Vung Thung Innovation Wharf</h1>
    <div class="sub">Where fishing traditions meet technology</div>
  </section>
  <div class="card"><p>This small park sits in the Nai Hien Dong fishing village area of Son Tra, Da Nang. Follow the six-station trail to discover the science behind everyday life in a Vietnamese fishing village — from bamboo basket boats to fish sauce.</p>
  <p class="muted">Free, no app, no sign-up. Please respect the residents: the park is quiet after 9 pm.</p></div>
  <h2>The six stations</h2>
  ${STATIONS.map((s) => `
    <a class="list-station" href="#/tram/${s.id}" data-en="1">
      <span class="ico c${s.id}">${s.icon}</span><span><b>${s.id}. ${esc(s.en.title)}</b><small>${esc(s.en.subject)}</small></span>
    </a>`).join("")}`;
}

function bindVisitors() {
  document.querySelectorAll("[data-en]").forEach((a) => a.addEventListener("click", () => setLang("en")));
}

function ideaItem(it, voted) {
  return `<div class="idea">
    <button class="vote ${voted ? "on" : ""}" data-id="${esc(it.id)}"><b>${it.votes + (voted ? 1 : 0)}</b>${voted ? "Đã chọn" : "▲ Chọn"}</button>
    <div><span class="chip">${esc(it.cat)}</span>${it.mine ? ' <span class="chip" style="background:#fff0ea;color:#e4572e">Của bạn</span>' : ""}<div style="margin-top:3px">${esc(it.text)}</div></div>
  </div>`;
}

function pageIdeas() {
  const mine = store.get("ideas", []);
  const votes = store.get("votes", []);
  const score = (it) => it.votes + (votes.includes(it.id) ? 1 : 0);
  const all = [...mine.map((m) => ({ ...m, mine: true })), ...SAMPLE_IDEAS].sort((a, b) => score(b) - score(a));
  return `
  <section class="shead a4" style="background:linear-gradient(150deg,#7b5ea7,#46307a)">
    <div class="big">💡</div>
    <h1>Hòm ý tưởng</h1>
    <div class="sub">Công viên không có ngày “làm xong” – cả khu phố cùng thiết kế tiếp</div>
  </section>
  <div class="card">
    <form id="idea-form">
      <label for="cat">Chủ đề</label>
      <select id="cat"><option>Hoạt động</option><option>Tiện ích</option><option>An toàn</option><option>Khác</option></select>
      <label for="txt">Ý tưởng của bạn</label>
      <textarea id="txt" rows="3" maxlength="300" placeholder="Ví dụ: Lớp thắt nút dây cho thiếu nhi sáng Chủ nhật"></textarea>
      <p class="muted">Không cần tên hay số điện thoại. Hỏng hóc cần sửa gấp? Dùng mục <a href="#/su-co">Báo sự cố</a>.</p>
      <button class="btn" type="submit">Gửi ý tưởng</button>
    </form>
  </div>
  <h2>Được bình chọn nhiều nhất</h2>
  <div class="card" id="idea-list">${all.map((it) => ideaItem(it, votes.includes(it.id))).join("")}</div>
  <p class="muted">Ý tưởng mẫu là dữ liệu minh họa. Trong bản mẫu, ý tưởng của bạn chỉ lưu trên máy này.</p>

  <h2>🤖 AI tổng hợp mỗi tháng</h2>
  <div class="card">
    <div class="timeline">
      <div class="step"><div class="time">Bước 1</div><b>Ẩn thông tin cá nhân</b><p class="muted" style="margin:0">Loại bỏ tên, số điện thoại, email trước khi xử lý.</p></div>
      <div class="step"><div class="time">Bước 2</div><b>AI lọc và gom nhóm</b><p class="muted" style="margin:0">Bỏ nội dung rác, gom ý giống nhau, đếm mức độ quan tâm, nhận diện sự cố cần chuyển 1022.</p></div>
      <div class="step"><div class="time">Bước 3</div><b>Báo cáo một trang</b><p class="muted" style="margin:0">Gửi tổ dân phố và phường, kèm 1–3 việc nên làm tháng tới.</p></div>
      <div class="step"><div class="time">Bước 4</div><b>Con người quyết định</b><p class="muted" style="margin:0">AI chỉ đề xuất; kết quả được công bố lại trên Bến Số.</p></div>
    </div>
    <a class="btn" href="#/bao-cao">Xem báo cáo mẫu</a>
  </div>`;
}

function bindIdeas() {
  document.getElementById("idea-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const txt = document.getElementById("txt").value.trim();
    if (txt.length < 10) { toast("Hãy viết ý tưởng dài hơn một chút nhé (ít nhất 10 ký tự)."); return; }
    if (/(\d[\s.-]?){9,}/.test(txt) || /@\S+\.\S+/.test(txt)) {
      toast("Vui lòng bỏ số điện thoại/email khỏi nội dung để bảo vệ thông tin cá nhân.");
      return;
    }
    const mine = store.get("ideas", []);
    mine.unshift({ id: "m" + Date.now(), cat: document.getElementById("cat").value, text: txt, votes: 0 });
    store.set("ideas", mine);
    toast("Đã ghi nhận ý tưởng. Cảm ơn bạn!");
    route();
  });
  document.querySelectorAll(".vote").forEach((b) =>
    b.addEventListener("click", () => {
      const votes = store.get("votes", []);
      const id = b.dataset.id;
      store.set("votes", votes.includes(id) ? votes.filter((v) => v !== id) : [...votes, id]);
      route();
    })
  );
}

function pageReport() {
  const r = SAMPLE_REPORT;
  const max = Math.max(...r.groups.map((g) => g.count));
  return `
  <p class="muted" style="margin-top:14px"><a href="#/y-tuong">← Hòm ý tưởng</a></p>
  <span class="eyebrow">Báo cáo do AI tổng hợp</span>
  <h1>Góp ý cộng đồng hằng tháng</h1>
  <div class="note warn">Báo cáo MẪU, dữ liệu minh họa – mô tả định dạng đầu ra AI sẽ tạo mỗi tháng.</div>
  <div class="card">
    <h3>${esc(r.period)}</h3>
    <div class="row" style="gap:10px;margin:6px 0 10px">
      <span class="chip" style="font-size:13px">Tổng ${r.total}</span><span class="chip" style="font-size:13px">Hợp lệ ${r.valid}</span><span class="chip" style="font-size:13px;background:#fdecea;color:#c0392b">Bị lọc ${r.filtered}</span>
    </div>
    ${r.groups.map((g) => `
      <div class="bar"><span class="lab">${esc(g.name)}</span><span class="track"><i style="width:${(g.count / max) * 100}%"></i></span><b>${g.count}</b></div>
      <p class="muted" style="margin:0 0 8px">${esc(g.note)}</p>`).join("")}
  </div>
  <div class="card"><h3>Đề xuất việc cần làm tháng tới</h3><ol>${r.actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ol>
  <h3>Chuyển kênh</h3><p>${esc(r.forwarded)}</p></div>
  <p class="muted">Người đọc báo cáo: tổ dân phố, ban quản lý công viên, UBND phường. AI không tự ra quyết định.</p>`;
}

function pageEvents() {
  return `
  <h1>Hoạt động tại Bến</h1>
  <p>Ngày thường Bến là công viên của khu phố. Cuối tuần, chính các không gian đó trở thành sân chơi sáng tạo. Mọi hoạt động kết thúc trước 21:00.</p>
  <div class="card"><div class="timeline">
    ${EVENTS.map((e) => `<div class="step"><div class="time">${esc(e.when)}</div><b>${esc(e.what)}</b><p class="muted" style="margin:0">${esc(e.who)}</p></div>`).join("")}
  </div></div>
  <p class="muted">Lịch mang tính đề xuất trong ý tưởng dự thi.</p>`;
}

function pageSponsor() {
  return `
  <h1>Đỡ đầu cây xanh, thiết bị</h1>
  <p>Doanh nghiệp, gia đình, tổ chức có thể nhận đỡ đầu một cây hay một thiết bị. Người đỡ đầu được ghi nhận bằng một dòng chữ nhỏ tại hiện vật và trên trang này – không đặt biển quảng cáo.</p>
  <div class="card"><table><tr><th>Hạng mục</th><th>Trạng thái</th></tr>
    ${SPONSORS.map((s) => `<tr><td>${esc(s.item)}</td><td><span class="chip">${esc(s.status)}</span></td></tr>`).join("")}
  </table></div>
  <p class="muted">Việc tiếp nhận tài trợ do UBND phường quyết định theo quy định.</p>`;
}

function pageIncident() {
  return `
  <h1>Báo sự cố</h1>
  <p>Thấy thiết bị hỏng, cây gãy, mất vệ sinh hay điều gì không an toàn? Hãy phản ánh qua kênh chính thức của thành phố để được xử lý nhanh:</p>
  <div class="card">
    <h3>Tổng đài 1022 thành phố Đà Nẵng</h3>
    <p>Gọi <b>1022</b> hoặc phản ánh qua cổng góp ý của thành phố. Ghi rõ: “Công viên góc Ngô Thì Trí – Vũng Thùng 4 – Lý Nhật Quang”, mô tả sự cố và gửi kèm ảnh nếu có.</p>
    <a class="btn" href="tel:1022">📞 Gọi 1022</a>
  </div>
  <p class="muted">Bến Số không tạo kênh xử lý sự cố riêng, tránh trùng lặp với hệ thống sẵn có của thành phố.</p>`;
}

function pageAbout() {
  return `
  <h1>Về Bến Sáng Tạo Vũng Thùng</h1>
  <div class="card">
    <p><b>Bến Sáng Tạo Vũng Thùng – Nơi nghề biển gặp công nghệ</b> là ý tưởng dự thi Cuộc thi Ý tưởng Công viên Đổi mới Sáng tạo Sơn Trà 2026, cho khu đất khoảng 2.000 m² tại góc Ngô Thì Trí – Vũng Thùng 4 – Lý Nhật Quang.</p>
    <ol>
      <li><b>Không gian xanh</b>: bãi cỏ đa năng, sân chơi Thúng Chai, góc thong thả, Nhà Thuyền.</li>
      <li><b>Hải trình STEM Làng Cá</b>: 6 trạm kể nghề biển bằng ngôn ngữ khoa học – cho trẻ em, lớp học và du khách.</li>
      <li><b>Bến Số</b>: nền tảng số này, để cư dân tiếp tục cùng thiết kế công viên, có AI hỗ trợ tổng hợp ý kiến.</li>
    </ol>
  </div>
  <h2>Quyền riêng tư</h2>
  <div class="card"><ul>
    <li>Không đăng nhập, không hỏi tên, không thu thập dữ liệu của trẻ em.</li>
    <li>Huy hiệu, ý tưởng, bình chọn trong bản mẫu chỉ lưu trên chính thiết bị của bạn.</li>
    <li>Khi vận hành thật, góp ý được ẩn thông tin cá nhân trước khi đưa cho AI tổng hợp.</li>
  </ul></div>
  <h2>Minh bạch về AI</h2>
  <div class="card"><p>Tranh minh họa và bản nháp nội dung có thể được tạo với sự hỗ trợ của công cụ AI, sau đó được con người biên tập, kiểm tra. Bến Số không có chatbot trả lời tự do để tránh thông tin sai. Nội dung khoa học ở mức phổ thông, cần giáo viên thẩm định trước khi triển khai chính thức.</p></div>`;
}

function pageNotFound() {
  return `<h1>Không tìm thấy trang</h1><a class="btn" href="#/">Về trang chủ</a>`;
}

// ---------------- Ngôn ngữ & định tuyến ----------------

function setLang(l) {
  store.set("lang", l);
  document.documentElement.lang = l;
  document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.l === l));
}

function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const [page, arg] = h.split("/");
  let html, bind, tab = page || "home";
  switch (page) {
    case "": case undefined: html = pageHome(); tab = "home"; break;
    case "hai-trinh": html = pageTrail(); break;
    case "tram": html = pageStation(Number(arg)); bind = () => bindStation(Number(arg)); tab = "hai-trinh"; break;
    case "chung-nhan": html = pageCert(); bind = bindCert; tab = "hai-trinh"; break;
    case "giao-vien": html = pageTeacher(); tab = "hai-trinh"; break;
    case "phieu": html = pageWorksheet(); tab = "hai-trinh"; break;
    case "visitors": html = pageVisitors(); bind = bindVisitors; tab = "home"; break;
    case "y-tuong": html = pageIdeas(); bind = bindIdeas; break;
    case "bao-cao": html = pageReport(); tab = "y-tuong"; break;
    case "lich": html = pageEvents(); break;
    case "do-dau": html = pageSponsor(); tab = "home"; break;
    case "su-co": html = pageIncident(); tab = "home"; break;
    case "gioi-thieu": html = pageAbout(); break;
    default: html = pageNotFound();
  }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  app.innerHTML = html;
  if (bind) bind();
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
  window.scrollTo(0, 0);
}

document.querySelectorAll(".lang button").forEach((b) =>
  b.addEventListener("click", () => { setLang(b.dataset.l); route(); })
);
setLang(lang());
window.addEventListener("hashchange", route);
route();
