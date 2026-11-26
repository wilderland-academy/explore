// Life Skills Tracker (explore.wilderland.academy/lifeskills/)
// Three views on one page, picked by who signs in:
//   guides and admins (school account on the staff list): band overview (passed or saved), Validate (one student, or a
//     group on one challenge, Lab challenges included), the Labs
//     schedule. Students and parents are added on the Student Roster (/guides/roster/).
//   students (school account a guide has added): their own record, and the crew board
//   parents (any verified email a guide has matched to a child): their own children only, and the Labs schedule
// Data (Firestore, rules in /firestore.rules):
//   lsStudents/{sid}            name, band, grade, email, guide, parents[], celebrated   (private)
//   lsStudents/{sid}/entries/*  one pass or not yet each                                 (private)
//   lsBoard/{sid}               short name, band, working[], passed[]                     (all school accounts)
//   labs/{id}                   the Life Skill Labs schedule                              (staff; linked parents)
//   lsShared/{sid}/sites/{site} copies of what the student saved on books, challenges,    (staff; the student; linked parents)
//                               goals and projects, written by /auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  signOut, onAuthStateChanged, connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, collectionGroup, query, where, writeBatch, connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";

const CONFIG = {
  apiKey: "AIzaSyB_JSjvnUlSCnx4BIwRTLicHllmCgF2iOM",
  // In the installed app (Add to Home Screen), this site's own /__/auth/ helper, for same-page sign-in: see /wlnav.js.
  authDomain: window.WLAuthDomain ? window.WLAuthDomain() : "wilderland-df15e.firebaseapp.com",
  projectId: "wilderland-df15e",
  storageBucket: "wilderland-df15e.firebasestorage.app",
  messagingSenderId: "310046559783",
  appId: "1:310046559783:web:66af8f02d96d315ab14802"
};
const DOMAIN = "@wilderland.academy";
// Keep in step with firestore.rules, auth.js and fieldguide/app.js.
const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
// Testers, the linked test accounts and each guide's band: one list, in /wlnav.js.
const PEOPLE = window.WLPeople || { TESTERS: [], STAFF_BANDS: {}, TEST: {} };
const TESTERS = PEOPLE.TESTERS, TEST = PEOPLE.TEST, STAFF_BANDS = PEOPLE.STAFF_BANDS;
// A tester's test view on this device (set from the bar). Honoured only for the tester who set it.
function storedView() { try { const v = JSON.parse(localStorage.getItem("wl-viewas") || "null"); return v && ["guide", "student", "parent"].includes(v.as) && v.by ? v : null; } catch (e) { return null; } }
const EMU = location.hostname === "localhost" && new URLSearchParams(location.search).has("emu");
// The same tracker runs in all three Explore sites, each with its own top bar: students at /lifeskills/,
// guides at /guides/lifeskills/, parents at /parents/lifeskills/. route() sends each person to their own site's copy.
// Students no longer use the tracker pages: their progress and crew board are inside Challenges (/challenges/#progress).
const HOMES = { staff: "/guides/lifeskills/", student: "/challenges/", parent: "/parents/lifeskills/" };
const PATH = location.pathname.startsWith("/guides/lifeskills") ? HOMES.staff : location.pathname.startsWith("/parents/lifeskills") ? HOMES.parent : "/lifeskills/";
const BASE = PATH + (EMU ? "?emu" : "");
const HOME = location.origin + BASE;
const LINK_KEY = "wl-ls-link-email";
// Each site's own copy of the challenge map, for challenge links.
const CHMAP = PATH === HOMES.staff ? "/guides/challenges/" : PATH === HOMES.parent ? "/parents/challenges/" : "/challenges/";

const app = initializeApp(CONFIG);
const auth = getAuth(app);
const APPMODE = !!(window.wlSamePageSignIn && window.wlSamePageSignIn());
if (APPMODE) getRedirectResult(auth).catch(e => { console.warn("Life Skills sign-in:", e); setTimeout(() => toast("Sign-in didn't finish (" + (e && e.code || "error") + "). Try again.", "err"), 0); });
const db = getFirestore(app);
// The tracker pages don't load /auth.js: share this sign-in with /notify.js (the 🔔 in the top bar).
if (!window.wlFirebase) window.wlFirebase = { app, auth, config: CONFIG };
// Local testing only: on localhost, talk to the Firebase emulators instead of the real project.
if (EMU) { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); connectFirestoreEmulator(db, "127.0.0.1", 8085); }

// ---------- challenge data (from /challenges/data.js) ----------
const W = window.WL || { skills: [], comps: {}, ch: [] };
const BYID = {}; W.ch.forEach(c => BYID[c.id] = c);
const SKILL = {}; W.skills.forEach(s => SKILL[s.k] = s);
const SHORT = { EN: "Energy", SG: "Self-Gov.", CG: "Grit", AI: "Adapt.", VC: "Value", SP: "Story", FE: "Fellowship", NL: "Nature" };
// Challenges a Lab introduces that aren't on the challenge map. A Lab keeps them in lab.custom ([{ id: "LB-…", t, k, w }]);
// they join BYID so every list here can use them. Entries for them also carry the title and life skill (ct, k), so a
// family or student who can't read the Lab still sees what was passed.
const CUSTOM = {};
function addCustom(c, lab) {
  if (!c || !c.id || (BYID[c.id] && !BYID[c.id].custom) || !SKILL[c.k]) return;
  const bands = lab ? (lab.bands || []) : (c.bands || []);
  BYID[c.id] = CUSTOM[c.id] = { id: c.id, t: c.t || c.id, k: c.k, w: c.w || "", cr: 1, b: bands[0] || "", bands, custom: true,
    lab: lab ? lab.id : c.lab || "", labTitle: lab ? lab.title : c.labTitle || "" };
}
const skillOf = cid => { const c = BYID[cid]; return !c ? null : c.custom ? SKILL[c.k] : SKILL[(W.comps[c.c] || {}).k]; };
const colOf = cid => (skillOf(cid) || {}).col || "#4d4d51";
const BANDS = ["K–1", "2–4", "5–8"];
const RANKS = {
  "2–4": [[4, "Fox"], [16, "Badger"], [32, "Elk"], [48, "Moose"]],
  "5–8": [[4, "Tracker"], [16, "Pathfinder"], [32, "Ranger"], [48, "Vanguard"], [64, "Trailblazer"]]
};
// Every band, K–1 included, aims for 2 per life skill a year (16 in all). K–1 challenges are always part of a Life Skill Lab.
const goalFor = band => 2;

