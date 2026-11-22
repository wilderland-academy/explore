// Guides › Student Roster (/guides/roster/, was /guides/students/): every student and their parents (add, edit, import
// from a spreadsheet), Mr. Fox alerts, and every student conversation with the coach.
// Saved challenges live on the Life Skills overview (/guides/lifeskills/); a student's page here links to them and
// keeps their saved project sparks and books.
// Who sees what (enforced by firestore.rules; this page only arranges it):
//   - Every staff member: the roster, all alerts and all Mr. Fox conversations. Any staff member can add or edit a
//     student and link parents (the same rule as the Life Skills tracker); only admins delete a student.
//   - Saved sparks and books: admins see every student; other staff see the grade bands of the students they guide
//     (from the "guide" field on each student's Life Skills tracker record).
// Writing a student's parents also updates lsParents/{email}, which lets a linked parent see the Labs schedule.
// Data: aiAlerts, aiChats, aiTurns, aiStudents (written by relay/worker.js), lsStudents and lsBoard (tracker),
// lsParents (Labs access), and each student's students/{uid}/sites/{site} record (written by /auth.js).
const FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const BANDS = ["K–1", "2–4", "5–8"];
const SEV = ["none", "low", "medium", "high", "urgent"];
const CAT = {
  self_harm: "Self-harm or suicide", harmed_by_others: "May be unsafe or harmed", threat_to_others: "Threat to others", sexual: "Sexual content",
  weapons_danger: "Weapons or dangerous activity", drugs_alcohol: "Drugs or alcohol", bullying_hate: "Bullying or hate", distress: "Upset or struggling",
  personal_info: "Shared personal details", manipulation: "Tried to get around the rules", cheating: "Asked AI to do the work", profanity: "Rude language",
  off_topic: "Off topic", tampering: "Log tampering", coach_reply_held_back: "Coach reply held back", academic_use: "Used the coach for academics", academic_interest: "Wants to try the academics coach", none: "None"
};
// What to do, shown on urgent alerts. Sources: Utah Code 80-2-602 (everyone must report suspected abuse or neglect
// immediately to DCFS or law enforcement; telling a school official does not satisfy it, per USBE rule R277-401),
// DCFS 24/7 intake 1-855-323-3237, SafeUT (University of Utah HMHI) and the 988 Lifeline.
const PROTOCOL = {
  self_harm: ["Check in with the student in person today. If they may be in danger right now, stay with them and call 911.", "Tell an admin (Shanan) and the student's parents today.", "Point them to SafeUT (app, chat or call) and 988 (call or text), available 24/7.", "Do not leave it to the AI. Write what you did in the note below."],
  harmed_by_others: ["Utah law: anyone who has reason to believe a child is abused or neglected must report immediately to DCFS (1-855-323-3237, 24/7) or law enforcement. Telling an admin does not replace your own report.", "If the child is in danger now, call 911.", "Don't question the child in depth or contact the person involved. Listen, stay calm, thank them, and report.", "Tell an admin (Shanan), then write what you did in the note below."],
  threat_to_others: ["Treat it as real until a guide has talked with the student.", "Tell an admin (Shanan) now. If anyone may be in danger, call 911.", "Write what you did in the note below."]
};
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const when = ms => ms ? new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
const W = window.WL || { ch: [] }, CH = Object.fromEntries(W.ch.map(c => [c.id, c]));

// ---------- Firestore REST with the signed-in staff member's token ----------
function val(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue; if ("integerValue" in v) return Number(v.integerValue); if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue; if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(val);
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)]));
  return null;
}
const docOf = d => ({ id: d.name.split("/").pop(), path: d.name.split("/documents/")[1], ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, val(v)])) });
const tok = async () => window.wlFirebase.auth.currentUser.getIdToken();
async function list(coll) {
  const out = []; let page = "";
  do {
    const r = await fetch(`${FS}/${coll}?pageSize=300${page ? "&pageToken=" + encodeURIComponent(page) : ""}`, { headers: { Authorization: "Bearer " + await tok() } });
    if (!r.ok) throw Object.assign(new Error(coll + " " + r.status), { status: r.status });
    const j = await r.json(); (j.documents || []).forEach(d => out.push(docOf(d))); page = j.nextPageToken || "";
  } while (page);
  return out;
}
async function runQuery(sq) {
  const r = await fetch(`${FS}:runQuery`, { method: "POST", headers: { Authorization: "Bearer " + await tok(), "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: sq }) });
  if (!r.ok) throw Object.assign(new Error("query " + r.status), { status: r.status });
  return (await r.json()).filter(x => x.document).map(x => docOf(x.document));
}
async function patch(path, data) {
  const enc = v => typeof v === "number" ? { integerValue: String(v) } : { stringValue: String(v) };
  const mask = Object.keys(data).map(k => "updateMask.fieldPaths=" + k).join("&");
  const r = await fetch(`${FS}/${path}?${mask}`, { method: "PATCH", headers: { Authorization: "Bearer " + await tok(), "Content-Type": "application/json" }, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, enc(v)])) }) });
  if (!r.ok) throw new Error("save " + r.status);
}

