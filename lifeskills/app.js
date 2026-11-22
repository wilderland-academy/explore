// Life Skills Tracker (explore.wilderland.academy/lifeskills/)
// Three views on one page, picked by who signs in:
//   guides and admins (school account on the staff list): band overview (passed or saved), log passes, the Labs
//     schedule. Students and parents are added on the Student Roster (/guides/roster/).
//   students (school account a guide has added): their own record, and the crew board
//   parents (any verified email a guide has matched to a child): their own children only, and the Labs schedule
// Data (Firestore, rules in /firestore.rules):
//   lsStudents/{sid}            name, band, grade, email, guide, parents[], celebrated   (private)
//   lsStudents/{sid}/entries/*  one pass or not yet each                                 (private)
//   lsBoard/{sid}               short name, band, working[], passed[]                     (all school accounts)
//   labs/{id}                   the Life Skill Labs schedule                              (staff; linked parents)
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  signOut, onAuthStateChanged, connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, collectionGroup, query, where, writeBatch, connectFirestoreEmulator
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
const S = { user: null, email: "", role: null, admin: false, students: {}, entries: {}, boards: {}, mine: [], saved: {}, labs: null, parentBands: [] };

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
    await loadSaved();
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
// What each student saved to their Challenges plan (students/{uid}/sites/challenges, written by /auth.js; staff can
// read them all, see firestore.rules). Matched to tracker records by school email. S.saved[sid] = [challenge ids].
async function loadSaved() {
  S.saved = {};
  try {
    const bySchool = {}; Object.values(S.students).forEach(s => { if (s.email) bySchool[s.email.toLowerCase()] = s.id; });
    const snap = await getDocs(collectionGroup(db, "sites"));
    snap.forEach(d => {
      if (d.id !== "challenges") return;
      const x = d.data(), sid = bySchool[String(x.email || "").toLowerCase()]; if (!sid) return;
      let picks = []; try { picks = JSON.parse(JSON.parse(x.data || "{}")["wl-picks"] || "[]"); } catch (e) { picks = []; }
      S.saved[sid] = [...new Set(picks.filter(c => BYID[c]))];
    });
  } catch (e) { console.warn("Life Skills: couldn't read saved challenges", e); S.saved = null; }
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
  // Items are [id, label, href]. A link to a view on this same page (PATH#view) becomes a plain #view link.
  items = items.map(([id, label, href]) => [id, label, href && href.startsWith(PATH + "#") ? "" : href]);
  const cur = location.hash.slice(1).split("=")[0] || items[0][0];
  const nav = $("#links"); nav.innerHTML = "";
  items.forEach(([id, label, href]) => nav.append(h("a", { href: href || "#" + id, text: label, "aria-current": !href && cur === id ? "page" : null })));
}
// The Life Skills menu for this site, from /lifeskills/subnav.js (one list for every Life Skills page).
const SUBNAV = window.WLSubnav || { guides: [["overview", "Overview", "/guides/lifeskills/#overview"]], parents: [] };
// Student records and parent links are edited on the Student Roster (/guides/roster/).
const ROSTER = "/guides/roster/";
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
// A challenge's title as a link that opens the challenge in a modal over this page (/challenges/modal.js).
function chLink(cid, text) {
  const t = text == null ? chTitle(cid) : text;
  if (!BYID[cid]) return t;
  return h("a", { class: "wl-ch", href: CHMAP + "#c=" + encodeURIComponent(cid), "data-wl-ch": cid, text: t });
}
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
    h("a", { class: "btn", href: ROSTER + "#edit=" + encodeURIComponent(sid), text: "Edit student and parents" }),
    sum.newMilestone ? h("button", { class: "btn", type: "button", text: `Mark milestone ${sum.milestone} celebrated`, onclick: async () => { try { await updateDoc(doc(db, "lsStudents", sid), { celebrated: sum.milestone }); s.celebrated = sum.milestone; toast("Marked. It drops off the new milestones list."); route(); } catch (e) { toast(errText(e)); } } }) : null
  ]) : null;
  const entryRow = (e, kind) => {
    const sk = skillOf(e.cid), c = BYID[e.cid];
    const kids = [h("div", { class: "meta" }, [h("b", { text: fmt(e.date) }), ", " + (sk ? sk.n : e.cid) + ", " + (kind === "pass" ? ((e.credits || (c || {}).cr || 1) > 1 ? "Epic, 2 credits" : "1 credit") : "not yet")]),
      h("div", { class: "t" }, chLink(e.cid))];
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
      opts.staff ? savedPanel(sid) : null,
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

// Staff view of one student: what they saved to their Challenges plan, by life skill.
function savedPanel(sid) {
  const by = savedBySkill(sid), n = Object.values(by).reduce((a, l) => a + l.length, 0);
  return h("div", { class: "stack" }, [h("h2", { class: "h", style: { marginTop: "12px" }, text: `Saved to their plan (${n})` }),
    n ? h("div", { class: "grid2" }, W.skills.filter(k => by[k.k]).map(k => h("div", { class: "panel" }, [h("p", { class: "sklbl", style: { color: k.col }, text: k.n }), savedList(by[k.k])])))
      : h("p", { class: "empty", text: S.saved === null ? "Couldn't read saved challenges." : "Nothing saved (or they haven't signed in on Challenges yet)." })]);
}

// ---------- guides: band overview ----------
// Two ways to read it: credits passed this year per life skill, or challenges saved to each student's plan (saved/goal).
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
  pop.append(h("p", { class: "svh" }, [h("b", { text: firstName(s.name) }), ` · ${SKILL[k].n} · ${list.length} saved, goal ${goalFor(s.band)} this year`]),
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
  // Students whose plan doesn't cover the year goal yet in at least one life skill (passed + saved < goal).
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
        ? `Challenges each student has saved to their plan in each life skill (not yet passed), out of the year goal of ${ovBand === "All" ? "2 (3 in K–1)" : goal}. Point at or tap a count to see which ones.`
        : `Credits this school year per life skill. A filled circle means the year goal of ${ovBand === "All" ? "2 (3 in K–1)" : goal} is met.` }),
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
  if (savedView && thin.length) said.push(`${thin.length} of ${inBand.length} students haven't passed or saved enough challenges to reach the year goal in every life skill. Use "Plan short of the goal" to find them.`);
  return h("div", {}, [
    head("Band overview", "Who's moving, who's stuck, who to celebrate, and what each student has saved to their plan."),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      h("div", { class: "row" }, ["All", ...BANDS].map(bandChip)),
      h("div", { class: "row", role: "group", "aria-label": "Show" }, [h("span", { class: "small muted", text: "Show:" }), showChip("passed", "Passed this year"), showChip("saved", "Saved to plan")]),
      h("div", { class: "row" }, [chip("all", `All ${inBand.length} students`), chip("stale", `No pass in 3 weeks (${stale.length})`), chip("open", `Open not yets (${open.length})`), chip("fresh", `New milestones (${fresh.length})`), chip("thin", `Plan short of the goal (${thin.length})`),
        h("a", { class: "btn go", href: "#log", style: { marginLeft: "auto" }, text: "Log a challenge" })]),
      savedView && noSaves ? h("p", { class: "note err", text: "Couldn't read students' saved challenges. The database rules may need publishing (see firestore.rules)." }) : null,
      body,
      rows.length || !all.length ? null : h("p", { class: "empty", text: "No students match." }),
      savedView ? h("p", { class: "small muted", text: "Saved challenges come from each student's Challenges plan when they're signed in with their school account. K–1 students and anyone who hasn't signed in show 0." }) : null,
      said.length ? h("div", { class: "stack" }, said.map(t => h("p", { class: "muted", text: t }))) : null
    ]))
  ]);
}

