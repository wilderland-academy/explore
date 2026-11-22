// Wilderland AI Coach: the chat panel students open from a challenge, a project spark, or /coach/.
// All the safety work happens in the relay Worker (relay/worker.js): it screens each message, removes personal
// details, answers serious messages with fixed words, checks each reply, logs everything for guides, and alerts staff.
// This file only draws the chat and walks students through using it.
//   WLCoach.open({ kind: "challenge" | "project" | "lesson", topicId, topicTitle, context, starters: [..] })
//   WLCoach.open({ chatId })            reopen a past conversation
//   opts.first: a message to send as soon as the chat opens (from a starter button on the page)
// Needs /auth.js on the page (window.wlFirebase). Only school accounts can use it; K–1 students can't (guide-led).
const FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
const INTRO_KEY = "wl-coach-intro";

const css = `
.wlc-back{position:fixed;inset:0;background:rgba(10,30,22,.45);z-index:80;opacity:0;transition:opacity .2s}
.wlc-back.on{opacity:1}
.wlc{position:fixed;top:0;right:0;bottom:0;width:min(460px,100vw);background:#fbfcf6;color:#14231c;z-index:81;display:flex;flex-direction:column;box-shadow:-12px 0 40px rgba(0,0,0,.25);transform:translateX(100%);transition:transform .25s ease;font:400 16px/1.5 Inter,"Uncut Sans",system-ui,sans-serif}
.wlc.on{transform:none}
.wlc *{box-sizing:border-box}
.wlc-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#01412f;color:#fff}
.wlc-head .av{width:34px;height:34px;border-radius:10px;background:#d5f367;display:grid;place-items:center;flex:none}
.wlc-head .av svg{width:22px;height:22px}
.wlc-head .t{flex:1;min-width:0}
.wlc-head b{display:block;font-size:16px;line-height:1.2}
.wlc-head span{display:block;font-size:13px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wlc-x{width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;font-size:22px;line-height:1;flex:none}
.wlc-x:focus-visible,.wlc button:focus-visible,.wlc textarea:focus-visible{outline:2px solid #d5f367;outline-offset:2px}
.wlc-ai{margin:0;padding:8px 14px;background:#eef4d6;font-size:13px;color:#34463c;border-bottom:1px solid #dfe6cc}
.wlc-log{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:10px}
.wlc-m{max-width:88%;padding:10px 13px;border-radius:16px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:15.5px}
.wlc-m.coach{background:#fff;border:1px solid #e1e7d6;border-bottom-left-radius:5px;align-self:flex-start}
.wlc-m.me{background:#015640;color:#fff;border-bottom-right-radius:5px;align-self:flex-end}
.wlc-m.note{align-self:center;max-width:94%;background:none;color:#5c6b62;font-size:13px;text-align:center;padding:2px 8px}
.wlc-m .tip{display:block;margin-top:8px;padding:7px 10px;border-radius:10px;background:#f2f8dc;color:#2b3d33;font-size:14px}
.wlc-typing{align-self:flex-start;color:#5c6b62;font-size:14px;padding:4px 6px}
.wlc-typing i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#7b8a80;margin-right:4px;animation:wlcb 1s infinite}
.wlc-typing i:nth-child(2){animation-delay:.15s}.wlc-typing i:nth-child(3){animation-delay:.3s}
@keyframes wlcb{0%,80%,100%{opacity:.25}40%{opacity:1}}
.wlc-intro{background:#fff;border:1px solid #e1e7d6;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px}
.wlc-intro h3{margin:0;font-size:18px}
.wlc-intro ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px}
.wlc-intro li b{display:block}
.wlc-chips{display:flex;flex-wrap:wrap;gap:8px;padding:4px 14px 10px}
.wlc-chip{border:1.5px solid #015640;background:#fff;color:#015640;border-radius:999px;padding:7px 13px;font:600 14px/1.2 inherit;cursor:pointer;text-align:left}
.wlc-chip:hover{background:#eef4d6}
.wlc-foot{border-top:1px solid #e1e7d6;padding:10px 12px 12px;background:#fff}
.wlc-row{display:flex;gap:8px;align-items:flex-end}
.wlc textarea{flex:1;resize:none;min-height:46px;max-height:140px;border:1.5px solid #cfd8c4;border-radius:14px;padding:11px 12px;font:inherit;font-size:15.5px;color:inherit;background:#fff}
.wlc-send{height:46px;min-width:64px;border:0;border-radius:14px;background:#d5f367;color:#0b2b20;font:700 15px inherit;cursor:pointer;padding:0 14px}
.wlc-send:disabled{opacity:.5;cursor:default}
.wlc-hint{margin:6px 2px 0;font-size:12.5px;color:#5c6b62}
.wlc-hint a{color:#015640}
.wlc-btn{border:0;border-radius:12px;background:#d5f367;color:#0b2b20;font:700 15px inherit;padding:11px 16px;cursor:pointer;align-self:flex-start}
.wlc-btn.ghost{background:#eef1ea}
@media (prefers-reduced-motion:reduce){.wlc,.wlc-back{transition:none}.wlc-typing i{animation:none}}
`;
const BOT = '<svg viewBox="0 0 24 24" fill="none" stroke="#01412f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>';
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STARTERS = {
  challenge: ["Help me make a plan", "Explain how to start", "Quiz me on it", "I'm stuck", "Am I ready to show my guide?"],
  project: ["Help me pick a version", "Break it into small steps", "What can I do today?", "I'm stuck"],
  lesson: ["What is an AI coach?", "Let's start the lesson"]
};

