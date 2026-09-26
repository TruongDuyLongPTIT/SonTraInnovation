// Bến Số – ứng dụng một trang, định tuyến bằng hash (#/...), không cần máy chủ.
// Không đăng nhập, không thu thập dữ liệu cá nhân: huy hiệu, ý tưởng và lượt bình chọn
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

function badgeRow() {
  return `<div class="badge-row">${STATIONS.map(
    (s) => `<div class="badge ${hasBadge(s.id) ? "on" : ""}" title="${esc(s.title)}">${s.icon}</div>`
  ).join("")}</div>`;
}

function progress() {
  const n = badges().length;
  return `<div class="progress" aria-label="Tiến độ ${n}/6"><i style="width:${(n / STATIONS.length) * 100}%"></i></div>
    <p class="muted">Đã hoàn thành ${n}/${STATIONS.length} trạm</p>`;
}

// ---------------- Các trang ----------------

function pageHome() {
  return `
  <section class="card hero">
    <span class="tag">Công viên Đổi mới Sáng tạo Sơn Trà</span>
    <h1>Chào mừng đến Bến Sáng Tạo Vũng Thùng</h1>
    <p>Nơi nghề biển gặp công nghệ. Khám phá khoa học ẩn sau nghề biển của làng, và cùng cả khu phố tiếp tục thiết kế công viên của mình.</p>
    <div class="row"><a class="btn" href="#/hai-trinh">Bắt đầu Hải trình STEM</a>
    <a class="btn ghost" href="#/y-tuong">Góp ý tưởng</a></div>
  </section>

  <h2>Huy hiệu của bạn</h2>
  <div class="card">${badgeRow()}${progress()}</div>

  <h2>Bản đồ công viên</h2>
  <img class="map" src="img/so-do.png" alt="Sơ đồ mặt bằng Bến Sáng Tạo Vũng Thùng với 6 trạm Hải trình STEM">
  <p class="muted">Chạm vào ảnh để phóng to. Số 1–6 màu xanh là vị trí các trạm STEM.</p>

  <div class="grid">
    <a class="tile" href="#/hai-trinh"><span class="ic">🧭</span><b>Hải trình STEM</b><small>6 trạm khoa học của làng biển</small></a>
    <a class="tile" href="#/y-tuong"><span class="ic">💡</span><b>Hòm ý tưởng</b><small>Đề xuất và bình chọn</small></a>
    <a class="tile" href="#/lich"><span class="ic">📅</span><b>Hoạt động</b><small>Lịch sinh hoạt cộng đồng</small></a>
    <a class="tile" href="#/do-dau"><span class="ic">🌳</span><b>Đỡ đầu</b><small>Cây xanh, thiết bị</small></a>
    <a class="tile" href="#/su-co"><span class="ic">🛠️</span><b>Báo sự cố</b><small>Hỏng hóc, mất vệ sinh</small></a>
    <a class="tile" href="#/gioi-thieu"><span class="ic">ℹ️</span><b>Giới thiệu</b><small>Ý tưởng, quyền riêng tư</small></a>
  </div>`;
}

function pageTrail() {
  return `
  <h1>Hải trình STEM Làng Cá</h1>
  <p>Sáu trạm dọc lối đi vòng, mỗi trạm kể một nét của nghề biển và khoa học đằng sau nó. Trả lời đúng câu đố để nhận huy hiệu!</p>
  <div class="card">${badgeRow()}${progress()}</div>
  <div class="station-list">
  ${STATIONS.map((s) => `
    <a class="tile ${hasBadge(s.id) ? "done" : ""}" href="#/tram/${s.id}" style="margin:10px 0">
      <span class="num ${hasBadge(s.id) ? "done" : ""}">${hasBadge(s.id) ? "✓" : s.id}</span>
      <span><b>${s.icon} ${esc(s.title)}</b><small>${esc(s.subject)}</small></span>
    </a>`).join("")}
  </div>
  ${badges().length === STATIONS.length ? `<a class="btn" href="#/chung-nhan">Xem giấy chứng nhận</a>` : ""}`;
}

