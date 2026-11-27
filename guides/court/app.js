// Guides › Student Court desk (/guides/court/): the staff side of Student Court (/court/).
//   Needs you: cases passed to a guide, appeals, repairs to sign off, complaints waiting with no judge.
//   Judges and clerks: appoint students for a term (courtRoles/{email}: name, sid, role, bands, active, until).
//   All cases: every complaint, with staff actions (hear it yourself, sign off, close, reopen, tell the other student).
//   Patterns: per student this school year (filed, about them, upheld, made up, counter-complaints).
//   Calm plans: students' calm plans (calmPlans/{sid}, written on /code/).
// Staff read and change everything here (firestore.rules); testers in test view see only test cases.
const C = window.WLCourt, FSX = window.WLFS;
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const day = s => s ? new Date(s + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";
const when = ms => ms ? new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
const short = n => { const p = String(n || "").trim().split(/\s+/); return p.length > 1 ? p[0] + " " + p[p.length - 1][0] + "." : p[0] || ""; };
let ROLE = null, CASES = [], ROLES = [], STU = [], PLANS = [], BANDF = "all", STATF = "open", MSG = "";
const isTest = () => !!(ROLE && ROLE.test);
const testOk = x => !!x.test === isTest();
const me = () => String((FSX.user() || {}).email || "").toLowerCase();
const myName = () => { const u = FSX.user() || {}; return String(u.displayName || me().split("@")[0]).trim(); };
const stu = sid => STU.find(s => s.id === sid) || {};
const tell = (to, text, link) => { if (window.wlNotify) window.wlNotify(to, { kind: "court", text, link }); };

async function load() {
  const r = await Promise.allSettled([FSX.list("courtCases"), FSX.list("courtRoles"), FSX.list("lsStudents"), FSX.list("calmPlans")]);
  const v = (i, d) => r[i].status === "fulfilled" ? r[i].value : d;
  CASES = v(0, []).filter(testOk).sort((a, z) => (z.updated || 0) - (a.updated || 0));
  ROLES = v(1, []).filter(testOk).map(x => Object.assign(x, { id: decodeURIComponent(x.id) })); STU = v(2, []).filter(s => isTest() ? s.test : !s.test).sort((a, z) => String(a.name).localeCompare(z.name));
  PLANS = v(3, []).filter(testOk);
  if (r[0].status === "rejected") MSG = "Couldn't load cases. Only staff can open this page.";
}

const STATUS = C.STATUS;
const pill = c => `<span class="pill ${c.status === "restoring" || c.status === "referred" || c.appealStatus === "open" ? "warn" : c.status === "filed" ? "bad" : ["closed", "not_upheld", "withdrawn"].includes(c.status) ? "" : "ok"}">${esc(STATUS[c.status] || c.status)}</span>`;
function caseCard(c, open) {
  const cat = C.CAT[c.cat] || { t: c.cat }, R = c.restore && C.RESTORES[c.restore], id = esc(c.id);
  return `<details class="card" ${open ? "open" : ""} data-case="${id}"><summary><div class="row" style="justify-content:space-between"><div class="row">${pill(c)}<b>${esc(c.byName)} about ${esc(c.againstName)}</b><span class="muted small">${esc(cat.t)} · Tier ${esc(c.tier)} · grades ${esc(c.band)}</span></div><span class="meta">Filed ${esc(when(c.created))}${c.courtDay ? " · court " + esc(day(c.courtDay)) : ""}</span></div></summary>
    <dl class="kv" style="margin-top:10px">
      <dt>What happened</dt><dd>${esc(c.what)}</dd><dt>Felt / needs</dt><dd>${esc(c.felt)} / ${esc(c.need)}</dd><dt>Their own part</dt><dd>${esc(c.myPart)}</dd><dt>Asking for</dt><dd>${esc(c.ask)}</dd>
      <dt>Peace Talk</dt><dd>${c.tried === "waived" ? "Waived by " + esc(c.waivedBy) : "Tried"}</dd>
      ${c.response ? `<dt>Other side</dt><dd>${esc(c.response)}</dd>` : ""}
      ${c.judgeName ? `<dt>Judge</dt><dd>${esc(c.judgeName)}${c.note ? ": " + esc(c.note) : ""}</dd>` : ""}
      ${c.finding ? `<dt>Finding</dt><dd>${esc({ upheld: "Upheld", not_upheld: "Not upheld", false: "Made up on purpose (judge's view)", referred: "Passed to a guide" }[c.finding] || c.finding)}${c.findingNote ? ": " + esc(c.findingNote) : ""}</dd>` : ""}
      ${R ? `<dt>Repair</dt><dd><b>${esc(R.t)}</b>${c.restoreText ? ": " + esc(c.restoreText) : ""}${c.due ? ` <span class="muted">(due ${esc(day(c.due))})</span>` : ""}${c.repeat > 1 ? ` <span class="pill warn">repeat #${esc(c.repeat)}</span>` : ""}</dd>` : ""}
      ${c.root ? `<dt>Underneath it</dt><dd>${esc(c.root)}</dd>` : ""}
      ${c.doneAt ? `<dt>Done</dt><dd>Student marked done ${esc(when(c.doneAt))}${c.signedName ? `; signed off by ${esc(c.signedName)} ${esc(when(c.signedAt))}` : ""}</dd>` : c.signedName ? `<dt>Signed off</dt><dd>${esc(c.signedName)} ${esc(when(c.signedAt))}</dd>` : ""}
      ${c.appeal ? `<dt>Appeal</dt><dd>${esc(c.appeal)} <span class="muted">(${esc(c.appealStatus)})</span></dd>` : ""}
      ${c.staffNote ? `<dt>Staff note</dt><dd>${esc(c.staffNote)}</dd>` : ""}
    </dl>
    <div class="row">
      ${c.status === "restoring" ? `<button class="btn" type="button" data-sign="${id}">Sign off the repair</button>` : ""}
      ${c.appealStatus === "open" ? `<button class="btn" type="button" data-grant="${id}">Grant appeal: hear it again</button><button class="btn ghost" type="button" data-deny="${id}">Deny appeal</button>` : ""}
      ${["filed", "scheduled", "referred"].includes(c.status) ? `<button class="btn ghost" type="button" data-hear="${id}">Decide it myself</button>` : ""}
      ${!["closed", "withdrawn"].includes(c.status) ? `<button class="btn ghost" type="button" data-close="${id}">Close with a note</button>` : `<button class="btn ghost" type="button" data-reopen="${id}">Reopen</button>`}
      ${SHOWN.includes(c.status) ? `<button class="btn ghost" type="button" data-tellother="${id}">Tell ${esc(c.againstName)} (and family)</button>` : ""}
    </div>
    <div data-form="${id}"></div>
  </details>`;
}
const SHOWN = ["scheduled", "restoring", "not_upheld", "closed"];
const isOpen = c => !["closed", "withdrawn", "not_upheld"].includes(c.status) || c.appealStatus === "open";

function vNeeds() {
  const bandsWithJudge = new Set(ROLES.filter(r => r.active).flatMap(r => r.bands || []));
  const old = c => c.status === "filed" && (Date.now() - (c.updated || 0) > 2 * 864e5 || !bandsWithJudge.has(c.band));
  const list = CASES.filter(c => c.status === "referred" || c.appealStatus === "open" || c.status === "restoring" || old(c));
  return `<section class="sec" id="needs"><h2>Needs you</h2>
    <p class="muted">Cases a judge passed to a guide, appeals, repairs to sign off (the student's Field Guide, or any guide), and complaints that have waited more than two days or have no judge for their grades.</p>
    ${list.length ? `<div class="list">${list.map(c => caseCard(c, false)).join("")}</div>` : `<p class="empty">Nothing needs you right now.</p>`}</section>`;
}
function vJudges() {
  const rows = ROLES.slice().sort((a, z) => (z.active ? 1 : 0) - (a.active ? 1 : 0) || String(a.name).localeCompare(z.name));
  const eligible = STU.filter(s => C.BANDS.includes(s.band));
  return `<section class="sec" id="judges"><h2>Judges and clerks</h2>
    <p class="muted">Staff appoint students for a term (the handbook suggests a month). Judges hear cases and decide; clerks check complaints and set court days. A judge never sees cases they're part of. Choose students who are fair and trusted by their peers; Level 5 students can run for these roles.</p>
    ${rows.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Student</th><th>Role</th><th>Grades</th><th>Until</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.role)}</td><td>${esc((r.bands || []).join(", "))}</td><td>${esc(day(r.until))}</td>
      <td>${r.active ? `<button class="btn ghost" type="button" data-endrole="${esc(r.id)}">End term</button>` : `<span class="muted">ended</span> <button class="btn ghost" type="button" data-restartrole="${esc(r.id)}">Restart</button>`}</td></tr>`).join("")}</tbody></table></div>` : `<p class="empty">No judges yet. Until there is one, guides decide complaints here.</p>`}
    <div class="card form"><b>Appoint a student</b>
      <label>Student<select class="in" id="j-sid"><option value="">Choose…</option>${eligible.map(s => `<option value="${esc(s.id)}">${esc(s.name)} (${esc(s.band)})</option>`).join("")}</select></label>
      <label>Role<select class="in" id="j-role"><option value="judge">Judge</option><option value="clerk">Clerk</option></select></label>
      <label>Term ends<input class="in" type="date" id="j-until" value="${esc(C.iso(new Date(Date.now() + 30 * 864e5)))}"></label>
      <div class="row"><button class="btn" type="button" data-appoint>Appoint</button></div><p class="note" id="j-msg"></p></div></section>`;
}
function vAll() {
  const list = CASES.filter(c => (BANDF === "all" || c.band === BANDF) && (STATF === "all" || (STATF === "open" ? isOpen(c) : !isOpen(c))));
  return `<section class="sec" id="all"><h2>All cases</h2>
    <div class="row">${["all", "2–4", "5–8"].map(b => `<button class="chip" type="button" data-bandf="${b}" aria-pressed="${BANDF === b}">${b === "all" ? "All grades" : b}</button>`).join("")}<span style="width:12px"></span>
      ${[["open", "Open"], ["done", "Finished"], ["all", "Everything"]].map(([k, l]) => `<button class="chip" type="button" data-statf="${k}" aria-pressed="${STATF === k}">${l}</button>`).join("")}</div>
    ${list.length ? `<div class="list">${list.map(c => caseCard(c, false)).join("")}</div>` : `<p class="empty">No cases.</p>`}</section>`;
}
function vPatterns() {
  const y0 = C.schoolYearStart(), yr = CASES.filter(c => (c.created || 0) >= y0), P = {};
  const row = (sid, name) => P[sid] || (P[sid] = { sid, name, filed: 0, about: 0, upheld: 0, made: 0, counter: 0, withdrawn: 0 });
  yr.forEach(c => {
    const a = row(c.bySid, c.byName), b = row(c.againstSid, c.againstName);
    a.filed++; b.about++; if (c.finding === "upheld") b.upheld++; if (c.finding === "false") a.made++; if (c.status === "withdrawn") a.withdrawn++;
    if (yr.some(x => x.id !== c.id && x.bySid === c.againstSid && x.againstSid === c.bySid && Math.abs((x.created || 0) - (c.created || 0)) < 3 * 864e5)) a.counter++;
  });
  const rows = Object.values(P).sort((a, z) => (z.upheld + z.made + z.filed) - (a.upheld + a.made + a.filed));
  return `<section class="sec" id="patterns"><h2>Patterns this school year</h2>
    <p class="muted">Two things to watch: a student many complaints are upheld about (more support: a plan at their Summit Session, then a team conversation and maybe a Freedom Level review), and a student who files a lot, files back, or makes things up (a check-in about what's going on; court shouldn't become a weapon).</p>
    ${rows.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Student</th><th class="num">Filed</th><th class="num">About them</th><th class="num">Upheld about them</th><th class="num">Filed back within 3 days</th><th class="num">Withdrawn</th><th class="num">Made up (judge's view)</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${esc(stu(r.sid).name || r.name)}</td><td class="num">${r.filed}</td><td class="num">${r.about}</td><td class="num">${r.upheld >= 3 ? `<span class="pill warn">${r.upheld}</span>` : r.upheld}</td><td class="num">${r.counter}</td><td class="num">${r.withdrawn}</td><td class="num">${r.made ? `<span class="pill bad">${r.made}</span>` : 0}</td></tr>`).join("")}</tbody></table></div>` : `<p class="empty">No cases yet this school year.</p>`}</section>`;
}
function vPlans() {
  return `<section class="sec" id="plans"><h2>Calm plans</h2><p class="muted">Students make these on Our Code (their warning signs, what helps, how adults can help). Their parents can see them too.</p>
    ${PLANS.length ? `<div class="grid2">${PLANS.sort((a, z) => (z.updated || 0) - (a.updated || 0)).map(p => `<div class="card"><div class="row" style="justify-content:space-between"><b>${esc(stu(p.id).name || p.name || p.id)}</b><span class="meta">${esc(when(p.updated))}</span></div>
      <dl class="kv"><dt>Warning signs</dt><dd>${esc(p.signs)}</dd><dt>What helps</dt><dd>${esc((p.helps || []).concat(p.extra ? [p.extra] : []).join(", "))}</dd><dt>Signal</dt><dd>${esc(p.words)}</dd><dt>Spot</dt><dd>${esc(p.place)}</dd><dt>Adults can</dt><dd>${esc(p.adults)}</dd></dl></div>`).join("")}</div>` : `<p class="empty">No calm plans yet.</p>`}</section>`;
}
function draw() {
  if (!ROLE || ROLE.role !== "staff") { $("#app").innerHTML = `<h1>Student Court desk</h1><p class="empty">This page is for Wilderland staff.</p>`; return; }
  $("#app").innerHTML = `<div><p class="eyebrow">Guides · Behavior</p><h1>Student Court desk</h1><p class="muted" style="margin-top:6px">The staff side of <a href="/court/">Student Court</a> (grades 2–8, Tier 1 and 2 problems between students). Students see the rules on <a href="/code/">Our Code</a>. ${isTest() ? "<b>Test view: test cases only.</b>" : ""}</p></div>
    <nav class="tabs"><a href="#needs">Needs you</a><a href="#judges">Judges and clerks</a><a href="#all">All cases</a><a href="#patterns">Patterns</a><a href="#plans">Calm plans</a></nav>
    ${MSG ? `<p class="flash">${esc(MSG)}</p>` : ""}${vNeeds()}${vJudges()}${vAll()}${vPatterns()}${vPlans()}`;
}
function redraw() { const y = scrollY, open = [...document.querySelectorAll("details[data-case][open]")].map(d => d.dataset.case); draw(); open.forEach(id => document.querySelectorAll(`details[data-case="${id}"]`).forEach(d => d.open = true)); scrollTo(0, y); }