let el = null, st = null, relay = "";

function user() { return window.wlFirebase && window.wlFirebase.auth.currentUser; }
async function token() { const u = user(); if (!u) throw new Error("signed out"); return u.getIdToken(); }
async function relayUrl() {
  if (relay) return relay;
  const r = await fetch(FS + "/mentorConfig/main", { headers: { Authorization: "Bearer " + await token() } });
  if (!r.ok) throw new Error("config " + r.status);
  const j = await r.json();
  relay = (j.fields && j.fields.relay && j.fields.relay.stringValue) || "";
  if (!relay) throw new Error("no relay");
  return relay;
}
function val(v) { if (!v) return null; if ("stringValue" in v) return v.stringValue; if ("integerValue" in v) return Number(v.integerValue); if ("booleanValue" in v) return v.booleanValue; if ("doubleValue" in v) return v.doubleValue; if ("arrayValue" in v) return (v.arrayValue.values || []).map(val); return null; }
const docOf = d => ({ id: d.name.split("/").pop(), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, val(v)])) });
async function query(coll, filters) {
  const f = filters.map(([field, value]) => ({ fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: value } } }));
  const r = await fetch(FS + ":runQuery", { method: "POST", headers: { Authorization: "Bearer " + await token(), "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: coll }], where: f.length === 1 ? f[0] : { compositeFilter: { op: "AND", filters: f } }, limit: 300 } }) });
  if (!r.ok) throw new Error("query " + r.status);
  return (await r.json()).filter(x => x.document).map(x => docOf(x.document));
}

function mount() {
  if (el) return;
  const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
  const back = document.createElement("div"); back.className = "wlc-back"; back.hidden = true;
  const box = document.createElement("section"); box.className = "wlc"; box.hidden = true;
  box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "wlc-title");
  box.innerHTML = `<div class="wlc-head"><div class="av">${BOT}</div><div class="t"><b id="wlc-title">AI Coach</b><span id="wlc-topic"></span></div><button class="wlc-x" type="button" aria-label="Close the coach">×</button></div>
    <p class="wlc-ai">I'm an AI, not a person, and I can make mistakes. Your guides can read our chats. Never type your full name, address, phone or passwords.</p>
    <div class="wlc-log" id="wlc-log" aria-live="polite"></div>
    <div class="wlc-chips" id="wlc-chips"></div>
    <div class="wlc-foot"><form class="wlc-row" id="wlc-form"><label class="sr-wlc" for="wlc-in" style="position:absolute;left:-9999px">Message your coach</label><textarea id="wlc-in" rows="1" maxlength="800" placeholder="Ask your coach…"></textarea><button class="wlc-send" type="submit">Send</button></form>
    <p class="wlc-hint">Good questions say what you're working on, what you tried, and what help you want. <a href="/coach/">All my chats</a></p></div>`;
  document.body.append(back, box);
  el = { back, box, log: box.querySelector("#wlc-log"), chips: box.querySelector("#wlc-chips"), form: box.querySelector("#wlc-form"), input: box.querySelector("#wlc-in"), send: box.querySelector(".wlc-send"), topic: box.querySelector("#wlc-topic") };
  box.querySelector(".wlc-x").addEventListener("click", close);
  back.addEventListener("click", close);
  box.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    if (e.key === "Tab") { const f = [...box.querySelectorAll("button,textarea,a[href]")].filter(x => !x.disabled && x.offsetParent); if (!f.length) return; if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !box.hidden && !box.contains(document.activeElement)) close(); });
  el.input.addEventListener("input", () => { el.input.style.height = "auto"; el.input.style.height = Math.min(140, el.input.scrollHeight) + "px"; });
  el.input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); el.form.requestSubmit(); } });
  el.form.addEventListener("submit", e => { e.preventDefault(); sendMsg(el.input.value); });
  el.chips.addEventListener("click", e => { const b = e.target.closest("[data-say]"); if (b) sendMsg(b.getAttribute("data-say")); });
  el.log.addEventListener("click", e => {
    const b = e.target.closest("[data-intro-ok]");
    if (b) { try { localStorage.setItem(INTRO_KEY, "1"); } catch (x) { } b.closest(".wlc-intro").remove(); greet(); }
  });
}