// ---------- small helpers ----------
const $ = s => document.querySelector(s);
function h(tag, a, kids) {
  const e = document.createElement(tag);
  for (const k in (a || {})) {
    const v = a[k]; if (v == null || v === false) continue;
    if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.entries(v).forEach(([p, x]) => p.startsWith("--") ? e.style.setProperty(p, x) : e.style[p] = x);
    else e.setAttribute(k, v === true ? "" : v);
  }
  (Array.isArray(kids) ? kids : kids == null ? [] : [kids]).flat().forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
  return e;
}
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const yearStart = () => { const d = new Date(), y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return y + "-08-01"; };
const fmt = iso => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); };
const daysAgo = iso => iso ? Math.floor((Date.now() - new Date(iso + "T12:00:00").getTime()) / 864e5) : Infinity;
const shortName = n => { const p = String(n || "").trim().split(/\s+/); return p.length > 1 ? p[0] + " " + p[p.length - 1][0] + "." : p[0] || ""; };
const firstName = n => String(n || "").trim().split(/\s+/)[0] || "";
const emails = s => [...new Set(String(s || "").split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(Boolean))];
// A student's guides: the ones named on their record, otherwise their band's guides (WLPeople.STAFF_BANDS in /wlnav.js).
const guideName = g => g === TEST.guide ? "Test Guide" : g.split("@")[0].replace(/^./, x => x.toUpperCase());
const bandGuides = band => Object.entries((window.WLPeople || {}).STAFF_BANDS || {}).filter(([, b]) => b === band).map(([e]) => e);
const guidesOf = s => { const g = emails(s && s.guide); return g.length ? g : s && s.test ? [TEST.guide] : bandGuides(s && s.band); };
const orList = xs => xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " or " + xs[xs.length - 1];
const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const ordinal = n => n + (["th", "st", "nd", "rd"][((n % 100) - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
let toastT;
function toast(t) { let m = $(".toast"); if (!m) { m = h("div", { class: "toast", role: "status" }); document.body.append(m); } m.textContent = t; clearTimeout(toastT); toastT = setTimeout(() => m.remove(), 6000); }
const errText = e => {
  const c = (e && e.code) || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "That email and password don't match. Try again, or reset your password.";
  if (c.includes("email-already-in-use")) return "There's already an account with that email. Sign in instead, or reset your password.";
  if (c.includes("weak-password")) return "Use a password of at least 8 characters.";
  if (c.includes("invalid-email")) return "That email address doesn't look right.";
  if (c.includes("too-many-requests")) return "Too many tries. Wait a few minutes, then try again.";
  if (c.includes("operation-not-allowed")) return "This sign-in method isn't turned on yet. Please tell the school office.";
  if (c.includes("popup")) return "The sign-in window was blocked or closed. Allow pop-ups and try again.";
  if (c.includes("expired") || c.includes("invalid-action-code")) return "That link has expired or was already used. Ask for a new one.";
  if (c.includes("permission-denied")) return "You don't have access to that.";
  return "Something went wrong. Please try again.";
};

// ---------- state ----------
// test: the tester's test view ("guide" | "student" | "parent"), real: the tester's own email (S.email is the test account's).
const S = { user: null, email: "", role: null, admin: false, students: {}, entries: {}, boards: {}, mine: [], saved: {}, goals: {}, books: {}, sparks: {}, labs: null, parentBands: [], test: null, real: "", testBand: "" };
// The band every band choice starts on: a guide's own band, a parent's (youngest) child's, the test accounts' band in a
// test view. Admins and guests without a band start on All.
function myBand() {
  if (S.test) return S.testBand;
  if (S.role === "staff") return STAFF_BANDS[S.email] || null;
  if (S.role === "parent") return myBands()[0] || null;
  if (S.role === "student") { const s = S.students[S.mine[0]]; return s ? s.band : null; }
  return null;
}
let bandsSet = false;
function setBandDefaults() {
  if (bandsSet) return; bandsSet = true;
  const b = myBand();
  ovBand = b || "All"; calBand = b || "All"; boardBand = null; valBand = b || "All";
}

// ---------- records: everything a view needs, worked out from a student's entries ----------
function summary(sid) {
  const s = S.students[sid] || S.boards[sid] || {}, list = S.entries[sid] || [];
  const ys = yearStart();
  const byC = {};
  list.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.created || 0) - (b.created || 0)).forEach(e => { (byC[e.cid] = byC[e.cid] || []).push(e); });
  const passes = []; const notyets = [];
  Object.values(byC).forEach(arr => {
    const p = arr.find(e => e.result === "pass");
    if (p) passes.push(p); else notyets.push(arr[arr.length - 1]);
  });
  passes.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const credit = e => e.credits || (BYID[e.cid] || {}).cr || 1;
  const trail = passes.reduce((n, e) => n + credit(e), 0);
  const per = {}; let year = 0;
  passes.filter(e => (e.date || "") >= ys).forEach(e => { const k = (skillOf(e.cid) || {}).k; if (k) { per[k] = (per[k] || 0) + credit(e); year += credit(e); } });
  const ranks = RANKS[s.band] || [];
  const rank = ranks.filter(r => r[0] <= trail).pop();
  const nextRank = ranks.find(r => r[0] > trail);
  const milestone = Math.floor(trail / 4) * 4;
  return { passes, notyets, trail, per, year, rank: rank ? rank[1] : "", nextRank, milestone, newMilestone: milestone > 0 && milestone > (s.celebrated || 0), last: passes[0] ? passes[0].date : "" };
}

// ---------- data loading ----------
async function loadEntries(sid) {
  const snap = await getDocs(collection(db, "lsStudents", sid, "entries"));
  S.entries[sid] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  S.entries[sid].forEach(e => { if (e.ct && !BYID[e.cid]) addCustom({ id: e.cid, t: e.ct, k: e.k, lab: e.lab || "", labTitle: e.labTitle || "" }); });
}
async function loadAll() {
  S.students = {}; S.entries = {}; S.boards = {}; S.mine = []; S.saved = {}; S.goals = {}; S.books = {}; S.sparks = {};
  // The test accounts are only for a test view, and a test view only sees them (so nothing real is changed).
  const keep = x => !!x.test === !!S.test;
  const testOnly = c => S.test ? query(collection(db, c), where("test", "==", true)) : collection(db, c);
  if (S.role === "staff") {
    // The test guide works with the test band's real students (view only: see viewOnly) plus the test student, like a
    // real guide of that band would.
    const staffKeep = x => S.test ? !!x.test || x.band === S.testBand : !x.test;
    // Testers without a school account (guests) can only read the test records.
    const all = async c => { try { return await getDocs(collection(db, c)); } catch (e) { if (S.test && e.code === "permission-denied") return getDocs(testOnly(c)); throw e; } };
    const snap = await all("lsStudents");
    snap.forEach(d => { const x = { id: d.id, ...d.data() }; if (staffKeep(x)) S.students[d.id] = x; });
    await Promise.all(Object.keys(S.students).map(loadEntries));
    const b = await all("lsBoard"); b.forEach(d => { if (S.students[d.id]) S.boards[d.id] = { id: d.id, ...d.data() }; });
    // Labs too, for the challenges they introduce (Validate offers them).
    try { await loadLabs(true); } catch (e) { console.warn("Life Skills: couldn't read Labs", e); }
    await loadSaved();
  } else if (S.role === "student") {
    const snap = await getDocs(query(collection(db, "lsStudents"), where("email", "==", S.email), ...(S.test ? [where("test", "==", true)] : [])));
    snap.forEach(d => { S.students[d.id] = { id: d.id, ...d.data() }; S.mine.push(d.id); });
    await Promise.all(S.mine.map(sid => Promise.all([loadEntries(sid), loadShared(sid)])));
    const b = await getDocs(collection(db, "lsBoard")); b.forEach(d => S.boards[d.id] = { id: d.id, ...d.data() });
  } else if (S.role === "parent") {
    const snap = await getDocs(query(collection(db, "lsStudents"), where("parents", "array-contains", S.email), ...(S.test ? [where("test", "==", true)] : [])));
    snap.forEach(d => { const x = { id: d.id, ...d.data() }; if (!keep(x)) return; S.students[d.id] = x; S.mine.push(d.id); });
    // A tester's test parent view also shows the tester's own real children (records that list the tester's email as a
    // parent), view only, so a staff parent can see their family's real view.
    if (S.test === "parent" && S.real) {
      try {
        const own = await getDocs(query(collection(db, "lsStudents"), where("parents", "array-contains", S.real)));
        own.forEach(d => { const x = { id: d.id, ...d.data() }; if (x.test || S.students[d.id]) return; S.students[d.id] = { ...x, viewOnly: true }; S.mine.push(d.id); });
      } catch (e) { console.warn("Life Skills: couldn't read your own children", e); }
    }
    S.mine.sort((a, b) => S.students[a].name.localeCompare(S.students[b].name));
    await Promise.all(S.mine.map(async sid => {
      await Promise.all([loadEntries(sid), loadShared(sid)]);
      try { const b = await getDoc(doc(db, "lsBoard", sid)); if (b.exists()) S.boards[sid] = { id: sid, ...b.data() }; } catch (e) { /* board is optional for families */ }
    }));
    try { await loadLabs(true); } catch (e) { /* not linked yet: the schedule says so */ }
    // A tester (staff) in the test parent view can also read the students' own saved copies, for anything not shared yet.
    if (S.test === "parent" && S.mine.some(sid => !S.students[sid].test)) { const was = S.saved; await loadSaved(true); if (S.saved === null) S.saved = was; }
    try { localStorage.setItem("wl-kids", String(S.mine.length)); document.dispatchEvent(new CustomEvent("wl-kids", { detail: S.mine.length })); } catch (e) { }
    if (S.mine.some(sid => (S.books[sid] || {}).n)) bookTitles().then(() => { if (/^#?(c=|$)/.test(location.hash)) route(); });
  }
}
// What each student saved to their Challenges plan (students/{uid}/sites/challenges, written by /auth.js; staff can
// read them all, see firestore.rules). Matched to tracker records by school email. S.saved[sid] = [challenge ids].
// What a student saved on the student sites, from one site's saved copy (a JSON object of localStorage keys to strings):
// challenges (S.saved[sid], challenge ids), goals (S.goals[sid]), books (S.books[sid]) and project ideas (S.sparks[sid]).
function applySite(sid, site, raw) {
  let data = {}; try { data = JSON.parse(raw || "{}") || {}; } catch (e) { return; }
  const j = k => { try { return JSON.parse(data[k]); } catch (e) { return null; } };
  if (site === "challenges") S.saved[sid] = [...new Set((j("wl-picks") || []).filter(c => BYID[c]))];
  if (site === "goals") S.goals[sid] = j("wl-goals");
  if (site === "projects") S.sparks[sid] = (j("atlas-sparks") || []).filter(x => x && x.t);
  if (site === "books") { const b = j("lantern-stacks") || {}, saved = b.saved || [], want = b.want || [], nope = Array.isArray(b.nope) ? b.nope : []; S.books[sid] = { saved, want, nope, n: saved.length + want.length + nope.length }; }
}
// Staff: every student's own saved copies (the sites collection group; firestore.rules lets staff read them all),
// matched to tracker records by school email. keep: leave what's already loaded (the test parent view).
async function loadSaved(keep) {
  if (!keep) S.saved = {};
  try {
    const bySchool = {}; Object.values(S.students).forEach(s => { if (s.email) bySchool[s.email.toLowerCase()] = s.id; });
    const snap = await getDocs(collectionGroup(db, "sites"));
    snap.forEach(d => { const x = d.data(), sid = bySchool[String(x.email || "").toLowerCase()]; if (sid && !!x.test === !!S.students[sid].test) applySite(sid, d.id, x.data); });
  } catch (e) { console.warn("Life Skills: couldn't read saved things", e); S.saved = null; }
}
// Parents and the student: the copies /auth.js shares at lsShared/{sid}/sites/{site}.
async function loadShared(sid) {
  try { (await getDocs(collection(db, "lsShared", sid, "sites"))).forEach(d => applySite(sid, d.id, d.data().data)); }
  catch (e) { console.warn("Life Skills: couldn't read what " + sid + " saved", e); }
}
// Book titles from the Books site's page (its catalog is inline there), once.
let BOOKT = null;
async function bookTitles() {
  if (BOOKT) return BOOKT;
  BOOKT = {};
  try {
    const t = await (await fetch("/books/")).text();
    for (const x of t.matchAll(/\{id:"([^"]+)",t:"((?:[^"\\]|\\.)*)"/g)) BOOKT[x[1]] = x[2].replace(/\\"/g, '"');
    for (const x of t.matchAll(/"id": "([^"]+)", "t": "((?:[^"\\]|\\.)*)"/g)) BOOKT[x[1]] = x[2].replace(/\\"/g, '"');
  } catch (e) { }
  return BOOKT;
}
// Saved challenges for one student, grouped by life skill, leaving out ones they've already passed.
function savedBySkill(sid) {
  const passed = new Set(summary(sid).passes.map(p => p.cid)), out = {};
  ((S.saved || {})[sid] || []).filter(c => !passed.has(c)).forEach(c => { const k = (skillOf(c) || {}).k; if (k) (out[k] = out[k] || []).push(c); });
  return out;
}

// The crew board copy of a student's passes, rebuilt from their entries after every change.
function boardDoc(sid) {
  const s = S.students[sid], sum = summary(sid), old = S.boards[sid] || {};
  return { name: shortName(s.name), band: s.band, working: (old.working || []).filter(c => !sum.passes.some(p => p.cid === c)), passed: sum.passes.map(p => BYID[p.cid] && BYID[p.cid].custom ? { c: p.cid, d: p.date, t: chTitle(p.cid), k: BYID[p.cid].k } : { c: p.cid, d: p.date }), credits: sum.trail, updated: Date.now(), ...(s.test ? { test: true } : {}) };
}
// In a test view, real students are shown so the test guide sees a real band, but nothing about them can be changed.
const viewOnly = sid => !!S.test && !(S.students[sid] || {}).test;
const VO_MSG = "Real students are view-only in a Test view. Try it with Test Student.";
async function saveBoard(sid) { if (viewOnly(sid)) return; const b = boardDoc(sid); await setDoc(doc(db, "lsBoard", sid), b); S.boards[sid] = { id: sid, ...b }; }

// ---------- auth ----------
async function decideRole(u) {
  S.user = u; S.email = (u.email || "").toLowerCase(); S.admin = false; S.role = null; S.test = null; S.real = S.email; S.testBand = "";
  const school = S.email.endsWith(DOMAIN);
  if (!u.emailVerified) { S.role = "unverified"; return; }
  const v = storedView();
  if (v && v.by === S.email && TESTERS.includes(S.email)) {
    // A test view: this page acts as the test guide, student or parent (see /wlnav.js). /auth.js makes the records.
    S.test = v.as; S.testBand = ["K–1", "2–4", "5–8"].includes(v.band) ? v.band : "2–4";
    S.role = v.as === "guide" ? "staff" : v.as;
    S.email = v.as === "guide" ? TEST.guide : v.as === "student" ? TEST.student : TEST.parent;
    return;
  }
  if (v) { try { localStorage.removeItem("wl-viewas"); } catch (e) { } }
  if (school) {
    S.admin = ADMINS.includes(S.email);
    let staff = S.admin;
    if (!staff) { try { staff = (await getDoc(doc(db, "staff", S.email))).exists(); } catch (e) { staff = false; } }
    S.role = staff ? "staff" : "student";
  } else S.role = "parent";
}
async function finishEmailLink() {
  if (!isSignInWithEmailLink(auth, location.href)) return false;
  let email = ""; try { email = localStorage.getItem(LINK_KEY) || ""; } catch (e) { }
  const done = async em => {
    try { await signInWithEmailLink(auth, em, location.href); try { localStorage.removeItem(LINK_KEY); } catch (e) { } history.replaceState(null, "", BASE); }
    catch (e) { history.replaceState(null, "", BASE); toast(errText(e)); route(); }
  };
  if (email) { await done(email); return true; }
  // Opened on a different device from the one that asked for the link: ask which email it was.
  const em = h("input", { class: "in", type: "email", id: "le", autocomplete: "email", required: true }), note = h("p", { class: "note", "aria-live": "polite" });
  main([head("Finish signing in", "Type the email address the sign-in link was sent to."),
    h("section", { class: "band" }, h("div", { class: "wrap" }, h("form", { class: "panel", style: { maxWidth: "460px" }, onsubmit: e => { e.preventDefault(); if (!isEmail(em.value.trim())) { note.textContent = "Type the full email address."; return; } done(em.value.trim().toLowerCase()); } },
      [h("label", { class: "f", for: "le" }, ["Email", em]), h("button", { class: "btn go", type: "submit", text: "Sign in" }), note])))]);
  return true;
}

// ---------- page frame ----------
function main(kids) { const m = $("#app"); m.innerHTML = ""; m.append(...[kids].flat().filter(Boolean)); }
const head = (title, sub) => h("div", { class: "wrap page-head" }, [h("h1", { text: title }), sub ? h("p", { text: sub }) : null]);
function navLinks(items) {
  // Items are [id, label, href]. A link to a view on this same page (PATH#view) becomes a plain #view link.
  // (It keeps that link's own view: Labs is #schedule, not #labs, which no view answers to.)
  items = items.map(([id, label, href]) => [id, label, href && href.startsWith(PATH + "#") ? href.slice(PATH.length) : href]);
  // Views that sit under another menu item: Labs holds the schedule; Validate was Log.
  const ALIAS = { schedule: "labs", log: "validate" }, raw = location.hash.slice(1).split("=")[0] || (items[0] || [""])[0];
  const cur = items.some(x => x[0] === raw) ? raw : ALIAS[raw] || raw;
  const nav = $("#links"); nav.innerHTML = "";
  items.forEach(([id, label, href]) => nav.append(h("a", { href: href || "#" + id, text: label, "aria-current": (!href || href.startsWith("#")) && cur === id ? "page" : null })));
}
// The Life Skills menu for this site, from /lifeskills/subnav.js (one list for every Life Skills page).
const SUBNAV = window.WLSubnav || { guides: [["overview", "Overview", "/guides/lifeskills/#overview"]], parents: [] };
// Student records and parent links are edited on the Student Roster (/guides/roster/).
const ROSTER = "/guides/roster/";
let menuOpen = false;
function acct() {
  const box = $("#acct"); box.innerHTML = "";
  if (!S.user) return;
  const roleName = S.test ? "Test " + S.test : { staff: S.admin ? "Admin" : "Guide", student: "Student", parent: "Parent", unverified: "Not verified yet" }[S.role] || "";
  // Looks like the sign-in chip on other pages (initial, then name); on Guides and Parents it sits in the top bar.
  const nm = S.test ? "Test " + S.test : firstName(S.user.displayName) || S.email.split("@")[0];
  const b = h("button", { type: "button", "aria-expanded": String(menuOpen), "aria-label": "Account: " + nm, onclick: () => { menuOpen = !menuOpen; acct(); } },
    [h("span", { class: "av", text: S.test ? "🧪" : (nm[0] || "?").toUpperCase() }), h("span", { text: nm })]);
  box.append(b);
  if (menuOpen) box.append(h("div", { class: "acct-menu" }, [
    h("p", { text: S.test ? `${roleName}. You're ${S.real}.` : `${roleName}. Signed in as ${S.email}.` }),
    S.role === "staff" ? h("a", { href: "/fieldguide/", text: "Field Guide" }) : null,
    S.role !== "parent" ? h("a", { href: S.role === "staff" ? "/guides/challenges/" : "/challenges/", text: "Challenges" }) : h("a", { href: "/parents/passoff/", text: "Passing off at home" }),
    // Testers: switch to a test account (or back) from here.
    TESTERS.includes(S.real) && window.WLTest ? h("div", { html: window.WLTest.html() }) : null,
    h("button", { type: "button", text: "Sign out", onclick: async () => { menuOpen = false; try { localStorage.removeItem("wl-viewas"); } catch (e) { } await signOut(auth); location.hash = ""; } })
  ]));
}
// composedPath: the menu button is re-drawn on click, so check the path the click took, not where the target is now.
document.addEventListener("click", e => { if (menuOpen && !e.composedPath().some(n => n.id === "acct")) { menuOpen = false; acct(); } });

// ---------- signed out: school Google, or a parent email account ----------
const GLOGO = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>';
async function google(schoolOnly) {
  const p = new GoogleAuthProvider(); p.setCustomParameters(schoolOnly ? { hd: "wilderland.academy", prompt: "select_account" } : { prompt: "select_account" });
  // The installed app can't hear back from a pop-up, so it signs in on this page and comes back here signed in.
  if (APPMODE) { try { await signInWithRedirect(auth, p); } catch (e) { toast(errText(e)); } return; }
  try { await signInWithPopup(auth, p); } catch (e) { if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") toast(errText(e)); }
}
function signedOut() {
  $("#links").innerHTML = ""; acct();
  let tab = "in";
  const box = h("div", { class: "stack" });
  const tabs = h("div", { class: "tabs", role: "tablist", "aria-label": "Parent sign-in" });
  const draw = () => {
    tabs.innerHTML = "";
    [["in", "Sign in"], ["new", "Create account"], ["link", "Email me a link"]].forEach(([id, l]) => tabs.append(h("button", { type: "button", role: "tab", "aria-selected": String(tab === id), text: l, onclick: () => { tab = id; draw(); } })));
    box.innerHTML = ""; box.append(parentForm(tab, t => { tab = t; draw(); }));
  };
  draw();
  // On the Parents site the family sign-in comes first: any Google account (most families have one; we don't give
  // parents school accounts), or an email link or password. Staff sign in with the school account below it.
  if (PATH === HOMES.parent) return main([
    head("My Child", "Your child's profile: the Life Skills challenges they've passed and are working on, their goals, books and project ideas, the Labs coming up, and how to support it all at home."),
    h("section", { class: "band" }, h("div", { class: "wrap signin" }, [
      h("div", { class: "panel stack" }, [
        h("h2", { class: "h", text: "Parents and families" }),
        h("p", { class: "muted", text: "Sign in with the email address you gave the school. Your child's guide links it to your child." }),
        h("div", {}, h("button", { class: "btn go gbtn", type: "button", onclick: () => google(false), html: GLOGO + "<span>Continue with Google</span>" })),
        h("p", { class: "small muted", text: "Any Google account works, like Gmail. No Google account? Use your email instead:" }),
        tabs, box
      ]),
      h("div", { class: "panel" }, [
        h("h2", { class: "h", text: "Wilderland staff" }),
        h("p", { class: "muted", text: "Guides and admins: use your Wilderland school account." }),
        h("div", {}, h("button", { class: "btn", type: "button", onclick: () => google(true), text: "Continue with school Google" }))
      ])
    ]))
  ]);
  main([
    head("Life Skills Tracker", "Every challenge your child has passed, what they're working on, and what to practice next. Guides record each pass the day it happens."),
    h("section", { class: "band" }, h("div", { class: "wrap signin" }, [
      h("div", { class: "panel" }, [
        h("h2", { class: "h", text: "Students and guides" }),
        h("p", { class: "muted", text: "Use your Wilderland school account." }),
        h("div", {}, h("button", { class: "btn go gbtn", type: "button", onclick: () => google(true), html: GLOGO + "<span>Continue with school Google</span>" }))
      ]),
      h("div", { class: "panel" }, [
        h("h2", { class: "h", text: "Parents" }),
        h("p", { class: "muted", text: "Use the email address you gave the school. Your child's Field Guide links your account to your child." }),
        tabs, box,
        h("p", { class: "small muted" }, ["Have a Google account? ", h("button", { class: "btn plain", type: "button", text: "Continue with Google", onclick: () => google(false) })])
      ])
    ]))
  ]);
}
function parentForm(tab, go) {
  const note = h("p", { class: "note", "aria-live": "polite" });
  const say = (t, cls) => { note.className = "note " + (cls || ""); note.textContent = t; };
  const em = h("input", { class: "in", type: "email", id: "pe", autocomplete: "email", required: true });
  const pw = h("input", { class: "in", type: "password", id: "pp", autocomplete: tab === "new" ? "new-password" : "current-password", minlength: "8", required: true });
  const emailVal = () => { const v = em.value.trim().toLowerCase(); if (!isEmail(v)) { say("Type your full email address.", "err"); return ""; } if (v.endsWith(DOMAIN)) { say("School accounts sign in with the school Google button.", "err"); return ""; } return v; };
  if (tab === "link") {
    return h("form", { class: "stack", onsubmit: async e => {
      e.preventDefault(); const v = emailVal(); if (!v) return;
      try { await sendSignInLinkToEmail(auth, v, { url: HOME, handleCodeInApp: true }); try { localStorage.setItem(LINK_KEY, v); } catch (x) { } say("Check your email for a sign-in link. It works once and expires in about an hour. Open it on this device if you can.", "ok"); }
      catch (x) { say(errText(x), "err"); }
    } }, [h("label", { class: "f", for: "pe" }, ["Email", em]), h("div", {}, h("button", { class: "btn go", type: "submit", text: "Email me a sign-in link" })), note]);
  }
  if (tab === "reset") {
    return h("form", { class: "stack", onsubmit: async e => {
      e.preventDefault(); const v = emailVal(); if (!v) return;
      try { await sendPasswordResetEmail(auth, v, { url: HOME }); } catch (x) { if (!String(x.code).includes("user-not-found")) { say(errText(x), "err"); return; } }
      say("If there's an account for that email, a reset link is on its way. Check your spam folder too.", "ok");
    } }, [h("p", { class: "small", text: "We'll email you a link to choose a new password." }), h("label", { class: "f", for: "pe" }, ["Email", em]),
      h("div", { class: "row" }, [h("button", { class: "btn go", type: "submit", text: "Send reset link" }), h("button", { class: "btn plain", type: "button", text: "Back to sign in", onclick: () => go("in") })]), note]);
  }
  const isNew = tab === "new";
  return h("form", { class: "stack", onsubmit: async e => {
    e.preventDefault(); const v = emailVal(); if (!v) return;
    if (pw.value.length < 8) { say("Use a password of at least 8 characters.", "err"); return; }
    try {
      if (isNew) { const c = await createUserWithEmailAndPassword(auth, v, pw.value); await sendEmailVerification(c.user, { url: HOME }); }
      else await signInWithEmailAndPassword(auth, v, pw.value);
    } catch (x) { say(errText(x), "err"); }
  } }, [
    h("label", { class: "f", for: "pe" }, ["Email", em]),
    h("label", { class: "f", for: "pp" }, [isNew ? h("span", {}, ["Password ", h("span", { class: "hint", text: "(at least 8 characters)" })]) : "Password", pw]),
    h("div", { class: "row" }, [h("button", { class: "btn go", type: "submit", text: isNew ? "Create account" : "Sign in" }), isNew ? null : h("button", { class: "btn plain", type: "button", text: "Forgot your password?", onclick: () => go("reset") })]),
    note
  ]);
}
function unverified() {
  $("#links").innerHTML = ""; acct();
  const note = h("p", { class: "note", "aria-live": "polite" });
  main([head("Check your email", `We sent a link to ${S.email}. Open it to confirm this address is yours, then come back here.`),
    h("section", { class: "band" }, h("div", { class: "wrap" }, h("div", { class: "panel", style: { maxWidth: "560px" } }, [
      h("p", { text: "This keeps your child's record safe: only someone who can read this inbox can see it." }),
      h("div", { class: "row" }, [
        h("button", { class: "btn go", type: "button", text: "I've confirmed it", onclick: async () => { await S.user.reload(); if (auth.currentUser.emailVerified) { await auth.currentUser.getIdToken(true); start(auth.currentUser); } else { note.className = "note err"; note.textContent = "Not confirmed yet. Open the link in the email first."; } } }),
        h("button", { class: "btn", type: "button", text: "Send it again", onclick: async () => { try { await sendEmailVerification(S.user, { url: HOME }); note.className = "note ok"; note.textContent = "Sent. Check your spam folder too."; } catch (e) { note.className = "note err"; note.textContent = errText(e); } } }),
        h("button", { class: "btn plain", type: "button", text: "Use a different email", onclick: () => signOut(auth) })
      ]), note])))]);
}

// ---------- shared pieces ----------
function chTitle(cid) { const c = BYID[cid]; return c ? c.t : cid + " (no longer in the challenge list)"; }
// A Lab-only challenge opens its Lab (guides and parents can read Labs); everyone else just sees its name.
// A challenge's title as a link that opens the challenge in a modal over this page (/challenges/modal.js).
function chLink(cid, text) {
  const t = text == null ? chTitle(cid) : text;
  if (!BYID[cid]) return t;
  if (BYID[cid].custom) return BYID[cid].lab && (S.labs || []).some(l => l.id === BYID[cid].lab) ? h("a", { href: "#schedule=" + BYID[cid].lab, text: t }) : t;
  return h("a", { class: "wl-ch", href: CHMAP + "#c=" + encodeURIComponent(cid), "data-wl-ch": cid, text: t });
}
function chMeta(cid) { const c = BYID[cid], sk = skillOf(cid); return c && c.custom ? [sk ? sk.n : "", c.labTitle ? "from the " + c.labTitle + " Lab" : "a Lab challenge"].filter(Boolean).join(", ") : [sk ? sk.n : "", cid, c && c.z === "Epic" ? "Epic" : ""].filter(Boolean).join(", "); }
const inBandOf = (c, band) => !band || (c.custom ? !c.bands.length || c.bands.includes(band) : c.b === band);
function picker(opts) {
  // A search box for challenges. opts.band narrows the list; opts.onpick(cid)
  const inp = h("input", { class: "in", type: "search", id: opts.id || "chq", placeholder: "Search by words or ID, like “mile” or EN-03.2", autocomplete: "off" });
  const res = h("div", { class: "results" });
  const run = () => {
    const q = inp.value.trim().toLowerCase(); res.innerHTML = "";
    if (q.length < 2) return;
    const words = q.split(/\s+/);
    const band = typeof opts.band === "function" ? opts.band() : opts.band;
    // Lab challenges (not on the map) first: they're what a guide validates at the end of a Lab.
    const match = c => inBandOf(c, band) && (c.id.toLowerCase().startsWith(q) || words.every(w => c.t.toLowerCase().includes(w) || (c.labTitle || "").toLowerCase().includes(w)));
    const hits = Object.values(CUSTOM).filter(match).concat(W.ch.filter(match)).slice(0, 12);
    if (!hits.length) res.append(h("p", { class: "empty", style: { padding: "8px 0" }, text: "No challenges match. Try fewer words." }));
    hits.forEach(c => res.append(h("button", { type: "button", onclick: () => { inp.value = ""; res.innerHTML = ""; opts.onpick(c.id); } }, [h("span", { style: { background: colOf(c.id), borderRadius: "3px" } }), h("span", {}, [c.t, h("small", { text: chMeta(c.id) + (c.custom ? (c.bands.length ? ", grades " + c.bands.join(", ") : "") : ", grades " + c.b) })])])));
  };
  inp.addEventListener("input", run);
  return h("div", { class: "pick" }, [inp, res]);
}
function trackBar(sid) {
  const s = S.students[sid] || S.boards[sid] || {}, sum = summary(sid), ranks = RANKS[s.band] || [];
  const top = Math.max(ranks.length ? ranks[ranks.length - 1][0] : 24, Math.ceil((sum.trail + 1) / 4) * 4);
  const n = top / 4, names = Object.fromEntries(ranks);
  const g = h("div", { class: "track", role: "img", "aria-label": `${sum.trail} credits. A milestone every 4 credits.${ranks.length ? " Ranks: " + ranks.map(r => r[1] + " at " + r[0]).join(", ") + "." : ""}`, style: { gridTemplateColumns: `repeat(${n},minmax(0,1fr))` } });
  for (let i = 1; i <= n; i++) g.append(h("span", { class: "seg4" + (i * 4 <= sum.trail ? " on" : "") }));
  for (let i = 1; i <= n; i++) g.append(h("span", { class: "lab" + (i * 4 <= sum.trail ? " on" : ""), text: n > 14 && i % 2 && !names[i * 4] ? "" : String(i * 4) }));
  if (ranks.length) for (let i = 1; i <= n; i++) g.append(h("span", { class: "rk", text: names[i * 4] || "" }));
  return g;
}
function workingList(sid, editable) {
  const b = S.boards[sid] || {}, list = (b.working || []).filter(c => BYID[c]);
  const wrap = h("div", { class: "stack" });
  const ul = h("div", { class: "items" });
  if (!list.length) wrap.append(h("p", { class: "empty", text: editable ? "Nothing yet. Add up to 3 challenges you're working on so your crew can see." : "Nothing listed right now." }));
  list.forEach(c => ul.append(h("div", { class: "item" }, [h("span", { class: "bar", style: { background: colOf(c) } }), h("div", {}, [h("div", { class: "meta", text: chMeta(c) }), h("div", { class: "t" }, chLink(c))]),
    editable ? h("button", { class: "btn danger", type: "button", text: "Remove", "aria-label": "Remove " + c, onclick: () => setWorking(sid, list.filter(x => x !== c)) }) : h("span")])));
  if (list.length) wrap.append(ul);
  if (editable) {
    const note = h("p", { class: "note", "aria-live": "polite" });
    if (list.length < 3) wrap.append(h("div", { class: "panel" }, [h("label", { class: "f", for: "wk" }, ["Add a challenge you're working on", picker({ id: "wk", band: () => (S.students[sid] || {}).band, onpick: c => { if (summary(sid).passes.some(p => p.cid === c)) { note.textContent = "You've already passed that one. Pick a new challenge."; return; } if (!list.includes(c)) setWorking(sid, list.concat(c)); } })]),
      h("div", {}, h("button", { class: "btn", type: "button", text: "Use my plan from Challenges", onclick: async () => {
        try {
          const d = await getDoc(doc(db, "students", S.user.uid, "sites", "challenges"));
          const picks = d.exists() ? JSON.parse(JSON.parse(d.data().data || "{}")["wl-picks"] || "[]") : [];
          const done = summary(sid).passes.map(p => p.cid);
          const add = picks.filter(c => BYID[c] && !list.includes(c) && !done.includes(c)).slice(0, 3 - list.length);
          if (!add.length) { note.textContent = "Your Challenges plan is empty, or everything in it is already here."; return; }
          setWorking(sid, list.concat(add));
        } catch (e) { note.textContent = "Couldn't read your plan. Open Challenges once while signed in, then try again."; }
      } })), note]));
  }
  return wrap;
}
async function setWorking(sid, list) {
  if (viewOnly(sid)) { toast(VO_MSG); return; }
  try { await updateDoc(doc(db, "lsBoard", sid), { working: list.slice(0, 3), updated: Date.now() }); S.boards[sid] = { ...(S.boards[sid] || {}), working: list.slice(0, 3) }; route(); }
  catch (e) { toast(errText(e)); }
}

// ---------- one student's record: the family view ----------
function record(sid, opts = {}) {
  const s = S.students[sid]; if (!s) return h("div", { class: "wrap" }, h("p", { class: "empty", text: "That student isn't here." }));
  const sum = summary(sid), goal = goalFor(s.band);
  const done = W.skills.filter(k => (sum.per[k.k] || 0) >= goal).length;
  const missingSkills = W.skills.filter(k => !(sum.per[k.k] || 0)).map(k => k.n);
  const skillsList = h("ul", { class: "skills" }, W.skills.map(k => {
    const n = sum.per[k.k] || 0;
    return h("li", {}, [h("span", { class: "sw", style: { background: k.col } }), h("span", { text: k.n }),
      h("span", { class: "dots", style: { color: k.col }, "aria-label": `${Math.min(n, goal)} of ${goal}${n > goal ? `, plus ${n - goal} extra` : ""}` }, [...Array(goal)].map((_, i) => h("span", { class: "dot" + (i < n ? " on" : "") })).concat(n > goal ? [h("span", { class: "extra", text: "+" + (n - goal) })] : []))]);
  }));
  const rankLine = s.band === "K–1"
    ? h("p", { class: "muted", text: "K–1 has no ranks. Each child aims for 2 passes in every life skill this year, through Life Skill Labs." })
    : h("p", { class: "muted" }, [h("b", { style: { color: "var(--ink)" }, text: `${sum.trail} credit${sum.trail === 1 ? "" : "s"} on the grades ${s.band} trail. ` }),
        (sum.nextRank && sum.nextRank[0] === sum.milestone + 4 ? `Next: ${sum.nextRank[1]} at ${sum.nextRank[0]}. ` : `Next milestone at ${sum.milestone + 4}` + (sum.nextRank ? `, then ${sum.nextRank[1]} at ${sum.nextRank[0]}. ` : ". ")) + "Every 4 credits is a milestone, celebrated at Honor Court."]);
  const staffBits = opts.staff ? h("div", { class: "row noprint" }, [
    h("a", { class: "btn go", href: "#validate=" + sid, text: "Validate a challenge" }),
    h("a", { class: "btn", href: ROSTER + "#edit=" + encodeURIComponent(sid), text: "Edit student and parents" }),
    sum.newMilestone ? h("button", { class: "btn", type: "button", text: `Mark milestone ${sum.milestone} celebrated`, onclick: async () => { if (viewOnly(sid)) { toast(VO_MSG); return; } try { await updateDoc(doc(db, "lsStudents", sid), { celebrated: sum.milestone }); s.celebrated = sum.milestone; toast("Marked. It drops off the new milestones list."); route(); } catch (e) { toast(errText(e)); } } }) : null
  ]) : null;
  const entryRow = (e, kind) => {
    const sk = skillOf(e.cid), c = BYID[e.cid];
    const kids = [h("div", { class: "meta" }, [h("b", { text: fmt(e.date) }), ", " + (sk ? sk.n : e.cid) + ", " + (kind === "pass" ? ((e.credits || (c || {}).cr || 1) > 1 ? "Epic, 2 credits" : "1 credit") : "not yet")]),
      h("div", { class: "t" }, chLink(e.cid))];
    if (kind === "pass" && e.note) kids.push(h("div", { class: "gnote", text: (e.byName ? e.byName + ": " : "") + e.note }));
    if (kind === "notyet") kids.push(h("dl", { class: "ny" }, [h("dt", { text: "Missing" }), h("dd", { text: e.missing || "—" }), h("dt", { text: "Practice" }), h("dd", { text: e.practice || "—" }), h("dt", { text: "Retry" }), h("dd", { text: e.retry ? "On or after " + fmt(e.retry) : "Any day you're ready" })]));
    let confirm = false;
    const del = opts.staff ? h("button", { class: "btn danger noprint", type: "button", text: "Remove", onclick: async ev => {
      if (viewOnly(sid)) { toast(VO_MSG); return; }
      if (!confirm) { confirm = true; ev.target.textContent = "Confirm remove"; return; }
      try { await deleteDoc(doc(db, "lsStudents", sid, "entries", e.id)); S.entries[sid] = S.entries[sid].filter(x => x.id !== e.id); await saveBoard(sid); toast("Removed."); route(); } catch (x) { toast(errText(x)); }
    } }) : h("span");
    return h("div", { class: "item" }, [h("span", { class: "bar", style: { background: colOf(e.cid) } }), h("div", {}, kids), del]);
  };
  return h("div", {}, [
    h("div", { class: "wrap page-head" }, h("div", { class: "who" }, [
      h("div", {}, [h("h1", { text: opts.self ? "My trail" : s.name }), h("p", { text: [opts.self ? s.name : "", s.grade ? "Grade " + s.grade : "Grades " + s.band, guidesOf(s).length ? (guidesOf(s).length > 1 ? "Field Guides " : "Field Guide ") + guidesOf(s).map(guideName).join(" and ") : ""].filter(Boolean).join(", ") })]),
      staffBits
    ])),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      opts.parent ? launchNote() : null,
      h("div", { class: "grid2" }, [
        h("div", { class: "panel" }, [h("h2", { class: "h", text: `Expected this year: ${goal} in every life skill` }),
          h("p", { class: "muted" }, [h("b", { style: { color: "var(--ink)" }, text: `${done} of 8 skills met. ` }), missingSkills.length === 8 ? "No passes yet this year." : missingSkills.length ? "Not started yet: " + missingSkills.join(", ") + "." : "Every life skill has a pass this year."]), skillsList]),
        h("div", { class: "panel" }, [h("h2", { class: "h", text: s.band === "K–1" ? "This year" : sum.rank ? "Rank: " + sum.rank : "On the trail" }), rankLine, s.band === "K–1" ? h("p", { class: "big", text: String(sum.year) }) : trackBar(sid)])
      ]),
      goalsPanel(sid, opts)
    ])),
    h("section", { class: "band tint" }, h("div", { class: "wrap stack" }, [
      h("h2", { class: "h", text: "Working on" }), workingList(sid, opts.self),
      opts.staff || opts.parent ? savedPanel(sid, opts.parent) : null,
      sum.notyets.length ? h("h2", { class: "h", style: { marginTop: "12px" }, text: "Not yet, with what to practice" }) : null,
      sum.notyets.length ? h("div", { class: "items" }, sum.notyets.map(e => entryRow(e, "notyet"))) : null
    ])),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      h("h2", { class: "h", text: `Feats (${sum.passes.length})` }),
      sum.passes.length ? h("div", { class: "items" }, sum.passes.map(e => entryRow(e, "pass"))) : h("p", { class: "empty", text: "No passes yet. The first one is the hardest." }),
      opts.parent ? h("p", { class: "small muted" }, ["Each feat is a challenge shown to a guide in person, or passed off at home by the rules in ", h("a", { href: "/parents/passoff/", text: "Passing off at home" }), ". Not yets always say what to practice and when to try again."]) : null
    ])),
    opts.self ? null : readingPanel(sid, opts),
    opts.parent ? homeSupport(sid) : null
  ]);
}

// The goals a student set on /goals/ (S.goals[sid]): current ones by week, month and school year, with progress, and
// the last few finished or past. Shown to guides, parents and the student on the student's record.
const GSPAN = { week: "This week", month: "This month", year: "This school year" };
const GAREA = { life: "Life Skills", acad: "Academics", store: "Camp Store", project: "Project", habit: "Habit or behavior" };
function goalsPanel(sid, opts) {
  const s = S.students[sid], name = firstName(s.name), data = (S.goals || {})[sid], list = (data && data.list) || [], now = today();
  const pad = n => String(n).padStart(2, "0"), iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const at = str => { const [y, m, d] = str.split("-").map(Number); return new Date(y, m - 1, d); };
  const sy = d => iso(new Date(d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1, 7, 1));
  const start = g => { const d = at(g.due); return g.span === "week" ? iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() + 6) % 7)) : g.span === "month" ? iso(new Date(d.getFullYear(), d.getMonth(), 1)) : sy(d); };
  const passes = summary(sid).passes;
  const prog = g => g.area === "life" && g.kind === "count" ? { at: passes.filter(p => p.date >= start(g) && p.date <= g.due).length, of: g.n }
    : g.area === "life" && g.kind === "one" ? { at: passes.some(p => p.cid === g.item && p.date >= sy(at(g.due))) ? 1 : 0, of: 1, one: true }
    : (g.area === "acad" && g.kind === "count") || g.area === "store" ? { at: Number(g.at) || 0, of: Number(g.n) || 0, unit: g.area === "store" ? "blazes" : g.unit, typed: true } : null;
  const state = g => { const p = prog(g); return g.done || (p && !p.typed && p.of && p.at >= p.of) ? "done" : g.due < now ? "past" : "current"; };
  const cur = list.filter(g => state(g) === "current"), old = list.filter(g => state(g) !== "current").sort((a, b) => (b.done || b.due).localeCompare(a.done || a.due)).slice(0, 6);
  const row = g => {
    const p = prog(g), st = state(g);
    const line = p && !p.one ? `${p.at} of ${p.of}${p.unit ? " " + p.unit : ""}${p.typed ? " (the student's count)" : " passed"}` : p && p.one ? (p.at ? "Passed" : "Not passed yet") : "";
    return h("div", { class: "item" }, [h("span", { class: "bar", style: { background: g.area === "life" ? "#356B33" : g.area === "acad" ? "#2F5D8A" : "#8A6418" } }),
      h("div", {}, [h("div", { class: "meta" }, [h("b", { text: GAREA[g.area] || "" }), ", " + (st === "done" ? "done" + (g.done ? " " + fmt(g.done) : "") : st === "past" ? "was due " + fmt(g.due) : "by " + fmt(g.due))]),
        h("div", { class: "t", text: g.label || g.text || "" }),
        line || g.why ? h("div", { class: "small muted", text: [line, g.why ? "Why: " + g.why : ""].filter(Boolean).join(". ") }) : null]), h("span")]);
  };
  const missing = [cur.some(g => g.area === "life") ? "" : "Life Skills", cur.some(g => g.area === "acad") ? "" : "academic"].filter(Boolean);
  const intro = opts.staff ? `What ${name} set on the Goals page. Look at them together at the weekly 1:1.` : opts.parent ? `${name} sets these at school on the Goals page and reviews them with their guide each week.` : "From your Goals page.";
  return h("div", { class: "panel stack" }, [
    h("h2", { class: "h", text: "Goals" }), h("p", { class: "small muted", text: intro }),
    missing.length ? h("p", { class: "small", style: { color: "#9C3F2A", fontWeight: "600" }, text: `No current ${missing.join(" or ")} goal. Every student is expected to keep one of each going.` }) : null,
    cur.length ? h("div", { class: "stack" }, ["week", "month", "year"].filter(sp => cur.some(g => g.span === sp)).map(sp => h("div", {}, [h("h3", { class: "h", text: GSPAN[sp] }), h("div", { class: "items" }, cur.filter(g => g.span === sp).sort((a, b) => a.due.localeCompare(b.due)).map(row))])))
      : h("p", { class: "empty", text: data ? "No current goals." : name + " hasn't set any goals yet" + (opts.staff ? " (or hasn't opened the Goals page signed in)." : ".") }),
    old.length ? h("details", {}, [h("summary", { text: `Recently finished or past (${old.length})` }), h("div", { class: "items" }, old.map(row))]) : null,
    opts.self ? h("div", {}, h("a", { class: "btn", href: "/goals/", text: "Open my goals" })) : null
  ]);
}

// A notification for the student (/notify.js) when a guide records a pass or a not yet.
function tellPass(sid, cid, result, o) {
  const s = S.students[sid]; if (!s || !s.email || !window.wlNotify) return;
  const t = result === "pass" ? `You passed “${chTitle(cid)}”. Nice work!` : `Not yet on “${chTitle(cid)}”.` + (o.missing ? ` Missing: ${o.missing.trim().slice(0, 80)}.` : "") + (o.practice ? ` Practice: ${o.practice.trim().slice(0, 80)}.` : "");
  window.wlNotify([s.email], { kind: result === "pass" ? "pass" : "notyet", text: t, link: "/challenges/#progress" });
}
// Families: how to support it at home. The child's next Labs (with the guides' notes for home) and challenges they can
// pass off at home: what they're working on first, then the life skills furthest from what's expected this year.
function homeSupport(sid) {
  const s = S.students[sid], sum = summary(sid), goal = goalFor(s.band), now = today();
  const labs = (S.labs || []).filter(l => (l.bands || []).includes(s.band) && labEnd(l) >= now).slice(0, 3);
  // Only challenges at the child's own level: their band, and in grades 5–8 their half of it (5–6 or 7–8, from their
  // grade; "5–8" challenges fit both), the same split the Challenges page uses.
  const gn = parseInt(String(s.grade == null ? "" : s.grade).replace(/[^0-9]/g, ""), 10);
  const half = s.band === "5–8" ? (gn >= 7 && gn <= 8 ? "7–8" : gn >= 5 && gn <= 6 ? "5–6" : "") : "";
  const atLevel = x => x && x.b === s.band && (!half || !x.gr || x.gr === "5–8" || x.gr === half);
  const passed = new Set(sum.passes.map(p => p.cid)), working = ((S.boards[sid] || {}).working || []).filter(c => BYID[c] && !passed.has(c));
  const need = W.skills.slice().sort((a, b) => (sum.per[a.k] || 0) - (sum.per[b.k] || 0)).filter(k => (sum.per[k.k] || 0) < goal);
  const home = working.filter(c => BYID[c].h && atLevel(BYID[c]));
  need.forEach(k => { if (home.length >= 6) return; const c = W.ch.find(x => atLevel(x) && x.h && !passed.has(x.id) && !home.includes(x.id) && (skillOf(x.id) || {}).k === k.k); if (c) home.push(c.id); });
  const anyHome = W.ch.some(x => atLevel(x) && x.h);
  const name = firstName(s.name);
  return h("section", { class: "band tint" }, h("div", { class: "wrap stack" }, [
    h("h2", { class: "h", text: "Supporting " + name + " at home" }),
    h("div", { class: "grid2" }, [
      h("div", { class: "panel stack" }, [h("h3", { class: "h", text: "Coming up in Labs" }),
        labs.length ? h("div", { class: "items" }, labs.map(l => h("div", { class: "item" }, [h("span", { class: "bar", style: { background: bandCol(l) } }),
          h("div", {}, [h("div", { class: "meta" }, h("b", { text: whenTxt(l) })), h("div", { class: "t" }, h("a", { href: "#schedule=" + l.id, text: l.title })),
            l.home ? h("div", { class: "small muted", text: l.home.length > 160 ? l.home.slice(0, 160) + "…" : l.home }) : null,
            (l.files || []).length + (l.links || []).length ? h("div", { class: "small muted", text: "Has files or links for home" }) : null]), h("span")]))) : h("p", { class: "empty", text: "No Labs scheduled yet for grades " + s.band + "." }),
        h("div", {}, h("a", { class: "btn", href: "#schedule", text: "All Labs" }))]),
      h("div", { class: "panel stack" }, [h("h3", { class: "h", text: "Challenges to try at home" }),
        h("p", { class: "small muted", text: home.length ? `These can be passed off at home with you, all at ${name}'s level (grades ${half || s.band}). ${working.some(c => home.includes(c)) ? "The first are what " + name + " is working on; the rest" : "They"} are in the life skills where ${name} has the fewest passes this year.` : "" }),
        home.length ? savedList(home) : h("p", { class: "empty", text: anyHome ? name + " has passed the expected 2 everywhere a home challenge fits. Nice work." : `None of the grades ${half || s.band} challenges are set up to pass off at home yet. The Labs coming up are the best things to practice together.` }),
        h("div", { class: "row" }, [h("a", { class: "btn", href: "/parents/challenges/", text: "Browse all challenges" }), h("a", { class: "btn plain", href: "/parents/passoff/", text: "How passing off at home works" })])])
    ])
  ]));
}
// Staff view of one student: what they saved to their Challenges plan, by life skill.
function savedPanel(sid, parent) {
  const by = savedBySkill(sid), n = Object.values(by).reduce((a, l) => a + l.length, 0);
  return h("div", { class: "stack" }, [h("h2", { class: "h", style: { marginTop: "12px" }, text: `${parent ? "Challenges " + firstName(S.students[sid].name) + " saved" : "Saved to their plan"} (${n})` }),
    parent ? h("p", { class: "small muted", text: "Challenges they've bookmarked on the Challenges site and plan to work toward." }) : null,
    n ? h("div", { class: "grid2" }, W.skills.filter(k => by[k.k]).map(k => h("div", { class: "panel" }, [h("p", { class: "sklbl", style: { color: k.col }, text: k.n }), savedList(by[k.k])])))
      : h("p", { class: "empty", text: S.saved === null ? "Couldn't read saved challenges." : parent ? "Nothing saved yet. Students save challenges on the Challenges site at school." : "Nothing saved (or they haven't signed in on Challenges yet)." })]);
}
// Reading and project ideas on the student's profile (guides, parents, the student).
// "Books finished this year" is only books a student truly finished this school year, which will come from Basecamp
// (not connected yet, Nov 2026). The Books site's "loved it" and "not for me" lists are a student's tastes, from any
// time in their life, so they're shown as that and never counted as books finished.
function readingPanel(sid, opts) {
  const name = firstName(S.students[sid].name), b = S.books[sid] || { saved: [], want: [], nope: [] }, sparks = S.sparks[sid] || [];
  if (!BOOKT && (b.saved.length || b.want.length || b.nope.length)) bookTitles().then(route);
  const t = id => (BOOKT || {})[id] || "…";
  const list = (items, empty) => items.length ? h("ul", { class: "plain-list" }, items) : h("p", { class: "empty", text: empty });
  const tastes = b.saved.map(id => h("li", {}, [h("span", { text: t(id) }), h("span", { class: "small muted", text: " · loved it" })]))
    .concat(b.nope.map(id => h("li", {}, [h("span", { text: t(id) }), h("span", { class: "small muted", text: " · not for " + (opts.self ? "me" : "them") }) ])));
  return h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
    h("h2", { class: "h", text: "Reading and project ideas" }),
    h("div", { class: "grid2" }, [
      h("div", { class: "panel stack" }, [h("h3", { class: "h", text: "Books finished this year" }),
        h("p", { class: "empty", text: "Coming from Basecamp. Once it's connected, the books " + (opts.self ? "you finish" : name + " finishes") + " this school year will show here." })]),
      h("div", { class: "panel stack" }, [h("h3", { class: "h", text: `Book tastes (${tastes.length})` }),
        h("p", { class: "small muted", text: (opts.self ? "Books you've" : "Books " + name + " has") + " read at some point and loved, or that weren't for " + (opts.self ? "you" : "them") + ", from the Books site. Not a list of books finished this year." }),
        list(tastes, "None marked yet.")]),
      h("div", { class: "panel stack" }, [h("h3", { class: "h", text: `Wants to read (${b.want.length})` }), list(b.want.map(id => h("li", { text: t(id) })), "None saved yet.")]),
      h("div", { class: "panel stack" }, [h("h3", { class: "h", text: `Project ideas saved (${sparks.length})` }), list(sparks.map(x => h("li", { text: x.t })), "None saved yet.")])
    ])
  ]));
}
// Parents: the tracker just launched (Nov 2026), so most profiles are nearly empty. Shown until spring 2027.
function launchNote() {
  if (today() >= "2027-03-01") return null;
  return h("div", { class: "panel launch" }, [h("p", {}, [h("b", { text: "We just launched this. " }),
    "Guides started recording Life Skills passes here in November 2026, and students are only now saving books, challenges and goals on these sites. Most students have only a pass or two so far, and many have none yet. If this page looks empty, your child isn't behind. Nearly everyone's does, and it fills in over the year."])]);
}

