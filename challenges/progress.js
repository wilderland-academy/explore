// My progress and the Crew board, inside Challenges (students site only).
// A signed-in student sees their own trail from the Life Skills tracker (credits, rank, what's expected this year, working on, not yets,
// feats), the challenges they've passed marked on the map, and what their crew is working on and has passed.
// Data: lsStudents/{sid} and its entries (only the student themself, their parents and staff can read these) and
// lsBoard (every school account can read; a student may change only their own "working on" list). See firestore.rules.
// The student's record id (sid) and band come from /auth.js in the "wl-role" event.
const FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
const W = window.WL, BYID = {}, SK = {};
W.ch.forEach(c => { BYID[c.id] = c; });
W.skills.forEach(s => { SK[s.k] = s; });
const BANDS = ["K–1", "2–4", "5–8"];
const RANKS = {
  "2–4": [[4, "Fox"], [16, "Badger"], [32, "Elk"], [48, "Moose"]],
  "5–8": [[4, "Tracker"], [16, "Pathfinder"], [32, "Ranger"], [48, "Vanguard"], [64, "Trailblazer"]]
};
// Every band, K–1 included, aims for 2 per life skill a year (16 in all). K–1 challenges are always part of a Life Skill Lab.
const goalFor = band => 2;
const yearStart = () => { const d = new Date(), y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return y + "-08-01"; };
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = iso => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); };
// Challenges a Lab introduced that aren't on the map: their entries (ct, k) and board copies (t, k) carry the name and
// life skill. They show by name but don't open on the map.
function addCustom(id, t, k) { if (id && t && SK[k] && !BYID[id]) BYID[id] = { id, t, k, cr: 1, custom: true }; }
const skillOf = cid => { const c = BYID[cid]; return !c ? null : c.custom ? SK[c.k] : SK[W.comps[c.c].k]; };
const title = cid => (BYID[cid] || {}).t || cid;
const colOf = cid => (skillOf(cid) || {}).col || "#999";
const icon = n => '<svg class="ic" aria-hidden="true"><use href="/challenges/icons.svg#i-' + n + '"/></svg>';
const firstName = n => String(n || "").trim().split(/\s+/)[0] || "";

