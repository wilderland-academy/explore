// Guide onboarding: one continuous path. Every screen is right here (content comes from the Field Guide and Behavior
// Guide data, so it stays in step with them), one big Next button at a time, a checkpoint at the end of each step,
// then the part of the site it unlocks. Optional Dig deeper picks sit, folded, at the bottom of the screens they're
// about. Address: #<step>/<screen>, #<step>/check, #<step>/done, #library (saved picks), #team (admins).
// Progress: behaviorProgress/{uid} through /guides/training/quiz.js: journey.read.{screenId}, journey.done.{stepId}
// (what unlocks the site: /auth.js reads it for /wlnav.js), training.*, badges.* (the Behavior badges, shared with the
// Behavior Guide), saved.{resourceId}.
import { getFirestore, collection, getDocs, limit, query } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";
import { ready, loadProgress, saveProgress, trainingRec, mountQuiz, mountPolicyCheck, deal, fromRows, fetchDoc } from "/guides/training/quiz.js";
import { MENTOR, LIFESKILLS, PARENTS, STUDENTS, PARTNER } from "/guides/training/banks.js";
import { ART } from "./art.js";
import * as BD from "/behavior/data.js";
import * as FG from "/fieldguide/data.js";
import { STEPS, OPEN_LINK } from "./data.js";

const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const QUIZZES = { mentor: MENTOR, lifeskills: LIFESKILLS, parentcomms: PARENTS, students: STUDENTS, partner: PARTNER };
const $ = s => document.querySelector(s);
function h(tag, attrs, kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]); }
  (kids || []).forEach(c => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return e;
}
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let P = {}, user = null;

// ---------------- the Behavior badges, built exactly as the Behavior Guide builds them ----------------
const TIERS4 = ["Tier 0", "Tier 1", "Tier 2", "Tier 3"];
function behaviorSets(m) {
  if (m.kind === "sort") return deal(BD.SORT, s => s[1]).map(set => set.map(s => ({ p: s[0], o: TIERS4, a: s[1], w: BD.TIERS[s[1]].q, keep: true })));
  if (m.kind === "kinds") return deal(BD.SORTKIND, s => s[1]).map(set => set.map(s => ({ p: s[0], o: ["Standard", "Toolkit"], a: s[1] === "standard" ? 0 : 1, w: s[2], keep: true })));
  if (m.kind === "knots") return deal(BD.KNOTS.map(k => ({ k, quiz: false })).concat(BD.QUIZ_KNOTS.map(k => ({ k, quiz: true }))), x => x.quiz)
    .map(set => set.map(({ k }) => ({ p: k.title + ": " + k.q, ctx: k.story, o: k.opts.map(x => x[0]), a: k.opts.findIndex(x => x[1]), w: k.opts.find(x => x[1])[2] })));
  return m.sets.map(fromRows);
}

// ---------------- progress ----------------
const read = id => !!(P.journey && P.journey.read && P.journey.read[id]);
const badge = id => !!(P.badges && P.badges[id] && P.badges[id].passed);
function checks(s) {
  if (s.quiz === "behavior") return BD.MODULES.map(m => ({ id: m.id, name: m.icon + " " + m.name, done: badge(m.id) }));
  if (s.quiz) return [{ id: s.quiz, name: QUIZZES[s.quiz].name, done: !!trainingRec(P, s.quiz).passed }];
  return (s.checks || []).map(c => ({ id: c.id, name: c.name, done: !!trainingRec(P, c.id).passed }));
}
const stepDone = s => s.screens.every(x => read(x.id)) && checks(s).every(c => c.done);
const recorded = s => !!(P.journey && P.journey.done && P.journey.done[s.id]);
const firstOpen = () => { const i = STEPS.findIndex(s => !stepDone(s)); return i < 0 ? STEPS.length : i; };
// A step a guide has finished stays open to revisit, even if a step before it gained new screens since.
const finished = s => stepDone(s) || recorded(s);
const reachable = (s, i) => i <= firstOpen() || finished(s);
const isAdmin = () => user && ADMINS.includes((user.email || "").toLowerCase());
// A finished step is recorded once (that's what unlocks the site), and this device's nav is told right away.
async function record(s) {
  if (!stepDone(s) || recorded(s)) return;
  await saveProgress({ journey: { done: { [s.id]: Date.now() } } }); P = await loadProgress();
  try {
    const c = JSON.parse(localStorage.getItem("wl-unlocks") || "null") || { e: (user.email || "").toLowerCase(), done: [] };
    if (!c.all && !c.done.includes(s.id)) c.done.push(s.id);
    localStorage.setItem("wl-unlocks", JSON.stringify(c));
    document.dispatchEvent(new CustomEvent("wl-unlocks", { detail: c }));
  } catch (e) { }
}

