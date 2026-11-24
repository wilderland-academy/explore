// Guide onboarding: the one-way journey. Steps open in order; a step is done when every reading is marked read and its
// checkpoint is passed. Progress: behaviorProgress/{uid} (journey.read, training.*, and the Behavior badges), through
// /guides/training/quiz.js. Admins get a team view (#team) from the same documents, which the rules let them read.
import { getFirestore, collection, getDocs, limit, query } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";
import { ready, loadProgress, saveProgress, trainingRec, mountQuiz, mountPolicyCheck } from "/guides/training/quiz.js";
import { MENTOR, LIFESKILLS, PARENTS } from "/guides/training/banks.js";
import { MODULES as BEHAVIOR } from "/behavior/data.js";
import { STEPS } from "./data.js";

const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const QUIZZES = { mentor: MENTOR, lifeskills: LIFESKILLS, parentcomms: PARENTS };
const $ = s => document.querySelector(s);
function h(tag, attrs, kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]); }
  (kids || []).forEach(c => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return e;
}
let P = {}, user = null;

// ---------------- what's done ----------------
const read = id => !!(P.journey && P.journey.read && P.journey.read[id]);
const badge = id => !!(P.badges && P.badges[id] && P.badges[id].passed);
function checks(s) {
  if (s.quiz === "behavior") return BEHAVIOR.map(m => ({ name: m.icon + " " + m.name, done: badge(m.id), href: "/behavior/#training/" + m.id }));
  if (s.quiz) return [{ name: QUIZZES[s.quiz].name, done: !!trainingRec(P, s.quiz).passed }];
  return (s.checks || []).map(c => ({ name: c.name, done: !!trainingRec(P, c.id).passed }));
}
const readingsDone = s => s.lessons.every(l => read(l.id));
const stepDone = s => readingsDone(s) && checks(s).every(c => c.done);
const firstOpen = () => { const i = STEPS.findIndex(s => !stepDone(s)); return i < 0 ? STEPS.length : i; };
const unlocked = i => i <= firstOpen();

// ---------------- layout ----------------
function nav(cur) {
  const n = $("#steps"); n.innerHTML = ""; const open = firstOpen();
  STEPS.forEach((s, i) => {
    const done = stepDone(s), lock = i > open;
    n.appendChild(h(lock ? "span" : "a", { class: "st" + (done ? " done" : "") + (lock ? " lock" : "") + (s.id === cur ? " on" : ""), href: lock ? null : "#" + s.id, "aria-current": s.id === cur ? "step" : null, title: lock ? "Opens after " + STEPS[i - 1].name : null }, [
      h("i", { text: done ? "✓" : lock ? "🔒" : String(i + 1) }), h("span", null, [h("b", { text: s.name }), h("small", { text: done ? "Done" : lock ? "Locked" : i === open ? "You're here" : s.time })])
    ]));
  });
  const all = open >= STEPS.length;
  $("#meter").innerHTML = ""; $("#meter").append(h("b", { text: all ? "All six steps done" : `Step ${Math.min(open + 1, STEPS.length)} of ${STEPS.length}` }), h("span", { class: "bar" }, [h("i", { style: `width:${Math.round(STEPS.filter(stepDone).length / STEPS.length * 100)}%` })]));
  if (user && ADMINS.includes((user.email || "").toLowerCase())) n.appendChild(h("a", { class: "st team" + (cur === "team" ? " on" : ""), href: "#team" }, [h("i", { text: "👥" }), h("span", null, [h("b", { text: "Team progress" }), h("small", { text: "Admins" })])]));
}
function para(t) { return Array.isArray(t) ? h("ul", null, t.map(x => h("li", { text: x }))) : h("p", { text: t }); }