// Writes, all-or-nothing: Firestore's commit endpoint takes up to 500 writes at once.
const DOCS = "projects/wilderland-df15e/databases/(default)/documents";
function enc(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  if (typeof v === "object") return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
  return { stringValue: String(v) };
}
// w: { set: "coll/id", data, merge?: true, create?: true } or { del: "coll/id" }
async function commit(ws) {
  for (let i = 0; i < ws.length; i += 450) {
    const writes = ws.slice(i, i + 450).map(w => w.del ? { delete: `${DOCS}/${w.del}` } : {
      update: { name: `${DOCS}/${w.set}`, fields: Object.fromEntries(Object.entries(w.data).map(([k, v]) => [k, enc(v)])) },
      ...(w.merge ? { updateMask: { fieldPaths: Object.keys(w.data) } } : {}),
      ...(w.create ? { currentDocument: { exists: false } } : {})
    });
    const r = await fetch(`${FS}:commit`, { method: "POST", headers: { Authorization: "Bearer " + await tok(), "Content-Type": "application/json" }, body: JSON.stringify({ writes }) });
    if (!r.ok) { const t = await r.text(); throw Object.assign(new Error(r.status === 403 ? "You don't have permission to change that." : "Couldn't save (" + r.status + ")."), { status: r.status, detail: t }); }
  }
}
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(20)), b => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[b % 62]).join("");
const DOMAIN = "@wilderland.academy";
const emails = x => [...new Set(String(x || "").split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean))];
const isEmail = x => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
const shortName = n => { const p = String(n || "").trim().split(/\s+/); return p.length > 1 ? p[0] + " " + p[p.length - 1][0] + "." : p[0] || ""; };
const firstName = n => String(n || "").trim().split(/\s+/)[0] || "";
const chLink = id => window.WLChallenge ? window.WLChallenge.link(id, (CH[id] || {}).t || id) : esc((CH[id] || {}).t || id);

