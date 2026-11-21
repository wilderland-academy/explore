// Life Skills Tracker (explore.wilderland.academy/lifeskills/)
// Three views on one page, picked by who signs in:
//   guides and admins (school account on the staff list): every student, log passes, match parents
//   students (school account a guide has added): their own record, and the crew board
//   parents (any verified email a guide has matched to a child): their own children only
// Data (Firestore, rules in /firestore.rules):
//   lsStudents/{sid}            name, band, grade, email, guide, parents[], celebrated   (private)
//   lsStudents/{sid}/entries/*  one pass or not yet each                                 (private)
//   lsBoard/{sid}               short name, band, working[], passed[]                     (all school accounts)
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  signOut, onAuthStateChanged, connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, writeBatch, connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";

const CONFIG = {
  apiKey: "AIzaSyB_JSjvnUlSCnx4BIwRTLicHllmCgF2iOM",
  authDomain: "wilderland-df15e.firebaseapp.com",
  projectId: "wilderland-df15e",
  storageBucket: "wilderland-df15e.firebasestorage.app",
  messagingSenderId: "310046559783",
  appId: "1:310046559783:web:66af8f02d96d315ab14802"
};
const DOMAIN = "@wilderland.academy";
// Keep in step with firestore.rules, auth.js and fieldguide/app.js.
const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const EMU = location.hostname === "localhost" && new URLSearchParams(location.search).has("emu");
// The same tracker also runs inside the staff guides at /guides/lifeskills/ (with the staff menu on top).
const BASE = (location.pathname.startsWith("/guides/lifeskills") ? "/guides/lifeskills/" : "/lifeskills/") + (EMU ? "?emu" : "");
const HOME = location.origin + BASE;
const LINK_KEY = "wl-ls-link-email";

const app = initializeApp(CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
// Local testing only: on localhost, talk to the Firebase emulators instead of the real project.
if (EMU) { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); connectFirestoreEmulator(db, "127.0.0.1", 8085); }

// ---------- challenge data (from /challenges/data.js) ----------
const W = window.WL || { skills: [], comps: {}, ch: [] };
const BYID = {}; W.ch.forEach(c => BYID[c.id] = c);
const SKILL = {}; W.skills.forEach(s => SKILL[s.k] = s);
const SHORT = { EN: "Energy", SG: "Self-Gov.", CG: "Grit", AI: "Adapt.", VC: "Value", SP: "Story", FE: "Fellowship", NL: "Nature" };
const skillOf = cid => { const c = BYID[cid]; return c ? SKILL[(W.comps[c.c] || {}).k] : null; };
const colOf = cid => (skillOf(cid) || {}).col || "#4d4d51";
const BANDS = ["K–1", "2–4", "5–8"];
const RANKS = {
  "2–4": [[4, "Fox"], [16, "Badger"], [32, "Elk"], [48, "Moose"]],
  "5–8": [[4, "Tracker"], [16, "Pathfinder"], [32, "Ranger"], [48, "Vanguard"], [64, "Trailblazer"]]
};
const goalFor = band => band === "K–1" ? 3 : 2;

