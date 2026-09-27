// Bến Số – "Săn Kho Báu Vũng Thùng". Ứng dụng một trang, định tuyến bằng hash, không cần máy chủ.
// Không đăng nhập, không thu thập dữ liệu cá nhân: mọi tiến độ chỉ lưu trên thiết bị (localStorage).

// Nếu trình duyệt chặn localStorage (một số trình duyệt nhúng), vẫn chơi được trong phiên hiện tại nhờ bộ nhớ tạm.
const memory = {};
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("benso:" + key);
      if (v !== null) return JSON.parse(v);
    } catch (e) {
      /* bị chặn lưu trữ: dùng bộ nhớ tạm */
    }
    return key in memory ? JSON.parse(memory[key]) : fallback;
  },
  set(key, value) {
    memory[key] = JSON.stringify(value);
    try {
      localStorage.setItem("benso:" + key, memory[key]);
    } catch (e) {
      /* bị chặn lưu trữ: đã giữ trong bộ nhớ tạm */
    }
  },
};

const app = document.getElementById("app");
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SEASON = SEASONS.find((s) => s.active);
const UNLOCK_MINUTES = 120; // quét mã xong phải giải trong 2 giờ, tránh "giải từ xa"

// ---------------- Trạng thái trò chơi ----------------

function newSailorId() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
  return "TT-" + s;
}
function game() {
  const g = store.get("game", null) || {};
  g.sailor = g.sailor || newSailorId();
  g.points = g.points || 0;
  g.solved = g.solved || {};   // "s1:1:ngày" -> true
  g.letters = g.letters || {}; // "s1" -> {1:"N", ...}
  g.hints = g.hints || {};     // "s1:1:ngày" -> true
  g.unlocked = g.unlocked || {}; // trạm -> thời điểm quét
  g.chest = g.chest || {};     // "s1" -> true
  g.days = g.days || [];       // các ngày có chơi
  return g;
}
function save(g) { store.set("game", g); }
const today = () => Math.floor((Date.now() + 7 * 3600e3) / 86400e3); // ngày theo giờ Việt Nam
const key = (st) => `${SEASON.id}:${st}:${today()}`;
const letters = (g) => g.letters[SEASON.id] || {};
const puzzleOf = (st) => { const pool = SEASON.puzzles[st]; return pool[(today() + st) % pool.length]; };
const isUnlocked = (g, st) => g.unlocked[st] && Date.now() - g.unlocked[st] < UNLOCK_MINUTES * 60e3;
const rankOf = (p) => [...RANKS].reverse().find((r) => p >= r.min);
const nextRank = (p) => RANKS.find((r) => r.min > p);

// ---------------- Hiệu ứng ----------------

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function floatPts(n) {
  const f = document.createElement("div");
  f.className = "float-pts";
  f.textContent = "+" + n;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1500);
}
function confetti(n = 40) {
  const colors = ["#ffc94d", "#5ce1e6", "#ff7a59", "#3ddc84", "#ffffff"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = Math.random() * 0.6 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2600);
  }
}
function updatePill() {
  const el = document.getElementById("pts");
  if (el) el.textContent = game().points.toLocaleString("vi-VN");
}

// Biển đêm động trên hero: sóng, bọt nước và sao.
let oceanRaf = null;
function startOcean(canvas) {
  cancelAnimationFrame(oceanRaf);
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H;
  const resize = () => { W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize();
  const stars = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random() * 0.45, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6 }));
  const bubbles = Array.from({ length: 26 }, () => ({ x: Math.random(), y: 0.6 + Math.random() * 0.4, r: Math.random() * 2.5 + 1, v: Math.random() * 0.0015 + 0.0006 }));
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let t = 0;
  const frame = () => {
    if (!canvas.isConnected) return;
    t += 0.016;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#07203a"); g.addColorStop(0.55, "#0d3a60"); g.addColorStop(1, "#0f4d7a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // mặt trăng
    ctx.beginPath(); ctx.arc(W * 0.84, H * 0.16, 22, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,236,190,.9)"; ctx.shadowColor = "#ffe9a8"; ctx.shadowBlur = 30; ctx.fill(); ctx.shadowBlur = 0;
    stars.forEach((s) => { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t + s.p)); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;
    // sóng
    [[0.62, "rgba(31,138,192,.35)", 14, 0.8], [0.72, "rgba(19,89,139,.55)", 10, 1.2], [0.84, "rgba(6,26,46,.75)", 8, 1.6]].forEach(([y0, col, amp, sp]) => {
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H * y0 + Math.sin(x / 60 + t * sp) * amp + Math.sin(x / 23 + t * sp * 1.7) * amp * 0.3);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    });
    // thúng chai bồng bềnh
    const bx = W * 0.7, by = H * 0.62 + Math.sin(bx / 60 + t * 0.8) * 14 - 6;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(t * 1.3) * 0.08);
    ctx.fillStyle = "#6b3f19"; ctx.beginPath(); ctx.ellipse(0, 4, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#a8703c"; ctx.beginPath(); ctx.ellipse(0, 0, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3b2408"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8, -2); ctx.lineTo(26, -26); ctx.stroke();
    ctx.restore();
    // bọt nước
    bubbles.forEach((b) => { b.y -= b.v; if (b.y < 0.58) b.y = 1; ctx.strokeStyle = "rgba(92,225,230,.5)"; ctx.beginPath(); ctx.arc(b.x * W, b.y * H, b.r, 0, Math.PI * 2); ctx.stroke(); });
    if (!still) oceanRaf = requestAnimationFrame(frame);
  };
  window.addEventListener("resize", resize, { once: true });
  frame();
}

function typeLegend(el, text) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || store.get("legendSeen", false)) {
    el.textContent = text; el.classList.add("done"); return;
  }
  let i = 0;
  const tick = () => {
    if (!el.isConnected) return;
    el.textContent = text.slice(0, i); i += 2;
    if (i <= text.length + 2) setTimeout(tick, 18); else { el.classList.add("done"); store.set("legendSeen", true); }
  };
  tick();
}

// ---------------- Hải đồ (bản đồ kho báu) ----------------

