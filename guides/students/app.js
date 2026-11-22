// Guides › Students (/guides/students/): AI Coach alerts, every student conversation with the coach, and what
// students have saved (challenges, project sparks, books).
// Who sees what (enforced by firestore.rules; this page only arranges it):
//   - Every staff member: all alerts and all AI Coach conversations.
//   - Saved challenges, sparks and books: admins see every student; other staff see the grade bands of the students
//     they guide (from the "guide" field on each student's Life Skills tracker record).
// Data: aiAlerts, aiChats, aiTurns, aiStudents (written by relay/worker.js), lsStudents (tracker), and each student's
// students/{uid}/sites/{site} record (written by /auth.js).
const FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const BANDS = ["K–1", "2–4", "5–8"];
const SEV = ["none", "low", "medium", "high", "urgent"];
const CAT = {
  self_harm: "Self-harm or suicide", harmed_by_others: "May be unsafe or harmed", threat_to_others: "Threat to others", sexual: "Sexual content",
  weapons_danger: "Weapons or dangerous activity", drugs_alcohol: "Drugs or alcohol", bullying_hate: "Bullying or hate", distress: "Upset or struggling",
  personal_info: "Shared personal details", manipulation: "Tried to get around the rules", cheating: "Asked AI to do the work", profanity: "Rude language",
  off_topic: "Off topic", tampering: "Log tampering", coach_reply_held_back: "Coach reply held back", none: "None"
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

// ---------- state ----------
const S = { me: "", admin: false, alerts: [], chats: [], people: {}, myBands: [], band: "All", q: "", showDone: false, books: null, loaded: false };
const key = e => String(e || "").toLowerCase();
function person(email) {
  const k = key(email);
  return S.people[k] || (S.people[k] = { email: k, name: "", band: "", guide: "", uid: "", picks: [], sparks: [], saved: [], want: [], chats: [], alerts: [], coach: null });
}
async function loadAll() {
  const [alerts, chats, ls, ai, sites] = await Promise.all([
    list("aiAlerts"), list("aiChats"), list("lsStudents"), list("aiStudents"),
    runQuery({ from: [{ collectionId: "sites", allDescendants: true }] }).catch(() => [])
  ]);
  S.people = {};
  ls.forEach(s => { const p = person(s.email); Object.assign(p, { name: s.name || "", band: s.band || "", guide: s.guide || "", sid: s.id }); });
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
  return `<nav class="tabs" aria-label="Students">
    <a href="#alerts"${cur === "alerts" ? ' aria-current="page"' : ""}>Alerts <span class="count${open ? "" : " zero"}">${open}</span></a>
    <a href="#students"${cur === "students" ? ' aria-current="page"' : ""}>Students and what they saved</a>
    <a href="#chats"${cur === "chats" ? ' aria-current="page"' : ""}>All AI conversations</a></nav>`;
}
const head = (t, sub) => `<header style="display:flex;flex-direction:column;gap:8px"><p class="eyebrow">Guides · Students</p><h1>${t}</h1>${sub ? `<p class="muted">${sub}</p>` : ""}</header>`;
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
    <div class="row">${a.chatId ? `<a class="btn ghost" href="#c=${esc(a.chatId)}">Read the conversation</a>` : ""}${done ? "" : `<button class="btn" type="button" data-review="${esc(a.id)}">Mark reviewed</button>`}</div>
    ${done ? "" : `<div hidden data-note-for="${esc(a.id)}"><label class="small" for="n-${esc(a.id)}">What did you do? (saved with the alert)</label><textarea class="note" id="n-${esc(a.id)}" maxlength="500"></textarea><div class="row" style="margin-top:6px"><button class="btn" type="button" data-save-review="${esc(a.id)}">Save as reviewed</button></div></div>`}
  </article>`;
}
function vAlerts() {
  const open = S.alerts.filter(a => a.status === "open"), done = S.alerts.filter(a => a.status !== "open");
  return head("Alerts", "When a student's message to the AI Coach is worrying or breaks the rules, it shows up here. Urgent ones come with what to do. Every staff member sees every alert.") + tabs("alerts") +
    (open.length ? `<div class="list">${open.map(alertCard).join("")}</div>` : `<p class="empty">No open alerts. Nice.</p>`) +
    (done.length ? `<details${S.showDone ? " open" : ""} data-done><summary class="small">Reviewed (${done.length})</summary><div class="list" style="margin-top:12px">${done.slice(0, 100).map(alertCard).join("")}</div></details>` : "");
}

function scope() {
  const all = Object.values(S.people).filter(p => p.name || p.chats.length || p.picks.length || p.sparks.length || p.saved.length || p.want.length);
  const bands = S.admin ? BANDS : S.myBands;
  return { bands, people: all.filter(p => S.admin || bands.includes(p.band)) };
}
function vStudents() {
  const { bands, people } = scope();
  if (!S.admin && !bands.length) return head("Students and what they saved") + tabs("students") + `<p class="empty">You aren't listed as the guide for any student in the Life Skills tracker yet, so there's no grade band to show. Ask an admin to add you as a guide on your students' records. You can still read every AI conversation and alert.</p>`;
  const show = people.filter(p => (S.band === "All" || p.band === S.band) && (!S.q || (p.name + " " + p.email).toLowerCase().includes(S.q)))
    .sort((a, b) => BANDS.indexOf(a.band) - BANDS.indexOf(b.band) || (a.name || a.email).localeCompare(b.name || b.email));
  const choices = ["All", ...bands];
  return head("Students and what they saved", S.admin ? "Every student. Saved challenges, project sparks and books, AI Coach use and alerts." : `Your grade band${bands.length > 1 ? "s" : ""}: ${bands.join(", ")}. Saved challenges, project sparks and books, AI Coach use and alerts.`) + tabs("students") +
    `<div class="row">${choices.length > 2 ? choices.map(b => `<button class="chip" type="button" data-band="${b}" aria-pressed="${S.band === b}">${b === "All" ? "All bands" : "Grades " + b}</button>`).join("") : ""}<input class="in" type="search" id="q" placeholder="Find a student" value="${esc(S.q)}"></div>` +
    (show.length ? `<table class="tbl"><thead><tr><th>Student</th><th>Grades</th><th class="num">Challenges saved</th><th class="num">Sparks saved</th><th class="num">Books</th><th class="num">AI chats</th><th class="num">Open alerts</th><th>Last AI use</th></tr></thead><tbody>${show.map(p => {
      const open = p.alerts.filter(a => a.status === "open").length;
      return `<tr><td><a href="#s=${encodeURIComponent(p.email)}">${esc(p.name || p.email)}</a></td><td>${esc(p.band || "—")}</td><td class="num">${p.picks.length}</td><td class="num">${p.sparks.length}</td><td class="num">${p.saved.length + p.want.length}</td><td class="num">${p.chats.length}</td><td class="num">${open ? `<span class="count">${open}</span>` : "0"}</td><td>${esc(p.coach ? when(p.coach.lastAt) : "—")}</td></tr>`;
    }).join("")}</tbody></table>` : `<p class="empty">No students match.</p>`) +
    `<p class="small muted">Saved things come from each student's school sign-in (the Challenges plan, Projects sparks, and the Books shelf and want list). Students who only used a shared device without signing in won't show up.</p>`;
}
function chatRow(c) {
  return `<tr><td>${who(c)}</td><td>${esc(c.kind === "lesson" ? "How to use the coach" : c.topicTitle || "—")}<br><span class="meta">${esc(c.kind)}${c.staffTest ? " · staff test" : ""}</span></td><td class="num">${c.turns || 0}</td><td>${c.level ? sevTag(SEV[c.level]) : ""}${c.reviewed ? ' <span class="meta">reviewed</span>' : ""}</td><td>${esc(when(c.updated))}</td><td><a href="#c=${esc(c.id)}">Read</a></td></tr>`;
}
function vChats() {
  const rows = S.chats.filter(c => !S.q || ((S.people[key(c.email)] || {}).name + " " + c.email + " " + (c.topicTitle || "") + " " + (c.last || "")).toLowerCase().includes(S.q));
  return head("All AI conversations", "Every conversation any student has had with the AI Coach, newest first. Students can't delete them.") + tabs("chats") +
    `<div class="row"><input class="in" type="search" id="q" placeholder="Find a student, challenge or words" value="${esc(S.q)}"></div>` +
    (rows.length ? `<table class="tbl"><thead><tr><th>Student</th><th>About</th><th class="num">Messages</th><th>Flag</th><th>Last</th><th></th></tr></thead><tbody>${rows.slice(0, 400).map(chatRow).join("")}</tbody></table>` : `<p class="empty">No conversations yet.</p>`);
}
async function vStudent(email) {
  const p = S.people[key(email)];
  if (!p) return `<p class="crumb"><a href="#students">← Students</a></p><p class="empty">No student with that email.</p>`;
  const allowed = S.admin || S.myBands.includes(p.band);
  const books = allowed && (p.saved.length || p.want.length) ? await bookTitles() : {};
  const sec = (t, items, empty) => `<section class="card"><h3>${t}</h3>${items.length ? `<ul class="items">${items.join("")}</ul>` : `<p class="muted small">${empty}</p>`}</section>`;
  return `<p class="crumb"><a href="#students">← Students</a></p>` + head(esc(p.name || p.email), `${p.band ? "Grades " + esc(p.band) + " · " : ""}${esc(p.email)}${p.guide ? " · Guide: " + esc(p.guide) : ""}${p.coach ? ` · AI Coach: ${p.coach.count || 0} messages on ${esc(p.coach.day || "")}` : ""}`) +
    (p.alerts.filter(a => a.status === "open").length ? `<div class="list">${p.alerts.filter(a => a.status === "open").map(alertCard).join("")}</div>` : "") +
    (allowed ? `<div class="grid2">
      ${sec(`Challenges in their plan (${p.picks.length})`, p.picks.map(id => `<li>${esc(CH[id].t)} <span class="meta">· ${esc(CH[id].b)}</span></li>`), "None saved.")}
      ${sec(`Project sparks saved (${p.sparks.length})`, p.sparks.map(x => `<li>${esc(x.t)}</li>`), "None saved.")}
      ${sec(`Books on their shelf (${p.saved.length})`, p.saved.map(id => `<li>${esc(books[id] || id)}</li>`), "None saved.")}
      ${sec(`Books they want to read (${p.want.length})`, p.want.map(id => `<li>${esc(books[id] || id)}</li>`), "None yet.")}
    </div>` : `<p class="empty">This student is outside your grade band, so their saved things aren't shown. Their AI conversations are below.</p>`) +
    `<section style="display:flex;flex-direction:column;gap:10px"><h2>AI Coach conversations (${p.chats.length})</h2>${p.chats.length ? `<table class="tbl"><thead><tr><th>Student</th><th>About</th><th class="num">Messages</th><th>Flag</th><th>Last</th><th></th></tr></thead><tbody>${p.chats.sort((a, b) => b.updated - a.updated).map(chatRow).join("")}</tbody></table>` : `<p class="empty">No conversations.</p>`}</section>`;
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
      return `<div class="bub ${t.role === "student" ? "student" : "coach"}${flag && SEV.indexOf(t.severity) >= 2 ? " flag" + (t.severity === "urgent" ? " urgent" : "") : ""}"><span class="who">${t.role === "student" ? esc(p.name || "Student") : "AI Coach"} · ${esc(when(t.at))}${tags ? " · " + tags : ""}</span>${esc(t.text)}</div>`;
    }).join("") || '<p class="empty">No messages.</p>'}</div>`;
}

async function route() {
  const app = $("#app");
  if (!S.loaded) return;
  const [v, arg] = location.hash.slice(1).split("=");
  try {
    if (v === "s") app.innerHTML = await vStudent(decodeURIComponent(arg || ""));
    else if (v === "c") app.innerHTML = await vChat(arg || "");
    else if (v === "students") app.innerHTML = vStudents();
    else if (v === "chats") app.innerHTML = vChats();
    else app.innerHTML = vAlerts();
  } catch (e) { app.innerHTML = `<p class="empty">Couldn't load this: ${esc(e.message)}</p>`; }
}
async function start(r) {
  const app = $("#app"), u = window.wlFirebase && window.wlFirebase.auth.currentUser;
  if (!u) { app.innerHTML = head("Students") + `<p class="empty">Sign in with your Wilderland staff account. <button class="btn" type="button" data-wl-signin>Sign in</button></p>`; return; }
  if (!r || r.role !== "staff" || !String(r.email || u.email).toLowerCase().endsWith("@wilderland.academy")) { app.innerHTML = head("Students") + `<p class="empty">This page is for Wilderland staff.</p>`; return; }
  S.me = key(u.email); S.admin = ADMINS.includes(S.me);
  try { await loadAll(); }
  catch (e) { app.innerHTML = head("Students") + `<p class="empty">${e.status === 403 ? "The database rules for the AI Coach aren't published yet, or your account isn't on the staff list. Tell Alex." : "Couldn't load. Check your connection and reload."}</p>`; return; }
  route();
}

addEventListener("hashchange", () => { route(); scrollTo(0, 0); });
document.addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.band) { S.band = t.dataset.band; route(); return; }
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
