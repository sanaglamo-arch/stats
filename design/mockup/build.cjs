#!/usr/bin/env node
/* Phase 11 — static MOCKUP of the new "/" (arena hook + inline comprehensive
 * stats body) for manager review. Real numbers from src/data/dataset.json.
 * Renders desktop + mobile PNGs via headless Chrome. NOT app code. */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const OUT = __dirname;
const CHROME = "/usr/bin/google-chrome";
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/dataset.json"), "utf8")).rows;

const NUM = ["matches", "starts", "minutes", "goals", "penaltyGoals", "freekickGoals", "assists", "shots", "shotsOnTarget", "hatTricks"];
const M = rows.filter((r) => r.player === "messi");
const R = rows.filter((r) => r.player === "ronaldo");
const sum = (rs, k) => rs.reduce((a, r) => a + (typeof r[k] === "number" ? r[k] : 0), 0);
const troph = (rs) => rs.reduce((a, r) => a + (r.trophies ? r.trophies.length : 0), 0);
const tot = (rs) => { const o = {}; NUM.forEach((k) => (o[k] = sum(rs, k))); o.ga = o.goals + o.assists; o.trophies = troph(rs); return o; };
const MT = tot(M), RT = tot(R);
const fmt = (n) => n.toLocaleString("ru-RU");

// season-by-season aggregated across all comps
function bySeason(rs) {
  const o = {};
  rs.forEach((r) => {
    const s = (o[r.season] ||= { mp: 0, g: 0, a: 0, min: 0, club: r.club });
    s.mp += r.matches || 0; s.g += r.goals || 0; s.a += r.assists || 0; s.min += r.minutes || 0; s.club = r.club;
  });
  return o;
}
const MS = bySeason(M), RS = bySeason(R);
const seasons = [...new Set([...Object.keys(MS), ...Object.keys(RS)])].sort();

// by competitionType
const TYPES = [["league", "Лиги"], ["champions_league", "Лига чемпионов"], ["domestic_cup", "Нац. кубки"], ["super_cup", "Суперкубки"], ["club_world_cup", "КЧМ"], ["national_team", "Сборная"]];
function byType(rs) { const o = {}; TYPES.forEach(([t]) => { const f = rs.filter((r) => r.competitionType === t); o[t] = { mp: sum(f, "matches"), g: sum(f, "goals"), a: sum(f, "assists") }; }); return o; }
const MByT = byType(M), RByT = byType(R);

// by club
function byClub(rs) {
  const o = {};
  rs.forEach((r) => { const c = (o[r.club] ||= { mp: 0, g: 0, a: 0 }); c.mp += r.matches || 0; c.g += r.goals || 0; c.a += r.assists || 0; });
  return Object.entries(o).sort((a, b) => b[1].g - a[1].g);
}
const MClubs = byClub(M), RClubs = byClub(R);