function stepView(sec, s, i) {
  sec.append(h("p", { class: "eyebrow", text: `Step ${i + 1} of ${STEPS.length} · about ${s.time}` }), h("h1", null, [s.icon + " " + s.name]), h("p", { class: "lede", text: s.intro }));
  if (stepDone(s)) sec.appendChild(h("div", { class: "card ok" }, [h("b", { text: "✓ You've finished this step." }), " It stays open for review."]));
  const list = h("div", { class: "lessons" }); sec.appendChild(h("h2", { text: "Read" })); sec.appendChild(list);
  s.lessons.forEach((l, j) => {
    const done = read(l.id);
    const btn = h("button", { type: "button", class: "mark" + (done ? " on" : ""), "aria-pressed": String(done), text: done ? "✓ Read" : "Mark as read", onclick: async () => {
      btn.disabled = true; await saveProgress({ journey: { read: { [l.id]: done ? 0 : Date.now() } } }); P = await loadProgress(); route();
    } });
    list.appendChild(h("article", { class: "card lesson" + (done ? " read" : "") }, [
      h("div", { class: "lh" }, [h("span", { class: "n", text: String(j + 1) }), h("h3", { text: l.title })]),
      ...l.text.map(para),
      l.links ? h("p", { class: "links" }, l.links.map(([t, u]) => h("a", { href: u, target: "_blank", rel: "noopener", text: t + " ↗" }))) : null,
      h("div", { class: "row" }, [btn])
    ]));
  });
  sec.appendChild(h("h2", { text: s.quiz === "behavior" ? "Earn the six badges" : s.checks ? "Knowledge checks" : s.quiz ? "Checkpoint" : "Finish" }));
  const gate = !readingsDone(s);
  if (gate && (s.quiz || s.checks)) sec.appendChild(h("p", { class: "dim", text: "Mark every reading done to open the checkpoint." }));
  if (s.quiz === "behavior") {
    const g = h("div", { class: "badges" });
    checks(s).forEach(c => g.appendChild(h(gate ? "span" : "a", { class: "card bd" + (c.done ? " done" : ""), href: gate ? null : c.href, target: gate ? null : "_blank", rel: "noopener" }, [h("b", { text: c.name }), h("small", { text: c.done ? "✓ Earned" : gate ? "Locked" : "Open in the Behavior Guide ↗" })])));
    sec.append(g, h("p", { class: "dim small", text: "Badges are earned in the Behavior Guide's Training stop. Come back here when you're done; this page updates when you return." }));
  } else if (s.quiz && !gate) { const box = h("div", { class: "card quiz" }); sec.appendChild(box); mountQuiz(box, { ...QUIZZES[s.quiz], onDone: async () => { P = await loadProgress(); nav(s.id); nextBar(sec, s, i); } }); }
  else if (s.checks && !gate) s.checks.forEach(c => { const box = h("div", { class: "card quiz" }); sec.append(h("h3", { text: c.name }), box); mountPolicyCheck(box, { id: c.id, key: c.key, label: c.label, n: 6, pass: 5, onDone: async () => { P = await loadProgress(); nav(s.id); nextBar(sec, s, i); } }); });
  nextBar(sec, s, i);
}
function nextBar(sec, s, i) {
  const old = sec.querySelector(".next"); if (old) old.remove();
  const nx = STEPS[i + 1], done = stepDone(s);
  sec.appendChild(h("div", { class: "next" }, done
    ? [nx ? h("a", { class: "btn", href: "#" + nx.id, text: `Next: ${nx.name} →` }) : h("a", { class: "btn", href: "#finish", text: "Finish →" })]
    : [h("span", { class: "dim", text: nx ? `${nx.name} opens when this step is done.` : "Finish every check to complete onboarding." })]));
}
function finishView(sec) {
  sec.append(h("h1", null, ["🏔️ Onboarding ", h("span", { text: "complete" })]),
    h("p", { class: "lede", text: "You've worked through the Mentor Mindset, Behavior, Life Skills, Parent Communication and our policies. Everything stays open here for review, and the policy checks can be taken again any time to stay current." }),
    h("div", { class: "card" }, [h("p", { text: "Keep practicing: the Practice range and the Session room are where the Mentor Mindset becomes habit." }), h("p", { class: "links" }, [h("a", { href: "/fieldguide/#practice", text: "Practice range" }), h("a", { href: "/guides/policies/", text: "Policies & Resources" }), h("a", { href: "/guides/", text: "Guides home" })])]));
}
async function teamView(sec) {
  sec.append(h("h1", null, ["Team ", h("span", { text: "progress" })]), h("p", { class: "lede", text: "Where each guide is in onboarding, from their saved progress. Scores are best scores; individual answers aren't saved." }));
  const box = h("div", { class: "card" }, [h("p", { class: "dim", text: "Loading…" })]); sec.appendChild(box);
  try {
    const snap = await getDocs(query(collection(getFirestore(window.wlFirebase.app), "behaviorProgress"), limit(300)));
    const rows = []; snap.forEach(d => rows.push(d.data()));
    rows.sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email)));
    const keep = P; const cells = r => { P = r; const out = STEPS.map(s => stepDone(s) ? "✓" : s.lessons.some(l => read(l.id)) || checks(s).some(c => c.done) ? "…" : "·"); P = keep; return out; };
    box.innerHTML = ""; box.appendChild(h("div", { class: "scroll" }, [h("table", null, [h("tr", null, [h("th", { text: "Guide" }), ...STEPS.map(s => h("th", { title: s.name, text: s.icon }))]), ...rows.map(r => h("tr", null, [h("td", { text: r.name || r.email || "?" }), ...cells(r).map(c => h("td", { text: c }))]))])]),
      h("p", { class: "small dim", text: "✓ done · … started · · not started. Behavior counts the six badges." }));
  } catch (e) { box.innerHTML = ""; box.appendChild(h("p", { class: "dim", text: "Couldn't load the team's progress." })); }
}

function route() {
  const id = location.hash.slice(1), sec = $("#view"); sec.innerHTML = "";
  let i = STEPS.findIndex(s => s.id === id);
  if (id === "team" && user && ADMINS.includes((user.email || "").toLowerCase())) { nav("team"); return teamView(sec); }
  if (id === "finish" && firstOpen() >= STEPS.length) { nav("finish"); return finishView(sec); }
  if (i < 0 || !unlocked(i)) { i = Math.min(firstOpen(), STEPS.length - 1); if (id && id !== STEPS[i].id) history.replaceState(null, "", "#" + STEPS[i].id); }
  nav(STEPS[i].id); stepView(sec, STEPS[i], i);
}
addEventListener("hashchange", () => { route(); scrollTo(0, 0); });
// Badges and Field Guide checkpoints are earned in other tabs: refresh when this one comes back.
document.addEventListener("visibilitychange", async () => { if (document.visibilityState === "visible" && user) { P = await loadProgress(true); if (!document.querySelector(".wlq-opts, .wlq-btn:disabled")) route(); } });

(async () => {
  user = await ready();
  if (!user) { $("#view").innerHTML = ""; $("#view").appendChild(h("div", { class: "card" }, [h("h2", { text: "Sign in to start" }), h("p", { text: "Onboarding is for Wilderland staff. Sign in with your school account, top right." })])); return; }
  P = await loadProgress(true); route();
})();
document.addEventListener("wl-auth", async e => { const u = e.detail; if (!u || (user && u.uid === user.uid)) return; user = u; P = await loadProgress(true); route(); });
