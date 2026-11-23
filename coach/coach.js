// Wilderland Mr. Fox: the chat panel students open from a challenge, a project spark, or /coach/.
// It opens as a side panel beside the page (a bottom panel on phones), never over it, so students see both at once.
// All the safety work happens in the relay Worker (relay/worker.js): it screens each message, removes personal
// details, answers serious messages with fixed words, checks each reply, logs everything for guides, and alerts staff.
// This file only draws the chat and walks students through using it.
//   WLCoach.open({ kind, topicId, topicTitle, context, starters: [..] })
//     kind: "challenge" | "project" (about one), "find-challenge" | "find-project" (helps pick one; the Worker sends the
//     list), "conflict" (working out a conflict, from the Behavior Policy), "lesson", or "academic" (a pilot: only for
//     students an admin has unlocked; every academic conversation is flagged to staff in Slack #alerts).
//   Replies can name challenges as [EN-03.2] and project kinds as [[paint]]; they become links (challenges open in a
//   modal beside the coach; [[id]] uses window.WLCoachLinks(id) -> { href, text } if the page provides it).
//   WLCoach.open({ chatId })            reopen a past conversation
//   WLCoach.home({ dock })              the /coach/ page: Mr. Fox stays open in `dock` (half the page), starting on a
//     home screen that offers what it helps with. Closing a conversation there goes back to that screen.
//   opts.first: a message to send as soon as the chat opens (from a starter button on the page)
// Needs /auth.js on the page (window.wlFirebase). Only school accounts can use it; K–1 students can't (guide-led).
const FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
const INTRO_KEY = "wl-coach-intro";
// Bump when the first-time intro changes, so every student sees the new version once.
const INTRO_VERSION = "3";
const KINDS = ["challenge", "project", "find-challenge", "find-project", "conflict", "academic", "lesson"];
const TOPIC_NAMES = { lesson: "How to use your coach", academic: "Help with academics", "find-challenge": "Find a challenge", "find-project": "Find a project idea", conflict: "Work out a conflict" };
// The coach's face: a fox. (Guides have their own mentor, a dragon.)
const FOX = "🦊";

