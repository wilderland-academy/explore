// Parent Communication coach (staff only). Sign-in comes from /auth.js; AI goes through the same relay as the
// Field Guide and Behavior Guide (address saved in Firestore mentorConfig/main). The writing rules are skill.md;
// page content and mode focus are in data.js. Conversations live in sessionStorage only.
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";
import * as D from "./data.js";

// Outside guests (Ian). Keep in step with auth.js, worker.js, fieldguide/app.js and firestore.rules.
const GUESTS = ["ian@silverlineventures.com", "online@bodyform.com", "ian.silverberg@gmail.com"];
const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const MAX_TURNS = 14;        // most past messages sent back to Claude
const MAX_CHARS = 60000;     // keeps a request well under the relay's 90,000-character limit
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function h(tag, attrs, kids) { const e = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]); } (kids || []).forEach(c => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
const store = { get(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }, del(k) { try { sessionStorage.removeItem(k); } catch (e) { } } };

const app = $("#app");
let fb, db, user = null, relay = "", skill = "", startedFor = null, authSeq = 0, busy = false, ctrl = null;
let mode = (location.hash.slice(1) in D.MODES) ? location.hash.slice(1) : store.get("pc-mode", "newsletter");
const me = () => (user && user.email || "").toLowerCase();
const firstName = () => ((user && user.displayName) || me().split("@")[0]).split(" ")[0];
const thread = () => store.get("pc-" + mode, []);
const saveThread = t => store.set("pc-" + mode, t);

/* ---------------- sign-in gate ---------------- */
function gate(msg) {
  startedFor = null; app.innerHTML = "";
  app.appendChild(h("section", { class: "gate" }, [h("h2", { text: "Wilderland staff area" }), h("p", { text: msg })]));
}
async function onAuth(u) {
  const seq = ++authSeq; user = u;
  if (!u) return gate("Sign in with your Wilderland account, top right, to open the Parent Communication coach.");
  if (startedFor === u.uid) return;
  let ok = ADMINS.includes(me()) || GUESTS.includes(me());
  if (!ok) { try { ok = (await getDoc(doc(db, "staff", me()))).exists(); } catch (e) { ok = false; } }
  if (seq !== authSeq) return;
  if (!ok) return gate("This area is for Wilderland guides and staff. If that's you, ask Alex to add your account.");
  try { const c = await getDoc(doc(db, "mentorConfig", "main")); relay = c.exists() ? (c.data().relay || "") : ""; } catch (e) { relay = ""; }
  if (!skill) { try { const r = await fetch("skill.md", { cache: "no-cache" }); if (r.ok) skill = (await r.text()).replace(/^---[\s\S]*?---\s*/, ""); } catch (e) { skill = ""; } }
  if (seq !== authSeq) return;
  startedFor = u.uid; draw();
}
(async () => {
  while (!window.wlFirebase) await new Promise(r => setTimeout(r, 50));
  fb = window.wlFirebase; db = getFirestore(fb.app);
  document.addEventListener("wl-auth", e => onAuth(e.detail));
  if (fb.auth.authStateReady) { await fb.auth.authStateReady(); onAuth(fb.auth.currentUser); }
})();
addEventListener("hashchange", () => { const k = location.hash.slice(1); if (k in D.MODES && k !== mode && startedFor) setMode(k); });

/* ---------------- the prompt ---------------- */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function calendar() {
  // Today plus the next 120 days, grouped by month, so weekdays come from the calendar instead of the model's guess.
  const now = new Date(), lines = {};
  for (let i = 0; i < 120; i++) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); const k = MONTHS[d.getMonth()] + " " + d.getFullYear(); (lines[k] = lines[k] || []).push(DAYS[d.getDay()] + " " + d.getDate()); }
  return "Today is " + now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) + ".\nCalendar:\n" + Object.entries(lines).map(([m, ds]) => m + ": " + ds.join(", ")).join("\n");
}
function system() {
  const M = D.MODES[mode];
  return [D.FRAME, M.focus, D.PRACTICE, "The guide's first name is " + firstName() + ". Write messages for them to send; do not sign as anyone else.", calendar(), "=== WILDERLAND PARENT COMMUNICATION SKILL (source of truth) ===\n" + skill].join("\n\n");
}
function recent(t) {
  // Send the most recent turns that fit; always start on a guide turn. Back-to-back guide turns (left by a failed
  // reply) are joined so the conversation alternates.
  const merged = [];
  t.filter(m => !m.err).forEach(m => { const p = merged[merged.length - 1]; if (p && p.role === m.role) p.content += "\n\n" + m.content; else merged.push({ role: m.role, content: m.content }); });
  let out = merged.slice(-MAX_TURNS), size = () => out.reduce((n, m) => n + m.content.length, 0);
  while (out.length > 1 && size() > MAX_CHARS) out = out.slice(2);
  while (out.length && out[0].role !== "user") out = out.slice(1);
  return out.map(m => ({ role: m.role, content: m.content }));
}
async function ask(t) {
  if (!relay) throw { code: "norelay" };
  if (!skill) throw { code: "noskill" };
  ctrl = new AbortController();
  const r = await fetch(relay, { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json", Authorization: "Bearer " + await user.getIdToken() }, body: JSON.stringify({ system: system(), messages: recent(t), tier: "deep", max: 3000 }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw { code: r.status, message: j.error || "" };
  return { text: j.text || "", stop: j.stop || "" };
}
const aiErr = e => e && e.name === "AbortError" ? "Stopped." : e && e.code === "norelay" ? "The AI isn't connected yet. An admin adds the relay address on the Mentor Mindset Field Guide's Admin stop." : e && e.code === "noskill" ? "The writing guide (skill.md) didn't load. Reload the page." : e && e.code === 429 ? "The AI is busy. Wait a minute and try again." : (e && (e.code === 401 || e.code === 403)) ? "The AI relay didn't recognize your account. Sign out and back in, or ask an admin." : e && e.code === 413 ? "That conversation got too long. Start a new one and paste just what you need." : "The AI didn't answer. Try again in a moment.";

/* ---------------- Markdown, kept small and safe ---------------- */
function inline(s) {
  return esc(s)
    .replace(/\*\*\[(CONFIRM|ADD|CHECK)([^\]]*)\]\*\*/g, '<mark class="ph">[$1$2]</mark>')
    .replace(/\[(CONFIRM|ADD|CHECK):([^\]]*)\]/g, '<mark class="ph">[$1:$2]</mark>')
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, "$1<i>$2</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
function blocks(md) {
  const lines = md.replace(/\r/g, "").split("\n"), out = [];
  let list = null, para = [];
  const flushP = () => { if (para.length) { out.push("<p>" + para.map(inline).join("<br>") + "</p>"); para = []; } };
  const flushL = () => { if (list) { out.push("<" + list.t + ">" + list.items.map(i => "<li>" + inline(i) + "</li>").join("") + "</" + list.t + ">"); list = null; } };
  for (const raw of lines) {
    const l = raw.trimEnd(); let m;
    if (!l.trim()) { flushP(); flushL(); continue; }
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) { flushP(); flushL(); out.push("<h4>" + inline(m[2]) + "</h4>"); continue; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(l.trim())) { flushP(); flushL(); continue; }
    if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { flushP(); if (!list || list.t !== "ul") { flushL(); list = { t: "ul", items: [] }; } list.items.push(m[1]); continue; }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { flushP(); if (!list || list.t !== "ol") { flushL(); list = { t: "ol", items: [] }; } list.items.push(m[1]); continue; }
    if (list && /^\s{2,}\S/.test(raw)) { list.items[list.items.length - 1] += " " + l.trim(); continue; }
    flushL(); para.push(l);
  }
  flushP(); flushL();
  return out.join("");
}
// Split a reply into prose and the ready-to-send message block(s).
function parts(text) {
  const out = [], re = /```message[^\n]*\n([\s\S]*?)(?:\n```|$)/g; let last = 0, m;
  while ((m = re.exec(text))) { if (m.index > last) out.push({ k: "md", v: text.slice(last, m.index) }); out.push({ k: "msg", v: m[1].replace(/\n+$/, ""), open: !text.slice(m.index).match(/^```message[^\n]*\n[\s\S]*?\n```/) }); last = re.lastIndex; }
  if (last < text.length) out.push({ k: "md", v: text.slice(last) });
  return out;
}
const plain = s => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/(^|\s)\*(\S.*?)\*/g, "$1$2").replace(/^\s*[*•]\s+/gm, "- ");
async function copyMsg(src, btn) {
  const subj = (src.match(/^Subject:\s*(.*)$/m) || [])[1];
  const body = src.replace(/^Subject:.*\n+/, "");
  const txt = plain(body), html = blocks(body).replace(/<mark class="ph">/g, '<span style="background:#fff2a8">').replace(/<\/mark>/g, "</span>");
  try {
    if (window.ClipboardItem && navigator.clipboard.write) await navigator.clipboard.write([new ClipboardItem({ "text/plain": new Blob([txt], { type: "text/plain" }), "text/html": new Blob([html], { type: "text/html" }) })]);
    else await navigator.clipboard.writeText(txt);
    btn.textContent = subj ? "Copied body ✓" : "Copied ✓";
  } catch (e) { btn.textContent = "Select and copy by hand"; }
  setTimeout(() => { btn.textContent = "Copy message"; }, 2200);
}
async function copyText(t, btn, label) { try { await navigator.clipboard.writeText(t); btn.textContent = "Copied ✓"; } catch (e) { btn.textContent = "Couldn't copy"; } setTimeout(() => { btn.textContent = label; }, 2000); }