// ---------- state ----------
const S = { test: null, cf: "all", me: "", admin: false, alerts: [], chats: [], people: {}, ls: [], myBands: [], band: "All", q: "", showDone: false, books: null, loaded: false, flash: "" };
const key = e => String(e || "").toLowerCase();
// Admins turn on the academics pilot; in a test view, the test guide can too (for the test student only).
const canPilot = () => S.admin || !!S.test;
// Students without a school email (K–1) are keyed by their tracker record id.
const pkey = s => s.email ? key(s.email) : "sid:" + s.id;
function person(email) {
  const k = key(email);
  return S.people[k] || (S.people[k] = { email: k, name: "", band: "", guide: "", uid: "", sid: "", grade: "", parents: [], school: "", picks: [], sparks: [], saved: [], want: [], chats: [], alerts: [], coach: null });
}
// A tester's test view (the test guide) sees only the test accounts; everyone else never sees them.
const testWhere = { fieldFilter: { field: { fieldPath: "test" }, op: "EQUAL", value: { booleanValue: true } } };
const fetchAll = c => S.test ? runQuery({ from: [{ collectionId: c }], where: testWhere }) : list(c).then(xs => xs.filter(x => !x.test));
async function loadAll() {
  const [alerts, chats, ls, ai, sites] = await Promise.all([
    fetchAll("aiAlerts"), fetchAll("aiChats"), fetchAll("lsStudents"), fetchAll("aiStudents"),
    runQuery({ from: [{ collectionId: "sites", allDescendants: true }], ...(S.test ? { where: testWhere } : {}) }).then(xs => xs.filter(x => !!x.test === !!S.test)).catch(() => [])
  ]);
  S.people = {};
  S.ls = ls;
  ls.forEach(s => { const p = person(pkey(s)); Object.assign(p, { name: s.name || "", band: s.band || "", guide: s.guide || "", sid: s.id, grade: s.grade || "", parents: s.parents || [], school: s.email || "", academic: s.coachAcademic === true }); });
  ai.forEach(a => { const p = person(a.email); p.uid = a.uid || a.id; p.coach = a; if (!p.name) p.name = a.name || ""; if (!p.band) p.band = a.band || ""; });
  sites.forEach(d => {
    if (!d.email) return;
    const p = person(d.email), parts = (d.path || "").split("/"); p.uid = p.uid || parts[1];
    let data = {}; try { data = JSON.parse(d.data || "{}"); } catch (e) { }
    const j = k => { try { return JSON.parse(data[k]); } catch (e) { return null; } };
    if (d.id === "challenges") p.picks = (j("wl-picks") || []).filter(id => CH[id]);
    if (d.id === "projects") p.sparks = (j("atlas-sparks") || []).filter(x => x && x.t);
    if (d.id === "books") { const b = j("lantern-stacks") || {}; p.saved = b.saved || []; p.want = b.want || []; }
  });
  chats.forEach(c => person(c.email).chats.push(c));
  alerts.forEach(a => person(a.email).alerts.push(a));
  S.alerts = alerts.sort((a, b) => (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1) || SEV.indexOf(b.severity) - SEV.indexOf(a.severity) || b.at - a.at);
  S.chats = chats.sort((a, b) => (b.updated || 0) - (a.updated || 0));
  S.myBands = [...new Set(ls.filter(s => String(s.guide || "").toLowerCase().split(/[\s,;]+/).includes(S.me)).map(s => s.band).filter(Boolean))];
  S.loaded = true;
  badge();
  if (!S.test) syncParents().catch(e => console.warn("Roster: couldn't update parent access", e));
}
// lsParents/{email}: one record per linked parent, so the Labs schedule (and its files) can check a parent is linked
// without reading every student. Rebuilt from the student records; only what differs is written.
async function syncParents() {
  const want = {};
  S.ls.forEach(s => (s.parents || []).forEach(e => { e = key(e); const w = want[e] || (want[e] = { email: e, children: [], bands: [] }); w.children.push(s.id); if (s.band && !w.bands.includes(s.band)) w.bands.push(s.band); }));
  // The test parent's record is kept by /auth.js, not here.
  const have = Object.fromEntries((await list("lsParents")).filter(d => !d.test).map(d => [d.id, d]));
  const same = (a, b) => JSON.stringify((a || []).slice().sort()) === JSON.stringify((b || []).slice().sort());
  const ws = [];
  Object.values(want).forEach(w => { const h = have[w.email]; if (!h || !same(h.children, w.children) || !same(h.bands, w.bands)) ws.push({ set: "lsParents/" + w.email, data: { ...w, updated: Date.now() } }); });
  Object.keys(have).forEach(e => { if (!want[e]) ws.push({ del: "lsParents/" + e }); });
  if (ws.length) await commit(ws);
}
function badge() {
  const open = S.alerts.filter(a => a.status === "open");
  document.dispatchEvent(new CustomEvent("wl-alerts", { detail: { open: open.length, urgent: open.filter(a => a.severity === "urgent").length } }));
}
async function bookTitles() {
  if (S.books) return S.books;
  try {
    const t = await (await fetch("/books/")).text(), m = {};
    for (const x of t.matchAll(/\{id:"([^"]+)",t:"((?:[^"\\]|\\.)*)"/g)) m[x[1]] = x[2].replace(/\\"/g, '"');
    for (const x of t.matchAll(/"id": "([^"]+)", "t": "((?:[^"\\]|\\.)*)"/g)) m[x[1]] = x[2].replace(/\\"/g, '"');
    S.books = m;
  } catch (e) { S.books = {}; }
  return S.books;
}

// ---------- views ----------
function tabs(cur) {
  const open = S.alerts.filter(a => a.status === "open").length;
  return `<nav class="tabs" aria-label="Student Roster">
    <a href="#roster"${cur === "roster" ? ' aria-current="page"' : ""}>Students and parents</a>
    <a href="#alerts"${cur === "alerts" ? ' aria-current="page"' : ""}>Alerts <span class="count${open ? "" : " zero"}">${open}</span></a>
    <a href="#chats"${cur === "chats" ? ' aria-current="page"' : ""}>All AI conversations</a></nav>`;
}
const head = (t, sub) => `<header style="display:flex;flex-direction:column;gap:8px"><p class="eyebrow">Guides · Student Roster</p><h1>${t}</h1>${sub ? `<p class="muted">${sub}</p>` : ""}</header>`;
const sevTag = s => `<span class="sev ${esc(s)}">${esc(s)}</span>`;
const who = a => { const p = S.people[key(a.email)] || {}; return `<a href="#s=${encodeURIComponent(key(a.email))}">${esc(p.name || a.name || a.email)}</a>${(p.band || a.band) ? ` <span class="muted">· grades ${esc(p.band || a.band)}</span>` : ""}`; };

function alertCard(a) {
  const done = a.status !== "open", pr = a.severity === "urgent" && PROTOCOL[a.category];
  return `<article class="card sev-${esc(a.severity)}${done ? " done" : ""}">
    <div class="row" style="justify-content:space-between"><div class="row">${sevTag(a.severity)}<b>${esc(CAT[a.category] || a.category)}</b>${a.staffTest ? '<span class="sev none">staff test</span>' : ""}</div><span class="meta">${esc(when(a.at))}</span></div>
    <p>${who(a)}</p>
    ${a.reason ? `<p class="muted">${esc(a.reason)}</p>` : ""}
    ${a.quote ? `<p class="quote">“${esc(a.quote)}”</p>` : ""}
    ${pr && !done ? `<div class="protocol"><b>What to do now</b><ol>${pr.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>` : ""}
    ${done ? `<p class="meta">Reviewed by ${esc(a.reviewedBy || "")} ${esc(when(a.reviewedAt))}${a.note ? ": " + esc(a.note) : ""}</p>` : ""}
    ${a.category === "academic_interest" && canPilot() ? (() => { const p = S.people[key(a.email)] || {}; return p.sid ? (p.academic ? `<p class="meta">Academics pilot is on for this student.</p>` : `<div class="row"><button class="btn" type="button" data-unlock="${esc(p.sid)}">Turn on the academics pilot</button></div>`) : ""; })() : ""}
    <div class="row">${a.chatId ? `<a class="btn ghost" href="#c=${esc(a.chatId)}">Read the conversation</a>` : ""}${done ? "" : `<button class="btn" type="button" data-review="${esc(a.id)}">Mark reviewed</button>`}</div>
    ${done ? "" : `<div hidden data-note-for="${esc(a.id)}"><label class="small" for="n-${esc(a.id)}">What did you do? (saved with the alert)</label><textarea class="note" id="n-${esc(a.id)}" maxlength="500"></textarea><div class="row" style="margin-top:6px"><button class="btn" type="button" data-save-review="${esc(a.id)}">Save as reviewed</button></div></div>`}
  </article>`;
}
function vAlerts() {
  const open = S.alerts.filter(a => a.status === "open"), done = S.alerts.filter(a => a.status !== "open");
  return head("Alerts", "When a student's message to Mr. Fox is worrying or breaks the rules, it shows up here. Urgent ones come with what to do. Every staff member sees every alert.") + tabs("alerts") +
    (open.length ? `<div class="list">${open.map(alertCard).join("")}</div>` : `<p class="empty">No open alerts. Nice.</p>`) +
    (done.length ? `<details${S.showDone ? " open" : ""} data-done><summary class="small">Reviewed (${done.length})</summary><div class="list" style="margin-top:12px">${done.slice(0, 100).map(alertCard).join("")}</div></details>` : "");
}

function scope() {
  const bands = S.admin ? BANDS : S.myBands;
  return { bands };
}
// The roster: every student in the tracker, plus anyone who has used Mr. Fox but isn't in the tracker yet.
function vRoster() {
  const all = Object.values(S.people).filter(p => p.sid || p.chats.length || p.alerts.length);
  const show = all.filter(p => (S.band === "All" || p.band === S.band) && (!S.q || [p.name, p.email, p.school, p.guide, ...(p.parents || [])].join(" ").toLowerCase().includes(S.q)))
    .sort((a, b) => (BANDS.indexOf(a.band) + 1 || 9) - (BANDS.indexOf(b.band) + 1 || 9) || (a.name || a.email).localeCompare(b.name || b.email));
  const nParents = new Set(S.ls.flatMap(x => (x.parents || []).map(key))).size;
  const guideNames = g => emails(g).map(x => x.split("@")[0].replace(/^./, c => c.toUpperCase())).join(", ");
  return head("Student Roster", `${S.ls.length} students and ${nParents} linked parent${nParents === 1 ? "" : "s"}. Open a student for their parents, Mr. Fox conversations, alerts and saved sparks and books. Their Life Skills record and saved challenges are in <a href="/guides/lifeskills/">Life Skills</a>.`) + tabs("roster") +
    (S.flash ? `<p class="flash" role="status">${esc(S.flash)}</p>` : "") +
    `<div class="row">${["All", ...BANDS].map(b => `<button class="chip" type="button" data-band="${b}" aria-pressed="${S.band === b}">${b === "All" ? "All bands" : "Grades " + b}</button>`).join("")}<input class="in" type="search" id="q" placeholder="Find a student, parent or guide" value="${esc(S.q)}"><a class="btn" href="#add" style="margin-left:auto">Add a student</a></div>` +
    (show.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Student</th><th>Grades</th><th>Parents</th><th>Field Guide</th><th class="num">AI chats</th><th class="num">Open alerts</th><th>Last AI use</th><th></th></tr></thead><tbody>${show.map(p => {
      const open = p.alerts.filter(a => a.status === "open").length, k = p.sid && !p.school ? "sid:" + p.sid : p.email;
      return `<tr><td><a href="#s=${encodeURIComponent(k)}">${esc(p.name || p.email)}</a>${p.academic ? ' <span class="sev low">academics pilot</span>' : ""}${p.sid ? "" : ' <span class="meta">· not in the tracker yet</span>'}${p.school ? `<br><span class="meta">${esc(p.school)}</span>` : p.sid ? '<br><span class="meta">no student sign-in</span>' : ""}</td><td>${esc(p.band ? p.band + (p.grade ? " · gr " + p.grade : "") : "—")}</td>` +
        `<td class="small">${(p.parents || []).length ? p.parents.map(esc).join("<br>") : '<span class="meta">none linked</span>'}</td><td class="small">${esc(guideNames(p.guide)) || "—"}</td>` +
        `<td class="num">${p.chats.length}</td><td class="num">${open ? `<span class="count">${open}</span>` : "0"}</td><td>${esc(p.coach ? when(p.coach.lastAt) : "—")}</td><td>${p.sid ? `<a href="#edit=${esc(p.sid)}">Edit</a>` : `<a href="#add=${encodeURIComponent(p.email)}">Add</a>`}</td></tr>`;
    }).join("")}</tbody></table></div>` : `<p class="empty">${S.ls.length ? "No students match." : "No students yet. Add your crew, or import a spreadsheet."}</p>`) +
    `<p class="small muted">Only guides and admins can link a parent to a child. A parent sees a child's record, and the Labs schedule for that child's band, only after you add their email here and they confirm it.</p>`;
}

// ---------- add or edit one student ----------
function vEdit(sid, preEmail) {
  const s = sid ? S.ls.find(x => x.id === sid) : null;
  if (sid && !s) return `<p class="crumb"><a href="#roster">← Roster</a></p><p class="empty">That student isn't in the roster.</p>`;
  const pre = preEmail ? S.people[key(preEmail)] || {} : {};
  const v = s || { name: pre.name || "", band: pre.band || "2–4", grade: "", email: preEmail || "", guide: S.me, parents: [] };
  return `<p class="crumb"><a href="${s ? "#s=" + encodeURIComponent(pkey(s)) : "#roster"}">← ${s ? esc(s.name) : "Roster"}</a></p>` +
    head(s ? "Edit " + esc(s.name) : "Add a student", "Each parent signs in with the exact email you put here and sees only this child: their Life Skills record and the Labs schedule for their band.") +
    `<form class="card form" id="stu" data-sid="${esc(sid || "")}" novalidate>
      <div class="grid2"><label>Full name<input class="in" name="name" maxlength="60" value="${esc(v.name)}" autocomplete="off" required></label>
      <div class="row" style="align-items:flex-end"><label style="flex:1">Band<select class="in" name="band">${BANDS.map(b => `<option value="${b}"${v.band === b ? " selected" : ""}>Grades ${b}</option>`).join("")}</select></label><label style="width:90px">Grade<input class="in" name="grade" maxlength="2" value="${esc(v.grade || "")}" placeholder="3" style="min-width:0"></label></div></div>
      <div class="grid2"><label>Student's school email <span class="hint">(lets them sign in; optional for K–1)</span><input class="in" name="email" type="email" value="${esc(v.email || "")}" placeholder="maya@wilderland.academy"></label>
      <label>Field Guides <span class="hint">(school emails, separated by commas)</span><input class="in" name="guide" value="${esc(v.guide || "")}" placeholder="april@wilderland.academy, shanan@wilderland.academy"></label></div>
      <label>Parent emails <span class="hint">(one per line, up to 6)</span><textarea class="in" name="parents" rows="3" placeholder="one email per line">${esc((v.parents || []).join("\n"))}</textarea></label>
      <label class="chk"><input type="checkbox" name="coachAcademic"${v.coachAcademic === true ? " checked" : ""}${canPilot() ? "" : " disabled"}> Academics coach pilot <span class="hint">(lets this student use Mr. Fox for hint-only help with academics; every academics chat is flagged in Slack #alerts${S.admin ? "" : ". Only admins can change this"})</span></label>
      <div class="row"><button class="btn" type="submit">${s ? "Save" : "Add student"}</button><a class="btn ghost" href="${s ? "#s=" + encodeURIComponent(pkey(s)) : "#roster"}">Cancel</a>${s && S.admin ? `<button class="btn danger" type="button" data-del="${esc(s.id)}" style="margin-left:auto">Delete student</button>` : ""}</div>
      <p class="note" id="stu-note" aria-live="polite"></p>
    </form>` + (s ? "" : importPanel());
}
async function saveStudent(form) {
  const note = $("#stu-note"), say = t => { note.className = "note err"; note.textContent = t; };
  const sid = form.dataset.sid, s = sid ? S.ls.find(x => x.id === sid) : null, fd = new FormData(form);
  const name = String(fd.get("name") || "").trim().replace(/\s+/g, " "), email = String(fd.get("email") || "").trim().toLowerCase(), guide = emails(fd.get("guide")).join(", "), parents = emails(fd.get("parents"));
  if (name.length < 2) return say("Add the student's full name.");
  if (email && !email.endsWith(DOMAIN)) return say("The student email must be their @wilderland.academy account (or leave it blank for K–1).");
  if (emails(guide).some(g => !g.endsWith(DOMAIN))) return say("Field Guide emails must be @wilderland.academy accounts.");
  const bad = parents.filter(x => !isEmail(x)); if (bad.length) return say("Check these parent emails: " + bad.join(", "));
  if (parents.some(x => x.endsWith(DOMAIN) && !ADMINS.includes(x))) return say("Use each parent's personal email, not a school account.");
  if (parents.length > 6) return say("Up to 6 parent emails per student.");
  if (email && S.ls.some(x => x.email === email && x.id !== sid)) return say("Another student already has that email.");
  const data = { name, band: String(fd.get("band")), grade: String(fd.get("grade") || "").trim(), email, guide, parents, updated: Date.now(), updatedBy: S.me };
  if (canPilot()) data.coachAcademic = fd.get("coachAcademic") === "on";
  const id = sid || newId();
  form.querySelector("[type=submit]").disabled = true; note.className = "note"; note.textContent = "Saving…";
  try {
    if (s) await commit([{ set: "lsStudents/" + id, data, merge: true }, { set: "lsBoard/" + id, data: { name: shortName(name), band: data.band, updated: Date.now() }, merge: true }]);
    else await commit([{ set: "lsStudents/" + id, data: { ...data, celebrated: 0, created: Date.now(), ...(S.test ? { test: true } : {}) }, create: true }, { set: "lsBoard/" + id, data: { name: shortName(name), band: data.band, working: [], passed: [], credits: 0, updated: Date.now(), ...(S.test ? { test: true } : {}) } }]);
    S.flash = s ? `Saved ${firstName(name)}.` : `Added ${firstName(name)}.`;
    await loadAll(); location.hash = "#s=" + encodeURIComponent(email || "sid:" + id);
  } catch (e) { form.querySelector("[type=submit]").disabled = false; say(e.message); }
}
async function deleteStudent(sid, btn) {
  if (!btn.dataset.sure) { btn.dataset.sure = "1"; btn.textContent = "Delete this student and every Life Skills record? Click again."; return; }
  btn.disabled = true;
  try {
    const entries = await list("lsStudents/" + sid + "/entries");
    await commit([...entries.map(e => ({ del: "lsStudents/" + sid + "/entries/" + e.id })), { del: "lsBoard/" + sid }, { del: "lsStudents/" + sid }]);
    S.flash = "Deleted."; await loadAll(); location.hash = "#roster";
  } catch (e) { btn.disabled = false; alert(e.message); }
}

// ---------- import many students at once from a CSV ----------
// Columns (header row required): name, grade, band, student_email, parent_emails, guides (several emails: separate with ;).
// A student already here (same school email, or same name) is updated: band and grade from the file, their email if
// they had none, guides if the file has them, and the parent emails added to the ones already linked. Nobody is removed.
function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}
let importPlan = [];
function importPanel() {
  return `<section class="card form"><h2>Import from a spreadsheet</h2>
    <p class="small muted">A CSV with a header row: name, grade, band (K–1, 2–4 or 5–8), student_email, parent_emails and guides (separate several emails with ;). Students already here are matched by school email or name and get the new parent emails added. Nothing is removed. You'll see every row before anything saves.</p>
    <label>CSV file<input class="in" type="file" id="imf" accept=".csv,text/csv"></label><div id="imout"></div></section>`;
}
async function readImport(file) {
  const out = $("#imout"); importPlan = [];
  const rows = parseCSV(await file.text()), hd = (rows.shift() || []).map(x => x.trim().toLowerCase()), col = k => hd.indexOf(k);
  if (col("name") < 0 || col("band") < 0) { out.innerHTML = `<p class="note err">The file needs a header row with at least name and band.</p>`; return; }
  const bad = [];
  rows.forEach((r, i) => {
    const get = k => col(k) < 0 ? "" : String(r[col(k)] || "").trim();
    const name = get("name").replace(/\s+/g, " "), band = get("band").replace("-", "–"), email = get("student_email").toLowerCase(), parents = emails(get("parent_emails")), guides = emails(get("guides"));
    const why = [];
    if (name.length < 2 || name.length > 60) why.push("name");
    if (!BANDS.includes(band)) why.push("band");
    if (email && !email.endsWith(DOMAIN)) why.push("student email");
    if (parents.some(x => !isEmail(x) || x.endsWith(DOMAIN))) why.push("a parent email");
    if (guides.some(g => !g.endsWith(DOMAIN))) why.push("a guide email");
    if (why.length) { bad.push(`Row ${i + 2} (${name || "no name"}): check ${why.join(", ")}`); return; }
    const ex = S.ls.find(x => (email && x.email === email) || x.name.toLowerCase() === name.toLowerCase());
    const merged = ex ? [...new Set([...(ex.parents || []), ...parents])] : parents;
    if (merged.length > 6) { bad.push(`Row ${i + 2} (${name}): more than 6 parent emails`); return; }
    importPlan.push({ ex, guide: guides.length ? guides.join(", ") : null, name, band, grade: get("grade"), email: ex && ex.email ? ex.email : email, parents: merged, added: merged.length - (ex ? (ex.parents || []).length : 0) });
  });
  const dupe = importPlan.filter((x, i) => x.email && importPlan.findIndex(q => q.email === x.email) !== i);
  dupe.forEach(x => bad.push(`${x.name}: ${x.email} is used twice in the file`));
  if (dupe.length) importPlan = [];
  const nNew = importPlan.filter(x => !x.ex).length;
  out.innerHTML = (bad.length ? `<div class="empty"><p>Fix these rows, then choose the file again:</p><ul>${bad.map(b => `<li class="small">${esc(b)}</li>`).join("")}</ul></div>` : "") +
    (importPlan.length ? `<p>${nNew} new student${nNew === 1 ? "" : "s"}, ${importPlan.length - nNew} already here (updated), ${importPlan.reduce((n, x) => n + Math.max(0, x.added), 0)} parent links to add.</p>
    <div class="tblwrap"><table class="tbl"><thead><tr><th></th><th>Student</th><th>Band</th><th>Student email</th><th>Parents</th><th>Guides</th></tr></thead><tbody>${importPlan.map(x => `<tr><td><span class="sev ${x.ex ? "none" : "low"}">${x.ex ? "Update" : "New"}</span></td><td>${esc(x.name)}</td><td>${esc(x.band)}</td><td>${esc(x.email || "none")}</td><td class="small">${esc(x.parents.join(", ") || "none")}</td><td class="small">${esc(x.guide || (x.ex && x.ex.guide) || "none")}</td></tr>`).join("")}</tbody></table></div>
    <div class="row"><button class="btn" type="button" data-import>Import ${importPlan.length} students</button></div><p class="note" id="imnote" aria-live="polite"></p>` : "");
}
async function runImport(btn) {
  const note = $("#imnote"); btn.disabled = true; note.className = "note"; note.textContent = "Saving…";
  try {
    const ws = [];
    importPlan.forEach(x => {
      const id = x.ex ? x.ex.id : newId();
      const data = { name: x.ex ? x.ex.name : x.name, band: x.band, grade: x.grade, email: x.email, parents: x.parents, updated: Date.now(), updatedBy: S.me };
      if (x.guide !== null) data.guide = x.guide;
      if (x.ex) ws.push({ set: "lsStudents/" + id, data, merge: true }, { set: "lsBoard/" + id, data: { name: shortName(data.name), band: data.band, updated: Date.now() }, merge: true });
      else ws.push({ set: "lsStudents/" + id, data: { guide: "", ...data, celebrated: 0, created: Date.now(), ...(S.test ? { test: true } : {}) }, create: true }, { set: "lsBoard/" + id, data: { name: shortName(data.name), band: data.band, working: [], passed: [], credits: 0, updated: Date.now(), ...(S.test ? { test: true } : {}) } });
    });
    await commit(ws);
    S.flash = `Imported ${importPlan.length} students.`; importPlan = []; await loadAll(); location.hash = "#roster"; route();
  } catch (e) { btn.disabled = false; note.className = "note err"; note.textContent = e.message + " Students saved before the problem stay saved; choose the file again to finish."; }
}
const KIND = { challenge: "challenge", project: "project", academic: "academics (pilot, hint-only)", lesson: "lesson", conflict: "conflict", "find-challenge": "finding a challenge", "find-project": "finding a project" };
function chatTopic(c) {
  if (c.kind === "lesson") return "How to use the coach";
  if (c.kind === "challenge" && CH[c.topicId]) return chLink(c.topicId);
  return esc(c.topicTitle || ({ academic: "Academics", conflict: "Working out a conflict" }[c.kind] || "—"));
}
function chatRow(c) {
  return `<tr><td>${who(c)}</td><td>${chatTopic(c)}<br><span class="meta">${esc(KIND[c.kind] || c.kind)}${c.staffTest ? " · staff test" : ""}</span></td><td class="num">${c.turns || 0}</td><td>${c.level ? sevTag(SEV[c.level]) : ""}${c.reviewed ? ' <span class="meta">reviewed</span>' : ""}</td><td>${esc(when(c.updated))}</td><td><a href="#c=${esc(c.id)}">Read</a></td></tr>`;
}
function vChats() {
  const rows = S.chats.filter(c => S.cf === "academic" ? c.kind === "academic" : S.cf === "conflict" ? c.kind === "conflict" : S.cf === "review" ? !c.reviewed : true).filter(c => !S.q || ((S.people[key(c.email)] || {}).name + " " + c.email + " " + (c.topicTitle || "") + " " + (c.last || "")).toLowerCase().includes(S.q));
  return head("All AI conversations", "Every conversation any student has had with Mr. Fox, newest first. Students can't delete them. Academics conversations are always flagged for review, here and in Slack #alerts.") + tabs("chats") +
    `<div class="row"><input class="in" type="search" id="q" placeholder="Find a student, challenge or words" value="${esc(S.q)}"></div>` +
    `<div class="row">${[["all", "All"], ["conflict", "Conflicts"], ["academic", "Academics"], ["review", "Not reviewed yet"]].map(([k, l]) => `<button class="chip" type="button" data-cf="${k}" aria-pressed="${S.cf === k}">${l}</button>`).join("")}</div>` +
    (rows.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Student</th><th>About</th><th class="num">Messages</th><th>Flag</th><th>Last</th><th></th></tr></thead><tbody>${rows.slice(0, 400).map(chatRow).join("")}</tbody></table></div>` : `<p class="empty">No conversations match.</p>`);
}
async function vStudent(k) {
  const p = S.people[key(k)] || S.people[k];
  if (!p) return `<p class="crumb"><a href="#roster">← Roster</a></p><p class="empty">No student with that email.</p>`;
  const allowed = S.admin || S.myBands.includes(p.band);
  const books = allowed && (p.saved.length || p.want.length) ? await bookTitles() : {};
  const sec = (t, items, empty) => `<section class="card"><h3>${t}</h3>${items.length ? `<ul class="items">${items.join("")}</ul>` : `<p class="muted small">${empty}</p>`}</section>`;
  const ls = p.sid ? `/guides/lifeskills/#s=${encodeURIComponent(p.sid)}` : "";
  return (S.flash ? `<p class="flash" role="status">${esc(S.flash)}</p>` : "") + `<p class="crumb"><a href="#roster">← Roster</a></p>` +
    head(esc(p.name || p.email), `${p.band ? "Grades " + esc(p.band) + (p.grade ? ", grade " + esc(p.grade) : "") + " · " : ""}${esc(p.school || (p.sid ? "no student sign-in" : p.email))}${p.guide ? " · Guide: " + esc(p.guide) : ""}${p.coach ? ` · Mr. Fox: ${p.coach.count || 0} messages on ${esc(p.coach.day || "")}` : ""}`) +
    `<div class="row">${p.sid ? `<a class="btn" href="#edit=${esc(p.sid)}">Edit student and parents</a><a class="btn ghost" href="${ls}">Life Skills record</a>` : `<a class="btn" href="#add=${encodeURIComponent(p.email)}">Add to the roster</a>`}</div>` +
    (p.sid ? `<section class="card"><h3>Parents (${(p.parents || []).length})</h3>${(p.parents || []).length ? `<ul class="items">${p.parents.map(e => `<li>${esc(e)}</li>`).join("")}</ul>` : `<p class="muted small">No parents linked yet. <a href="#edit=${esc(p.sid)}">Add their emails</a>.</p>`}</section>` : "") +
    (p.alerts.filter(a => a.status === "open").length ? `<div class="list">${p.alerts.filter(a => a.status === "open").map(alertCard).join("")}</div>` : "") +
    (allowed ? `<div class="grid2">
      <section class="card"><h3>Challenges saved (${p.picks.length})</h3>${p.picks.length ? `<ul class="items">${p.picks.map(id => `<li>${chLink(id)} <span class="meta">· ${esc(CH[id].b)}</span></li>`).join("")}</ul>` : `<p class="muted small">None saved.</p>`}<p class="small muted">Compared with their year goals on the <a href="/guides/lifeskills/#overview">Life Skills overview</a> (Show: Saved to plan).</p></section>
      ${sec(`Project sparks saved (${p.sparks.length})`, p.sparks.map(x => `<li>${esc(x.t)}</li>`), "None saved.")}
      ${sec(`Books on their shelf (${p.saved.length})`, p.saved.map(id => `<li>${esc(books[id] || id)}</li>`), "None saved.")}
      ${sec(`Books they want to read (${p.want.length})`, p.want.map(id => `<li>${esc(books[id] || id)}</li>`), "None yet.")}
    </div>` : `<p class="empty">This student is outside your grade band, so their saved things aren't shown. Their AI conversations are below.</p>`) +
    `<section style="display:flex;flex-direction:column;gap:10px"><h2>Mr. Fox conversations (${p.chats.length})</h2>${p.chats.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Student</th><th>About</th><th class="num">Messages</th><th>Flag</th><th>Last</th><th></th></tr></thead><tbody>${p.chats.sort((a, b) => b.updated - a.updated).map(chatRow).join("")}</tbody></table></div>` : `<p class="empty">No conversations.</p>`}</section>`;
}
async function vChat(id) {
  const c = S.chats.find(x => x.id === id);
  const turns = (await runQuery({ from: [{ collectionId: "aiTurns" }], where: { fieldFilter: { field: { fieldPath: "chatId" }, op: "EQUAL", value: { stringValue: id } } }, limit: 500 })).sort((a, b) => a.at - b.at);
  const p = c ? S.people[key(c.email)] || {} : {};
  return `<p class="crumb"><a href="${c ? "#s=" + encodeURIComponent(key(c.email)) : "#chats"}">← ${esc(c ? p.name || c.email : "Conversations")}</a></p>` +
    head(esc(c ? (c.kind === "lesson" ? "How to use the coach" : c.topicTitle || "Conversation") : "Conversation"), c ? `${esc(p.name || c.email)}${c.band ? " · grades " + esc(c.band) : ""} · ${esc(c.kind)} · started ${esc(when(c.created))}${c.staffTest ? " · staff test" : ""}` : "") +
    (c && !c.reviewed ? `<div class="row"><button class="btn ghost" type="button" data-chat-reviewed="${esc(id)}">Mark conversation reviewed</button></div>` : c && c.reviewed ? `<p class="meta">Reviewed by ${esc(c.reviewedBy)} ${esc(when(c.reviewedAt))}</p>` : "") +
    `<div class="convo">${turns.map(t => {
      const flag = t.role === "student" && t.severity && t.severity !== "none";
      const tags = [flag ? `${sevTag(t.severity)} ${esc(CAT[t.flag] || t.flag || "")}` : "", t.scripted ? "fixed safety reply" : "", t.blocked ? "a reply was held back: " + esc(t.blocked) : ""].filter(Boolean).join(" · ");
      return `<div class="bub ${t.role === "student" ? "student" : "coach"}${flag && SEV.indexOf(t.severity) >= 2 ? " flag" + (t.severity === "urgent" ? " urgent" : "") : ""}"><span class="who">${t.role === "student" ? esc(p.name || "Student") : "Mr. Fox"} · ${esc(when(t.at))}${tags ? " · " + tags : ""}</span>${esc(t.text).replace(/\[([A-Z]{2}-\d{2}\.\d{1,2})\]/g, (m, id) => CH[id] ? chLink(id) : m)}</div>`;
    }).join("") || '<p class="empty">No messages.</p>'}</div>`;
}

async function route() {
  const app = $("#app");
  if (!S.loaded) return;
  const [v, arg] = location.hash.slice(1).split("=");
  try {
    if (v === "s") app.innerHTML = await vStudent(decodeURIComponent(arg || ""));
    else if (v === "c") app.innerHTML = await vChat(arg || "");
    else if (v === "edit") app.innerHTML = vEdit(decodeURIComponent(arg || ""));
    else if (v === "add") app.innerHTML = vEdit("", arg ? decodeURIComponent(arg) : "");
    else if (v === "alerts") app.innerHTML = vAlerts();
    else if (v === "chats") app.innerHTML = vChats();
    // The old "Students and what they saved" tab is now the roster.
    else app.innerHTML = vRoster();
  } catch (e) { app.innerHTML = `<p class="empty">Couldn't load this: ${esc(e.message)}</p>`; }
  S.flash = "";
}
async function start(r) {
  const app = $("#app"), u = window.wlFirebase && window.wlFirebase.auth.currentUser;
  if (!u) { app.innerHTML = head("Student Roster") + `<p class="empty">Sign in with your Wilderland staff account. <button class="btn" type="button" data-wl-signin>Sign in</button></p>`; return; }
  if (!r || r.role !== "staff" || !String(r.email || u.email).toLowerCase().endsWith("@wilderland.academy")) { app.innerHTML = head("Student Roster") + `<p class="empty">This page is for Wilderland staff.</p>`; return; }
  // In a test view this page is the test guide's (r.email is the test guide's address).
  S.test = r.test || null; S.me = key(S.test ? r.email : u.email); S.admin = !S.test && ADMINS.includes(S.me);
  // Start on this guide's own band (All for admins without one).
  if (!S.bandSet && window.wlBand) { S.band = window.wlBand({ all: true }); S.bandSet = true; }
  try { await loadAll(); }
  catch (e) { app.innerHTML = head("Student Roster") + `<p class="empty">${e.status === 403 ? "The database rules for Mr. Fox aren't published yet, or your account isn't on the staff list. Tell Alex." : "Couldn't load. Check your connection and reload."}</p>`; return; }
  route();
}

addEventListener("hashchange", () => { route(); scrollTo(0, 0); });
document.addEventListener("submit", e => { if (e.target.id === "stu") { e.preventDefault(); saveStudent(e.target); } });
document.addEventListener("change", e => { if (e.target.id === "imf" && e.target.files[0]) readImport(e.target.files[0]); });
document.addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.band) { S.band = t.dataset.band; route(); return; }
  if (t.dataset.cf) { S.cf = t.dataset.cf; route(); return; }
  if (t.dataset.del) { deleteStudent(t.dataset.del, t); return; }
  if (t.hasAttribute("data-import")) { runImport(t); return; }
  if (t.dataset.unlock) {
    t.disabled = true;
    try { await commit([{ set: "lsStudents/" + t.dataset.unlock, data: { coachAcademic: true, updated: Date.now(), updatedBy: S.me }, merge: true }]); S.flash = "Academics pilot turned on."; await loadAll(); route(); }
    catch (x) { t.disabled = false; alert(x.message); }
    return;
  }
  if (t.dataset.review) { const n = document.querySelector(`[data-note-for="${t.dataset.review}"]`); if (n) { n.hidden = false; n.querySelector("textarea").focus(); t.hidden = true; } return; }
  if (t.dataset.saveReview) {
    const id = t.dataset.saveReview, note = (document.getElementById("n-" + id) || {}).value || "";
    t.disabled = true;
    try { const now = Date.now(); await patch(`aiAlerts/${id}`, { status: "reviewed", note: note.trim(), reviewedBy: S.me, reviewedAt: now }); Object.assign(S.alerts.find(a => a.id === id), { status: "reviewed", note: note.trim(), reviewedBy: S.me, reviewedAt: now }); badge(); route(); }
    catch (x) { t.disabled = false; alert("Couldn't save. Try again."); }
    return;
  }
  if (t.dataset.chatReviewed) {
    const id = t.dataset.chatReviewed; t.disabled = true;
    try { const now = Date.now(); await patch(`aiChats/${id}`, { reviewed: "yes", reviewedBy: S.me, reviewedAt: now }); Object.assign(S.chats.find(c => c.id === id) || {}, { reviewed: "yes", reviewedBy: S.me, reviewedAt: now }); route(); }
    catch (x) { t.disabled = false; alert("Couldn't save. Try again."); }
  }
});
document.addEventListener("input", e => {
  if (e.target.id !== "q") return;
  clearTimeout(e.target._t);
  e.target._t = setTimeout(() => { S.q = e.target.value.trim().toLowerCase(); const pos = e.target.selectionStart; route().then(() => { const q = $("#q"); if (q) { q.focus(); q.setSelectionRange(pos, pos); } }); }, 250);
});
document.addEventListener("toggle", e => { if (e.target.matches && e.target.matches("[data-done]")) S.showDone = e.target.open; }, true);
let started = false;
document.addEventListener("wl-role", e => { if (e.detail && e.detail.role === "staff" && started) return; started = !!(e.detail && e.detail.role === "staff"); start(e.detail); });
document.addEventListener("wl-auth", e => { if (!e.detail) start(null); });
if (window.wlRole !== undefined) start(window.wlRole);