const css = `
:root{--wlc-w:min(420px,40vw);--wlc-h:min(62vh,560px)}
/* The coach sits beside the page, never over it: the page narrows (wide screens) or gets room at the bottom (phones),
   with no dark backdrop, so a student can read the challenge and talk to the coach at the same time. */
html.wlc-docked body{margin-right:var(--wlc-w);transition:margin-right .25s ease}
.wlc{position:fixed;top:0;right:0;bottom:0;width:var(--wlc-w);background:#fbfcf6;color:#14231c;z-index:81;display:flex;flex-direction:column;border-left:1px solid #d6dfcb;transform:translateX(100%);transition:transform .25s ease;font:400 16px/1.5 Inter,"Uncut Sans",system-ui,sans-serif}
.wlc.on{transform:none}
/* A challenge or other sheet that was open stays open, moved into the space left of the coach. */
dialog.wlc-beside[open]{position:fixed;inset:16px calc(var(--wlc-w) + 16px) 16px 16px;margin:auto;max-height:calc(100vh - 32px);z-index:70;box-shadow:0 10px 40px rgba(1,40,30,.22)}
@media (max-width:860px){
  html.wlc-docked body{margin-right:0;padding-bottom:var(--wlc-h)}
  .wlc{top:auto;left:0;width:100%;height:var(--wlc-h);border-left:0;border-top:1px solid #d6dfcb;border-radius:18px 18px 0 0;transform:translateY(100%);box-shadow:0 -8px 30px rgba(0,0,0,.14)}
  .wlc.big{height:calc(100% - 52px)}
  .wlc .wlc-head{border-radius:18px 18px 0 0}
  dialog.wlc-beside[open]{inset:0 0 var(--wlc-h) 0;width:100vw;max-width:100vw;height:auto;max-height:none;border-radius:0}
}
@media (min-width:861px){.wlc-size{display:none}}
.wlc *{box-sizing:border-box}
.wlc-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#01412f;color:#fff}
.wlc-head .av{width:38px;height:38px;border-radius:12px;background:#d5f367;display:grid;place-items:center;flex:none;font-size:24px;line-height:1}
.wlc-m.coach{position:relative;margin-left:30px}
.wlc-m.coach::before{content:"🦊";position:absolute;left:-30px;bottom:0;font-size:20px;line-height:1}
.wlc-m a.wl-ch,.wlc-m a.wlc-link{color:#015640;font-weight:600;text-decoration:underline;text-underline-offset:2px}
.wlc-head .t{flex:1;min-width:0}
.wlc-head b{display:block;font-size:16px;line-height:1.2;color:#fff}
.wlc-head span{display:block;font-size:13px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wlc-head .wlc-topic-link{all:unset;cursor:pointer;display:block;font-size:13px;color:#e9f4d0;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:underline;text-underline-offset:2px}
.wlc-x,.wlc-size{width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;font-size:22px;line-height:1;flex:none}
.wlc-size{font-size:16px}
.wlc-x:focus-visible,.wlc-size:focus-visible,.wlc button:focus-visible,.wlc textarea:focus-visible{outline:2px solid #d5f367;outline-offset:2px}
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
.wlc-intro h4{margin:4px 0 0;font-size:15px}
.wlc-intro ol,.wlc-intro ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px}
.wlc-intro li b{display:block}
.wlc-intro .why{background:#f2f8dc;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;font-size:15px}
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
.wlc-home{display:flex;flex-direction:column;gap:8px;padding:4px 14px 12px}
.wlc-home a,.wlc-home button{all:unset;box-sizing:border-box;cursor:pointer;display:block;background:#fff;border:1.5px solid #d6dfcb;border-radius:14px;padding:11px 14px;color:#14231c;font:600 15px/1.3 Inter,"Uncut Sans",system-ui,sans-serif}
.wlc-home a:hover,.wlc-home button:hover{border-color:#015640}
.wlc-home a:focus-visible,.wlc-home button:focus-visible{outline:2px solid #015640;outline-offset:2px}
.wlc-home small{display:block;font-weight:400;color:#5c6b62;font-size:13.5px;margin-top:2px}
.wlc-btn{border:0;border-radius:12px;background:#d5f367;color:#0b2b20;font:700 15px inherit;padding:11px 16px;cursor:pointer;align-self:flex-start}
.wlc-btn.ghost{background:#eef1ea}
@media (prefers-reduced-motion:reduce){.wlc,html.wlc-docked body{transition:none}.wlc-typing i{animation:none}}
`;
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STARTERS = {
  challenge: ["Help me make a plan", "Explain how to start", "Quiz me on it", "I'm stuck", "Am I ready to show my guide?"],
  project: ["Help me pick a version", "Break it into small steps", "What can I do today?", "I'm stuck"],
  academic: ["I don't get this idea", "Give me a hint, not the answer", "Check my thinking", "Quiz me on the basics", "Where can I learn this?"],
  "find-challenge": ["I love being outside", "I want to build something", "I want to get stronger", "Something with people", "I'm not sure yet"],
  "find-project": ["I love art", "Something with animals", "I want to make money", "I want to help people", "I'm not sure yet"],
  conflict: ["Someone keeps bugging me", "I had a fight with a friend", "I said something I regret", "Two of my friends are fighting", "I'm really upset right now"],
  lesson: ["What is an AI coach?", "Let's start the lesson"]
};

