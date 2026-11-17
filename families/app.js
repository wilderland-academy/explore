// Wilderland at Home: a parent site. Static, no sign-in, unlisted (noindex, not linked from student pages).
// Everything a family picks (grade band, schedule, checklists, chosen practices) stays in this browser only.
import * as D from "./data.js";

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function h(tag, attrs, kids) { const e = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]); } (kids || []).forEach(c => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
const app = $("#app");
const card = (cls, kids) => h("div", { class: "card " + (cls || "") }, kids);
const ul = items => h("ul", null, items.map(t => h("li", { text: t })));
const head = (sec, title, lede) => { sec.appendChild(h("h1", { html: title })); if (lede) sec.appendChild(h("p", { class: "lede", text: lede })); };
const GUIDE_URL = "https://drive.google.com/file/d/1RxYs-YZDKj2JM5Z63qJOIj_CCak6ZpSF/view?usp=drive_link";
const ext = (text, href) => h("a", { href, target: "_blank", rel: "noopener", text });

/* ---------- saved in this browser only ---------- */
const store = { get(k, d) { try { const v = localStorage.getItem("wl-family-" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("wl-family-" + k, JSON.stringify(v)); } catch (e) { } } };
let prof = store.get("prof", { band: "", sched: "" });
const isUp = () => prof.band === "g24" || prof.band === "g58";

// Grade band and schedule picker. Re-renders the current view on change.
function picker(compact) {
  const wrap = h("div", { class: compact ? "showing" : "prof" });
  const group = (key, opts) => h("div", { class: "chips", role: "group" }, Object.entries(opts).map(([k, v]) => h("button", { class: "chip", "aria-pressed": String(prof[key] === k), text: v, onclick: () => { prof[key] = prof[key] === k ? "" : k; store.set("prof", prof); route(); } })));
  if (compact) {
    if (!prof.band) { wrap.append(h("span", { text: "Pick your child's grades to see just what applies:" }), group("band", D.BANDS)); return wrap; }
    wrap.append(h("span", { text: "Showing" }), h("b", { text: D.BANDS[prof.band] + (prof.sched ? ", " + D.SCHED[prof.sched].toLowerCase() : "") }), h("a", { href: "#home", text: "change" }));
    return wrap;
  }
  wrap.append(h("h2", { text: "Who are you supporting?" }), h("p", { class: "dim", text: "Pick once and every page shows what applies to your child. Siblings in different grades? Switch any time." }), h("b", { text: "Grades" }), group("band", D.BANDS), h("b", { text: "Schedule" }), group("sched", D.SCHED), h("p", { class: "small", text: "Saved on this device only." }));
  return wrap;
}

/* ---------- routing ---------- */
const STOPS = [["home", "Start", ""], ["week", "Your part at home", "The daily routine and what school handles"], ["reading", "Reading together", "Read-alouds, routines and finding the right books"], ["math", "Math in real life", "Games and everyday number sense"], ["mentor", "The Mentor Mindset", "High standards and high support, at home"], ["moments", "Hard moments", "Mornings, screens, meltdowns and more"], ["explore", "Explore together", "Challenges, project sparks and books"], ["practices", "Twelve practices", "Sleep, food, play: pick two or three"], ["help", "Who to ask", "Which guide to talk to, and how"]];
const NAVL = { week: "At home", reading: "Reading", math: "Math", mentor: "Mentor Mindset", moments: "Hard moments", explore: "Explore", practices: "12 practices", help: "Who to ask" };
const VIEWS = {};
function buildNav() { const nav = $("#nav"); STOPS.forEach(s => nav.appendChild(h("a", { href: "#" + s[0], text: NAVL[s[0]] || s[1] }))); }
function route() {
  let v = location.hash.slice(1).split("/")[0]; if (!VIEWS[v]) v = "home";
  document.querySelectorAll("#nav a").forEach(a => { if (a.getAttribute("href") === "#" + v) { a.setAttribute("aria-current", "page"); a.scrollIntoView && a.scrollIntoView({ block: "nearest", inline: "center" }); } else a.removeAttribute("aria-current"); });
  const y = route.last === v ? window.scrollY : 0; route.last = v;
  const sec = h("section", { class: "view" }); app.innerHTML = ""; app.appendChild(sec); VIEWS[v](sec); window.scrollTo(0, y);
}
addEventListener("hashchange", route);
const next = (sec, id) => { const i = STOPS.findIndex(s => s[0] === id); const n = STOPS[i + 1]; if (n) sec.appendChild(h("a", { class: "btn ghost", style: "align-self:flex-start;text-decoration:none", href: "#" + n[0], text: "Next: " + n[1] + " →" })); };

/* ---------- start ---------- */
VIEWS.home = sec => {
  head(sec, "Wilderland <span>at home</span>", "School and home each carry part of your child's growth. This is the home half: what to do each day, how to talk so your child rises to a high bar, and where to go for help.");
  sec.appendChild(card("M-edge", [h("span", { class: "tag M", text: "The Wilderland promise" }), h("p", { style: "font:700 clamp(20px,3vw,26px)/1.25 var(--display)", text: "We want your child to love school, to surprise everyone, and to be ready for real life." }), h("p", { class: "dim", text: "Everything here serves one of those three. Take what serves your family and leave what doesn't. The daily academic routine is an expectation; the twelve practices are optional." })]));
  sec.appendChild(card("", [h("p", { html: "Want the why behind it? <a href=\"/families/approach/\">Our Approach</a> goes deeper on our three pillars, how guides help, Life Skills and the research. <a href=\"/families/series/\">Field Notes</a> walks through the books that shaped Wilderland." })]));
  sec.appendChild(card("", [picker(false)]));
  const pts =[[90, 420], [230, 340], [140, 230], [320, 190], [470, 290], [620, 360], [760, 270], [650, 150]];
  const trees = [[40, 360], [300, 420], [520, 450], [380, 140], [700, 430], [860, 320], [200, 160]];
  let svg = `<svg viewBox="0 0 900 480" role="img" aria-label="Map of this guide"><circle cx="800" cy="70" r="26" fill="#f5c542"/><path d="M0 300 120 170 230 250 360 110 480 230 600 90 720 210 820 130 900 200V480H0Z" fill="#b9d9a6"/><path d="M0 390 150 280 290 370 430 270 560 360 700 260 900 370V480H0Z" fill="#8fc08a"/><path d="M600 90 562 136 600 128 638 138Z" fill="#ffffff"/>${trees.map(t => `<path d="M${t[0]} ${t[1]}l10 22h-20z M${t[0]} ${t[1] + 12}l13 24h-26z" fill="#2f7d4f"/>`).join("")}<polyline points="${pts.map(p => p.join(",")).join(" ")}" fill="none" stroke="#015640" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  STOPS.slice(1).forEach((s, i) => { const [x, y] = pts[i]; svg += `<a href="#${s[0]}" aria-label="${esc(s[1])}"><circle cx="${x}" cy="${y}" r="18" fill="#d5f367" stroke="#015640" stroke-width="3"/><text class="n" x="${x}" y="${y + 5}" text-anchor="middle">${i + 1}</text><text class="l" x="${x}" y="${y + 40}" text-anchor="middle">${esc(s[1])}</text></a>`; });
  sec.appendChild(h("div", { class: "map", html: svg + "</svg>" }));
  const g = h("div", { class: "stops" });
  STOPS.slice(1).forEach((s, i) => g.appendChild(h("a", { class: "stop", href: "#" + s[0] }, [h("i", { text: "STOP " + (i + 1) }), h("b", { text: s[1] }), h("span", { text: s[2] })])));
  sec.appendChild(g);
  sec.appendChild(card("", [h("h3", { text: "Short on time?" }), h("p", { text: isUp() ? "If you only remember five things: daily app work gets done, read every day, check the Dashboard weekly, let your child do real things themselves, and protect sleep." : "If you only remember four things: read aloud every day, keep up the reading routine on home days, tell your child's guide early when you notice a struggle, and protect sleep." })]));
};

/* ---------- your week ---------- */
VIEWS.week = sec => {
  head(sec, "Your <span>part</span> at home", "Short, daily, predictable practice beats long, occasional sessions. Pick your child's grades and schedule to see what home covers, what school covers, and a week that works.");
  const pick = h("div", { class: "prof" });
  const grp = (key, opts) => h("div", { class: "chips", role: "group" }, Object.entries(opts).map(([k, v]) => h("button", { class: "chip", "aria-pressed": String(prof[key] === k), text: v, onclick: () => { prof[key] = prof[key] === k ? "" : k; store.set("prof", prof); route(); } })));
  pick.append(h("b", { text: "Grades" }), grp("band", D.BANDS), h("b", { text: "Schedule" }), grp("sched", D.SCHED), h("p", { class: "small", text: "Saved on this device only." }));
  sec.appendChild(pick);
  if (!prof.band || !prof.sched) { sec.appendChild(card("", [h("p", { text: !prof.band && !prof.sched ? "Choose your child's grades and whether they attend full time or part time. The routine is different for each." : !prof.band ? "Now choose your child's grades." : "Now choose full time or part time. Home looks different for each." })])); return; }
  const up = isUp(), W = up ? D.WEEK.up : D.WEEK.k1, pt = prof.sched === "pt";
  sec.appendChild(card("M-edge", [h("p", { text: W.growth })]));
  sec.appendChild(h("div", { class: "split" }, [card("", [h("h3", { text: "Your part at home" }), ul(pt ? W.home : (W.homeFT || W.home))]), card("", [h("h3", { text: "What you can count on school for" }), ul(W.school)])]));
  sec.appendChild(card("", [h("h2", { text: up ? (pt ? "Every school day" : "A typical school day") : "The daily reading routine" }), h("div", { class: "routine" }, (pt ? W.routine : (W.routineFT || W.routine)).map(r => h("div", null, [h("span", { class: "t", text: r[0] }), h("b", { text: r[1] }), h("span", { class: "small", text: r[2] })])))]));
  if (pt) sec.appendChild(card("P-edge", [h("span", { class: "tag P", text: "Part-time families" }), h("p", { text: W.pt }), W.ptOpts ? h("p", { class: "small", text: W.ptOpts }) : null, up ? h("p", { class: "small", text: "If home-day work is proving too much, ask your child's academic guide to adjust the Dashboard targets. That's a normal, welcome conversation. Targets stay rigorous enough to push your child without becoming unmanageable." }) : null]));
  else if (up) sec.appendChild(card("E-edge", [h("span", { class: "tag E", text: "Full-time families" }), h("p", { text: W.ft })]));
  if (up && pt) sec.appendChild(card("", [h("h3", { text: "How catch-up work works" }), h("p", { text: "Each day has a set number of lessons. Anything unfinished becomes catch-up work on the Dashboard and stays there until it's done. Short daily catch-up beats one big weekend session." }), h("h3", { text: "Tips for app work at home" }), ul(W.tips)]));
  else if (up) sec.appendChild(card("", [h("h3", { text: "If you do add practice at home" }), h("p", { text: "Unfinished lessons stay on the Dashboard as catch-up work until they're done, so a short daily session at home can clear them. Keep it brief and calm." }), ul(W.tips)]));
  sec.appendChild(card("", [h("h3", { text: "See your child's progress" })].concat(W.progress.map(p => h("p", null, [ext(p[0], p[1]), h("span", { class: "dim", text: " · " + p[2] })])))));
  const rows = pt ? (W.weekPT || W.week) : W.week, note = pt ? (W.weekPTNote || W.weekNote) : W.weekNote;
  const t = h("table"); t.appendChild(h("tr", null, ["Day", "Where", up ? "Academics" : "Reading", up ? "Reading" : "Math", "Independence"].map(x => h("th", { text: x }))));
  rows.forEach(r => t.appendChild(h("tr", null, r.map((x, i) => h(i ? "td" : "th", { text: x })))));
  sec.appendChild(card("", [h("h2", { text: "A sample week" }), h("div", { class: "scroll" }, [t]), h("p", { class: "small", text: note })]));
  const list = pt ? W.check : (W.checkFT || W.check), key = "check-" + (up ? "up" : "k1") + (pt ? "" : "-ft"), done = store.get(key, []);
  sec.appendChild(card("", [h("h2", { text: "Five-minute checklist" })].concat(list.map((c, i) => { const box = h("input", { type: "checkbox" }); box.checked = done.includes(i); box.onchange = () => { const d = store.get(key, []).filter(x => x !== i); if (box.checked) d.push(i); store.set(key, d); }; return h("label", { class: "check" }, [box, h("span", { text: c })]); }))));
  next(sec, "week");
};

/* ---------- reading ---------- */
VIEWS.reading = sec => {
  head(sec, "Reading <span>together</span>", "Reading aloud is the single most important thing most families can do at home. The goal is a child who loves to read, so choice matters as much as level.");
  sec.appendChild(picker(true));
  sec.appendChild(card("M-edge", [h("h2", { text: "For every age" }), ul(D.READ.all)]));
  const bands = prof.band ? [prof.band] : ["k1", "g24", "g58"];
  bands.forEach(b => { const R = D.READ[b]; const kids = [h("h2", { text: R.title }), ul(R.list)]; if (R.links) kids.push(h("h3", { text: "Programs and tools" }), ...R.links.map(l => h("p", null, [ext(l[0], l[1]), h("span", { class: "dim", text: " · " + l[2] })]))); sec.appendChild(card("", kids)); });
  sec.appendChild(card("", [h("div", { class: "site" }, [h("div", { class: "ico", text: "📚" }), h("div", { style: "display:flex;flex-direction:column;gap:8px" }, [h("h3", { text: "Find the next book with your child" }), h("p", { text: "The Lantern Stacks connects great books by theme, genre and feeling. Let your child steer, and offer choices within limits: “Read before dinner or after?” beats “Do you want to read?”" }), h("a", { class: "btn", style: "align-self:flex-start;text-decoration:none", href: "/books/", text: "Open the Lantern Stacks" })])])]));
  next(sec, "reading");
};

/* ---------- math ---------- */
VIEWS.math = sec => {
  head(sec, "Math in <span>real life</span>", "Apps and guides handle the lessons. Home is where math becomes useful: money, recipes, maps and games.");
  sec.appendChild(picker(true));
  sec.appendChild(card("E-edge", [h("h3", { text: "The one rule" }), h("p", { text: D.MATH.rule })]));
  const names = { k1: "K–1: counting real things", g24: "Grades 2–4: operations and patterns", g58: "Grades 5–8: reasoning and real decisions" };
  (prof.band ? [prof.band] : ["k1", "g24", "g58"]).forEach(b => sec.appendChild(card("", [h("h2", { text: names[b] }), ul(D.MATH[b])])));
  sec.appendChild(card("", [h("h3", { text: "Curious about the Montessori materials?" }), h("p", { text: "When your child mentions “golden beads” or “the stamp game,” search the name on YouTube for a short demonstration, or ask their guide to show you. Children love giving a lesson to a parent." }), h("p", null, [ext("Free Montessori math videos (Living Montessori Now)", "https://livingmontessorinow.com/free-montessori-math-videos/")])]));
  next(sec, "math");
};

/* ---------- mentor mindset ---------- */
VIEWS.mentor = sec => {
  head(sec, "The <span>Mentor Mindset</span> at home", "Your child's guides are learning this too. It comes from psychologist David Yeager's book 10 to 25: the way of talking that helps young people rise to a high bar instead of resisting it.");
  const detail = h("div", { class: "card" }); let sel = "M";
  const quad = h("div", { class: "quad" });
  const draw = () => { quad.innerHTML = ""; [["High standards"], "E", "M", ["Low standards"], "A", "P"].forEach(k => Array.isArray(k) ? quad.appendChild(h("div", { class: "ylab", text: k[0] })) : quad.appendChild(h("button", { class: "q" + k, "aria-pressed": String(sel === k), onclick: () => { sel = k; draw(); } }, [h("b", { text: D.QUAD[k][0] }), h("span", { text: D.QUAD[k][1] })]))); detail.innerHTML = ""; detail.append(h("span", { class: "tag " + (sel === "A" ? "" : sel), text: D.QUAD[sel][0] }), h("p", { style: "font:700 20px/1.3 var(--display)", text: D.QUAD[sel][2] }), h("p", { class: "dim", text: D.QUAD[sel][3] })); };
  draw();
  sec.appendChild(card("", [h("h2", { text: "Four ways parents respond. Tap one." }), h("div", { class: "axis" }, [h("span", { text: "Low support" }), h("span", { text: "High support" })]), quad, detail, h("p", { class: "small", text: "Nobody lives in one box. Under stress, loving parents slide into enforcer or protector. Both come from caring, and both quietly assume the child can't handle much." })]));
  sec.appendChild(h("div", { class: "grid g2" }, [
    card("", [h("h3", { text: "Why it works, especially from about age 10" }), h("p", { text: "Yeager's research focuses on ages 10 to 25, when young people become intensely tuned to status and respect. They listen for one thing: does this adult think I'm capable? A threat says “I don't respect you.” A rescue says “I don't think you can.” Either one shuts motivation down." }), h("p", { class: "dim", text: "With younger children, the same balance of warmth and real expectations is what decades of parenting research call an authoritative style. It's also the “help me do it myself” your child hears in Montessori." })]),
    card("", [h("h3", { text: "The one-sentence version" }), h("p", { text: "When you push, say why, and say you believe in them:" }), h("div", { class: "say", text: "“I'm asking a lot because I know you can do it, and I'll help you get there.”" }), h("p", { class: "small", text: "It only works when real help follows. Repeated as a slogan, it goes hollow." })])
  ]));
  sec.appendChild(card("M-edge", [h("h3", { text: "Three checks before you speak" }), h("div", { class: "steps" }, D.CHECKS.map(c => h("div", null, [h("b", { text: c[0] }), c[1]]))), h("p", { class: "small", text: "Miss the first and you're protecting. Miss the second and you're enforcing. Miss the third and even good help feels like control." })]));
  sec.appendChild(h("h2", { text: "Say this instead. Tap a card." }));
  const g = h("div", { class: "grid g3" });
  D.SWAPS.forEach(s => { const b = h("button", { class: "flip " + s.k }); const face = on => { b.innerHTML = ""; b.classList.toggle("on", on); b.appendChild(on ? h("div", { class: "f" }, [h("span", { class: "tag M", text: "Try" }), h("div", { class: "q", text: s.instead }), h("p", { class: "small", text: s.why })]) : h("div", { class: "f" }, [h("span", { class: "tag " + s.k, text: s.k === "E" ? "Enforcer reflex" : "Protector reflex" }), h("div", { class: "q", text: s.say }), h("span", { class: "hint", text: "Tap for a mentor version" })])); b.setAttribute("aria-pressed", String(on)); }; let on = false; b.onclick = () => face(on = !on); face(false); g.appendChild(b); });
  sec.appendChild(g);
  sec.appendChild(h("h2", { text: "What the research says" }));
  sec.appendChild(h("div", { class: "grid g2" }, D.EVIDENCE.map(e => card("stat", [h("h3", { text: e.title }), h("div", { class: "big", text: e.big }), h("p", { text: e.what }), h("p", { class: "small", text: e.note }), h("a", { class: "small", href: e.src[1], target: "_blank", rel: "noopener", text: "Source: " + e.src[0] })]))));
  sec.appendChild(card("", [h("h3", { text: "Go deeper" }), h("p", null, [h("i", { text: "10 to 25: The Science of Motivating Young People" }), " by David Yeager is written for parents as much as teachers."])]));
  next(sec, "mentor");
};

/* ---------- hard moments ---------- */
VIEWS.moments = sec => {
  head(sec, "Hard <span>moments</span> at home", "The mentor move for the moments that test every family. Each shows the two easy reflexes, then a better path and words to try.");
  let f = store.get("mf", prof.band === "g58" ? "o" : prof.band ? "y" : "all"), open = location.hash.split("/")[1] || "";
  const chips = h("div", { class: "chips", role: "group", "aria-label": "Filter" }), list = h("div", { class: "stops" }), detail = h("div");
  const filters = [["all", "All"], ["y", "Younger kids"], ["o", "Middle schoolers"], ["pt", "Part-time days"]];
  const show = m => f === "all" || (f === "pt" ? m.pt : m.ages === "b" || m.ages === f);
  const draw = () => {
    chips.innerHTML = ""; filters.forEach(([k, n]) => chips.appendChild(h("button", { class: "chip", "aria-pressed": String(f === k), text: n, onclick: () => { f = k; store.set("mf", f); draw(); } })));
    list.innerHTML = ""; D.MOMENTS.filter(show).forEach(m => { const b = h("button", { class: "moment", "aria-pressed": String(open === m.id), "aria-expanded": String(open === m.id), onclick: () => { open = open === m.id ? "" : m.id; history.replaceState(null, "", "#moments" + (open ? "/" + open : "")); draw(); const c = list.querySelector('[aria-pressed="true"]'); if (c) c.scrollIntoView({ behavior: "smooth", block: "start" }); } }, [h("b", { text: m.title }), h("span", { text: m.when })]); list.appendChild(b); if (open === m.id) list.appendChild(detail); });
    detail.innerHTML = ""; const m = D.MOMENTS.find(x => x.id === open); if (!m || !show(m)) { detail.remove(); return; }
    detail.appendChild(card("M-edge", [h("span", { class: "tag M", text: "Hard moment" }), h("h2", { text: m.title }), h("p", { class: "dim", text: m.when }),
      h("div", { class: "reflex" }, [h("div", { class: "rE" }, [h("small", { text: "Enforcer reflex" }), m.E]), h("div", { class: "rP" }, [h("small", { text: "Protector reflex" }), m.P])]),
      h("h3", { text: "The mentor move" }), ul(m.M), h("h3", { text: "Words to try" }), h("div", { class: "lines" }, m.lines.map(l => h("div", { class: "say", text: l }))), h("p", { class: "small", html: esc("Why: " + m.why).replace("Partnership Guide", `<a href="${GUIDE_URL}" target="_blank" rel="noopener">Partnership Guide</a>`) })]));
  };
  detail.style.gridColumn = "1 / -1"; sec.append(chips, list); draw();
  sec.appendChild(card("", [h("h3", { text: "When it's more than a hard week" }), h("p", { text: "If something keeps turning into a daily battle, or your child seems anxious, stuck or unusually frustrated, tell their field guide early. We'd much rather hear from you sooner than later." }), h("a", { href: "#help", text: "Who to ask →" })]));
  next(sec, "moments");
};

/* ---------- explore together ---------- */
VIEWS.explore = sec => {
  head(sec, "Explore <span>together</span>", "Three Explore sites your child uses at school also work at home. Use them side by side, with your child in the driver's seat.");
  D.EXPLORE.forEach(x => sec.appendChild(card("", [h("div", { class: "site" }, [h("div", { class: "ico", text: x.img, "aria-hidden": "true" }), h("div", { style: "display:flex;flex-direction:column;gap:10px" }, [h("h2", { text: x.name }), h("p", { text: x.what }), h("h3", { text: "The mentor way to use it" }), ul(x.how), h("p", { class: "small", text: x.note }), h("div", { class: "row" }, [h("a", { class: "btn", style: "text-decoration:none", href: x.href, text: "Open " + x.name }), x.more ? h("a", { class: "btn ghost", style: "text-decoration:none", href: x.more[1], text: x.more[0] }) : null])])])])));
  next(sec, "explore");
};

/* ---------- twelve practices ---------- */
VIEWS.practices = sec => {
  head(sec, "Twelve <span>home practices</span>", "");
  sec.appendChild(h("p", { class: "lede" }, ["From our ", ext("Parent Partnership Guide", GUIDE_URL), ": twelve research-backed habits that help children learn and thrive. They're optional. Pick two or three that fit your family right now; new routines usually stop meeting resistance within two to four weeks."]));
  let mine = store.get("prac", []);
  const note = h("p", { class: "small" }), g = h("div", { class: "stops" });
  const draw = () => { g.innerHTML = ""; D.PRACTICES.forEach(p => g.appendChild(h("button", { class: "prac", "aria-pressed": String(mine.includes(p[0])), onclick: () => { mine = mine.includes(p[0]) ? mine.filter(x => x !== p[0]) : mine.concat(p[0]); store.set("prac", mine); draw(); } }, [h("i", { text: p[0] + (mine.includes(p[0]) ? " · OUR FOCUS" : "") }), h("b", { text: p[1] }), h("span", { text: p[2] })]))); note.textContent = mine.length ? (mine.length > 3 ? "That's " + mine.length + ". Two or three at a time tends to stick better." : "Your focus: " + D.PRACTICES.filter(p => mine.includes(p[0])).map(p => p[1]).join(", ") + ".") : "Tap the ones you want to focus on. Saved on this device only."; };
  draw(); sec.append(note, g);
  sec.appendChild(card("", [h("h3", { text: "Stretched thin?" }), h("p", { text: "That's okay. Start with what matters most, probably sleep and food, and trust that the rest can come later. These are a resource, not a report card on your parenting." })]));
  next(sec, "practices");
};

/* ---------- who to ask ---------- */
VIEWS.help = sec => {
  head(sec, "Who to <span>ask</span>", "Reach out early. The sooner we know what's happening at home, the better we can help at school.");
  sec.appendChild(h("div", { class: "split" }, [
    card("", [h("h3", { text: "Your child's field guide" }), h("p", { class: "dim", text: "Knows the whole child." }), ul(["How your child is feeling and getting along", "Behavior, conflict and motivation", "Executive function and life skills", "Home pass-offs for challenges"])]),
    card("", [h("h3", { text: "Your child's academic guide" }), h("p", { class: "dim", text: "Watches the academic picture closely." }), ul(["Where your child is and what comes next", "Assessment data and progress", "Dashboard targets and catch-up work", "Your home curriculum plan, if you use one"])])
  ]));
  sec.appendChild(card("", [h("h2", { text: "The chain of support" }), h("div", { class: "chain" }, [h("div", null, [h("b", { text: "1. A concern about your child" }), "Something you've noticed, heard about, or want to understand better."]), h("div", null, [h("b", { text: "2. Your child's field guide" }), "Start here. They know your child best and can often solve it directly, or bring in help with full context."]), h("div", null, [h("b", { text: "3. Ms. Shanan, Program Operations Director" }), "If more support is needed. Larger system issues, logistics and health concerns can go straight to her: ", h("a", { href: "mailto:shanan@wilderland.academy", text: "shanan@wilderland.academy" })])])]));
  if (prof.band === "k1") sec.appendChild(card("", [h("h3", { text: "Lower Campus contacts" }), ul(["Reading or math progress, and Mobymax access: Ms. Jessica (jessica@wilderland.academy)", "Behavior or social concerns: Ms. Chelse", "Help building a Montessori materials kit for home: Ms. Jessica or Ms. Shanan"])]));
  sec.appendChild(card("", [h("h3", { text: "Good to know" }), ul(["Drop-off and pick-up are transition times, not conference times. For anything more than a quick exchange, book a meeting with your child's guide through Setmore.", "Use WhatsApp for routine communication.", "Please drop off and pick up within the posted windows. Guides have closing work that protects the quality of your child's next day."])]));
  sec.appendChild(card("M-edge", [h("p", { text: "Education isn't something we do to children, and it isn't something schools do apart from families. It's an ongoing collaboration: imperfect, iterative and deeply human. Thank you for being part of it." })]));
};

buildNav(); route();