// ---------- Firestore over REST, with the sign-in from /auth.js ----------
function val(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(val);
  if ("mapValue" in v) return obj(v.mapValue.fields);
  return null;
}
const obj = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, val(v)]));
const docOf = d => ({ id: d.name.split("/").pop(), ...obj(d.fields) });
async function token() { const u = window.wlFirebase && window.wlFirebase.auth.currentUser; if (!u) throw new Error("signed out"); return u.getIdToken(); }
async function get(path) {
  const r = await fetch(FS + path, { headers: { Authorization: "Bearer " + await token() } });
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
}
async function list(path) {
  const out = []; let page = "";
  do {
    const j = await get(path + (path.includes("?") ? "&" : "?") + "pageSize=300" + (page ? "&pageToken=" + encodeURIComponent(page) : ""));
    (j.documents || []).forEach(d => out.push(docOf(d)));
    page = j.nextPageToken || "";
  } while (page);
  return out;
}
// Testers who can't read the whole board (outside guests) see just the test accounts.
async function testBoards() {
  const r = await fetch(FS + ":runQuery", { method: "POST", headers: { Authorization: "Bearer " + await token(), "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "lsBoard" }], where: { fieldFilter: { field: { fieldPath: "test" }, op: "EQUAL", value: { booleanValue: true } } } } }) });
  if (!r.ok) throw new Error("board " + r.status);
  return (await r.json()).filter(x => x.document).map(x => docOf(x.document));
}
async function saveWorking(sid, working) {
  const body = { fields: { working: { arrayValue: { values: working.map(c => ({ stringValue: c })) } }, updated: { integerValue: String(Date.now()) } } };
  const r = await fetch(`${FS}/lsBoard/${sid}?updateMask.fieldPaths=working&updateMask.fieldPaths=updated`, { method: "PATCH", headers: { Authorization: "Bearer " + await token(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("save " + r.status);
}

// ---------- the same summary the tracker works out ----------
function summary(me, entries) {
  const byC = {};
  entries.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.created || 0) - (b.created || 0)).forEach(e => { (byC[e.cid] = byC[e.cid] || []).push(e); });
  const passes = [], notyets = [];
  Object.values(byC).forEach(arr => { const p = arr.find(e => e.result === "pass"); if (p) passes.push(p); else notyets.push(arr[arr.length - 1]); });
  passes.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const credit = e => e.credits || (BYID[e.cid] || {}).cr || 1;
  const trail = passes.reduce((n, e) => n + credit(e), 0), ys = yearStart(), per = {};
  let year = 0;
  passes.filter(e => (e.date || "") >= ys).forEach(e => { const k = (skillOf(e.cid) || {}).k; if (k) { per[k] = (per[k] || 0) + credit(e); year += credit(e); } });
  const ranks = RANKS[me.band] || [];
  const rank = ranks.filter(r => r[0] <= trail).pop(), nextRank = ranks.find(r => r[0] > trail);
  return { passes, notyets, trail, per, year, rank: rank ? rank[1] : "", nextRank, milestone: Math.floor(trail / 4) * 4 };
}

// ---------- state and drawing ----------
const prog = document.getElementById("progress"), crew = document.getElementById("crew");
let C = null, seq = 0, crewBand = null, crewQ = "";

function setStatus() {
  if (!window.WLC) return;
  if (!C) { window.WLC.setStatus({}, null); return; }
  const m = {};
  (C.board.working || []).forEach(c => { m[c] = "working"; });
  C.sum.passes.forEach(e => { m[e.cid] = "pass"; });
  window.WLC.setStatus(m, { detail });
}
function detail(c) {
  const p = C.sum.passes.find(e => e.cid === c.id);
  if (p) return '<div class="d-status pass">' + icon("circle-check") + "<span><b>You passed this</b>" + (p.date ? " on " + esc(fmt(p.date)) : "") + ".</span></div>";
  const ny = C.sum.notyets.find(e => e.cid === c.id);
  const working = C.board.working || [], on = working.includes(c.id), full = !on && working.length >= 3;
  return '<div class="d-status">' +
    (ny ? "<p><b>Not yet" + (ny.date ? " on " + esc(fmt(ny.date)) : "") + ".</b> " + (ny.practice ? "Practice: " + esc(ny.practice) : "") + (ny.retry ? " Retry " + esc(fmt(ny.retry)) + "." : "") + "</p>" : "") +
    '<button class="btn ' + (on ? "" : "ghost") + '" type="button" data-working="' + c.id + '" aria-pressed="' + on + '"' + (full ? " disabled" : "") + ">" + icon("flag") + (on ? "Working on it (tap to stop)" : "I'm working on this") + "</button>" +
    (full ? '<span class="muted small">You have 3 already. Finish or drop one first.</span>' : "") + "</div>";
}

function track(sum, band) {
  const ranks = RANKS[band] || [], names = Object.fromEntries(ranks);
  const top = Math.max(ranks.length ? ranks[ranks.length - 1][0] : 24, Math.ceil((sum.trail + 1) / 4) * 4), n = top / 4;
  let segs = "", labs = "";
  for (let i = 1; i <= n; i++) {
    const on = i * 4 <= sum.trail;
    segs += '<span class="seg' + (on ? " on" : "") + '"></span>';
    labs += '<span class="lab' + (names[i * 4] ? " rk" : "") + (on ? " on" : "") + '">' + (names[i * 4] ? esc(names[i * 4]) : n > 14 && i % 2 ? "" : i * 4) + "</span>";
  }
  return '<div class="ptrack" role="img" aria-label="' + sum.trail + ' credits. A milestone every 4 credits." style="grid-template-columns:repeat(' + n + ',1fr)">' + segs + labs + "</div>";
}

function drawProgress() {
  if (!C) return;
  const { me, sum, board } = C, band = me.band, goal = goalFor(band);
  const done = W.skills.filter(k => (sum.per[k.k] || 0) >= goal).length;
  const next = sum.nextRank && sum.nextRank[0] === sum.milestone + 4 ? `Next: ${sum.nextRank[1]} at ${sum.nextRank[0]} credits.` : `Next milestone at ${sum.milestone + 4} credits` + (sum.nextRank ? `, then ${sum.nextRank[1]} at ${sum.nextRank[0]}.` : ".");
  const rankCard = band === "K–1"
    ? `<div class="pcard"><h3>This year</h3><p class="big">${sum.year}<span> passes</span></p><p class="muted">K–1 has no ranks. Aim for 2 passes in every life skill, through Life Skill Labs.</p></div>`
    : `<div class="pcard"><h3>${sum.rank ? "Rank: " + esc(sum.rank) : "On the trail"}</h3><p class="big">${sum.trail}<span> credits</span></p>${track(sum, band)}<p class="muted">${esc(next)} Every 4 credits is a milestone at Honor Court.</p></div>`;
  const skills = W.skills.map(k => {
    const n = sum.per[k.k] || 0;
    return `<li><span class="sw" style="background:${k.col}"></span><span class="nm">${esc(k.n)}</span><span class="dots" style="color:${k.col}" aria-label="${Math.min(n, goal)} of ${goal}">${Array.from({ length: goal }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}${n > goal ? `<b>+${n - goal}</b>` : ""}</span></li>`;
  }).join("");
  const working = (board.working || []).filter(c => BYID[c]);
  const row = (cid, extra, del) => `<li><span class="bar" style="background:${colOf(cid)}"></span><div>${(BYID[cid] || {}).custom ? `<span class="plink">${esc(title(cid))}</span>` : `<button class="plink" type="button" data-open="${cid}">${esc(title(cid))}</button>`}${extra || ""}</div>${del ? `<button class="x" type="button" data-unwork="${cid}" aria-label="Stop working on ${esc(title(cid))}">${icon("x")}</button>` : ""}</li>`;
  prog.innerHTML = `<div class="wrap prog">
    <div class="prog-head"><p class="eyebrow">My progress</p><h2 id="progress-title">${esc(firstName(me.name) || "Your")}${firstName(me.name) ? "'s" : ""} trail</h2>
      <p class="muted">Grades ${esc(band)}${me.guide ? " · Field Guide: " + esc(me.guide) : ""}. Your guide records each pass and not yet. <a href="/goals/">Set your goals →</a></p></div>
    <div class="prog-grid">${rankCard}
      <div class="pcard"><h3>Expected this year: ${goal} in every life skill</h3><ul class="pskills">${skills}</ul><p class="muted">${done} of 8 skills met this year.</p></div></div>
    <div class="prog-grid">
      <div class="pcard"><h3>Working on</h3>${working.length ? `<ul class="plist">${working.map(c => row(c, "", true)).join("")}</ul>` : ""}<p class="muted small">${working.length < 3 ? "Open any challenge on the map and tap <b>I'm working on this</b>. Up to 3 at a time, so your crew knows what you're practicing." : "That's 3. Finish or drop one to add another."}</p></div>
      <div class="pcard"><h3>Not yet, and what to practice</h3>${sum.notyets.length ? `<ul class="plist">${sum.notyets.map(e => row(e.cid, `<dl><dt>Missing</dt><dd>${esc(e.missing || "—")}</dd><dt>Practice</dt><dd>${esc(e.practice || "—")}</dd>${e.retry ? `<dt>Retry</dt><dd>${esc(fmt(e.retry))}</dd>` : ""}</dl>`)).join("")}</ul>` : `<p class="muted">No not yets right now. A not yet always comes with what to practice.</p>`}</div>
    </div>
    <details class="feats"${sum.passes.length && sum.passes.length <= 6 ? " open" : ""}><summary>My feats (${sum.passes.length})</summary>${sum.passes.length ? `<ul class="plist">${sum.passes.map(e => row(e.cid, `<span class="muted small"> · ${esc(fmt(e.date))}${(e.credits || 1) > 1 ? " · Epic, 2 credits" : ""}</span>`)).join("")}</ul>` : `<p class="muted">No passes yet. The first one is the hardest.</p>`}</details>
  </div>`;
  prog.hidden = false;
}

function drawCrew() {
  if (!C) return;
  const own = C.me.band, choices = BANDS.indexOf(own) >= 0 ? BANDS.slice(BANDS.indexOf(own)) : BANDS;
  if (!crewBand || choices.indexOf(crewBand) < 0) crewBand = choices[0];
  const people = C.boards.filter(b => b.name && b.band === crewBand)
    .filter(b => !crewQ || b.name.toLowerCase().includes(crewQ) || (b.working || []).concat((b.passed || []).map(p => p.c)).some(c => title(c).toLowerCase().includes(crewQ)))
    .sort((a, b) => (b.id === C.sid) - (a.id === C.sid) || a.name.localeCompare(b.name));
  const li = (c, extra) => BYID[c] ? `<li><i style="background:${colOf(c)}"></i><span>${BYID[c].custom ? `<span class="plink">${esc(title(c))}</span>` : `<button class="plink" type="button" data-open="${c}">${esc(title(c))}</button>`}${extra ? `<span class="muted small"> · ${esc(extra)}</span>` : ""}</span></li>` : "";
  const cards = people.map(b => {
    const passed = (b.passed || []).slice().sort((x, y) => (y.d || "").localeCompare(x.d || ""));
    const ranks = RANKS[b.band] || [], rank = ranks.filter(r => r[0] <= (b.credits || 0)).pop();
    return `<article class="ccard${b.id === C.sid ? " me" : ""}"><div class="ctop"><h3>${esc(b.name)}${b.id === C.sid ? " <span class=\"you\">you</span>" : ""}</h3><span class="tag">${b.band === "K–1" ? passed.length + " passed" : (b.credits || 0) + " credits" + (rank ? " · " + esc(rank[1]) : "")}</span></div>
      <p class="lbl">Working on</p>${(b.working || []).filter(c => BYID[c]).length ? `<ul>${b.working.map(c => li(c)).join("")}</ul>` : `<p class="muted small">Nothing listed</p>`}
      <p class="lbl">Recently passed</p>${passed.length ? `<ul>${passed.slice(0, 4).map(p => li(p.c, fmt(p.d))).join("")}</ul>` : `<p class="muted small">Not yet</p>`}</article>`;
  }).join("");
  crew.innerHTML = `<div class="wrap">
    <div class="crew-head"><div><h2 id="crew-title">Crew board</h2><p class="muted">What everyone is working on and has passed. Stuck? Ask someone who's done it how they did it.</p></div>
      <label class="search crew-search"><span class="sr">Find a name or a challenge</span><input id="crew-q" type="search" placeholder="Find a name or a challenge" value="${esc(crewQ)}" autocomplete="off"></label></div>
    ${choices.length > 1 ? `<div class="crew-bands" role="group" aria-label="Grades">${choices.map(b => `<button class="chip" type="button" data-crew-band="${b}" aria-pressed="${b === crewBand}">Grades ${b}${b === own ? " (yours)" : ""}</button>`).join("")}</div>` : ""}
    ${cards ? `<div class="crewgrid">${cards}</div>` : `<p class="muted">Nobody here yet.</p>`}
  </div>`;
  crew.hidden = false;
}

function signedOut() {
  C = null; setStatus(); crew.hidden = true; crew.innerHTML = "";
  prog.innerHTML = `<div class="wrap prog prog-out">${icon("route")}<div><h2 id="progress-title">Your progress lives here</h2><p class="muted">Sign in with your school account to see your credits, what you've passed, what to practice next, and what your crew is working on.</p></div><button class="btn" type="button" data-wl-signin>Sign in</button></div>`;
  prog.hidden = false;
}
function hide() { C = null; setStatus(); prog.hidden = crew.hidden = true; prog.innerHTML = crew.innerHTML = ""; }
function notAdded(email) {
  C = null; setStatus(); crew.hidden = true;
  prog.innerHTML = `<div class="wrap prog prog-out">${icon("route")}<div><h2 id="progress-title">Almost there</h2><p class="muted">Your Field Guide hasn't added you to the Life Skills tracker yet. Ask them to add your school email${email ? ": " + esc(email) : ""}. Then your passes, credits and crew show up here.</p></div></div>`;
  prog.hidden = false;
}

async function load(r) {
  const my = ++seq;
  if (!r) { if (window.wlAuthState && window.wlAuthState.ready && !window.wlAuthState.user) signedOut(); else if (!(window.wlFirebase && window.wlFirebase.auth.currentUser)) signedOut(); else hide(); return; }
  if (r.role !== "student") return hide();
  if (!r.sid) return notAdded(r.email);
  if (C && C.sid === r.sid) return;
  try {
    // The test student (a tester's test view) and real students never see each other on the crew board.
    const crewBoards = () => list("/lsBoard").then(bs => bs.filter(b => !!b.test === !!r.test))
      .catch(e => { if (!r.test) throw e; return testBoards(); });
    const [meDoc, entries, boards] = await Promise.all([get(`/lsStudents/${r.sid}`), list(`/lsStudents/${r.sid}/entries`), crewBoards()]);
    if (my !== seq) return;
    entries.forEach(e => addCustom(e.cid, e.ct, e.k));
    boards.forEach(b => (b.passed || []).forEach(p => addCustom(p.c, p.t, p.k)));
    const me = docOf(meDoc), board = boards.find(b => b.id === r.sid) || { working: [], passed: [] };
    C = { sid: r.sid, me, entries, boards, board, sum: summary(me, entries) };
    drawProgress(); drawCrew(); setStatus();
  } catch (e) {
    console.warn("Progress:", e);
    if (my !== seq) return;
    C = null; setStatus(); crew.hidden = true;
    prog.innerHTML = `<div class="wrap prog prog-out"><div><h2 id="progress-title">Your progress didn't load</h2><p class="muted">Check your connection and reload the page. If it keeps happening, tell your guide.</p></div></div>`;
    prog.hidden = false;
  }
}

async function setWorking(cid, on) {
  if (!C) return;
  const was = (C.board.working || []).slice();
  let next = was.filter(c => c !== cid);
  if (on) { if (next.length >= 3) return; next = next.concat(cid); }
  C.board.working = next; drawProgress(); drawCrew(); setStatus();
  try {
    await saveWorking(C.sid, next);
    // Tell their guides (/notify.js) when they start working on one.
    if (on && window.wlNotifyGuides) {
      const u = window.wlFirebase && window.wlFirebase.auth.currentUser, r = window.wlRole || {};
      const n = r.test ? "Test S." : String((u && (u.displayName || u.email.split("@")[0])) || "A student").trim().split(/\s+/)[0];
      const c = ((window.WL || {}).ch || []).find(x => x.id === cid);
      window.wlNotifyGuides({ kind: "working", text: `${n} started working on “${c ? c.t : cid}”`, link: "/guides/lifeskills/#s=" + C.sid });
    }
  }
  catch (e) { console.warn("Progress:", e); C.board.working = was; drawProgress(); drawCrew(); setStatus(); alertLine("That didn't save. Try again in a moment."); }
}
function alertLine(t) { const el = document.getElementById("toast"); if (!el) return; el.textContent = t; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2600); }

document.addEventListener("click", e => {
  const w = e.target.closest("[data-working]");
  if (w && C) { const cid = w.getAttribute("data-working"); setWorking(cid, !(C.board.working || []).includes(cid)); return; }
  const u = e.target.closest("[data-unwork]");
  if (u && C) { setWorking(u.getAttribute("data-unwork"), false); return; }
  const b = e.target.closest("[data-crew-band]");
  if (b) { crewBand = b.getAttribute("data-crew-band"); drawCrew(); }
});
document.addEventListener("input", e => {
  if (e.target.id !== "crew-q") return;
  clearTimeout(e.target._t);
  e.target._t = setTimeout(() => { crewQ = e.target.value.trim().toLowerCase(); drawCrew(); const q = document.getElementById("crew-q"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 200);
});
document.addEventListener("wl-role", e => load(e.detail));
document.addEventListener("wl-auth", e => { if (!e.detail && !window.wlRole) signedOut(); });
if (window.wlRole !== undefined) load(window.wlRole);
// Arriving at #progress or #crew: scroll there once it has drawn.
if (/^#(progress|crew)$/.test(location.hash)) {
  const id = location.hash.slice(1), t0 = Date.now();
  const tick = () => { const el = document.getElementById(id); if (el && !el.hidden && el.innerHTML) el.scrollIntoView({ block: "start" }); else if (Date.now() - t0 < 8000) setTimeout(tick, 250); };
  tick();
}