let el = null, st = null, relay = "", pinned = false;

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
  // A side panel (complementary region), not a modal dialog: the page beside it stays readable and usable.
  const box = document.createElement("aside"); box.className = "wlc"; box.hidden = true;
  box.setAttribute("aria-labelledby", "wlc-title");
  box.innerHTML = `<div class="wlc-head"><div class="av" aria-hidden="true">${FOX}</div><div class="t"><b id="wlc-title">Mr. Fox</b><span id="wlc-topic"></span></div><button class="wlc-size" type="button" aria-label="Make the coach bigger" aria-pressed="false">⤢</button><button class="wlc-x" type="button" aria-label="Close the coach">×</button></div>
    <p class="wlc-ai">I'm an AI, not a person, and I can make mistakes. Your guides can read our chats. Never type your full name, address, phone or passwords.</p>
    <div class="wlc-log" id="wlc-log" aria-live="polite"></div>
    <div class="wlc-chips" id="wlc-chips"></div>
    <div class="wlc-foot"><form class="wlc-row" id="wlc-form"><label class="sr-wlc" for="wlc-in" style="position:absolute;left:-9999px">Message your coach</label><textarea id="wlc-in" rows="1" maxlength="800" placeholder="Ask your coach…"></textarea><button class="wlc-send" type="submit">Send</button></form>
    <p class="wlc-hint">Good questions say what you're working on, what you tried, and what help you want. <a href="/coach/">All my chats</a></p></div>`;
  document.body.append(box);
  el = { box, log: box.querySelector("#wlc-log"), chips: box.querySelector("#wlc-chips"), form: box.querySelector("#wlc-form"), input: box.querySelector("#wlc-in"), send: box.querySelector(".wlc-send"), topic: box.querySelector("#wlc-topic") };
  box.querySelector(".wlc-x").addEventListener("click", close);
  // Phones only: grow the coach to (almost) full height and back. On wide screens it is always full height beside the page.
  box.querySelector(".wlc-size").addEventListener("click", e => { const big = box.classList.toggle("big"); e.currentTarget.setAttribute("aria-pressed", String(big)); e.currentTarget.setAttribute("aria-label", big ? "Make the coach smaller" : "Make the coach bigger"); });
  box.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); close(); } });
  el.input.addEventListener("input", () => { el.input.style.height = "auto"; el.input.style.height = Math.min(140, el.input.scrollHeight) + "px"; });
  el.input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); el.form.requestSubmit(); } });
  el.form.addEventListener("submit", e => { e.preventDefault(); sendMsg(el.input.value); });
  el.chips.addEventListener("click", e => {
    const hm = e.target.closest("[data-home]");
    if (hm) { const k = hm.getAttribute("data-home"); open({ kind: k, topicId: k, topicTitle: TOPIC_NAMES[k] }); return; }
    const b = e.target.closest("[data-say]"); if (b) sendMsg(b.getAttribute("data-say"));
  });
  el.log.addEventListener("click", e => {
    const b = e.target.closest("[data-intro-ok]");
    if (b) { try { localStorage.setItem(INTRO_KEY, INTRO_VERSION); } catch (x) { } b.closest(".wlc-intro").remove(); greet(); }
  });
}

// ---- Beside the page ----
// A modal dialog (showModal) makes everything else on the page inert, which would freeze the coach. While the coach is
// open, any sheet the page opens is shown as a plain (non-modal) dialog in the space beside the coach instead, and a
// sheet that was already open is moved there. When the coach closes, those sheets go back to normal.
const realShowModal = HTMLDialogElement.prototype.showModal;
const docked = () => document.documentElement.classList.contains("wlc-docked");
HTMLDialogElement.prototype.showModal = function () {
  if (!docked()) return realShowModal.call(this);
  this.classList.add("wlc-beside");
  if (!this.open) this.show();
};
function sheetsBeside() {
  document.querySelectorAll("dialog[open]").forEach(d => {
    let modal = false; try { modal = d.matches(":modal"); } catch (e) { modal = true; }
    if (!modal) return;
    d.dataset.wlcKeep = "1"; d.close(); delete d.dataset.wlcKeep;
    d.classList.add("wlc-beside"); d.show();
  });
}
function sheetsBack() {
  document.querySelectorAll("dialog.wlc-beside").forEach(d => {
    d.classList.remove("wlc-beside");
    if (d.open) { d.dataset.wlcKeep = "1"; d.close(); delete d.dataset.wlcKeep; realShowModal.call(d); }
  });
}
// Escape only closes a non-modal dialog when it has focus inside; keep that working for sheets beside the coach.
document.addEventListener("keydown", e => {
  if (e.key !== "Escape" || !docked()) return;
  const d = document.activeElement && document.activeElement.closest && document.activeElement.closest("dialog.wlc-beside[open]");
  if (d) { e.preventDefault(); d.close(); }
});