// ---------- guides: band overview ----------
// Two ways to read it: credits passed this year per life skill, or challenges saved to each student's plan (saved/expected).
// Wide screens with a mouse get a table where pointing at a saved count lists those challenges; phones and touch
// screens get one card per student with each life skill as a tap-to-open row, so nothing depends on hover.
let ovBand = "2–4", ovFilter = "all", ovShow = "passed";
const NOHOVER = matchMedia("(max-width:760px), (hover:none)");
NOHOVER.addEventListener("change", () => { if (S.role === "staff" && (location.hash.slice(1).split("=")[0] || "overview") === "overview") route(); });
function savedList(cids) {
  return h("ul", { class: "svl" }, cids.map(c => h("li", {}, [h("i", { style: { background: colOf(c) } }), chLink(c)])));
}
// One floating list for the table's saved counts: opens on hover or keyboard focus, stays open on click (pinned),
// and stays open while the pointer is over it so its links can be clicked.
let pop = null, popFor = null, popPinned = false, popT = 0;
function popShow(btn, pin) {
  if (!pop) {
    pop = h("div", { class: "svpop", role: "dialog", "aria-modal": "false" });
    pop.addEventListener("mouseenter", () => clearTimeout(popT));
    pop.addEventListener("mouseleave", () => { if (!popPinned) popT = setTimeout(popHide, 200); });
    document.body.append(pop);
  }
  clearTimeout(popT);
  popFor = btn; popPinned = !!pin;
  const sid = btn.getAttribute("data-sid"), k = btn.getAttribute("data-k"), s = S.students[sid], list = savedBySkill(sid)[k] || [];
  pop.innerHTML = "";
  pop.setAttribute("aria-label", `${s.name}: saved ${SKILL[k].n} challenges`);
  pop.append(h("p", { class: "svh" }, [h("b", { text: firstName(s.name) }), ` · ${SKILL[k].n} · ${list.length} saved, ${goalFor(s.band)} expected this year`]),
    list.length ? savedList(list) : h("p", { class: "small muted", text: "Nothing saved in this life skill yet." }));
  const r = btn.getBoundingClientRect();
  pop.hidden = false;
  const w = pop.offsetWidth, left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
  const below = r.bottom + 8 + pop.offsetHeight < innerHeight;
  pop.style.left = left + scrollX + "px";
  pop.style.top = (below ? r.bottom + 8 : r.top - pop.offsetHeight - 8) + scrollY + "px";
  document.querySelectorAll(".svb[aria-expanded=true]").forEach(x => x.setAttribute("aria-expanded", "false"));
  btn.setAttribute("aria-expanded", "true");
}
function popHide() { if (!pop) return; pop.hidden = true; popPinned = false; if (popFor) popFor.setAttribute("aria-expanded", "false"); popFor = null; }
document.addEventListener("mouseover", e => { const b = e.target.closest && e.target.closest(".svb"); if (b && !NOHOVER.matches && !popPinned) popShow(b); });
document.addEventListener("mouseout", e => { const b = e.target.closest && e.target.closest(".svb"); if (b && !popPinned && !(e.relatedTarget && pop && pop.contains(e.relatedTarget))) popT = setTimeout(popHide, 200); });
document.addEventListener("focusin", e => { const b = e.target.closest && e.target.closest(".svb"); if (b) popShow(b, popPinned); else if (pop && !pop.contains(e.target) && !popPinned) popHide(); });
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest(".svb");
  if (b) { if (popFor === b && popPinned) popHide(); else popShow(b, true); return; }
  if (pop && !pop.hidden && !pop.contains(e.target)) popHide();
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && pop && !pop.hidden) { const f = popFor; popHide(); if (f) f.focus(); } });
addEventListener("hashchange", popHide);
addEventListener("scroll", () => { if (pop && !pop.hidden && !popPinned) popHide(); }, { passive: true });

