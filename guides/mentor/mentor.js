// Wilderland Trail Partner 🐲: one AI for guides that knows the Staff Handbook, the Behavior Policy and how Wilderland
// works (the Field Guide, Our Approach, At Home, Parent Comms rules, the Lab builder rules). Staff only.
// It opens as a side panel beside the page (a bottom panel on phones), like the students' Mr. Fox, from:
//   - the 🐲 button in the Guides top bar on every staff page (/wlnav.js loads this file on first click),
//   - the "Ask Trail Partner" button at the top of /guides/ and on the front door for staff,
//   - /guides/?mentor (and ?mentor=<thread id> from Your conversations to continue one).
// The knowledge lives in the relay Worker (mode "mentor"); the handbook and policy are never sent from or stored in
// this public site. Conversations are saved to the staff member's own history (coachLog, site "guide").
//   import("/guides/mentor/mentor.js").then(m => m.open({ ask, prefill, threadId }))  (or window.wlOpenMentor(opts))
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";
import { coachLog } from "/guides/log.js";

const CONFIG = {
  apiKey: "AIzaSyB_JSjvnUlSCnx4BIwRTLicHllmCgF2iOM", authDomain: "wilderland-df15e.firebaseapp.com", projectId: "wilderland-df15e",
  storageBucket: "wilderland-df15e.firebasestorage.app", messagingSenderId: "310046559783", appId: "1:310046559783:web:66af8f02d96d315ab14802"
};
// Reuse the page's Firebase app (auth.js or the Life Skills tracker made it) so we share its sign-in.
const app = getApps()[0] || initializeApp(CONFIG);
const auth = getAuth(app), db = getFirestore(app);
const DRAGON = "🐲";
const STARTERS = [
  "A student keeps disrupting the Lab. What does our policy say to do?",
  "Help me plan what to say to a parent who is upset",
  "What's our procedure if a child gets hurt outside?",
  "Two students are in a conflict. How do I run it?",
  "What does the handbook say about phones and photos?",
  "Help me plan a Life Skill Lab"
];
const css = `
:root{--wgm-w:min(460px,42vw);--wgm-h:min(66vh,620px)}
html.wgm-docked body{margin-right:var(--wgm-w);transition:margin-right .25s ease}
.wgm{position:fixed;top:0;right:0;bottom:0;width:var(--wgm-w);background:#fbfcf6;color:#14231c;z-index:82;display:flex;flex-direction:column;border-left:1px solid #d6dfcb;transform:translateX(100%);transition:transform .25s ease;font:400 15.5px/1.5 Inter,"Uncut Sans",system-ui,sans-serif}
.wgm.on{transform:none}
.wgm *{box-sizing:border-box}
@media (max-width:860px){
  html.wgm-docked body{margin-right:0;padding-bottom:var(--wgm-h)}
  .wgm{top:auto;left:0;width:100%;height:var(--wgm-h);border-left:0;border-top:1px solid #d6dfcb;border-radius:18px 18px 0 0;transform:translateY(100%);box-shadow:0 -8px 30px rgba(0,0,0,.14)}
  .wgm.big{height:calc(100% - 52px)}
  .wgm-head{border-radius:18px 18px 0 0}
}
@media (min-width:861px){.wgm-size{display:none}}
.wgm-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#0f231c;color:#fff}
.wgm-av{width:40px;height:40px;border-radius:12px;background:#d5f367;display:grid;place-items:center;font-size:26px;line-height:1;flex:none}
.wgm-head .t{flex:1;min-width:0}
.wgm-head b{display:block;font-size:16px;color:#fff}
.wgm-head span{display:block;font-size:12.5px;color:#c9d6cd}
.wgm-head button{width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;font-size:20px;line-height:1;flex:none}
.wgm-head button:focus-visible,.wgm button:focus-visible,.wgm textarea:focus-visible{outline:2px solid #d5f367;outline-offset:2px}
.wgm-log{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:12px}
.wgm-m{max-width:92%;padding:10px 13px;border-radius:16px;overflow-wrap:anywhere}
.wgm-m.ai{background:#fff;border:1px solid #e1e7d6;border-bottom-left-radius:5px;align-self:flex-start;position:relative;margin-left:30px}
.wgm-m.ai::before{content:"🐲";position:absolute;left:-30px;bottom:0;font-size:20px;line-height:1}
.wgm-m.me{background:#0f3d2e;color:#fff;border-bottom-right-radius:5px;align-self:flex-end;white-space:pre-wrap}
.wgm-m.note{align-self:center;background:none;color:#5c6b62;font-size:13px;text-align:center}
.wgm-m p{margin:0 0 8px}.wgm-m p:last-child{margin:0}
.wgm-m ul,.wgm-m ol{margin:0 0 8px;padding-left:20px}
.wgm-m h4{margin:8px 0 4px;font-size:15px}
.wgm-intro{background:#fff;border:1px solid #e1e7d6;border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;font-size:14.5px}
.wgm-intro b{font-size:16px}
.wgm-chips{display:flex;flex-wrap:wrap;gap:8px}
.wgm-chip{border:1.5px solid #0f3d2e;background:#fff;color:#0f3d2e;border-radius:999px;padding:7px 12px;font:600 13.5px/1.25 inherit;cursor:pointer;text-align:left}
.wgm-chip:hover{background:#eef4d6}
.wgm-typing{align-self:flex-start;color:#5c6b62;font-size:14px;margin-left:30px}
.wgm-foot{border-top:1px solid #e1e7d6;padding:10px 12px 12px;background:#fff}
.wgm-row{display:flex;gap:8px;align-items:flex-end}
.wgm textarea{flex:1;resize:none;min-height:46px;max-height:180px;border:1.5px solid #cfd8c4;border-radius:14px;padding:11px 12px;font:inherit;color:inherit;background:#fff}
.wgm-send{height:46px;min-width:64px;border:0;border-radius:14px;background:#d5f367;color:#0b2b20;font:700 15px inherit;cursor:pointer;padding:0 14px}
.wgm-send:disabled{opacity:.5}
.wgm-hint{margin:6px 2px 0;font-size:12px;color:#5c6b62}
.wgm-hint a,.wgm-hint button{color:#0f3d2e;background:none;border:0;padding:0;font:inherit;text-decoration:underline;cursor:pointer}
@media (prefers-reduced-motion:reduce){.wgm,html.wgm-docked body{transition:none}}
`;
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Light Markdown: paragraphs, **bold**, *italic*, "- " and "1. " lists, ### headings. Everything is escaped first.
function md(text) {
  const lines = esc(text).split("\n"), out = []; let list = null;
  const inline = t => t.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>");
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of lines) {
    const l = raw.trimEnd();
    let m;
    if ((m = l.match(/^\s*[-•*]\s+(.*)/))) { if (list !== "ul") { close(); out.push("<ul>"); list = "ul"; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== "ol") { close(); out.push("<ol>"); list = "ol"; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = l.match(/^#{1,4}\s+(.*)/))) { close(); out.push(`<h4>${inline(m[1])}</h4>`); }
    else if (!l.trim()) close();
    else { close(); out.push(`<p>${inline(l)}</p>`); }
  }
  close();
  return out.join("");
}

let el = null, msgs = [], busy = false, relay = "", log = null, threadId = null, created = 0;
const KEY = "wl-guide-mentor";
function mount() {
  if (el) return;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const box = document.createElement("aside"); box.className = "wgm"; box.hidden = true; box.setAttribute("aria-labelledby", "wgm-t");
  box.innerHTML = `<div class="wgm-head"><div class="wgm-av" aria-hidden="true">${DRAGON}</div><div class="t"><b id="wgm-t">Trail Partner</b><span>Knows our handbook, behavior policy and approach</span></div><button class="wgm-new" type="button" aria-label="Start a new conversation" title="New conversation">＋</button><button class="wgm-size" type="button" aria-label="Make the mentor bigger">⤢</button><button class="wgm-x" type="button" aria-label="Close Trail Partner">×</button></div>
    <div class="wgm-log" aria-live="polite"></div>
    <div class="wgm-foot"><form class="wgm-row"><label for="wgm-in" style="position:absolute;left:-9999px">Ask Trail Partner</label><textarea id="wgm-in" rows="1" maxlength="6000" placeholder="Ask anything about your work…"></textarea><button class="wgm-send" type="submit">Send</button></form>
    <p class="wgm-hint">AI can be wrong. Check anything about safety or the law with an admin. Saved to <a href="/guides/history/">your conversations</a>, which only you can see.</p></div>`;
  document.body.append(box);
  el = { box, log: box.querySelector(".wgm-log"), form: box.querySelector("form"), input: box.querySelector("textarea"), send: box.querySelector(".wgm-send") };
  box.querySelector(".wgm-x").addEventListener("click", close);
  box.querySelector(".wgm-new").addEventListener("click", () => { msgs = []; threadId = null; created = 0; save(); draw(); el.input.focus(); });
  box.querySelector(".wgm-size").addEventListener("click", () => box.classList.toggle("big"));
  box.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); close(); } });
  el.input.addEventListener("input", () => { el.input.style.height = "auto"; el.input.style.height = Math.min(180, el.input.scrollHeight) + "px"; });
  el.input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); el.form.requestSubmit(); } });
  el.form.addEventListener("submit", e => { e.preventDefault(); ask(el.input.value); });
  el.log.addEventListener("click", e => { const c = e.target.closest("[data-ask]"); if (c) ask(c.getAttribute("data-ask")); });
}
function draw() {
  el.log.innerHTML = "";
  if (!msgs.length) {
    const d = document.createElement("div"); d.className = "wgm-intro";
    d.innerHTML = `<b>${DRAGON} Hi! I'm Trail Partner.</b><p style="margin:0">Ask me anything about your work. I answer from the Staff Handbook, the Behavior Policy, the Mentor Mindset Field Guide, Our Approach, At Home, and the Parent Comms and Lab builder rules, and I'll tell you which one I'm using.</p><div class="wgm-chips">${STARTERS.map(s => `<button class="wgm-chip" type="button" data-ask="${esc(s)}">${esc(s)}</button>`).join("")}</div>`;
    el.log.append(d);
  }
  msgs.forEach(m => bubble(m.role, m.content, m.err));
  el.log.scrollTop = el.log.scrollHeight;
}
function bubble(role, text, err) {
  const d = document.createElement("div");
  d.className = "wgm-m " + (err ? "note" : role === "user" ? "me" : "ai");
  if (role === "user" || err) d.textContent = text; else d.innerHTML = md(text);
  el.log.append(d); el.log.scrollTop = el.log.scrollHeight;
  return d;
}
function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ msgs, threadId, created })); } catch (e) { } }
async function relayUrl(u) {
  if (relay) return relay;
  const d = await getDoc(doc(db, "mentorConfig", "main"));
  relay = d.exists() ? d.data().relay || "" : "";
  if (!relay) throw new Error("no relay");
  return relay;
}
async function ask(text) {
  text = String(text || "").trim();
  if (!text || busy) return;
  const u = auth.currentUser;
  if (!u) { bubble("ai", "Sign in with your Wilderland staff account first.", true); return; }
  el.input.value = ""; el.input.style.height = "auto";
  if (!msgs.length) el.log.innerHTML = "";
  msgs.push({ role: "user", content: text }); bubble("user", text); save();
  busy = true; el.send.disabled = true;
  const t = document.createElement("div"); t.className = "wgm-typing"; t.textContent = "Looking through our documents…"; el.log.append(t); el.log.scrollTop = el.log.scrollHeight;
  try {
    const history = msgs.filter(m => !m.err).slice(-20).map(m => ({ role: m.role, content: m.content }));
    const r = await fetch(await relayUrl(u), { method: "POST", headers: { Authorization: "Bearer " + await u.getIdToken(), "Content-Type": "application/json" }, body: JSON.stringify({ mode: "mentor", messages: history }) });
    const j = await r.json().catch(() => ({}));
    t.remove();
    if (!r.ok) { const m = { role: "assistant", content: r.status === 403 ? "Trail Partner is for Wilderland staff accounts." : j.error || "Something went wrong. Try again in a minute.", err: true }; msgs.push(m); bubble("assistant", m.content, true); }
    else {
      msgs.push({ role: "assistant", content: j.text + (j.stop === "max_tokens" ? "\n\n(That answer was cut short. Ask me to keep going.)" : "") });
      bubble("assistant", msgs[msgs.length - 1].content);
      try { if (!log) log = coachLog(db, u); if (!threadId) { threadId = log.newId(); created = Date.now(); } await log.save({ id: threadId, site: "guide", kind: "chat", messages: msgs, created }); } catch (e) { /* history is a convenience */ }
    }
  } catch (e) {
    t.remove();
    const m = { role: "assistant", content: e.message === "no relay" ? "The AI isn't switched on yet. Tell Alex." : "Couldn't reach Trail Partner. Check your connection and try again.", err: true };
    msgs.push(m); bubble("assistant", m.content, true);
  }
  busy = false; el.send.disabled = false; save(); el.input.focus();
}
export async function open(opts = {}) {
  mount();
  if (opts.threadId) {
    try {
      const u = auth.currentUser || await new Promise(res => { const off = onAuthStateChanged(auth, x => { off(); res(x); }); });
      log = log || coachLog(db, u);
      const t = await log.get(opts.threadId);
      if (t && t.site === "guide") { msgs = t.messages || []; threadId = t.id; created = t.created || Date.now(); save(); }
    } catch (e) { /* open fresh */ }
  } else if (!msgs.length) {
    try { const s = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (s) { msgs = s.msgs || []; threadId = s.threadId || null; created = s.created || 0; } } catch (e) { }
  }
  draw();
  el.box.hidden = false;
  document.documentElement.classList.add("wgm-docked");
  requestAnimationFrame(() => el.box.classList.add("on"));
  setTimeout(() => dispatchEvent(new Event("resize")), 280);
  if (opts.prefill) { el.input.value = opts.prefill; el.input.dispatchEvent(new Event("input")); }
  setTimeout(() => { el.input.focus(); const n = el.input.value.length; el.input.setSelectionRange(n, n); }, 80);
  if (opts.ask) ask(opts.ask);
}
export function close() {
  if (!el || el.box.hidden) return;
  el.box.classList.remove("on", "big");
  document.documentElement.classList.remove("wgm-docked");
  setTimeout(() => { el.box.hidden = true; dispatchEvent(new Event("resize")); }, 250);
}
export function toggle() { if (el && !el.box.hidden) close(); else open(); }
window.WLMentor = { open, close, toggle };