// ---------- small helpers ----------
const $ = s => document.querySelector(s);
function h(tag, a, kids) {
  const e = document.createElement(tag);
  for (const k in (a || {})) {
    const v = a[k]; if (v == null || v === false) continue;
    if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
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
const S = { user: null, email: "", role: null, admin: false, students: {}, entries: {}, boards: {}, mine: [] };

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
}
async function loadAll() {
  S.students = {}; S.entries = {}; S.boards = {}; S.mine = [];
  if (S.role === "staff") {
    const snap = await getDocs(collection(db, "lsStudents"));
    snap.forEach(d => S.students[d.id] = { id: d.id, ...d.data() });
    await Promise.all(Object.keys(S.students).map(loadEntries));
    const b = await getDocs(collection(db, "lsBoard")); b.forEach(d => S.boards[d.id] = { id: d.id, ...d.data() });
  } else if (S.role === "student") {
    const snap = await getDocs(query(collection(db, "lsStudents"), where("email", "==", S.email)));
    snap.forEach(d => { S.students[d.id] = { id: d.id, ...d.data() }; S.mine.push(d.id); });
    await Promise.all(S.mine.map(loadEntries));
    const b = await getDocs(collection(db, "lsBoard")); b.forEach(d => S.boards[d.id] = { id: d.id, ...d.data() });
  } else if (S.role === "parent") {
    const snap = await getDocs(query(collection(db, "lsStudents"), where("parents", "array-contains", S.email)));
    snap.forEach(d => { S.students[d.id] = { id: d.id, ...d.data() }; S.mine.push(d.id); });
    S.mine.sort((a, b) => S.students[a].name.localeCompare(S.students[b].name));
    await Promise.all(S.mine.map(async sid => {
      await loadEntries(sid);
      try { const b = await getDoc(doc(db, "lsBoard", sid)); if (b.exists()) S.boards[sid] = { id: sid, ...b.data() }; } catch (e) { /* board is optional for families */ }
    }));
  }
}
// The crew board copy of a student's passes, rebuilt from their entries after every change.
function boardDoc(sid) {
  const s = S.students[sid], sum = summary(sid), old = S.boards[sid] || {};
  return { name: shortName(s.name), band: s.band, working: (old.working || []).filter(c => !sum.passes.some(p => p.cid === c)), passed: sum.passes.map(p => ({ c: p.cid, d: p.date })), credits: sum.trail, updated: Date.now() };
}
async function saveBoard(sid) { const b = boardDoc(sid); await setDoc(doc(db, "lsBoard", sid), b); S.boards[sid] = { id: sid, ...b }; }

// ---------- auth ----------
async function decideRole(u) {
  S.user = u; S.email = (u.email || "").toLowerCase(); S.admin = false; S.role = null;
  const school = S.email.endsWith(DOMAIN);
  if (!u.emailVerified) { S.role = "unverified"; return; }
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
  const cur = location.hash.slice(1).split("=")[0] || items[0][0];
  const nav = $("#links"); nav.innerHTML = "";
  items.forEach(([id, label]) => nav.append(h("a", { href: "#" + id, text: label, "aria-current": cur === id ? "page" : null })));
}
let menuOpen = false;
function acct() {
  const box = $("#acct"); box.innerHTML = "";
  if (!S.user) return;
  const roleName = { staff: S.admin ? "Admin" : "Guide", student: "Student", parent: "Parent", unverified: "Not verified yet" }[S.role] || "";
  const b = h("button", { type: "button", "aria-expanded": String(menuOpen), text: firstName(S.user.displayName) || S.email.split("@")[0], onclick: () => { menuOpen = !menuOpen; acct(); } });
  box.append(b);
  if (menuOpen) box.append(h("div", { class: "acct-menu" }, [
    h("p", { text: `${roleName}. Signed in as ${S.email}.` }),
    S.role === "staff" ? h("a", { href: "/fieldguide/", text: "Field Guide" }) : null,
    S.role !== "parent" ? h("a", { href: "/challenges/", text: "Challenges" }) : h("a", { href: "/challenges/parents.html", text: "Passing off at home" }),
    h("button", { type: "button", text: "Sign out", onclick: async () => { menuOpen = false; await signOut(auth); location.hash = ""; } })
  ]));
}
// composedPath: the menu button is re-drawn on click, so check the path the click took, not where the target is now.
document.addEventListener("click", e => { if (menuOpen && !e.composedPath().some(n => n.id === "acct")) { menuOpen = false; acct(); } });

// ---------- signed out: school Google, or a parent email account ----------
const GLOGO = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>';
async function google(schoolOnly) {
  const p = new GoogleAuthProvider(); p.setCustomParameters(schoolOnly ? { hd: "wilderland.academy", prompt: "select_account" } : { prompt: "select_account" });
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
function chMeta(cid) { const c = BYID[cid], sk = skillOf(cid); return [sk ? sk.n : "", cid, c && c.z === "Epic" ? "Epic" : ""].filter(Boolean).join(", "); }
function picker(opts) {
  // A search box for challenges. opts.band narrows the list; opts.onpick(cid)
  const inp = h("input", { class: "in", type: "search", id: opts.id || "chq", placeholder: "Search by words or ID, like “mile” or EN-03.2", autocomplete: "off" });
  const res = h("div", { class: "results" });
  const run = () => {
    const q = inp.value.trim().toLowerCase(); res.innerHTML = "";
    if (q.length < 2) return;
    const words = q.split(/\s+/);
    const band = typeof opts.band === "function" ? opts.band() : opts.band;
    const hits = W.ch.filter(c => (!band || c.b === band) && (c.id.toLowerCase().startsWith(q) || words.every(w => c.t.toLowerCase().includes(w)))).slice(0, 12);
    if (!hits.length) res.append(h("p", { class: "empty", style: { padding: "8px 0" }, text: "No challenges match. Try fewer words." }));
    hits.forEach(c => res.append(h("button", { type: "button", onclick: () => { inp.value = ""; res.innerHTML = ""; opts.onpick(c.id); } }, [h("span", { style: { background: colOf(c.id), borderRadius: "3px" } }), h("span", {}, [c.t, h("small", { text: chMeta(c.id) + ", grades " + c.b })])])));
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
  list.forEach(c => ul.append(h("div", { class: "item" }, [h("span", { class: "bar", style: { background: colOf(c) } }), h("div", {}, [h("div", { class: "meta", text: chMeta(c) }), h("div", { class: "t", text: chTitle(c) })]),
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
    ? h("p", { class: "muted", text: "K–1 has no ranks. Each child aims for 3 passes in every life skill this year." })
    : h("p", { class: "muted" }, [h("b", { style: { color: "var(--ink)" }, text: `${sum.trail} credits on the grades ${s.band} trail. ` }),
        (sum.nextRank && sum.nextRank[0] === sum.milestone + 4 ? `Next: ${sum.nextRank[1]} at ${sum.nextRank[0]}. ` : `Next milestone at ${sum.milestone + 4}` + (sum.nextRank ? `, then ${sum.nextRank[1]} at ${sum.nextRank[0]}. ` : ". ")) + "Every 4 credits is a milestone, celebrated at Honor Court."]);
  const staffBits = opts.staff ? h("div", { class: "row noprint" }, [
    h("a", { class: "btn go", href: "#log=" + sid, text: "Log a challenge" }),
    h("a", { class: "btn", href: "#roster=" + sid, text: "Edit student and parents" }),
    sum.newMilestone ? h("button", { class: "btn", type: "button", text: `Mark milestone ${sum.milestone} celebrated`, onclick: async () => { try { await updateDoc(doc(db, "lsStudents", sid), { celebrated: sum.milestone }); s.celebrated = sum.milestone; toast("Marked. It drops off the new milestones list."); route(); } catch (e) { toast(errText(e)); } } }) : null
  ]) : null;
  const entryRow = (e, kind) => {
    const sk = skillOf(e.cid), c = BYID[e.cid];
    const kids = [h("div", { class: "meta" }, [h("b", { text: fmt(e.date) }), ", " + (sk ? sk.n : e.cid) + ", " + (kind === "pass" ? ((e.credits || (c || {}).cr || 1) > 1 ? "Epic, 2 credits" : "1 credit") : "not yet")]),
      h("div", { class: "t", text: chTitle(e.cid) })];
    if (kind === "pass" && e.note) kids.push(h("div", { class: "gnote", text: (e.byName ? e.byName + ": " : "") + e.note }));
    if (kind === "notyet") kids.push(h("dl", { class: "ny" }, [h("dt", { text: "Missing" }), h("dd", { text: e.missing || "—" }), h("dt", { text: "Practice" }), h("dd", { text: e.practice || "—" }), h("dt", { text: "Retry" }), h("dd", { text: e.retry ? "On or after " + fmt(e.retry) : "Any day you're ready" })]));
    let confirm = false;
    const del = opts.staff ? h("button", { class: "btn danger noprint", type: "button", text: "Remove", onclick: async ev => {
      if (!confirm) { confirm = true; ev.target.textContent = "Confirm remove"; return; }
      try { await deleteDoc(doc(db, "lsStudents", sid, "entries", e.id)); S.entries[sid] = S.entries[sid].filter(x => x.id !== e.id); await saveBoard(sid); toast("Removed."); route(); } catch (x) { toast(errText(x)); }
    } }) : h("span");
    return h("div", { class: "item" }, [h("span", { class: "bar", style: { background: colOf(e.cid) } }), h("div", {}, kids), del]);
  };
  return h("div", {}, [
    h("div", { class: "wrap page-head" }, h("div", { class: "who" }, [
      h("div", {}, [h("h1", { text: opts.self ? "My trail" : s.name }), h("p", { text: [opts.self ? s.name : "", s.grade ? "Grade " + s.grade : "Grades " + s.band, s.guide ? (emails(s.guide).length > 1 ? "Field Guides " : "Field Guide ") + emails(s.guide).map(g => g.split("@")[0].replace(/^./, x => x.toUpperCase())).join(" and ") : ""].filter(Boolean).join(", ") })]),
      staffBits
    ])),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      h("div", { class: "grid2" }, [
        h("div", { class: "panel" }, [h("h2", { class: "h", text: `Year goal: ${goal} in every life skill` }),
          h("p", { class: "muted" }, [h("b", { style: { color: "var(--ink)" }, text: `${done} of 8 skills met. ` }), missingSkills.length === 8 ? "No passes yet this year." : missingSkills.length ? "Not started yet: " + missingSkills.join(", ") + "." : "Every life skill has a pass this year."]), skillsList]),
        h("div", { class: "panel" }, [h("h2", { class: "h", text: s.band === "K–1" ? "This year" : sum.rank ? "Rank: " + sum.rank : "On the trail" }), rankLine, s.band === "K–1" ? h("p", { class: "big", text: String(sum.year) }) : trackBar(sid)])
      ])
    ])),
    h("section", { class: "band tint" }, h("div", { class: "wrap stack" }, [
      h("h2", { class: "h", text: "Working on" }), workingList(sid, opts.self),
      sum.notyets.length ? h("h2", { class: "h", style: { marginTop: "12px" }, text: "Not yet, with what to practice" }) : null,
      sum.notyets.length ? h("div", { class: "items" }, sum.notyets.map(e => entryRow(e, "notyet"))) : null
    ])),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      h("h2", { class: "h", text: `Feats (${sum.passes.length})` }),
      sum.passes.length ? h("div", { class: "items" }, sum.passes.map(e => entryRow(e, "pass"))) : h("p", { class: "empty", text: "No passes yet. The first one is the hardest." }),
      opts.parent ? h("p", { class: "small muted" }, ["Each feat is a challenge shown to a guide in person, or passed off at home by the rules in ", h("a", { href: "/challenges/parents.html", text: "Passing off at home" }), ". Not yets always say what to practice and when to try again."]) : null
    ]))
  ]);
}

// ---------- guides: band overview ----------
let ovBand = "2–4", ovFilter = "all";
function overview() {
  const all = Object.values(S.students).sort((a, b) => a.name.localeCompare(b.name));
  const inBand = all.filter(s => ovBand === "All" || s.band === ovBand);
  const sums = Object.fromEntries(inBand.map(s => [s.id, summary(s.id)]));
  const stale = inBand.filter(s => daysAgo(sums[s.id].last) > 21);
  const open = inBand.filter(s => sums[s.id].notyets.length);
  const fresh = inBand.filter(s => sums[s.id].newMilestone);
  const rows = { all: inBand, stale, open, fresh }[ovFilter];
  const chip = (id, label) => h("button", { class: "chip", type: "button", "aria-pressed": String(ovFilter === id), text: label, onclick: () => { ovFilter = id; route(); } });
  const bandChip = b => h("button", { class: "chip", type: "button", "aria-pressed": String(ovBand === b), text: b === "All" ? "All bands" : "Grades " + b, onclick: () => { ovBand = b; route(); } });
  const goal = goalFor(ovBand);
  const table = h("table", { class: "ov" }, [
    h("caption", { class: "small muted", style: { textAlign: "left", padding: "14px 18px 4px" }, text: `Credits this school year per life skill. A filled circle means the year goal of ${ovBand === "All" ? "2 (3 in K–1)" : goal} is met.` }),
    h("thead", {}, h("tr", {}, [h("th", { scope: "col", text: "Student" }), ...W.skills.map(k => h("th", { scope: "col", title: k.n, style: { borderTopColor: k.col }, text: SHORT[k.k] })),
      h("th", { scope: "col", text: "This year" }), h("th", { scope: "col", text: "Trail" }), h("th", { scope: "col", style: { textAlign: "left" }, text: "Last pass" })])),
    h("tbody", {}, rows.map(s => {
      const m = sums[s.id], g = goalFor(s.band);
      return h("tr", {}, [h("th", { scope: "row", style: { textAlign: "left", paddingLeft: "18px" } }, [h("a", { class: "stu", href: "#s=" + s.id, text: s.name }), m.newMilestone ? h("span", { class: "tag forest", style: { marginLeft: "8px" }, text: "Milestone " + m.milestone }) : null]),
        ...W.skills.map(k => { const v = m.per[k.k] || 0; return h("td", {}, h("span", { class: "cnt " + (v >= g ? "g" : v ? "o" : "z"), style: v >= g ? { background: k.col } : v ? { color: k.col } : {} }, h("span", { style: v && v < g ? { color: "var(--ink)" } : {}, text: String(v) }))); }),
        h("td", { style: { fontWeight: 700 }, text: String(m.year) }), h("td", { text: s.band === "K–1" ? "—" : m.trail + (m.rank ? " · " + m.rank : "") }),
        h("td", { style: { textAlign: "left" }, class: daysAgo(m.last) > 21 ? "stale" : "", text: m.last ? fmt(m.last) : "None yet" })]);
    }))
  ]);
  const said = [];
  if (stale.length) said.push(`${stale.map(s => firstName(s.name)).join(", ")} ${stale.length === 1 ? "hasn't" : "haven't"} passed a challenge in 3 weeks. Bring it up in this week's coaching: what are they working on, and what's in the way?`);
  if (fresh.length) said.push(`${fresh.map(s => firstName(s.name)).join(", ")} reached a new milestone. Call them up at the next Honor Court.`);
  return h("div", {}, [
    head("Band overview", "Who's moving, who's stuck, and who to celebrate."),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      h("div", { class: "row" }, ["All", ...BANDS].map(bandChip)),
      h("div", { class: "row" }, [chip("all", `All ${inBand.length} students`), chip("stale", `No pass in 3 weeks (${stale.length})`), chip("open", `Open not yets (${open.length})`), chip("fresh", `New milestones (${fresh.length})`),
        h("a", { class: "btn go", href: "#log", style: { marginLeft: "auto" }, text: "Log a challenge" })]),
      all.length ? h("div", { class: "tablewrap" }, table) : h("div", { class: "panel" }, [h("p", { text: "No students yet. Add your crew first, with each student's school email and their parents' emails." }), h("div", {}, h("a", { class: "btn go", href: "#roster", text: "Add students" }))]),
      rows.length || !all.length ? null : h("p", { class: "empty", text: "No students match." }),
      said.length ? h("div", { class: "stack" }, said.map(t => h("p", { class: "muted", text: t }))) : null
    ]))
  ]);
}