const PIN_POS = { 1: [51, 27.9], 2: [37.2, 28.2], 3: [22, 17.2], 4: [46, 8.6], 5: [70.5, 4.6], 6: [79.6, 21] };
const BOAT_PATH = "16,18.8 30,24.4 44,27.2 66,27.6 76.5,25.5 77.5,12 70.5,5.6 55,7.9 40,11 26,14.3 16,18.8";
function hullPath(cx, cy, L, W) {
  let d = "";
  for (let i = 0; i <= 40; i++) { const u = -1 + i / 20; d += `${i ? "L" : "M"}${cx + (u * L) / 2},${cy - (W / 2) * (1 - u * u)} `; }
  for (let i = 0; i <= 40; i++) { const u = 1 - i / 20; d += `L${cx + (u * L) / 2},${cy + (W / 2) * (1 - u * u)} `; }
  return d + "Z";
}
function mapSvg(g) {
  const L = letters(g);
  const pins = STATIONS.map((s) => {
    const [x, y] = PIN_POS[s.id];
    const got = L[s.id];
    return `<g class="pin">
      ${got ? "" : `<circle class="halo" cx="${x}" cy="${y}" r="2.7" fill="#e4572e"/>`}
      <circle cx="${x}" cy="${y}" r="2.7" fill="${got ? "#ffc94d" : "#7a4a24"}" stroke="#3b2408" stroke-width=".5"/>
      <text x="${x}" y="${y + 1.15}" font-size="3.1" font-weight="800" fill="${got ? "#3b2408" : "#fbf1dc"}" text-anchor="middle">${got || "?"}</text></g>`;
  }).join("");
  const done = g.chest[SEASON.id];
  return `
  <svg viewBox="-4 -4 92 52" role="img" aria-label="Hải đồ Bến Sáng Tạo Vũng Thùng">
    <defs><filter id="ink"><feTurbulence baseFrequency=".6" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale=".35"/></filter></defs>
    <text x="0" y="-0.6" font-size="2.6" font-weight="800" fill="#5b3a12" letter-spacing=".3">HẢI ĐỒ LÃO NGƯ TƯ</text>
    <g filter="url(#ink)" fill="none" stroke="#6d4c2a" stroke-width=".35">
      <path d="M0 12.79 L42.55 41.15 L75.12 41.15 A6 6 0 0 0 81.12 35.15 L81.12 0Z" fill="rgba(122,160,90,.18)"/>
    </g>
    <path d="${hullPath(34, 19.8, 20, 7.5)}" fill="rgba(214,51,108,.18)" stroke="#8a4b2a" stroke-width=".35"/>
    <path d="M47 10.2 L70 6.8 L75.5 12 L74.5 24.5 L66 26.3 L47 25.8Z" fill="rgba(122,160,90,.28)"/>
    <rect x="44.5" y="29.5" width="21.5" height="9.7" fill="rgba(240,165,0,.18)" stroke="#b08a4a" stroke-width=".25"/>
    <polyline points="${BOAT_PATH}" fill="none" stroke="#8a5a2b" stroke-width=".55" class="route"/>
    <text x="34" y="20.6" font-size="1.9" fill="#8a1c47" text-anchor="middle" font-weight="700">Giàn Thuyền Hoa Giấy</text>
    <text x="61" y="18" font-size="2.2" fill="#3b5a22" text-anchor="middle" font-weight="700">Sân Bến</text>
    <text x="55" y="37" font-size="1.9" fill="#7a5b00" text-anchor="middle" font-weight="700">Sân chơi Thúng Chai</text>
    <text x="59" y="47.4" font-size="2" fill="#6d5a3a" text-anchor="middle">Vũng Thùng 4</text>
    <text x="86.4" y="21" font-size="2" fill="#6d5a3a" text-anchor="middle" transform="rotate(90 86.4 21)">Ngô Thì Trí</text>
    <text x="16" y="32.5" font-size="2" fill="#6d5a3a" text-anchor="middle" transform="rotate(33.7 16 32.5)">Lý Nhật Quang</text>
    <g class="chest-pin"><text x="73.5" y="36" font-size="6" text-anchor="middle">${done ? "💰" : "🧰"}</text></g>
    <text x="73.5" y="39.2" font-size="1.8" fill="#5b3a12" text-anchor="middle" font-weight="800">RƯƠNG · CỔNG BẾN</text>
    <g transform="translate(4 36)"><circle r="3.4" fill="none" stroke="#6d4c2a" stroke-width=".3"/><path d="M0 -3 L.8 0 L0 3 L-.8 0Z" fill="#8a1c47"/><text y="-3.8" font-size="1.8" text-anchor="middle" fill="#6d4c2a">N</text></g>
    ${pins}
  </svg>`;
}

function slots(g, animateId) {
  const L = letters(g);
  return `<div class="slots">${STATIONS.map((s) => `<div class="slot ${L[s.id] ? "on" : ""}" ${animateId === s.id ? "" : 'style="animation:none"'}>${L[s.id] || ""}</div>`).join("")}</div>`;
}

function seasonCountdown() {
  const end = new Date("2026-11-01T00:00:00+07:00").getTime();
  const ms = Math.max(0, end - Date.now());
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return `<div class="countdown"><div><b>${d}</b><small>ngày</small></div><div><b>${h}</b><small>giờ</small></div><div><b>${m}</b><small>phút</small></div></div>`;
}

// ---------------- Trang chủ ----------------

function pageHome() {
  const g = game();
  const r = rankOf(g.points), nr = nextRank(g.points);
  const n = Object.keys(letters(g)).length;
  return `
  <section class="hero">
    <canvas id="ocean" aria-hidden="true"></canvas>
    <span class="eyebrow">Bến Sáng Tạo Vũng Thùng · ${esc(SEASON.name)}</span>
    <h1><span class="glow-text">Săn Kho Báu<br>Vũng Thùng</span></h1>
    <p class="legend" id="legend"></p>
    <div class="cta"><a class="btn" href="#/quet">📷 Quét mã tại trạm</a><a class="btn ghost" href="#/hai-do">🗺️ Mở hải đồ</a></div>
  </section>

  <a class="card sailor" href="#/the" style="text-decoration:none;color:inherit">
    <div class="rank">${r.icon}</div>
    <div style="flex:1">
      <div class="muted" style="font-size:12px">Thẻ thủy thủ ${esc(g.sailor)}</div>
      <b>${esc(r.name)}</b> · <span style="color:var(--gold);font-weight:800">${g.points} điểm</span>
      <div class="bar"><i style="width:${nr ? Math.min(100, ((g.points - r.min) / (nr.min - r.min)) * 100) : 100}%"></i></div>
      <div class="muted" style="font-size:12px;margin-top:3px">${nr ? `Còn ${nr.min - g.points} điểm để lên ${esc(nr.name)}` : "Cấp cao nhất!"}</div>
    </div>
  </a>

  <div class="card">
    <div class="row" style="justify-content:space-between"><b>Mảnh hải đồ mùa này</b><span class="muted">${n}/6</span></div>
    ${slots(g)}
    <p class="muted" style="text-align:center;margin:4px 0 0">${n === 6 ? (g.chest[SEASON.id] ? "Bạn đã mở rương mùa này! 💰" : "Đủ 6 mảnh! Đến Cổng Bến để mở rương 🧰") : "Mỗi trạm giữ một chữ cái. Ghép đủ 6 chữ để mở rương báu."}</p>
  </div>

  <h2>Cách chơi</h2>
  <div class="steps">
    <div><b>🚶</b>Đi dọc lối đi hình con thuyền</div>
    <div><b>📷</b>Quét mã QR ngay tại trạm</div>
    <div><b>🧩</b>Giải câu đố, nhận mảnh hải đồ</div>
    <div><b>🧰</b>Ghép mật mã, mở rương ở Cổng Bến</div>
  </div>
  <p class="muted">Câu đố <b>chỉ mở khi bạn đứng tại trạm và quét đúng mã</b> – không thể giải từ nhà.</p>

  <h2>Kho báu không bao giờ cạn</h2>
  <div class="card season-card gold">
    <span class="tag">ĐANG DIỄN RA</span>
    <h3 style="margin-top:8px">${esc(SEASON.name)}</h3>
    <p class="muted" style="margin:0">Mỗi ngày mỗi trạm một câu đố khác · mùa mới với mật mã mới sau:</p>
    ${seasonCountdown()}
  </div>
  <div class="seasons-row">
    ${SEASONS.filter((s) => !s.active).map((s) => `
      <div class="card season-card locked-season"><span class="tag soon">${esc(s.period)}</span><h3 style="margin-top:8px">${esc(s.name)}</h3><p class="muted" style="margin:0">${esc(s.teaser)}</p></div>`).join("")}
  </div>
  <a class="btn ghost small" href="#/mua">Vì sao trò chơi luôn mới? →</a>

  <h2>Bạn là…</h2>
  <div class="audiences">
    <a class="aud" href="#/giao-vien"><span>👩‍🏫</span>Thầy cô dẫn lớp</a>
    <a class="aud" href="#/visitors"><span>🌏</span>Visitors (EN)</a>
    <a class="aud" href="#/y-tuong"><span>🏘️</span>Cư dân góp ý</a>
  </div>`;
}
function bindHome() {
  const c = document.getElementById("ocean");
  if (c) startOcean(c);
  typeLegend(document.getElementById("legend"), LEGEND);
}