function bubble(role, text) {
  const d = document.createElement("div");
  d.className = "wlc-m " + role;
  if (role === "coach") {
    // "Coach tip:" lines get their own little box, so tips about using AI stand out.
    const parts = String(text).split(/\n?(?=Coach tip:)/);
    linkify(d, parts[0].trim());
    parts.slice(1).forEach(p => { const t = document.createElement("span"); t.className = "tip"; linkify(t, p.trim()); d.appendChild(t); });
  } else d.textContent = text;
  el.log.appendChild(d); el.log.scrollTop = el.log.scrollHeight;
  return d;
}
// Turn [EN-03.2] (a challenge) and [[paint]] (a project kind on the Projects map) into links. Everything else stays text.
function linkify(el, text) {
  const re = /\[\[([a-z0-9-]{1,40})\]\]|\[([A-Z]{2}-\d{2}\.\d{1,2})\]/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    el.append(text.slice(last, m.index));
    let a = null;
    if (m[2]) {
      const t = window.WLChallenge ? window.WLChallenge.title(m[2]) : m[2];
      if (t && t !== m[2]) { a = document.createElement("a"); a.className = "wl-ch"; a.href = "/challenges/#c=" + m[2]; a.setAttribute("data-wl-ch", m[2]); a.textContent = t; }
    } else if (typeof window.WLCoachLinks === "function") {
      const r = window.WLCoachLinks(m[1]);
      if (r) { a = document.createElement("a"); a.className = "wlc-link"; a.href = r.href; a.textContent = r.text; }
    }
    el.append(a || (m[2] ? m[2] : m[1].replace(/-/g, " ")));
    last = re.lastIndex;
  }
  el.append(text.slice(last));
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

// Why ask the coach instead of (or before) a guide. Shown in the first-time intro and on /coach/.
const WHY = `<div class="why"><b>Why ask Mr. Fox, an AI coach?</b>
  <ul><li><b>It's always there.</b>Your guides help a whole crew. The coach can help you right now, even when every guide is busy, or at home.</li>
  <li><b>It knows a little about almost everything.</b>Knots, budgets, birds, speeches, fractions: you can ask about any challenge, Lab or project.</li>
  <li><b>Your guide is still the one who passes you.</b>Show your guide when you're ready, and ask them about anything big, risky or personal.</li></ul></div>`;
