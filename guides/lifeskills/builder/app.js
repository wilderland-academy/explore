// Lab builder (staff): build a Challenge, Skill Lab or Project, or review a plan, scored on the K-8 Life Skills
// Workshop Scorecard. Adapted from Ian's "Wilderland Guide Builder" prototype. The Skill Map and the 404 challenges
// come from /challenges/data.js (window.WL); the writing rules are rules.txt; AI goes through the staff relay
// (mentorConfig/main); every draft is saved to the guide's private history (/guides/log.js).
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";
import { coachLog, autosaver } from "/guides/log.js";
import { EPICS } from "./epics.js";

const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const GUESTS = ["ian@silverlineventures.com", "online@bodyform.com", "ian.silverberg@gmail.com"];   // keep in step with auth.js
const BANDS = ["K–1", "2–4", "5–8"], TYPES = ["Challenge", "Skill Lab", "Project"];
const INDICATORS = ["Life Skills Focus", "Student-Centered & Participatory", "Challenging Yet Exciting", "Real-World / Student-Relevant", "Limitless Mindset", "Unique Opportunities & Novelty", "Impressive to Parents", "Backed by Experts & Credible Research", "Test2Pass (Mastery Assessment)"];
const LEVEL = { 1: "Not yet", 2: "Progressing", 3: "Excellent" };

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function el(tag, attrs = {}, ...kids) { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v === true ? "" : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c); return e; }
const app = $("#app");

let db, user = null, relay = "", RULES = "", log = null, seq = 0, ctl = null;
const W = window.WL || { skills: [], comps: {}, ch: [] };
const skillBy = Object.fromEntries(W.skills.map(s => [s.k, s]));
const byComp = {}; for (const c of W.ch) (byComp[c.c] ||= []).push(c);
const st = { way: null, skill: null, sub: null, comp: null, idea: "", matches: null, ch: null, chAct: null, type: null, band: null, time: "", notes: "", plan: "", q: "", qBand: "", epic: null, eBand: "" };
const epicBy = Object.fromEntries(EPICS.map(e => [e.id, e]));
let turns = [], lastDraft = "", threadId = null, busy = false, status = "", stop = "", recentCache = null;
const save = autosaver(() => log, () => { status = "Couldn't save this draft to your history. Copy it before you leave."; drawOut(); });

/* ---------------- sign-in ---------------- */
function gate(msg) { app.replaceChildren(el("section", { class: "wrap gate2" }, el("div", { class: "panel" }, el("h2", { text: "Wilderland staff area" }), el("p", { text: msg })))); }
async function onAuth(u) {
  const my = ++seq; user = u;
  if (!u) return gate("Sign in with your Wilderland account, top right, to use the Lab builder.");
  const email = (u.email || "").toLowerCase();
  let ok = ADMINS.includes(email) || GUESTS.includes(email);
  if (!ok) { try { ok = (await getDoc(doc(db, "staff", email))).exists(); } catch (e) { ok = false; } }
  if (my !== seq) return;
  if (!ok) return gate("This area is for Wilderland guides and staff. If that's you, ask Alex to add your account.");
  try { const c = await getDoc(doc(db, "mentorConfig", "main")); relay = c.exists() ? (c.data().relay || "") : ""; } catch (e) { relay = ""; }
  if (!RULES) { try { const r = await fetch("rules.txt", { cache: "no-cache" }); if (r.ok) RULES = await r.text(); } catch (e) { RULES = ""; } }
  log = coachLog(db, u);
  if (my !== seq) return;
  const ep = new URLSearchParams(location.search).get("epic");
  if (ep && epicBy[ep]) { pickEpic(epicBy[ep]); history.replaceState(null, "", location.pathname); }
  const t = new URLSearchParams(location.search).get("t");
  if (t) {
    try { const x = await log.get(t); if (x && x.site === "labs") { turns = x.messages || []; threadId = x.id; lastDraft = [...turns].reverse().find(m => m.role === "assistant")?.content || ""; Object.assign(st, x.meta && x.meta.st ? x.meta.st : {}); firstShown = (x.meta && x.meta.firstShown) || ""; } } catch (e) { console.warn(e); }
    history.replaceState(null, "", location.pathname);
  }
  draw();
  if (lastDraft) $("#step3")?.scrollIntoView({ block: "start" });
}
(async () => {
  while (!window.wlFirebase) await new Promise(r => setTimeout(r, 50));
  db = getFirestore(window.wlFirebase.app);
  document.addEventListener("wl-auth", e => onAuth(e.detail));
  const a = window.wlFirebase.auth; if (a.authStateReady) { await a.authStateReady(); onAuth(a.currentUser); }
})();

