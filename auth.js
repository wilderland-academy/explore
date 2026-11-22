// Wilderland Explore: one Google sign-in shared by every site under explore.wilderland.academy.
// Each page includes:  <script type="module" src="/auth.js" data-site="books"></script>
// The page keeps using localStorage exactly as before. This file copies the listed keys to the student's
// own record in Firestore (students/{uid}/sites/{site}) and brings them back on any Chromebook they sign in on.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const CONFIG = {
  apiKey: "AIzaSyB_JSjvnUlSCnx4BIwRTLicHllmCgF2iOM",
  authDomain: "wilderland-df15e.firebaseapp.com",
  projectId: "wilderland-df15e",
  storageBucket: "wilderland-df15e.firebasestorage.app",
  messagingSenderId: "310046559783",
  appId: "1:310046559783:web:66af8f02d96d315ab14802"
};
const DOMAIN = "wilderland.academy";
// Outside guests (Ian) who may open the staff Field Guide, the Guides hub and the Parent Communication coach only (no student site). Keep in step with worker.js, firestore.rules and fieldguide/app.js.
const GUESTS = ["ian@silverlineventures.com", "online@bodyform.com", "ian.silverberg@gmail.com"];
const GUEST_SITES = ["fieldguide", "guides", "parentcomms", "history", "labbuilder"];
// Admins are staff without a staff/{email} record. Keep in step with fieldguide/app.js, lifeskills/app.js and firestore.rules.
const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
// Pages that only need to know who is visiting (the front door, the Parents pages, the Students home). Here nobody is
// ever signed out, so a parent still confirming their email isn't bounced, and no sign-in chip appears if the bar says data-auth="off".
const SOFT_SITES = ["home", "parents", "students"];
// Testers, the linked test accounts and each guide's band are listed once, in /wlnav.js (loaded before this file).
const PEOPLE = window.WLPeople || { TESTERS: [], STAFF_BANDS: {}, TEST: {} };
const TESTERS = PEOPLE.TESTERS, TEST = PEOPLE.TEST, STAFF_BANDS = PEOPLE.STAFF_BANDS;
// Test view: a tester who switched (in the bar) to the test guide, student or parent on this device. Only honoured
// for the tester who set it; anyone else signing in on this device clears it.
function storedView() { try { const v = JSON.parse(localStorage.getItem("wl-viewas") || "null"); return v && ["guide", "student", "parent"].includes(v.as) && v.by ? v : null; } catch (e) { return null; } }
function viewFor(u) {
  const v = storedView(), em = ((u && u.email) || "").toLowerCase();
  if (!v || !u || !u.emailVerified || v.by !== em || !TESTERS.includes(em)) return null;
  return { as: v.as, band: ["K–1", "2–4", "5–8"].includes(v.band) ? v.band : "2–4", by: em };
}
const ANY_ACCOUNT_PATH = /^\/(parents\/|challenges\/parents\.html|$)/.test(location.pathname);
const SITES = [["Books", "/books/"], ["Challenges", "/challenges/"], ["My progress", "/challenges/#progress"], ["Projects", "/projects/"]];

const me = document.querySelector('script[src$="auth.js"]');
const SITE = (me && me.dataset.site) || "";
const ANY_ACCOUNT = ANY_ACCOUNT_PATH || SITE === "parents" || SITE === "home" || GUEST_SITES.includes(SITE);
// What each site keeps in the browser. Add a line here when a new site joins.
const ALLKEYS = { books: ["lantern-stacks"], challenges: ["wl-picks", "wl-band"], projects: ["atlas-sparks", "atlas-me"], store: ["wl-store"] };
// In a test view only the test student's things are kept (in their own place, testStudents/{uid}/sites/{site}).
const VIEW0 = storedView();
const KEYS = VIEW0 && VIEW0.as !== "student" ? [] : ALLKEYS[SITE] || [];
// Clear every site's saved things from this Chromebook (on sign-out, here or on another site).
function forgetDevice() { applying = true; origRemove.call(localStorage, "wl-role"); Object.entries(ALLKEYS).forEach(([s, ks]) => { ks.forEach(k => origRemove.call(localStorage, k)); origRemove.call(localStorage, "wl-linked-" + s); }); applying = false; }
let view = null;
const DOC = uid => `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${view ? "testStudents" : "students"}/${uid}/sites/${SITE}`;

