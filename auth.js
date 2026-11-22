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
const SITES = [["Books", "/books/"], ["Challenges", "/challenges/"], ["Projects", "/projects/"], ["Life Skills tracker", "/lifeskills/"]];

const me = document.querySelector('script[src$="auth.js"]');
const SITE = (me && me.dataset.site) || "";
// What each site keeps in the browser. Add a line here when a new site joins.
const ALLKEYS = { books: ["lantern-stacks"], challenges: ["wl-picks", "wl-band"], projects: ["atlas-sparks", "atlas-me"], store: ["wl-store"] };
const KEYS = ALLKEYS[SITE] || [];
// Clear every site's saved things from this Chromebook (on sign-out, here or on another site).
function forgetDevice() { applying = true; Object.entries(ALLKEYS).forEach(([s, ks]) => { ks.forEach(k => origRemove.call(localStorage, k)); origRemove.call(localStorage, "wl-linked-" + s); }); applying = false; }
const DOC = uid => `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents/students/${uid}/sites/${SITE}`;

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
  const body = { fields: { data: { stringValue: JSON.stringify(readLocal()) }, updated: { timestampValue: new Date().toISOString() }, email: { stringValue: user.email || "" } } };
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
async function syncOnSignIn() {
  if (!SITE || !KEYS.length) return;
  setState("saving");
  try {
    const remote = await pull(), local = readLocal();
    const firstHere = localStorage.getItem(LINK()) !== user.uid;
    if (!remote) { await push(); origSet.call(localStorage, LINK(), user.uid); return; }
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
    origSet.call(localStorage, LINK(), user.uid);
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
    host.innerHTML = `<button type="button" data-wla="menu" aria-expanded="${open}"><span class="av">${esc((family.email || "?")[0].toUpperCase())}</span><span>Parent</span></button>
    ${open ? `<div class="menu"><p>Signed in as ${esc(family.email)}, a family account.</p><a href="/parents/lifeskills/">Life Skills tracker</a><a href="/challenges/parents.html">Passing off at home</a><a href="/parents/">Parents home</a><hr><button type="button" data-wla="out">Sign out</button></div>` : ""}`;
    return;
  }
  if (!user) {
    host.innerHTML = `<button class="out" type="button" data-wla="in">Sign in</button>`;
    return;
  }
  const first = (user.displayName || user.email || "?").trim();
  host.innerHTML = `<button type="button" data-wla="menu" aria-expanded="${open}"><span class="av">${user.photoURL ? `<img src="${esc(user.photoURL)}" alt="" referrerpolicy="no-referrer">` : esc(first[0].toUpperCase())}</span><span>${esc(first.split(" ")[0])}</span><span class="st ${state}" title="Saved to your account"></span></button>
  ${open ? `<div class="menu"><p>Signed in as ${esc(user.email)}. What you save here follows you to any Chromebook.</p>${links}<hr><button type="button" data-wla="out">Sign out</button></div>` : ""}`;
}
host.addEventListener("click", async e => {
  const b = e.target.closest("[data-wla]"); if (!b) return;
  if (b.dataset.wla === "menu") { open = !open; render(); return; }
  if (b.dataset.wla === "out") {
    open = false;
    if (pushTimer) { clearTimeout(pushTimer); await push(); }
    await signOut(auth);
    // Leave nothing behind for the next person on this Chromebook.
    forgetDevice();
    location.reload(); return;
  }
  if (b.dataset.wla === "in") wlSignIn();
});
async function wlSignIn() {
  const p = new GoogleAuthProvider(); p.setCustomParameters(SITE === "fieldguide" ? { prompt: "select_account" } : { hd: DOMAIN, prompt: "select_account" });
  try { await signInWithPopup(auth, p); }
  catch (err) { if (err && err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") msg("Sign-in didn't work. Make sure pop-ups are allowed, and use your @" + DOMAIN + " account."); }
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
  const slot = document.querySelector("[data-wl-auth]");
  if (slot) slot.appendChild(host); else { host.classList.add("float"); document.body.appendChild(host); }
  render();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();

onAuthStateChanged(auth, async u => {
  const em = ((u && u.email) || "").toLowerCase();
  family = null;
  // A confirmed family account: keep it signed in (so the tracker stays open) but treat this page as signed out.
  if (u && u.emailVerified && !em.endsWith("@" + DOMAIN) && !(GUEST_SITES.includes(SITE) && GUESTS.includes(em))) {
    family = u; user = null; render(); gate(null); announce(null); return;
  }
  if (u && !((em.endsWith("@" + DOMAIN) && u.emailVerified) || (GUEST_SITES.includes(SITE) && u.emailVerified && GUESTS.includes(em)))) {
    await signOut(auth); msg("Please sign in with your @" + DOMAIN + " school account."); user = null; render(); gate(null); announce(null); return;
  }
  // Signed out (maybe on another site): don't leave the last student's things for the next person.
  if (!u && Object.keys(ALLKEYS).some(k => localStorage.getItem("wl-linked-" + k))) { forgetDevice(); location.reload(); return; }
  const was = user; user = u; render();
  gate(u); announce(u);
  if (u && !was) syncOnSignIn();
});