function intro() {
  // First time on this device: why use it, what it helps with, and four things to know. Short, with a big button.
  const d = document.createElement("div"); d.className = "wlc-intro";
  d.innerHTML = `<h3>Meet Mr. Fox</h3>${WHY}
    <h4>What it helps with</h4>
    <ul><li><b>Challenges, Life Skill Labs and projects:</b> plans, practice, next steps, getting unstuck.</li>
    <li><b>Working out a conflict:</b> calming down, seeing the other side, and planning what to say, the Wilderland way.</li>
    <li><b>Not academics (yet):</b> it doesn't help with schoolwork. We're trying that with a few students first.</li></ul>
    <h4>Four things to remember</h4><ol>
    <li><b>I'm a computer program, not a person.</b>I guess what words come next. I can be wrong, so check big things with your guide.</li>
    <li><b>You do the thinking.</b>I won't do your work for you. I'll ask questions and give hints so you get better.</li>
    <li><b>Keep private things private.</b>Never type your full name, address, phone, school or passwords.</li>
    <li><b>Your guides can read our chats.</b>If something is wrong or you feel unsafe, tell a real adult. That's what they're there for.</li></ol>
    <button class="wlc-btn" type="button" data-intro-ok>Got it, let's go</button>`;
  el.log.appendChild(d);
  chips([]);
  setTimeout(() => { d.querySelector("button").focus({ preventScroll: true }); el.log.scrollTop = 0; }, 50);
}
function greet() {
  const k = st.kind;
  if (k === "home") return homeChoices();
  const hello = k === "lesson" ? "Hi! I'm Mr. Fox. Want a 3-minute lesson on how to get the most out of me? Tap a button below or type a question."
    : k === "project" ? "Hi! Let's work on your project. Tap a button below to start, or tell me what you're thinking."
    : k === "academic" ? "Hi! Tell me the subject and what you're stuck on. I'll help you figure it out with hints and questions. I won't give you the answer, and your guides look at every academics chat."
    : k === "find-challenge" ? "Hi! Let's find a challenge you'll actually want to do. What are you into lately? A hobby, something you want to try, or something you want to get better at?"
    : k === "find-project" ? "Hi! Let's find a project idea that's yours. What are you into lately, or what's something you wish existed?"
    : k === "conflict" ? "Hi. Conflicts are hard, and it's smart to think one through. Are you feeling calm enough to talk about it, or do you want to take a beat first? When you're ready, tell me a little about what happened."
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
      body: JSON.stringify(asTest({ mode: "coach", kind: st.kind, chatId: st.chatId || "", topicId: st.topicId || "", topicTitle: st.topicTitle || "", context: st.context || "", message: text })) });
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
  if (role && role.role === "student" && role.band === "K–1") { alert("Mr. Fox is for grades 2 to 8. Your guide will help you with challenges."); return; }
  if (role && role.role === "parent") { alert("Mr. Fox is for students, signed in with their school account."); return; }
  const wasOpen = !el.box.hidden;
  st = { kind: KINDS.includes(opts.kind) ? opts.kind : "challenge", chatId: opts.chatId || "", topicId: opts.topicId || "", topicTitle: opts.topicTitle || "", context: opts.context || "", starters: opts.starters || null, first: opts.first || "", busy: false, retry: "", lastFocus: wasOpen && st ? st.lastFocus : document.activeElement };
  el.log.innerHTML = ""; chips([]); typing(true); xState();
  el.box.hidden = false;
  document.documentElement.classList.add("wlc-docked");
  sheetsBeside();
  requestAnimationFrame(() => el.box.classList.add("on"));
  // Pages that draw to fit their width (the Projects map) redraw on resize.
  setTimeout(() => dispatchEvent(new Event("resize")), 280);
  if (st.chatId) {
    el.topic.textContent = "Loading…";
    try {
      const { chat, turns } = await loadChat(st.chatId);
      if (chat) { st.kind = chat.kind; st.topicId = chat.topicId || ""; st.topicTitle = chat.topicTitle || ""; }
      topicLine();
      turns.forEach(t => bubble(t.role === "student" ? "me" : "coach", t.text));
      note("You can keep going where you left off.");
      chips(STARTERS[st.kind] ? STARTERS[st.kind].slice(0, 3) : []);
    } catch (e) { note("Couldn't load that conversation."); }
  } else {
    topicLine();
    let seen = false; try { seen = localStorage.getItem(INTRO_KEY) === INTRO_VERSION; } catch (e) { }
    if (seen) greet(); else intro();
  }
  setTimeout(() => { if (!el.log.querySelector("[data-intro-ok]")) el.input.focus(); }, 80);
}
// ---- The /coach/ page: Mr. Fox open beside the instructions, starting on a home screen ----
// On /coach/ the × goes back to the home screen (and isn't needed on it).
function xState() {
  const x = el.box.querySelector(".wlc-x"); if (!pinned) return;
  x.hidden = st.kind === "home"; x.setAttribute("aria-label", "Back to the start"); x.title = "Back to the start";
}
function typing(on) {
  el.input.disabled = !on; el.send.disabled = !on;
  el.input.placeholder = on ? "Ask your coach…" : "Pick a topic to start";
}
function homeChoices() {
  bubble("coach", "Hi! I'm Mr. Fox. What do you want to work on today?");
  el.chips.innerHTML = `<div class="wlc-home">
    <button type="button" data-home="lesson">Learn how to use me<small>A 3-minute chat about what AI is, what it gets wrong, and how to ask good questions.</small></button>
    <a href="/challenges/?coach=find">Find a challenge<small>Tell me what you're into and I'll suggest challenges that fit.</small></a>
    <a href="/projects/?coach=find">Find a project idea<small>Tell me what you love or wish existed.</small></a>
    <button type="button" data-home="conflict">Work out a conflict<small>Calm down, see their side, and plan what to say.</small></button></div>`;
  typing(false);
}
function home(opts) {
  mount();
  if (opts && opts.dock && el.box.parentNode !== opts.dock) opts.dock.appendChild(el.box);
  pinned = true;
  el.box.classList.add("pinned");
  st = { kind: "home", chatId: "", topicId: "", topicTitle: "", context: "", starters: null, first: "", busy: false, retry: "", lastFocus: null };
  el.log.innerHTML = ""; el.chips.innerHTML = "";
  el.topic.textContent = "Your AI coach"; xState();
  el.box.hidden = false; el.box.classList.add("on");
  document.documentElement.classList.add("wlc-docked");
  const role = window.wlRole;
  if (!user()) { note("Sign in with your school account to talk with Mr. Fox."); el.chips.innerHTML = '<div class="wlc-home"><button type="button" data-wl-signin>Sign in</button></div>'; typing(false); return; }
  if (role && role.role === "parent") { note("Mr. Fox is for students, signed in with their school account."); typing(false); return; }
  if (role && role.role === "student" && role.band === "K–1") { note("Mr. Fox is for grades 2 to 8. Your guide will help you with challenges."); typing(false); return; }
  let seen = false; try { seen = localStorage.getItem(INTRO_KEY) === INTRO_VERSION; } catch (e) { }
  if (seen) greet(); else { intro(); typing(false); }
}
// The topic under the coach's name. A challenge's title is a link that opens the challenge beside the coach.
function topicLine() {
  const title = st.topicTitle || TOPIC_NAMES[st.kind] || "";
  el.topic.innerHTML = "";
  if (st.kind === "challenge" && st.topicId && window.WLChallenge) {
    const b = document.createElement("button"); b.type = "button"; b.className = "wlc-topic-link"; b.textContent = title;
    b.title = "Open this challenge"; b.addEventListener("click", () => window.WLChallenge.open(st.topicId));
    el.topic.appendChild(b);
  } else el.topic.textContent = title;
}
function close() {
  if (!el || el.box.hidden) return;
  // On /coach/ Mr. Fox stays open: closing a conversation goes back to the home screen.
  if (pinned) { const id = st && st.chatId; if (st && st.kind === "home") return; home(); document.dispatchEvent(new CustomEvent("wl-coach-closed", { detail: { chatId: id } })); return; }
  el.box.classList.remove("on", "big");
  document.documentElement.classList.remove("wlc-docked");
  sheetsBack();
  setTimeout(() => { el.box.hidden = true; dispatchEvent(new Event("resize")); }, 250);
  if (st && st.lastFocus && document.contains(st.lastFocus)) st.lastFocus.focus();
  document.dispatchEvent(new CustomEvent("wl-coach-closed", { detail: { chatId: st && st.chatId } }));
}
// "Try again" re-sends the last message that didn't go through.
document.addEventListener("click", e => { const b = e.target.closest('.wlc-chip[data-say="Try again"]'); if (b && st && st.retry) { e.stopPropagation(); const t = st.retry; st.retry = ""; const last = el.log.lastElementChild; if (last && last.classList.contains("note")) last.remove(); sendMsg(t, true); } }, true);

// Who may use it: school accounts that are students in grades 2–8, or staff (to try it out).
function canUse(r) { return !!(r && (r.role === "staff" || (r.role === "student" && r.band !== "K–1"))); }
// Other relay requests from student pages (the academics-pilot "I'm interested" button). Returns { ok, status, data }.
// A tester viewing the site as the test student: the relay treats them as that student (and keeps it as test data).
function asTest(body) { const r = window.wlRole; return r && r.test === "student" ? { ...body, as: "student" } : body; }
async function call(body) {
  const r = await fetch(await relayUrl(), { method: "POST", headers: { Authorization: "Bearer " + await token(), "Content-Type": "application/json" }, body: JSON.stringify(asTest(body)) });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}
window.WLCoach = { open, close, home, kind: () => st && st.kind, canUse, docked, WHY, call, FOX };
document.dispatchEvent(new CustomEvent("wl-coach-ready"));