function overview() {
  popHide();
  const all = Object.values(S.students).sort((a, b) => a.name.localeCompare(b.name));
  const inBand = all.filter(s => ovBand === "All" || s.band === ovBand);
  const sums = Object.fromEntries(inBand.map(s => [s.id, summary(s.id)]));
  const saves = Object.fromEntries(inBand.map(s => [s.id, savedBySkill(s.id)]));
  const stale = inBand.filter(s => daysAgo(sums[s.id].last) > 21);
  const open = inBand.filter(s => sums[s.id].notyets.length);
  const fresh = inBand.filter(s => sums[s.id].newMilestone);
  // Students whose plan doesn't cover what's expected this year in at least one life skill (passed + saved < expected).
  const thin = inBand.filter(s => W.skills.some(k => (sums[s.id].per[k.k] || 0) + (saves[s.id][k.k] || []).length < goalFor(s.band)));
  const rows = { all: inBand, stale, open, fresh, thin }[ovFilter] || inBand;
  const chip = (id, label) => h("button", { class: "chip", type: "button", "aria-pressed": String(ovFilter === id), text: label, onclick: () => { ovFilter = id; route(); } });
  const bandChip = b => h("button", { class: "chip", type: "button", "aria-pressed": String(ovBand === b), text: b === "All" ? "All bands" : "Grades " + b, onclick: () => { ovBand = b; route(); } });
  const showChip = (id, label) => h("button", { class: "chip", type: "button", "aria-pressed": String(ovShow === id), text: label, onclick: () => { ovShow = id; route(); } });
  const goal = goalFor(ovBand);
  const savedView = ovShow === "saved";
  const noSaves = S.saved === null;
  const cell = (s, k) => {
    const m = sums[s.id], g = goalFor(s.band);
    if (!savedView) { const v = m.per[k.k] || 0; return h("span", { class: "cnt " + (v >= g ? "g" : v ? "o" : "z"), style: v >= g ? { background: k.col } : v ? { color: k.col } : {} }, h("span", { style: v && v < g ? { color: "var(--ink)" } : {}, text: String(v) })); }
    const n = (saves[s.id][k.k] || []).length;
    return h("button", { type: "button", class: "svb" + (n >= g ? " met" : n ? " some" : ""), style: { "--c": k.col }, "data-sid": s.id, "data-k": k.k, "aria-expanded": "false", "aria-haspopup": "dialog",
      "aria-label": `${s.name}, ${k.n}: ${n} saved, goal ${g}. Show the saved challenges.` }, `${n}/${g}`);
  };
  let body;
  if (!all.length) body = h("div", { class: "panel" }, [h("p", { text: "No students yet. Add your crew first, with each student's school email and their parents' emails." }), h("div", {}, h("a", { class: "btn go", href: ROSTER + "#add", text: "Add students" }))]);
  else if (NOHOVER.matches) {
    // Phones and touch screens: a card per student; each life skill opens to show its challenges.
    body = h("div", { class: "ovcards" }, rows.map(s => {
      const m = sums[s.id], g = goalFor(s.band);
      return h("article", { class: "ovcard" }, [
        h("div", { class: "row", style: { justifyContent: "space-between" } }, [h("a", { class: "stu", href: "#s=" + s.id, text: s.name }), h("span", { class: "small muted", text: (s.band === "K–1" ? m.year + " passed" : m.trail + " credits") + " · last pass " + (m.last ? fmt(m.last) : "none") })]),
        h("div", { class: "ovskills" }, W.skills.map(k => {
          const passed = m.per[k.k] || 0, saved = saves[s.id][k.k] || [], n = savedView ? saved.length : passed;
          const kids = savedView ? (saved.length ? savedList(saved) : h("p", { class: "small muted", text: "Nothing saved here yet." }))
            : (m.passes.filter(p => (skillOf(p.cid) || {}).k === k.k && (p.date || "") >= yearStart()).length ? savedList(m.passes.filter(p => (skillOf(p.cid) || {}).k === k.k && (p.date || "") >= yearStart()).map(p => p.cid)) : h("p", { class: "small muted", text: "No passes this year yet." }));
          return h("details", { class: "ovsk", style: { "--c": k.col } }, [h("summary", {}, [h("i"), h("span", { text: k.n }), h("b", { class: n >= g ? "met" : "", text: `${n}/${g}` })]), kids]);
        }))
      ]);
    }));
  } else {
    const table = h("table", { class: "ov" }, [
      h("caption", { class: "small muted", style: { textAlign: "left", padding: "14px 18px 4px" }, text: savedView
        ? `Challenges each student has saved to their plan in each life skill (not yet passed), out of the ${goal} expected this year. Point at or tap a count to see which ones.`
        : `Credits this school year per life skill. A filled circle means the expected ${goal} are passed.` }),
      h("thead", {}, h("tr", {}, [h("th", { scope: "col", text: "Student" }), ...W.skills.map(k => h("th", { scope: "col", title: k.n, style: { borderTopColor: k.col }, text: SHORT[k.k] })),
        h("th", { scope: "col", text: savedView ? "Saved" : "This year" }), h("th", { scope: "col", text: "Trail" }), h("th", { scope: "col", style: { textAlign: "left" }, text: "Last pass" })])),
      h("tbody", {}, rows.map(s => {
        const m = sums[s.id];
        return h("tr", {}, [h("th", { scope: "row", style: { textAlign: "left", paddingLeft: "18px" } }, [h("a", { class: "stu", href: "#s=" + s.id, text: s.name }), m.newMilestone ? h("span", { class: "tag forest", style: { marginLeft: "8px" }, text: "Milestone " + m.milestone }) : null]),
          ...W.skills.map(k => h("td", {}, cell(s, k))),
          h("td", { style: { fontWeight: 700 }, text: String(savedView ? Object.values(saves[s.id]).reduce((n, l) => n + l.length, 0) : m.year) }), h("td", { text: s.band === "K–1" ? "—" : m.trail + (m.rank ? " · " + m.rank : "") }),
          h("td", { style: { textAlign: "left" }, class: daysAgo(m.last) > 21 ? "stale" : "", text: m.last ? fmt(m.last) : "None yet" })]);
      }))
    ]);
    body = h("div", { class: "tablewrap" }, table);
  }
  const said = [];
  if (stale.length) said.push(`${stale.map(s => firstName(s.name)).join(", ")} ${stale.length === 1 ? "hasn't" : "haven't"} passed a challenge in 3 weeks. Bring it up in this week's coaching: what are they working on, and what's in the way?`);
  if (fresh.length) said.push(`${fresh.map(s => firstName(s.name)).join(", ")} reached a new milestone. Call them up at the next Honor Court.`);
  if (savedView && thin.length) said.push(`${thin.length} of ${inBand.length} students haven't passed or saved enough challenges to reach what's expected in every life skill. Use "Plan short of expected" to find them.`);
  return h("div", {}, [
    head("Band overview", "Who's moving, who's stuck, who to celebrate, and what each student has saved to their plan."),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      h("div", { class: "row" }, ["All", ...BANDS].map(bandChip)),
      h("div", { class: "row", role: "group", "aria-label": "Show" }, [h("span", { class: "small muted", text: "Show:" }), showChip("passed", "Passed this year"), showChip("saved", "Saved to plan")]),
      h("div", { class: "row" }, [chip("all", `All ${inBand.length} students`), chip("stale", `No pass in 3 weeks (${stale.length})`), chip("open", `Open not yets (${open.length})`), chip("fresh", `New milestones (${fresh.length})`), chip("thin", `Plan short of expected (${thin.length})`),
        h("a", { class: "btn go", href: "#validate", style: { marginLeft: "auto" }, text: "Validate" })]),
      savedView && noSaves ? h("p", { class: "note err", text: "Couldn't read students' saved challenges. The database rules may need publishing (see firestore.rules)." }) : null,
      body,
      rows.length || !all.length ? null : h("p", { class: "empty", text: "No students match." }),
      savedView ? h("p", { class: "small muted", text: "Saved challenges come from each student's Challenges plan when they're signed in with their school account. K–1 students and anyone who hasn't signed in show 0." }) : null,
      said.length ? h("div", { class: "stack" }, said.map(t => h("p", { class: "muted", text: t }))) : null
    ]))
  ]);
}