// ---------------- side rail ----------------
function nav(cur) {
  const n = $("#steps"); n.innerHTML = ""; const open = firstOpen();
  STEPS.forEach((s, i) => {
    const done = finished(s), lock = !reachable(s, i), updated = !stepDone(s) && recorded(s);
    n.appendChild(h(lock ? "span" : "a", { class: "st" + (done ? " done" : "") + (lock ? " lock" : "") + (s.id === cur ? " on" : ""), href: lock ? null : "#" + s.id, title: lock ? "Opens after " + STEPS[i - 1].name : done ? "Open to review any time" : null }, [
      h("i", { text: done ? "✓" : lock ? "🔒" : String(i + 1) }), h("span", null, [h("b", { text: s.name }), h("small", { text: updated ? "Done · new screens to read" : done ? "Done · review any time" : lock ? "Locked" : i === open ? "You're here" : s.time })])
    ]));
  });
  const nSaved = Object.values(P.saved || {}).filter(Boolean).length;
  // Only what the guide saved from the Dig deeper picks on each screen (there's no long list of everything).
  if (nSaved || cur === "library") n.appendChild(h("a", { class: "st lib" + (cur === "library" ? " on" : ""), href: "#library" }, [h("i", { text: "📚" }), h("span", null, [h("b", { text: "Saved for later" }), h("small", { text: nSaved + " saved" })])]));
  if (isAdmin()) n.appendChild(h("a", { class: "st" + (cur === "team" ? " on" : ""), href: "#team" }, [h("i", { text: "👥" }), h("span", null, [h("b", { text: "Team progress" }), h("small", { text: "Admins" })])]));
  const all = open >= STEPS.length;
  $("#meter").innerHTML = ""; $("#meter").append(h("b", { text: all ? `All ${STEPS.length} steps done` : `Step ${open + 1} of ${STEPS.length}` }), h("span", { class: "bar" }, [h("i", { style: `width:${Math.round(STEPS.filter(stepDone).length / STEPS.length * 100)}%` })]));
}