function bubble(role, text) {
  const d = document.createElement("div");
  d.className = "wlc-m " + role;
  if (role === "coach") {
    // "Coach tip:" lines get their own little box, so tips about using AI stand out.
    const parts = String(text).split(/\n?(?=Coach tip:)/);
    d.textContent = parts[0].trim();
    parts.slice(1).forEach(p => { const t = document.createElement("span"); t.className = "tip"; t.textContent = p.trim(); d.appendChild(t); });
  } else d.textContent = text;
  el.log.appendChild(d); el.log.scrollTop = el.log.scrollHeight;
  return d;
}
function note(text) { return bubble("note", text); }
function chips(list) {
  el.chips.innerHTML = (list || []).map(t => `<button class="wlc-chip" type="button" data-say="${esc(t)}">${esc(t)}</button>`).join("");
}
function busy(on) {
  st.busy = on; el.send.disabled = on; el.input.disabled = on;
  let t = el.log.querySelector(".wlc-typing");
  if (on && !t) { t = document.createElement("div"); t.className = "wlc-typing"; t.innerHTML = "<i></i><i></i><i></i> Coach is thinking"; el.log.appendChild(t); el.log.scrollTop = el.log.scrollHeight; }
  if (!on && t) t.remove();
}

function intro() {
  // First time on this device: four things to know before the first chat. Short, with a big button.
  const d = document.createElement("div"); d.className = "wlc-intro";
  d.innerHTML = `<h3>Meet your AI Coach</h3><ol>
    <li><b>I'm a computer program, not a person.</b>I guess what words come next. I can be wrong, so check big things with your guide.</li>
    <li><b>You do the thinking.</b>I won't do your work for you. I'll ask questions and give hints so you get better.</li>
    <li><b>Keep private things private.</b>Never type your full name, address, phone, school or passwords.</li>
    <li><b>Your guides can read our chats.</b>If something is wrong or you feel unsafe, tell a real adult. That's what they're there for.</li></ol>
    <button class="wlc-btn" type="button" data-intro-ok>Got it, let's go</button>`;
  el.log.appendChild(d);
  chips([]);
  setTimeout(() => d.querySelector("button").focus(), 50);
}
function greet() {
  const k = st.kind;
  const hello = k === "lesson" ? "Hi! I'm your AI Coach. Want a 3-minute lesson on how to get the most out of me? Tap a button below or type a question."
    : k === "project" ? "Hi! Let's work on your project. Tap a button below to start, or tell me what you're thinking."
    : "Hi! Let's work on this challenge. Tap a button below to start, or ask me anything about it.";
  bubble("coach", hello);
  // Opened from a starter button on the page: send that message straight away.
  if (st.first) { const f = st.first; st.first = ""; sendMsg(f); return; }
  chips(st.starters && st.starters.length ? st.starters : STARTERS[k] || STARTERS.challenge);
}