// ---------- guides: validate (one student, or a group on one challenge) ----------
// One student: any challenge, passed or not yet. A group: one challenge (often the end of a Lab) for many students at
// once, each passed or not yet. Lab challenges that aren't on the map (lab.custom) can be found in both.
let valMode = "one", valBand = "All";
function entryFor(cid, result, date, t) {
  const c = BYID[cid] || {};
  return { cid, result, date: date || today(), credits: c.cr || 1, by: S.email, byName: S.test ? "Test guide" : firstName(S.user.displayName) || S.email.split("@")[0], created: Date.now(),
    note: result === "pass" ? String(t.note || "").trim().slice(0, 300) : "", missing: result === "notyet" ? String(t.missing || "").trim().slice(0, 300) : "",
    practice: result === "notyet" ? String(t.practice || "").trim().slice(0, 300) : "", retry: result === "notyet" ? t.retry || "" : "",
    ...(c.custom ? { ct: c.t, k: c.k, lab: c.lab || "", labTitle: c.labTitle || "" } : {}) };
}
function validateView(arg) {
  const all = Object.values(S.students).sort((a, b) => a.name.localeCompare(b.name));
  if (arg && arg.startsWith("group")) valMode = "group"; else if (arg) valMode = "one";
  const tab = (id, label) => h("a", { href: id === "one" ? "#validate=one" : "#validate=group", role: "tab", "aria-selected": String(valMode === id), class: "vtab", text: label });
  const body = !all.length ? h("div", { class: "panel" }, [h("p", { text: "Add students to your crew first, on the Student Roster." }), h("div", {}, h("a", { class: "btn go", href: ROSTER + "#add", text: "Add students" }))])
    : valMode === "group" ? validateGroup(arg && arg.startsWith("group.") ? arg.slice(6) : "") : validateOne(arg && arg !== "one" ? arg : "");
  return h("div", {}, [
    head("Validate", "Record it the day you see it. A pass marks the student's box on the wall; a not yet never goes on the wall, and always says what to practice."),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [h("div", { class: "vtabs", role: "tablist", "aria-label": "Validate" }, [tab("one", "One student"), tab("group", "A group, one challenge")]), body]))
  ]);
}
// Labs near today (two weeks back, one ahead) with challenges, for one-tap picking at the end of a Lab.
function recentLabs() {
  const now = today(), from = addDays(now, -14), to = addDays(now, 7);
  return (S.labs || []).filter(l => labEnd(l) >= from && l.date <= to && ((l.challenges || []).length || (l.custom || []).length) && (valBand === "All" || (l.bands || []).includes(valBand)))
    .sort((a, b) => Math.abs(daysAgo(labEnd(a))) - Math.abs(daysAgo(labEnd(b))));
}
function validateGroup(labId) {
  const lab = labId ? (S.labs || []).find(l => l.id === labId) : null;
  if (lab && (lab.bands || []).length === 1) valBand = lab.bands[0];
  let cid = "", lastPicked = null;
  // Each student's choice: "" (not in this group), "pass" or "notyet".
  const mark = {};
  let q = "";
  const date = h("input", { class: "in", type: "date", id: "gd", value: lab && labEnd(lab) <= today() ? labEnd(lab) : today(), max: today() });
  const gNote = h("input", { class: "in", id: "gn", maxlength: "300", placeholder: "Optional. Families see it with each pass." });
  const gMiss = h("input", { class: "in", id: "gm", maxlength: "300", placeholder: "Fire went out before the water boiled." });
  const gPrac = h("input", { class: "in", id: "gp", maxlength: "300", placeholder: "Practice building a bigger coal bed at home." });
  const gRetry = h("input", { class: "in", type: "date", id: "gr", min: today() });
  const chBox = h("div", { class: "stack" }), stuBox = h("div", { class: "stack" }), nyBox = h("div", { class: "stack" }), note = h("p", { class: "note", "aria-live": "polite" });
  const saveBtn = h("button", { class: "btn go", type: "button" });
  nyBox.append(h("p", { class: "small muted", text: "For everyone marked not yet:" }), h("div", { class: "grid2" }, [h("label", { class: "f", for: "gm" }, ["What was missing", gMiss]), h("label", { class: "f", for: "gp" }, ["How to practice", gPrac])]),
    h("label", { class: "f", for: "gr" }, [h("span", {}, ["Retry on or after ", h("span", { class: "hint", text: "(optional)" })]), gRetry]));
  const passedOn = (sid, c) => { const p = summary(sid).passes.find(x => x.cid === c); return p ? p.date : ""; };
  const inBand = s => valBand === "All" || s.band === valBand;
  const people = () => Object.values(S.students).filter(inBand).sort((a, b) => a.name.localeCompare(b.name));
  const chosen = () => Object.keys(mark).filter(k => mark[k] && S.students[k] && !viewOnly(k));
  const drawSave = () => {
    const n = chosen().length, ny = chosen().filter(k => mark[k] === "notyet").length;
    saveBtn.textContent = !cid ? "Pick a challenge first" : n ? `Validate ${n} student${n === 1 ? "" : "s"}${ny ? ` (${n - ny} passed, ${ny} not yet)` : ""}` : "Pick students";
    saveBtn.disabled = !cid || !n;
    nyBox.hidden = !ny;
  };
  const drawCh = () => {
    chBox.innerHTML = "";
    if (cid) {
      chBox.append(h("div", { class: "chosen" }, [h("span", { style: { background: colOf(cid), borderRadius: "3px", alignSelf: "stretch" } }),
        h("div", {}, [h("div", { class: "small muted", text: chMeta(cid) }), h("div", { text: chTitle(cid) }), (BYID[cid] || {}).w ? h("div", { class: "small muted", text: "How it's shown: " + BYID[cid].w }) : null]),
        h("button", { class: "btn plain", type: "button", text: "Change", onclick: () => { cid = ""; drawCh(); drawStu(); } })]));
      return;
    }
    const labs = lab ? [lab] : recentLabs().slice(0, 4);
    labs.forEach(l => {
      const cs = (l.custom || []).map(c => c.id).concat((l.challenges || []).filter(c => BYID[c]));
      chBox.append(h("div", { class: "labpick" }, [h("p", { class: "small" }, [h("b", { text: l.title }), h("span", { class: "muted", text: " · " + whenTxt(l) + " · grades " + (l.bands || []).join(", ") })]),
        h("div", { class: "row" }, cs.map(c => h("button", { class: "chip", type: "button", style: { borderLeft: "4px solid " + colOf(c) }, text: chTitle(c), onclick: () => { cid = c; drawCh(); drawStu(); } })))]));
    });
    chBox.append(h("label", { class: "f", for: "gc" }, [labs.length ? "Or search every challenge (Lab challenges included)" : "Search every challenge (Lab challenges included)",
      picker({ id: "gc", band: () => valBand === "All" ? null : valBand, onpick: c => { cid = c; drawCh(); drawStu(); } })]));
  };
  const drawStu = () => {
    stuBox.innerHTML = "";
    const list = people().filter(s => !q || s.name.toLowerCase().includes(q));
    const search = h("input", { class: "in", type: "search", id: "gq", value: q, placeholder: "Find a student", style: { maxWidth: "260px" } });
    search.addEventListener("input", () => { q = search.value.trim().toLowerCase(); const pos = search.selectionStart; drawStu(); const n = $("#gq"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } });
    const open = list.filter(s => !(cid && passedOn(s.id, cid)) && !viewOnly(s.id));
    stuBox.append(h("div", { class: "row" }, [...["All", ...BANDS].map(b => h("button", { class: "chip", type: "button", "aria-pressed": String(valBand === b), text: b === "All" ? "All bands" : "Grades " + b, onclick: () => { valBand = b; drawStu(); drawSave(); } })),
      h("span", { style: { marginLeft: "auto" } }), search]));
    stuBox.append(h("div", { class: "row" }, [
      h("button", { class: "btn", type: "button", text: `Everyone shown passed (${open.length})`, disabled: !open.length, onclick: () => { open.forEach(s => mark[s.id] = "pass"); drawStu(); drawSave(); } }),
      h("button", { class: "btn plain", type: "button", text: "Clear", onclick: () => { Object.keys(mark).forEach(k => delete mark[k]); drawStu(); drawSave(); } }),
      h("span", { class: "small muted", text: "Tap a name to add it as passed; tap Not yet for anyone who isn't there yet. Shift-click to add a run of names." })]));
    if (!list.length) { stuBox.append(h("p", { class: "empty", text: "No students match." })); return; }
    stuBox.append(h("div", { class: "vgrid" }, list.map((s, i) => {
      const done = cid ? passedOn(s.id, cid) : "", m = mark[s.id] || "", vo = viewOnly(s.id);
      const toggle = ev => {
        if (done || vo) return;
        if (ev.shiftKey && lastPicked != null) { const [a, b] = [Math.min(lastPicked, i), Math.max(lastPicked, i)]; list.slice(a, b + 1).forEach(x => { if (!(cid && passedOn(x.id, cid)) && !viewOnly(x.id)) mark[x.id] = "pass"; }); }
        else mark[s.id] = m ? "" : "pass";
        lastPicked = i; drawStu(); drawSave();
      };
      return h("div", { class: "vrow" + (m ? " " + m : "") + (done ? " done" : "") }, [
        h("button", { type: "button", class: "vname", "aria-pressed": String(!!m), disabled: !!done || vo, title: vo ? VO_MSG : null, onclick: toggle },
          [h("span", { class: "vbox", "aria-hidden": "true", text: m === "pass" ? "✓" : m === "notyet" ? "…" : "" }), h("span", {}, [h("b", { text: s.name }), h("small", { text: done ? "Already passed " + fmt(done) : vo ? "Real student · view only in Test view" : "Grades " + s.band })])]),
        m ? h("div", { class: "seg small", role: "group", "aria-label": s.name }, [["pass", "Passed"], ["notyet", "Not yet"]].map(([v, l]) => h("button", { type: "button", "aria-pressed": String(m === v), text: l, onclick: () => { mark[s.id] = v; drawStu(); drawSave(); } }))) : null
      ]);
    })));
  };
  saveBtn.addEventListener("click", async () => {
    const ids = chosen();
    note.className = "note err";
    if (!cid || !ids.length) return;
    if (ids.some(k => mark[k] === "notyet") && (!gMiss.value.trim() || !gPrac.value.trim())) { note.textContent = "A not yet needs what was missing and how to practice (shared by everyone marked not yet)."; return; }
    saveBtn.disabled = true; note.className = "note"; note.textContent = "Saving…";
    try {
      const before = Object.fromEntries(ids.map(k => [k, summary(k)]));
      const batch = writeBatch(db), made = [];
      ids.forEach(k => { const ref = doc(collection(db, "lsStudents", k, "entries")), e = entryFor(cid, mark[k], date.value, { note: gNote.value, missing: gMiss.value, practice: gPrac.value, retry: gRetry.value }); batch.set(ref, e); made.push([k, ref.id, e]); });
      await batch.commit();
      made.forEach(([k, id, e]) => { S.entries[k] = (S.entries[k] || []).concat({ id, ...e }); });
      // The crew board copies, in one more batch.
      const b2 = writeBatch(db);
      ids.forEach(k => { const b = boardDoc(k); b2.set(doc(db, "lsBoard", k), b); S.boards[k] = { id: k, ...b }; });
      await b2.commit();
      ids.forEach(k => tellPass(k, cid, mark[k], { missing: gMiss.value, practice: gPrac.value }));
      const passed = ids.filter(k => mark[k] === "pass"), ny = ids.length - passed.length;
      const miles = passed.filter(k => S.students[k].band !== "K–1" && summary(k).milestone > before[k].milestone).map(k => firstName(S.students[k].name));
      const msg = `Validated ${chTitle(cid)}: ${passed.length} passed${ny ? `, ${ny} not yet` : ""}.` + (miles.length ? ` New milestone for ${miles.join(", ")}: add ${miles.length === 1 ? "them" : "them all"} to the next Honor Court.` : "");
      note.className = "note ok"; note.textContent = msg; toast(msg);
      ids.forEach(k => delete mark[k]); drawStu(); drawSave();
    } catch (x) { note.className = "note err"; note.textContent = errText(x); drawSave(); }
  });
  drawCh(); drawStu(); drawSave();
  return h("div", { class: "panel stack" }, [
    h("div", { class: "f" }, [h("span", { class: "f", text: "1. The challenge" }), chBox]),
    h("div", { class: "f" }, [h("span", { text: "2. Who passed" }), stuBox]),
    nyBox,
    h("div", { class: "grid2" }, [h("label", { class: "f", for: "gd" }, ["Date", date]), h("label", { class: "f", for: "gn" }, [h("span", {}, ["What stood out ", h("span", { class: "hint", text: "(optional)" })]), gNote])]),
    h("div", { class: "row" }, [saveBtn]),
    note
  ]);
}
function validateOne(pre) {
  const all = Object.values(S.students).sort((a, b) => a.name.localeCompare(b.name));

  let sid = pre && S.students[pre] ? pre : "", cid = "", result = "pass";
  const sel = h("select", { class: "in", id: "ls" }, [h("option", { value: "", text: "Choose a student" }), ...BANDS.slice().sort((a, b) => (b === valBand) - (a === valBand)).map(b => { const ss = all.filter(s => s.band === b); return ss.length ? h("optgroup", { label: "Grades " + b }, ss.map(s => h("option", { value: s.id, text: s.name, selected: s.id === sid }))) : null; })]);
  const chosen = h("div");
  const pickBox = h("div");
  const resBox = h("div", { class: "seg" });
  const fields = h("div", { class: "stack" });
  const note = h("p", { class: "note", "aria-live": "polite" });
  const date = h("input", { class: "in", type: "date", id: "ld", value: today(), max: today() });
  const tStood = h("textarea", { class: "in", id: "lsn", maxlength: "300", placeholder: "Ran the last lap faster than the first." });
  const tMiss = h("input", { class: "in", id: "lm", maxlength: "300", placeholder: "Walked about 20 seconds on lap 3." });
  const tPrac = h("input", { class: "in", id: "lp", maxlength: "300", placeholder: "Run-walk 3 times this week, shorter walks." });
  const tRetry = h("input", { class: "in", type: "date", id: "lr", min: today() });
  const drawChosen = () => {
    chosen.innerHTML = ""; pickBox.innerHTML = "";
    if (cid) chosen.append(h("div", { class: "chosen" }, [h("span", { style: { background: colOf(cid), borderRadius: "3px", alignSelf: "stretch" } }), h("div", {}, [h("div", { class: "small muted", text: chMeta(cid) + ", " + ((BYID[cid] || {}).cr || 1) + " credit" + (((BYID[cid] || {}).cr || 1) > 1 ? "s" : "") }), h("div", { text: chTitle(cid) }), h("div", { class: "small muted", text: "How it's shown: " + ((BYID[cid] || {}).w || "") })]), h("button", { class: "btn plain", type: "button", text: "Change", onclick: () => { cid = ""; drawChosen(); } })]));
    else pickBox.append(picker({ id: "lc", band: () => (S.students[sid] || {}).band, onpick: c => { cid = c; drawChosen(); } }));
  };
  const drawRes = () => {
    resBox.innerHTML = "";
    [["pass", "Passed"], ["notyet", "Not yet"]].forEach(([v, l]) => resBox.append(h("button", { type: "button", "aria-pressed": String(result === v), text: l, onclick: () => { result = v; drawRes(); } })));
    fields.innerHTML = "";
    if (result === "pass") fields.append(h("label", { class: "f", for: "lsn" }, [h("span", {}, ["What stood out ", h("span", { class: "hint", text: "(optional; the family and student see it)" })]), tStood]));
    else fields.append(h("label", { class: "f", for: "lm" }, ["What was missing", tMiss]), h("label", { class: "f", for: "lp" }, ["How to practice", tPrac]), h("label", { class: "f", for: "lr" }, [h("span", {}, ["Retry on or after ", h("span", { class: "hint", text: "(optional)" })]), tRetry]));
  };
  sel.addEventListener("change", () => { sid = sel.value; });
  drawChosen(); drawRes();
  const save = async () => {
    note.className = "note err";
    if (!sid) { note.textContent = "Choose a student."; return; }
    if (viewOnly(sid)) { note.textContent = VO_MSG; return; }
    if (!cid) { note.textContent = "Choose a challenge."; return; }
    if (result === "notyet" && (!tMiss.value.trim() || !tPrac.value.trim())) { note.textContent = "A not yet needs what was missing and how to practice."; return; }
    const before = summary(sid);
    const e = entryFor(cid, result, date.value, { note: tStood.value, missing: tMiss.value, practice: tPrac.value, retry: tRetry.value });
    try {
      const ref = await addDoc(collection(db, "lsStudents", sid, "entries"), e);
      S.entries[sid] = (S.entries[sid] || []).concat({ id: ref.id, ...e });
      await saveBoard(sid);
      tellPass(sid, cid, result, { missing: tMiss.value, practice: tPrac.value });
      const after = summary(sid), name = firstName(S.students[sid].name);
      let msg = result === "pass" ? `Validated ${name}'s pass.` : `Saved a not yet for ${name}. The family sees what to practice.`;
      if (result === "pass" && after.milestone > before.milestone && S.students[sid].band !== "K–1") msg = `Milestone: that's ${name}'s ${ordinal(after.trail)} credit. Add ${name} to the next Honor Court.` + (after.rank !== before.rank ? ` New rank: ${after.rank}.` : "");
      note.className = "note ok"; note.textContent = msg; toast(msg);
      cid = ""; tStood.value = tMiss.value = tPrac.value = tRetry.value = ""; drawChosen();
    } catch (x) { note.textContent = errText(x); }
  };
  return h("div", { class: "panel stack", style: { maxWidth: "720px" } }, [
      h("label", { class: "f", for: "ls" }, ["Student", sel]),
      h("div", { class: "f" }, [h("label", { class: "f", for: "lc", text: "Challenge" }), chosen, pickBox]),
      h("div", { class: "f" }, [h("span", { text: "Result" }), resBox]),
      fields,
      h("label", { class: "f", for: "ld" }, ["Date", date]),
      h("div", { class: "row" }, [h("button", { class: "btn go", type: "button", text: "Validate", onclick: save }), sid ? h("a", { class: "btn plain", href: "#s=" + sid, text: "Open this student's record" }) : null]),
      note
  ]);
}