// ---------- html bits ----------
const lead = (m, r) => (m > r ? "m" : r > m ? "r" : "");
function metricRow(label, key, dec = 0) {
  const m = MT[key], r = RT[key], L = lead(m, r);
  const mv = dec ? (m).toFixed(dec) : fmt(m), rv = dec ? r.toFixed(dec) : fmt(r);
  return `<div class="mrow">
    <div class="mv ${L === "m" ? "win-m" : ""}">${mv}${L === "m" ? '<i class="crown">▲</i>' : ""}</div>
    <div class="ml">${label}</div>
    <div class="rv ${L === "r" ? "win-r" : ""}">${L === "r" ? '<i class="crown">▲</i>' : ""}${rv}</div>
  </div>`;
}
function seasonRows() {
  return seasons.map((s) => {
    const m = MS[s], r = RS[s];
    const mg = m ? m.ga : null, rg = r ? r.ga : null;
    const L = mg == null || rg == null ? "" : lead(mg, rg);
    const cell = (x, side) => x == null
      ? `<td class="na" colspan="4">— не играл —</td>`
      : `<td class="${side === "m" && L === "m" ? "hl-m" : ""}">${x.g}</td><td>${x.a}</td><td class="ga ${side === "m" && L === "m" ? "hl-m" : side === "r" && L === "r" ? "hl-r" : ""}">${x.ga}</td><td class="dim">${x.mp}</td>`;
    const delta = mg != null && rg != null ? (mg - rg) : null;
    const dtxt = delta == null ? "·" : (delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "0");
    return `<tr>
      ${cell(m, "m")}
      <td class="season">${s}</td>
      <td class="delta ${delta > 0 ? "win-m" : delta < 0 ? "win-r" : ""}">${dtxt}</td>
      ${cell(r, "r")}
    </tr>`;
  }).join("");
}
function clubRows(clubs, side) {
  return clubs.slice(0, 6).map(([c, v]) => `<tr><td class="cl">${c}</td><td>${v.mp}</td><td class="g-${side}">${v.g}</td><td>${v.a}</td></tr>`).join("");
}
function typeBars() {
  return TYPES.map(([t, label]) => {
    const m = MByT[t].g, r = RByT[t].g, max = Math.max(m, r, 1);
    return `<div class="tbar">
      <div class="tb-side"><span class="tb-v win-${lead(m, r) === "m" ? "m" : ""}">${m}</span><div class="tb-fill m" style="width:${(m / max) * 100}%"></div></div>
      <div class="tb-label">${label}</div>
      <div class="tb-side r"><div class="tb-fill r" style="width:${(r / max) * 100}%"></div><span class="tb-v win-${lead(m, r) === "r" ? "r" : ""}">${r}</span></div>
    </div>`;
  }).join("");
}

