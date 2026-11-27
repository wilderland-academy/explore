// Our Code (/code/, Students site): the seven principles, what happens at each tier, being sent home, Freedom Levels
// (and the student's own levels), a practice game, and the student's calm plan (a "Personal Fire Drill Plan").
// The rules themselves come from the Behavior Guide (/behavior/data.js: TIERS, DOMAINS, LEVEL5, K1, SORT). The
// student-voice lines below say the same things in kids' words; keep them in step with the Behavior Guide.
// Data: flStudents (the student reads their own levels, matched by their tracker id) and calmPlans/{sid} (the student,
// their guides and their parents). Both through firestore.rules.
import { TIERS, DOMAINS, LEVEL5, K1, SORT, SORT_K1 } from "/behavior/data.js";

const FSX = window.WLFS;
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const toast = t => { const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => { el.hidden = true; }, 2800); };

// ---------- the seven principles (Code of Conduct) ----------
const PRINCIPLES = [
  ["Show Respect", "Kindness · Respect · Collaboration", "Respect people's space and boundaries. Be kind, even when it's hard. Help everyone feel they belong."],
  ["Take Accountability", "Honesty · Responsibility", "Tell the full truth. Own your mistakes. Make things right and fix the root of the problem."],
  ["Work Hard", "Diligence · Perseverance · Courage", "Work through discomfort, try new things, learn from failure, and finish what you start."],
  ["Stay Humble", "Teachability · Humility", "Learn from everyone. Ask for feedback and really listen to it."],
  ["Be a Peacemaker", "Nonviolence · Compassion · Empathy", "Take a beat when you're upset. Listen without interrupting. Say what you saw, how you feel and what you need."],
  ["Prepare Yourself", "Etiquette · Consideration", "Take care of your body, dress for the day, and bring your best self."],
  ["Be Grateful", "Reverence · Gratitude · Mindfulness", "Be present, say thank you, and care for every living thing."]
];

// ---------- what happens at each tier, in students' words (Behavior Guide v0.5) ----------
const HAPPENS = {
  up: [
    ["A guide helps: a reminder, a different seat, a fidget, a movement break, headphones.", "It's not a consequence. You're still learning it, and that's okay."],
    ["1st time in a day: a reminder of the Code.", "2nd time: you sit closer to the guide and lose your seat choice.", "3rd time: a yellow card, and your parents get a text.", "Two Tier 1s to the same person in one day: a Peace Talk, and an act of kindness for them before you go back to your work."],
    ["A red card right away.", "The person who was hurt is cared for first.", "When you're calm, you make a SMART Restore: a plan to make it right. It's your next work until your Field Guide signs it off, by the end of the next school day.", "Your guide writes it down and talks about it with you at your next coaching meeting."],
    ["Safety first. A guide keeps everyone safe.", "Your parents get an incident report.", "You may be sent home for a full school day. If you already had a Tier 3 this school year or last school year, you will be sent home.", "Before you come back, your parents and your guide talk, and everyone agrees on a repair plan that you carry out."]
  ],
  upMore: [
    "After 2 reminders on the same thing in one day, if it keeps bothering someone, it becomes Tier 1.",
    "The same Tier 1 on 3 or more days in a school week: your guide may meet with your parents. It becomes Tier 2 only if a yellow card and a Peace Talk have both been tried and someone actually gets hurt.",
    "Two Tier 2s in one school week: your parents get an email. If it becomes a serious threat to someone's safety, it's Tier 3.",
    "Any single Tier 3 counts. It counts if you say you did it, even if no guide saw it."
  ],
  k1: [
    ["A guide shows you with a picture or a signal, and you try again.", "Your guide might change where you sit or what comes first. It's not a consequence."],
    ["1st time: a signal, and you try again.", "2nd time: you work next to the guide for a bit.", "3rd time: a minute or two in the calm-down spot, then you try again.", "At the end of the day, your family gets one note, with something that went well too."],
    ["Stop, and the child who got hurt is cared for first.", "You calm down near your guide.", "Then you pick a way to make it right: check on them, fix it, or do something kind.", "Your family hears about it the same day."],
    ["Safety first. A guide keeps everyone safe.", "Your family gets an incident report.", "You may go home for a full school day. If you already had a Tier 3 this school year or last school year, you will go home.", "Before you come back, your family and your guide talk, and your guide meets you at drop-off."]
  ],
  k1More: [
    "After 2 signals on the same thing in one day, if it keeps bothering another child, it becomes Tier 1.",
    "The same thing on 3 or more days in a week: your guide checks in with your family.",
    "If someone gets hurt or is in danger, it's Tier 3.",
    "Any single Tier 3 counts, even if no guide saw it and you tell them."
  ]
};