// ---------------- Hải đồ ----------------

function pageMap() {
  const g = game();
  const L = letters(g);
  return `
  <span class="eyebrow">${esc(SEASON.name)}</span>
  <h1>Hải đồ kho báu</h1>
  <p class="muted">Chấm “?” là trạm chưa giải. Đến tận nơi, tìm biển trạm có mã QR để mở câu đố.</p>
  <div class="mapwrap">${mapSvg(g)}</div>
  ${slots(g)}
  <div class="st-list" style="margin-top:12px">
    ${STATIONS.map((s) => `
      <a class="st ${L[s.id] ? "solved" : ""}" href="#/tram/${s.id}">
        <span class="ico">${s.icon}</span>
        <span><b>Trạm ${s.id} · ${esc(s.title)}</b><small>${L[s.id] ? "Đã có mảnh hải đồ · xem nhật ký khoa học" : "🔒 Đến trạm và quét mã để mở"}</small></span>
        ${L[s.id] ? `<span class="letter">${L[s.id]}</span>` : `<span class="lock">🔒</span>`}
      </a>`).join("")}
  </div>
  ${Object.keys(L).length === 6 ? `<p style="margin-top:14px"><a class="btn" href="#/ruong">🧰 Đến Cổng Bến mở rương</a></p>` : ""}`;
}

// ---------------- Quét mã ----------------