function pageStation(id) {
  const s = STATIONS.find((x) => x.id === id);
  if (!s) return pageNotFound();
  const done = hasBadge(s.id);
  const next = STATIONS.find((x) => x.id === id + 1);
  return `
  <p class="muted"><a href="#/hai-trinh">← Hải trình</a> · Trạm ${s.id}/6</p>
  <div class="station-head">${s.icon}</div>
  <h1>${esc(s.title)}</h1>
  <p class="subject">${esc(s.subject)}</p>
  <div class="row"><button class="btn ghost small" id="speak">🔊 Nghe đọc</button></div>

  <div class="card"><h3>⚓ Chuyện làng biển</h3><p id="t-story">${esc(s.story)}</p></div>
  <div class="card"><h3>🔬 Khoa học ở đây</h3><p id="t-science">${esc(s.science)}</p></div>
  <div class="card"><h3>✋ Thử ngay</h3><p>${esc(s.tryit)}</p></div>

  <div class="card" id="quiz">
    <h3>❓ Câu đố nhận huy hiệu</h3>
    <p><b>${esc(s.quiz.q)}</b></p>
    ${s.quiz.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join("")}
    <p id="quiz-msg" class="muted">${done ? "Bạn đã có huy hiệu trạm này rồi. Có thể trả lời lại cho vui!" : ""}</p>
  </div>
  <div class="row">
    ${next ? `<a class="btn" href="#/tram/${next.id}">Trạm tiếp theo →</a>` : `<a class="btn" href="#/hai-trinh">Về Hải trình</a>`}
  </div>`;
}

function bindStation(id) {
  const s = STATIONS.find((x) => x.id === id);
  if (!s) return;
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
        if (!had) toast(`🎉 Nhận huy hiệu ${s.icon}!`);
        if (!had && badges().length === STATIONS.length) setTimeout(() => (location.hash = "#/chung-nhan"), 1200);
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
  const n = badges().length;
  if (n < STATIONS.length) {
    return `<h1>Giấy chứng nhận</h1><p>Bạn cần hoàn thành cả 6 trạm để nhận giấy chứng nhận.</p>
      <div class="card">${badgeRow()}${progress()}</div><a class="btn" href="#/hai-trinh">Tiếp tục Hải trình</a>`;
  }
  return `
  <div class="card cert">
    <div class="big">🏅</div>
    <h1>Nhà Thám Hiểm Bến Sáng Tạo</h1>
    <p>Chúc mừng bạn đã hoàn thành cả 6 trạm Hải trình STEM Làng Cá!</p>
    ${badgeRow()}
    <p class="muted">Đưa màn hình này cho tình nguyện viên trong các buổi Hải trình Chủ nhật để nhận quà nhỏ (đề xuất).
    Chứng nhận không ghi tên, không lưu thông tin cá nhân.</p>
  </div>
  <button class="btn ghost" id="reset">Chơi lại từ đầu</button>`;
}

function bindCert() {
  const r = document.getElementById("reset");
  if (r) r.addEventListener("click", () => { store.set("badges", []); route(); });
}

function ideaItem(it, voted) {
  return `<div class="idea">
    <button class="vote ${voted ? "on" : ""}" data-id="${esc(it.id)}"><b>${it.votes + (voted ? 1 : 0)}</b>${voted ? "Đã chọn" : "Bình chọn"}</button>
    <div><span class="chip">${esc(it.cat)}</span>${it.mine ? ' <span class="chip">Của bạn</span>' : ""}<br>${esc(it.text)}</div>
  </div>`;
}