// ---------- guides: log a pass or a not yet ----------
function logView(pre) {
  const all = Object.values(S.students).sort((a, b) => a.name.localeCompare(b.name));
  if (!all.length) return h("div", {}, [head("Log a challenge"), h("div", { class: "wrap" }, h("div", { class: "panel" }, [h("p", { text: "Add students to your crew first, on the Student Roster." }), h("div", {}, h("a", { class: "btn go", href: ROSTER + "#add", text: "Add students" }))]))]);
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
  S.labs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.start || "").localeCompare(b.start || ""));
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
    else if (staff && arg && arg.startsWith("edit.")) { const l = S.labs.find(x => x.id === arg.slice(5)); box.append(l ? labForm(l) : notFound()); }
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

function calendar(staff) {
  const now = todayISO();
  if (!calMonth) calMonth = now.slice(0, 7);
  const [y, m] = calMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate(), lead = first.getDay();
  const list = labsFor(staff);
  const iso = d => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const move = n => { const d = new Date(y, m - 1 + n, 1); calMonth = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); route(); };
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(h("div", { class: "cal-d out", "aria-hidden": "true" }));
  for (let d = 1; d <= days; d++) {
    const on = list.filter(l => labOn(l, iso(d)));
    cells.push(h("div", { class: "cal-d" + (iso(d) === now ? " today" : "") + (on.length ? " has" : "") }, [h("span", { class: "n", text: String(d) }),
      ...on.slice(0, 3).map(l => h("a", { class: "cal-ev", href: "#schedule=" + l.id, style: { "--c": bandCol(l) }, title: l.title, text: (l.start && l.date === iso(d) ? timeTxt(l.start) + " " : "") + l.title })),
      on.length > 3 ? h("span", { class: "small muted", text: `+${on.length - 3} more` }) : null]));
  }
  const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const inMonth = list.filter(l => l.date.slice(0, 7) <= calMonth && labEnd(l).slice(0, 7) >= calMonth);
  const upcoming = list.filter(l => labEnd(l) >= now), past = list.filter(l => labEnd(l) < now).reverse();
  const bands = staff ? ["All", ...BANDS] : null;
  const kids = staff ? null : myBands();
  return h("div", {}, [
    h("div", { class: "wrap page-head" }, h("div", { class: "who" }, [
      h("div", {}, [h("h1", { text: "Life Skill Labs" }), h("p", { text: staff ? "The guide-led Labs for every band. Add a Lab, attach anything parents could use to support it at home, and families see it on their Life Skills page." : `Labs your ${S.mine.length > 1 ? "children are" : "child is"} doing at school${kids.length ? " (grades " + kids.join(", ") + ")" : ""}, and how you can support them at home if you'd like to.` })]),
      staff ? h("div", { class: "row noprint" }, h("a", { class: "btn go", href: "#schedule=new", text: "Add a Lab" })) : null
    ])),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      bands ? h("div", { class: "row" }, bands.map(b => h("button", { class: "chip", type: "button", "aria-pressed": String(calBand === b), text: b === "All" ? "All bands" : "Grades " + b, onclick: () => { calBand = b; route(); } }))) : null,
      h("div", { class: "cal-head" }, [h("button", { class: "btn plain", type: "button", "aria-label": "Previous month", text: "←", onclick: () => move(-1) }), h("h2", { class: "h", text: monthName }), h("button", { class: "btn plain", type: "button", "aria-label": "Next month", text: "→", onclick: () => move(1) }),
        calMonth !== now.slice(0, 7) ? h("button", { class: "btn plain", type: "button", text: "This month", onclick: () => { calMonth = now.slice(0, 7); route(); } }) : null]),
      // Month grid on wide screens; on phones the list for the month below is the calendar.
      h("div", { class: "cal", role: "presentation" }, [...["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => h("div", { class: "cal-w", text: d })), ...cells]),
      h("div", { class: "cal-list" }, [h("h3", { class: "h", text: "In " + first.toLocaleDateString("en-US", { month: "long" }) }), inMonth.length ? h("div", { class: "items" }, inMonth.map(l => labRow(l, staff))) : h("p", { class: "empty", text: "No Labs this month." })])
    ])),
    h("section", { class: "band tint" }, h("div", { class: "wrap stack" }, [
      h("h2", { class: "h", text: `Coming up (${upcoming.length})` }),
      upcoming.length ? h("div", { class: "items" }, upcoming.slice(0, 30).map(l => labRow(l, staff))) : h("p", { class: "empty", text: staff ? "Nothing scheduled yet. Add the first Lab." : "Nothing scheduled yet. Check back soon." }),
      past.length ? h("details", {}, [h("summary", { class: "small", text: `Past Labs (${past.length})` }), h("div", { class: "items", style: { marginTop: "10px" } }, past.slice(0, 60).map(l => labRow(l, staff)))]) : null
    ]))
  ]);
}
function bandCol(l) { const b = (l.bands || [])[0]; return b === "K–1" ? "#356B33" : b === "2–4" ? "#2F5D8A" : b === "5–8" ? "#6E4382" : "#015640"; }
function labRow(l, staff) {
  const extras = [(l.files || []).length + (l.links || []).length ? `${(l.files || []).length + (l.links || []).length} file${(l.files || []).length + (l.links || []).length === 1 ? "" : "s"} or link${(l.files || []).length + (l.links || []).length === 1 ? "" : "s"} for home` : "", l.home ? "home notes" : ""].filter(Boolean);
  return h("div", { class: "item" }, [h("span", { class: "bar", style: { background: bandCol(l) } }),
    h("div", {}, [h("div", { class: "meta" }, [h("b", { text: whenTxt(l) }), " · grades " + (l.bands || []).join(", ") + (l.where ? " · " + l.where : "")]),
      h("div", { class: "t" }, h("a", { href: "#schedule=" + l.id, text: l.title })),
      !staff ? h("div", { class: "small muted", text: (l.bands || []).flatMap(childrenIn).filter((x, i, a) => a.indexOf(x) === i).join(", ") }) : null,
      extras.length ? h("div", { class: "small muted", text: extras.join(" · ") }) : null]),
    staff ? h("a", { class: "btn", href: "#schedule=edit." + l.id, text: "Edit" }) : h("span")]);
}
function labDetail(l, staff) {
  const files = l.files || [], links = l.links || [];
  return h("div", {}, [
    h("div", { class: "wrap page-head" }, [h("p", { class: "small" }, h("a", { href: "#schedule", text: "← Labs schedule" })),
      h("div", { class: "who" }, [h("div", {}, [h("h1", { text: l.title }), h("p", { text: [whenTxt(l), "Grades " + (l.bands || []).join(", "), l.where, l.guides ? "With " + l.guides : ""].filter(Boolean).join(" · ") })]),
        staff ? h("div", { class: "row noprint" }, h("a", { class: "btn go", href: "#schedule=edit." + l.id, text: "Edit this Lab" })) : null])]),
    h("section", { class: "band" }, h("div", { class: "wrap stack" }, [
      l.about ? h("div", { class: "panel" }, [h("h2", { class: "h", text: "What we'll do" }), h("p", { class: "pre", text: l.about })]) : null,
      (l.challenges || []).length ? h("div", { class: "panel" }, [h("h2", { class: "h", text: "Challenges in this Lab" }), savedList(l.challenges.filter(c => BYID[c])),
        h("p", { class: "small muted", text: "Tap a challenge to see its standard, steps and how it's shown." })]) : null,
      h("div", { class: "panel home-support" }, [h("h2", { class: "h", text: "Supporting it at home" }),
        l.home ? h("p", { class: "pre", text: l.home }) : h("p", { class: "muted", text: "Nothing extra needed at home for this one." }),
        files.length || links.length ? h("ul", { class: "files" }, [
          ...files.map(f => h("li", {}, [h("a", { href: f.url, target: "_blank", rel: "noopener", text: f.name }), h("span", { class: "small muted", text: " · " + sizeTxt(f.size || 0) })])),
          ...links.map(k => h("li", {}, h("a", { href: k.url, target: "_blank", rel: "noopener", text: k.label || k.url })))]) : null,
        staff ? null : h("p", { class: "small muted", text: "All of this is optional. Questions? Ask your child's guide." })])
    ]))
  ]);
}