let scanStream = null;
function stopScan() {
  if (scanStream) { scanStream.getTracks().forEach((t) => t.stop()); scanStream = null; }
}
function pageScan() {
  return `
  <h1>Quét mã tại trạm</h1>
  <p class="muted">Mỗi trạm có một biển gỗ với mã QR. Hãy đứng trước biển trạm và quét.</p>
  <div class="scanner" id="scanner">
    <div class="idle" id="scan-idle"><div><div style="font-size:48px">📷</div>Chạm “Bật camera” để quét,<br>hoặc dùng ứng dụng camera của điện thoại.</div></div>
  </div>
  <div class="row" style="justify-content:center"><button class="btn" id="cam">Bật camera</button></div>
  <h2>Hoặc nhập mã in dưới QR</h2>
  <form class="codebox" id="codeform"><input id="code" maxlength="6" placeholder="VD: B7TC" autocomplete="off"><button class="btn sea" type="submit">Mở</button></form>
  <p class="muted" style="margin-top:14px">Ban giám khảo không ở công viên? Xem <a href="#/giam-khao">chế độ trình diễn</a>.</p>`;
}
function handleCode(raw) {
  const code = String(raw || "").trim().toUpperCase().replace(/.*#\/Q\//, "");
  if (code === CHEST_CODE) { location.hash = "#/q/" + CHEST_CODE; return true; }
  if (STATION_CODES[code]) { location.hash = "#/q/" + code; return true; }
  toast("Mã không đúng. Hãy kiểm tra lại mã in dưới QR.");
  return false;
}
function bindScan() {
  document.getElementById("codeform").addEventListener("submit", (e) => { e.preventDefault(); handleCode(document.getElementById("code").value); });
  document.getElementById("cam").addEventListener("click", async () => {
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices) {
      toast("Máy này chưa hỗ trợ quét trong trang – hãy dùng ứng dụng camera để quét mã QR.");
      return;
    }
    try {
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const box = document.getElementById("scanner");
      box.innerHTML = `<video playsinline muted></video><div class="frame"></div><div class="laser"></div>`;
      const video = box.querySelector("video");
      video.srcObject = scanStream;
      await video.play();
      const det = new BarcodeDetector({ formats: ["qr_code"] });
      const loop = async () => {
        if (!scanStream || !video.isConnected) return stopScan();
        try {
          const r = await det.detect(video);
          if (r.length) { stopScan(); if (!handleCode(r[0].rawValue)) setTimeout(route, 1500); return; }
        } catch (e) { /* khung hình chưa sẵn sàng */ }
        requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      toast("Không mở được camera. Hãy cho phép quyền camera hoặc nhập mã bên dưới.");
    }
  });
}

// ---------------- Mở khóa trạm qua mã QR ----------------

function resolveCode(code) {
  code = (code || "").toUpperCase();
  if (code === CHEST_CODE) { location.replace("#/ruong"); return; }
  const st = STATION_CODES[code];
  if (!st) { location.replace("#/quet"); toast("Mã không hợp lệ."); return; }
  const g = game();
  g.unlocked[st] = Date.now();
  save(g);
  store.set("justUnlocked", st);
  location.replace("#/tram/" + st);
}

// ---------------- Trạm ----------------

function pageStation(id) {
  const s = STATIONS.find((x) => x.id === id);
  if (!s) return pageNotFound();
  const g = game();
  const solvedToday = g.solved[key(id)];
  const hasLetter = letters(g)[id];
  if (!isUnlocked(g, id)) {
    return `
    <div class="card gate">
      <div class="big">🔒</div>
      <span class="eyebrow">Trạm ${id} · ${esc(s.title)}</span>
      <h1>Câu đố đang bị khóa</h1>
      <p>Câu đố chỉ mở khi bạn <b>đứng tại trạm ${id}</b> và quét mã QR trên biển trạm${solvedToday ? "" : ". Hôm nay trạm này có một câu đố mới đang chờ bạn!"}</p>
      <div class="row" style="justify-content:center"><a class="btn" href="#/quet">📷 Quét mã</a><a class="btn ghost" href="#/hai-do">🗺️ Xem hải đồ</a></div>
    </div>
    ${hasLetter ? scienceCard(s) : ""}`;
  }
  const just = store.get("justUnlocked", 0) === id;
  if (just) store.set("justUnlocked", 0);
  const p = puzzleOf(id);
  const typeName = { choice: "CÂU ĐỐ CHỌN ĐÁP ÁN", code: "Ổ KHÓA SỐ", order: "MẢNH GIẤY BỊ XÉ" }[p.type];
  const usedHint = g.hints[key(id)];
  return `
  ${just ? `<div class="unlock-anim"><span class="compass">🧭</span><div class="eyebrow" style="margin-top:6px">Đã tìm thấy trạm ${id}!</div></div>` : ""}
  <p class="muted" style="margin-top:14px"><a href="#/hai-do">← Hải đồ</a> · Trạm ${id}/6 · ${s.icon} ${esc(s.title)}</p>
  <div class="parch" id="puzzle">
    <span class="puzzle-type">${typeName}</span>
    <h3 style="margin-top:10px;font-size:17px">${esc(p.q)}</h3>
    ${solvedToday ? `<p class="muted">✅ Bạn đã giải câu đố hôm nay. Ngày mai trạm này sẽ có câu đố mới!</p>` : puzzleBody(p)}
    ${!solvedToday ? `<div id="hintbox">${usedHint ? `<div class="hint">💡 ${esc(p.hint)}</div>` : `<button class="btn ghost small" id="hint" style="color:#5b3a12;border-color:#b08a4a;margin-top:10px">💡 Gợi ý (−${POINTS.hintCost} điểm)</button>`}</div>` : ""}
    <p id="msg" class="muted" style="margin:10px 0 0"></p>
  </div>
  <div id="after">${solvedToday ? rewardBlock(s, g, false) : ""}</div>`;
}

function puzzleBody(p) {
  if (p.type === "choice") return p.options.map((o, i) => `<button class="opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${esc(o)}</button>`).join("");
  if (p.type === "code") {
    return `<div class="lock-dials">${Array.from({ length: p.digits }, (_, i) => `
      <div class="dial"><button data-d="${i}" data-s="1">▲</button><div class="num" id="d${i}">0</div><button data-d="${i}" data-s="-1">▼</button></div>`).join("")}</div>
      <div class="row" style="justify-content:center"><button class="btn" id="try">🔓 Mở khóa</button></div>`;
  }
  const shuffled = p.items.map((t, i) => ({ t, i })).sort(() => Math.random() - 0.5);
  return `<p class="muted">Chạm vào từng mảnh theo đúng thứ tự (chạm lại để bỏ chọn):</p>
    <div class="order-pool" id="pool">${shuffled.map((x) => `<button type="button" class="chipbtn" data-i="${x.i}"><span class="n">·</span>${esc(x.t)}</button>`).join("")}</div>
    <div class="row"><button class="btn small" id="check" disabled>Kiểm tra</button><button class="btn ghost small" id="reset" style="color:#5b3a12;border-color:#b08a4a">Làm lại</button></div>`;
}

function scienceCard(s) {
  return `<div class="card science"><h3>📖 Nhật ký khoa học · ${esc(s.title)}</h3><p>${esc(s.science)}</p><p class="muted">✋ Thử ngay: ${esc(s.tryit)}</p>
    <div class="row"><button class="btn ghost small" id="speak">🔊 Nghe đọc</button></div></div>`;
}

function rewardBlock(s, g, fresh) {
  const letter = letters(g)[s.id];
  const all = Object.keys(letters(g)).length === 6;
  return `
  <div class="card reward gold">
    <div class="eyebrow">${fresh ? "Giải đúng!" : "Mảnh hải đồ của trạm"}</div>
    <div class="fragment">${letter}</div>
    <p>${all ? "Đủ 6 mảnh! Mang mật mã đến <b>Cổng Bến</b> và quét mã rương." : "Mảnh hải đồ đã được thêm vào bộ sưu tập."}</p>
    ${slots(g, fresh ? s.id : 0)}
    <div class="row" style="justify-content:center">${all && !g.chest[SEASON.id] ? `<a class="btn" href="#/ruong">🧰 Mở rương</a>` : `<a class="btn" href="#/hai-do">🗺️ Trạm tiếp theo</a>`}</div>
  </div>
  ${scienceCard(s)}`;
}

function solve(id) {
  const g = game();
  const k = key(id);
  if (g.solved[k]) return;
  g.solved[k] = true;
  let pts = POINTS.solve + (g.hints[k] ? 0 : POINTS.noHint);
  const d = today();
  if (g.days.length && !g.days.includes(d)) pts += POINTS.dailyReturn;
  if (!g.days.includes(d)) g.days.push(d);
  g.letters[SEASON.id] = g.letters[SEASON.id] || {};
  const fresh = !g.letters[SEASON.id][id];
  g.letters[SEASON.id][id] = SEASON.letters[id];
  g.points += pts;
  save(g);
  floatPts(pts);
  confetti();
  updatePill();
  const s = STATIONS.find((x) => x.id === id);
  document.getElementById("after").innerHTML = rewardBlock(s, g, fresh);
  document.querySelectorAll("#hintbox").forEach((h) => (h.style.display = "none"));
  bindSpeak(s);
  setTimeout(() => document.getElementById("after").scrollIntoView({ behavior: "smooth", block: "start" }), 250);
}

function bindSpeak(s) {
  const sp = document.getElementById("speak");
  if (!sp) return;
  if (!("speechSynthesis" in window)) { sp.style.display = "none"; return; }
  sp.addEventListener("click", () => {
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); sp.textContent = "🔊 Nghe đọc"; return; }
    const u = new SpeechSynthesisUtterance(`${s.title}. ${s.science}`);
    u.lang = "vi-VN";
    const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith("vi"));
    if (v) u.voice = v;
    u.onend = () => (sp.textContent = "🔊 Nghe đọc");
    speechSynthesis.speak(u);
    sp.textContent = "⏹ Dừng";
  });
}