// ---------- guides: log a pass or a not yet ----------
function logView(pre) {
  const all = Object.values(S.students).sort((a, b) => a.name.localeCompare(b.name));
  if (!all.length) return h("div", {}, [head("Log a challenge"), h("div", { class: "wrap" }, h("div", { class: "panel" }, [h("p", { text: "Add students to your crew first." }), h("div", {}, h("a", { class: "btn go", href: "#roster", text: "Add students" }))]))]);
  let sid = pre && S.students[pre] ? pre : "", cid = "", result = "pass";
  const sel = h("select", { class: "in", id: "ls" }, [h("option", { value: "", text: "Choose a student" }), ...BANDS.map(b => { const ss = all.filter(s => s.band === b); return ss.length ? h("optgroup", { label: "Grades " + b }, ss.map(s => h("option", { value: s.id, text: s.name, selected: s.id === sid }))) : null; })]);
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
    if (!cid) { note.textContent = "Choose a challenge."; return; }
    if (result === "notyet" && (!tMiss.value.trim() || !tPrac.value.trim())) { note.textContent = "A not yet needs what was missing and how to practice."; return; }
    const before = summary(sid);
    const e = { cid, result, date: date.value || today(), credits: (BYID[cid] || {}).cr || 1, by: S.email, byName: firstName(S.user.displayName) || S.email.split("@")[0], created: Date.now(),
      note: result === "pass" ? tStood.value.trim() : "", missing: result === "notyet" ? tMiss.value.trim() : "", practice: result === "notyet" ? tPrac.value.trim() : "", retry: result === "notyet" ? tRetry.value : "" };
    try {
      const ref = await addDoc(collection(db, "lsStudents", sid, "entries"), e);
      S.entries[sid] = (S.entries[sid] || []).concat({ id: ref.id, ...e });
      await saveBoard(sid);
      const after = summary(sid), name = firstName(S.students[sid].name);
      let msg = result === "pass" ? `Logged ${name}'s pass.` : `Logged a not yet for ${name}. The family sees what to practice.`;
      if (result === "pass" && after.milestone > before.milestone && S.students[sid].band !== "K–1") msg = `Milestone: that's ${name}'s ${ordinal(after.trail)} credit. Add ${name} to the next Honor Court.` + (after.rank !== before.rank ? ` New rank: ${after.rank}.` : "");
      note.className = "note ok"; note.textContent = msg; toast(msg);
      cid = ""; tStood.value = tMiss.value = tPrac.value = tRetry.value = ""; drawChosen();
    } catch (x) { note.textContent = errText(x); }
  };
  return h("div", {}, [
    head("Log a challenge", "Log it the day you see it, with the student right there. A pass marks their box on the wall; a not yet never goes on the wall."),
    h("section", { class: "band" }, h("div", { class: "wrap" }, h("div", { class: "panel stack", style: { maxWidth: "720px" } }, [
      h("label", { class: "f", for: "ls" }, ["Student", sel]),
      h("div", { class: "f" }, [h("label", { class: "f", for: "lc", text: "Challenge" }), chosen, pickBox]),
      h("div", { class: "f" }, [h("span", { text: "Result" }), resBox]),
      fields,
      h("label", { class: "f", for: "ld" }, ["Date", date]),
      h("div", { class: "row" }, [h("button", { class: "btn go", type: "button", text: "Log it", onclick: save }), sid ? h("a", { class: "btn plain", href: "#s=" + sid, text: "Open this student's record" }) : null]),
      note
    ])))
  ]);
}

