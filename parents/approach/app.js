// Our Approach: one long page with a sticky section menu (anchor links + scroll spy).
// Static, no sign-in, unlisted (noindex, not linked from student pages). The grade band a family picks is shared with
// At Home (localStorage "wl-family-prof") and saved to the family's account by /auth.js.
import * as D from "./data.js";

const $ = s => document.querySelector(s);
function h(tag, attrs, kids) { const e = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]); } (kids || []).forEach(c => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
const card = (cls, kids) => h("div", { class: "card " + (cls || "") }, kids);
const ul = items => h("ul", null, items.map(t => h("li", { text: t })));
const ext = (text, href) => h("a", { href, target: "_blank", rel: "noopener", text });
const icon = name => h("span", { class: "ap-ic", html: `<svg aria-hidden="true"><use href="/challenges/icons.svg#i-${name}"/></svg>` });
const pairs = (rows, cls) => h("div", { class: cls || "ap-pairs" }, rows.map(r => h("div", null, [h("b", { text: r[0] }), h("span", { text: r[1] })])));

const store = { get(k, d) { try { const v = localStorage.getItem("wl-family-" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("wl-family-" + k, JSON.stringify(v)); } catch (e) { } } };
let prof = store.get("prof", { band: "", sched: "" });
// Every visit starts on the family's own child's band (from the parent's account via /wlnav.js; the youngest child if
// they have several), or on every band for staff and visitors. A band picked here holds until the page is left.
const roleBand = () => ({ "K–1": "k1", "2–4": "g24", "5–8": "g58" })[window.wlBand ? window.wlBand({ all: true }) : "All"] || "";
let bandPicked = false;
prof.band = roleBand();
document.addEventListener("wl-role", () => { if (!bandPicked && roleBand() !== prof.band) { prof.band = roleBand(); redraws.forEach(f => f()); } });
const bandKey = () => prof.band === "k1" ? "K–1" : prof.band === "g24" ? "2–4" : prof.band === "g58" ? "5–8" : "";
const redraws = [];
function bandChips() {
  return h("div", { class: "chips", role: "group", "aria-label": "Your child's grades" }, Object.entries(D.BANDS).map(([k, v]) => h("button", { class: "chip", "aria-pressed": String(prof.band === k), text: v, onclick: () => { prof.band = prof.band === k ? "" : k; bandPicked = true; store.set("prof", prof); redraws.forEach(f => f()); } })));
}
// a block that re-renders itself when the band changes
function live(render) { const box = h("div", { class: "ap-live" }); const f = () => { box.innerHTML = ""; render(box); }; redraws.push(f); f(); return box; }

const SECTIONS = [["pillars", "Three pillars"], ["help", "How guides help"], ["mornings", "Mornings"], ["skills", "Life Skills"], ["evidence", "Evidence"], ["words", "Words we use"], ["refresher", "Refresher"]];
const sec = (id, title, lede) => { const s = h("section", { class: "ap-sec", id }); s.appendChild(h("h2", { class: "ap-h", html: title })); if (lede) s.appendChild(h("p", { class: "lede", text: lede })); return s; };

function intro() {
  const s = h("section", { class: "ap-sec ap-intro", id: "top" });
  s.appendChild(h("h1", { html: "Our <span>approach</span>" }));
  s.appendChild(h("p", { class: "lede", text: "You heard the overview at Parent Education Night. This page goes a layer deeper: how our three pillars work together, what guides do and deliberately don't do, what Life Skills challenges really look like, and the research behind it, including where it runs out." }));
  s.appendChild(h("p", { class: "dim", html: "Need the overview again? Skip to the <a href=\"#refresher\">one-minute refresher</a>. Want to go further? The <a href=\"/parents/series/\">Field Notes</a> series walks through the books, podcasts and talks that shaped Wilderland." }));
  return s;
}

function pillars() {
  const s = sec("pillars", "Three <span>pillars</span>, one mechanism", "High standards, high support and high autonomy only work together. Each one keeps the others from going wrong. Tap a pillar to switch it off and see what happens.");
  const on = { S: true, U: true, A: true };
  const toggles = h("div", { class: "ap-toggles", role: "group", "aria-label": "Pillars" });
  const out = h("div", { class: "card", "aria-live": "polite" });
  const draw = () => {
    toggles.innerHTML = "";
    // Each pillar is a switch: a real on/off toggle in the card, and the card says what tapping it does.
    ["S", "U", "A"].forEach(k => toggles.appendChild(h("button", { type: "button", class: "ap-pillar", "aria-pressed": String(on[k]), "aria-label": D.PILLARS[k].short + ": " + (on[k] ? "on" : "off"), onclick: () => { on[k] = !on[k]; draw(); toggles.querySelectorAll(".ap-pillar")[["S", "U", "A"].indexOf(k)].focus(); } },
      [h("i", { class: "ap-switch", "aria-hidden": "true" }), h("b", { text: D.PILLARS[k].short }), h("span", { class: "ap-state", text: on[k] ? "On" : "Off" }), h("small", { class: "ap-hint", "aria-hidden": "true", text: on[k] ? "Tap to switch off" : "Tap to switch on" })])));
    const key = ["S", "U", "A"].filter(k => on[k]).join(""), c = D.COMBOS[key];
    out.className = "card " + ({ M: "M-edge", E: "E-edge", P: "P-edge" }[c.tone] || "");
    out.innerHTML = "";
    out.append(h("span", { class: "tag " + (c.tone === "A" ? "" : c.tone), text: key === "SUA" ? "All three" : key ? "Missing " + ["S", "U", "A"].filter(k => !on[k]).map(k => D.PILLARS[k].short.toLowerCase()).join(" and ") : "None" }), h("h3", { class: "ap-big", text: c.name }), h("p", { text: c.what }), h("p", { class: "say", text: c.eg }));
  };
  draw();
  s.append(toggles, out);
  s.appendChild(h("div", { class: "grid g3" }, ["S", "U", "A"].map(k => card("", [h("h3", { text: D.PILLARS[k].name }), h("p", { class: "dim", text: D.PILLARS[k].line }), ul(D.PILLARS[k].here)]))));
  s.appendChild(card("", [h("p", { text: "An honest note: in our early years we leaned hard on freedom and too lightly on standards. We've changed that. The bar is higher now, and the support has to keep up with it." })]));
  return s;
}

function help() {
  const s = sec("help", "How guides <span>help</span>, and when they hold back", "Most of what makes a guide good is invisible: when they wait, how they hint, and what they say after a mistake.");
  s.appendChild(h("h3", { text: "The mentor mindset" }));
  s.appendChild(h("p", { text: "Our guides train on David Yeager's research in 10 to 25. Most adults slip between three ways of talking to young people. Only one helps them rise to a high bar." }));
  s.appendChild(h("div", { class: "grid g3" }, D.MINDSET.map(m => card(m[0] + "-edge", [h("span", { class: "tag " + m[0], text: m[2] }), h("h3", { text: m[1] }), h("p", { class: "say", text: m[3] })]))));
  s.appendChild(h("div", { class: "split" }, [
    card("", [h("h3", { text: "Four rules for help" }), pairs(D.HELP_RULES)]),
    card("", [h("h3", { text: "Four rules for feedback" }), pairs(D.FEEDBACK_RULES)])
  ]));
  s.appendChild(card("", [h("p", { html: "These work at home too. Try the <a href=\"/parents/athome/#mentor\">Mentor Mindset at home</a>." })]));
  return s;
}

function mornings() {
  const s = sec("mornings", "<span>Mornings</span>, up close", "You know the shape: core academics first, at each child's own level. Here's what's going on underneath.");
  s.appendChild(pairs(D.MORNING_RULES));
  s.appendChild(h("h3", { text: "The tools" }));
  s.appendChild(bandChips());
  s.appendChild(live(box => {
    const k1 = prof.band === "k1";
    box.appendChild(h("div", { class: "scroll" }, [h("table", null, [h("thead", null, [h("tr", null, [h("th", { text: "" }), h("th", { text: k1 ? "Grades K–1" : "Grades 2–8" })])]), h("tbody", null, D.TOOLS.map(t => h("tr", null, [h("th", { text: t.area }), h("td", { text: k1 ? t.k1 : t.up })])))])]));
    if (!prof.band) box.appendChild(h("p", { class: "small", text: "Showing grades 2–8. Pick K–1 for the lower campus." }));
  }));
  s.appendChild(card("", [h("p", { html: "What to do at home, and what to leave to school, is on <a href=\"/parents/athome/#week\">your part at home</a>." })]));
  return s;
}

function skills() {
  const s = sec("skills", "Eight <span>Life Skills</span>, in practice", "Each skill is built through real challenges with a clear standard. Pick a skill to see one challenge from each band.");
  let sel = "EN";
  const pick = h("div", { class: "ap-skills", role: "group", "aria-label": "Life Skills" });
  const detail = h("div", { class: "card ap-skill", "aria-live": "polite" });
  const draw = () => {
    const me = bandKey();
    pick.innerHTML = "";
    D.SKILLS.forEach(x => pick.appendChild(h("button", { class: "ap-sk", style: `--c:${x.col}`, "aria-pressed": String(sel === x.k), onclick: () => { sel = x.k; draw(); } }, [icon(x.i), h("span", { text: x.n })])));
    const x = D.SKILLS.find(y => y.k === sel);
    detail.style.setProperty("--c", x.col);
    detail.innerHTML = "";
    detail.append(h("h3", { class: "ap-big" }, [icon(x.i), " " + x.n]), h("p", { text: x.d }), h("div", { class: "ap-ex" }, x.ex.map(e => h("div", { class: e[1] === me ? "me" : "" }, [h("i", { text: "Grades " + e[1] + (e[1] === me ? " · your child" : "") }), h("p", { text: "“" + e[2] + "”" }), h("a", { class: "small wl-ch", href: "/parents/challenges/#c=" + e[0], "data-wl-ch": e[0], text: "See this challenge (" + e[0] + ")" })]))));
  };
  redraws.push(draw); draw();
  s.append(pick, detail);
  s.appendChild(h("h3", { text: "How a challenge works" }));
  s.appendChild(h("div", { class: "steps" }, D.CHALLENGE_STEPS.map(x => h("div", null, [h("b", { text: x[0] }), x[1]]))));
  s.appendChild(card("", [h("p", { text: "Grades 2–8 aim for at least 2 passed challenges in each Life Skill a year. In K–1, every challenge is part of a Life Skill Lab, led by a guide with the whole group, and each child aims for 2 per Life Skill too." }), h("div", { class: "row" }, [h("a", { class: "btn", style: "text-decoration:none", href: "/parents/challenges/", text: "Explore the challenges" }), h("a", { class: "btn ghost", style: "text-decoration:none", href: "/parents/passoff/", text: "Passing off at home" })])]));
  return s;
}

function evidence() {
  const s = sec("evidence", "Why we <span>believe it</span>", "We lean on research, and we try not to oversell it. Each finding is rated by the strength of the study behind it, not by how much we like the result.");
  s.appendChild(h("div", { class: "chips" }, [["Strong", "Large or randomized studies, or reviews of many"], ["Moderate", "Real evidence with real limits"]].map(r => h("span", { class: "small" }, [h("span", { class: "ap-s ap-s-" + r[0], text: r[0] }), " " + r[1]]))));
  s.appendChild(h("div", { class: "grid g2" }, D.EVIDENCE.map(e => card("", [h("span", { class: "ap-s ap-s-" + e.s, text: e.s }), h("h3", { text: e.t }), h("p", { text: e.what }), h("p", { class: "small", text: e.limit }), h("p", { class: "small" }, [ext(e.src[0], e.src[1])].concat(e.src2 ? [" · ", ext(e.src2[0], e.src2[1])] : []))]))));
  s.appendChild(card("P-edge", [h("h3", { text: "What we don't know yet" }), ul(D.UNKNOWN), h("p", { class: "small" }, [ext(D.UNKNOWN_SRC[0], D.UNKNOWN_SRC[1])])]));
  s.appendChild(h("p", { class: "dim", text: "If you read something that makes you question part of our approach, tell us. We'd rather hear it than have you wonder." }));
  return s;
}

function words() {
  const s = sec("words", "Words we <span>use</span>", "Your child will come home saying things like “I got a not yet on my Epic.” Here's what they mean.");
  const q = h("input", { type: "search", placeholder: "Search a word, like Blaze", "aria-label": "Search words" });
  const list = h("dl", { class: "ap-words" });
  const draw = () => { const t = q.value.trim().toLowerCase(); list.innerHTML = ""; const hits = D.WORDS.filter(w => !t || (w[0] + " " + w[1]).toLowerCase().includes(t)); hits.forEach(w => list.append(h("dt", { text: w[0] }), h("dd", { text: w[1] }))); if (!hits.length) list.append(h("dd", { text: "No match. Ask your child's guide, and we'll add it here." })); };
  q.oninput = draw; draw();
  s.append(q, list);
  return s;
}

function refresher() {
  const s = sec("refresher", "The one-minute <span>refresher</span>", "The Parent Education Night overview, condensed.");
  s.appendChild(pairs(D.REFRESHER));
  s.appendChild(card("", [h("p", { html: "Next: <a href=\"/parents/series/\">Field Notes</a>, the books, podcasts and talks behind Wilderland, with big ideas, questions to talk about, and where you'll see each one at school." })]));
  return s;
}

/* ---------- build ---------- */
const nav = $("#nav");
SECTIONS.forEach(([id, label]) => nav.appendChild(h("a", { href: "#" + id, text: label })));
const app = $("#app"); app.innerHTML = "";
const main = h("div", { class: "view ap-page" });
[intro(), pillars(), help(), mornings(), skills(), evidence(), words(), refresher()].forEach(x => main.appendChild(x));
app.appendChild(main);
// This page is one long scroll, so Previous / Next between its own sections only moved a few pixels (the next section
// starts right below). The section menu does that job. Only the last section gets a Next, to the next page.
{
  const last = document.getElementById(SECTIONS[SECTIONS.length - 1][0]);
  if (last) last.appendChild(h("nav", { class: "pager noprint", "aria-label": "Next page" }, [h("span"), h("a", { class: "pg next", href: "/parents/athome/" }, [h("small", { text: "Next →" }), h("b", { text: "Wilderland at Home" })])]));
}

// scroll spy: highlight the section nearest the top of the screen
const links = [...nav.querySelectorAll("a")];
const spy = () => {
  let cur = "";
  for (const [id] of SECTIONS) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 140) cur = id; }
  links.forEach(a => { if (a.getAttribute("href") === "#" + cur) { if (!a.hasAttribute("aria-current")) { a.setAttribute("aria-current", "location"); const n = a.parentElement; if (n.scrollWidth > n.clientWidth) n.scrollTo({ left: a.offsetLeft - n.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" }); } } else a.removeAttribute("aria-current"); });
};
addEventListener("scroll", spy, { passive: true }); spy();
if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
