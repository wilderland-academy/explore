// Our Approach: the "why and how" half of the parent site. Static, no sign-in, unlisted (noindex, not linked from student pages).
// The grade band a family picks is shared with At Home (localStorage "wl-family-prof") and stays in this browser only.
import * as D from "./data.js";

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function h(tag, attrs, kids) { const e = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]); } (kids || []).forEach(c => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
const app = $("#app");
const card = (cls, kids) => h("div", { class: "card " + (cls || "") }, kids);
const ul = items => h("ul", null, items.map(t => h("li", { text: t })));
const head = (sec, title, lede) => { sec.appendChild(h("h1", { html: title })); if (lede) sec.appendChild(h("p", { class: "lede", text: lede })); };
const ext = (text, href) => h("a", { href, target: "_blank", rel: "noopener", text });
const icon = name => h("span", { class: "ap-ic", html: `<svg aria-hidden="true"><use href="/challenges/icons.svg#i-${name}"/></svg>` });

/* ---------- shared with At Home, saved in this browser only ---------- */
const store = { get(k, d) { try { const v = localStorage.getItem("wl-family-" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("wl-family-" + k, JSON.stringify(v)); } catch (e) { } } };
let prof = store.get("prof", { band: "", sched: "" });
const bandKey = () => prof.band === "k1" ? "K–1" : prof.band === "g24" ? "2–4" : prof.band === "g58" ? "5–8" : "";
function bandChips() {
  return h("div", { class: "chips", role: "group", "aria-label": "Your child's grades" }, Object.entries(D.BANDS).map(([k, v]) => h("button", { class: "chip", "aria-pressed": String(prof.band === k), text: v, onclick: () => { prof.band = prof.band === k ? "" : k; store.set("prof", prof); route(); } })));
}

/* ---------- routing ---------- */
const STOPS = [["home", "Start", ""], ["promises", "Three promises", "What we want for every child"], ["pillars", "Three pillars", "Standards, support and autonomy, together"], ["day", "A day here", "How a day is shaped, and how it grows"], ["morning", "Mornings", "Mastery academics, and why it's faster"], ["skills", "Eight Life Skills", "Real feats with a clear standard"], ["nature", "Nature and risk", "Outdoors as the classroom"], ["guides", "The adults", "Field Guides, Academic Guides, mentors"], ["evidence", "Why we believe it", "The research, rated honestly"], ["words", "Words we use", "Blazes, Epics, “not yet” and more"], ["deeper", "Go deeper", "Books, podcasts and talks"]];
const NAVL = { promises: "Promises", pillars: "Pillars", day: "A day", morning: "Mornings", skills: "Life Skills", nature: "Nature", guides: "Guides", evidence: "Evidence", words: "Words", deeper: "Go deeper" };
const VIEWS = {};
function buildNav() { const nav = $("#nav"); STOPS.forEach(s => nav.appendChild(h("a", { href: "#" + s[0], text: NAVL[s[0]] || s[1] }))); }
function route() {
  let v = location.hash.slice(1).split("/")[0]; if (!VIEWS[v]) v = "home";
  document.querySelectorAll("#nav a").forEach(a => { if (a.getAttribute("href") === "#" + v) { a.setAttribute("aria-current", "page"); a.scrollIntoView && a.scrollIntoView({ block: "nearest", inline: "center" }); } else a.removeAttribute("aria-current"); });
  const y = route.last === v ? window.scrollY : 0; route.last = v;
  const sec = h("section", { class: "view" }); app.innerHTML = ""; app.appendChild(sec); VIEWS[v](sec); window.scrollTo(0, y);
  document.title = (v === "home" ? "Our Approach" : STOPS.find(s => s[0] === v)[1] + " · Our Approach") + " · Wilderland families";
}
addEventListener("hashchange", route);
const next = (sec, id) => { const i = STOPS.findIndex(s => s[0] === id); const n = STOPS[i + 1]; if (n) sec.appendChild(h("a", { class: "btn ghost", style: "align-self:flex-start;text-decoration:none", href: "#" + n[0], text: "Next: " + n[1] + " →" })); };

/* ---------- start ---------- */
VIEWS.home = sec => {
  head(sec, "Our <span>approach</span>", "Wilderland does some things differently on purpose. This is the why behind them: what we promise, how a day works, what we're building in your child, and the research we lean on, including where it runs out.");
  sec.appendChild(card("M-edge", [h("p", { style: "font:700 clamp(21px,3.2vw,30px)/1.2 var(--display);max-width:none", html: "Children are not empty vessels to be filled. <span style=\"color:var(--acc)\">They are capable people to be guided.</span>" }), h("p", { class: "dim", text: "Learning here is individualized, mastery-based and driven in large part by the child. We ask a lot of students, and we make sure a caring adult is always alongside them." })]));
  // The model as a building: promises are the roof, three pillars hold it up, three roots are the foundation. HTML so it reflows on phones.
  const part = (cls, href, t, s) => h("a", { class: "ap-part " + cls, href: "#" + href }, [h("b", { text: t }), h("span", { text: s })]);
  sec.appendChild(h("div", { class: "ap-house", role: "group", "aria-label": "How Wilderland fits together" }, [
    part("ap-roof", "promises", "Love school. Surprise everyone. Ready for life.", "Our three promises"),
    h("div", { class: "ap-cols" }, [part("ap-col", "pillars", "High standards", "A clear, high bar"), part("ap-col", "pillars", "High support", "An adult who knows them"), part("ap-col", "pillars", "High autonomy", "Real choices, growing")]),
    h("div", { class: "ap-base" }, [part("", "day", "Montessori", "Following the child"), part("", "morning", "Mastery learning", "Alpha-style mornings"), part("", "nature", "Nature", "The outdoors as classroom")])
  ]));
  sec.appendChild(h("p", { class: "small", text: "Tap any part to read about it." }));
  const g = h("div", { class: "stops" });
  STOPS.slice(1).forEach((s, i) => g.appendChild(h("a", { class: "stop", href: "#" + s[0] }, [h("i", { text: "STOP " + (i + 1) }), h("b", { text: s[1] }), h("span", { text: s[2] })])));
  sec.appendChild(g);
  sec.appendChild(card("", [h("h3", { text: "The whole approach in five lines" }), ul(["Mornings are for core academics: each child works at their own level and moves on only after mastering it.", "Afternoons are for eight Life Skills, built through Labs and real challenges with a clear pass or “not yet.”", "Nature isn't a subject. It's where much of the learning happens, healthy risk included.", "Adults hold a high bar and give real help, then step back so the work stays the child's.", "Responsibility grows with age: discover in K–1, take ownership in 2–4, design and lead in 5–8."])]));
  sec.appendChild(card("", [h("p", { html: "Looking for what to do at home? That's the other half of this site: <a href=\"/families/\">Wilderland at Home</a>." })]));
};

/* ---------- three promises ---------- */
VIEWS.promises = sec => {
  head(sec, "Three <span>promises</span>", "Everything we do serves one of these. Here's what each means, and what you might notice at home if it's working.");
  D.PROMISES.forEach((p, i) => sec.appendChild(card("ap-promise", [h("span", { class: "ap-num", text: String(i + 1) }), h("h2", { text: p.t }), h("p", { text: p.d }), h("b", { text: "What you might notice" }), ul(p.see)])));
  sec.appendChild(card("", [h("h3", { text: "About “2x”" }), h("p", { text: "Two-times growth is a goal for grades 2–8 when a student uses the program every school day, measured with MAP Growth tests. It's an aim for the whole school, not a guarantee for every child or every year. Part-time students and students who miss days grow less, which is why home days matter. The research behind individualized learning is on " }), h("a", { href: "#evidence", text: "Why we believe it →" })]));
  next(sec, "promises");
};

/* ---------- three pillars ---------- */
VIEWS.pillars = sec => {
  head(sec, "Three <span>pillars</span>", "High standards, high support and high autonomy only work together. Switch one off and see what happens.");
  let on = { S: true, U: true, A: true };
  const toggles = h("div", { class: "ap-toggles", role: "group", "aria-label": "Pillars" });
  const out = h("div", { class: "card" });
  const draw = () => {
    toggles.innerHTML = "";
    ["S", "U", "A"].forEach(k => toggles.appendChild(h("button", { class: "ap-pillar", "aria-pressed": String(on[k]), onclick: () => { on[k] = !on[k]; draw(); } }, [h("b", { text: D.PILLARS[k].short }), h("span", { text: on[k] ? "On" : "Off" })])));
    const key = ["S", "U", "A"].filter(k => on[k]).join("");
    const c = D.COMBOS[key];
    out.className = "card " + (c.tone === "M" ? "M-edge" : c.tone === "E" ? "E-edge" : c.tone === "P" ? "P-edge" : "");
    out.innerHTML = "";
    out.append(h("span", { class: "tag " + (c.tone === "A" ? "" : c.tone), text: key === "SUA" ? "All three" : key ? "Missing " + ["S", "U", "A"].filter(k => !on[k]).map(k => D.PILLARS[k].short.toLowerCase()).join(" and ") : "None" }), h("h2", { text: c.name }), h("p", { text: c.what }), h("p", { class: "say", text: c.eg }));
  };
  draw();
  sec.append(toggles, out);
  sec.appendChild(h("h2", { text: "What each pillar looks like here" }));
  sec.appendChild(h("div", { class: "grid g3" }, ["S", "U", "A"].map(k => card("", [h("h3", { text: D.PILLARS[k].name }), h("p", { class: "dim", text: D.PILLARS[k].line }), ul(D.PILLARS[k].here)]))));
  sec.appendChild(card("", [h("p", { text: "An honest note: in our early years we leaned hard on freedom and too lightly on standards. We've changed that. Today the bar is higher, and the support has to keep up with it." })]));
  next(sec, "pillars");
};

/* ---------- a day ---------- */
VIEWS.day = sec => {
  head(sec, "A day <span>here</span>", "Mornings for core academics, afternoons for life skills, and the outdoors throughout. Pick your child's grades.");
  sec.appendChild(bandChips());
  const d = prof.band === "k1" ? D.DAY.k1 : D.DAY.up;
  if (!prof.band) sec.appendChild(h("p", { class: "small", text: "Showing grades 2–8. Pick K–1 to see the lower campus day." }));
  sec.appendChild(h("p", { class: "dim", html: `<b>Model:</b> ${esc(d.model)}` }));
  const total = d.blocks.reduce((s, b) => s + b.w, 0);
  const strip = h("div", { class: "ap-day", role: "list" }, [h("div", { class: "ap-end", role: "listitem", text: d.arrive })].concat(d.blocks.map(b => h("div", { class: "ap-blk ap-" + b.k, role: "listitem", style: `flex:${(b.w / total * 10).toFixed(2)}` }, [h("b", { text: b.t }), b.len ? h("span", { text: b.len }) : null])), [h("div", { class: "ap-end", role: "listitem", text: d.leave })]));
  sec.appendChild(strip);
  sec.appendChild(h("div", { class: "grid g3" }, d.blocks.map(b => card("", [h("h3", { text: b.t }), h("p", { text: b.d })]))));
  sec.appendChild(h("p", { class: "small", text: "Not to scale. Exact schedules vary by guide and day; ask your child's guide for theirs." }));
  sec.appendChild(h("h2", { text: "Responsibility grows with your child" }));
  const me = bandKey();
  sec.appendChild(h("div", { class: "ap-ladder" }, D.OWN.map((o, i) => h("div", { class: "ap-rung" + (o.b === me ? " me" : ""), style: `--h:${120 + i * 40}px` }, [h("i", { text: "Grades " + o.b }), h("b", { text: o.say }), h("span", { class: "small", text: o.model }), h("p", { text: o.d })]))));
  sec.appendChild(h("p", { class: "dim", text: "Montessori is the foundation in every band. As children become capable of more independence, the model hands them more of it." }));
  next(sec, "day");
};

/* ---------- mornings ---------- */
VIEWS.morning = sec => {
  head(sec, "<span>Mornings</span>: mastery academics", "Every morning is protected for core academics. People call it “two-hour learning,” but in practice it runs longer: closer to two and a half hours on the upper campus and nearly three in K–1.");
  sec.appendChild(h("h2", { text: "Why students accomplish more in less time" }));
  sec.appendChild(h("div", { class: "grid g3" }, D.WHY_FASTER.map(w => card("", [h("h3", { text: w[0] }), h("p", { text: w[1] })]))));
  sec.appendChild(h("h2", { text: "How it works" }));
  sec.appendChild(h("div", { class: "anat" }, D.MORNING_RULES.map(r => h("div", null, [h("b", { text: r[0] }), h("span", { text: r[1] })]))));
  sec.appendChild(h("h2", { text: "The tools" }));
  sec.appendChild(bandChips());
  const k1 = prof.band === "k1";
  sec.appendChild(h("div", { class: "scroll" }, [h("table", null, [h("thead", null, [h("tr", null, [h("th", { text: "" }), h("th", { text: k1 ? "Grades K–1" : "Grades 2–8" })])]), h("tbody", null, D.TOOLS.map(t => h("tr", null, [h("th", { text: t.area }), h("td", { text: k1 ? t.k1 : t.up })])))])]));
  sec.appendChild(card("", [h("p", { html: k1 ? "In K–1, the morning is a Montessori work cycle. Progress lives in Transparent Classroom; see <a href=\"/families/#week\">your part at home</a> for the daily reading routine." : "You can see your child's daily work and MAP data in the Basecamp Parent Portal. What you can do at home, and what to leave to school, is on <a href=\"/families/#week\">your part at home</a>." })]));
  next(sec, "morning");
};

/* ---------- life skills ---------- */
VIEWS.skills = sec => {
  head(sec, "Eight <span>Life Skills</span>", "Academics are only part of preparing a child for life. These eight skills move from a child's inner life outward to the wider world. Each is built through real challenges with a clear standard.");
  let sel = location.hash.split("/")[1] || "EN";
  const me = bandKey();
  const pick = h("div", { class: "ap-skills", role: "group", "aria-label": "Life Skills" });
  const detail = h("div", { class: "card ap-skill" });
  const draw = () => {
    pick.innerHTML = "";
    D.SKILLS.forEach(s => pick.appendChild(h("button", { class: "ap-sk", style: `--c:${s.col}`, "aria-pressed": String(sel === s.k), onclick: () => { sel = s.k; history.replaceState(null, "", "#skills/" + s.k); draw(); } }, [icon(s.i), h("span", { text: s.n })])));
    const s = D.SKILLS.find(x => x.k === sel) || D.SKILLS[0];
    detail.style.setProperty("--c", s.col);
    detail.innerHTML = "";
    detail.append(h("h2", null, [icon(s.i), " " + s.n]), h("p", { text: s.d }), h("b", { text: "One challenge from each band" }), h("div", { class: "ap-ex" }, s.ex.map(e => h("div", { class: e[1] === me ? "me" : "" }, [h("i", { text: "Grades " + e[1] + (e[1] === me ? " · your child" : "") }), h("p", { text: "“" + e[2] + "”" }), h("a", { class: "small", href: "/challenges/", text: e[0] })]))));
  };
  draw();
  sec.append(pick, detail);
  sec.appendChild(h("h2", { text: "How a challenge works" }));
  sec.appendChild(h("div", { class: "steps" }, D.CHALLENGE_STEPS.map(s => h("div", null, [h("b", { text: s[0] }), s[1]]))));
  sec.appendChild(card("", [h("p", { text: "Grades 2–8 aim for at least 2 passed challenges in each Life Skill a year. In K–1, guides run the challenges with the whole group and aim for at least 3 per Life Skill." }), h("div", { class: "row" }, [h("a", { class: "btn", style: "text-decoration:none", href: "/challenges/", text: "Explore the challenges" }), h("a", { class: "btn ghost", style: "text-decoration:none", href: "/challenges/parents.html", text: "Passing off at home" })])]));
  next(sec, "skills");
};

/* ---------- nature and risk ---------- */
VIEWS.nature = sec => {
  head(sec, "Nature is part of the <span>learning environment</span>", "Wilderland isn't an outdoor school where adults take children outside and tell them about nature. Students notice, explore, question, move, take appropriate risks and solve real problems in the natural world.");
  sec.appendChild(card("", [h("h2", { text: "Braided moments" }), h("p", { text: "Nature isn't a separate class. It's woven through the rest of the learning." }), h("div", { class: "chips" }, D.BRAIDED.map(b => h("span", { class: "tag M", text: b })))]));
  sec.appendChild(card("M-edge", [h("p", { style: "font:700 clamp(19px,2.6vw,24px)/1.3 var(--display);max-width:none", text: D.RISK.quote })]));
  sec.appendChild(h("div", { class: "split" }, [card("", [h("h3", { text: "Healthy risk looks like" }), ul(D.RISK.healthy)]), card("", [h("h3", { text: "How we keep it healthy" }), ul(D.RISK.guard)])]));
  sec.appendChild(card("", [h("p", null, ["Nervous about risky play? The free ", ext("Outside Play tool", "https://www.outsideplay.org/"), " from Dr. Mariana Brussoni's lab helps parents get comfortable with it."])]));
  next(sec, "nature");
};

/* ---------- the adults ---------- */
VIEWS.guides = sec => {
  head(sec, "The <span>adults</span>", "Your child is supported by two kinds of guides, each watching a different part of their growth.");
  sec.appendChild(h("div", { class: "split" }, ["field", "acad"].map(k => { const g = D.GUIDES[k]; return card(k === "field" ? "M-edge" : "", [h("span", { class: "tag M", text: g.role }), h("h2", { text: g.t }), h("p", { class: "dim", text: g.d }), ul(g.list)]); })));
  sec.appendChild(h("p", { class: "dim", text: "How your child is feeling, getting along or growing as a person is a Field Guide conversation. Exactly where they are academically and what comes next is an Academic Guide conversation." }));
  sec.appendChild(h("h2", { text: "The mentor mindset" }));
  sec.appendChild(h("p", { text: "Our guides work from David Yeager's research in 10 to 25. Most adults slip between three ways of talking to young people. Only one helps them rise to a high bar." }));
  sec.appendChild(h("div", { class: "grid g3" }, D.MINDSET.map(m => card(m[0] + "-edge", [h("span", { class: "tag " + m[0], text: m[2] }), h("h3", { text: m[1] }), h("p", { class: "say", text: m[3] })]))));
  sec.appendChild(card("", [h("p", { html: "It works at home too. Try the <a href=\"/families/#mentor\">Mentor Mindset at home</a>, and see <a href=\"/families/#help\">who to ask</a> when something comes up." })]));
  next(sec, "guides");
};

/* ---------- evidence ---------- */
VIEWS.evidence = sec => {
  head(sec, "Why we <span>believe it</span>", "We lean on research, and we try not to oversell it. Each finding is rated by the strength of the study behind it, not by how much we like the result.");
  sec.appendChild(h("div", { class: "chips" }, [["Strong", "Large or randomized studies, or reviews of many"], ["Moderate", "Real evidence with real limits"]].map(r => h("span", { class: "small" }, [h("span", { class: "ap-s ap-s-" + r[0], text: r[0] }), " " + r[1]]))));
  sec.appendChild(h("div", { class: "grid g2" }, D.EVIDENCE.map(e => card("", [h("span", { class: "ap-s ap-s-" + e.s, text: e.s }), h("h3", { text: e.t }), h("p", { text: e.what }), h("p", { class: "small", text: e.limit }), h("p", { class: "small" }, [ext(e.src[0], e.src[1])].concat(e.src2 ? [" · ", ext(e.src2[0], e.src2[1])] : []))]))));
  sec.appendChild(card("P-edge", [h("h2", { text: "What we don't know yet" }), ul(D.UNKNOWN), h("p", { class: "small" }, [ext(D.UNKNOWN_SRC[0], D.UNKNOWN_SRC[1])])]));
  sec.appendChild(h("p", { class: "dim", text: "If you read something that makes you question part of our approach, tell us. We'd rather hear it than have you wonder." }));
  next(sec, "evidence");
};

/* ---------- words ---------- */
VIEWS.words = sec => {
  head(sec, "Words we <span>use</span>", "Your child will come home saying things like “I got a not yet on my Epic.” Here's what they mean.");
  const q = h("input", { type: "search", placeholder: "Search a word, like Blaze", "aria-label": "Search words" });
  const list = h("dl", { class: "ap-words" });
  const draw = () => { const s = q.value.trim().toLowerCase(); list.innerHTML = ""; const hits = D.WORDS.filter(w => !s || (w[0] + " " + w[1]).toLowerCase().includes(s)); hits.forEach(w => list.append(h("dt", { text: w[0] }), h("dd", { text: w[1] }))); if (!hits.length) list.append(h("dd", { text: "No match. Ask your child's guide, and we'll add it here." })); };
  q.oninput = draw; draw();
  sec.append(q, list);
  next(sec, "words");
};

/* ---------- go deeper ---------- */
VIEWS.deeper = sec => {
  head(sec, "Go <span>deeper</span>", "Books, podcasts and talks behind how we work. Pick by how much time you have. Look for the books at the Weber County Library or on Libby.");
  let size = "all", topic = "all";
  const f1 = h("div", { class: "chips", role: "group", "aria-label": "Length" }), f2 = h("div", { class: "chips", role: "group", "aria-label": "Topic" });
  const grid = h("div", { class: "grid g2" });
  const draw = () => {
    f1.innerHTML = ""; f2.innerHTML = "";
    Object.entries(D.SIZES).forEach(([k, v]) => f1.appendChild(h("button", { class: "chip", "aria-pressed": String(size === k), text: v, onclick: () => { size = k; draw(); } })));
    Object.entries(D.TOPICS).forEach(([k, v]) => f2.appendChild(h("button", { class: "chip", "aria-pressed": String(topic === k), text: v, onclick: () => { topic = k; draw(); } })));
    grid.innerHTML = "";
    const hits = D.DEEPER.filter(r => (size === "all" || r.size === size) && (topic === "all" || r.topic === topic));
    hits.forEach(r => grid.appendChild(card("", [h("span", { class: "tag", text: D.SIZES[r.size] }), h("h3", null, [r.href ? ext(r.t, r.href) : r.t]), h("p", { class: "small", text: r.who }), h("p", { text: r.why })])));
    if (!hits.length) grid.appendChild(card("", [h("p", { text: "Nothing in that combination yet. Try another length." })]));
  };
  draw();
  sec.append(f1, f2, grid);
  sec.appendChild(card("", [h("p", { html: "Back to <a href=\"#home\">the start</a>, or over to <a href=\"/families/\">Wilderland at Home</a> for what to do this week." })]));
};

buildNav(); route();