// ---------- guides: students and parent matching ----------
// Adding and editing students, linking parents and CSV import moved to the Student Roster (/guides/roster/app.js).

// ---------- Life Skill Labs schedule ----------
// Guides add and edit Labs; parents see the Labs for their children's grade bands, with any notes and files on how to
// support the Lab at home. Data: labs/{id} in Firestore (rules in /firestore.rules), files in Firebase Storage under
// labs/{id}/ (rules in /storage.rules). Parents can read Labs only once a guide has linked them to a child
// (lsParents/{email}, kept in step by the Student Roster).
const STORAGE_SDK = "https://www.gstatic.com/firebasejs/13.3.0/firebase-storage.js";
const MAX_FILE = 20 * 1024 * 1024;
let calMonth = null, calBand = "All";
const todayISO = () => today();
const labEnd = l => l.endDate && l.endDate >= l.date ? l.endDate : l.date;
const labOn = (l, iso) => l.date <= iso && labEnd(l) >= iso;
const timeTxt = t => { if (!t) return ""; const [hh, mm] = t.split(":").map(Number); const d = new Date(2000, 0, 1, hh, mm); return d.toLocaleTimeString("en-US", { hour: "numeric", minute: mm ? "2-digit" : undefined }); };
const whenTxt = l => {
  const d = fmt(l.date) + (l.endDate && l.endDate > l.date ? " to " + fmt(l.endDate) : "");
  const wd = new Date(l.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
  return wd + ", " + d + (l.start ? " · " + timeTxt(l.start) + (l.end ? "–" + timeTxt(l.end) : "") : "");
};
const sizeTxt = n => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
async function loadLabs(force) {
  if (S.labs && !force) return S.labs;
  const snap = await getDocs(collection(db, "labs"));
  // Labs added in a test view are only shown in test views.
  S.labs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => S.test || !l.test).sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.start || "").localeCompare(b.start || ""));
  S.labs.forEach(l => (l.custom || []).forEach(c => addCustom(c, l)));
  return S.labs;
}
// Which bands a parent's view shows: their children's.
function myBands() { const b = new Set(S.mine.map(id => (S.students[id] || {}).band)); return BANDS.filter(x => b.has(x)); }
function childrenIn(band) { return S.mine.filter(id => (S.students[id] || {}).band === band).map(id => firstName(S.students[id].name)); }
function labsFor(staff) {
  const bands = staff ? (calBand === "All" ? BANDS : [calBand]) : myBands();
  return (S.labs || []).filter(l => (l.bands || []).some(b => bands.includes(b)));
}

function scheduleView(arg, staff) {
  const box = h("div", {}, h("p", { class: "loading", text: "Loading the schedule…" }));
  loadLabs().then(() => {
    box.innerHTML = "";
    if (staff && arg === "new") box.append(labForm(null));
    else if (staff && arg && arg.startsWith("edit.")) { const l = S.labs.find(x => x.id === arg.slice(5)); box.append(!l ? notFound() : canEditLab(l) ? labForm(l) : labDetail(l, staff)); }
    else if (arg) { const l = S.labs.find(x => x.id === arg); box.append(l ? labDetail(l, staff) : notFound()); }
    else box.append(calendar(staff));
  }).catch(e => {
    box.innerHTML = "";
    box.append(head("Labs schedule"), h("div", { class: "wrap" }, h("p", { class: "empty", text: e.code === "permission-denied"
      ? (staff ? "The database rules for the Labs schedule aren't published yet. Paste firestore.rules into the Firebase console." : "Your account isn't linked to a child yet, or the school hasn't finished setting up the schedule. Ask your child's guide.")
      : "Couldn't load the schedule. Check your connection and reload." })));
  });
  return box;
}
const notFound = () => h("div", {}, [head("Lab not found"), h("div", { class: "wrap" }, h("a", { class: "btn", href: "#schedule", text: "Back to the schedule" }))]);