// ---------- guides: students and parent matching ----------
function rosterView(editId) {
  const all = Object.values(S.students).sort((a, b) => a.band.localeCompare(b.band) || a.name.localeCompare(b.name));
  const s = editId && S.students[editId] ? S.students[editId] : null;
  const f = {
    name: h("input", { class: "in", id: "rn", value: s ? s.name : "", maxlength: "60", autocomplete: "off" }),
    band: h("select", { class: "in", id: "rb" }, BANDS.map(b => h("option", { value: b, text: "Grades " + b, selected: s ? s.band === b : b === "2–4" }))),
    grade: h("input", { class: "in", id: "rg", value: s ? s.grade || "" : "", maxlength: "2", placeholder: "3" }),
    email: h("input", { class: "in", id: "re", type: "email", value: s ? s.email || "" : "", placeholder: "maya@wilderland.academy" }),
    guide: h("input", { class: "in", id: "rgd", value: s ? s.guide || "" : S.email, placeholder: "april@wilderland.academy, shanan@wilderland.academy" }),
    parents: h("textarea", { class: "in", id: "rp", placeholder: "one email per line", text: s ? (s.parents || []).join("\n") : "" })
  };
  const note = h("p", { class: "note", "aria-live": "polite" });
  const save = async () => {
    note.className = "note err";
    const name = f.name.value.trim().replace(/\s+/g, " "), email = f.email.value.trim().toLowerCase(), guide = emails(f.guide.value).join(", "), parents = emails(f.parents.value);
    if (name.length < 2) { note.textContent = "Add the student's full name."; return; }
    if (email && !email.endsWith(DOMAIN)) { note.textContent = "The student email must be their @wilderland.academy account (or leave it blank for K–1)."; return; }
    if (emails(guide).some(g => !g.endsWith(DOMAIN))) { note.textContent = "Field Guide emails must be @wilderland.academy accounts."; return; }
    const bad = parents.filter(p => !isEmail(p)); if (bad.length) { note.textContent = "Check these parent emails: " + bad.join(", "); return; }
    if (parents.some(p => p.endsWith(DOMAIN) && !ADMINS.includes(p))) { note.textContent = "Use each parent's personal email, not a school account."; return; }
    if (email && all.some(x => x.email === email && x.id !== (s && s.id))) { note.textContent = "Another student already has that email."; return; }
    const data = { name, band: f.band.value, grade: f.grade.value.trim(), email, guide, parents, updated: Date.now(), updatedBy: S.email };
    try {
      const ref = s ? doc(db, "lsStudents", s.id) : doc(collection(db, "lsStudents"));
      const batch = writeBatch(db);
      if (s) batch.update(ref, data); else batch.set(ref, { ...data, celebrated: 0, created: Date.now() });
      S.students[ref.id] = { ...(s || { celebrated: 0 }), ...data, id: ref.id };
      if (!S.entries[ref.id]) S.entries[ref.id] = [];
      const b = boardDoc(ref.id); batch.set(doc(db, "lsBoard", ref.id), b);
      await batch.commit(); S.boards[ref.id] = { id: ref.id, ...b };
      toast(s ? "Saved." : `Added ${firstName(name)}.`); location.hash = s ? "#s=" + ref.id : "#roster";
      if (!s) route();
    } catch (x) { note.textContent = errText(x); }
  };
  let confirmDel = false;
  const form = h("div", { class: "panel stack" }, [
    h("h2", { class: "h", text: s ? "Edit " + s.name : "Add a student" }),
    h("div", { class: "grid2" }, [h("label", { class: "f", for: "rn" }, ["Full name", f.name]), h("div", { class: "row", style: { alignItems: "flex-end" } }, [h("label", { class: "f", for: "rb", style: { flex: "1" } }, ["Band", f.band]), h("label", { class: "f", for: "rg", style: { width: "90px" } }, ["Grade", f.grade])])]),
    h("div", { class: "grid2" }, [h("label", { class: "f", for: "re" }, [h("span", {}, ["Student's school email ", h("span", { class: "hint", text: "(lets them sign in; optional for K–1)" })]), f.email]), h("label", { class: "f", for: "rgd" }, [h("span", {}, ["Field Guides ", h("span", { class: "hint", text: "(school emails, separated by commas)" })]), f.guide])]),
    h("label", { class: "f", for: "rp" }, [h("span", {}, ["Parent emails ", h("span", { class: "hint", text: "One per line. Each parent signs in with this exact email and sees only this child." })]), f.parents]),
    h("div", { class: "row" }, [h("button", { class: "btn go", type: "button", text: s ? "Save" : "Add student", onclick: save }), s ? h("a", { class: "btn plain", href: "#roster", text: "Cancel" }) : null,
      s && S.admin ? h("button", { class: "btn danger", type: "button", style: { marginLeft: "auto" }, text: "Delete student", onclick: async ev => {
        if (!confirmDel) { confirmDel = true; ev.target.textContent = "Delete " + s.name + " and every record? Click again."; return; }
        try { for (const e of S.entries[s.id] || []) await deleteDoc(doc(db, "lsStudents", s.id, "entries", e.id)); await deleteDoc(doc(db, "lsBoard", s.id)); await deleteDoc(doc(db, "lsStudents", s.id)); delete S.students[s.id]; toast("Deleted."); location.hash = "#roster"; }
        catch (x) { note.className = "note err"; note.textContent = errText(x); }
      } }) : null]),
    note
  ]);
  return h("div", {}, [
    head("Students and parents", "Only guides and admins can link a parent to a child. A parent sees a child's record only after you add their email here, and only after they confirm that email."),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [form, s ? null : importPanel()])),
    h("section", { class: "band tint" }, h("div", { class: "wrap stack" }, [
      h("h2", { class: "h", text: `All students (${all.length})` }),
      all.length ? h("div", { class: "items" }, all.map(x => h("div", { class: "item" }, [h("span", { class: "bar", style: { background: "var(--forest)" } }),
        h("div", {}, [h("div", { class: "t" }, h("a", { href: "#s=" + x.id, text: x.name })), h("div", { class: "meta", text: [`Grades ${x.band}${x.grade ? ", grade " + x.grade : ""}`, x.email || "no student sign-in", (x.parents || []).length ? "Parents: " + x.parents.join(", ") : "No parents linked"].join(" · ") })]),
        h("a", { class: "btn", href: "#roster=" + x.id, text: "Edit" })]))) : h("p", { class: "empty", text: "No students yet." })
    ]))
  ]);
}