// ---------- state ----------
let ROLE = null, BAND = "5–8", MY = null, PLAN = null, PLAN_LOADED = false;
const isStudent = () => ROLE && ROLE.role === "student";
const k1 = () => BAND === "K–1";

function bandPicker() {
  const wrap = $("#bandpick"), box = $("#bands");
  if (isStudent()) { wrap.hidden = true; return; }
  wrap.hidden = false;
  box.innerHTML = ["K–1", "2–4", "5–8"].map(b => `<button class="chip" type="button" data-band="${b}" aria-pressed="${b === BAND}">${b}</button>`).join("");
}

function principles() {
  return `<section id="principles"><h2>The seven principles</h2><p class="lede">Every fall, each class writes its own Code of Conduct. These seven principles are the words we all share for how we treat each other.</p>
    <div class="grid">${PRINCIPLES.map(p => `<div class="pr"><b>${esc(p[0])}</b><small>${esc(p[1])}</small><p>${esc(p[2])}</p></div>`).join("")}</div></section>`;
}

function tiers() {
  const T = k1() ? TIERS.map(t => Object.assign({}, t, (K1.tiers || {})[t.n] || {})) : TIERS;
  const happen = k1() ? HAPPENS.k1 : HAPPENS.up, more = k1() ? HAPPENS.k1More : HAPPENS.upMore;
  return `<section id="tiers"><h2>What happens when…</h2>
    <p class="lede">Every behavior fits one of four tiers. The tier depends on what it did to someone, not on whether you meant it. ${k1() ? "In K–1, guides teach first and keep it short." : "The counts below are exact, so you always know where you stand."}</p>
    ${T.map((t, i) => `<div class="tier t${t.n}"><h3><i>Tier ${t.n}</i>${esc(t.name)}</h3>
      <p class="voice">${esc(t.voice || "")}</p>
      <div class="cols"><div><h4>Like…</h4><ul>${(t.examples || []).slice(0, 6).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div><h4>What happens</h4><ul>${happen[i].map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
      <p class="up">${esc(more[i])}</p></div>`).join("")}
  </section>`;
}

function sendHome() {
  return `<section id="home"><h2>Being sent home</h2>
    <div class="home"><h3>${k1() ? "Going home" : "When a student is sent home"}</h3><ul>
      <li><b>Only for Tier 3</b>: serious harm, like hurting someone, serious threats, sexual or hateful harassment, or cornering and scaring someone.</li>
      <li><b>Required after an earlier Tier 3.</b> If you already had a Tier 3 this school year or last school year, you will be sent home. With no earlier Tier 3, the guide decides.</li>
      <li><b>Right away, for a full school day.</b> If it happens late in the day, you stay home the next school day too.</li>
      <li><b>It counts if you say you did it</b>, even if no guide saw it.</li>
      <li><b>Same rule for every grade</b>, kindergarten through 8th.</li>
      <li><b>It isn't a suspension.</b> It's time away to reset and calm down, away from whatever set things off.</li>
      <li><b>Coming back:</b> your parents and your guide talk first, everyone agrees on a repair plan, and you carry it out when you return. Your own Field Guide meets with you.</li>
    </ul></div></section>`;
}

function levels() {
  const doms = k1() ? DOMAINS.filter(d => d.id === "walk") : DOMAINS;
  const mine = MY && MY.levels ? MY.levels : null;
  const my = !isStudent() ? "" : !MY ? `<div class="box"><b>Your levels</b><p class="dim small" style="margin:6px 0 0">${MY === null ? "Loading your levels…" : "Your guide hasn't put your levels on the site yet. Everyone starts at Level 3 in each area. Ask your guide where you are."}</p></div>`
    : `<div class="box"><b>Your levels this week</b>${MY.reviewedAt ? `<span class="dim small"> · updated ${esc(new Date(MY.reviewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}</span>` : ""}
      <div class="mylv">${doms.map(d => `<div><span>${esc(d.name)}</span><b>${(mine[d.id] || 3)}</b><span>${esc(levelLine(d, mine[d.id] || 3))}</span></div>`).join("")}</div>
      ${!k1() && DOMAINS.every(d => (mine[d.id] || 3) === 4) ? `<p style="margin:6px 0 0">🏔️ <b>Level 5: the summit.</b> All four areas at Level 4.</p>` : ""}
      <p class="dim small" style="margin:6px 0 0">Only you, your guides and your parents can see these. Want to move up? Look at “How to move up” below, and talk with your guide at your next Summit Session.</p></div>`;
  return `<section id="levels"><h2>Freedom Levels</h2>
    <p class="lede">${k1() ? "In K–1, Freedom Levels are only for the Nature Walk, where staying close to your guide keeps you safe. The rest of the day, you keep a freedom while you use it well, and every morning starts fresh." : "Freedom Levels match how much independence you have to how well you're handling it. They're not prizes or punishments. There are four separate areas, and each one moves on its own."}</p>
    ${my}
    ${doms.map(d => `<div class="dom"><h3>${esc(d.name)}</h3><p class="why">${esc(d.sub)}</p>
      <table class="levels"><thead><tr><th>Level</th><th>What you can do</th></tr></thead><tbody>
      ${[4, 3, 2, 1].map(n => `<tr><td${mine && (mine[d.id] || 3) === n ? ' class="mine"' : ""}>${n}${n === 3 ? " ★" : ""}</td><td${mine && (mine[d.id] || 3) === n ? ' class="mine"' : ""}>${esc(d.L[n])}${mine && (mine[d.id] || 3) === n ? " <b>← you</b>" : ""}</td></tr>`).join("")}
      </tbody></table><p class="upto"><b>How to move up:</b> ${esc(d.up)}</p></div>`).join("")}
    ${k1() ? "" : `<div class="box"><b>🏔️ Level 5: the summit</b><p class="dim small" style="margin:6px 0 8px">Everyone who reaches Level 4 in all four areas is at Level 5 automatically. It opens:</p><ul style="margin:0;padding-left:20px">${LEVEL5.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`}
    <div class="box"><b>How levels change</b><ul style="margin:8px 0 0;padding-left:20px;display:grid;gap:4px;font-size:14.5px">
      <li>★ Everyone starts at Level 3.</li>
      <li>Guides look at the whole week, not one moment. One hard day doesn't drop a level.</li>
      <li>Levels move one step at a time, and you'll hear exactly what moved you.</li>
      <li>Your guide tells you privately. Levels are never posted or announced.</li>
      ${k1() ? "<li>Your guide gives you a one-line update every day.</li>" : "<li>Nature Walk Level 4 (carrying a hatchet, knife or saw) needs a second guide to agree.</li>"}
      <li>If you step down, your guide tells you what moves you back up, and helps you get there.</li></ul></div>
  </section>`;
}
function levelLine(d, n) { const t = d.L[n] || ""; return t.length > 70 ? t.slice(0, 68).replace(/\s+\S*$/, "") + "…" : t; }

// ---------- practice: which tier is it? ----------
let PQ = [], PI = 0, PSCORE = 0;
const GENTLE = s => !/gun|shoot|chokehold|pantsing|choke|sexual|kill/i.test(s);
function newPractice() {
  const src = (k1() ? SORT_K1 : SORT).filter(x => GENTLE(x[0]));
  PQ = src.map(x => [x, Math.random()]).sort((a, b) => a[1] - b[1]).slice(0, 8).map(x => x[0]); PI = 0; PSCORE = 0;
}
const WHY = ["Tier 0: something a person is still learning to control, and it isn't really hurting anyone.", "Tier 1: it gets in the way of someone's learning, work or space, but doesn't really hurt them.", "Tier 2: it actually hurts someone: their body, feelings, friendships or things.", "Tier 3: it's a serious threat to someone's safety, dignity or wellbeing."];
function practice() {
  if (!PQ.length) newPractice();
  const done = PI >= PQ.length;
  return `<section id="practice"><h2>Practice: which tier is it?</h2><p class="lede">Read each one and pick the tier. Ask yourself: what did it do to someone?</p>
    <div class="q" id="pq">${done ? `<p class="say">You got ${PSCORE} of ${PQ.length}.</p><p class="dim">${PSCORE >= 6 ? "You know the tiers well." : "Read “What happens when…” again, then try another round."}</p><button class="btn" type="button" data-again>Try another round</button>`
      : `<p class="dim small" style="margin:0 0 6px">${PI + 1} of ${PQ.length}</p><p class="say">${esc(PQ[PI][0])}</p>
      <div class="ans">${[0, 1, 2, 3].map(n => `<button type="button" class="t${n}" style="--c:var(--t${n})" data-tier="${n}">Tier ${n}</button>`).join("")}</div><p class="fb" id="pfb"></p>`}</div></section>`;
}

// ---------- my calm plan (Personal Fire Drill Plan) ----------
const HELPS = ["Take 10 slow breaths", "Get a drink of water", "Go to the calm-down spot", "Squeeze a fidget or stress ball", "Put headphones on", "Walk a lap with a guide", "Draw or doodle", "Count backwards from 20", "Ask for a break", "Push against a wall", "Read for a few minutes", "Get some fresh air"];
function plan() {
  if (!isStudent()) return `<section id="plan"><h2>My calm plan</h2><p class="lede">Each student can make a calm plan: their warning signs, what helps them calm down, and how adults can help. Like a fire drill, you practice it before you need it. Students make theirs here; guides see them on the staff Student Court page.</p></section>`;
  const p = PLAN || {}, helps = p.helps || [];
  return `<section id="plan"><h2>My calm plan</h2>
    <p class="lede">Like a fire drill, a calm plan is something you make before you need it. When big feelings hit, you and your guides already know what to do. ${k1() ? "Make it with a grown-up." : ""}</p>
    ${!PLAN_LOADED ? `<p class="dim">Loading your plan…</p>` : `<div class="sheet" id="planform">
      <p class="step"><i>1</i> My warning signs</p><label class="f">How can I tell I'm getting upset? (My body, my face, what I start doing)<textarea id="p-signs" maxlength="500" placeholder="My face gets hot, I clench my fists, I start talking louder…">${esc(p.signs || "")}</textarea></label>
      <p class="step"><i>2</i> What helps me calm down</p><div class="chips" role="group" aria-label="What helps">${HELPS.map(h => `<button class="chip" type="button" data-help="${esc(h)}" aria-pressed="${helps.includes(h)}">${esc(h)}</button>`).join("")}</div>
      <label class="f">Something else that helps<input type="text" id="p-extra" maxlength="120" value="${esc(p.extra || "")}"></label>
      <p class="step"><i>3</i> My signal and my spot</p><label class="f">A word or signal that tells my guide I need a break<input type="text" id="p-words" maxlength="120" value="${esc(p.words || "")}" placeholder="A thumbs-down, or saying “pause”"></label>
      <label class="f">Where I like to calm down<input type="text" id="p-place" maxlength="120" value="${esc(p.place || "")}"></label>
      <p class="step"><i>4</i> How adults can help</p><label class="f">What helps when a guide comes over? What doesn't?<textarea id="p-adults" maxlength="500" placeholder="Fewer words. Give me a minute before you talk. Don't touch my shoulder.">${esc(p.adults || "")}</textarea></label>
      <div class="row" style="margin-top:12px"><button class="btn" type="button" data-saveplan>Save my plan</button>${p.updated ? `<span class="dim small">Saved ${esc(new Date(p.updated).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}</span>` : ""}</div>
      <p class="err" id="perr"></p><p class="dim small">Your guides and your parents can see your plan, so they can help you use it.</p></div>`}
  </section>`;
}

function courtCard() {
  if (k1()) return `<section id="court"><h2>When there's a problem</h2><p class="lede">In K–1, your guide helps you solve problems with a short Peace Talk at the peace table. If someone hurts you or you feel unsafe, tell a guide right away.</p></section>`;
  return `<section id="court"><h2>Student Court</h2><p class="lede">For problems between students that a Peace Talk didn't fix. Safety problems always go straight to a guide.</p>
    <ol class="steps">${window.WLCourt.STEPS.map(s => `<li><b>${esc(s[0])}</b>${esc(s[1])}</li>`).join("")}</ol>
    <div class="row" style="margin-top:14px"><a class="btn" href="/court/">Go to Student Court</a><a class="ghost" href="/court/#peace">Plan a Peace Talk</a><a class="ghost" href="/court/#help">Tell a guide privately</a></div></section>`;
}

function draw() {
  $("#app").innerHTML = principles() + tiers() + sendHome() + levels() + practice() + plan() + courtCard();
  const c = document.querySelector("[data-court]"); if (c) c.hidden = k1();
  if (location.hash && !draw._jumped) { draw._jumped = true; const el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(() => el.scrollIntoView(), 50); }
}

// ---------- loading the student's own data ----------
async function loadMine() {
  if (!isStudent() || !ROLE.sid) { MY = undefined; PLAN_LOADED = true; return; }
  try {
    const rows = await FSX.query("flStudents", [["lsId", ROLE.sid]], 2);
    MY = rows[0] || false;
  } catch (e) { MY = false; }
  try { PLAN = await FSX.get("calmPlans/" + ROLE.sid); } catch (e) { PLAN = null; }
  PLAN_LOADED = true;
}

document.addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.band) { BAND = b.dataset.band; PQ = []; bandPicker(); draw(); return; }
  if (b.dataset.tier !== undefined) {
    const pick = +b.dataset.tier, right = PQ[PI][1];
    document.querySelectorAll("#pq [data-tier]").forEach(x => { x.disabled = true; x.classList.add(+x.dataset.tier === right ? "right" : "wrong"); });
    if (pick === right) PSCORE++;
    $("#pfb").innerHTML = (pick === right ? "✅ Yes. " : `Not quite: it's Tier ${right}. `) + esc(WHY[right]) + ` <button class="ghost" type="button" data-next style="margin-left:6px">Next</button>`;
    return;
  }
  if (b.hasAttribute("data-next")) { PI++; const s = document.getElementById("practice"); s.outerHTML = practice(); return; }
  if (b.hasAttribute("data-again")) { newPractice(); const s = document.getElementById("practice"); s.outerHTML = practice(); return; }
  if (b.dataset.help) { b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); return; }
  if (b.hasAttribute("data-saveplan")) {
    const helps = [...document.querySelectorAll("[data-help][aria-pressed=true]")].map(x => x.dataset.help);
    const data = { signs: $("#p-signs").value.trim(), helps, extra: $("#p-extra").value.trim(), words: $("#p-words").value.trim(), place: $("#p-place").value.trim(), adults: $("#p-adults").value.trim(), updated: Date.now(), by: String(ROLE.email || "").toLowerCase(), name: (ROLE.name || ""), band: BAND };
    if (ROLE.test) data.test = true;
    b.disabled = true; $("#perr").textContent = "";
    try {
      await FSX.patch("calmPlans/" + ROLE.sid, data);
      PLAN = data; toast("Your calm plan is saved.");
      if (window.wlNotifyGuides) window.wlNotifyGuides({ kind: "note", text: "Updated their calm plan", link: "/guides/court/#plans" });
      document.getElementById("plan").outerHTML = plan();
    } catch (x) { b.disabled = false; $("#perr").textContent = x.status === 403 ? "Your plan couldn't be saved. Ask your guide to check that you're on the Life Skills roster." : "Couldn't save. Check your connection and try again."; }
  }
});

async function start(r) {
  ROLE = r && r.role ? r : null;
  BAND = isStudent() && ROLE.band ? ROLE.band : (window.wlBand ? window.wlBand({}) : "5–8");
  bandPicker(); MY = null; PLAN_LOADED = false; draw();
  await loadMine(); draw();
}
let started = "";
document.addEventListener("wl-role", e => { const k = JSON.stringify(e.detail || null); if (k === started) return; started = k; start(e.detail); });
if (window.wlRole !== undefined) { started = JSON.stringify(window.wlRole || null); start(window.wlRole); }
else start(null);
