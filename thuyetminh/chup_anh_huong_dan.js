const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const base = 'http://localhost:8765/';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const shot = async (n, wait = 350) => { await p.waitForTimeout(wait); await p.screenshot({ path: `${__dirname}/anh_huong_dan/${n}.jpg`, type: 'jpeg', quality: 82 }); };
  await p.goto(base); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('benso:legendSeen', 'true'); });
  await p.goto(base + '#/more'); await p.goto(base); await shot('01_home', 900);
  await p.evaluate(() => window.scrollTo(0, 560)); await shot('02_home_steps', 300);
  await p.evaluate(() => window.scrollTo(0, 1150)); await shot('03_home_seasons', 300);
  await p.goto(base + '#/hai-do'); await shot('04_map_locked');
  await p.goto(base + '#/tram/1'); await shot('05_station_locked');
  await p.goto(base + '#/quet'); await shot('06_scan');
  await p.goto(base + '#/more'); await p.goto(base + '#/giam-khao'); await shot('07_demo');
  // trạm 1: ổ khóa số
  await p.goto(base + '#/q/B7TC'); await shot('08_unlocked_code', 1300);
  const pz1 = await p.evaluate(() => puzzleOf(1));
  const a1 = pz1.answer[0].padStart(pz1.digits, '0');
  for (let i = 0; i < pz1.digits; i++) for (let k = 0; k < Number(a1[i]); k++) await p.tap(`button[data-d="${i}"][data-s="1"]`);
  await p.evaluate(() => window.scrollTo(0, 250)); await shot('09_code_entered');
  await p.tap('#try'); await p.waitForTimeout(1500); await p.evaluate(() => window.scrollTo(0, 0));
  await p.evaluate(() => document.getElementById('after').scrollIntoView()); await shot('10_reward', 300);
  await p.evaluate(() => window.scrollBy(0, 360)); await shot('11_science', 300);
  // trạm 2: chọn đáp án, thử sai + gợi ý
  await p.goto(base + '#/q/K4ND'); await p.waitForTimeout(1300);
  const pz2 = await p.evaluate(() => puzzleOf(2));
  await p.tap('#hint'); await p.tap(`.opt[data-i="${(pz2.answer + 1) % 3}"]`); await p.evaluate(() => window.scrollTo(0, 180)); await shot('12_choice_wrong_hint');
  await p.tap(`.opt[data-i="${pz2.answer}"]`); await p.waitForTimeout(1500);
  // trạm 3,4
  for (const [c, st] of [['M9CN', 3], ['S2GP', 4]]) {
    await p.goto(base + '#/q/' + c); await p.waitForTimeout(1200);
    const pz = await p.evaluate(s => puzzleOf(s), st);
    if (pz.type === 'choice') await p.tap(`.opt[data-i="${pz.answer}"]`);
    else { const a = pz.answer[0].padStart(pz.digits, '0'); for (let i = 0; i < pz.digits; i++) for (let k = 0; k < Number(a[i]); k++) await p.tap(`button[data-d="${i}"][data-s="1"]`); await p.tap('#try'); }
    await p.waitForTimeout(1500);
  }
  // trạm 5: sắp xếp
  await p.goto(base + '#/q/N5NM'); await p.waitForTimeout(1300);
  const pz5 = await p.evaluate(() => puzzleOf(5));
  if (pz5.type === 'order') {
    await p.tap('#pool .chipbtn[data-i="0"]'); await p.tap('#pool .chipbtn[data-i="1"]');
    await p.evaluate(() => window.scrollTo(0, 200)); await shot('13_order_partial');
    await p.tap('#pool .chipbtn[data-i="2"]'); await p.tap('#pool .chipbtn[data-i="3"]'); await p.tap('#check');
  } else await p.tap(`.opt[data-i="${pz5.answer}"]`);
  await p.waitForTimeout(1500);
  await p.goto(base + '#/q/R6CN'); await p.waitForTimeout(1200);
  const pz6 = await p.evaluate(() => puzzleOf(6));
  if (pz6.type === 'order') { for (let i = 0; i < 4; i++) await p.tap(`#pool .chipbtn[data-i="${i}"]`); await p.tap('#check'); } else await p.tap(`.opt[data-i="${pz6.answer}"]`);
  await p.waitForTimeout(1500);
  await p.goto(base + '#/hai-do'); await p.evaluate(() => window.scrollTo(0, 60)); await shot('14_map_full');
  await p.goto(base + '#/q/RUONG'); await p.waitForTimeout(500);
  await p.evaluate(() => window.scrollTo(0, 0)); await shot('15_chest_locked');
  for (const ch of 'NGUDAN') await p.tap(`.tile:not(.used)[data-c="${ch}"] >> nth=0`);
  await shot('16_chest_open', 1400);
  await p.goto(base + '#/the'); await shot('17_card');
  await p.goto(base + '#/mua'); await shot('18_seasons');
  await p.goto(base + '#/giao-vien'); await shot('19_teacher');
  await p.goto(base + '#/visitors'); await shot('20_visitors');
  await p.goto(base + '#/y-tuong'); await shot('21_ideas');
  await p.goto(base + '#/bao-cao'); await shot('22_report');
  await b.close();
})();