// ---------- guides: import many students at once from a CSV ----------
// Columns (header row required): name, grade, band, student_email, parent_emails (separated by ; or spaces).
// A student who is already here (same school email, or same name) is updated: band and grade from the file,
// their email if they had none, and the parent emails added to the ones already linked. Nobody is removed.
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
function importPanel() {
  const file = h("input", { type: "file", id: "imf", accept: ".csv,text/csv", class: "in" });
  const out = h("div", { class: "stack" }), note = h("p", { class: "note", "aria-live": "polite" });
  let plan = [];
  file.addEventListener("change", async () => {
    out.innerHTML = ""; note.className = "note"; note.textContent = ""; plan = [];
    const f = file.files[0]; if (!f) return;
    const rows = parseCSV(await f.text()); const hd = (rows.shift() || []).map(x => x.trim().toLowerCase());
    const col = k => hd.indexOf(k);
    if (col("name") < 0 || col("band") < 0) { note.className = "note err"; note.textContent = "The file needs a header row with at least name and band."; return; }
    const all = Object.values(S.students), bad = [];
    rows.forEach((r, i) => {
      const get = k => col(k) < 0 ? "" : String(r[col(k)] || "").trim();
      const name = get("name").replace(/\s+/g, " "), band = get("band").replace("-", "–"), email = get("student_email").toLowerCase(), parents = emails(get("parent_emails")), guides = emails(get("guides"));
      const why = [];
      if (name.length < 2 || name.length > 60) why.push("name");
      if (!BANDS.includes(band)) why.push("band");
      if (email && !email.endsWith(DOMAIN)) why.push("student email");
      if (parents.some(p => !isEmail(p) || p.endsWith(DOMAIN))) why.push("a parent email");
      if (guides.some(g => !g.endsWith(DOMAIN))) why.push("a guide email");
      if (why.length) { bad.push(`Row ${i + 2} (${name || "no name"}): check ${why.join(", ")}`); return; }
      const ex = all.find(x => (email && x.email === email) || x.name.toLowerCase() === name.toLowerCase());
      const merged = ex ? [...new Set([...(ex.parents || []), ...parents])] : parents;
      if (merged.length > 6) { bad.push(`Row ${i + 2} (${name}): more than 6 parent emails`); return; }
      plan.push({ ex, guide: guides.length ? guides.join(", ") : null, name, band, grade: get("grade"), email: ex && ex.email ? ex.email : email, parents: merged, added: merged.length - (ex ? (ex.parents || []).length : 0) });
    });
    const dupe = plan.filter((p, i) => p.email && plan.findIndex(q => q.email === p.email) !== i);
    dupe.forEach(p => bad.push(`${p.name}: ${p.email} is used twice in the file`));
    if (dupe.length) plan = [];
    if (bad.length) out.append(h("div", { class: "panel sun" }, [h("p", { text: "Fix these rows, then choose the file again:" }), h("ul", {}, bad.map(b => h("li", { class: "small", text: b })))]));
    if (!plan.length) return;
    const nNew = plan.filter(p => !p.ex).length;
    out.append(h("p", { text: `${nNew} new student${nNew === 1 ? "" : "s"}, ${plan.length - nNew} already here (updated), ${plan.reduce((n, p) => n + Math.max(0, p.added), 0)} parent links to add.` }),
      h("div", { class: "tablewrap" }, h("table", { class: "ov", style: { minWidth: "760px" } }, [
        h("thead", {}, h("tr", {}, ["", "Student", "Band", "Student email", "Parents", "Guides"].map(t => h("th", { scope: "col", style: { textAlign: "left" }, text: t })))),
        h("tbody", {}, plan.map(p => h("tr", {}, [h("td", { style: { textAlign: "left" } }, h("span", { class: "tag" + (p.ex ? "" : " forest"), text: p.ex ? "Update" : "New" })), h("td", { style: { textAlign: "left" }, text: p.name }), h("td", { style: { textAlign: "left" }, text: p.band }), h("td", { style: { textAlign: "left" }, text: p.email || "none" }), h("td", { style: { textAlign: "left" }, class: "small", text: p.parents.join(", ") || "none" }), h("td", { style: { textAlign: "left" }, class: "small", text: p.guide || (p.ex && p.ex.guide) || "none" })])))
      ])),
      h("div", {}, h("button", { class: "btn go", type: "button", text: `Import ${plan.length} students`, onclick: async ev => {
        ev.target.disabled = true; note.className = "note"; note.textContent = "Saving…";
        try {
          for (let i = 0; i < plan.length; i += 200) {
            const batch = writeBatch(db);
            plan.slice(i, i + 200).forEach(p => {
              const ref = p.ex ? doc(db, "lsStudents", p.ex.id) : doc(collection(db, "lsStudents"));
              const data = { name: p.ex ? p.ex.name : p.name, band: p.band, grade: p.grade, email: p.email, parents: p.parents, updated: Date.now(), updatedBy: S.email };
              if (p.guide !== null) data.guide = p.guide;
              if (p.ex) batch.update(ref, data); else batch.set(ref, { guide: "", ...data, celebrated: 0, created: Date.now() });
              S.students[ref.id] = { ...(p.ex || { guide: "", celebrated: 0 }), ...data, id: ref.id };
              if (!S.entries[ref.id]) S.entries[ref.id] = [];
              const b = boardDoc(ref.id); batch.set(doc(db, "lsBoard", ref.id), b); S.boards[ref.id] = { id: ref.id, ...b };
            });
            await batch.commit();
          }
          toast(`Imported ${plan.length} students.`); route();
        } catch (x) { ev.target.disabled = false; note.className = "note err"; note.textContent = errText(x) + " Nothing after the last saved group was changed; choose the file again to finish."; }
      } })), note);
  });
  return h("div", { class: "panel stack" }, [
    h("h2", { class: "h", text: "Import from a spreadsheet" }),
    h("p", { class: "small muted", text: "A CSV with a header row: name, grade, band (K–1, 2–4 or 5–8), student_email, parent_emails and guides (separate several emails with ;). Students already here are matched by school email or name and get the new parent emails added. Nothing is removed. You'll see every row before anything saves." }),
    h("label", { class: "f", for: "imf" }, ["CSV file", file]), out, note
  ]);
}