function pageIdeas() {
  const mine = store.get("ideas", []);
  const votes = store.get("votes", []);
  const all = [...mine.map((m) => ({ ...m, mine: true })), ...SAMPLE_IDEAS].sort(
    (a, b) => b.votes + (votes.includes(b.id) ? 1 : 0) - (a.votes + (votes.includes(a.id) ? 1 : 0))
  );
  return `
  <h1>Hòm ý tưởng</h1>
  <p>Công viên không có ngày "làm xong". Bạn muốn Bến có thêm hoạt động gì, cải tạo chỗ nào? Hãy đề xuất và bình chọn.</p>
  <div class="card">
    <form id="idea-form">
      <label for="cat">Chủ đề</label>
      <select id="cat">
        <option>Hoạt động</option><option>Tiện ích</option><option>An toàn</option><option>Khác</option>
      </select>
      <label for="txt">Ý tưởng của bạn</label>
      <textarea id="txt" rows="3" maxlength="300" placeholder="Ví dụ: Tổ chức lớp thắt nút dây cho thiếu nhi sáng Chủ nhật"></textarea>
      <p class="muted">Không cần tên hay số điện thoại. Vui lòng không ghi thông tin cá nhân của bạn hay người khác.
      Nếu là hỏng hóc cần sửa gấp, hãy dùng mục <a href="#/su-co">Báo sự cố</a>.</p>
      <button class="btn" type="submit">Gửi ý tưởng</button>
    </form>
  </div>

  <h2>Ý tưởng được bình chọn nhiều</h2>
  <div class="card" id="idea-list">${all.map((it) => ideaItem(it, votes.includes(it.id))).join("")}</div>
  <p class="muted">Các ý tưởng mẫu là dữ liệu minh họa. Trong bản mẫu, ý tưởng của bạn chỉ lưu trên máy này.</p>

  <h2>🤖 AI tổng hợp: báo cáo hằng tháng</h2>
  <div class="card">
    <p>Cuối mỗi tháng, hệ thống gửi các góp ý (đã ẩn mọi thông tin cá nhân) cho một mô hình ngôn ngữ lớn để:</p>
    <ol>
      <li>Lọc nội dung rác, xúc phạm, quảng cáo;</li>
      <li>Gom các ý giống nhau thành nhóm chủ đề và đếm số người quan tâm;</li>
      <li>Nhận diện góp ý thực chất là sự cố để hướng dẫn chuyển sang kênh 1022;</li>
      <li>Viết báo cáo một trang, đề xuất việc cần làm cho tổ dân phố và phường.</li>
    </ol>
    <p>Mọi đề xuất của AI chỉ mang tính tham khảo; con người đọc và quyết định.</p>
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
  <p class="muted"><a href="#/y-tuong">← Hòm ý tưởng</a></p>
  <h1>Báo cáo góp ý cộng đồng</h1>
  <div class="note warn">Báo cáo MẪU với dữ liệu minh họa, dùng để mô tả định dạng đầu ra mà AI sẽ tạo mỗi tháng.</div>
  <div class="card report">
    <h3>${esc(r.period)}</h3>
    <p>Tổng số góp ý: <b>${r.total}</b> · Hợp lệ: <b>${r.valid}</b> · Bị lọc (rác, trùng lặp, không phù hợp): <b>${r.filtered}</b></p>
    <h3>Nhóm chủ đề</h3>
    ${r.groups.map((g) => `
      <div class="bar"><span class="lab">${esc(g.name)}</span><span class="track"><i style="width:${(g.count / max) * 100}%"></i></span><b>${g.count}</b></div>
      <p class="muted" style="margin:0 0 10px">${esc(g.note)}</p>`).join("")}
    <h3>Đề xuất việc cần làm tháng tới</h3>
    <ol>${r.actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ol>
    <h3>Chuyển kênh</h3>
    <p>${esc(r.forwarded)}</p>
  </div>
  <p class="muted">Người đọc báo cáo: tổ dân phố, ban quản lý công viên, UBND phường. AI không tự ra quyết định.</p>`;
}

function pageEvents() {
  return `
  <h1>Hoạt động tại Bến</h1>
  <p>Ngày thường Bến là công viên của khu phố. Cuối tuần là sân chơi sáng tạo. Mọi hoạt động kết thúc trước 21:00 để giữ yên tĩnh cho nhà dân xung quanh.</p>
  <div class="card"><table>
    <tr><th>Thời gian</th><th>Hoạt động</th></tr>
    ${EVENTS.map((e) => `<tr><td>${esc(e.when)}</td><td>${esc(e.what)}<br><span class="muted">${esc(e.who)}</span></td></tr>`).join("")}
  </table></div>
  <p class="muted">Lịch mang tính đề xuất trong ý tưởng dự thi.</p>`;
}