async function sendMsg(text, again) {
  text = String(text || "").trim();
  if (!text || st.busy) return;
  el.input.value = ""; el.input.style.height = "auto";
  if (!again) bubble("me", text);
  chips([]); busy(true);
  try {
    const r = await fetch(await relayUrl(), { method: "POST", headers: { Authorization: "Bearer " + await token(), "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "coach", kind: st.kind, chatId: st.chatId || "", topicId: st.topicId || "", topicTitle: st.topicTitle || "", context: st.context || "", message: text }) });
    const j = await r.json().catch(() => ({}));
    busy(false);
    if (!r.ok) { note(j.error || "Something went wrong. Try again in a minute."); chips(r.status === 409 ? [] : ["Try again"]); if (r.status !== 409 && r.status !== 429) st.retry = text; return; }
    st.chatId = j.chatId;
    if (j.redacted) note("I took out some personal details before saving your message. Keep those private!");
    bubble("coach", j.reply);
    chips(j.next && j.next.length ? j.next : []);
    if (j.limit && j.used >= j.limit - 5 && j.used < j.limit) note(`${j.limit - j.used} messages left today.`);
    else if (j.used && j.used % 15 === 0) note("You've been working with the coach for a while. Try the next step on your own, or take a stretch break and come back.");
  } catch (e) {
    busy(false);
    note(e.message === "signed out" ? "Sign in with your school account to use the coach." : e.message === "no relay" ? "The coach isn't switched on yet. Ask your guide." : "Couldn't reach the coach. Check your connection and try again.");
    chips(["Try again"]); st.retry = text;
  }
}

async function loadChat(chatId) {
  const u = user();
  const turns = (await query("aiTurns", [["chatId", chatId], ["uid", u.uid]])).sort((a, b) => a.at - b.at);
  const chat = await fetch(FS + "/aiChats/" + chatId, { headers: { Authorization: "Bearer " + await token() } }).then(r => r.ok ? r.json() : null);
  return { chat: chat ? docOf(chat) : null, turns };
}

async function open(opts) {
  mount();
  const role = window.wlRole;
  if (!user()) { if (window.wlSignIn) window.wlSignIn(); return; }
  if (role && role.role === "student" && role.band === "K–1") { alert("The AI Coach is for grades 2 to 8. Your guide will help you with challenges."); return; }
  if (role && role.role === "parent") { alert("The AI Coach is for students, signed in with their school account."); return; }
  st = { kind: opts.kind || "challenge", chatId: opts.chatId || "", topicId: opts.topicId || "", topicTitle: opts.topicTitle || "", context: opts.context || "", starters: opts.starters || null, first: opts.first || "", busy: false, retry: "" };
  el.log.innerHTML = ""; chips([]);
  el.back.hidden = el.box.hidden = false;
  requestAnimationFrame(() => { el.back.classList.add("on"); el.box.classList.add("on"); });
  document.documentElement.style.overflow = "hidden";
  st.lastFocus = document.activeElement;
  if (st.chatId) {
    el.topic.textContent = "Loading…";
    try {
      const { chat, turns } = await loadChat(st.chatId);
      if (chat) { st.kind = chat.kind; st.topicId = chat.topicId || ""; st.topicTitle = chat.topicTitle || ""; }
      el.topic.textContent = st.topicTitle || (st.kind === "lesson" ? "How to use your coach" : "");
      turns.forEach(t => bubble(t.role === "student" ? "me" : "coach", t.text));
      note("You can keep going where you left off.");
      chips(STARTERS[st.kind] ? STARTERS[st.kind].slice(0, 3) : []);
    } catch (e) { note("Couldn't load that conversation."); }
  } else {
    el.topic.textContent = st.topicTitle || (st.kind === "lesson" ? "How to use your coach" : "");
    let seen = false; try { seen = localStorage.getItem(INTRO_KEY) === "1"; } catch (e) { }
    if (seen) greet(); else intro();
  }
  setTimeout(() => { if (!el.log.querySelector("[data-intro-ok]")) el.input.focus(); }, 80);
}
function close() {
  if (!el || el.box.hidden) return;
  el.back.classList.remove("on"); el.box.classList.remove("on");
  document.documentElement.style.overflow = "";
  setTimeout(() => { el.back.hidden = el.box.hidden = true; }, 250);
  if (st && st.lastFocus && document.contains(st.lastFocus)) st.lastFocus.focus();
  document.dispatchEvent(new CustomEvent("wl-coach-closed", { detail: { chatId: st && st.chatId } }));
}
// "Try again" re-sends the last message that didn't go through.
document.addEventListener("click", e => { const b = e.target.closest('.wlc-chip[data-say="Try again"]'); if (b && st && st.retry) { e.stopPropagation(); const t = st.retry; st.retry = ""; const last = el.log.lastElementChild; if (last && last.classList.contains("note")) last.remove(); sendMsg(t, true); } }, true);

// Who may use it: school accounts that are students in grades 2–8, or staff (to try it out).
function canUse(r) { return !!(r && (r.role === "staff" || (r.role === "student" && r.band !== "K–1"))); }
window.WLCoach = { open, close, canUse };
document.dispatchEvent(new CustomEvent("wl-coach-ready"));