function labForm(l) {
  const isNew = !l; l = l || { bands: [], challenges: [], files: [], links: [] };
  const id = isNew ? doc(collection(db, "labs")).id : l.id;
  const f = {
    title: h("input", { class: "in", id: "lt", maxlength: "120", value: l.title || "", placeholder: "Fire-building Lab" }),
    date: h("input", { class: "in", id: "ld", type: "date", value: l.date || "" }),
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
  drawCh(); drawFiles(); drawLinks();
  const note = h("p", { class: "note", "aria-live": "polite" });
  const say = (t, c) => { note.className = "note " + (c || ""); note.textContent = t; };
  const save = async ev => {
    const title = f.title.value.trim().replace(/\s+/g, " "), date = f.date.value, endDate = f.endDate.value, picked = bands.filter(x => x[1].checked).map(x => x[0]);
    if (title.length < 3) return say("Give the Lab a name.", "err");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return say("Pick the date.", "err");
    if (endDate && endDate < date) return say("The last day is before the first day.", "err");
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
        about: f.about.value.trim(), home: f.home.value.trim(), challenges: chs.slice(0, 8), files: files.concat(uploaded), links: okLinks.map(k => ({ label: (k.label || "").trim().slice(0, 80), url: k.url.slice(0, 500) })),
        updated: Date.now(), updatedBy: S.email, ...(isNew ? { created: Date.now(), createdBy: S.email } : {}) };
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
        h("div", { class: "f" }, [h("span", {}, ["Challenges in this Lab ", h("span", { class: "hint", text: "(optional, up to 8)" })]), chBox])
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
  if (!boardBand || !bandChoices.includes(boardBand)) boardBand = mine ? mine.band : "2–4";
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
  if (HOMES[S.role] && HOMES[S.role] !== PATH) { location.replace(HOMES[S.role] + location.search + location.hash); return; }
  acct();
  if (S.role === "staff") {
    // Inside the staff guides (/guides/lifeskills/), guides also get the Lab builder.
    navLinks(PATH === HOMES.staff ? SUBNAV.guides : [["overview", "Overview"], ["log", "Log"], ["board", "Crew board"], ["schedule", "Labs schedule"]]);
    if (v === "s") return main(record(arg, { staff: true }));
    if (v === "log") return main(logView(arg));
    // Old links to the roster here go to the Student Roster.
    if (v === "roster") { location.replace(ROSTER + (arg ? "#edit=" + arg : "#roster")); return; }
    if (v === "schedule") return main(scheduleView(arg, true));
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
    navLinks(S.mine.map(id => ["c=" + id, firstName(S.students[id].name)]).concat(SUBNAV.parents));
    if (v === "schedule") { document.querySelectorAll("#links a").forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === "#schedule" ? "page" : "false")); return main(scheduleView(arg, false)); }
    const sid = v === "c" && S.mine.includes(arg) ? arg : S.mine[0];
    document.querySelectorAll("#links a").forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === "#c=" + sid ? "page" : "false"));
    return main(record(sid, { parent: true }));
  }
}
addEventListener("hashchange", () => { route(); scrollTo(0, 0); });