function pageSponsor() {
  return `
  <h1>Đỡ đầu cây xanh, thiết bị</h1>
  <p>Doanh nghiệp, gia đình, tổ chức có thể nhận đỡ đầu một cây hay một thiết bị. Tên người đỡ đầu được ghi nhận bằng một dòng chữ nhỏ tại hiện vật và trên trang này, không đặt biển quảng cáo.</p>
  <div class="card"><table>
    <tr><th>Hạng mục</th><th>Trạng thái</th></tr>
    ${SPONSORS.map((s) => `<tr><td>${esc(s.item)}</td><td>${esc(s.status)}</td></tr>`).join("")}
  </table></div>
  <p class="muted">Việc tiếp nhận tài trợ do UBND phường quyết định theo quy định.</p>`;
}

function pageIncident() {
  return `
  <h1>Báo sự cố</h1>
  <p>Thấy thiết bị hỏng, cây gãy, mất vệ sinh hay điều gì không an toàn trong công viên? Để được xử lý nhanh, hãy phản ánh qua kênh chính thức của thành phố:</p>
  <div class="card">
    <h3>Tổng đài 1022 thành phố Đà Nẵng</h3>
    <p>Gọi <b>1022</b> hoặc phản ánh qua ứng dụng/cổng góp ý của thành phố. Ghi rõ: "Công viên góc Ngô Thì Trí – Vũng Thùng 4 – Lý Nhật Quang", mô tả sự cố và gửi kèm ảnh nếu có.</p>
    <a class="btn" href="tel:1022">📞 Gọi 1022</a>
  </div>
  <p class="muted">Bến Số không tạo kênh xử lý sự cố riêng, tránh trùng lặp với hệ thống sẵn có của thành phố.</p>`;
}

function pageAbout() {
  return `
  <h1>Về Bến Sáng Tạo Vũng Thùng</h1>
  <div class="card">
    <p><b>Bến Sáng Tạo Vũng Thùng – Nơi nghề biển gặp công nghệ</b> là ý tưởng dự thi Cuộc thi Ý tưởng Công viên Đổi mới Sáng tạo Sơn Trà 2026, cho khu đất khoảng 2.000 m² tại góc Ngô Thì Trí – Vũng Thùng 4 – Lý Nhật Quang.</p>
    <p>Ba lớp của ý tưởng:</p>
    <ol>
      <li><b>Không gian xanh</b> cho cả khu phố: bãi cỏ đa năng, sân chơi Thúng Chai, góc thong thả, dải cây đệm.</li>
      <li><b>Hải trình STEM Làng Cá</b>: 6 trạm kể nghề biển bằng ngôn ngữ khoa học.</li>
      <li><b>Bến Số</b>: nền tảng số này, để cư dân tiếp tục cùng thiết kế công viên, có AI hỗ trợ tổng hợp ý kiến.</li>
    </ol>
  </div>
  <h2>Quyền riêng tư</h2>
  <div class="card">
    <ul>
      <li>Không đăng nhập, không hỏi tên, không thu thập dữ liệu của trẻ em.</li>
      <li>Huy hiệu, ý tưởng và bình chọn trong bản mẫu chỉ lưu trên chính thiết bị của bạn.</li>
      <li>Khi vận hành thật, góp ý được ẩn thông tin cá nhân trước khi đưa cho AI tổng hợp.</li>
    </ul>
  </div>
  <h2>Minh bạch về AI</h2>
  <div class="card">
    <p>Tranh minh họa và bản nháp nội dung có thể được tạo với sự hỗ trợ của công cụ AI, sau đó được con người biên tập, kiểm tra. Bến Số không có chatbot trả lời tự do, để tránh thông tin sai.</p>
    <p>Nội dung khoa học ở các trạm ở mức phổ thông và cần giáo viên thẩm định trước khi triển khai chính thức.</p>
  </div>`;
}

function pageNotFound() {
  return `<h1>Không tìm thấy trang</h1><a class="btn" href="#/">Về trang chủ</a>`;
}

// ---------------- Định tuyến ----------------

function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const [page, arg] = h.split("/");
  let html, bind, tab = page || "home";
  switch (page) {
    case "": case undefined: html = pageHome(); tab = "home"; break;
    case "hai-trinh": html = pageTrail(); break;
    case "tram": html = pageStation(Number(arg)); bind = () => bindStation(Number(arg)); tab = "hai-trinh"; break;
    case "chung-nhan": html = pageCert(); bind = bindCert; tab = "hai-trinh"; break;
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
  const img = app.querySelector("img.map");
  if (img) img.addEventListener("click", () => window.open(img.src, "_blank"));
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();