// School days only: Labs never show on a Saturday or Sunday. A Lab that runs several days is one bar across those days
// with its name once; it breaks only at a weekend (the next week's row), with an arrow showing it carries on.
const dow = iso => new Date(iso + "T12:00:00").getDay();
const isWeekend = iso => { const d = dow(iso); return d === 0 || d === 6; };
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
function weekRows(y, m, list, now) {
  const first = `${y}-${String(m).padStart(2, "0")}-01`, last = addDays(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`, -1);
  let mon = addDays(first, -((dow(first) + 6) % 7));
  // A month that starts on a weekend begins with the first school week.
  if (addDays(mon, 4) < first) mon = addDays(mon, 7);
  const rows = [];
  for (; mon <= last; mon = addDays(mon, 7)) {
    const fri = addDays(mon, 4), days = [0, 1, 2, 3, 4].map(i => addDays(mon, i));
    const segs = [];
    list.forEach(l => {
      const a = l.date > mon ? l.date : mon, b = labEnd(l) < fri ? labEnd(l) : fri;
      if (a > b) return;
      segs.push({ l, c0: days.indexOf(a), c1: days.indexOf(b), contL: a > l.date, contR: b < labEnd(l) });
    });
    // Stack bars in lanes so they never overlap: longest first, each in the first lane it fits.
    segs.sort((p, q) => p.c0 - q.c0 || (q.c1 - q.c0) - (p.c1 - p.c0));
    const lanes = [];
    segs.forEach(g => { let i = lanes.findIndex(end => end < g.c0); if (i < 0) { i = lanes.length; lanes.push(-1); } lanes[i] = g.c1; g.lane = i; });
    rows.push({ days, segs, lanes: lanes.length, out: d => d.slice(0, 7) !== first.slice(0, 7), today: d => d === now });
  }
  return rows;
}
function calendar(staff) {
  const now = todayISO();
  if (!calMonth) calMonth = now.slice(0, 7);
  const [y, m] = calMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const list = labsFor(staff);
  const move = n => { const d = new Date(y, m - 1 + n, 1); calMonth = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); route(); };
  const weeks = weekRows(y, m, list, now).map(w => h("div", { class: "cal-wk" }, [
    ...w.days.map((d, i) => h("div", { class: "cal-d" + (w.out(d) ? " out" : "") + (w.today(d) ? " today" : ""), style: { gridColumn: String(i + 1), gridRow: `1 / span ${w.lanes + 1}` }, "aria-hidden": "true" })),
    ...w.days.map((d, i) => h("span", { class: "cal-n" + (w.out(d) ? " out" : "") + (w.today(d) ? " today" : ""), style: { gridColumn: String(i + 1) }, text: String(Number(d.slice(8))) })),
    ...w.segs.map(g => h("a", { class: "cal-bar" + (g.contL ? " cont-l" : "") + (g.contR ? " cont-r" : ""), href: "#schedule=" + g.l.id,
      style: { "--c": bandCol(g.l), gridColumn: `${g.c0 + 1} / ${g.c1 + 2}`, gridRow: String(g.lane + 2) },
      title: g.l.title + " · " + whenTxt(g.l), text: (!g.contL && g.l.start ? timeTxt(g.l.start) + " " : "") + g.l.title }))
  ]));
  const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const inMonth = list.filter(l => l.date.slice(0, 7) <= calMonth && labEnd(l).slice(0, 7) >= calMonth);
  const upcoming = list.filter(l => labEnd(l) >= now), past = list.filter(l => labEnd(l) < now).reverse();
  const bands = staff ? ["All", ...BANDS] : null;
  const kids = staff ? null : myBands();
  return h("div", {}, [
    staff && PATH === HOMES.staff ? h("div", { class: "wrap labtabs-wrap" }, h("nav", { class: "labtabs", "aria-label": "Labs", html: window.WLLabTabs ? window.WLLabTabs("schedule") : "" })) : null,
    h("div", { class: "wrap page-head" }, h("div", { class: "who" }, [
      h("div", {}, [h("h1", { text: "Life Skill Labs" }), h("p", { text: staff ? "The guide-led Labs for every band. Add a Lab, attach anything parents could use to support it at home, and families see it on their Life Skills page." : `Labs your ${S.mine.length > 1 ? "children are" : "child is"} doing at school${kids.length ? " (grades " + kids.join(", ") + ")" : ""}, and how you can support them at home if you'd like to.` })]),
      staff ? h("div", { class: "row noprint" }, [h("a", { class: "btn", href: "#validate=group", text: "Validate a Lab" }), h("a", { class: "btn go", href: "#schedule=new", text: "Add a Lab" })]) : null
    ])),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      bands ? h("div", { class: "row" }, bands.map(b => h("button", { class: "chip", type: "button", "aria-pressed": String(calBand === b), text: b === "All" ? "All bands" : "Grades " + b, onclick: () => { calBand = b; route(); } }))) : null,
      h("div", { class: "cal-head" }, [h("button", { class: "btn plain", type: "button", "aria-label": "Previous month", text: "←", onclick: () => move(-1) }), h("h2", { class: "h", text: monthName }), h("button", { class: "btn plain", type: "button", "aria-label": "Next month", text: "→", onclick: () => move(1) }),
        calMonth !== now.slice(0, 7) ? h("button", { class: "btn plain", type: "button", text: "This month", onclick: () => { calMonth = now.slice(0, 7); route(); } }) : null]),
      // Week rows on wide screens; on phones the list for the month below is the calendar.
      h("div", { class: "cal", role: "presentation" }, [h("div", { class: "cal-wd" }, ["Mon", "Tue", "Wed", "Thu", "Fri"].map(d => h("div", { class: "cal-w", text: d }))), ...weeks]),
      h("div", { class: "cal-list" }, [h("h3", { class: "h", text: "In " + first.toLocaleDateString("en-US", { month: "long" }) }), inMonth.length ? h("div", { class: "items" }, inMonth.map(l => labRow(l, staff))) : h("p", { class: "empty", text: "No Labs this month." })])
    ])),
    h("section", { class: "band tint" }, h("div", { class: "wrap stack" }, [
      h("h2", { class: "h", text: `Coming up (${upcoming.length})` }),
      upcoming.length ? h("div", { class: "items" }, upcoming.slice(0, 30).map(l => labRow(l, staff))) : h("p", { class: "empty", text: staff ? "Nothing scheduled yet. Add the first Lab." : "Nothing scheduled yet. Check back soon." }),
      past.length ? h("details", {}, [h("summary", { class: "small", text: `Past Labs (${past.length})` }), h("div", { class: "items", style: { marginTop: "10px" } }, past.slice(0, 60).map(l => labRow(l, staff)))]) : null
    ]))
  ]);
}
// In a test view, real Labs can be read but not changed (only Labs added in a test view can).
const canEditLab = l => !S.test || !!l.test;
function bandCol(l) { const b = (l.bands || [])[0]; return b === "K–1" ? "#356B33" : b === "2–4" ? "#2F5D8A" : b === "5–8" ? "#6E4382" : "#015640"; }
function labRow(l, staff) {
  const extras = [(l.files || []).length + (l.links || []).length ? `${(l.files || []).length + (l.links || []).length} file${(l.files || []).length + (l.links || []).length === 1 ? "" : "s"} or link${(l.files || []).length + (l.links || []).length === 1 ? "" : "s"} for home` : "", l.home ? "home notes" : ""].filter(Boolean);
  return h("div", { class: "item" }, [h("span", { class: "bar", style: { background: bandCol(l) } }),
    h("div", {}, [h("div", { class: "meta" }, [h("b", { text: whenTxt(l) }), " · grades " + (l.bands || []).join(", ") + (l.where ? " · " + l.where : "")]),
      h("div", { class: "t" }, h("a", { href: "#schedule=" + l.id, text: l.title })),
      !staff ? h("div", { class: "small muted", text: (l.bands || []).flatMap(childrenIn).filter((x, i, a) => a.indexOf(x) === i).join(", ") }) : null,
      extras.length ? h("div", { class: "small muted", text: extras.join(" · ") }) : null]),
    staff && canEditLab(l) ? h("a", { class: "btn", href: "#schedule=edit." + l.id, text: "Edit" }) : h("span")]);
}
function labDetail(l, staff) {
  const files = l.files || [], links = l.links || [];
  return h("div", {}, [
    h("div", { class: "wrap page-head" }, [h("p", { class: "small" }, h("a", { href: "#schedule", text: "← Labs schedule" })),
      h("div", { class: "who" }, [h("div", {}, [h("h1", { text: l.title }), h("p", { text: [whenTxt(l), "Grades " + (l.bands || []).join(", "), l.where, l.guides ? "With " + l.guides : ""].filter(Boolean).join(" · ") })]),
        staff && canEditLab(l) ? h("div", { class: "row noprint" }, h("a", { class: "btn go", href: "#schedule=edit." + l.id, text: "Edit this Lab" })) : null])]),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      l.about ? h("div", { class: "panel" }, [h("h2", { class: "h", text: "What we'll do" }), h("p", { class: "pre", text: l.about })]) : null,
      (l.challenges || []).length || (l.custom || []).length ? h("div", { class: "panel" }, [h("h2", { class: "h", text: "Challenges in this Lab" }),
        (l.challenges || []).length ? savedList(l.challenges.filter(c => BYID[c])) : null,
        (l.custom || []).length ? h("ul", { class: "svl" }, l.custom.map(c => h("li", {}, [h("i", { style: { background: (SKILL[c.k] || {}).col || "#4d4d51" } }), h("span", {}, [h("b", { text: c.t }), h("span", { class: "muted", text: " · " + ((SKILL[c.k] || {}).n || "") + (c.w ? ". How it's shown: " + c.w : "") })])]))) : null,
        (l.challenges || []).length ? h("p", { class: "small muted", text: "Tap a challenge to see its standard, steps and how it's shown." }) : null,
        staff ? h("div", { class: "row noprint" }, h("a", { class: "btn go", href: "#validate=group." + l.id, text: "Validate students for this Lab" })) : null]) : null,
      h("div", { class: "panel home-support" }, [h("h2", { class: "h", text: "Supporting it at home" }),
        l.home ? h("p", { class: "pre", text: l.home }) : h("p", { class: "muted", text: "Nothing extra needed at home for this one." }),
        files.length || links.length ? h("ul", { class: "files" }, [
          ...files.map(f => h("li", {}, [h("a", { href: f.url, target: "_blank", rel: "noopener", text: f.name }), h("span", { class: "small muted", text: " · " + sizeTxt(f.size || 0) })])),
          ...links.map(k => h("li", {}, h("a", { href: k.url, target: "_blank", rel: "noopener", text: k.label || k.url })))]) : null,
        staff ? null : h("p", { class: "small muted", text: "All of this is optional. Questions? Ask " + (() => { const g = [...new Set(S.mine.map(id => S.students[id]).filter(x => x && (l.bands || []).includes(x.band)).flatMap(guidesOf))].map(guideName); return g.length ? orList(g) : "your child's guide"; })() + "." })])
    ]))
  ]);
}

function labForm(l) {
  const isNew = !l; l = l || { bands: [], challenges: [], files: [], links: [] };
  const id = isNew ? doc(collection(db, "labs")).id : l.id;
  const f = {
    title: h("input", { class: "in", id: "lt", maxlength: "120", value: l.title || "", placeholder: "Fire-building Lab" }),
    date: h("input", { class: "in", id: "ld", type: "date", value: l.date || "" }),
    // (Saturdays and Sundays are refused on save.)
    endDate: h("input", { class: "in", id: "le2", type: "date", value: l.endDate || "" }),
    start: h("input", { class: "in", id: "ls1", type: "time", value: l.start || "" }),
    end: h("input", { class: "in", id: "ls2", type: "time", value: l.end || "" }),
    where: h("input", { class: "in", id: "lw", maxlength: "120", value: l.where || "", placeholder: "Back field, or Eden Park" }),
    guides: h("input", { class: "in", id: "lg", maxlength: "160", value: l.guides != null ? l.guides : firstName(S.user.displayName || ""), placeholder: "April and Shanan" }),
    about: h("textarea", { class: "in", id: "la", maxlength: "3000", rows: "5", text: l.about || "", placeholder: "What students will do and practice." }),
    home: h("textarea", { class: "in", id: "lh", maxlength: "3000", rows: "5", text: l.home || "", placeholder: "Optional. What parents can do at home: questions to ask, something to practice together, what to pack." })
  };
  const bands = BANDS.map(b => { const c = h("input", { type: "checkbox", value: b, checked: (l.bands || []).includes(b) }); return [b, c]; });
  let chs = (l.challenges || []).slice(), files = (l.files || []).slice(), links = (l.links || []).map(x => ({ ...x })), adds = [], drops = [];
  // Challenges this Lab introduces that aren't on the challenge map. Each keeps its id once made (entries point at it).
  let customs = (l.custom || []).map(x => ({ ...x }));
  const newId = () => "LB-" + Array.from(crypto.getRandomValues(new Uint8Array(6)), b => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");
  const customBox = h("div", { class: "stack" });
  const drawCustom = () => {
    customBox.innerHTML = "";
    customs.forEach((c, i) => {
      const t = h("input", { class: "in", value: c.t || "", maxlength: "120", placeholder: "Build a fire that boils water in 10 minutes", "aria-label": "Challenge", oninput: e => { c.t = e.target.value; } });
      const k = h("select", { class: "in", "aria-label": "Life skill", onchange: e => { c.k = e.target.value; } }, [h("option", { value: "", text: "Life skill…" }), ...W.skills.map(x => h("option", { value: x.k, text: x.n, selected: c.k === x.k }))]);
      const w = h("input", { class: "in", value: c.w || "", maxlength: "200", placeholder: "How it's shown (optional): in front of a guide, start to finish", "aria-label": "How it's shown", oninput: e => { c.w = e.target.value; } });
      customBox.append(h("div", { class: "customrow" }, [t, k, w, h("button", { class: "btn plain", type: "button", text: "Remove", onclick: () => { customs.splice(i, 1); drawCustom(); } })]));
    });
    if (customs.length < 8) customBox.append(h("div", {}, h("button", { class: "btn", type: "button", text: customs.length ? "Add another" : "Add a challenge this Lab introduces", onclick: () => { customs.push({ id: newId(), t: "", k: "", w: "" }); drawCustom(); } })));
  };
  const chBox = h("div", { class: "stack" }), fileBox = h("div", { class: "stack" }), linkBox = h("div", { class: "stack" });
  const drawCh = () => { chBox.innerHTML = ""; if (chs.length) chBox.append(h("div", { class: "items" }, chs.map(c => h("div", { class: "item" }, [h("span", { class: "bar", style: { background: colOf(c) } }), h("div", {}, [h("div", { class: "meta", text: chMeta(c) }), h("div", { class: "t" }, chLink(c))]), h("button", { class: "btn danger", type: "button", text: "Remove", onclick: () => { chs = chs.filter(x => x !== c); drawCh(); } })])))); if (chs.length < 8) chBox.append(picker({ id: "lch", band: () => { const b = bands.filter(x => x[1].checked).map(x => x[0]); return b.length === 1 ? b[0] : null; }, onpick: c => { if (!chs.includes(c)) chs.push(c); drawCh(); } })); };
  const drawFiles = () => {
    fileBox.innerHTML = "";
    const rows = [...files.map((x, i) => h("li", {}, [h("a", { href: x.url, target: "_blank", rel: "noopener", text: x.name }), h("span", { class: "small muted", text: " · " + sizeTxt(x.size || 0) + " " }), h("button", { class: "btn plain", type: "button", text: "Remove", onclick: () => { drops.push(x); files.splice(i, 1); drawFiles(); } })])),
      ...adds.map((x, i) => h("li", {}, [h("span", { text: x.name }), h("span", { class: "small muted", text: " · " + sizeTxt(x.size) + " · uploads when you save " }), h("button", { class: "btn plain", type: "button", text: "Remove", onclick: () => { adds.splice(i, 1); drawFiles(); } })]))];
    if (rows.length) fileBox.append(h("ul", { class: "files" }, rows));
    const inp = h("input", { type: "file", multiple: true, class: "in", id: "lf" });
    inp.addEventListener("change", () => { [...inp.files].forEach(x => { if (x.size > MAX_FILE) toast(`${x.name} is over 20 MB. Share it as a Google Drive link instead.`); else adds.push(x); }); drawFiles(); });
    fileBox.append(h("label", { class: "f", for: "lf" }, [h("span", {}, ["Attach files ", h("span", { class: "hint", text: "(PDFs, photos, documents; up to 20 MB each)" })]), inp]));
  };
  const drawLinks = () => {
    linkBox.innerHTML = "";
    links.forEach((k, i) => {
      const lab = h("input", { class: "in", value: k.label || "", placeholder: "What it is", "aria-label": "Link name", oninput: e => { k.label = e.target.value; } });
      const url = h("input", { class: "in", type: "url", value: k.url || "", placeholder: "https://docs.google.com/…", "aria-label": "Link address", oninput: e => { k.url = e.target.value.trim(); } });
      linkBox.append(h("div", { class: "row linkrow" }, [lab, url, h("button", { class: "btn plain", type: "button", text: "Remove", onclick: () => { links.splice(i, 1); drawLinks(); } })]));
    });
    if (links.length < 8) linkBox.append(h("div", {}, h("button", { class: "btn", type: "button", text: "Add a link", onclick: () => { links.push({ label: "", url: "" }); drawLinks(); } })));
  };
  drawCh(); drawCustom(); drawFiles(); drawLinks();
  const note = h("p", { class: "note", "aria-live": "polite" });
  const say = (t, c) => { note.className = "note " + (c || ""); note.textContent = t; };
  const save = async ev => {
    const title = f.title.value.trim().replace(/\s+/g, " "), date = f.date.value, endDate = f.endDate.value, picked = bands.filter(x => x[1].checked).map(x => x[0]);
    if (title.length < 3) return say("Give the Lab a name.", "err");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return say("Pick the date.", "err");
    if (endDate && endDate < date) return say("The last day is before the first day.", "err");
    // We don't run Labs on weekends (a Lab may run over one, from a Friday to a Monday).
    if (isWeekend(date) || (endDate && isWeekend(endDate))) return say("Labs start and end on a school day (Monday to Friday). We don't run Labs on weekends.", "err");
    const okCustom = customs.filter(c => (c.t || "").trim());
    if (okCustom.some(c => !SKILL[c.k])) return say("Pick a life skill for each challenge this Lab introduces.", "err");
    if (!picked.length) return say("Pick at least one grade band.", "err");
    if (f.start.value && f.end.value && f.end.value <= f.start.value) return say("The end time is before the start time.", "err");
    const okLinks = links.filter(k => k.url || k.label);
    if (okLinks.some(k => !/^https:\/\/[^\s]+\.[^\s]+/.test(k.url))) return say("Each link needs a full address starting with https://", "err");
    ev.target.disabled = true;
    try {
      let uploaded = [];
      if (adds.length || drops.length) {
        say(adds.length ? `Uploading ${adds.length} file${adds.length === 1 ? "" : "s"}…` : "Saving…");
        const st = await import(STORAGE_SDK), store = st.getStorage(app);
        if (EMU && !store._wlEmu) { st.connectStorageEmulator(store, "127.0.0.1", 9199); store._wlEmu = true; }
        for (const x of adds) {
          const path = `labs/${id}/${Date.now()}-${x.name.replace(/[^\w.\- ]+/g, "_").slice(0, 80)}`;
          const r = st.ref(store, path);
          await st.uploadBytes(r, x, { contentType: x.type || "application/octet-stream" });
          uploaded.push({ name: x.name.slice(0, 120), path, size: x.size, type: x.type || "", url: await st.getDownloadURL(r) });
        }
        for (const x of drops) { try { await st.deleteObject(st.ref(store, x.path)); } catch (e) { /* already gone */ } }
      }
      say("Saving…");
      const data = { title, date, endDate: endDate && endDate > date ? endDate : "", start: f.start.value, end: f.end.value, bands: picked, where: f.where.value.trim(), guides: f.guides.value.trim(),
        about: f.about.value.trim(), home: f.home.value.trim(), challenges: chs.slice(0, 8),
        custom: okCustom.slice(0, 8).map(c => ({ id: c.id, t: c.t.trim().replace(/\s+/g, " ").slice(0, 120), k: c.k, w: (c.w || "").trim().slice(0, 200) })), files: files.concat(uploaded), links: okLinks.map(k => ({ label: (k.label || "").trim().slice(0, 80), url: k.url.slice(0, 500) })),
        updated: Date.now(), updatedBy: S.email, ...(isNew ? { created: Date.now(), createdBy: S.email } : {}), ...((isNew && S.test) || l.test ? { test: true } : {}) };
      await setDoc(doc(db, "labs", id), data, { merge: !isNew });
      S.labs = null; toast(isNew ? "Lab added. Parents in those bands can see it now." : "Saved."); location.hash = "#schedule=" + id;
    } catch (e) {
      ev.target.disabled = false;
      const c = String(e.code || "");
      say(c.startsWith("storage/") ? "Couldn't upload the files. File storage may not be switched on for the school's Firebase project yet (it needs the Blaze plan). Use a Google Drive link for now, and tell Alex." : errText(e), "err");
    }
  };
  let confirmDel = false;
  const del = isNew ? null : h("button", { class: "btn danger", type: "button", style: { marginLeft: "auto" }, text: "Delete this Lab", onclick: async ev => {
    if (!confirmDel) { confirmDel = true; ev.target.textContent = "Delete it for everyone? Click again."; return; }
    try {
      if ((l.files || []).length) { try { const st = await import(STORAGE_SDK), store = st.getStorage(app); for (const x of l.files) { try { await st.deleteObject(st.ref(store, x.path)); } catch (e) { } } } catch (e) { } }
      await deleteDoc(doc(db, "labs", id)); S.labs = null; toast("Deleted."); location.hash = "#schedule";
    } catch (e) { say(errText(e), "err"); }
  } });
  return h("div", {}, [
    h("div", { class: "wrap page-head" }, [h("p", { class: "small" }, h("a", { href: isNew ? "#schedule" : "#schedule=" + id, text: isNew ? "← Labs schedule" : "← Back to the Lab" })), h("h1", { text: isNew ? "Add a Lab" : "Edit " + l.title })]),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      h("div", { class: "panel stack" }, [
        h("label", { class: "f", for: "lt" }, ["Name of the Lab", f.title]),
        h("div", { class: "grid4" }, [h("label", { class: "f", for: "ld" }, ["Date", f.date]), h("label", { class: "f", for: "le2" }, [h("span", {}, ["Last day ", h("span", { class: "hint", text: "(if it runs several days)" })]), f.endDate]),
          h("label", { class: "f", for: "ls1" }, [h("span", {}, ["Starts ", h("span", { class: "hint", text: "(optional)" })]), f.start]), h("label", { class: "f", for: "ls2" }, [h("span", {}, ["Ends ", h("span", { class: "hint", text: "(optional)" })]), f.end])]),
        h("fieldset", { class: "f bands" }, [h("legend", { text: "Grade bands" }), h("div", { class: "row" }, bands.map(([b, c]) => h("label", { class: "chk" }, [c, " Grades " + b])))]),
        h("div", { class: "grid2" }, [h("label", { class: "f", for: "lw" }, ["Where", f.where]), h("label", { class: "f", for: "lg" }, ["Guides running it", f.guides])]),
        h("label", { class: "f", for: "la" }, ["What students will do", f.about]),
        h("div", { class: "f" }, [h("span", {}, ["Challenges from the map ", h("span", { class: "hint", text: "(optional, up to 8)" })]), chBox]),
        h("div", { class: "f" }, [h("span", {}, ["New challenges this Lab introduces ", h("span", { class: "hint", text: "(not on the map; guides can validate them at the end of the Lab)" })]), customBox])
      ]),
      h("div", { class: "panel stack" }, [
        h("h2", { class: "h", text: "For parents: supporting it at home" }),
        h("p", { class: "small muted", text: "Optional. Parents of students in these bands see this with the Lab." }),
        h("label", { class: "f", for: "lh" }, ["Notes for parents", f.home]),
        fileBox,
        h("div", { class: "f" }, [h("span", {}, ["Links ", h("span", { class: "hint", text: "(Google Docs, videos, anything online)" })]), linkBox])
      ]),
      h("div", { class: "row" }, [h("button", { class: "btn go", type: "button", text: isNew ? "Add the Lab" : "Save", onclick: save }), h("a", { class: "btn plain", href: isNew ? "#schedule" : "#schedule=" + id, text: "Cancel" }), del]),
      note
    ]))
  ]);
}