// ---------------- screen kinds ----------------
const para = t => Array.isArray(t) ? h("ul", null, t.map(x => h("li", { text: x }))) : h("p", { text: t });
const card = (kids, cls) => h("div", { class: "card " + (cls || "") }, kids);
const fold = (summary, kids, open) => { const d = h("details", { class: "fold" }, [h("summary", null, summary), ...kids]); if (open) d.open = true; return d; };
const QUAD = { E: ["Enforcer", "High standards, low support", "“I set the bar. Reaching it is your problem.”", "Gets compliance while you're watching. Costs trust, and the student learns that you think little of them."], M: ["Mentor", "High standards, high support", "“The bar is high, I know you can reach it, and I'm in it with you.”", "The student hears respect. Hard feedback lands as a compliment."], A: ["Apathetic", "Low standards, low support", "“Whatever.”", "Checked out. Rare among people who chose this work."], P: ["Protector", "Low standards, high support", "“This is too much for you. Let me take it off your plate.”", "Feels kind in the moment. The student hears that you doubt them, and loses the chance to find out they can."] };
const RENDER = {
  text: s => s.text.map(para),
  // The named High Support techniques (from /fieldguide/data.js), one fold each; s.part picks the screen's half.
  techniques: s => [h("p", { class: "dim", text: "Tap each technique to open it. Each one is something you can use with a student today." }),
    h("div", { class: "list" }, FG.HIGH_SUPPORT.filter(t => t.part === s.part).map((t, k) => fold([h("b", { text: t.name }), h("small", { text: t.short })], t.body.map(para), k === 0)))],
  map: () => [h("p", { text: "The Guides site grows with you. Each step you finish adds its part of the site; until then, that part stays out of sight. Here's what's coming, in order:" }), h("div", { class: "list" }, STEPS.filter(x => x.unlocks).map(x => card([h("b", { text: x.icon + " " + x.name }), h("p", { class: "dim", text: "Opens " + x.unlocks.name + ": " + x.unlocks.what })])))],
  quad: () => {
    const out = h("div"), box = h("div", { class: "quadwrap" });
    const draw = k => { box.innerHTML = ""; box.append(h("div", { class: "quad" }, ["E", "M", "A", "P"].map(x => h("button", { type: "button", class: "q q" + x, "aria-pressed": String(x === k), onclick: () => draw(x) }, [h("b", { text: QUAD[x][0] }), h("small", { text: QUAD[x][1] })]))), card([h("p", { class: "say", text: QUAD[k][2] }), h("p", { class: "dim", text: QUAD[k][3] })])); };
    draw("M"); out.append(h("p", { text: "Two dials: how high the standard is, and how much support comes with it. Tap each one." }), box, h("p", { class: "dim small", text: "Nobody lives in one box. Even great mentors drift into enforcer or protector under stress. Both come from caring, and both assume young people can't handle much." }));
    return [out];
  },
  evidence: () => [h("div", { class: "list" }, FG.STATS.filter(x => x.a).map(x => card([h("b", { text: x.title }), h("p", { class: "statbig", text: x.big }), h("p", { text: x.what }), h("p", { class: "dim small", text: x.note }), h("a", { href: x.src[1], target: "_blank", rel: "noopener", class: "small", text: "Source: " + x.src[0] + " ↗" })])))],
  ctx: () => FG.CTX.map((c, i) => fold([h("b", { text: c.name })], [h("div", { class: "cols" }, [["E", "Enforcer"], ["P", "Protector"], ["M", "Mentor"]].map(([k, n]) => h("div", { class: "col c" + k }, [h("b", { text: n }), h("ul", null, c[k].map(t => h("li", { text: t })))])))], i === 0)),
  phrases: () => [h("p", { class: "dim", text: "Tap a line to see why it backfires and what to say instead." }), ...["E", "P"].map(k => h("div", { class: "list" }, [h("h3", { text: k === "E" ? "Enforcer lines" : "Protector lines" }), ...FG.PH.filter(x => x[0] === k).slice(0, 7).map(x => fold([h("span", { text: x[1] })], [h("p", { class: "dim", text: x[2] }), h("p", { class: "say", text: "Try: " + x[3] })]))]))],
  moments: () => [h("div", { class: "list" }, FG.QUICK.slice(0, 10).map(x => fold([h("b", { text: x[0] })], [h("p", { class: "dim", text: "Often: " + x[1] }), h("p", { class: "say", text: x[2] }), h("p", { class: "small dim", text: "Avoid: " + x[3] })])))],
  trust: () => [h("div", { class: "list" }, FG.TRUST.map(x => card([h("b", { text: x[0] }), h("p", { class: "dim", text: x[1] })])))],
  practice: s => [h("p", { text: "Write what you'd actually say, then compare it with a mentor response. Nobody sees your answer." }), ...s.ids.map(id => FG.TRAIN.find(t => t.id === id)).filter(Boolean).map(t => {
    const ta = h("textarea", { rows: "3", placeholder: "What would you say?", "aria-label": "Your response" }), ans = h("div", { hidden: "" }, [h("p", { class: "small dim", text: "A mentor response:" }), h("p", { class: "say", text: t.model }), h("p", { class: "small dim", text: "Check yours: did it keep the standard, show belief and offer help, and leave the next move with the student?" })]);
    return card([h("p", { class: "eyebrow", text: t.ctx }), h("b", { text: t.title }), h("p", { class: "dim", text: t.setup }), h("p", { class: "line", text: t.line }), ta, h("button", { type: "button", class: "btn ghost sm", text: "Show a mentor response", onclick: e => { ans.hidden = false; e.currentTarget.remove(); } }), ans]);
  })],
  oneonone: () => [h("p", { text: "Every student gets a one-on-one with their guide every week. It isn't optional, and it isn't only for students who are struggling. Every week, no exceptions. Most take 10 to 20 minutes; K–1 is shorter and more concrete." }),
    h("ol", { class: "steps" }, [["Read last week first", "Last week's notes, what they said they'd do, and your one thing."], ["Start with them", "Ask how the week went and listen. Follow what they say with a real question."], ["Check the commitment", "Name exactly what went well. If it didn't happen, get curious: “What got in the way?” No lecture."], ["They pick this week's goal", "The student proposes it; you hold the bar."], ["Make an if-then plan", "“If ___ happens, then I will ___.” They say it back; you write it down."], ["Close with the next date", "Name the day of next week's 1:1, then save your notes."]].map(([b, t]) => h("li", null, [h("b", { text: b + ". " }), t]))),
    h("p", { class: "dim", text: "In the Session Room you can record a 1:1 (it becomes text; audio is never saved) only when a parent's written consent is on the student's page and the student says it's okay that day. Otherwise take notes. Either way, the AI can give you feedback and a plan for next time." })],
  standards: () => [h("p", { class: "dim", text: "Tap each one. These are the same for every guide, every time." }), h("div", { class: "list" }, BD.STANDARDS.map(x => fold([h("b", { text: x.icon + " " + x.name }), h("small", { text: x.short })], [h("ul", null, x.rules.map(r => h("li", { text: r }))), x.nd ? h("p", { class: "small dim", text: "Different wiring: " + x.nd }) : null])))],
  tiers: () => [h("p", { text: "Tier placement is based on impact first. Intent and ability shape the response, not the tier." }), h("div", { class: "list" }, BD.TIERS.map(t => card([h("b", { text: "Tier " + t.n + ": " + t.name }), h("p", { class: "dim", text: t.q }), h("p", { class: "small", text: "For example: " + t.examples.slice(0, 4).join("; ") + "." }), h("ul", null, t.response.map(r => h("li", { text: r }))), h("p", { class: "small dim", text: "Escalates: " + t.escalate })], "tier t" + t.n)))],
  freedom: () => [h("p", { text: "Four separate domains, everyone starts at Level 3, reviewed weekly on the week's pattern, one rung at a time, shared privately at the one-on-one. Level 5 comes automatically with Level 4 in all four." }), h("div", { class: "list" }, BD.DOMAINS.map(d => fold([h("b", { text: d.name }), h("small", { text: d.sub })], [h("p", { class: "small", text: "Moves you up: " + d.up }), h("ul", null, [4, 3, 2, 1].map(l => h("li", { text: "Level " + l + ": " + d.L[l] })))]))), h("ul", null, BD.FL_RULES.map(r => h("li", null, [h("b", { text: r[0] + " " }), r[1]])))],
  knots: s => [h("p", { class: "dim", text: "Pick the first move. You'll see why each option is right or wrong." }), ...s.ids.map(id => BD.KNOTS.find(k => k.id === id)).filter(Boolean).map(k => {
    const opts = h("div", { class: "opts" }), why = h("div");
    k.opts.forEach(o => opts.appendChild(h("button", { type: "button", text: o[0], onclick: e => { opts.querySelectorAll("button").forEach((b, i) => { b.disabled = true; if (k.opts[i][1]) b.classList.add("right"); }); if (!o[1]) e.currentTarget.classList.add("wrong"); why.innerHTML = ""; why.append(h("p", { class: "dim", text: (o[1] ? "Yes. " : "Not quite. ") + o[2] }), h("p", { class: "small", text: "The standard: " + k.standard.join(" ") })); } })));
    return card([h("b", { text: k.title }), h("p", { class: "dim", text: k.story }), h("p", { text: k.q }), opts, why]);
  })],
  toolkit: () => [h("p", { text: "These are your call. Use what fits the child and the moment, and write down what you tried." }), h("div", { class: "list" }, BD.TOOLS.map(t => fold([h("b", { text: t.name }), h("small", { text: t.when })], [h("ol", null, t.how.map(x => h("li", { text: x }))), h("p", { class: "small dim", text: "Watch out: " + t.trap })])))],
  wiring: () => [h("p", { text: BD.IE.line }), h("div", { class: "list" }, BD.ND.principles.map(x => card([h("b", { text: x[0] }), h("p", { class: "dim", text: x[1] })]))),
    fold([h("b", { text: "ADHD: what helps" })], [h("ul", null, BD.ND.adhd.map(x => h("li", null, [h("b", { text: x[0] + ". " }), x[1]])))]), fold([h("b", { text: "Autism: what helps" })], [h("ul", null, BD.ND.autism.map(x => h("li", null, [h("b", { text: x[0] + ". " }), x[1]])))])],
  doc: s => {
    const box = h("div", { class: "doc" }, [h("p", { class: "dim", text: "Loading…" })]);
    const load = () => fetchDoc(s.key).then(md => { box.innerHTML = ""; box.append(...renderDoc(md)); }).catch(e => { box.innerHTML = ""; box.append(h("p", { class: "dim", text: (e.message || "Couldn't load it.") + " " }), h("button", { type: "button", class: "btn ghost sm", text: "Try again", onclick: load })); });
    load(); return [h("p", { class: "dim", text: "Tap a section to read it. Everything is here; nothing to open elsewhere." }), box];
  }
};
// The policies' Markdown: each section folds open on its own.
function inline(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>"); }
function renderDoc(md) {
  const out = []; let cur = null, list = null;
  const target = () => cur || (cur = { body: h("div") }, out.push(cur.body), cur);
  String(md).split("\n").forEach(line => {
    const m = /^(#{1,4})\s+(.*)$/.exec(line);
    if (m && m[1].length === 1) { out.push(h("h3", { text: m[2] })); cur = null; list = null; return; }
    if (m) { const body = h("div"); out.push(fold([h("b", { text: m[2] })], [body])); cur = { body }; list = null; return; }
    const li = /^\s*[-*]\s+(.*)$/.exec(line) || /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (li) { if (!list) { list = h("ul"); target().body.appendChild(list); } list.appendChild(h("li", { html: inline(li[1]) })); return; }
    list = null; if (line.trim()) target().body.appendChild(h("p", { html: inline(line.trim()) }));
  });
  return out;
}

// ---------------- the views ----------------
// After a pass, the result's button becomes "Continue →" (to the next badge, check or the step's end).
function continueBtn(box, label, fn) { const r = box.querySelector(".wlq-row"); if (!r) return fn(); r.innerHTML = ""; const b = h("button", { type: "button", class: "wlq-btn", text: label, onclick: fn }); r.appendChild(b); b.focus(); }
const head = (sec, s, i, sub) => sec.append(h("p", { class: "eyebrow", text: `Step ${i + 1} of ${STEPS.length}: ${s.name}${sub ? " · " + sub : ""}` }));
function stepper(s, n) {
  const total = s.screens.length + (s.quiz || s.checks ? 1 : 0);
  return h("div", { class: "dots", "aria-hidden": "true" }, Array.from({ length: total }, (x, k) => h("i", { class: k < n ? "on" : k === n ? "cur" : "" })));
}
function bottom(sec, back, nextLabel, onNext) {
  sec.appendChild(h("div", { class: "next" }, [back ? h("a", { class: "back", href: back, text: "← Back" }) : h("span"), onNext ? h("button", { type: "button", class: "btn big", text: nextLabel, onclick: onNext }) : null]));
}
function screenView(sec, s, i, n) {
  const x = s.screens[n];
  head(sec, s, i, `${n + 1} of ${s.screens.length}`); sec.append(stepper(s, n));
  // Reviewing a finished step: jump to any screen (or the checkpoint) to look something up.
  if (finished(s)) sec.append(h("nav", { class: "toc", "aria-label": "In this training" }, [h("span", { text: "Jump to:" }),
    ...s.screens.map((y, k) => h("a", { href: `#${s.id}/${k + 1}`, class: k === n ? "on" : "", "aria-current": k === n ? "page" : null, text: (read(y.id) ? "" : "● ") + y.title })),
    s.quiz || s.checks ? h("a", { href: `#${s.id}/check`, text: "Checkpoint" }) : null]));
  if (n === 0) sec.append(h("p", { class: "lede", text: s.intro }));
  sec.append(h("h1", { text: x.title }));
  // An illustration for the screen, in the site's textured-landscape style (/guides/onboarding/art.js).
  if (x.art && ART[x.art]) sec.append(h("figure", { class: "art", html: ART[x.art] }));
  sec.append(...RENDER[x.kind](x));
  // Dig deeper: optional reading on this screen's topic (data.js: dig items with on: <screen id>), folded away.
  const dg = (s.dig || []).filter(d => d.on === x.id);
  if (dg.length) sec.append(fold([h("b", { text: "📚 Dig deeper (optional)" }), h("small", { text: `${dg.length} ${dg.length === 1 ? "pick" : "picks"} on this topic: books, podcasts, articles and studies. Save any for later.` })], [digList(dg)]));
  const last = n === s.screens.length - 1, hasCheck = !!(s.quiz || s.checks);
  bottom(sec, n > 0 ? `#${s.id}/${n}` : null, last ? (hasCheck ? "On to the checkpoint →" : "Finish this step →") : "Next →", async e => {
    e.currentTarget.disabled = true;
    await saveProgress({ journey: { read: { [x.id]: Date.now() } } }); P = await loadProgress();
    if (last && !hasCheck) { await record(s); location.hash = `#${s.id}/done`; } else location.hash = last ? `#${s.id}/check` : `#${s.id}/${n + 2}`;
  });
}
function checkView(sec, s, i) {
  head(sec, s, i, "checkpoint"); sec.append(stepper(s, s.screens.length));
  const after = async () => { P = await loadProgress(); await record(s); nav(s.id); if (stepDone(s)) location.hash = `#${s.id}/done`; else route(); };
  if (s.quiz === "behavior") {
    sec.append(h("h1", { text: "Earn the six Behavior badges" }), h("p", { class: "lede", text: "Six short drills, one after another, right here. Each has three sets of questions that take turns." }));
    const next = BD.MODULES.find(m => !badge(m.id)) || null;
    sec.appendChild(h("div", { class: "badges" }, BD.MODULES.map(m => h("span", { class: "bd" + (badge(m.id) ? " done" : m === next ? " cur" : "") }, [h("b", { text: m.icon + " " + m.name }), h("small", { text: badge(m.id) ? "✓ Earned" : m === next ? "Now" : "Up next" })]))));
    if (next) {
      const box = card([], "quiz"); sec.append(h("h3", { text: next.icon + " " + next.name }), h("p", { class: "dim", text: next.blurb }), box);
      mountQuiz(box, { id: next.id, name: next.name, pass: next.pass, store: "badges", sets: behaviorSets(next), passText: "Badge earned.", onDone: async (r, passed) => { if (!passed) return; P = await loadProgress(); await saveProgress({ certified: BD.MODULES.every(m => badge(m.id)) }); continueBtn(box, BD.MODULES.every(m => badge(m.id)) ? "Continue →" : "Next badge →", () => BD.MODULES.every(m => badge(m.id)) ? after() : route()); } });
    } else after();
  } else if (s.quiz) {
    const Q = QUIZZES[s.quiz], NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const box = card([], "quiz"); sec.append(h("h1", { text: "Checkpoint" }), h("p", { class: "lede", text: `${(NUM[Q.sets[0].length] || Q.sets[0].length).toString().replace(/^./, c => c.toUpperCase())} questions on what you just read. Pass with ${NUM[Q.pass] || Q.pass}.` }), box);
    mountQuiz(box, { ...QUIZZES[s.quiz], onDone: (r, passed) => { if (passed) continueBtn(box, "Continue →", after); } });
  } else {
    sec.append(h("h1", { text: "Knowledge checks" }), h("p", { class: "lede", text: "One check per policy in effect, six questions each, written fresh from the policy every time. Pass with five." }));
    s.checks.forEach(c => { const done = !!trainingRec(P, c.id).passed, box = card([], "quiz"); sec.append(h("h3", { text: (done ? "✓ " : "") + c.name }), box); mountPolicyCheck(box, { id: c.id, key: c.key, label: c.label, n: 6, pass: 5, onDone: (r, passed) => { if (passed) continueBtn(box, "Continue →", after); } }); });
  }
  bottom(sec, `#${s.id}/${s.screens.length}`, null, null);
}
function doneView(sec, s, i) {
  const nx = STEPS[i + 1];
  sec.append(h("p", { class: "eyebrow", text: `Step ${i + 1} of ${STEPS.length}: ${s.name}` }), h("h1", { text: "✓ " + s.name + ": done" }));
  // Two ways on: open the part of the site this step just unlocked, or go straight to the next training.
  const go = nx ? h("a", { class: "choice next-step", href: "#" + nx.id }, [h("span", { class: "k", text: "Next training" }), h("b", { text: `${nx.icon} ${nx.name} →` }), h("span", { class: "d", text: nx.intro }), h("span", { class: "d", text: nx.time })])
    : h("a", { class: "choice next-step", href: "#finish" }, [h("span", { class: "k", text: "All done" }), h("b", { text: "Finish onboarding →" }), h("span", { class: "d", text: "Every step stays open for review." })]);
  const view = s.unlocks && OPEN_LINK[s.id] ? h("a", { class: "choice open-page", href: OPEN_LINK[s.id] }, [h("span", { class: "k", text: "🔓 Just unlocked" }), h("b", { text: `Open ${s.unlocks.name} →` }), h("span", { class: "d", text: s.unlocks.what }), h("span", { class: "d", text: "Come back to onboarding any time from the Onboarding tab." })]) : null;
  sec.appendChild(h("div", { class: "choices" + (view ? "" : " one") }, view ? [view, go] : [go]));
}

// ---------------- Dig deeper ----------------
const KIND = { book: "📖 Book", article: "📰 Article", podcast: "🎧 Podcast", study: "🔬 Study" };
const STRENGTH = { strong: "Research, strong evidence", moderate: "Research, moderate evidence", mixed: "Research, mixed evidence", thin: "Research, thin evidence" };
const resolve = r => r.ref ? (x => ({ id: "r-" + r.ref, t: "study", title: x.t, by: STRENGTH[x.s], url: x.u, note: x.f }))(BD.REFS[r.ref]) : r;
const isSaved = id => !!(P.saved && P.saved[id]);
function digList(items, onlySaved) {
  const box = h("div", { class: "dig" });
  items.map(resolve).filter(r => !onlySaved || isSaved(r.id)).forEach(r => {
    const btn = h("button", { type: "button", class: "save" + (isSaved(r.id) ? " on" : ""), "aria-pressed": String(isSaved(r.id)), text: isSaved(r.id) ? "★ Saved" : "☆ Save", onclick: async () => {
      const on = !isSaved(r.id); btn.disabled = true; await saveProgress({ saved: { [r.id]: on ? Date.now() : 0 } }); P = await loadProgress();
      btn.disabled = false; btn.classList.toggle("on", on); btn.setAttribute("aria-pressed", String(on)); btn.textContent = on ? "★ Saved" : "☆ Save"; nav(location.hash.slice(1).split("/")[0]);
    } });
    box.appendChild(h("div", { class: "res" }, [h("div", null, [h("small", { class: "k", text: KIND[r.t] || r.t }), r.url ? h("a", { href: r.url, target: "_blank", rel: "noopener", class: "rt", text: r.title + " ↗" }) : h("b", { class: "rt", text: r.title }), r.by ? h("small", { class: "by", text: r.by }) : null, r.note ? h("p", { class: "dim small", text: r.note }) : null]), btn]));
  });
  if (!box.children.length) box.appendChild(h("p", { class: "dim", text: "Nothing saved yet. Tap ☆ Save on any Dig deeper pick at the bottom of an onboarding screen to keep it here." }));
  return box;
}
// The guide's own saved Dig deeper picks. (#library and #library/saved both land here.)
function libraryView(sec) {
  sec.append(h("h1", { text: "📚 Saved for later" }), h("p", { class: "lede", text: "The Dig deeper picks you saved from onboarding screens, for ongoing learning through the year. All of it is optional." }),
    digList(STEPS.flatMap(s => s.dig || []), true));
}
function finishView(sec) {
  sec.append(h("h1", { text: "🏔️ Onboarding complete" }), h("p", { class: "lede", text: "The whole Guides site is open to you now. Everything here stays open for review, and the policy checks can be taken again any time to stay current." }),
    h("div", { class: "next" }, [h("a", { class: "btn ghost", href: "#library", text: "Saved for later" }),h("a", { class: "btn big", href: "/guides/", text: "Go to the Guides home →" })]));
}
async function teamView(sec) {
  sec.append(h("h1", { text: "Team progress" }), h("p", { class: "lede", text: "Where each guide is, from their saved progress. Scores are best scores; individual answers aren't saved." }));
  const box = card([h("p", { class: "dim", text: "Loading…" })]); sec.appendChild(box);
  try {
    const snap = await getDocs(query(collection(getFirestore(window.wlFirebase.app), "behaviorProgress"), limit(300)));
    const rows = []; snap.forEach(d => rows.push(d.data()));
    rows.sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email)));
    const keep = P; const cells = r => { P = r; const out = STEPS.map(s => stepDone(s) || recorded(s) ? "✓" : s.screens.some(x => read(x.id)) || checks(s).some(c => c.done) ? "…" : "·"); P = keep; return out; };
    box.innerHTML = ""; box.append(h("div", { class: "scroll" }, [h("table", null, [h("tr", null, [h("th", { text: "Guide" }), ...STEPS.map(s => h("th", { title: s.name, text: s.icon }))]), ...rows.map(r => h("tr", null, [h("td", { text: r.name || r.email || "?" }), ...cells(r).map(c => h("td", { text: c }))]))])]),
      h("p", { class: "small dim", text: "✓ done · … started · · not started. Admins see the whole site whether or not they've done onboarding." }));
  } catch (e) { box.innerHTML = ""; box.appendChild(h("p", { class: "dim", text: "Couldn't load the team's progress." })); }
}