function msgCard(src, open) {
  const subj = (src.match(/^Subject:\s*(.*)$/m) || [])[1];
  const body = src.replace(/^Subject:.*\n+/, "");
  const ph = (src.match(/\[(CONFIRM|ADD|CHECK)[^\]]*\]/g) || []).length;
  const review = /DRAFT FOR LEADERSHIP REVIEW/.test(src);
  const bar = h("div", { class: "mbar" }, [
    h("span", { class: "mlab", text: review ? "Draft for leadership review" : "Ready to send" + (ph ? " after " + ph + " fill-in" + (ph > 1 ? "s" : "") : "") }),
    subj ? h("button", { class: "mini", text: "Copy subject", onclick: e => copyText(subj, e.target, "Copy subject") }) : null,
    h("button", { class: "mini strong", text: "Copy message", onclick: e => copyMsg(src, e.target) })
  ]);
  return h("div", { class: "mcard" + (review ? " review" : "") }, [bar, subj ? h("div", { class: "msubj" }, [h("span", { text: "Subject" }), h("b", { text: subj })]) : null, h("div", { class: "mbody", html: blocks(body) }), open ? h("p", { class: "cut", text: "This message looks cut off. Ask \"Please finish the message\" to get the rest." }) : null]);
}
function bubble(m) {
  if (m.role === "user") return h("div", { class: "turn u" }, [h("div", { class: "who", text: "You" }), h("div", { class: "utext", text: m.content })]);
  if (m.err) return h("div", { class: "turn a err" }, [h("p", { text: m.content })]);
  const kids = [h("div", { class: "who", text: "Coach" })];
  for (const p of parts(m.content)) kids.push(p.k === "msg" ? msgCard(p.v, p.open) : h("div", { class: "prose", html: blocks(p.v) }));
  if (m.stop === "max_tokens") kids.push(h("p", { class: "cut", text: "This reply hit the length limit. Ask \"Please continue\" for the rest." }));
  return h("div", { class: "turn a" }, kids);
}