// ---------- the crew board: what everyone is working on and has passed ----------
let boardBand = null, boardQ = "";
function boardView() {
  const mine = S.mine[0] && S.students[S.mine[0]];
  // Students start on their own band's crew and can look up at older bands, not down; guides see every band.
  const lockBand = S.role === "student" && mine && BANDS.includes(mine.band) ? mine.band : null;
  const bandChoices = lockBand ? BANDS.slice(BANDS.indexOf(lockBand)) : ["All", ...BANDS];
  if (!boardBand || !bandChoices.includes(boardBand)) boardBand = mine ? mine.band : myBand() || "All";
  const list = Object.values(S.boards).filter(b => b.name && (boardBand === "All" || b.band === boardBand))
    .filter(b => !boardQ || b.name.toLowerCase().includes(boardQ) || (b.working || []).concat((b.passed || []).map(p => p.c)).some(c => chTitle(c).toLowerCase().includes(boardQ)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const q = h("input", { class: "in", type: "search", id: "bq", value: boardQ, placeholder: "Find a name or a challenge", style: { maxWidth: "340px" } });
  q.addEventListener("change", () => { boardQ = q.value.trim().toLowerCase(); route(); setTimeout(() => $("#bq") && $("#bq").focus(), 0); });
  const ch = (c, extra) => h("li", {}, [h("i", { style: { background: colOf(c) } }), h("span", {}, [chLink(c), extra ? h("span", { class: "muted", text: " · " + extra }) : null])]);
  return h("div", {}, [
    head("Crew board", "What everyone is working on, and what they've passed. Ask someone who's done it how they did it."),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      h("div", { class: "row" }, [...bandChoices.map(b => h("button", { class: "chip", type: "button", "aria-pressed": String(boardBand === b), text: b === "All" ? "Everyone" : "Grades " + b, onclick: () => { boardBand = b; route(); } })), h("label", { class: "f", for: "bq", style: { marginLeft: "auto" } }, [h("span", { class: "hint", text: "Search" }), q])]),
      list.length ? h("div", { class: "boardgrid" }, list.map(b => {
        const passed = (b.passed || []).slice().sort((x, y) => (y.d || "").localeCompare(x.d || ""));
        const credits = b.credits || 0, ranks = RANKS[b.band] || [], rank = ranks.filter(r => r[0] <= credits).pop();
        return h("article", { class: "bcard" }, [
          h("div", { class: "row", style: { justifyContent: "space-between" } }, [h("h3", { text: b.name }), h("span", { class: "tag", text: b.band === "K–1" ? `${passed.length} passed` : `${credits} credits${rank ? " · " + rank[1] : ""}` })]),
          h("div", {}, [h("p", { class: "lbl", text: "Working on" }), (b.working || []).length ? h("ul", {}, b.working.filter(c => BYID[c]).map(c => ch(c))) : h("p", { class: "empty small", text: "Nothing listed" })]),
          h("div", {}, [h("p", { class: "lbl", text: `Passed (${passed.length})` }), passed.length ? h("ul", {}, passed.slice(0, 5).map(p => ch(p.c, fmt(p.d)))) : h("p", { class: "empty small", text: "Not yet" }),
            passed.length > 5 ? h("details", {}, [h("summary", { class: "small", text: `All ${passed.length}` }), h("ul", { style: { marginTop: "6px" } }, passed.slice(5).map(p => ch(p.c, fmt(p.d))))]) : null])
        ]);
      })) : h("p", { class: "empty", text: "Nobody here yet." })
    ]))
  ]);
}

// ---------- routing ----------
function route() {
  if (!S.user) return signedOut();
  if (S.role === "unverified") return unverified();
  const [v, arg] = location.hash.slice(1).split("=");
  // Signed in on another site's copy (a parent following an old /lifeskills/ link, say): move to their own.
  if (S.role === "student") { location.replace("/challenges/#progress"); return; }
  // Staff on the Parents site's copy get a parent preview (any student's family view) instead of being moved.
  const preview = S.role === "staff" && PATH === HOMES.parent;
  if (!preview && HOMES[S.role] && HOMES[S.role] !== PATH) { location.replace(HOMES[S.role] + location.search + location.hash); return; }
  acct();
  if (preview) return parentRoute(v, arg, true);
  if (S.role === "staff") {
    // Inside the staff guides (/guides/lifeskills/), guides also get the Lab builder.
    navLinks(PATH === HOMES.staff ? SUBNAV.guides : [["overview", "Overview"], ["validate", "Validate"], ["board", "Crew board"], ["schedule", "Labs schedule"]]);
    if (v === "s") return main(record(arg, { staff: true }));
    // "Log" became "Validate"; old #log links still work.
    if (v === "log" || v === "validate") return main(validateView(arg));
    // Old links to the roster here go to the Student Roster.
    if (v === "roster") { location.replace(ROSTER + (arg ? "#edit=" + arg : "#roster")); return; }
    // #labs (old menu links) is the Labs schedule too.
    if (v === "schedule" || v === "labs") return main(scheduleView(v === "labs" ? undefined : arg, true));
    if (v === "board") return main(boardView());
    return main(overview());
  }
  if (S.role === "student") {
    navLinks([["me", "My trail"], ["board", "Crew board"]]);
    if (!S.mine.length) return main([head("Almost there", "Your Field Guide hasn't added you to the tracker yet. Ask them to add your school email: " + S.email), h("div", { class: "wrap" }, h("a", { class: "btn go", href: "/challenges/", text: "Browse challenges" }))]);
    if (v === "board") return main(boardView());
    return main(record(S.mine[0], { self: true }));
  }
  if (S.role === "parent") return parentRoute(v, arg, false);
}
// The family view: a tab per child (their record, plus how to support it at home), the Labs schedule for their bands,
// Challenges and Passing off at home. preview: a staff member on /parents/lifeskills/ sees one student's family view.
let previewSid = "";
function parentRoute(v, arg, preview) {
  if (preview) {
    const all = Object.values(S.students).sort((a, b) => a.name.localeCompare(b.name));
    if (!all.length) { $("#links").innerHTML = ""; return main(head("Parent preview", "Add students on the Student Roster first; then you can see any family's view here.")); }
    if (v === "c" && S.students[arg]) previewSid = arg;
    if (!S.students[previewSid]) { const b = myBand(); previewSid = (all.find(s => s.band === b) || all[0]).id; }
    S.mine = [previewSid];
  }
  if (!S.mine.length) { $("#links").innerHTML = ""; return main([head("Your account is ready", "We haven't linked it to your child yet. Ask your child's Field Guide to add this email to your child's record: " + S.email + ". Then reload this page."), h("div", { class: "wrap" }, h("a", { class: "btn go", href: "/parents/passoff/", text: "How passing off at home works" }))]); }
  // Two sections share this page. The Labs schedule is part of Life Skills (its sub-menu: Challenges, Labs schedule,
  // Passing off at home). Everything else is a child's profile, "My Child" in the top bar, whose sub-menu is one tab
  // per child (none for a family with one child, or in a staff preview, which has its own picker).
  const lifeskills = v === "schedule";
  const kids = S.mine.length > 1 && !preview ? S.mine.map(id => ["c=" + id, firstName(S.students[id].name)]) : [];
  const label = lifeskills ? "Life Skills" : S.mine.length > 1 && !preview ? "My Children" : "My Child";
  const brand = document.querySelector(".nav .brand span"); if (brand) brand.textContent = label;
  const sub = document.querySelector(".nav .brand"); if (sub) sub.setAttribute("href", lifeskills ? "/parents/challenges/" : "/parents/lifeskills/");
  $("#links").setAttribute("aria-label", label);
  document.title = label + " · Wilderland parents";
  navLinks(lifeskills ? SUBNAV.parents : kids);
  if (lifeskills) { document.querySelectorAll("#links a").forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === "#schedule" ? "page" : "false")); return main(scheduleView(arg, false)); }
  const sid = v === "c" && S.mine.includes(arg) ? arg : S.mine[0];
  document.querySelectorAll("#links a").forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === "#c=" + sid ? "page" : "false"));
  return main([preview ? previewBar(sid) : null, record(sid, { parent: true })]);
}
function previewBar(sid) {
  const all = Object.values(S.students).sort((a, b) => a.name.localeCompare(b.name));
  const sel = h("select", { class: "in", id: "pvs", "aria-label": "Student", style: { maxWidth: "280px" }, onchange: e => { location.hash = "#c=" + e.target.value; } },
    BANDS.map(b => { const ss = all.filter(s => s.band === b); return ss.length ? h("optgroup", { label: "Grades " + b }, ss.map(s => h("option", { value: s.id, text: s.name, selected: s.id === sid }))) : null; }));
  return h("div", { class: "wrap", style: { paddingTop: "16px" } }, h("div", { class: "pvbar" }, [h("span", {}, [h("b", { text: "Parent preview. " }), "This is what this student's family sees on Life Skills (parents see only their own children). "]), sel]));
}
addEventListener("hashchange", () => { route(); scrollTo(0, 0); });

// Tell the shared top bar (/wlnav.js) who this is, for the site switcher (staff, parents) and to keep students on the
// Students site. Same "wl-role" event and device memory as /auth.js, which these tracker pages don't load.
const TEAM = ["ian@silverlineventures.com", "online@bodyform.com", "ian.silverberg@gmail.com"];
function tellRole() {
  let d = null;
  if (S.user && !S.test && TEAM.includes(S.email) && S.role !== "unverified") d = { role: "staff", band: myBand() };
  else if (S.role === "staff") d = { role: "staff", band: myBand() };
  else if (S.role === "parent") d = { role: "parent", band: myBand(), bands: myBands() };
  else if (S.role === "student") { const bands = [...new Set(S.mine.map(id => S.students[id] && S.students[id].band).filter(Boolean))]; d = { role: "student", band: bands.length === 1 ? bands[0] : null, sid: S.mine.length === 1 ? S.mine[0] : null }; }
  if (d) d = { email: S.email, ...d, ...(S.test ? { test: S.test, real: S.real } : {}) };
  window.wlRole = d;
  try { if (d) localStorage.setItem("wl-role", JSON.stringify({ e: d.email, r: d.role, b: d.band, s: d.sid || null, bs: d.bands || null, t: d.test || null, x: d.real || null })); else localStorage.removeItem("wl-role"); } catch (e) { }
  document.dispatchEvent(new CustomEvent("wl-role", { detail: d }));
  tellUnlocks(d);
}
// Which parts of the Guides site this guide has unlocked through onboarding (same as /auth.js, which these pages
// don't load): admins and guests see everything; a test view shows the tester's own locks.
let unlockFor = null;
async function tellUnlocks(d) {
  const send = x => { try { if (x) localStorage.setItem("wl-unlocks", JSON.stringify(x)); else localStorage.removeItem("wl-unlocks"); } catch (e) { } document.dispatchEvent(new CustomEvent("wl-unlocks", { detail: x })); };
  if (!d || d.role !== "staff" || !S.user) { unlockFor = null; return send(null); }
  const em = (S.real || S.email || "").toLowerCase(); if (unlockFor === em + (S.test || "")) return; unlockFor = em + (S.test || "");
  if (!S.test && (S.admin || TEAM.includes(em))) return send({ e: em, all: true, done: [] });
  try { const s = await getDoc(doc(db, "behaviorProgress", S.user.uid)); const m = s.exists() && s.data().journey && s.data().journey.done || {}; send({ e: em, all: false, done: Object.keys(m).filter(k => m[k] > 0) }); }
  catch (e) { console.warn("Life Skills unlocks:", e); }
}

let seq = 0;
async function start(u) {
  const my = ++seq;
  if (!u) { Object.assign(S, { user: null, role: null, students: {}, entries: {}, boards: {}, mine: [] }); tellRole(); return route(); }
  main(h("p", { class: "loading", text: "Loading…" }));
  await decideRole(u);
  if (my !== seq) return;
  if (S.role === "unverified") { tellRole(); return route(); }
  if (S.role !== "student") tellRole();
  try { await loadAll(); }
  catch (e) {
    console.warn("Life Skills:", e);
    if (my !== seq) return;
    acct(); return main([head("Can't open the tracker", e.code === "permission-denied" ? "The database rules for the tracker aren't published yet, or this account isn't allowed in. Tell Alex." : "Check your connection and reload the page.")]);
  }
  if (my !== seq) return;
  setBandDefaults();
  tellRole();
  route();
}
(async () => {
  const handled = await finishEmailLink();
  onAuthStateChanged(auth, u => { if (handled && !u && isSignInWithEmailLink(auth, location.href)) return; start(u); });
})();
