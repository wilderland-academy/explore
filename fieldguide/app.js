// Mentor Mindset Field Guide (staff only). Sign-in comes from /auth.js; data lives in Firestore under mentor/{uid}/…
// AI calls go through the relay in /relay/worker.js, whose address an admin saves under Admin.
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, addDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";
import * as D from "./data.js";

const GUESTS = ["ian@silverlineventures.com", "online@bodyform.com"];
const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function h(tag, attrs, kids) { const e = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]); } (kids || []).forEach(c => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
const ul = items => h("ul", null, items.map(t => h("li", { text: t })));
const local = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
const app = $("#app");
let fb, db, user = null, isAdmin = false, relay = "", startedFor = null, authSeq = 0;

/* ---------------- sign-in gate ---------------- */
function gate(msg) { startedFor = null; $("#trail").hidden = true; app.innerHTML = ""; app.appendChild(h("section", { class: "view" }, [h("div", { class: "card gate" }, [h("h2", { text: "Wilderland staff area" }), h("p", { class: "dim", text: msg })])])); }
async function onAuth(u) {
  const seq = ++authSeq; user = u;
  if (!u) return gate("Sign in with your Wilderland account, top right, to open the field guide.");
  if (startedFor === u.uid) return;
  const email = (u.email || "").toLowerCase(); isAdmin = ADMINS.includes(email);
  let ok = isAdmin || GUESTS.includes(email);
  if (!ok) { try { ok = (await getDoc(doc(db, "staff", email))).exists(); } catch (e) { ok = false; } }
  if (seq !== authSeq) return;
  if (!ok) return gate("This area is for Wilderland guides and staff. If that's you, ask Alex to add your account.");
  try { const c = await getDoc(doc(db, "mentorConfig", "main")); relay = c.exists() ? (c.data().relay || "") : ""; } catch (e) { relay = ""; }
  if (seq !== authSeq) return;
  startedFor = u.uid; sess = { screen: "list", student: null, session: null, students: null, sessions: null }; buildNav(); $("#trail").hidden = false; route();
}
(async () => {
  while (!window.wlFirebase) await new Promise(r => setTimeout(r, 50));
  fb = window.wlFirebase; db = getFirestore(fb.app);
  document.addEventListener("wl-auth", e => onAuth(e.detail));
  if (fb.auth.authStateReady) { await fb.auth.authStateReady(); onAuth(fb.auth.currentUser); }
})();

/* ---------------- AI through the relay ---------------- */
async function ai(messages, { system = "", tier = "deep", max = 900 } = {}) {
  if (!relay) throw { code: "norelay" };
  const r = await fetch(relay, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + await user.getIdToken() }, body: JSON.stringify({ system, messages, tier, max }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw { code: r.status, message: j.error || "" };
  return j.text || "";
}
const aiErr = e => e && e.code === "norelay" ? "The AI isn't connected yet. An admin adds the relay address under Admin." : e && e.code === 429 ? "The AI is busy. Wait a minute and try again." : e && e.code === 401 || e && e.code === 403 ? "The AI relay didn't recognize your account. Sign out and back in, or ask an admin." : "The AI didn't answer. Try again in a moment.";
function parseJSON(t) { const m = (t || "").match(/\{[\s\S]*\}/); if (!m) throw new Error("format"); return JSON.parse(m[0]); }
const clamp4 = x => Math.max(0, Math.min(4, Math.round(Number(x) || 0)));
const meter = (label, v) => h("div", { class: "score" }, [h("span", { text: label }), h("div", { class: "meter" }, [h("i", { style: "width:" + v * 25 + "%" })]), h("b", { text: v + "/4" })]);

/* ---------------- routing ---------------- */
const STOPS = [["map", "Map", ""], ["start", "Trailhead", "The idea in five minutes"], ["evidence", "The evidence", "What the studies found"], ["spot", "Lookout", "Spot enforcer and protector moves"], ["phrases", "Phrasebook", "Say this instead"], ["moments", "Trail moments", "What to say right now"], ["trust", "Rough terrain", "Jaded and shut-down kids"], ["stories", "Campfire", "Where it worked"], ["practice", "Practice range", "Rehearse and get scored"], ["coach", "Coach's tent", "Ask about a real situation"], ["sessions", "Session room", "Record, review, plan the next one"], ["habits", "Pack list", "How we make it stick"]];
function buildNav() { const nav = $("#nav"); nav.innerHTML = ""; STOPS.concat(isAdmin ? [["admin", "Admin", ""]] : []).forEach(s => nav.appendChild(h("a", { href: "#" + s[0], text: s[1] }))); }
const VIEWS = {};
function route() {
  if (!startedFor) return;
  if (live.on) { if (location.hash !== "#sessions") history.replaceState(null, "", "#sessions"); return; }
  let v = location.hash.slice(1); if (!VIEWS[v] || (v === "admin" && !isAdmin)) v = "map";
  document.querySelectorAll("#nav a").forEach(a => { if (a.getAttribute("href") === "#" + v) { a.setAttribute("aria-current", "page"); a.scrollIntoView && a.scrollIntoView({ block: "nearest", inline: "center" }); } else a.removeAttribute("aria-current"); });
  const sec = h("section", { class: "view" }); app.innerHTML = ""; app.appendChild(sec); VIEWS[v](sec); window.scrollTo(0, 0);
}
addEventListener("hashchange", route);
const head = (sec, title, lede) => { sec.appendChild(h("h1", { html: title })); if (lede) sec.appendChild(h("p", { class: "lede", text: lede })); };
const card = (cls, kids) => h("div", { class: "card " + (cls || "") }, kids);

/* ---------------- map ---------------- */
VIEWS.map = sec => {
  head(sec, "The <span>Mentor Mindset</span> Field Guide", "High standards, high support, high autonomy. Pick a stop. Nothing here is homework. Wander.");
  const pts = [[80, 452], [222, 398], [130, 292], [302, 250], [442, 342], [592, 420], [732, 352], [622, 240], [470, 162], [642, 108], [812, 172]];
  const trees = [[40, 380], [300, 440], [520, 470], [380, 200], [690, 460], [860, 330], [200, 200], [560, 130]];
  let svg = `<svg viewBox="0 0 900 520" role="img" aria-label="Trail map of the field guide">
  <circle cx="770" cy="70" r="26" fill="#d5f367" opacity=".9"/>
  <path d="M0 330 120 190 230 280 360 130 480 260 600 100 720 240 820 150 900 230V520H0Z" fill="#0f3a2d"/>
  <path d="M0 420 150 300 290 400 430 290 560 390 700 280 900 400V520H0Z" fill="#0b2b20"/>
  <path d="M600 100 560 150 600 140 640 152Z" fill="#f6f8ea" opacity=".8"/><path d="M360 130 330 170 360 162 392 172Z" fill="#f6f8ea" opacity=".6"/>
  ${trees.map(t => `<path d="M${t[0]} ${t[1]}l10 22h-20z M${t[0]} ${t[1] + 12}l13 24h-26z" fill="#015640"/>`).join("")}
  <polyline points="${pts.map(p => p.join(",")).join(" ")}" fill="none" stroke="#d5f367" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`;
  STOPS.slice(1).forEach((s, i) => { const [x, y] = pts[i]; svg += `<a href="#${s[0]}" aria-label="${esc(s[1])}"><circle cx="${x}" cy="${y}" r="18" fill="#d5f367" stroke="#08140f" stroke-width="3"/><text class="n" x="${x}" y="${y + 5}" text-anchor="middle">${i + 1}</text><text class="l" x="${x}" y="${y + 40}" text-anchor="middle">${esc(s[1])}</text></a>`; });
  sec.appendChild(h("div", { class: "map", html: svg + "</svg>" }));
  const g = h("div", { class: "stops" });
  STOPS.slice(1).forEach((s, i) => g.appendChild(h("a", { class: "stop", href: "#" + s[0] }, [h("i", { text: "STOP " + (i + 1) }), h("b", { text: s[1] }), h("span", { text: s[2] })])));
  sec.appendChild(g);
  sec.appendChild(card("M-edge", [h("h3", { text: "Short on time?" }), h("p", { text: "Stop 5 has a line for whatever a student just said to you. Stop 10 opens the Session room for your next one-on-one." })]));
  sec.appendChild(card("", [h("h3", { text: "This is the climb" }), h("p", { text: "The Mentor Mindset is how we take children from getting by to excellent, and it's where your daily practice goes. The Behavior Guide holds our policies for keeping every child safe, in school and getting along with others. That's table stakes. It keeps the valley livable; the Mentor Mindset is how children reach the peaks. The more consistently we practice what's here, the less the behavior policies should come up." }), h("a", { class: "chip", style: "align-self:flex-start", href: "/behavior/", text: "Open the Behavior Guide →" })]));
};

/* ---------------- trailhead ---------------- */
const QUAD = { E: ["Enforcer", "High standards, low support", "“I set the bar. Reaching it is your problem.”", "Gets compliance while you're watching. Costs trust, and the student learns that you think little of them."], M: ["Mentor", "High standards, high support", "“The bar is high, I know you can reach it, and I'm in it with you.”", "The student hears respect. Hard feedback lands as a compliment."], A: ["Apathetic", "Low standards, low support", "“Whatever.”", "Checked out. Rare among people who chose this work."], P: ["Protector", "Low standards, high support", "“This is too much for you. Let me take it off your plate.”", "Feels kind in the moment. The student hears that you doubt them, and loses the chance to find out they can." ] };
VIEWS.start = sec => {
  head(sec, "Start at the <span>trailhead</span>", "You became a guide to light kids up. Nobody signed up to nag, threaten or rescue. This is the practical side of David Yeager's 10 to 25: what to say so a middle schooler hears your high standard as respect.");
  const detail = h("div", { class: "card" }); let sel = "M";
  const quad = h("div", { class: "quad" });
  const draw = () => { quad.innerHTML = ""; [["High standards"], "E", "M", ["Low standards"], "A", "P"].forEach(k => Array.isArray(k) ? quad.appendChild(h("div", { class: "ylab", text: k[0] })) : quad.appendChild(h("button", { class: "q" + k, "aria-pressed": String(sel === k), onclick: () => { sel = k; draw(); } }, [h("b", { text: QUAD[k][0] }), h("span", { text: QUAD[k][1] })]))); detail.innerHTML = ""; detail.append(h("span", { class: "tag " + (sel === "A" ? "" : sel), text: QUAD[sel][0] }), h("p", { style: "font:700 20px/1.3 var(--display)", text: QUAD[sel][2] }), h("p", { class: "dim", text: QUAD[sel][3] })); };
  draw();
  sec.appendChild(card("", [h("h2", { text: "Four mindsets. Tap one." }), h("div", { class: "axis" }, [h("span", { text: "Low support" }), h("span", { text: "High support" })]), quad, detail, h("p", { class: "small", text: "Nobody lives in one box. Yeager says even great mentors drift into enforcer or protector under stress. Both come from caring, and both assume young people can't handle much." })]));
  sec.appendChild(h("div", { class: "grid g2" }, [
    card("", [h("h3", { text: "Why middle schoolers react the way they do" }), h("p", { text: "From about age 10, young people become intensely tuned to status and respect. They read between the lines of everything we say, hunting for one answer: does this adult think I'm capable?" }), h("p", { class: "dim", text: "A threat says “I don't respect you.” A rescue says “I don't think you can.” Either one shuts motivation down." })]),
    card("", [h("h3", { text: "The mentor's dilemma" }), h("p", { text: "You feel pulled between being honest about the work and keeping the relationship warm. Wise feedback does both in one breath:" }), h("div", { class: "say", text: "“I'm giving you these comments because I have very high expectations, and I know that you can reach them.”" }), h("p", { class: "small", text: "It only works when specific critique and real help follow. Repeated as a slogan, it goes hollow." })])
  ]));
  const anat = h("div", { class: "anat" });
  [["Why I'm speaking", "“I'm bringing this up because I think you're capable of more than this shows.”"], ["Ask first", "“Show me what you tried, so I can follow your thinking.”"], ["What's right", "“You set this part up correctly, and that was the tricky bit.”"], ["The gap", "One or two specifics about the work. Nothing about the person."], ["Their move", "“What's your plan? What would help?”"]].forEach(a => anat.appendChild(h("div", null, [h("b", { text: a[0] }), h("span", { text: a[1] })])));
  sec.appendChild(card("", [h("h2", { text: "Anatomy of a mentor response" }), anat]));
  sec.appendChild(card("M-edge", [h("h3", { text: "Three checks before you speak" }), h("div", { class: "steps" }, [h("div", null, [h("b", { text: "Standard" }), "Did I keep the real bar, out loud?"]), h("div", null, [h("b", { text: "Support" }), "Did I show belief and offer a concrete way to help?"]), h("div", null, [h("b", { text: "Autonomy" }), "Did I leave the thinking and the next choice with them?"])]), h("p", { class: "small", text: "Miss the first and you're protecting. Miss the second and you're enforcing. Miss the third and even good help feels like control. Autonomy as a third pillar is Wilderland's own addition to Yeager's two." })]));
};

/* ---------------- evidence ---------------- */
VIEWS.evidence = sec => {
  head(sec, "What the <span>studies</span> found", "The numbers behind the practices, with their limits. Each links to its source so you can check it.");
  const g = h("div", { class: "grid g2" });
  D.STATS.forEach(s => {
    const kids = [h("h3", { text: s.title }), h("div", { class: "big", text: s.big })];
    if (s.a) { const bar = (x, hi) => h("div", { class: "bar" + (hi ? " hi" : "") }, [h("span", { text: x[0] }), h("div", { class: "t" }, [h("i", { style: "width:" + (x[1] / s.max * 100) + "%" })]), h("b", { text: s.unit ? x[1] + s.unit : "" })]); kids.push(h("div", { class: "bars" }, [bar(s.a, false), bar(s.b, true)])); if (s.low) kids.push(h("p", { class: "small", text: "Lower is better here." })); }
    kids.push(h("p", { text: s.what }), h("p", { class: "small", text: s.note }), h("a", { class: "small", href: s.src[1], target: "_blank", rel: "noopener", text: "Source: " + s.src[0] }));
    g.appendChild(h("div", { class: "card stat" }, kids));
  });
  sec.appendChild(g);
  sec.appendChild(card("", [h("h3", { text: "Read these honestly" }), ul(["Most of these studies involved older students than ours, and several were small. They show direction more than exact size.", "The book covers ages 10 to 25. Applying it to younger students is a reasonable extension with less of the status sensitivity.", "The scripts on this site are our adaptations of the research. They have not been tested as scripts."])]));
};

/* ---------------- lookout ---------------- */
VIEWS.spot = sec => {
  head(sec, "The <span>lookout</span>", "Enforcer and protector moves rarely feel like mistakes from the inside. They feel like holding the line, or like kindness.");
  // sorter game
  const pool = []; D.PH.forEach(p => { pool.push([p[0], p[1]]); pool.push(["M", p[3]]); });
  const game = card("", []); let cur, streak = 0, best = local.get("fg-streak", 0);
  const next = () => { cur = pool[Math.floor(Math.random() * pool.length)]; game.innerHTML = ""; game.append(h("h2", { text: "Which mindset said it?" }), h("p", { style: "font:700 21px/1.3 var(--display);min-height:2.6em", text: cur[1] }), h("div", { class: "row" }, [["E", "Enforcer"], ["P", "Protector"], ["M", "Mentor"]].map(o => h("button", { class: "btn ghost", text: o[1], onclick: () => answer(o[0]) }))), h("p", { class: "small", text: "Streak " + streak + " · best " + best })); };
  const answer = k => { const right = k === cur[0]; streak = right ? streak + 1 : 0; if (streak > best) { best = streak; local.set("fg-streak", best); } const name = { E: "Enforcer", P: "Protector", M: "Mentor" }[cur[0]]; game.innerHTML = ""; game.append(h("span", { class: "tag " + cur[0], text: name }), h("p", { style: "font:700 21px/1.3 var(--display)", text: cur[1] }), h("p", { class: right ? "" : "dim", text: right ? "Yes." : "That one comes from " + name.toLowerCase() + "." }), h("div", { class: "row" }, [h("button", { class: "btn", text: "Next", onclick: next }), h("span", { class: "small", text: "Streak " + streak + " · best " + best })])); };
  next(); sec.appendChild(game);
  sec.appendChild(h("div", { class: "grid g2" }, [
    card("E-edge", [h("h3", { text: "Enforcer tells" }), ul(["You're talking more than the student.", "Your questions already have a right answer.", "You reach for a consequence before you understand the cause.", "You hear “need to,” “have to” or “should” three times running.", "Underneath: they won't do it unless I make them."])]),
    card("P-edge", [h("h3", { text: "Protector tells" }), ul(["You shrink the task so the feeling goes away.", "You do the hard part “to get them started.”", "You praise work you know missed the bar.", "You avoid naming the gap because the week has been rough.", "Underneath: this is too much for them."])])
  ]));
  let ctx = "acad"; const chips = h("div", { class: "chips" }), out = h("div", { class: "grid g3" });
  const draw = () => { chips.innerHTML = ""; D.CTX.forEach(c => chips.appendChild(h("button", { class: "chip", "aria-pressed": String(c.id === ctx), text: c.name, onclick: () => { ctx = c.id; draw(); } }))); const c = D.CTX.find(x => x.id === ctx); out.innerHTML = ""; [["E", "Enforcer looks like"], ["P", "Protector looks like"], ["M", "Mentor looks like"]].forEach(([k, t]) => out.appendChild(card(k + "-edge", [h("span", { class: "tag " + k, text: t }), ul(c[k])]))); };
  draw(); sec.append(h("h2", { text: "In the four places we work with students" }), chips, out);
  sec.appendChild(card("", [h("h3", { text: "Pitfalls nearly every adult falls into" }), ul(["The compulsion to tell. We see the fix and say it, and the student learns to wait for us.", "Grownsplaining. Explaining what they already know reads as “you think I'm clueless.”", "The compliment sandwich. Kids hear the “but,” discount the praise, and still feel judged.", "Comforting a fixed mindset. “Not everyone is a math person” tells them to stop trying.", "Differentiating the standard. Change the route and the support. Keep the bar.", "Public correction. In front of peers it is a status event first and feedback second.", "Flip-flopping. Protect all week, then enforce when patience runs out.", "Telling them they belong. Belonging comes from contributing and being seen doing it."])]));
};

/* ---------------- phrasebook ---------------- */
VIEWS.phrases = sec => {
  head(sec, "The <span>phrasebook</span>", "Things adults say to young people. Tap a card to turn it over and see the mentor version.");
  let f = "all"; const q = h("input", { type: "search", id: "phq", placeholder: "Search: lazy, easy, good job, calm down", oninput: () => draw() }), chips = h("div", { class: "chips" }), out = h("div", { class: "grid g3" }), count = h("p", { class: "small" });
  const draw = () => { chips.innerHTML = ""; [["all", "All"], ["E", "From enforcer"], ["P", "From protector"]].forEach(([k, t]) => chips.appendChild(h("button", { class: "chip", "aria-pressed": String(f === k), text: t, onclick: () => { f = k; draw(); } }))); const s = q.value.trim().toLowerCase(); out.innerHTML = ""; let n = 0; D.PH.forEach(p => { if (f !== "all" && p[0] !== f) return; if (s && !(p[1] + p[2] + p[3]).toLowerCase().includes(s)) return; n++; const b = h("button", { class: "flip " + p[0], "aria-label": "Phrase card" }); const face = on => { b.classList.toggle("on", on); b.innerHTML = ""; b.appendChild(h("div", { class: "f" }, on ? [h("span", { class: "tag M", text: "Mentor says" }), h("div", { class: "q", text: p[3] }), h("div", { class: "small", text: "Why the other one backfires: " + p[2] })] : [h("span", { class: "tag " + p[0], text: p[0] === "E" ? "Enforcer" : "Protector" }), h("div", { class: "q", text: p[1] }), h("div", { class: "hint", text: "Tap to turn over" })])); }; let on = false; b.onclick = () => { on = !on; face(on); }; face(false); out.appendChild(b); }); count.textContent = n + " of " + D.PH.length + " phrases"; };
  sec.append(card("", [h("label", { for: "phq" }, ["Find a phrase you catch yourself using", q]), chips, count]), out); draw();
  sec.appendChild(card("M-edge", [h("h3", { text: "Small swaps that carry a lot" }), h("div", { class: "scroll", html: "<table><tr><th>Swap this</th><th>For this</th></tr>" + [["You need to / you should", "You might consider / one option is"], ["Why did you…?", "Help me understand what you needed"], ["But", "And"], ["You can't do it", "You can't do it yet"], ["Good job", "Name the specific thing they did"], ["Here's what to do", "What have you tried? What's your plan?"], ["When you grow up", "When you're leading teams someday"]].map(r => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>").join("") + "</table>" })]));
};

/* ---------------- trail moments ---------------- */
VIEWS.moments = sec => {
  head(sec, "<span>Trail</span> moments", "A line for the thing a student just said, and moves for the pattern you keep seeing.");
  sec.appendChild(h("h2", { text: "When a student says…" }));
  const g = h("div", { class: "grid g2" });
  D.QUICK.forEach(q => g.appendChild(card("", [h("div", { class: "chat" }, [h("div", { class: "bub s" }, [h("small", { text: "Student" }), q[0]]), h("div", { class: "bub g" }, [h("small", { text: "You" }), q[2]])]), h("p", { class: "small", text: "Possibly underneath: " + q[1] }), h("p", { class: "small", text: "Skip: " + q[3] })])));
  sec.appendChild(g);
  sec.appendChild(h("h2", { text: "When a student is…" }));
  const g2 = h("div", { class: "grid g2" });
  D.SCEN.forEach(s => g2.appendChild(h("details", { class: "card" }, [h("summary", { text: s[0] }), h("p", { class: "small", text: s[1] }), ul(s[2])])));
  sec.appendChild(g2);
  sec.appendChild(card("M-edge", [h("h2", { text: "Mid-meltdown: six meaning questions" }), h("p", { class: "dim", text: "Many blowups run on a misreading of what just happened. Ask slowly. Accept every answer." }), h("div", { class: "steps" }, ["What does this mean to you?", "How is that meaning making you feel?", "Is that serving your goals?", "What's something else it could mean?", "How would you feel if you thought that?", "Would that serve your goals?"].map(t => h("div", { text: t }))), h("p", { class: "small", text: "If a student mentions hurting themselves or someone else, or describes being harmed, stop coaching and follow our Mental Health Crisis Policy." })]));
};

/* ---------------- rough terrain ---------------- */
VIEWS.trust = sec => {
  head(sec, "<span>Rough</span> terrain", "Some students arrive sure that adults will either control them or give up on them. They test which one you are. The research offers real hope: wise feedback helped most among students who trusted school least.");
  sec.appendChild(card("M-edge", [h("h3", { text: "Start from this reading" }), h("p", { text: "Disengagement is usually protection. A student who refuses can't fail. Ask whether this is a can't wearing the costume of a won't, then act as if their distrust is reasonable given what they've lived. It often is." })]));
  const g = h("div", { class: "grid g2" }); D.TRUST.forEach(t => g.appendChild(card("", [h("h3", { text: t[0] }), h("p", { class: "dim", text: t[1] })]))); sec.appendChild(g);
  sec.appendChild(card("", [h("h2", { text: "A first two weeks" }), h("div", { class: "steps" }, [["Days 1 to 3", "No agenda. Two minutes a day about anything they care about. Remember one detail and bring it up tomorrow."], ["Day 4", "A private transparency statement: you'll keep expecting a lot, here's why, and they should tell you when you get it wrong."], ["Week 1", "One real question, such as the worst part of their day here. Change one thing because of the answer and tell them."], ["Week 2", "One earned win in public. A real competence, given a real job in front of peers."], ["Throughout", "Keep the bar. Dropping it confirms you've written them off."]].map(s => h("div", null, [h("b", { text: s[0] }), s[1]])))]));
  sec.appendChild(h("div", { class: "grid g2" }, [card("E-edge", [h("h3", { text: "What re-breaks trust" }), ul(["Promising follow-up and forgetting.", "Bringing up last month's behavior today.", "Correcting them in front of peers.", "Asking for their view, then doing what you planned anyway.", "Warmth that switches off when they push back."])]), card("", [h("h3", { text: "When it's beyond this guide" }), h("p", { class: "dim", text: "These moves are for motivation and trust. For trauma, safety concerns or a mental health crisis, follow the Mental Health Crisis Policy. For serious lasting patterns, move to Collaborative and Proactive Solutions and bring in leadership." })])]));
};

/* ---------------- campfire stories ---------------- */
VIEWS.stories = async sec => {
  head(sec, "Around the <span>campfire</span>", "Places the mentor mindset worked, from the book, the research, and our own school.");
  let f = "all"; const chips = h("div", { class: "chips" }), out = h("div", { class: "grid g2" });
  const kinds = [["all", "All"], ["class", "Classrooms"], ["research", "Studies"], ["work", "Work and sport"], ["home", "Home"]];
  const draw = () => { chips.innerHTML = ""; kinds.forEach(([k, t]) => chips.appendChild(h("button", { class: "chip", "aria-pressed": String(f === k), text: t, onclick: () => { f = k; draw(); } }))); out.innerHTML = ""; D.STORIES.filter(s => f === "all" || s.kind === f).forEach(s => out.appendChild(card("", [h("div", { class: "row" }, s.tags.map(t => h("span", { class: "tag M", text: t }))), h("h3", { text: s.title }), h("p", { class: "small", text: s.who + " · " + s.where }), h("p", { text: s.body }), h("div", { class: "say", text: s.take }), h("a", { class: "small", href: s.src[1], target: "_blank", rel: "noopener", text: "Source: " + s.src[0] })]))); };
  draw(); sec.append(chips, out);
  sec.appendChild(h("h2", { html: "<span>Wilderland</span> stories" }));
  const mine = h("div", { class: "grid g2" }); sec.appendChild(mine);
  const load = async () => { mine.innerHTML = ""; try { const snap = await getDocs(query(collection(db, "mentorStories"), orderBy("created", "desc"), limit(60))); if (snap.empty) mine.appendChild(h("p", { class: "dim", text: "None yet. The first one could be yours, including a do-over that went better the second time." })); snap.forEach(d => { const s = d.data(); const c = card("M-edge", [h("h3", { text: s.title }), h("p", { class: "small", text: "Shared by " + (s.name || "a guide") }), h("p", { text: s.body }), s.said ? h("div", { class: "say", text: s.said }) : null]); if (s.by === user.uid || isAdmin) c.appendChild(h("button", { class: "chip", text: "Remove", onclick: async () => { await deleteDoc(doc(db, "mentorStories", d.id)); load(); } })); mine.appendChild(c); }); } catch (e) { mine.appendChild(h("p", { class: "dim", text: "Wilderland stories will appear here once the database rules are updated." })); } };
  load();
  const t = h("input", { type: "text", id: "stT", maxlength: 90 }), b = h("textarea", { id: "stB", maxlength: 1200 }), s = h("input", { type: "text", id: "stS", maxlength: 300 }), note = h("span", { class: "small" });
  sec.appendChild(card("", [h("h3", { text: "Add a story" }), h("p", { class: "small", text: "All staff can read these. Use a first name or initial for the student, or none." }), h("label", { for: "stT" }, ["Title", t]), h("label", { for: "stB" }, ["What happened, and what changed?", b]), h("label", { for: "stS" }, ["The line you said (optional)", s]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Share with staff", onclick: async () => { if (t.value.trim().length < 4 || b.value.trim().length < 30) { note.textContent = "Add a title and a few sentences."; return; } try { await addDoc(collection(db, "mentorStories"), { title: t.value.trim(), body: b.value.trim(), said: s.value.trim(), by: user.uid, name: (user.displayName || "").split(" ")[0] || "A guide", created: Date.now() }); t.value = b.value = s.value = ""; note.textContent = "Shared."; load(); } catch (e) { note.textContent = "Couldn't save. The database rules may need updating."; } } }), note])]));
};

/* ---------------- practice range ---------------- */
VIEWS.practice = sec => {
  head(sec, "The <span>practice</span> range", "Reading changes very little. Saying the words does. Pick a situation, write what you'd say out loud, get scored on the three checks, then take a do-over.");
  let cur = D.TRAIN[0]; const sel = h("select", { id: "scSel" }, D.TRAIN.map(t => h("option", { value: t.id, text: t.ctx + ": " + t.title }))), body = h("div"), resp = h("textarea", { id: "resp", placeholder: "Type what you would say to the student…" }), result = h("div"), reps = h("div");
  const show = () => { body.innerHTML = ""; body.append(h("p", { text: cur.setup }), h("div", { class: "chat", style: "margin-top:10px" }, [h("div", { class: "bub s" }, [h("small", { text: "Student" }), cur.line])])); result.innerHTML = ""; resp.value = ""; };
  sel.onchange = () => { cur = D.TRAIN.find(t => t.id === sel.value); show(); };
  const model = () => card("M-edge", [h("span", { class: "tag M", text: "One mentor response" }), h("p", { text: cur.model }), h("p", { class: "small", text: "One possibility among many. Your own words will sound more like you." })]);
  const log = score => { const r = local.get("fg-reps", {}); const x = r[cur.id] || { n: 0, best: null }; x.n++; if (score !== null && (x.best === null || score > x.best)) x.best = score; r[cur.id] = x; local.set("fg-reps", r); drawReps(); };
  const drawReps = () => { const r = local.get("fg-reps", {}); let n = 0, k = 0; D.TRAIN.forEach(t => { if (r[t.id]) { n += r[t.id].n; k++; } }); reps.innerHTML = ""; reps.append(h("p", { text: n + " reps across " + k + " of " + D.TRAIN.length + " situations." }), ul(D.TRAIN.filter(t => r[t.id]).map(t => t.title + ": " + r[t.id].n + (r[t.id].best !== null ? ", best " + r[t.id].best + "/12" : "")))); };
  const scoreBtn = h("button", { class: "btn", text: "Score my response", onclick: async () => {
    const text = resp.value.trim(); result.innerHTML = ""; if (text.length < 15) { result.appendChild(card("", [h("p", { text: "Write what you would say first. A sentence or two is enough." })])); return; }
    scoreBtn.disabled = true; scoreBtn.textContent = "Scoring…";
    try { const d = parseJSON(await ai([{ role: "user", content: "Setting: " + cur.ctx + "\nSituation: " + cur.setup + "\nStudent says: " + cur.line + "\n\nGuide's response:\n" + text }], { system: D.RUBRIC, max: 700 })); const s = clamp4(d.standards), u = clamp4(d.support), a = clamp4(d.autonomy), tot = s + u + a, mind = String(d.mindset || "mixed").toLowerCase(), tg = { mentor: "M", enforcer: "E", protector: "P" }[mind] || "";
      const c = card("", [h("div", { class: "row" }, [h("span", { class: "total", text: tot + "/12" }), h("span", { class: "tag " + tg, text: "Reads as " + mind }), h("b", { text: tot >= 10 ? "Mentor-aligned" : tot >= 7 ? "Getting there" : "Worth a do-over" })]), meter("Standards", s), meter("Support", u), meter("Autonomy", a)]);
      if (Array.isArray(d.worked) && d.worked.length) c.append(h("h3", { text: "What worked" }), ul(d.worked.map(String)));
      if (d.upgrade) c.append(h("h3", { text: "One upgrade" }), h("p", { text: String(d.upgrade) }));
      if (d.rewrite) c.append(h("h3", { text: "Your response, tuned" }), h("div", { class: "say", text: String(d.rewrite) }));
      c.appendChild(h("p", { class: "small", text: "A second opinion from Claude against our rubric. Edit your response and score again for a do-over." })); result.appendChild(c); log(tot);
    } catch (e) { result.appendChild(card("", [h("p", { text: e.message === "format" ? "The score came back unreadable. Try again." : aiErr(e) })])); }
    scoreBtn.disabled = false; scoreBtn.textContent = "Score my response";
  } });
  sec.appendChild(card("", [h("label", { for: "scSel" }, ["Situation", sel]), body, h("label", { for: "resp" }, ["What do you say first? Write the actual words.", resp]), h("div", { class: "row" }, [scoreBtn, h("button", { class: "btn ghost", text: "Self-check", onclick: () => { result.innerHTML = ""; result.append(card("", [h("h3", { text: "Self-check" }), ul(["Standard: did I name or keep the real bar?", "Support: did I show belief and offer a concrete way forward, with no shame or labels?", "Autonomy: did I ask a question I don't know the answer to, and leave the next move with the student?", "Did I say “need to,” “have to” or “should”? Did I say “but” where “and” would work?"])]), model()); log(null); } }), h("button", { class: "btn ghost", text: "Show a mentor response", onclick: () => { result.innerHTML = ""; result.appendChild(model()); } })])]));
  sec.append(result, card("", [h("h3", { text: "Your reps" }), h("p", { class: "small", text: "Kept in this browser only. Nobody else can see your attempts or scores." }), reps]));
  show(); drawReps();
};

/* ---------------- coach's tent ---------------- */
VIEWS.coach = sec => {
  head(sec, "The <span>coach's</span> tent", "Describe a real situation. The coach answers with possible reads, exact lines to try, and where the enforcer or protector pull is likely to be.");
  sec.appendChild(card("P-edge", [h("p", { class: "small", text: "Use a first name or initial only. Leave out diagnoses and family details. The coach can be wrong, doesn't know the child, and doesn't replace our policies. Safety concerns go to leadership and the Mental Health Crisis Policy." })]));
  let convo = [], busy = false; const age = h("select", { id: "cAge" }, ["Grades 5 to 8", "Grades 2 to 4", "K to 1"].map(t => h("option", { text: t }))), ctx = h("select", { id: "cCtx" }, ["Academic coaching or app block", "Behavior problem solving", "Project mentoring", "Life Skills Lab", "Other"].map(t => h("option", { text: t }))), what = h("textarea", { id: "cWhat", placeholder: "Example: J. has done almost no Math Academy for two weeks. When I check in he says he doesn't care and puts his head down." }), tried = h("input", { type: "text", id: "cTried" }), note = h("span", { class: "small" }), thread = h("div", { class: "thread" }), more = h("input", { type: "text", id: "cMore", placeholder: "He said “whatever.” What now?" }), follow = card("", []); follow.hidden = true;
  const ask = async (text, shown) => { if (busy) return; busy = true; thread.appendChild(h("div", { class: "msg u", text: shown })); convo.push({ role: "user", content: text }); const out = h("div", { class: "msg a", text: "Thinking…" }); thread.appendChild(out); try { const t = await ai(convo, { system: D.COACH, max: 900 }); out.textContent = t; convo.push({ role: "assistant", content: t }); follow.hidden = false; } catch (e) { convo.pop(); out.textContent = aiErr(e); } busy = false; };
  follow.append(h("label", { for: "cMore" }, ["Follow up", more]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Send", onclick: () => { const t = more.value.trim(); if (t) { more.value = ""; ask(t, t); } } }), h("button", { class: "btn ghost", text: "Start a new situation", onclick: () => { convo = []; thread.innerHTML = ""; follow.hidden = true; what.value = tried.value = ""; } })]));
  sec.append(card("", [h("div", { class: "grid g2" }, [h("label", { for: "cAge" }, ["Age band", age]), h("label", { for: "cCtx" }, ["Setting", ctx])]), h("label", { for: "cWhat" }, ["What's happening?", what]), h("label", { for: "cTried" }, ["What have you tried, and how did it land? (optional)", tried]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Get suggestions", onclick: () => { if (what.value.trim().length < 20) { note.textContent = "Add a little more about what's happening."; return; } note.textContent = ""; const d = "Age band: " + age.value + "\nSetting: " + ctx.value + "\nWhat's happening: " + what.value.trim() + (tried.value.trim() ? "\nWhat I've tried: " + tried.value.trim() : ""); convo = []; thread.innerHTML = ""; ask(d, d); } }), note])]), thread, follow);
};

/* ---------------- session room ---------------- */
const live = { on: false };
let sess = { screen: "list", student: null, session: null, students: null, sessions: null };
const kidsCol = () => collection(db, "mentor", user.uid, "students"), sessCol = () => collection(db, "mentor", user.uid, "sessions");
async function loadSess() { const a = await getDocs(kidsCol()), b = await getDocs(query(sessCol(), orderBy("at", "desc"), limit(300))); sess.students = []; a.forEach(d => sess.students.push({ id: d.id, ...d.data() })); sess.students.sort((x, y) => x.name.localeCompare(y.name)); sess.sessions = []; b.forEach(d => sess.sessions.push({ id: d.id, ...d.data() })); }
const fmtDate = ms => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const clock = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
const go = (screen, extra) => { Object.assign(sess, { screen }, extra || {}); route(); };

VIEWS.sessions = async sec => {
  if (sess.students === null) { head(sec, "The <span>session</span> room"); const p = h("p", { class: "dim", text: "Opening your notebook…" }); sec.appendChild(p); try { await loadSess(); } catch (e) { p.textContent = "Your session notebook isn't available yet. The database rules need updating first (see Admin)."; return; } sec.innerHTML = ""; }
  ({ list: sessList, student: sessStudent, live: sessLive, review: sessReview, view: sessView })[sess.screen](sec);
};
function sessList(sec) {
  head(sec, "The <span>session</span> room", "Record a one-on-one, get a summary of what was discussed, and walk into the next one knowing where you left off.");
  sec.appendChild(card("P-edge", [h("p", { class: "small", text: "Private to you. No other guide or admin can open your students, transcripts or feedback from this site. Audio is never saved, only text. (The school's Firebase project owner has technical access to the database, as with all school data.)" })]));
  const g = h("div", { class: "grid g3" });
  sess.students.forEach(k => { const n = sess.sessions.filter(s => s.studentId === k.id); g.appendChild(h("button", { class: "kid", onclick: () => go("student", { student: k }) }, [h("b", { text: k.name }), h("span", { class: "small", text: k.band || "" }), h("span", { class: "small" }, [h("span", { class: "dot" + (k.consent ? " ok" : "") }), k.consent ? "Recording consent on file" : "No recording consent yet"]), h("span", { class: "small", text: n.length ? n.length + " sessions · last " + fmtDate(n[0].at) : "No sessions yet" })])); });
  if (!sess.students.length) g.appendChild(h("p", { class: "dim", text: "Add the students you coach to begin." }));
  sec.appendChild(g);
  const name = h("input", { type: "text", id: "kName", maxlength: 30, placeholder: "First name or initial" }), band = h("select", { id: "kBand" }, ["Grades 5 to 8", "Grades 2 to 4", "K to 1"].map(t => h("option", { text: t })));
  sec.appendChild(card("", [h("h3", { text: "Add a student" }), h("div", { class: "grid g2" }, [h("label", { for: "kName" }, ["Name", name]), h("label", { for: "kBand" }, ["Band", band])]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Add", onclick: async () => { const n = name.value.trim(); if (!n) return; const d = { name: n, band: band.value, consent: false, created: Date.now() }; const ref = await addDoc(kidsCol(), d); sess.students.push({ id: ref.id, ...d }); sess.students.sort((x, y) => x.name.localeCompare(y.name)); route(); } })])]));
}
function sessStudent(sec) {
  const k = sess.student, mine = sess.sessions.filter(s => s.studentId === k.id);
  sec.appendChild(h("button", { class: "chip", text: "← All students", onclick: () => go("list") }));
  head(sec, esc(k.name), k.band);
  const last = mine.find(s => s.analysis);
  if (last) { const a = last.analysis; sec.appendChild(card("M-edge", [h("h2", { text: "Before you sit down" }), h("p", { class: "small", text: "From your session on " + fmtDate(last.at) }), a.commitments && a.commitments.length ? h("div", null, [h("h3", { text: k.name + " said they would" }), ul(a.commitments.map(String))]) : null, a.nextTime && a.nextTime.length ? h("div", null, [h("h3", { text: "For you to do or ask" }), ul(a.nextTime.map(String))]) : null, a.oneThing ? h("div", { class: "say", text: "Your one thing: " + a.oneThing }) : null])); }
  const cb = h("input", { type: "checkbox", id: "kc", checked: k.consent ? "" : null });
  cb.onchange = async () => { k.consent = cb.checked; k.consentAt = cb.checked ? Date.now() : null; await updateDoc(doc(kidsCol(), k.id), { consent: k.consent, consentAt: k.consentAt }); route(); };
  sec.appendChild(card("", [h("h3", { text: "Recording consent" }), h("label", { class: "check", for: "kc" }, [cb, h("span", { text: "A parent or guardian has given written consent for " + k.name + "'s coaching sessions to be recorded as text and reviewed with AI, and it is on file with the school." })]), h("p", { class: "small", text: k.consent ? "Marked on " + fmtDate(k.consentAt || Date.now()) + ". Unticking stops new recordings." : "Until this is ticked, you can still log a session from your own spoken recap or typed notes." })]));
  sec.appendChild(h("div", { class: "row" }, [h("button", { class: "btn", text: "Start a session", onclick: () => go("live") })]));
  sec.appendChild(h("h2", { text: "Sessions" }));
  if (!mine.length) sec.appendChild(h("p", { class: "dim", text: "None yet." }));
  mine.forEach(s => sec.appendChild(h("button", { class: "kid", onclick: () => go("view", { session: s }) }, [h("b", { style: "font-size:17px", text: fmtDate(s.at) + " · " + (s.mins || 0) + " min · " + ({ talk: "Recorded", recap: "Spoken recap", notes: "Typed notes" }[s.mode] || "") }), h("span", { class: "small", text: s.analysis ? s.analysis.summary : "Saved without AI review" })])));
  sec.appendChild(h("button", { class: "chip", style: "align-self:flex-start;margin-top:20px", text: "Remove " + k.name + " and all their sessions", onclick: async e => { if (e.target.dataset.sure !== "1") { e.target.dataset.sure = "1"; e.target.textContent = "Tap again to delete everything for " + k.name; return; } for (const s of mine) await deleteDoc(doc(sessCol(), s.id)); await deleteDoc(doc(kidsCol(), k.id)); sess.students = sess.students.filter(x => x.id !== k.id); sess.sessions = sess.sessions.filter(x => x.studentId !== k.id); go("list"); } }));
}
function sessLive(sec) {
  const k = sess.student, SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let mode = k.consent && SR ? "talk" : SR ? "recap" : "notes", rec = null, lines = [], secs = 0, timer = null, recording = false, lastNudge = "";
  const nudges = D.NUDGES.map(n => [new RegExp(n[0], "i"), n[1], n[2]]);
  sec.appendChild(h("button", { class: "chip", text: "← Back to " + k.name, onclick: () => { if (recording) return; live.on = false; go("student"); } }));
  head(sec, "Session with " + esc(k.name));
  const modeChips = h("div", { class: "chips" }), gateBox = h("div"), okBox = h("input", { type: "checkbox", id: "okb" }), btn = h("button", { class: "recbtn", text: "Record" }), time = h("div", { class: "clock", text: "00:00" }), liveBox = h("div", { class: "live", "aria-live": "off" }), notes = h("textarea", { id: "snotes", placeholder: "Anything you want to remember that the transcript won't catch." }), status = h("p", { class: "small" }), tipOut = h("div"), nudgeOut = h("div");
  const drawMode = () => { modeChips.innerHTML = ""; [["talk", "Record the conversation"], ["recap", "Speak a recap afterward"], ["notes", "Type notes only"]].forEach(([m, t]) => modeChips.appendChild(h("button", { class: "chip", "aria-pressed": String(mode === m), text: t, onclick: () => { if (recording) return; mode = m; drawMode(); } })));
    gateBox.innerHTML = ""; let can = true;
    if (mode === "talk") { if (!SR) { can = false; gateBox.appendChild(h("p", { class: "nope", text: "This browser can't transcribe speech. Open the site in Chrome, or use typed notes." })); } else if (!k.consent) { can = false; gateBox.appendChild(h("p", { class: "nope", text: "Recording is locked for " + k.name + " until parent consent is marked on their page. You can speak a recap afterward or type notes." })); } else { gateBox.append(h("div", { class: "say", text: "Say something like: “I'd like to record this as text so I can get better at coaching you. It's for me to learn from. It's fine to say no.”" }), h("label", { class: "check", for: "okb", style: "margin-top:10px" }, [okBox, h("span", { text: k.name + " knows I'm recording and said it's okay." })])); can = okBox.checked; } }
    if (mode === "recap") { if (!SR) { can = false; gateBox.appendChild(h("p", { class: "nope", text: "This browser can't transcribe speech. Open the site in Chrome, or type your recap below." })); } else gateBox.appendChild(h("p", { class: "dim", text: "After the session, on your own, talk through what happened for a minute or two: what you discussed, what they committed to, where you got stuck." })); }
    if (mode === "notes") { can = false; gateBox.appendChild(h("p", { class: "dim", text: "Type what happened below, then finish." })); }
    btn.disabled = !can && !recording; btn.style.display = mode === "notes" ? "none" : ""; time.style.display = liveBox.style.display = mode === "notes" ? "none" : ""; };
  okBox.onchange = drawMode;
  const drawLive = interim => { liveBox.textContent = lines.slice(-8).map(l => l.x).join("\n"); if (interim) liveBox.appendChild(h("em", { text: (lines.length ? "\n" : "") + interim })); liveBox.scrollTop = liveBox.scrollHeight; };
  const addLine = x => { if (!x) return; lines.push({ t: secs, x }); if (mode === "talk") for (const n of nudges) if (n[0].test(x) && lastNudge !== n[1]) { lastNudge = n[1]; nudgeOut.innerHTML = ""; nudgeOut.appendChild(h("div", { class: "nudge" }, [h("b", { text: "Heard " + n[1] + ". " }), n[2]])); break; } };
  const start = () => { rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = e => { let interim = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) addLine(r[0].transcript.trim()); else interim += r[0].transcript; } drawLive(interim); };
    rec.onerror = e => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { status.textContent = "The microphone is blocked. Allow it in the address bar, then press Record again."; stop(); } else if (e.error === "network") status.textContent = "Transcription lost its connection. It will keep trying."; };
    rec.onend = () => { if (recording) setTimeout(() => { if (recording) try { rec.start(); } catch (err) { } }, 250); };
    try { rec.start(); } catch (err) { status.textContent = "Couldn't start the microphone."; return; }
    recording = true; live.on = true; btn.classList.add("on"); btn.textContent = "Pause"; status.textContent = "Listening. Audio is turned into text by Chrome's speech service and is not saved."; timer = setInterval(() => { secs++; time.textContent = clock(secs); }, 1000); drawMode(); };
  const stop = () => { recording = false; clearInterval(timer); btn.classList.remove("on"); btn.textContent = lines.length ? "Resume" : "Record"; try { rec && rec.stop(); } catch (err) { } };
  btn.onclick = () => recording ? (stop(), status.textContent = "Paused.") : start();
  sec.append(card("", [modeChips, gateBox, h("div", { class: "rec" }, [btn, time]), liveBox, status, h("label", { for: "snotes" }, ["Your notes", notes])]));
  // tip dock
  const stuck = h("div", { class: "chips" }), stuckOut = h("div");
  D.STUCK.forEach(s => stuck.appendChild(h("button", { class: "chip", text: s[0], onclick: () => { stuckOut.innerHTML = ""; stuckOut.appendChild(ul(s[1])); } })));
  const tipBtn = h("button", { class: "btn ghost", text: "Suggest my next line", onclick: async () => { const recent = lines.map(l => l.x).join("\n").slice(-1800); if (recent.length < 80) { tipOut.textContent = "Keep going a little longer first."; return; } tipBtn.disabled = true; tipOut.textContent = "Thinking…"; try { tipOut.textContent = ""; tipOut.appendChild(h("div", { class: "say", style: "white-space:pre-wrap", text: await ai([{ role: "user", content: "Student age band: " + (k.band || "") + "\n\nTranscript so far:\n" + recent }], { system: D.TIP_PROMPT, tier: "quick", max: 120 }) })); } catch (e) { tipOut.textContent = aiErr(e); } tipBtn.disabled = false; } });
  sec.appendChild(h("div", { class: "tipdock" }, [h("b", { text: "Stuck? Tap one." }), stuck, stuckOut, nudgeOut, h("div", { class: "row" }, [tipBtn]), tipOut]));
  sec.appendChild(h("div", { class: "row" }, [h("button", { class: "btn", text: "Finish session", onclick: () => { if (recording) stop(); live.on = false; const text = lines.map(l => "[" + clock(l.t) + "] " + l.x).join("\n"); if (!text && !notes.value.trim()) { status.textContent = "Nothing to save yet."; return; } go("review", { session: { studentId: k.id, studentName: k.name, at: Date.now(), mins: Math.max(1, Math.round(secs / 60)), mode, transcript: text, notes: notes.value.trim() } }); } }), h("button", { class: "btn ghost", text: "Discard", onclick: () => { if (recording) stop(); live.on = false; go("student"); } })]));
  drawMode();
}
function sessReview(sec) {
  const s = sess.session, k = sess.student;
  head(sec, "Wrap up with " + esc(k.name), "Fix anything the transcript got wrong, then save. Nothing has been stored yet.");
  const tr = h("textarea", { id: "rtr", style: "min-height:220px" }), nt = h("textarea", { id: "rnt" }), status = h("p", { class: "small" }); tr.value = s.transcript; nt.value = s.notes;
  const save = async withAI => { s.transcript = tr.value.trim().slice(0, 60000); s.notes = nt.value.trim().slice(0, 8000); status.textContent = withAI ? "Reviewing the session…" : "Saving…"; btnA.disabled = btnB.disabled = true;
    if (withAI) { try { const prev = sess.sessions.find(x => x.studentId === k.id && x.analysis); s.analysis = parseJSON(await ai([{ role: "user", content: "Student age band: " + (k.band || "") + "\nSession type: " + ({ talk: "live conversation transcript", recap: "the guide's spoken recap after the session", notes: "the guide's typed notes" }[s.mode]) + (prev ? "\nLast session's plan: " + (prev.analysis.nextTime || []).join("; ") : "") + "\n\nTranscript:\n" + (s.transcript || "(none)") + "\n\nGuide's own notes:\n" + (s.notes || "(none)") }], { system: D.SESSION_PROMPT, max: 1400 })); } catch (e) { status.textContent = (e.message === "format" ? "The review came back unreadable." : aiErr(e)) + " You can save without it and review later."; btnA.disabled = btnB.disabled = false; return; } }
    try { const ref = await addDoc(sessCol(), s); sess.sessions.unshift({ id: ref.id, ...s }); go("view", { session: sess.sessions[0] }); } catch (e) { status.textContent = "Couldn't save. Check your connection and try again."; btnA.disabled = btnB.disabled = false; } };
  const btnA = h("button", { class: "btn", text: "Save and get feedback", onclick: () => save(true) }), btnB = h("button", { class: "btn ghost", text: "Save without AI", onclick: () => save(false) });
  sec.append(card("", [h("label", { for: "rtr" }, ["Transcript (" + (s.mins || 0) + " min)", tr]), h("label", { for: "rnt" }, ["Your notes", nt]), h("p", { class: "small", text: "The transcript has no speaker labels and will contain mistakes. The feedback is only as good as this text." }), h("div", { class: "row" }, [btnA, btnB, h("button", { class: "btn ghost", text: "Discard", onclick: () => go("student") })]), status]));
}
function sessView(sec) {
  const s = sess.session, k = sess.students.find(x => x.id === s.studentId) || sess.student, a = s.analysis;
  sec.appendChild(h("button", { class: "chip", text: "← Back to " + (k ? k.name : "students"), onclick: () => k ? go("student", { student: k }) : go("list") }));
  head(sec, esc(s.studentName) + " · " + fmtDate(s.at));
  if (a) {
    if (a.safety) sec.appendChild(card("E-edge", [h("h3", { text: "Please read first" }), h("p", { text: String(a.safety) })]));
    sec.appendChild(card("", [h("h2", { text: "What happened" }), h("p", { text: String(a.summary || "") }), a.discussed && a.discussed.length ? h("div", null, [h("h3", { text: "Discussed" }), ul(a.discussed.map(String))]) : null, a.commitments && a.commitments.length ? h("div", null, [h("h3", { text: s.studentName + " said they would" }), ul(a.commitments.map(String))]) : null]));
    sec.appendChild(card("M-edge", [h("h2", { text: "For next time" }), ul((a.nextTime || []).map(String))]));
    const sc = [clamp4(a.standards), clamp4(a.support), clamp4(a.autonomy)];
    const fb2 = card("", [h("h2", { text: "Your coaching" }), meter("Standards", sc[0]), meter("Support", sc[1]), meter("Autonomy", sc[2])]);
    if (typeof a.talk === "number") fb2.appendChild(h("p", { class: "small", text: "Rough guess at your share of the talking: " + Math.round(a.talk) + "%." }));
    if (a.strength) fb2.append(h("h3", { text: "What worked" }), h("p", { text: String(a.strength) }));
    (a.moments || []).forEach(m => fb2.appendChild(h("div", { class: "card", style: "background:var(--shelf2)" }, [h("p", { style: "font-weight:600", text: "“" + String(m.quote || "").replace(/^["“]|["”]$/g, "") + "”" }), h("p", { class: "dim", text: String(m.read || "") }), m.tryThis ? h("div", { class: "say", text: String(m.tryThis) }) : null])));
    if (a.oneThing) fb2.append(h("h3", { text: "One thing for next session" }), h("div", { class: "say", text: String(a.oneThing) }));
    fb2.appendChild(h("p", { class: "small", text: "Claude's read of an imperfect transcript (confidence: " + (a.confidence || "unknown") + "). You were in the room. Trust your own judgment over this where they disagree." }));
    sec.appendChild(fb2);
  } else sec.appendChild(card("", [h("p", { class: "dim", text: "Saved without an AI review." })]));
  sec.appendChild(h("details", { class: "card" }, [h("summary", { text: "Transcript and notes" }), h("p", { style: "white-space:pre-wrap;font-size:14.5px", text: s.transcript || "(no transcript)" }), s.notes ? h("p", { style: "white-space:pre-wrap", text: "Notes: " + s.notes }) : null]));
  sec.appendChild(h("button", { class: "chip", style: "align-self:flex-start", text: "Delete this session", onclick: async e => { if (e.target.dataset.sure !== "1") { e.target.dataset.sure = "1"; e.target.textContent = "Tap again to delete"; return; } await deleteDoc(doc(sessCol(), s.id)); sess.sessions = sess.sessions.filter(x => x.id !== s.id); k ? go("student", { student: k }) : go("list"); } }));
}
addEventListener("beforeunload", e => { if (live.on) { e.preventDefault(); e.returnValue = ""; } });

/* ---------------- pack list (habits) ---------------- */
VIEWS.habits = sec => {
  head(sec, "The <span>pack</span> list", "We're learning a new professional skill together, on the same three pillars we use with students.");
  sec.appendChild(h("div", { class: "grid g3" }, [card("M-edge", [h("h3", { text: "High standard" }), h("p", { class: "dim", text: "Every guide uses mentor responses consistently, including on hard days with hard kids." })]), card("M-edge", [h("h3", { text: "High support" }), h("p", { class: "dim", text: "Short rehearsals, a partner, this guide, the coach, and leadership practicing and getting it wrong in front of you." })]), card("M-edge", [h("h3", { text: "High autonomy" }), h("p", { class: "dim", text: "You choose the skill, the student and your own words. The scripts here are starting points." })])]));
  sec.appendChild(card("", [h("h2", { text: "The rhythm" }), h("div", { class: "steps" }, [["Weekly, together", "Ten minutes at team meeting. One real situation, two people rehearse it out loud."], ["Weekly, solo", "Two reps on the practice range and one if-then plan."], ["Every two weeks", "Pick one of the nine support skills as your focus. Tell your partner."], ["Monthly", "Rate yourself below. Bring one do-over story to the campfire."], ["Any time", "A do-over with a student: “I didn't handle that the way I want to. Can I try again?”"]].map(s => h("div", null, [h("b", { text: s[0] }), s[1]])))]));
  const list = h("ul"), i1 = h("input", { type: "text", id: "ifIn", placeholder: "says “I don't care” during math" }), i2 = h("input", { type: "text", id: "thenIn", placeholder: "“Okay. Sometimes that means ‘I don't think I can.’ Is any of that true?”" });
  const drawIf = () => { const items = local.get("fg-ifthen", []); list.innerHTML = ""; items.forEach((it, i) => list.appendChild(h("li", null, [h("span", { text: "If a student " + it.i + ", then I will say " + it.t + " " }), h("button", { class: "chip", text: "Remove", onclick: () => { items.splice(i, 1); local.set("fg-ifthen", items); drawIf(); } })]))); };
  sec.appendChild(card("", [h("h3", { text: "My if-then plan" }), h("p", { class: "small", text: "Deciding in advance what you'll say makes it far more likely you'll say it. Kept in this browser." }), h("label", { for: "ifIn" }, ["If a student…", i1]), h("label", { for: "thenIn" }, ["Then I will say…", i2]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Save plan", onclick: () => { if (!i1.value.trim() || !i2.value.trim()) return; const items = local.get("fg-ifthen", []); items.push({ i: i1.value.trim(), t: i2.value.trim() }); local.set("fg-ifthen", items); i1.value = i2.value = ""; drawIf(); } })]), list])); drawIf();
  const sk = h("div"); const drawSk = () => { const v = local.get("fg-skills", {}); sk.innerHTML = ""; D.SKILLS.forEach((s, i) => { const r = h("div", { class: "rate", role: "group", "aria-label": s }); for (let n = 1; n <= 5; n++) r.appendChild(h("button", { text: String(n), "aria-pressed": String(v[i] === n), onclick: () => { v[i] = n; local.set("fg-skills", v); drawSk(); } })); sk.appendChild(h("div", { class: "skill" }, [h("span", { text: (i + 1) + ". " + s }), r])); }); };
  sec.appendChild(card("", [h("h3", { text: "Monthly self-check: the nine support skills" }), h("p", { class: "small", text: "1 not yet consistent · 2 occasionally · 3 mostly · 4 strongly · 5 masterful and adaptive. Kept in this browser." }), sk])); drawSk();
};

/* ---------------- admin ---------------- */
VIEWS.admin = async sec => {
  head(sec, "Admin");
  const url = h("input", { type: "url", id: "rUrl", placeholder: "https://mentor-relay.YOURNAME.workers.dev" }), note = h("p", { class: "small" }); url.value = relay;
  sec.appendChild(card("", [h("h3", { text: "AI relay" }), h("p", { class: "small", text: "Paste the address of the Cloudflare Worker (setup steps are in /relay/README.md in the site's repository). Until this is set, scoring, the coach, live tips and session reviews stay off." }), h("label", { for: "rUrl" }, ["Relay address", url]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Save", onclick: async () => { try { await setDoc(doc(db, "mentorConfig", "main"), { relay: url.value.trim() }); relay = url.value.trim(); note.textContent = "Saved."; } catch (e) { note.textContent = "Couldn't save. Update the database rules first."; } } }), h("button", { class: "btn ghost", text: "Test", onclick: async () => { relay = url.value.trim(); note.textContent = "Testing…"; try { note.textContent = "Relay answered: " + (await ai([{ role: "user", content: "Reply with the single word: ready" }], { tier: "quick", max: 20 })); } catch (e) { note.textContent = "No luck (" + (e.code || "network") + "). " + (e.message || ""); } } })]), note]));
  const list = h("div"), em = h("input", { type: "email", id: "stE", placeholder: "name@wilderland.academy" }), n2 = h("p", { class: "small" });
  const load = async () => { list.innerHTML = ""; list.appendChild(ul(ADMINS.map(a => a + " (admin)").concat(GUESTS.map(g => g + " (guest)")))); try { const snap = await getDocs(collection(db, "staff")); snap.forEach(d => list.appendChild(h("div", { class: "row", style: "padding:6px 0" }, [h("span", { text: d.id }), h("button", { class: "chip", text: "Remove", onclick: async () => { await deleteDoc(doc(db, "staff", d.id)); load(); } })]))); } catch (e) { n2.textContent = "Update the database rules to manage the staff list."; } };
  sec.appendChild(card("", [h("h3", { text: "Who can open this site" }), list, h("label", { for: "stE" }, ["Add a staff account", em]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Add", onclick: async () => { const e = em.value.trim().toLowerCase(); if (!e.endsWith("@wilderland.academy")) { n2.textContent = "Use a @wilderland.academy address."; return; } try { await setDoc(doc(db, "staff", e), { added: Date.now(), by: user.email }); em.value = ""; n2.textContent = "Added."; load(); } catch (err) { n2.textContent = "Couldn't add. Update the database rules first."; } } })]), n2])); load();
  sec.appendChild(card("", [h("h3", { text: "What admins can and can't see" }), ul(["Admins manage the staff list and the relay address.", "Admins cannot open any guide's students, transcripts or feedback from this site.", "The page's text and scripts are public files, like the rest of Explore. Student data is what sign-in protects."])]));
};