const app = initializeApp(CONFIG);
const auth = getAuth(app);
// Other scripts on the page (the Suggestion Box) reuse this app and sign-in instead of starting their own.
window.wlFirebase = { app, auth, config: CONFIG };
const announce = u => document.dispatchEvent(new CustomEvent("wl-auth", { detail: u }));
let user = null, pushTimer = null, applying = false;
// A parent signed in with a confirmed non-school email (for /lifeskills/). They stay signed in here but get no student features.
let family = null;

// ---------- reading and writing this site's keys ----------
const readLocal = () => { const o = {}; KEYS.forEach(k => { const v = localStorage.getItem(k); if (v != null) o[k] = v; }); return o; };
const isObj = v => v && typeof v === "object" && !Array.isArray(v);
// Two copies of the same thing (e.g. a shelf saved on two Chromebooks before signing in): keep both.
// Lists are combined; objects are merged; for single values the saved account copy wins.
function merge(remote, local) {
  if (Array.isArray(remote) && Array.isArray(local)) return [...remote, ...local.filter(x => !remote.some(r => JSON.stringify(r) === JSON.stringify(x)))];
  if (isObj(remote) && isObj(local)) { const o = { ...local }; for (const k in remote) o[k] = k in local ? merge(remote[k], local[k]) : remote[k]; return o; }
  return remote === undefined ? local : remote;
}
async function token() { return user ? user.getIdToken() : null; }
async function pull() {
  const r = await fetch(DOC(user.uid), { headers: { Authorization: "Bearer " + await token() } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("read " + r.status);
  const j = await r.json();
  try { return JSON.parse(j.fields.data.stringValue); } catch (e) { return null; }
}
async function push() {
  if (!user || !SITE || !KEYS.length) return;
  const body = { fields: { data: { stringValue: JSON.stringify(readLocal()) }, updated: { timestampValue: new Date().toISOString() }, email: { stringValue: view ? TEST.student : user.email || "" }, ...(view ? { test: { booleanValue: true } } : {}) } };
  const r = await fetch(DOC(user.uid), { method: "PATCH", headers: { Authorization: "Bearer " + await token(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
  setState(r.ok ? "saved" : "error");
}
const schedulePush = () => { if (!user) return; setState("saving"); clearTimeout(pushTimer); pushTimer = setTimeout(push, 1200); };

// Notice every write the page makes to one of its keys, without changing the page's own code.
const origSet = Storage.prototype.setItem, origRemove = Storage.prototype.removeItem;
Storage.prototype.setItem = function (k, v) { origSet.call(this, k, v); if (this === localStorage && KEYS.includes(k) && !applying) schedulePush(); };
Storage.prototype.removeItem = function (k) { origRemove.call(this, k); if (this === localStorage && KEYS.includes(k) && !applying) schedulePush(); };
addEventListener("pagehide", () => { if (pushTimer) { clearTimeout(pushTimer); push(); } });

// First sign-in on a Chromebook: combine what is already here with the account, so nothing saved before
// accounts existed is lost. After that, the account copy is the true one (so a book removed on one
// Chromebook doesn't come back from another).
const LINK = () => "wl-linked-" + SITE;
const LINKID = () => user.uid + (view ? "#test" : "");
async function syncOnSignIn() {
  if (!SITE || !KEYS.length) return;
  setState("saving");
  try {
    const remote = await pull(), local = readLocal();
    const firstHere = localStorage.getItem(LINK()) !== LINKID();
    if (!remote) { await push(); origSet.call(localStorage, LINK(), LINKID()); return; }
    const next = {};
    if (firstHere) {
      new Set([...Object.keys(remote), ...Object.keys(local)]).forEach(k => {
        let r, l; try { r = remote[k] != null ? JSON.parse(remote[k]) : undefined; } catch (e) { r = remote[k]; }
        try { l = local[k] != null ? JSON.parse(local[k]) : undefined; } catch (e) { l = local[k]; }
        const m = merge(r, l); next[k] = typeof m === "string" ? m : JSON.stringify(m);
      });
    } else Object.assign(next, remote);
    const changed = KEYS.some(k => (next[k] ?? null) !== (local[k] ?? null));
    applying = true;
    KEYS.forEach(k => { if (next[k] == null) origRemove.call(localStorage, k); else origSet.call(localStorage, k, next[k]); });
    origSet.call(localStorage, LINK(), LINKID());
    applying = false;
    if (KEYS.some(k => (next[k] ?? null) !== (remote[k] ?? null))) await push(); else setState("saved");
    // The page read localStorage when it loaded, so reload once to show the student's saved things.
    if (changed) location.reload();
  } catch (e) { applying = false; console.warn("Wilderland sync:", e); setState("error"); }
}

// ---------- the sign-in chip ----------
const css = `
.wla{position:relative;font:500 14px/1 Inter,"Uncut Sans",system-ui,sans-serif;z-index:50}
.wla.float{position:fixed;right:14px;bottom:14px}
.wla>button{white-space:nowrap;display:inline-flex;align-items:center;gap:8px;border:0;cursor:pointer;border-radius:999px;padding:7px 12px 7px 7px;background:#d5f367;color:#0b2b20;font:inherit;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,.25)}
.wla>button.out{padding:9px 14px}
.wla .av{width:24px;height:24px;border-radius:50%;background:#015640;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700;overflow:hidden}
.wla .av img{width:100%;height:100%;object-fit:cover}
.wla .st{width:8px;height:8px;border-radius:50%;background:#00b451}
.wla .st.saving{background:#e9a23b}.wla .st.error{background:#e5484d}
.wla .menu{position:absolute;right:0;top:calc(100% + 8px);min-width:230px;background:#0f231c;color:#f6f8ea;border:1px solid #28493d;border-radius:12px;padding:10px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.wla.float .menu{top:auto;bottom:calc(100% + 8px)}
.wla .menu p{margin:2px 6px 10px;font-size:12.5px;line-height:1.4;color:#a9bbb0;font-weight:400}
.wla .menu a,.wla .menu button{display:block;width:100%;text-align:left;padding:9px 8px;border-radius:8px;color:#f6f8ea;text-decoration:none;background:none;border:0;font:inherit;cursor:pointer}
.wla .menu a:hover,.wla .menu button:hover{background:rgba(255,255,255,.07)}
.wla .menu a.here{color:#d5f367}
.wla .menu hr{border:0;border-top:1px solid #28493d;margin:6px 0}
.wla-msg{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:min(92vw,460px);background:#0f231c;color:#f6f8ea;border:1px solid #e9a23b;border-radius:12px;padding:12px 14px;font:400 14px/1.45 Inter,system-ui,sans-serif;z-index:60;box-shadow:0 10px 30px rgba(0,0,0,.45)}`;
const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);
const host = document.createElement("div"); host.className = "wla";
let state = "saved", open = false;
function setState(s) { state = s; const d = host.querySelector(".st"); if (d) d.className = "st " + s; }
function msg(t) { const m = document.createElement("div"); m.className = "wla-msg"; m.textContent = t; document.body.appendChild(m); setTimeout(() => m.remove(), 7000); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function render() {
  const here = location.pathname;
  const links = SITES.map(([n, p]) => `<a href="${p}" class="${here.startsWith(p) ? "here" : ""}">${n}</a>`).join("");
  if (!user && family) {
    host.innerHTML = `<button type="button" data-wla="menu" aria-expanded="${open}"><span class="av">${view ? "🧪" : esc((family.email || "?")[0].toUpperCase())}</span><span>${view ? "Test parent" : "Parent"}</span></button>
    ${open ? `<div class="menu"><p>${view ? `Test parent (you're ${esc(family.email)}).` : `Signed in as ${esc(family.email)}, a family account.`}</p><a href="/parents/lifeskills/">Life Skills tracker</a><a href="/challenges/parents.html">Passing off at home</a><a href="/parents/">Parents home</a><hr><button type="button" data-wla="out">Sign out</button></div>` : ""}`;
    return;
  }
  if (!user) {
    host.innerHTML = `<button class="out" type="button" data-wla="in">Sign in</button>`;
    return;
  }
  const first = view ? (view.as === "guide" ? "Test guide" : "Test student") : (user.displayName || user.email || "?").trim();
  host.innerHTML = `<button type="button" data-wla="menu" aria-expanded="${open}"><span class="av">${view ? "🧪" : user.photoURL ? `<img src="${esc(user.photoURL)}" alt="" referrerpolicy="no-referrer">` : esc(first[0].toUpperCase())}</span><span>${esc(view ? first : first.split(" ")[0])}</span><span class="st ${state}" title="Saved to your account"></span></button>
  ${open ? `<div class="menu"><p>Signed in as ${esc(user.email)}. What you save here follows you to any Chromebook.</p>${links}<hr><button type="button" data-wla="out">Sign out</button></div>` : ""}`;
}
host.addEventListener("click", async e => {
  const b = e.target.closest("[data-wla]"); if (!b) return;
  if (b.dataset.wla === "menu") { open = !open; render(); return; }
  if (b.dataset.wla === "out") {
    open = false;
    if (pushTimer) { clearTimeout(pushTimer); await push(); }
    await signOut(auth);
    // Leave nothing behind for the next person on this Chromebook (a test view ends too).
    forgetDevice(); origRemove.call(localStorage, "wl-viewas");
    location.reload(); return;
  }
  if (b.dataset.wla === "in") wlSignIn();
});
async function wlSignIn() {
  // Parents (and outside guests) use their own Google accounts, so the Parents pages, the front door and the pages guests
  // may open offer any Google account. Student and staff pages point Google at the school's accounts.
  const p = new GoogleAuthProvider(); p.setCustomParameters(ANY_ACCOUNT ? { prompt: "select_account" } : { hd: DOMAIN, prompt: "select_account" });
  try { await signInWithPopup(auth, p); }
  catch (err) { if (err && err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") msg("Sign-in didn't work. Make sure pop-ups are allowed" + (ANY_ACCOUNT ? "." : ", and use your @" + DOMAIN + " account.")); }
}
window.wlSignIn = wlSignIn;
// Pages marked <body data-gated> show their content only to signed-in school accounts.
window.wlAuthState = { ready: false, user: null };
function gate(u) {
  window.wlAuthState = { ready: true, user: u };
  const b = document.body; if (!b) return;
  b.classList.remove("wl-pending"); b.classList.toggle("wl-in", !!u); b.classList.toggle("wl-out", !u);
}
document.addEventListener("click", e => { if (e.target.closest("[data-wl-signin]")) { e.preventDefault(); wlSignIn(); } });
document.addEventListener("click", e => { if (open && !host.contains(e.target)) { open = false; render(); } });

function mount() {
  // Pages whose bar has no sign-in slot (data-auth="off") only need the role: no chip.
  if (document.querySelector('[data-wlnav][data-auth="off"]')) return;
  const slot = document.querySelector("[data-wl-auth]");
  if (slot) slot.appendChild(host); else { host.classList.add("float"); document.body.appendChild(host); }
  render();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();


// ---------- who is visiting: staff, student (and their band), or parent ----------
// Announced as a "wl-role" event that /wlnav.js uses for the site switcher and to keep students on the Students site,
// and that a site can use to narrow what it shows (Challenges shows a student only their own grade band).
// Remembered on this device as "wl-role" so the next page can show it at once; cleared on sign-out.
const FS = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents`;
let roleSeq = 0;
function sendRole(r) {
  window.wlRole = r;
  try { if (r) origSet.call(localStorage, "wl-role", JSON.stringify({ e: r.email, r: r.role, b: r.band || null, s: r.sid || null, bs: r.bands || null, t: r.test || null, x: r.real || null })); else origRemove.call(localStorage, "wl-role"); } catch (e) { }
  document.dispatchEvent(new CustomEvent("wl-role", { detail: r }));
}
// Firestore REST values, for the few writes made here.
const fv = v => Array.isArray(v) ? { arrayValue: { values: v.map(fv) } } : typeof v === "boolean" ? { booleanValue: v } : typeof v === "number" ? { integerValue: String(v) } : { stringValue: String(v) };
async function upsert(H, path, data) {
  const mask = Object.keys(data).map(k => "updateMask.fieldPaths=" + encodeURIComponent(k)).join("&");
  const r = await fetch(`${FS}/${path}?${mask}`, { method: "PATCH", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, fv(v)])) }) });
  if (!r.ok) throw new Error("test account " + path + " " + r.status);
}
// The three linked test accounts, made (or moved to the chosen band) the first time a tester switches on this visit.
// Only testers can read or write them (firestore.rules), and every page leaves them out for everyone else.
async function ensureTest(u, band) {
  try { if (sessionStorage.getItem("wl-test-ready") === band) return; } catch (e) { }
  const H = { Authorization: "Bearer " + await u.getIdToken() };
  await upsert(H, `lsStudents/${TEST.sid}`, { name: TEST.name, band, email: TEST.student, guide: TEST.guide, parents: [TEST.parent], test: true });
  const b = await fetch(`${FS}/lsBoard/${TEST.sid}`, { headers: H });
  await upsert(H, `lsBoard/${TEST.sid}`, b.ok ? { name: "Test S.", band, test: true } : { name: "Test S.", band, working: [], passed: [], credits: 0, test: true, updated: Date.now() });
  await upsert(H, `lsParents/${encodeURIComponent(TEST.parent)}`, { email: TEST.parent, children: [TEST.sid], bands: [band], test: true, updated: Date.now() });
  try { sessionStorage.setItem("wl-test-ready", band); } catch (e) { }
}
async function findRole(u, em) {
  if (!u.emailVerified) return null;
  if (view) {
    try { await ensureTest(u, view.band); } catch (e) { console.warn("Wilderland test accounts:", e); }
    const t = { test: view.as, real: em, band: view.band };
    if (view.as === "student") return { ...t, role: "student", sid: TEST.sid, email: TEST.student };
    if (view.as === "parent") return { ...t, role: "parent", sid: null, bands: [view.band], email: TEST.parent };
    return { ...t, role: "staff", sid: null, email: TEST.guide };
  }
  // Guides start every band choice on their own band; admins and guests without one start on "All" (or 5–8).
  if (GUESTS.includes(em)) return { role: "staff", band: STAFF_BANDS[em] || null, sid: null };
  const H = { Authorization: "Bearer " + await u.getIdToken() };
  if (!em.endsWith("@" + DOMAIN)) {
    // A parent: their children's bands (lsParents, kept by the Student Roster). The youngest child's band comes first.
    let bands = [];
    try { const p = await fetch(`${FS}/lsParents/${encodeURIComponent(em)}`, { headers: H }); if (p.ok) { const f = (await p.json()).fields || {}; bands = ((f.bands || {}).arrayValue || {}).values ? f.bands.arrayValue.values.map(x => x.stringValue) : []; } } catch (e) { }
    bands = ["K–1", "2–4", "5–8"].filter(b => bands.includes(b));
    return { role: "parent", band: bands[0] || null, bands, sid: null };
  }
  if (ADMINS.includes(em)) return { role: "staff", band: STAFF_BANDS[em] || null, sid: null };
  const st = await fetch(`${FS}/staff/${encodeURIComponent(em)}`, { headers: H });
  if (st.ok) return { role: "staff", band: STAFF_BANDS[em] || null, sid: null };
  if (st.status !== 404) throw new Error("staff " + st.status);
  // A student: their band comes from their Life Skills tracker record (lsStudents, matched by school email).
  let band = null, sid = null;
  try {
    const q = await fetch(`${FS}:runQuery`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "lsStudents" }], where: { fieldFilter: { field: { fieldPath: "email" }, op: "EQUAL", value: { stringValue: em } } }, limit: 5 } }) });
    if (q.ok) {
      const docs = (await q.json()).map(x => x.document).filter(Boolean);
      const bands = [...new Set(docs.map(d => d.fields && d.fields.band && d.fields.band.stringValue).filter(Boolean))];
      if (bands.length === 1) band = bands[0];
      // Their tracker record, so Challenges can show their own progress.
      if (docs.length === 1) sid = docs[0].name.split("/").pop();
    }
  } catch (e) { /* no band: the student sees every band until a guide adds them to the tracker */ }
  return { role: "student", band, sid };
}
// Staff on the Guides site: how many Mr. Fox alerts are open, for the badge on the "Students" tab.
async function countAlerts(u) {
  if (!document.querySelector('[data-wlnav="guides"]') || location.pathname.startsWith("/guides/roster/")) return;
  try {
    const r = await fetch(`${FS}:runQuery`, { method: "POST", headers: { Authorization: "Bearer " + await u.getIdToken(), "Content-Type": "application/json" },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "aiAlerts" }], where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "open" } } }, limit: 100 } }) });
    if (!r.ok) return;
    const docs = (await r.json()).filter(x => x.document && !!(x.document.fields.test || {}).booleanValue === !!view);
    document.dispatchEvent(new CustomEvent("wl-alerts", { detail: { open: docs.length, urgent: docs.filter(x => (x.document.fields.severity || {}).stringValue === "urgent").length } }));
  } catch (e) { /* the badge is a convenience; the Students page always shows the alerts */ }
}
async function decideRole(u) {
  const my = ++roleSeq;
  if (!u) { sendRole(null); return; }
  const em = (u.email || "").toLowerCase();
  // Same account (and same test view) as last time on this device: show the remembered role now, then check it.
  try { const c = JSON.parse(localStorage.getItem("wl-role") || "null"); if (c && (c.x || c.e) === em && (c.t || null) === (view ? view.as : null)) sendRole({ email: c.e, role: c.r, band: c.b || null, sid: c.s || null, ...(c.bs ? { bands: c.bs } : {}), ...(c.t ? { test: c.t, real: c.x } : {}) }); } catch (e) { }
  try {
    const r = await findRole(u, em);
    if (my !== roleSeq) return;
    const was = window.wlRole;
    const next = r ? { email: em, ...r } : null;
    if (next && !next.bands) delete next.bands;
    if (JSON.stringify(was || null) !== JSON.stringify(next)) sendRole(next);
    if (next && next.role === "staff" && (em.endsWith("@" + DOMAIN) || view)) countAlerts(u);
  } catch (e) { console.warn("Wilderland role:", e); }
}
onAuthStateChanged(auth, async u => {
  const em = ((u && u.email) || "").toLowerCase();
  family = null;
  view = viewFor(u);
  // Someone else signed in on this device: a test view left behind by a tester ends.
  if (u && !view && storedView()) origRemove.call(localStorage, "wl-viewas");
  decideRole(u);
  if (view) {
    // A tester in a test view may open every site, as that test account. The test parent is a family account.
    if (view.as === "parent") { family = u; user = null; render(); gate(null); announce(null); return; }
    const wasT = user; user = u; render(); gate(u); announce(u);
    if (!wasT && view.as === "student") syncOnSignIn();
    return;
  }
  // A confirmed family account: keep it signed in (so the tracker stays open) but treat this page as signed out.
  if (u && (u.emailVerified || SOFT_SITES.includes(SITE)) && !em.endsWith("@" + DOMAIN) && !((GUEST_SITES.includes(SITE) || SOFT_SITES.includes(SITE)) && u.emailVerified && GUESTS.includes(em))) {
    family = u; user = null; render(); gate(null); announce(null); return;
  }
  if (u && !SOFT_SITES.includes(SITE) && !((em.endsWith("@" + DOMAIN) && u.emailVerified) || (GUEST_SITES.includes(SITE) && u.emailVerified && GUESTS.includes(em)))) {
    await signOut(auth); msg("Please sign in with your @" + DOMAIN + " school account."); user = null; render(); gate(null); announce(null); return;
  }
  // Signed out (maybe on another site): don't leave the last student's things for the next person.
  if (!u && Object.keys(ALLKEYS).some(k => localStorage.getItem("wl-linked-" + k))) { forgetDevice(); location.reload(); return; }
  const was = user; user = u; render();
  gate(u); announce(u);
  if (u && !was) syncOnSignIn();
});