const FONT = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">`;
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#070b16;--elev:#0c1322;--surface:rgba(255,255,255,.04);--surfaceS:rgba(255,255,255,.07);--bd:rgba(255,255,255,.1);--bdS:rgba(255,255,255,.18);--tx:#f8fafc;--tx2:#9aa7bd;--tx3:#64748b;--m:#2c63db;--mB:#3a82ff;--r:#e2103b;--rB:#ff1b2d;--gold:#f5b43c;--goldB:#ffd75e}
body{background:var(--bg);color:var(--tx);font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.disp{font-family:"Bebas Neue",sans-serif;letter-spacing:.02em;line-height:.92}
.flagbg{position:absolute;inset:0;z-index:0;overflow:hidden}
.flagbg::before,.flagbg::after{content:"";position:absolute;top:0;bottom:0;width:55%;filter:blur(90px);opacity:.22}
.flagbg::before{left:-5%;background:linear-gradient(120deg,#75aadb 0%,#fff 45%,#75aadb 80%)}
.flagbg::after{right:-5%;background:linear-gradient(240deg,#c8102e 0%,#006600 55%,#c8102e 100%)}
.seam{position:absolute;inset:0;background:radial-gradient(60% 80% at 50% 30%,transparent,var(--bg) 72%),linear-gradient(90deg,transparent 38%,var(--bg) 50%,transparent 62%)}
.wrap{position:relative;z-index:2;margin:0 auto;padding:0 40px}
.glass{background:var(--surface);border:1px solid var(--bd);border-radius:22px;box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 30px 60px rgba(0,0,0,.4)}
.hair{position:relative}.hair::before{content:"";position:absolute;top:0;left:18px;right:18px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:.5}
.eyebrow{font-weight:800;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);font-size:13px}
.win-m{color:var(--mB)!important}.win-r{color:var(--rB)!important}
.crown{font-style:normal;font-size:.6em;vertical-align:super;margin:0 4px}
/* ARENA HOOK */
.arena{position:relative;z-index:2;text-align:center;padding:46px 0 26px}
.vs{display:flex;align-items:center;justify-content:center;gap:34px;margin:10px 0 6px}
.vs h1{font-size:104px}.vs .nm{font-size:96px}.vs .nm.m{color:var(--mB);text-shadow:0 0 40px rgba(58,130,255,.4)}.vs .nm.r{color:var(--rB);text-shadow:0 0 40px rgba(255,27,45,.4)}
.vs .x{font-size:48px;color:var(--gold);font-family:"Bebas Neue"}
.score{font-family:"Bebas Neue";font-size:30px;color:var(--gold);letter-spacing:.1em}
.score b{font-size:54px;margin:0 10px}
.share{display:inline-block;margin-top:16px;background:linear-gradient(150deg,var(--goldB),var(--gold) 60%,#d9921f);color:#231400;font-weight:900;padding:15px 34px;border-radius:999px;font-size:18px;box-shadow:0 14px 30px rgba(245,180,60,.3)}
.cats{max-width:560px;margin:24px auto 0;display:flex;flex-direction:column;gap:9px}
.tbar{display:grid;grid-template-columns:1fr 150px 1fr;align-items:center;gap:12px}
.tb-side{display:flex;align-items:center;justify-content:flex-end;gap:8px;position:relative}
.tb-side.r{justify-content:flex-start}
.tb-fill{height:13px;border-radius:7px}.tb-fill.m{background:linear-gradient(90deg,transparent,var(--m))}.tb-fill.r{background:linear-gradient(90deg,var(--r),transparent)}
.tb-v{font-weight:800;font-size:15px;color:var(--tx2);min-width:34px}.tb-side.r .tb-v{text-align:left}
.tb-label{text-align:center;font-size:13px;font-weight:700;color:var(--tx2)}
/* SCROLL CUE */
.cue{text-align:center;margin:30px 0 6px;color:var(--gold);font-weight:800;letter-spacing:.2em;font-size:13px}
.cue .ar{display:block;font-size:22px;margin-top:2px}
/* BODY */
.body-h{display:flex;align-items:baseline;justify-content:space-between;margin:8px 0 18px}
.body-h h2{font-family:"Bebas Neue";font-size:52px}
.body-h .sub{color:var(--tx2);font-size:15px;font-weight:600}
.section{padding:26px 30px;margin-bottom:22px}
.sec-t{font-family:"Bebas Neue";font-size:34px;margin-bottom:4px}
.sec-d{color:var(--tx2);font-size:14px;margin-bottom:18px}
/* career grid */
.cgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px 36px}
.mrow{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.05)}
.mrow .mv{text-align:right;font-weight:800;font-size:22px;font-variant-numeric:tabular-nums;color:var(--tx)}
.mrow .rv{text-align:left;font-weight:800;font-size:22px;font-variant-numeric:tabular-nums;color:var(--tx)}
.mrow .ml{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);white-space:nowrap}
/* tabs */
.tabs{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px}
.tab{padding:9px 18px;border-radius:999px;font-weight:700;font-size:14px;color:var(--tx2);background:var(--surface);border:1px solid var(--bd)}
.tab.on{background:linear-gradient(150deg,rgba(245,180,60,.18),rgba(245,180,60,.06));border-color:rgba(245,180,60,.5);color:var(--goldB)}
.subtabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 6px}
.subtab{padding:7px 14px;border-radius:8px;font-weight:700;font-size:13px;color:var(--tx2);background:var(--surface);border:1px solid var(--bd)}
.subtab.on{color:var(--tx);border-color:var(--bdS);background:var(--surfaceS)}
/* big table */
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
thead th{position:sticky;top:0;background:var(--elev);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--tx3);font-weight:800;padding:12px 8px;border-bottom:1px solid var(--bdS)}
thead th.side-m{color:var(--mB)}thead th.side-r{color:var(--rB)}
tbody td{padding:10px 8px;text-align:center;font-size:15px;font-weight:700;border-bottom:1px solid rgba(255,255,255,.05)}
td.season{font-family:"Bebas Neue";font-size:19px;color:var(--tx);letter-spacing:.04em;background:var(--elev);position:sticky;left:0}
td.ga{font-weight:900}td.dim{color:var(--tx3);font-weight:600}
td.hl-m{color:var(--mB)}td.hl-r{color:var(--rB)}
td.delta{font-weight:900;color:var(--tx3);font-size:14px}
td.na{color:var(--tx3);font-style:italic;font-weight:600;font-size:13px;opacity:.65}
tfoot td{padding:13px 8px;text-align:center;font-weight:900;font-size:16px;background:rgba(245,180,60,.07);border-top:2px solid rgba(245,180,60,.4)}
tfoot td.season{font-family:"Bebas Neue";font-size:20px;color:var(--goldB);background:rgba(245,180,60,.07)}
/* cuts row */
.cuts{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.cut h4{font-family:"Bebas Neue";font-size:26px;margin-bottom:10px;color:var(--tx)}
.cut table td{text-align:right}.cut table td.cl{text-align:left;font-weight:700}
.cut td.g-m{color:var(--mB);font-weight:900}.cut td.g-r{color:var(--rB);font-weight:900}
.cut th{font-size:10px}
/* entries */
.entries{display:grid;grid-template-columns:2fr 1fr 1fr;gap:18px;margin-top:6px}
.entry{padding:24px;border-radius:22px;border:1px solid var(--bd);background:var(--surface);display:flex;flex-direction:column;justify-content:space-between;min-height:120px}
.entry.big{background:linear-gradient(120deg,rgba(58,130,255,.12),rgba(226,16,59,.12))}
.entry .et{font-family:"Bebas Neue";font-size:30px}
.entry .ed{color:var(--tx2);font-size:13px;margin-top:4px}
.entry .go{margin-top:14px;color:var(--gold);font-weight:800;font-size:15px}
.foot{color:var(--tx3);font-size:12px;text-align:center;padding:24px 0 36px}
.badge{display:inline-block;font-size:10px;font-weight:800;color:#caa64a;background:rgba(245,180,60,.12);border:1px solid rgba(245,180,60,.3);padding:2px 8px;border-radius:6px;vertical-align:middle;margin-left:8px}
.note{color:var(--tx3);font-size:12px;margin-top:10px}
`;

function page(width, inner, scale = "") {
  return `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>${CSS}
  body{width:${width}px}.wrap{max-width:${width}px}${scale}</style></head><body>
  <div class="flagbg"></div><div class="seam"></div>${inner}</body></html>`;
}

// ---------- DESKTOP ----------
function desktop() {
  const inner = `
  <div class="arena wrap">
    <p class="eyebrow">Вердикт CompareGOATs</p>
    <div class="vs"><span class="nm m disp">Месси</span><span class="x">vs</span><span class="nm r disp">Роналду</span></div>
    <div class="score">ВЕРДИКТ <b class="win-m">5</b>—<b class="win-r">3</b></div>
    <div class="cats">${typeBars()}<p class="note">8 категорий вердикта (голы по турнирам показаны для примера)</p></div>
    <a class="share">Поделиться вердиктом →</a>
    <div class="cue">ВСЯ СТАТИСТИКА<span class="ar">↓</span></div>
  </div>

  <div class="wrap">
    <div class="body-h hair"><h2 class="disp">Полная статистика</h2><span class="sub">222 строки · 24 сезона · 6 типов турниров · 10 клубов — всё на экране</span></div>

    <div class="section glass">
      <div class="sec-t disp">Карьера — все цифры</div>
      <div class="sec-d">Прямое сравнение по каждой метрике. Лидер подсвечен цветом игрока.</div>
      <div class="cgrid">
        <div>
          ${metricRow("Матчи", "matches")}
          ${metricRow("В старте", "starts")}
          ${metricRow("Минуты", "minutes")}
          ${metricRow("Голы", "goals")}
          ${metricRow("Пенальти", "penaltyGoals")}
          ${metricRow("Со штрафных", "freekickGoals")}
          ${metricRow("Хет-трики", "hatTricks")}
        </div>
        <div>
          ${metricRow("Ассисты", "assists")}
          ${metricRow("Гол+пас", "ga")}
          ${metricRow("Удары", "shots")}
          ${metricRow("В створ", "shotsOnTarget")}
          ${metricRow("Трофеи", "trophies")}
          <div class="mrow"><div class="mv">24</div><div class="ml">Сезонов</div><div class="rv">24</div></div>
          <div class="mrow"><div class="mv na" style="text-align:right;color:var(--tx3);font-style:italic">н/д</div><div class="ml">xG / xA <span class="badge">с 2014</span></div><div class="rv na" style="color:var(--tx3);font-style:italic">н/д</div></div>
        </div>
      </div>
    </div>

    <div class="section glass">
      <div class="sec-t disp">Сезон за сезоном — бок о бок</div>
      <div class="sec-d">Все 24 сезона. Где игрок не выступал — честный прочерк, не выдумываем.</div>
      <div class="tabs"><span class="tab on">Все турниры</span><span class="tab">Лиги</span><span class="tab">Лига чемпионов</span><span class="tab">Сборная</span><span class="tab">Кубки</span></div>
      <div class="subtabs"><span class="subtab on">По сезонам</span><span class="subtab">По клубам</span><span class="subtab">По турнирам</span><span class="subtab">Тоталы</span><span class="subtab">Core / Advanced ▾</span></div>
      <table>
        <thead><tr>
          <th class="side-m">Г</th><th class="side-m">П</th><th class="side-m">Г+П</th><th class="side-m">Матчи</th>
          <th>Сезон</th><th>Δ</th>
          <th class="side-r">Г</th><th class="side-r">П</th><th class="side-r">Г+П</th><th class="side-r">Матчи</th>
        </tr></thead>
        <tbody>${seasonRows()}</tbody>
        <tfoot><tr>
          <td>${MT.goals}</td><td>${MT.assists}</td><td>${MT.ga}</td><td>${MT.matches}</td>
          <td class="season">КАРЬЕРА</td><td>${MT.ga - RT.ga > 0 ? "+" + (MT.ga - RT.ga) : MT.ga - RT.ga}</td>
          <td>${RT.goals}</td><td>${RT.assists}</td><td>${RT.ga}</td><td>${RT.matches}</td>
        </tr></tfoot>
      </table>
    </div>

    <div class="section glass">
      <div class="sec-t disp">Разрезы</div>
      <div class="sec-d">По клубам · по турнирам · по сезонам — переключай табами, без свалки.</div>
      <div class="cuts">
        <div class="cut">
          <h4 class="disp">По клубам</h4>
          <table><thead><tr><th style="text-align:left">Клуб</th><th>Матчи</th><th>Голы</th><th>Пас</th></tr></thead><tbody>${clubRows(MClubs, "m")}</tbody></table>
        </div>
        <div class="cut">
          <h4 class="disp">По клубам</h4>
          <table><thead><tr><th style="text-align:left">Клуб</th><th>Матчи</th><th>Голы</th><th>Пас</th></tr></thead><tbody>${clubRows(RClubs, "r")}</tbody></table>
        </div>
      </div>
      <p class="note">Слева Месси (Барселона/ПСЖ/Интер Майами/Аргентина), справа Роналду (Спортинг/Юнайтед/Реал/Юве/Аль-Наср/Португалия). Сборные помечаются бэйджем «распределено».</p>
    </div>

    <div class="entries">
      <div class="entry big"><div><div class="et disp">Полный head-to-head →</div><div class="ed">Все метрики × все сезоны × все турниры. Дельты, «кто ведёт», выравнивание по возрасту.</div></div><div class="go">Открыть /compare</div></div>
      <div class="entry"><div><div class="et disp" style="color:var(--mB)">Месси →</div><div class="ed">Полная стат-страница</div></div><div class="go">/player/messi</div></div>
      <div class="entry"><div><div class="et disp" style="color:var(--rB)">Роналду →</div><div class="ed">Полная стат-страница</div></div><div class="go">/player/ronaldo</div></div>
    </div>

    <div class="foot">Read-only витрина · вердикт живёт только на арене сверху · данные seed (mvr), кросс-проверка · н/д не выдумывается · MOCKUP для ревью</div>
  </div>`;
  return page(1440, inner, ".wrap{padding:0 56px}");
}

// ---------- MOBILE ----------
function mobileSeasonRows() {
  return seasons.map((s) => {
    const m = MS[s], r = RS[s];
    const mg = m ? m.ga : null, rg = r ? r.ga : null;
    const L = mg == null || rg == null ? "" : lead(mg, rg);
    const c = (x, w) => x == null ? `<td class="na">—</td>` : `<td class="${w}">${x}</td>`;
    return `<tr><td class="season">${s}</td>${c(mg, L === "m" ? "hl-m" : "")}<td class="delta">${mg != null && rg != null ? (mg - rg > 0 ? "+" + (mg - rg) : mg - rg) : "·"}</td>${c(rg, L === "r" ? "hl-r" : "")}</tr>`;
  }).join("");
}
function mobile() {
  const inner = `
  <div class="arena wrap" style="padding:30px 0 18px">
    <p class="eyebrow">Вердикт</p>
    <div class="vs" style="gap:14px;margin:8px 0"><span class="nm m disp" style="font-size:54px">Месси</span><span class="x" style="font-size:26px">vs</span><span class="nm r disp" style="font-size:54px">Роналду</span></div>
    <div class="score" style="font-size:20px">ВЕРДИКТ <b class="win-m" style="font-size:36px">5</b>—<b class="win-r" style="font-size:36px">3</b></div>
    <a class="share" style="font-size:16px;padding:13px 26px">Поделиться →</a>
    <div class="cue" style="margin:22px 0 4px">ВСЯ СТАТИСТИКА<span class="ar">↓</span></div>
  </div>
  <div class="wrap">
    <div class="section glass" style="padding:20px 16px">
      <div class="sec-t disp" style="font-size:26px">Карьера — все цифры</div>
      <div class="sec-d" style="font-size:12px">Лидер подсвечен цветом игрока</div>
      ${metricRow("Матчи", "matches")}${metricRow("Голы", "goals")}${metricRow("Ассисты", "assists")}${metricRow("Гол+пас", "ga")}${metricRow("Минуты", "minutes")}${metricRow("Хет-трики", "hatTricks")}${metricRow("Трофеи", "trophies")}
    </div>
    <div class="section glass" style="padding:20px 16px">
      <div class="sec-t disp" style="font-size:26px">Сезон за сезоном</div>
      <div class="sec-d" style="font-size:12px">Фокус: Гол+пас · «—» = не играл</div>
      <div class="tabs"><span class="tab on">Все</span><span class="tab">Лиги</span><span class="tab">ЛЧ</span><span class="tab">Сборная</span></div>
      <table style="margin-top:12px"><thead><tr><th>Сезон</th><th class="side-m">Месси</th><th>Δ</th><th class="side-r">Роналду</th></tr></thead>
      <tbody>${mobileSeasonRows()}</tbody>
      <tfoot><tr><td class="season">ИТОГО</td><td>${MT.ga}</td><td>${MT.ga - RT.ga > 0 ? "+" + (MT.ga - RT.ga) : MT.ga - RT.ga}</td><td>${RT.ga}</td></tr></tfoot></table>
      <p class="note" style="font-size:11px">→ свайп / metric-focus для xG, ударов, карточек (по одной семье метрик на всю ширину)</p>
    </div>
    <div class="entries" style="grid-template-columns:1fr;gap:12px">
      <div class="entry big"><div class="et disp">Полный head-to-head →</div><div class="go">/compare</div></div>
      <div class="entry"><div class="et disp" style="color:var(--mB)">Месси →</div><div class="go">/player/messi</div></div>
      <div class="entry"><div class="et disp" style="color:var(--rB)">Роналду →</div><div class="go">/player/ronaldo</div></div>
    </div>
    <div class="foot" style="font-size:11px">Read-only · вердикт только на арене · MOCKUP</div>
  </div>`;
  return page(430, inner, ".wrap{padding:0 14px}");
}

function render(name, html, w, h) {
  const p = path.join(OUT, `_${name}.html`);
  fs.writeFileSync(p, html);
  const prof = path.join(OUT, ".chrome");
  const res = spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1", `--user-data-dir=${prof}`, `--window-size=${w},${h}`, `--screenshot=${path.join(OUT, name + ".png")}`, "--virtual-time-budget=9000", "file://" + p], { stdio: "inherit", timeout: 60000 });
  fs.rmSync(prof, { recursive: true, force: true });
  fs.unlinkSync(p);
  if (res.status !== 0) throw new Error("chrome failed " + name);
  console.log("rendered", name);
}

render("mockup-desktop", desktop(), 1440, 3050);
render("mockup-mobile", mobile(), 430, 3150);
console.log("done");