/* ---------------- AI ---------------- */
async function ask(messages, { system = "", max = 3000, tier = "deep" } = {}) {
  if (!relay) throw { code: "norelay" };
  ctl = new AbortController();
  const r = await fetch(relay, { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json", Authorization: "Bearer " + await user.getIdToken() }, body: JSON.stringify({ system, messages, tier, max }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw { code: r.status, message: j.error || "" };
  return { text: j.text || "", stop: j.stop || "" };
}
const errCopy = e => e && e.name === "AbortError" ? "Stopped." : e && e.code === "norelay" ? "The AI isn't connected yet. An admin sets the relay address on the Field Guide's Admin stop." : e && e.code === 429 ? "The AI is busy. Wait a minute and try again." : e && (e.code === 401 || e.code === 403) ? "The AI relay didn't recognize your account. Sign out and back in, or ask Alex." : e && e.code === 413 ? "That's too long to send. Shorten the plan or start over." : "The AI didn't answer. Try again in a moment.";

/* ---------------- helpers ---------------- */
const compLabel = id => { const c = W.comps[id]; return c ? `${skillBy[c.k].n} › ${c.s} › ${c.n}` : id; };
const countFor = id => { const list = byComp[id] || []; return BANDS.map(b => list.filter(x => x.b === b).length); };
const countsEl = id => el("span", { class: "cnts" }, countFor(id).map((n, i) => el("span", { class: "cn" + (n ? "" : " zero") + (st.band === BANDS[i] ? " sel" : ""), title: `${BANDS[i]}: ${n} challenge${n === 1 ? "" : "s"} on the site` }, `${BANDS[i]} ${n}`)));
const chip = (label, pressed, onclick, extra = {}) => el("button", { class: "chip", type: "button", "aria-pressed": String(!!pressed), onclick, ...extra }, label);

/* ---------------- page ---------------- */
function draw() {
  app.replaceChildren(
    el("div", { class: "wrap page-head" }, el("h1", { text: "Build a Lab that's truly excellent" }),
      el("p", { text: "Start from whatever you have: a skill you need to teach, an idea you love, a challenge already on the site, or a plan you wrote. Every draft is scored against the K-8 Life Skills Workshop Scorecard and pushed toward a 3 on all nine indicators." })),
    el("div", { class: "wrap" }, step1(), step2(), step3(), recent()));
}

function step1() {
  const ways = [["epic", "An epic Lab to adapt", "Weeks-long Labs that end in a real feat, for every band. Make one yours."], ["skill", "A Life Skill to build", "Pick from the Skill Map. See which abilities have no challenges yet."], ["idea", "A cool idea", "Describe the activity. The builder suggests the Life Skill it really builds."], ["existing", "A challenge on the site", "Run it as a Skill Lab, make a version for another age, or an Epic."], ["review", "A plan I already wrote", "Paste it. Get its scorecard and the 2–3 changes that matter most."]];
  const sec = el("section", { class: "step" }, el("span", { class: "stepn", text: "Step 1" }), el("h2", { text: "What do you have to start with?" }),
    el("div", { class: "ways", role: "group", "aria-label": "Ways to start" }, ways.map(([k, b, s]) => el("button", { class: "way", type: "button", "aria-pressed": String(st.way === k), onclick: () => { st.way = k; if (k === "review") st.type = null; draw(); } }, el("b", { text: b }), el("span", { text: s })))));
  if (st.way === "epic") sec.append(epicPanel());
  if (st.way === "skill") sec.append(skillPanel());
  if (st.way === "idea") sec.append(ideaPanel());
  if (st.way === "existing") sec.append(existingPanel());
  if (st.way === "review") sec.append(el("div", { class: "panel" }, el("div", { class: "field" }, el("label", { class: "lbl", for: "plan", text: "Paste your plan" }),
    el("textarea", { id: "plan", style: "min-height:200px", placeholder: "Paste a Lab plan, a challenge idea, or a project proposal.", oninput: e => { st.plan = e.target.value; } }))));
  if (st.way === "review") setTimeout(() => { const t = $("#plan"); if (t && !t.value) t.value = st.plan; });
  return sec;
}
function pickEpic(e) {
  Object.assign(st, { way: "epic", epic: e.id, band: e.band, type: "Skill Lab", comp: e.skills[0], time: e.weeks, eBand: st.eBand || e.band });
}
function epicPanel() {
  const p = el("div", { class: "panel" });
  p.append(el("p", { class: "note", text: "Alpha reports its pre-K students building a real treehouse with power tools, swimming long distances and building 1,000-piece sets, over weeks or months. We have less money and higher ratios, so each option here says what support it needs and roughly what it costs. Every one follows the Workshop Scorecard: high standards, high support, high autonomy." }));
  p.append(el("div", { class: "chips", role: "group", "aria-label": "Band" }, [["", "All bands"], ...BANDS.map(b => [b, b])].map(([b, lab]) => chip(lab, st.eBand === b, () => { st.eBand = b; draw(); }))));
  const list = EPICS.filter(e => !st.eBand || e.band === st.eBand);
  p.append(el("div", { class: "epics" }, list.map(e => {
    const on = st.epic === e.id;
    return el("article", { class: "epic" + (on ? " on" : "") },
      el("div", { class: "etop" }, el("span", { class: "cn", text: e.band }), el("span", { class: "cn", text: e.weeks }), el("span", { class: "cn", title: "$ uses what we have · $$ a few hundred dollars · $$$ over about $1,000 or a paid partner", text: e.cost })),
      el("h3", { text: e.title }),
      el("p", { class: "feat", text: e.feat }),
      el("p", { class: "note", text: e.skills.map(compLabel).map(x => x.split(" › ").pop()).join(" · ") }),
      el("details", {}, el("summary", { text: "How it hits the Scorecard" }),
        el("dl", {}, [["High standards", e.standards], ["High support", e.support], ["High autonomy", e.autonomy], ["Test to Pass", e.test], ["Showcase", e.showcase], ["Safety", e.safety], ["Worth knowing", e.note]].flatMap(([k, v]) => v ? [el("dt", { text: k }), el("dd", { text: v })] : []))),
      el("button", { class: "btn " + (on ? "lime" : "go"), type: "button", text: on ? "Chosen: set the details below" : "Make this one ours", onclick: () => { pickEpic(e); draw(); $("#step2")?.scrollIntoView({ behavior: "smooth", block: "start" }); } }));
  })));
  return p;
}
function skillPanel() {
  const p = el("div", { class: "panel" });
  p.append(el("div", { class: "field" }, el("span", { class: "lbl", text: "Life Skill" }), el("div", { class: "chips" }, W.skills.map(s => chip([el("span", { class: "sw", style: `background:${s.col}` }), s.n], st.skill === s.k, () => { st.skill = s.k; st.sub = null; st.comp = null; draw(); })))));
  if (st.skill) {
    const subs = [...new Set(Object.values(W.comps).filter(c => c.k === st.skill).map(c => c.s))];
    p.append(el("div", { class: "field" }, el("span", { class: "lbl", text: "Sub-skill" }), el("div", { class: "chips" }, subs.map(s => chip(s, st.sub === s, () => { st.sub = s; st.comp = null; draw(); })))));
  }
  if (st.sub) {
    p.append(el("div", { class: "field" }, el("span", { class: "lbl", text: "Specific ability" }), el("p", { class: "note", text: "Numbers show how many challenges the site has now for K–1, 2–4 and 5–8. Red means none yet." }),
      el("div", { class: "rows" }, Object.entries(W.comps).filter(([, c]) => c.k === st.skill && c.s === st.sub).map(([id, c]) => el("button", { class: "r", type: "button", "aria-pressed": String(st.comp === id), onclick: () => { st.comp = id; draw(); } }, el("span", { class: "t", text: c.n }), countsEl(id))))));
    if (st.comp) p.append(existingFor(st.comp));
  }
  return p;
}
function existingFor(id) {
  const list = byComp[id] || [];
  if (!list.length) return el("div", { class: "box gap", text: "No challenges on the site for this ability yet. Anything you build here fills a real gap." });
  return el("details", {}, el("summary", { text: `${list.length} challenge${list.length > 1 ? "s" : ""} already on the site for this ability` }),
    el("div", { class: "rows", style: "margin-top:8px" }, list.map(c => el("div", { class: "r", style: "cursor:default" }, el("span", { class: "t", text: c.t }), el("span", { class: "cn", text: `${c.b} · ${c.z}` })))));
}
function ideaPanel() {
  const ta = el("textarea", { id: "idea", placeholder: "e.g. Kids test the creek water above and below the barn and figure out what's changing it.", oninput: e => { st.idea = e.target.value; } });
  ta.value = st.idea;
  const note = el("span", { class: "note", id: "ideaNote" });
  const btn = el("button", { class: "btn go", type: "button", text: "Find the Life Skill it builds", onclick: () => matchIdea(btn, note) });
  const p = el("div", { class: "panel" }, el("div", { class: "field" }, el("label", { class: "lbl", for: "idea", text: "Your idea" }), ta), el("div", { class: "acts" }, btn, note));
  if (st.matches) p.append(el("div", { class: "rows" }, st.matches.map(m => el("button", { class: "r", type: "button", "aria-pressed": String(st.comp === m.id), onclick: () => { st.comp = m.id; draw(); } }, el("span", { class: "t", text: compLabel(m.id) }), countsEl(m.id), el("span", { class: "s", text: [m.why, m.angle].filter(Boolean).join(" ") })))));
  return p;
}
async function matchIdea(btn, note) {
  const idea = st.idea.trim();
  if (idea.length < 10) { note.textContent = "Describe the idea first: what would the kids actually do?"; return; }
  btn.disabled = true; note.textContent = "Matching against the Skill Map…";
  const mapLines = Object.entries(W.comps).map(([id, c]) => `${id} | ${skillBy[c.k].n} > ${c.s} > ${c.n} | challenges K–1/2–4/5–8: ${countFor(id).join("/")}`).join("\n");
  const prompt = `A Wilderland guide has this activity idea:\n"""${idea}"""\n\nThe Skill Map (id | Life Skill > Sub-skill > Specific ability | challenges already on the site per band):\n${mapLines}\n\nPick the 3 specific abilities this idea could build best, strongest first. Prefer abilities where the idea would make a learner actually DO the skill, not just learn about the topic. If an ability has few or no challenges yet, that's a plus; say so.\nAlso recommend whether it works best as a Challenge (a student proves it alone), a Skill Lab (the guide leads the crew to learn it together) or a Project (about 25 hours, shown to real people), and the age band it fits best.\nReturn only JSON: {"matches":[{"id":"EN-08","why":"one plain sentence on the skill the kids would really build","angle":"one sentence on how to shape the idea to build it"}],"type":"Challenge|Skill Lab|Project","band":"K–1|2–4|5–8","note":"one sentence or empty"}`;
  try {
    const r = await ask([{ role: "user", content: prompt }], { system: "You match activity ideas to Wilderland Academy's Skill Map. Content is the vehicle; the skill is the point. Reply with JSON only, no prose.", max: 900 });
    const j = JSON.parse((r.text.match(/\{[\s\S]*\}/) || ["{}"])[0]);
    st.matches = (j.matches || []).filter(m => W.comps[m.id]).slice(0, 3);
    if (TYPES.includes(j.type) && !st.type) st.type = j.type;
    if (BANDS.includes(j.band) && !st.band) st.band = j.band;
    draw();
    const n = $("#ideaNote"); if (n) n.textContent = st.matches.length ? (j.note || "Pick the one that fits what you want kids to get better at.") : "No clear match. Try describing what the kids would actually do.";
  } catch (e) { btn.disabled = false; note.textContent = e instanceof SyntaxError ? "The match came back unreadable. Try again." : errCopy(e); }
}
const ACTS = [["lab", "Run it as a Skill Lab", "Skill Lab"], ["band", "A version for another age band", "Challenge"], ["epic", "A harder Epic version", "Challenge"], ["improve", "Review and improve it", "Challenge"]];
function existingPanel() {
  const q = el("input", { type: "search", id: "chq", placeholder: "e.g. knot, budget, bird, sleep", value: st.q });
  const band = el("select", { id: "chb" }, el("option", { value: "", text: "All bands" }), BANDS.map(b => el("option", { text: b, selected: st.qBand === b })));
  const results = el("div", { class: "rows" });
  const render = () => {
    st.q = q.value; st.qBand = band.value;
    const words = st.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let list = W.ch.filter(c => (!st.qBand || c.b === st.qBand) && words.every(w => (c.t + " " + compLabel(c.c)).toLowerCase().includes(w)));
    if (st.ch) list = [st.ch, ...list.filter(c => c !== st.ch)];
    results.replaceChildren(el("p", { class: "note", text: `${list.length} challenge${list.length === 1 ? "" : "s"}${list.length > 25 ? ", showing 25. Search to narrow it down." : ""}` }),
      ...list.slice(0, 25).map(c => el("button", { class: "r", type: "button", "aria-pressed": String(st.ch === c), onclick: () => { st.ch = c; st.comp = c.c; if (!st.band) st.band = c.b; draw(); } }, el("span", { class: "t", text: c.t }), el("span", { class: "cn", text: `${c.b} · ${c.z}${c.lab ? " · Lab" : ""}` }), el("span", { class: "s", text: compLabel(c.c) }))));
  };
  q.addEventListener("input", render); band.addEventListener("change", render); render();
  const p = el("div", { class: "panel" }, el("div", { class: "grid2x" }, el("div", { class: "field" }, el("label", { class: "lbl", for: "chq", text: "Search challenges" }), q), el("div", { class: "field" }, el("label", { class: "lbl", for: "chb", text: "Age band" }), band)), results);
  if (st.ch) p.append(el("div", { class: "field" }, el("span", { class: "lbl", text: "What do you want to make from it?" }), el("div", { class: "chips" }, ACTS.map(([k, lab, type]) => chip(lab, st.chAct === k, () => { st.chAct = k; st.type = type; draw(); })))));
  return p;
}

function ready1() { return st.way === "review" ? true : st.way === "existing" ? !!(st.ch && st.chAct) : st.way === "epic" ? !!st.epic : !!st.comp; }
function step2() {
  if (!ready1()) return null;
  const sec = el("section", { class: "step", id: "step2" }, el("span", { class: "stepn", text: "Step 2" }), el("h2", { text: "The details" }));
  const p = el("div", { class: "panel" });
  if (st.way === "review") p.append(el("p", {}, el("b", { text: "Reviewing " }), "your plan against the scorecard."));
  else if (st.way === "epic") p.append(el("p", {}, el("b", { text: "Starting from: " }), epicBy[st.epic].title, el("br"), el("b", { text: "Skills: " }), epicBy[st.epic].skills.map(compLabel).join("; ")));
  else p.append(el("p", {}, el("b", { text: "Skill: " }), compLabel(st.comp), st.ch ? el("span", {}, el("br"), el("b", { text: "From: " }), st.ch.t) : null));
  if (st.way === "epic") p.append(el("p", { class: "note", text: "Change the band, the time or the notes to fit your crew (number of kids, adults you can count on, budget, season). The builder keeps the feat and the high bar unless you tell it otherwise." }));
  if (st.way !== "review" && st.way !== "existing" && st.way !== "epic") p.append(el("div", { class: "field" }, el("span", { class: "lbl", text: "What are we making?" }), el("div", { class: "chips" }, TYPES.map(t => chip(t, st.type === t, () => { st.type = t; draw(); }, { disabled: t === "Project" && st.band === "K–1" ? true : null })))));
  p.append(el("div", { class: "field" }, el("span", { class: "lbl", text: st.way === "review" ? "Age band (optional)" : "Age band" }), el("div", { class: "chips" }, BANDS.map(b => chip(b, st.band === b, () => { st.band = b; if (b === "K–1" && st.type === "Project") st.type = "Skill Lab"; draw(); })))));
  const n = [];
  if (st.band === "K–1" && st.type === "Challenge" && st.way !== "review") n.push(el("div", { class: "box warn", text: "K–1 students don't run Challenges on their own. The builder will make it guide-led (the guide runs it, each child shows the skill alone), or switch to a Skill Lab." }));
  if (st.band === "2–4" && st.type === "Project") n.push(el("div", { class: "box warn", text: "Projects for 2–4 are by exception: the student asks, and the guide and a parent agree. Otherwise a Challenge or Lab builds the skills first." }));
  if (st.way === "existing" && st.chAct === "lab") n.push(el("div", { class: "box ok", text: "A Lab built from a Challenge keeps that Challenge's Test to Pass, and the Challenge comes off this group's menu for the year." }));
  if (st.comp && st.band && st.way !== "review" && st.type === "Challenge" && !countFor(st.comp)[BANDS.indexOf(st.band)]) n.push(el("div", { class: "box gap", text: `There's no ${st.band} challenge for this ability yet. This one fills a gap.` }));
  p.append(...n);
  if (st.way !== "review") {
    const time = el("input", { type: "text", id: "time", placeholder: "e.g. 3 weeks, 90-minute afternoons", value: st.time, oninput: e => { st.time = e.target.value; } });
    const notes = el("input", { type: "text", id: "notes", placeholder: "e.g. 20 kids, outdoors, we have a creek", value: st.notes, oninput: e => { st.notes = e.target.value; } });
    p.append(el("div", { class: "grid2x" }, el("div", { class: "field" }, el("label", { class: "lbl", for: "time", text: "Time we have (optional)" }), time), el("div", { class: "field" }, el("label", { class: "lbl", for: "notes", text: "Anything else (optional)" }), notes)));
  }
  const missing = st.way === "review" ? [] : [!st.type && "what we're making", !st.band && "the age band"].filter(Boolean);
  const hint = el("span", { class: "note", text: missing.length ? "Pick " + missing.join(" and ") + "." : "" });
  const go = el("button", { class: "btn go", type: "button", text: st.way === "review" ? "Score my plan" : "Build the draft", disabled: missing.length || busy ? true : null, onclick: () => {
    if (st.way === "review" && st.plan.trim().length < 40) { hint.textContent = "Paste the plan in Step 1 first."; return; }
    turns = [{ role: "user", content: buildPrompt() }]; firstShown = requestSummary(); threadId = null; lastDraft = ""; run();
  } });
  p.append(el("div", { class: "acts" }, go, hint));
  sec.append(p);
  return sec;
}

function challengeBrief(c, full) {
  const tags = [c.z === "Epic" && "Epic", c.lab && "Recommended Lab", c.h && "Can Do at Home", c.gate && "Safety Gate"].filter(Boolean).join(", ");
  let s = `- [${c.id}] ${c.b} ${c.z}: ${c.t}${tags ? ` (${tags})` : ""}`;
  if (full) s += `\n  Time: ${c.tm || ""}\n  How it's checked: ${c.w || ""}\n  Steps:\n${(c.how || []).map(x => "   - " + x).join("\n")}${c.st ? "\n  Epic checkpoints: " + c.st.join(" | ") : ""}`;
  else { const pass = (c.how || []).find(x => /^pass/i.test(x)); if (pass) s += `\n  ${pass}`; }
  return s;
}
function buildPrompt() {
  const ctx = [];
  if (st.comp && st.way !== "review") {
    const c = W.comps[st.comp];
    ctx.push(`Skill Map position (use these exact names):\n- Life Skill: ${skillBy[c.k].n}\n- Sub-skill: ${c.s}\n- Specific ability: ${c.n} (id ${st.comp})`);
    const ex = (byComp[st.comp] || []).filter(x => x !== st.ch);
    ctx.push(ex.length ? `Challenges already on the site for this ability (don't duplicate them; build on them or point to them):\n${ex.map(x => challengeBrief(x, false)).join("\n")}` : "There are no challenges on the site for this ability yet.");
  }
  let req;
  if (st.way === "review") req = `Mode D: review this plan a guide wrote.${st.band ? ` Age band: ${st.band}.` : ""}\n\nThe plan:\n"""\n${st.plan.trim()}\n"""`;
  else if (st.way === "existing") {
    req = { lab: `Mode B: build a Skill Lab from this Challenge for ${st.band}. Keep its Test to Pass exactly, and note that the Challenge comes off this group's menu for the year.`,
      band: `Mode A: build a version of this Challenge for the ${st.band} band. Keep the same specific ability; change the size, bar and support to fit the age.`,
      epic: `Mode A: build a harder Epic version of this Challenge (2 to 3 weeks, counts as 2) for ${st.band}, with checkpoints.`,
      improve: `Mode D, then Mode A: score this Challenge on the Scorecard as written, then give an improved version in the Challenge Card template and score that.` }[st.chAct] + `\n\nThe starting challenge (from the site):\n${challengeBrief(st.ch, true)}`;
  } else {
    req = `Mode ${{ Challenge: "A", "Skill Lab": "B", Project: "C" }[st.type]}: build a ${st.type} for the ${st.band} band.`;
    if (st.way === "idea") req += `\nThe guide's idea: """${st.idea.trim()}"""\nKeep the guide's idea as the vehicle, but shape it so passing requires the specific ability.`;
  }
  if (st.way === "epic") {
    const e = epicBy[st.epic];
    req = `Mode B, Epic Lab: build a full Epic Skill Lab for the ${st.band} band, starting from this example. Keep the feat and the bar unless the guide's notes change them. Fill in the whole plan week by week, with the specific steps that get every child from where they start to the feat, how adults and outside experts are used, the Test to Pass for each skill target, and the showcase. If the guide's band differs from the example's (${e.band}), adapt the feat so it is still impressive for that age.\n\nThe example:\nTitle: ${e.title}\nFeat: ${e.feat}\nLength: ${e.weeks}\nSkill targets: ${e.skills.map(id => compLabel(id) + " (" + id + ")").join("; ")}\nHigh standards: ${e.standards}\nHigh support: ${e.support}\nHigh autonomy: ${e.autonomy}\nTest to Pass: ${e.test}\nShowcase: ${e.showcase}\nSafety: ${e.safety}\nCost: ${e.cost}\nNotes: ${e.note || ""}`;
  }
  if (st.time.trim()) req += `\nTime we have: ${st.time.trim()}`;
  if (st.notes.trim()) req += `\nOther notes from the guide: ${st.notes.trim()}`;
  return `The guide chose these with buttons, so treat them as settled and don't ask about them. Don't ask questions on this first draft: fill sensible defaults, list them on the "Assumed:" line, and produce the full finished draft now. The guide can ask for changes afterward.\n\n${ctx.join("\n\n")}\n\n## The request\n${req}`;
}
function requestSummary() {
  if (st.way === "review") return "Review my plan" + (st.band ? " (" + st.band + ")" : "") + ":\n\n" + st.plan.trim();
  if (st.way === "epic") return ["Make this Epic Lab ours: " + epicBy[st.epic].title + " for " + st.band, st.time.trim() ? "Time: " + st.time.trim() : "", st.notes.trim() ? "Notes: " + st.notes.trim() : ""].filter(Boolean).join("\n");
  const what = st.way === "existing" ? { lab: "Run this challenge as a Skill Lab", band: "A version of this challenge for another age band", epic: "A harder Epic version of this challenge", improve: "Review and improve this challenge" }[st.chAct] + ": " + st.ch.t : "Build a " + st.type;
  return [what + (st.band ? " for " + st.band : ""), st.comp ? "Skill: " + compLabel(st.comp) : "", st.way === "idea" ? "My idea: " + st.idea.trim() : "", st.time.trim() ? "Time: " + st.time.trim() : "", st.notes.trim() ? "Notes: " + st.notes.trim() : ""].filter(Boolean).join("\n");
}
let firstShown = "";
function system() { return RULES + "\n\nToday is " + new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) + "."; }

async function run() {
  if (!RULES) { status = "The builder's rules didn't load. Reload the page."; drawOut(); return; }
  busy = true; status = ""; stop = ""; draw(); $("#step3")?.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const r = await ask(turns, { system: system(), max: 3000 });
    if (!r.text) throw { code: "empty" };
    turns.push({ role: "assistant", content: r.text }); lastDraft = r.text; stop = r.stop;
    if (!threadId) threadId = log.newId();
    recentCache = null;
    await save({ id: threadId, site: "labs", kind: st.way === "review" ? "Review" : st.type || "Challenge", title: titleOf(r.text), messages: turns, meta: { st: { way: st.way, comp: st.comp, type: st.type, band: st.band, epic: st.epic }, firstShown } });
  } catch (e) { if (turns.at(-1)?.role === "user") turns.pop(); status = errCopy(e); }
  busy = false; ctl = null; draw(); $("#step3")?.scrollIntoView({ block: "start" });
}
function titleOf(text) {
  const t = (text.match(/^(?:CHALLENGE|SKILL LAB|PROJECT):\s*(.+)$/m) || [])[1] || (text.match(/^##\s+(.+)$/m) || [])[1] || (st.comp ? W.comps[st.comp].n : "Plan review");
  const kind = st.way === "review" ? "Review" : st.type || "";
  return (kind && !/^(review|challenge|skill lab|project)/i.test(t) ? kind + ": " : "") + t.replace(/[*_`]/g, "").trim().slice(0, 110);
}

/* ---------------- draft view ---------------- */
function step3() {
  if (!busy && !lastDraft && !status) return null;
  const sec = el("section", { class: "step", id: "step3" }, el("span", { class: "stepn", text: "Step 3" }), el("h2", { text: st.way === "review" ? "Your review" : "Your draft" }), el("div", { class: "panel", id: "outPanel" }));
  setTimeout(drawOut);
  return sec;
}
function drawOut() {
  const p = $("#outPanel"); if (!p) return;
  p.replaceChildren();
  if (busy) p.append(el("p", { class: "thinking", text: "Building and scoring… a full draft takes about a minute." }), el("div", { class: "acts" }, el("button", { class: "btn white", type: "button", text: "Stop", onclick: () => ctl && ctl.abort() })));
  if (lastDraft && !busy) {
    const { md, score } = splitScore(lastDraft);
    const out = el("div", { class: "out", html: renderMd(md) });
    if (score) { const sc = scoreCard(score); const at = out.querySelector("h2.scorecard-h"); if (at) at.replaceWith(sc); else out.append(sc); }
    p.append(out);
    if (stop === "max_tokens" || (lastDraft.match(/^```/gm) || []).length % 2 === 1) p.append(el("p", { class: "box warn", text: "The draft was cut short. Ask below for a shorter version, or for the rest." }));
    const copy = el("button", { class: "btn white", type: "button", text: "Copy draft", onclick: async () => { try { await navigator.clipboard.writeText(splitScore(lastDraft).md.replace(/\n## Scorecard\s*$/m, "")); copy.textContent = "Copied"; } catch (e) { copy.textContent = "Couldn't copy"; } setTimeout(() => copy.textContent = "Copy draft", 2000); } });
    p.append(el("div", { class: "acts" }, copy, el("a", { class: "btn plain", href: "/guides/history/#labs", text: "Saved in your history" }), el("button", { class: "btn plain", type: "button", text: "Start over", onclick: restart })));
    const ta = el("textarea", { id: "refine", style: "min-height:76px", placeholder: "e.g. Make it 2 weeks instead of 3. Make the pass line harder. Use the creek instead of the garden. Raise indicator 7." });
    const go = el("button", { class: "btn go", type: "button", text: "Update the draft", onclick: () => { const t = ta.value.trim(); if (!t) { ta.focus(); return; } turns.push({ role: "user", content: t + "\n\n(Give the full updated draft in the same format, with a fresh Scorecard.)" }); run(); } });
    p.append(el("div", { class: "field" }, el("label", { class: "lbl", for: "refine", text: "Change something" }), ta, el("div", { class: "acts" }, go)));
  }
  if (status) p.append(el("p", { class: "note err", text: status }));
}
function splitScore(text) {
  const m = text.match(/```scorecard\s*\n([\s\S]*?)```/);
  if (!m) return { md: text, score: null };
  let score = null; try { score = JSON.parse(m[1]); } catch (e) { score = null; }
  return { md: text.replace(m[0], ""), score };
}
function scoreCard(sc) {
  const s = (sc.scores || []).slice(0, 9).map(n => Math.max(1, Math.min(3, Math.round(Number(n) || 1))));
  const total = s.reduce((a, b) => a + b, 0), threes = s.filter(n => n === 3).length;
  const nexts = (sc.next || []).slice();
  return el("div", { class: "score" },
    el("div", { class: "tot" }, el("b", { text: total + "/27" }), el("span", { text: `${threes} of 9 indicators at Excellent · K-8 Life Skills Workshop Scorecard` })),
    el("div", { class: "srows" }, s.map((n, i) => el("div", { class: "srow s" + n }, el("b", { text: (i + 1) + ". " + INDICATORS[i] }), el("div", {}, el("div", { class: "pips", "aria-label": n + " of 3, " + LEVEL[n] }, el("i"), el("i"), el("i")), el("span", { class: "note", text: LEVEL[n] })), el("span", { class: "w", text: (sc.why || [])[i] || "" }),
      n < 3 && nexts.length ? el("span", { class: "nx", text: "To reach 3: " + nexts.shift() }) : null))),
    el("p", { class: "note", text: "Claude's honest read of the draft as written. Check it against the scorecard yourself before you run the Lab." }));
}
function inline(s) { return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>").replace(/\[(CONFIRM|ADD)([^\]]*)\]/g, '<mark style="background:#f9bf0333">[$1$2]</mark>'); }
function renderMd(md) {
  const lines = md.replace(/\r/g, "").split("\n"); let html = "", i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; html += `<pre><code>${esc(buf.join("\n"))}</code></pre>`; continue; }
    const hd = l.match(/^(#{1,4})\s+(.*)/); if (hd) { const n = hd[1].length <= 2 ? 2 : 3; html += /^scorecard$/i.test(hd[2].trim()) ? `<h2 class="scorecard-h">Scorecard</h2>` : `<h${n}>${inline(hd[2])}</h${n}>`; i++; continue; }
    if (/^\s*\|.*\|\s*$/.test(l)) { const rows = []; while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(lines[i++]); html += "<table>" + rows.filter(r => !/^\s*\|[\s:|-]+\|\s*$/.test(r)).map((r, ri) => "<tr>" + r.trim().slice(1, -1).split("|").map(c => ri === 0 ? `<th>${inline(c.trim())}</th>` : `<td>${inline(c.trim())}</td>`).join("") + "</tr>").join("") + "</table>"; continue; }
    if (/^\s*[-*]\s+/.test(l)) { html += "<ul>"; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) html += `<li>${inline(lines[i++].replace(/^\s*[-*]\s+/, ""))}</li>`; html += "</ul>"; continue; }
    if (/^\s*\d+[.)]\s+/.test(l)) { html += "<ol>"; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) html += `<li>${inline(lines[i++].replace(/^\s*\d+[.)]\s+/, ""))}</li>`; html += "</ol>"; continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(l) || !l.trim()) { i++; continue; }
    const buf = []; while (i < lines.length && lines[i].trim() && !/^(```|#{1,4}\s|\s*[-*]\s|\s*\d+[.)]\s|\s*\|)/.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) buf.push(lines[i++]);
    html += `<p>${buf.map(inline).join("<br>")}</p>`;
  }
  return html;
}

/* ---------------- recent drafts ---------------- */
function recent() {
  const sec = el("section", { class: "step", id: "recent" }, el("span", { class: "stepn", text: "Saved" }), el("h2", { text: "Your recent drafts" }), el("p", { class: "note", text: "Loading…" }));
  (recentCache ||= log.list(60)).then(all => {
    const mine = all.filter(x => x.site === "labs").slice(0, 8);
    const box = el("div", { class: "drafts" });
    if (!mine.length) box.append(el("p", { class: "note", text: "Drafts you build are saved here automatically. Only you can see them." }));
    mine.forEach(x => box.append(el("a", { class: "r", href: "?t=" + encodeURIComponent(x.id), style: "text-decoration:none;color:inherit" }, el("span", { class: "t", text: x.title }), el("span", { class: "cn", text: new Date(x.updated).toLocaleDateString(undefined, { month: "short", day: "numeric" }) }))));
    box.append(el("a", { class: "btn plain", href: "/guides/history/#labs", style: "align-self:flex-start", text: "All drafts, with delete, in your history" }));
    sec.lastChild.replaceWith(box);
  }).catch(() => { recentCache = null; sec.lastChild.textContent = "Couldn't load your saved drafts."; });
  return sec;
}
function restart() {
  Object.assign(st, { way: null, skill: null, sub: null, comp: null, idea: "", matches: null, ch: null, chAct: null, type: null, band: null, time: "", notes: "", plan: "", q: "", qBand: "", epic: null, eBand: "" });
  turns = []; lastDraft = ""; threadId = null; status = ""; stop = ""; draw(); scrollTo({ top: 0, behavior: "smooth" });
}