async function save(id, d, msg) {
  try { await FSX.patch("courtCases/" + id, { ...d, updated: Date.now() }); Object.assign(CASES.find(c => c.id === id) || {}, d, { updated: Date.now() }); MSG = msg || ""; return true; }
  catch (e) { MSG = "Couldn't save (" + (e.status || "network") + ")."; redraw(); return false; }
}
function form(id, html) { document.querySelectorAll(`[data-form="${id}"]`).forEach(el => { el.innerHTML = `<div class="card form" style="margin-top:8px">${html}</div>`; }); }

document.addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b) return;
  const D = b.dataset, c = CASES.find(x => x.id === (D.sign || D.grant || D.deny || D.hear || D.close || D.reopen || D.tellother || D.dohear || D.doclose));
  if (D.bandf) { BANDF = D.bandf; redraw(); return; }
  if (D.statf) { STATF = D.statf; redraw(); return; }
  if (D.sign) { if (await save(c.id, { status: "closed", signedBy: me(), signedName: myName(), signedAt: Date.now() }, "Repair signed off. Case closed.")) { tell([c.byEmail], "Your Student Court case is closed: the repair was signed off", "/court/#mine"); redraw(); } return; }
  if (D.grant) { const cd = C.nextCourtDay(); if (await save(c.id, { status: "scheduled", appealStatus: "granted", courtDay: cd, finding: "", restore: "", restoreText: "", due: "" }, "Appeal granted. It's back on the docket for " + day(cd) + ".")) { tell([c.byEmail], "Your Student Court case will be heard again on " + day(cd), "/court/#mine"); redraw(); } return; }
  if (D.deny) { if (await save(c.id, { appealStatus: "denied" }, "Appeal denied.")) redraw(); return; }
  if (D.close) { form(c.id, `<label>Note (what you did)<textarea class="in" data-cnote maxlength="500"></textarea></label><div class="row"><button class="btn" type="button" data-doclose="${esc(c.id)}">Close the case</button></div>`); return; }
  if (D.doclose) { const n = (b.closest(".card").querySelector("[data-cnote]").value || "").trim(); if (await save(c.id, { status: "closed", staffNote: n, signedBy: me(), signedName: myName(), signedAt: Date.now() }, "Closed.")) redraw(); return; }
  if (D.reopen) { if (await save(c.id, { status: "filed" }, "Reopened: it's back with the judge.")) redraw(); return; }
  if (D.tellother) {
    if (window.wlNotifyFamily) window.wlNotifyFamily({ sid: c.againstSid, kind: "court", text: c.status === "scheduled" ? `You have a Student Court day: ${day(c.courtDay)}. See it and tell your side.` : "There's an update on a Student Court case about you.", link: "/court/#mine",
      parentText: c.status === "scheduled" ? `{name} has a Student Court hearing on ${day(c.courtDay)} about a problem with a classmate. A guide is there. We'll let you know how it's resolved.` : "" });
    MSG = "Sent to " + c.againstName + (c.status === "scheduled" ? " and their family." : "."); redraw(); return;
  }
  if (D.hear) {
    const cat = C.CAT[c.cat] || {};
    form(c.id, `<b>Decide it yourself</b>
      <label>Finding<select class="in" data-hf><option value="upheld">Upheld</option><option value="not_upheld">Not upheld</option></select></label>
      <label>Tier<select class="in" data-ht><option value="1" ${c.tier === 1 ? "selected" : ""}>1</option><option value="2" ${c.tier === 2 ? "selected" : ""}>2</option></select></label>
      <label>Repair (if upheld)<select class="in" data-hr>${Object.keys(C.RESTORES).map(k => `<option value="${k}" ${k === cat.restore ? "selected" : ""}>${esc(C.RESTORES[k].t)}</option>`).join("")}</select></label>
      <label>SMART plan<textarea class="in" data-hx maxlength="600"></textarea></label>
      <label>Due<input class="in" type="date" data-hd value="${esc(C.nextSchoolDay())}"></label>
      <label>Reason<input class="in" data-hn maxlength="300"></label>
      <div class="row"><button class="btn" type="button" data-dohear="${esc(c.id)}">Record</button></div>`);
    return;
  }
  if (D.dohear) {
    const f = b.closest(".card"), q = s => f.querySelector(s).value, up = q("[data-hf]") === "upheld";
    const d = up ? { status: "restoring", finding: "upheld", tier: +q("[data-ht]"), restore: q("[data-hr]"), restoreText: q("[data-hx]").trim(), due: q("[data-hd]"), findingNote: q("[data-hn]").trim(), judgeName: myName(), judgeEmail: me(), heardAt: Date.now() }
      : { status: "not_upheld", finding: "not_upheld", findingNote: q("[data-hn]").trim(), judgeName: myName(), judgeEmail: me(), heardAt: Date.now() };
    if (await save(c.id, d, "Finding recorded.")) { tell([c.byEmail], "A guide decided your Student Court complaint: " + (up ? "upheld" : "not upheld"), "/court/#mine"); redraw(); }
    return;
  }
  if (b.hasAttribute("data-appoint")) {
    const s = stu($("#j-sid").value), role = $("#j-role").value, until = $("#j-until").value, msg = $("#j-msg");
    if (!s.id || !s.email) { msg.textContent = "Choose a student with a school email on the roster."; msg.className = "note err"; return; }
    const d = { name: s.name, sid: s.id, role, bands: [s.band], active: true, from: C.iso(new Date()), until, by: me(), byName: myName(), at: Date.now() };
    if (isTest()) d.test = true;
    try {
      await FSX.patch("courtRoles/" + encodeURIComponent(String(s.email).toLowerCase()), d);
      ROLES = ROLES.filter(r => r.id !== String(s.email).toLowerCase()).concat([{ id: String(s.email).toLowerCase(), ...d }]);
      tell([s.email], `You've been appointed Student Court ${role} for grades ${s.band}${until ? " until " + day(until) : ""}`, "/court/#docket");
      MSG = `${s.name} is now a ${role}.`; redraw();
    } catch (x) { msg.textContent = "Couldn't save (" + (x.status || "network") + ")."; msg.className = "note err"; }
    return;
  }
  if (D.endrole || D.restartrole) {
    const id = D.endrole || D.restartrole, active = !!D.restartrole;
    try { await FSX.patch("courtRoles/" + encodeURIComponent(id), { active, at: Date.now(), by: me() }); const r = ROLES.find(x => x.id === id); if (r) r.active = active; MSG = active ? "Term restarted." : "Term ended."; redraw(); }
    catch (x) { MSG = "Couldn't save."; redraw(); }
  }
});

async function start(r) {
  ROLE = r && r.role ? r : null; MSG = "";
  if (ROLE && ROLE.role === "staff") { $("#app").innerHTML = `<p class="muted">Loading…</p>`; await load(); }
  draw();
  if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
}
let started = "";
document.addEventListener("wl-role", e => { const k = JSON.stringify(e.detail || null); if (k === started) return; started = k; start(e.detail); });
if (window.wlRole !== undefined) { started = JSON.stringify(window.wlRole || null); start(window.wlRole); }