function bindStation(id) {
  const s = STATIONS.find((x) => x.id === id);
  if (!s) return;
  bindSpeak(s);
  const g = game();
  if (!isUnlocked(g, id) || g.solved[key(id)]) return;
  const p = puzzleOf(id);
  const msg = document.getElementById("msg");
  const wrong = (t) => { msg.textContent = t || "Chưa đúng! Thử lại nhé – hoặc dùng gợi ý."; };
  const hb = document.getElementById("hint");
  if (hb) hb.addEventListener("click", () => {
    const g2 = game();
    g2.hints[key(id)] = true;
    g2.points = Math.max(0, g2.points - POINTS.hintCost);
    save(g2); updatePill();
    document.getElementById("hintbox").innerHTML = `<div class="hint">💡 ${esc(p.hint)}</div>`;
  });
  if (p.type === "choice") {
    document.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll(".opt").forEach((x) => x.classList.remove("wrong"));
      if (Number(b.dataset.i) === p.answer) { b.classList.add("right"); solve(id); }
      else { b.classList.add("wrong"); wrong(); }
    }));
  } else if (p.type === "code") {
    const vals = Array(p.digits).fill(0);
    document.querySelectorAll(".dial button").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.d);
      vals[i] = (vals[i] + Number(b.dataset.s) + 10) % 10;
      document.getElementById("d" + i).textContent = vals[i];
    }));
    document.getElementById("try").addEventListener("click", () => {
      const v = vals.join("").replace(/^0+(?=\d)/, "");
      if (p.answer.includes(v)) { document.querySelector(".lock-dials").style.filter = "drop-shadow(0 0 12px #3ddc84)"; solve(id); }
      else { document.querySelector(".lock-dials").animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "none" }], 300); wrong("Ổ khóa không mở… Tính lại xem!"); }
    });
  } else {
    const picked = [];
    const draw = () => {
      document.querySelectorAll("#pool .chipbtn").forEach((b) => {
        const pos = picked.indexOf(Number(b.dataset.i));
        b.classList.toggle("picked", pos >= 0);
        b.querySelector(".n").textContent = pos >= 0 ? pos + 1 : "·";
      });
      document.getElementById("check").disabled = picked.length !== p.items.length;
    };
    document.querySelectorAll("#pool .chipbtn").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      const pos = picked.indexOf(i);
      if (pos >= 0) picked.splice(pos, 1); else picked.push(i);
      draw();
    }));
    document.getElementById("reset").addEventListener("click", () => { picked.length = 0; draw(); msg.textContent = ""; });
    document.getElementById("check").addEventListener("click", () => {
      if (picked.every((v, i) => v === i)) solve(id);
      else { wrong("Thứ tự chưa đúng, lão Tư lắc đầu… Làm lại nhé!"); picked.length = 0; draw(); }
    });
  }
}

// ---------------- Rương báu ----------------

function pageChest() {
  const g = game();
  const L = letters(g);
  const n = Object.keys(L).length;
  if (g.chest[SEASON.id]) {
    return `<div class="card gate gold"><div class="chest open"><div class="lid"></div><div class="base"></div><div class="shine"></div></div>
      <span class="eyebrow">Mật mã: ${esc(SEASON.wordReveal)}</span><h1>Rương mùa này đã mở!</h1>
      <p>Bạn là một trong những thủy thủ giải được bí ẩn của ${esc(SEASON.name)}. Đón chờ mùa mới với mật mã mới.</p>
      <a class="btn" href="#/the">🪪 Xem thẻ thủy thủ</a></div>`;
  }
  if (n < 6) {
    return `<div class="card gate"><div class="chest"><div class="lid"></div><div class="base"></div></div>
      <h1>Rương còn khóa chặt</h1><p>Bạn mới có ${n}/6 mảnh hải đồ. Giải đủ 6 trạm rồi quay lại Cổng Bến nhé!</p>${slots(g)}
      <a class="btn" href="#/hai-do">🗺️ Xem hải đồ</a></div>`;
  }
  const tiles = Object.values(L).map((c, i) => ({ c, i })).sort(() => Math.random() - 0.5);
  return `
  <div class="card gate gold">
    <div class="chest" id="chest"><div class="lid"></div><div class="base"></div><div class="shine"></div></div>
    <span class="eyebrow">Rương báu của lão ngư Tư</span>
    <h1>Ghép mật mã</h1>
    <p><i>“${esc(SEASON.wordHint)}”</i></p>
    <div class="slots" id="answer">${Array.from({ length: 6 }, () => `<div class="slot" style="animation:none"></div>`).join("")}</div>
    <div class="tiles">${tiles.map((x) => `<button class="tile" data-c="${x.c}" data-i="${x.i}">${x.c}</button>`).join("")}</div>
    <div class="row" style="justify-content:center"><button class="btn ghost small" id="clear">Xóa</button></div>
    <p id="cmsg" class="muted"></p>
  </div>`;
}
function bindChest() {
  const ans = [];
  const draw = () => {
    document.querySelectorAll("#answer .slot").forEach((s, i) => { s.textContent = ans[i] ? ans[i].c : ""; s.classList.toggle("on", !!ans[i]); });
    document.querySelectorAll(".tile").forEach((t) => t.classList.toggle("used", ans.some((a) => a.el === t)));
  };
  document.querySelectorAll(".tile").forEach((t) => t.addEventListener("click", () => {
    ans.push({ c: t.dataset.c, el: t }); draw();
    if (ans.length === 6) {
      if (ans.map((a) => a.c).join("") === SEASON.word) {
        const g = game(); g.chest[SEASON.id] = true; g.points += POINTS.chest; save(g); updatePill();
        document.getElementById("chest").classList.add("open");
        document.getElementById("cmsg").innerHTML = `<b style="color:var(--gold);font-size:18px">${esc(SEASON.wordReveal)}!</b> Rương đã mở – +${POINTS.chest} điểm!`;
        floatPts(POINTS.chest); confetti(90);
        setTimeout(route, 3500);
      } else {
        document.getElementById("cmsg").textContent = "Rương vẫn im lìm… Thử sắp xếp lại!";
        setTimeout(() => { ans.length = 0; draw(); }, 700);
      }
    }
  }));
  const c = document.getElementById("clear");
  if (c) c.addEventListener("click", () => { ans.length = 0; draw(); });
}

// ---------------- Thẻ thủy thủ ----------------