/* ---------------- page ---------------- */
function setMode(k) { if (busy && ctrl) ctrl.abort(); mode = k; store.set("pc-mode", k); history.replaceState(null, "", "#" + k); draw(); }
function draw() {
  const M = D.MODES[mode], t = thread();
  document.body.dataset.mode = M.color;
  app.innerHTML = "";
  const tabs = h("div", { class: "modes", role: "tablist", "aria-label": "Kind of message" }, Object.entries(D.MODES).map(([k, v]) =>
    h("button", { role: "tab", class: "mode " + v.color, "aria-selected": String(k === mode), onclick: () => k !== mode && setMode(k) }, [h("b", { text: v.label }), h("span", { text: v.short })])));
  const head = h("header", { class: "hero" }, [
    h("p", { class: "eyebrow", text: "Staff guides · Parent Communication" }),
    h("h1", { html: "Write to families <span>with confidence.</span>" }),
    h("p", { class: "lede", text: "Tell the coach what you need or paste a draft. You get a message you can send right away, plus the one or two things that would make it better. Your voice stays yours." })
  ]);

  const log = h("div", { class: "log", id: "log", "aria-live": "polite" });
  if (!t.length) log.appendChild(h("div", { class: "empty" }, [h("h3", { text: M.label }), h("p", { text: M.intro }), h("p", { class: "small", text: "Start with a button below, or just type." })]));
  t.forEach(m => log.appendChild(bubble(m)));
  if (busy) log.appendChild(h("div", { class: "turn a typing" }, [h("div", { class: "who", text: "Coach" }), h("span", { class: "dots", html: "<i></i><i></i><i></i>" })]));

  const box = h("textarea", { id: "box", rows: "4", placeholder: placeholder(), "aria-label": "Your message to the coach" });
  box.value = store.get("pc-draft-" + mode, "");
  box.oninput = () => store.set("pc-draft-" + mode, box.value);
  box.onkeydown = e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } };
  const starters = h("div", { class: "starters" }, M.starters.map(([lab, text]) => h("button", { class: "starter" + (text.startsWith("PRACTICE:") ? " prac" : ""), disabled: busy || null, onclick: () => {
    if (/\n\n$|: $/.test(text)) { box.value = text; store.set("pc-draft-" + mode, text); box.focus(); box.setSelectionRange(text.length, text.length); }
    else send(text);
  } }, [text.startsWith("PRACTICE:") ? h("i", { text: "Practice" }) : null, lab])));
  const sendBtn = h("button", { class: "send", text: busy ? "Stop" : "Send", onclick: () => busy ? ctrl && ctrl.abort() : send() });
  const composer = h("div", { class: "composer" }, [starters, box, h("div", { class: "crow" }, [
    h("span", { class: "small", text: "Ctrl/⌘ + Enter to send · " + D.PRIVACY }),
    t.length ? h("button", { class: "ghost", text: "New conversation", disabled: busy || null, onclick: () => { saveThread([]); store.del("pc-draft-" + mode); draw(); } }) : null,
    sendBtn
  ])]);

  const chat = h("section", { class: "chat", "aria-label": "Coach conversation" }, [log, composer]);
  const side = h("aside", { class: "side" }, [
    h("h3", { text: "What good looks like" }),
    h("ol", { class: "look" }, M.look.map(([a, b]) => h("li", null, [h("b", { text: a }), h("span", { text: b })]))),
    h("div", { class: "every" }, [h("h4", { text: "Every message" }), h("ul", null, ["Purpose in the first sentence", "Action needed (by when), optional, or no action", "What's different from a normal day", "Required, optional or opt-out, for anything students do", "Who to contact", "Weekday with every date. No em-dashes."].map(x => h("li", { text: x })))]),
    h("div", { class: "review" }, [h("h4", { text: "Get sign-off first" }), h("p", { text: "Safety, injury, illness, discipline, enrollment, a complaint or conflict, policy, tuition or money, higher-risk activities, or anything you feel uneasy about. Any injury or allergic reaction goes to Shanan the same day, before families hear." })]),
    !relay ? h("p", { class: "warn", text: "The AI relay isn't connected, so the coach can't answer yet. An admin sets it on the Field Guide's Admin stop." }) : null,
    h("p", { class: "small", text: "Built on Ian's Wilderland parent communication guide, the Parent Event Communication Checklist, the Parent Concern Protocol and the Informed Parents policy. Always reread before you send: the family will read it as yours." })
  ]);
  app.append(head, tabs, h("div", { class: "work" }, [chat, side]));
  log.scrollTop = log.scrollHeight;
  if (!busy && t.length) { const last = log.lastElementChild; if (last && last.classList.contains("a")) last.scrollIntoView({ block: "nearest" }); }
}
function placeholder() {
  return { newsletter: "Paste your notes or a draft, or tell me what happened this week…", service: "Paste the parent's message (and your draft reply, if you have one)…", event: "What's the event? Date, time, place, who's going, and anything you're unsure about…" }[mode];
}
async function send(text) {
  if (busy) return;
  const box = $("#box"); text = (text ?? (box ? box.value : "")).trim();
  if (!text) { box && box.focus(); return; }
  const forMode = mode, t = thread().filter(m => !m.err);
  t.push({ role: "user", content: text }); saveThread(t); store.del("pc-draft-" + forMode);
  busy = true; draw();
  let reply;
  try { const r = await ask(t); reply = { role: "assistant", content: r.text || "The coach sent back an empty reply. Try again.", stop: r.stop }; if (!r.text) reply.err = true; }
  catch (e) { reply = { role: "assistant", content: aiErr(e), err: true }; }
  busy = false; ctrl = null;
  const now = store.get("pc-" + forMode, []); now.push(reply); store.set("pc-" + forMode, now);
  if (mode === forMode) draw();
  else { const b = document.querySelector(".mode." + D.MODES[forMode].color); b && b.classList.add("new"); }
}