// ---------- the crew board: what everyone is working on and has passed ----------
let boardBand = null, boardQ = "";
function boardView() {
  const mine = S.mine[0] && S.students[S.mine[0]];
  if (!boardBand) boardBand = mine ? mine.band : "2–4";
  const list = Object.values(S.boards).filter(b => b.name && (boardBand === "All" || b.band === boardBand))
    .filter(b => !boardQ || b.name.toLowerCase().includes(boardQ) || (b.working || []).concat((b.passed || []).map(p => p.c)).some(c => chTitle(c).toLowerCase().includes(boardQ)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const q = h("input", { class: "in", type: "search", id: "bq", value: boardQ, placeholder: "Find a name or a challenge", style: { maxWidth: "340px" } });
  q.addEventListener("change", () => { boardQ = q.value.trim().toLowerCase(); route(); setTimeout(() => $("#bq") && $("#bq").focus(), 0); });
  const ch = (c, extra) => h("li", {}, [h("i", { style: { background: colOf(c) } }), h("span", {}, [chTitle(c), extra ? h("span", { class: "muted", text: " · " + extra }) : null])]);
  return h("div", {}, [
    head("Crew board", "What everyone is working on, and what they've passed. Ask someone who's done it how they did it."),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      h("div", { class: "row" }, [...["All", ...BANDS].map(b => h("button", { class: "chip", type: "button", "aria-pressed": String(boardBand === b), text: b === "All" ? "Everyone" : "Grades " + b, onclick: () => { boardBand = b; route(); } })), h("label", { class: "f", for: "bq", style: { marginLeft: "auto" } }, [h("span", { class: "hint", text: "Search" }), q])]),
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
  acct();
  if (S.role === "staff") {
    navLinks([["overview", "Overview"], ["log", "Log"], ["roster", "Students and parents"], ["board", "Crew board"]]);
    if (v === "s") return main(record(arg, { staff: true }));
    if (v === "log") return main(logView(arg));
    if (v === "roster") return main(rosterView(arg));
    if (v === "board") return main(boardView());
    return main(overview());
  }
  if (S.role === "student") {
    navLinks([["me", "My trail"], ["board", "Crew board"]]);
    if (!S.mine.length) return main([head("Almost there", "Your Field Guide hasn't added you to the tracker yet. Ask them to add your school email: " + S.email), h("div", { class: "wrap" }, h("a", { class: "btn go", href: "/challenges/", text: "Browse challenges" }))]);
    if (v === "board") return main(boardView());
    return main(record(S.mine[0], { self: true }));
  }
  if (S.role === "parent") {
    if (!S.mine.length) { $("#links").innerHTML = ""; return main([head("Your account is ready", "We haven't linked it to your child yet. Ask your child's Field Guide to add this email to your child's record: " + S.email + ". Then reload this page."), h("div", { class: "wrap" }, h("a", { class: "btn go", href: "/challenges/parents.html", text: "How passing off at home works" }))]); }
    navLinks(S.mine.map(id => ["c=" + id, firstName(S.students[id].name)]).map(([k, l]) => [k, l]));
    const sid = v === "c" && S.mine.includes(arg) ? arg : S.mine[0];
    document.querySelectorAll("#links a").forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === "#c=" + sid ? "page" : "false"));
    return main(record(sid, { parent: true }));
  }
}
addEventListener("hashchange", () => { route(); scrollTo(0, 0); });

let seq = 0;
async function start(u) {
  const my = ++seq;
  if (!u) { Object.assign(S, { user: null, role: null, students: {}, entries: {}, boards: {}, mine: [] }); return route(); }
  main(h("p", { class: "loading", text: "Loading…" }));
  await decideRole(u);
  if (my !== seq) return;
  if (S.role === "unverified") return route();
  try { await loadAll(); }
  catch (e) {
    console.warn("Life Skills:", e);
    if (my !== seq) return;
    acct(); return main([head("Can't open the tracker", e.code === "permission-denied" ? "The database rules for the tracker aren't published yet, or this account isn't allowed in. Tell Alex." : "Check your connection and reload the page.")]);
  }
  if (my !== seq) return;
  route();
}
(async () => {
  const handled = await finishEmailLink();
  onAuthStateChanged(auth, u => { if (handled && !u && isSignInWithEmailLink(auth, location.href)) return; start(u); });
})();