function pageCard() {
  const g = game();
  const r = rankOf(g.points);
  const L = letters(g);
  return `
  <h1>Thẻ thủy thủ</h1>
  <div class="idcard">
    <div class="eyebrow" style="color:#fff">Bến Sáng Tạo Vũng Thùng</div>
    <div style="font-size:40px;margin:6px 0">${r.icon}</div>
    <b style="font-size:20px">${esc(r.name)}</b>
    <div class="code" style="margin-top:6px">${esc(g.sailor)}</div>
    <div style="margin-top:6px"><span style="color:var(--gold);font-weight:800;font-size:22px">${g.points}</span> điểm hải trình</div>
    <div class="stamps">${STATIONS.map((s) => `<div class="stamp ${L[s.id] ? "on" : ""}">${L[s.id] ? s.icon : ""}</div>`).join("")}</div>
  </div>
  <p class="muted">Mã thẻ ngẫu nhiên, không gắn với tên hay số điện thoại. Trẻ em không có điện thoại có thể dùng <b>thẻ giấy</b> phát tại buổi Hải trình Chủ nhật (đề xuất).</p>

  <h2>Tích điểm thế nào?</h2>
  <div class="card"><table>
    <tr><td>Giải đúng một câu đố</td><td><b>+${POINTS.solve}</b></td></tr>
    <tr><td>Không dùng gợi ý</td><td><b>+${POINTS.noHint}</b></td></tr>
    <tr><td>Quay lại chơi vào ngày khác</td><td><b>+${POINTS.dailyReturn}</b></td></tr>
    <tr><td>Mở rương báu của mùa</td><td><b>+${POINTS.chest}</b></td></tr>
    <tr><td>Dùng gợi ý</td><td><b>−${POINTS.hintCost}</b></td></tr>
  </table><p class="muted">Mỗi ngày mỗi trạm có câu đố mới, nên càng quay lại nhiều điểm càng cao.</p></div>

  <h2>Đổi điểm lấy quà</h2>
  <div class="card">
    ${REWARDS.map((w) => `<div class="reward-row"><span>${esc(w.item)}</span><span class="chip" style="${g.points >= w.pts ? "background:rgba(61,220,132,.2);color:#3ddc84" : ""}">${w.pts} điểm ${g.points >= w.pts ? "✓" : ""}</span></div>`).join("")}
    <p class="muted" style="margin-top:8px">Quà nhỏ do nhà đỡ đầu tài trợ, đổi tại buổi Hải trình Chủ nhật bằng cách đưa màn hình thẻ này (đề xuất).</p>
  </div>`;
}

// ---------------- Mùa chơi ----------------

function pageSeasons() {
  return `
  <span class="eyebrow">Trò chơi luôn mới</span>
  <h1>Kho báu không bao giờ cạn</h1>
  <div class="card">
    <div class="timeline">
      <div class="step"><div class="time">Mỗi ngày</div><b>Câu đố xoay vòng</b><p class="muted" style="margin:0">Mỗi trạm có một kho câu đố; hôm nay và ngày mai gặp câu khác nhau. Quay lại được cộng điểm.</p></div>
      <div class="step"><div class="time">Mỗi tháng</div><b>Mùa mới, mật mã mới</b><p class="muted" style="margin:0">Chủ đề, câu đố, chữ cái và mật mã rương thay đổi hoàn toàn. Mã QR trên biển trạm giữ nguyên, nội dung phía sau được làm mới.</p></div>
      <div class="step"><div class="time">Ai soạn?</div><b>Giáo viên + AI hỗ trợ + người duyệt</b><p class="muted" style="margin:0">Giáo viên các trường lân cận đề xuất chủ đề; AI giúp soạn nháp nhiều biến thể câu đố; con người kiểm tra tính chính xác trước khi phát hành.</p></div>
      <div class="step"><div class="time">Cộng đồng</div><b>Chủ đề do người chơi bình chọn</b><p class="muted" style="margin:0">Người dân đề xuất chủ đề mùa sau trong Hòm ý tưởng.</p></div>
    </div>
  </div>
  <h2>Lịch các mùa</h2>
  ${SEASONS.map((s) => `<div class="card season-card ${s.active ? "gold" : "locked-season"}"><span class="tag ${s.active ? "" : "soon"}">${s.active ? "ĐANG DIỄN RA" : esc(s.period)}</span><h3 style="margin-top:8px">${esc(s.name)}</h3>${s.teaser ? `<p class="muted" style="margin:0">${esc(s.teaser)}</p>` : `<p class="muted" style="margin:0">${esc(s.period)} · 6 trạm · 12 câu đố xoay vòng</p>`}</div>`).join("")}`;
}

// ---------------- Chế độ trình diễn cho giám khảo ----------------

function pageDemo() {
  const codes = Object.entries(STATION_CODES);
  return `
  <span class="eyebrow">Dành cho Ban Giám khảo</span>
  <h1>Chế độ trình diễn</h1>
  <p>Ngoài đời thật, người chơi phải đứng tại trạm và quét mã QR trên biển trạm. Để xem thử từ xa, bấm nút dưới đây để <b>giả lập</b> việc quét mã tại từng trạm (hoặc quét các mã trên trang <a href="qr.html" target="_blank">in mã QR</a>).</p>
  <div class="st-list">
    ${codes.map(([c, st]) => { const s = STATIONS.find((x) => x.id === st); return `<a class="st" href="#/q/${c}"><span class="ico">${s.icon}</span><span><b>Giả lập quét trạm ${st}</b><small>Mã trạm: ${c}</small></span><span class="lock">📷</span></a>`; }).join("")}
    <a class="st" href="#/q/${CHEST_CODE}"><span class="ico">🧰</span><span><b>Giả lập quét mã rương (Cổng Bến)</b><small>Mã: ${CHEST_CODE}</small></span><span class="lock">📷</span></a>
  </div>
  <div class="row" style="margin-top:14px"><button class="btn ghost small" id="wipe">↺ Xóa tiến độ, chơi lại từ đầu</button></div>`;
}
function bindDemo() {
  document.getElementById("wipe").addEventListener("click", () => { store.set("game", null); store.set("legendSeen", false); updatePill(); toast("Đã xóa tiến độ."); });
}

// ---------------- Giáo viên, du khách, cộng đồng ----------------

function pageTeacher() {
  return `
  <span class="eyebrow">Lớp học ngoài trời</span>
  <h1>Dẫn cả lớp đi săn kho báu</h1>
  <div class="card"><p>${esc(LESSON.fit)} Không cần tài khoản, không cần mỗi em một điện thoại – mỗi nhóm một máy hoặc phiếu in.</p>
    <div class="row noprint"><a class="btn small" href="#/phieu">🖨️ Phiếu học tập in sẵn</a></div></div>
  <h2>Tiến trình 60–75 phút</h2>
  <div class="card"><div class="timeline">
    ${LESSON.steps.map((st) => `<div class="step"><div class="time">${esc(st.time)}</div><b>${esc(st.title)}</b><p class="muted" style="margin:2px 0 0">${esc(st.text)}</p></div>`).join("")}
  </div></div>
  <h2>Mỗi trạm dạy gì?</h2>
  <div class="card"><table>${STATIONS.map((s) => `<tr><td>${s.icon} ${esc(s.title)}</td><td class="muted">${esc(s.subject)}</td></tr>`).join("")}</table></div>
  <h2>An toàn & lưu ý</h2>
  <div class="card"><ul>${LESSON.safety.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
}

function pageWorksheet() {
  return `
  <p class="noprint muted" style="margin-top:14px"><a href="#/giao-vien">← Lớp học ngoài trời</a> · Ctrl + P để in</p>
  <div class="card">
    <h1 style="margin-top:0">Phiếu Săn Kho Báu Vũng Thùng</h1>
    <p>Nhóm: .............................. Lớp: .......... Ngày: ..........</p>
    ${STATIONS.map((s) => `<div style="border-top:1px solid var(--line);padding:8px 0"><b>Trạm ${s.id}. ${esc(s.title)}</b>
      <p style="margin:4px 0">Đáp án của nhóm: ..................................... Chữ cái nhận được: [ &nbsp; ]</p>
      <p style="margin:0">Điều nhóm em thấy thú vị: ...........................................................</p></div>`).join("")}
    <p><b>Mật mã rương:</b> [ &nbsp; ][ &nbsp; ][ &nbsp; ][ &nbsp; ][ &nbsp; ][ &nbsp; ]</p>
  </div>
  <button class="btn noprint" onclick="window.print()">🖨️ In phiếu</button>`;
}

function pageVisitors() {
  return `
  <span class="eyebrow">Visitors</span>
  <h1>Treasure hunt at Vung Thung Wharf</h1>
  <div class="card"><p>This small park sits in the Nai Hien Dong fishing village area of Son Tra, Da Nang. Walk the boat-shaped path, find the six wooden station signs and learn the science behind a Vietnamese fishing village — from bamboo basket boats to fish sauce.</p>
  <p class="muted">Free, no app, no sign-up. Please keep quiet after 9 pm – people live here.</p></div>
  ${STATIONS.map((s) => `<div class="card"><h3>${s.icon} ${s.id}. ${esc(s.en.title)}</h3><p class="muted" style="margin:0 0 6px">${esc(s.en.subject)}</p><p style="margin:0">${esc(s.en.text)}</p></div>`).join("")}`;
}

function ideaItem(it, voted) {
  return `<div class="idea"><button class="vote ${voted ? "on" : ""}" data-id="${esc(it.id)}"><b>${it.votes + (voted ? 1 : 0)}</b>${voted ? "Đã chọn" : "▲ Chọn"}</button>
    <div><span class="chip">${esc(it.cat)}</span>${it.mine ? ' <span class="chip" style="background:rgba(255,201,77,.15);color:var(--gold)">Của bạn</span>' : ""}<div style="margin-top:3px">${esc(it.text)}</div></div></div>`;
}
function pageIdeas() {
  const mine = store.get("ideas", []);
  const votes = store.get("votes", []);
  const score = (it) => it.votes + (votes.includes(it.id) ? 1 : 0);
  const all = [...mine.map((m) => ({ ...m, mine: true })), ...SAMPLE_IDEAS].sort((a, b) => score(b) - score(a));
  return `
  <span class="eyebrow">Cộng đồng cùng kiến tạo</span>
  <h1>Hòm ý tưởng</h1>
  <p class="muted">Công viên không có ngày “làm xong”. Đề xuất hoạt động, cải tạo – hay chủ đề cho mùa săn kho báu tiếp theo.</p>
  <div class="card"><form id="idea-form">
    <label for="cat">Chủ đề</label>
    <select id="cat"><option>Hoạt động</option><option>Tiện ích</option><option>An toàn</option><option>Chủ đề mùa sau</option><option>Khác</option></select>
    <label for="txt">Ý tưởng của bạn</label>
    <textarea id="txt" rows="3" maxlength="300" placeholder="Ví dụ: Mùa sau làm chủ đề về gió mùa và diều"></textarea>
    <p class="muted">Không cần tên hay số điện thoại. Hỏng hóc cần sửa? Dùng <a href="#/su-co">Báo sự cố</a>.</p>
    <button class="btn" type="submit">Gửi ý tưởng</button></form></div>
  <h2>Được bình chọn nhiều nhất</h2>
  <div class="card">${all.map((it) => ideaItem(it, votes.includes(it.id))).join("")}</div>
  <p class="muted">Ý tưởng mẫu là dữ liệu minh họa; trong bản mẫu, ý tưởng của bạn chỉ lưu trên máy này.</p>
  <h2>🤖 AI tổng hợp mỗi tháng</h2>
  <div class="card"><div class="timeline">
    <div class="step"><div class="time">Bước 1</div><b>Ẩn thông tin cá nhân</b></div>
    <div class="step"><div class="time">Bước 2</div><b>AI lọc rác, gom nhóm, đếm mức quan tâm, nhận diện sự cố cần chuyển 1022</b></div>
    <div class="step"><div class="time">Bước 3</div><b>Báo cáo một trang cho tổ dân phố và phường</b></div>
    <div class="step"><div class="time">Bước 4</div><b>Con người quyết định, kết quả công bố lại trên Bến Số</b></div>
  </div><a class="btn sea" href="#/bao-cao">Xem báo cáo mẫu</a></div>`;
}
function bindIdeas() {
  document.getElementById("idea-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const txt = document.getElementById("txt").value.trim();
    if (txt.length < 10) { toast("Hãy viết dài hơn một chút nhé (ít nhất 10 ký tự)."); return; }
    if (/(\d[\s.-]?){9,}/.test(txt) || /@\S+\.\S+/.test(txt)) { toast("Vui lòng bỏ số điện thoại/email khỏi nội dung."); return; }
    const mine = store.get("ideas", []);
    mine.unshift({ id: "m" + Date.now(), cat: document.getElementById("cat").value, text: txt, votes: 0 });
    store.set("ideas", mine); toast("Đã ghi nhận ý tưởng. Cảm ơn bạn!"); route();
  });
  document.querySelectorAll(".vote").forEach((b) => b.addEventListener("click", () => {
    const votes = store.get("votes", []); const id = b.dataset.id;
    store.set("votes", votes.includes(id) ? votes.filter((v) => v !== id) : [...votes, id]); route();
  }));
}