function route() {
  const [id, sub] = location.hash.slice(1).split("/"), sec = $("#view"); sec.innerHTML = "";
  scrollTo(0, 0);
  if (id === "library") { nav("library"); return libraryView(sec); }
  if (id === "team" && isAdmin()) { nav("team"); return teamView(sec); }
  const open = firstOpen();
  if (id === "finish" && open >= STEPS.length) { nav("finish"); return finishView(sec); }
  let i = STEPS.findIndex(s => s.id === id);
  if (i < 0 || !reachable(STEPS[i], i)) {   // locked or unknown: resume where they are
    if (open >= STEPS.length) return location.replace("#finish");
    const s = STEPS[open], n = s.screens.findIndex(x => !read(x.id));
    return location.replace("#" + s.id + "/" + (n < 0 ? "check" : n + 1));
  }
  const s = STEPS[i]; nav(s.id);
  if (sub === "check" && (s.quiz || s.checks)) return checkView(sec, s, i);
  if (sub === "done" && stepDone(s)) return doneView(sec, s, i);
  const n = parseInt(sub, 10);
  // Opening a step: its first unread screen, or (finished) its first screen, to review from the start.
  if (!(n >= 1 && n <= s.screens.length)) { const k = s.screens.findIndex(x => !read(x.id)); return location.replace("#" + s.id + "/" + (k >= 0 ? k + 1 : finished(s) ? 1 : "check")); }
  screenView(sec, s, i, n - 1);
}
addEventListener("hashchange", route);

(async () => {
  user = await ready();
  if (!user) { $("#view").innerHTML = ""; $("#view").appendChild(card([h("h2", { text: "Log in to start" }), h("p", { text: "Onboarding is for Wilderland staff." })])); return; }
  P = await loadProgress(true);
  // Steps finished before the site recorded them: record now, so the site unlocks.
  for (const s of STEPS) if (stepDone(s) && !recorded(s)) await record(s);
  route();
})();