// Tell the shared top bar (/wlnav.js) who this is, for the site switcher (staff, parents) and to keep students on the
// Students site. Same "wl-role" event and device memory as /auth.js, which these tracker pages don't load.
const TEAM = ["ian@silverlineventures.com", "online@bodyform.com", "ian.silverberg@gmail.com"];
function tellRole() {
  let d = null;
  if (S.user && TEAM.includes(S.email) && S.role !== "unverified") d = { role: "staff", band: null };
  else if (S.role === "staff" || S.role === "parent") d = { role: S.role, band: null };
  else if (S.role === "student") { const bands = [...new Set(S.mine.map(id => S.students[id] && S.students[id].band).filter(Boolean))]; d = { role: "student", band: bands.length === 1 ? bands[0] : null, sid: S.mine.length === 1 ? S.mine[0] : null }; }
  if (d) d = { email: S.email, ...d };
  window.wlRole = d;
  try { if (d) localStorage.setItem("wl-role", JSON.stringify({ e: d.email, r: d.role, b: d.band, s: d.sid || null })); else localStorage.removeItem("wl-role"); } catch (e) { }
  document.dispatchEvent(new CustomEvent("wl-role", { detail: d }));
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
  tellRole();
  route();
}
(async () => {
  const handled = await finishEmailLink();
  onAuthStateChanged(auth, u => { if (handled && !u && isSignInWithEmailLink(auth, location.href)) return; start(u); });
})();