function pageReport() {
  const r = SAMPLE_REPORT;
  const max = Math.max(...r.groups.map((g) => g.count));
  return `
  <p class="muted" style="margin-top:14px"><a href="#/y-tuong">← Hòm ý tưởng</a></p>
  <span class="eyebrow">Báo cáo do AI tổng hợp</span>
  <h1>Góp ý cộng đồng hằng tháng</h1>
  <div class="note warn">Báo cáo MẪU, dữ liệu minh họa – mô tả định dạng đầu ra AI sẽ tạo mỗi tháng.</div>
  <div class="card"><h3>${esc(r.period)}</h3>
    <div class="row" style="margin:6px 0 10px"><span class="chip">Tổng ${r.total}</span><span class="chip">Hợp lệ ${r.valid}</span><span class="chip" style="background:rgba(255,107,107,.15);color:#ff6b6b">Bị lọc ${r.filtered}</span></div>
    ${r.groups.map((g) => `<div class="hbar"><span class="lab">${esc(g.name)}</span><span class="track"><i style="width:${(g.count / max) * 100}%"></i></span><b>${g.count}</b></div><p class="muted" style="margin:0 0 8px">${esc(g.note)}</p>`).join("")}
  </div>
  <div class="card"><h3>Đề xuất việc cần làm tháng tới</h3><ol>${r.actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ol><h3>Chuyển kênh</h3><p>${esc(r.forwarded)}</p></div>`;
}

function pageMore() {
  const links = [
    ["#/mua", "🔄", "Mùa chơi & cách làm mới câu đố"], ["#/giao-vien", "👩‍🏫", "Lớp học ngoài trời cho thầy cô"], ["#/visitors", "🌏", "Visitors (English)"],
    ["#/y-tuong", "💡", "Hòm ý tưởng & báo cáo AI"], ["#/lich", "📅", "Lịch hoạt động"], ["#/do-dau", "🌳", "Đỡ đầu cây xanh, thiết bị"], ["#/su-co", "🛠️", "Báo sự cố (1022)"],
    ["#/gioi-thieu", "ℹ️", "Về dự án & quyền riêng tư"], ["#/giam-khao", "🎬", "Chế độ trình diễn (giám khảo)"],
  ];
  return `<h1>Khám phá thêm</h1><div class="st-list">${links.map(([h, i, t]) => `<a class="st" href="${h}"><span class="ico">${i}</span><span><b>${t}</b></span><span class="lock">›</span></a>`).join("")}</div>`;
}

function pageEvents() {
  return `<h1>Hoạt động tại Bến</h1><p class="muted">Ngày thường là công viên của khu phố; cuối tuần chính các không gian đó thành sân chơi. Mọi hoạt động kết thúc trước 21:00.</p>
  <div class="card"><div class="timeline">${EVENTS.map((e) => `<div class="step"><div class="time">${esc(e.when)}</div><b>${esc(e.what)}</b><p class="muted" style="margin:0">${esc(e.who)}</p></div>`).join("")}</div></div>
  <p class="muted">Lịch mang tính đề xuất trong ý tưởng dự thi.</p>`;
}
function pageSponsor() {
  return `<h1>Đỡ đầu cây xanh, thiết bị</h1><p class="muted">Người đỡ đầu được ghi nhận bằng một dòng chữ nhỏ tại hiện vật và trên trang này – không đặt biển quảng cáo.</p>
  <div class="card"><table>${SPONSORS.map((s) => `<tr><td>${esc(s.item)}</td><td><span class="chip">${esc(s.status)}</span></td></tr>`).join("")}</table></div>`;
}
function pageIncident() {
  return `<h1>Báo sự cố</h1><p>Thiết bị hỏng, cây gãy, mất vệ sinh? Phản ánh qua kênh chính thức của thành phố để được xử lý nhanh:</p>
  <div class="card"><h3>Tổng đài 1022 thành phố Đà Nẵng</h3><p>Ghi rõ: “Công viên góc Ngô Thì Trí – Vũng Thùng 4 – Lý Nhật Quang”, mô tả sự cố và gửi ảnh nếu có.</p><a class="btn" href="tel:1022">📞 Gọi 1022</a></div>`;
}
function pageAbout() {
  return `<h1>Về Bến Sáng Tạo Vũng Thùng</h1>
  <div class="card"><p><b>Bến Sáng Tạo Vũng Thùng – Nơi nghề biển gặp công nghệ</b> là ý tưởng dự thi Cuộc thi Ý tưởng Công viên Đổi mới Sáng tạo Sơn Trà 2026, cho khu đất ~2.000 m² góc Ngô Thì Trí – Vũng Thùng 4 – Lý Nhật Quang.</p>
  <p>“Săn Kho Báu Vũng Thùng” biến 6 trạm khoa học dọc lối đi hình con thuyền thành một trò chơi giải đố gắn với địa điểm thật, được làm mới mỗi ngày và mỗi mùa.</p></div>
  <h2>Quyền riêng tư</h2><div class="card"><ul><li>Không đăng nhập, không hỏi tên; mã thẻ thủy thủ là mã ngẫu nhiên.</li><li>Tiến độ, điểm, ý tưởng trong bản mẫu chỉ lưu trên thiết bị của bạn.</li><li>Khi vận hành thật, góp ý được ẩn thông tin cá nhân trước khi đưa cho AI tổng hợp.</li></ul></div>
  <h2>Minh bạch về AI</h2><div class="card"><p>AI hỗ trợ soạn nháp câu đố và tổng hợp góp ý; mọi nội dung được con người kiểm tra trước khi phát hành. Không có chatbot trả lời tự do.</p></div>`;
}
function pageNotFound() { return `<h1>Không tìm thấy trang</h1><a class="btn" href="#/">Về trang chủ</a>`; }

// ---------------- Định tuyến ----------------

function route() {
  stopScan();
  const h = location.hash.replace(/^#\/?/, "");
  const [page, arg] = h.split("/");
  let html, bind, tab = page || "home";
  switch (page) {
    case "": case undefined: html = pageHome(); bind = bindHome; tab = "home"; break;
    case "hai-do": html = pageMap(); break;
    case "quet": html = pageScan(); bind = bindScan; break;
    case "q": resolveCode(arg); return;
    case "tram": html = pageStation(Number(arg)); bind = () => bindStation(Number(arg)); tab = "hai-do"; break;
    case "ruong": html = pageChest(); bind = bindChest; tab = "hai-do"; break;
    case "the": html = pageCard(); break;
    case "mua": html = pageSeasons(); tab = "more"; break;
    case "giam-khao": html = pageDemo(); bind = bindDemo; tab = "more"; break;
    case "giao-vien": html = pageTeacher(); tab = "more"; break;
    case "phieu": html = pageWorksheet(); tab = "more"; break;
    case "visitors": html = pageVisitors(); tab = "more"; break;
    case "y-tuong": html = pageIdeas(); bind = bindIdeas; tab = "more"; break;
    case "bao-cao": html = pageReport(); tab = "more"; break;
    case "lich": html = pageEvents(); tab = "more"; break;
    case "do-dau": html = pageSponsor(); tab = "more"; break;
    case "su-co": html = pageIncident(); tab = "more"; break;
    case "gioi-thieu": html = pageAbout(); tab = "more"; break;
    case "more": html = pageMore(); break;
    default: html = pageNotFound();
  }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  cancelAnimationFrame(oceanRaf);
  app.innerHTML = html;
  if (bind) bind();
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
  updatePill();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();
