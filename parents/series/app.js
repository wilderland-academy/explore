// Field Notes: the parent education series. Three featured books, then books, podcasts and talks (each opening to a full
// entry at #<id> with big ideas, where you'll see it at school, where we part ways, questions and one thing to try),
// then lighter reading (READS) on the microschool movement, Alpha, and research we keep coming back to.
// Static, no sign-in, unlisted. Filters live in memory only.
import * as D from "./data.js";

const $ = s => document.querySelector(s);
function h(tag, attrs, kids) { const e = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]); } (kids || []).forEach(c => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
const card = (cls, kids) => h("div", { class: "card " + (cls || "") }, kids);
const ext = (text, href) => h("a", { href, target: "_blank", rel: "noopener", text });
const app = $("#app");
const byId = Object.fromEntries(D.ITEMS.map((x, i) => [x.id, Object.assign(x, { n: i + 1 })]));
let kind = "all", method = "all";
const byline = x => x.by + (x.yr ? " · " + x.yr : "");

function route() {
  const id = decodeURIComponent(location.hash.slice(1));
  const y = route.last === id ? window.scrollY : 0; route.last = id;
  app.innerHTML = "";
  if (byId[id]) entry(byId[id]); else grid();
  window.scrollTo(0, byId[id] ? 0 : (route.gridY || y));
  document.title = (byId[id] ? byId[id].t + " · " : "") + "Field Notes · Wilderland families";
}
addEventListener("hashchange", () => { if (!byId[decodeURIComponent(location.hash.slice(1))]) route.gridY = route.gridY || 0; route(); });

const mtags = x => h("div", { class: "fn-tags" }, x.here.map(([k]) => h("span", { class: "fn-m", text: D.METHODS[k].n })));

function tile(x, big) {
  return h("a", { class: "fn-tile" + (big ? " big" : ""), href: "#" + x.id, onclick: () => { route.gridY = window.scrollY; } }, [
    h("div", { class: "fn-top" }, [h("span", { class: "fn-no", text: String(x.n).padStart(2, "0") }), h("span", { class: "tag", text: x.kind }), x.len && x.kind !== "Book" ? h("span", { class: "fn-len", text: x.len }) : null, D.START.includes(x.id) ? h("span", { class: "tag M", text: "Start here" }) : null]),
    h("b", { class: "fn-t", text: x.t }), h("span", { class: "fn-by", text: byline(x) }),
    h("p", { text: x.why }), mtags(x), h("span", { class: "fn-go", text: (x.kind === "Book" ? "Read" : "Open") + " the notes →" })
  ]);
}

function grid() {
  const v = h("section", { class: "view" });
  v.appendChild(h("h1", { html: "Field <span>Notes</span>" }));
  v.appendChild(h("p", { class: "lede", text: "The books, podcasts and talks behind Wilderland. Each one has the big ideas, where you'll see them at school, questions to talk about at home, and one thing to try this week." }));
  v.appendChild(h("p", { class: "dim", text: "New here? Start with these three: one to read, one to listen to, one to watch. Most podcasts and talks run under 45 minutes." }));
  // start here
  v.appendChild(h("h2", { text: "Start here" }));
  v.appendChild(h("div", { class: "fn-grid fn-start" }, D.START.map(id => tile(byId[id], true))));
  // the questions families ask most
  v.appendChild(h("h2", { id: "questions", text: "The questions families ask us most" }));
  v.appendChild(h("p", { class: "dim", text: "Some of what we do is unusual, and families ask about it. For each, here's what we read, including at least one piece that pushes back." }));
  Object.entries(D.ASK_GROUPS).forEach(([gk, [title, lede]]) => {
    v.appendChild(h("h3", { id: "ask-" + gk, class: "fn-askh", text: title }));
    v.appendChild(h("p", { class: "dim", text: lede }));
    v.appendChild(h("div", { class: "fn-reads" }, D.ASKS.filter(r => r.g === gk).map(readCard)));
  });
  // filters
  v.appendChild(h("h2", { text: "Read, listen, watch" }));
  v.appendChild(h("p", { class: "dim", text: "A short shelf of other books we love, plus podcasts and talks our team keeps sharing." }));
  const f1 = h("div", { class: "chips", role: "group", "aria-label": "Type" });
  const f2 = h("div", { class: "fn-filter" });
  const sel = h("select", { "aria-label": "Show what's behind a Wilderland practice" }, [h("option", { value: "all", text: "Any Wilderland practice" })].concat(Object.entries(D.METHODS).map(([k, m]) => h("option", { value: k, text: m.n }))));
  sel.value = method;
  sel.onchange = () => { method = sel.value; draw(); };
  f2.append(h("label", { class: "small", text: "Behind which practice?" }), sel);
  const note = h("p", { class: "small" });
  const g = h("div", { class: "fn-grid" });
  const draw = () => {
    f1.innerHTML = "";
    [["all", "All"], ["Books", "Books"], ["Listen", "Listen"], ["Watch", "Watch"]].forEach(([k, n]) => f1.appendChild(h("button", { class: "chip", "aria-pressed": String(kind === k), text: n + " (" + D.ITEMS.filter(x => (k === "all" || D.KINDS[x.kind] === k) && (method !== "all" || !D.START.includes(x.id))).length + ")", onclick: () => { kind = k; draw(); } })));
    const hits = D.ITEMS.filter(x => (method !== "all" || !D.START.includes(x.id)) && (kind === "all" || D.KINDS[x.kind] === kind) && (method === "all" || x.here.some(([k]) => k === method)));
    note.textContent = method === "all" ? "" : D.METHODS[method].n + ": " + D.METHODS[method].d;
    g.innerHTML = "";
    mix(hits).forEach(x => g.appendChild(tile(x)));
    if (!hits.length) g.appendChild(card("", [h("p", { text: "Nothing in that combination. Try “All.”" })]));
  };
  draw();
  v.append(f1, f2, note, g);
  // lighter reading
  Object.entries(D.READ_GROUPS).forEach(([gk, [title, lede]]) => {
    v.appendChild(h("h2", { id: "read-" + gk, text: title }));
    v.appendChild(h("p", { class: "dim", text: lede }));
    v.appendChild(h("div", { class: "fn-reads" }, D.READS.filter(r => r.g === gk).map(readCard)));
  });
  v.appendChild(card("", [h("p", { html: `More books we love are on our <a href="${D.INSPIRATION}" target="_blank" rel="noopener">Inspiration list</a>; look for them at the Weber County Library or on Libby. For how it all fits together at school, see <a href="/parents/approach/">Our Approach</a>.` })]));
  app.appendChild(v);
}

// One linked card for a lighter read (READS) or a question-topic piece (ASKS).
function readCard(r) {
  return h("a", { class: "fn-read", href: r.url, target: "_blank", rel: "noopener" }, [
    h("span", { class: "fn-src", text: [r.src, r.d].filter(Boolean).join(" · ") }), h("b", { text: r.t }), r.by ? h("span", { class: "fn-by", text: r.by }) : null, h("p", { text: r.why }), h("span", { class: "fn-go", text: r.go || "Read it ↗" })
  ]);
}
// Interleave books, listens and watches so one kind never fills the top of the shelf. Order within a kind is kept.
function mix(list) {
  const by = {}; list.forEach(x => (by[D.KINDS[x.kind]] ||= []).push(x));
  const lanes = ["Listen", "Books", "Watch"].map(k => by[k] || []), out = [];
  while (lanes.some(l => l.length)) lanes.forEach(l => { if (l.length) out.push(l.shift()); });
  return out;
}

function entry(x) {
  const v = h("article", { class: "view fn-entry" });
  v.appendChild(h("a", { class: "small", href: "#", text: "← All Field Notes" }));
  v.appendChild(h("div", { class: "fn-top" }, [h("span", { class: "fn-no", text: "No. " + String(x.n).padStart(2, "0") }), h("span", { class: "tag", text: x.kind }), x.len && x.kind !== "Book" ? h("span", { class: "fn-len", text: x.len }) : null, h("span", { class: "tag", text: D.THEMES[x.theme] })]));
  v.appendChild(h("h1", { text: x.t }));
  v.appendChild(h("p", { class: "dim fn-sub", text: x.sub }));
  v.appendChild(h("p", { class: "fn-byline", text: byline(x) }));
  v.appendChild(card("M-edge", [h("span", { class: "tag M", text: "Why it matters to us" }), h("p", { class: "fn-why", text: x.why })]));
  v.appendChild(h("h2", { text: "Big ideas" }));
  v.appendChild(h("ol", { class: "fn-ideas" }, x.ideas.map(t => h("li", { text: t }))));
  if (x.context) v.appendChild(h("p", { class: "dim", text: x.context }));
  v.appendChild(h("h2", { text: "Where you'll see it at Wilderland" }));
  v.appendChild(h("div", { class: "fn-here" }, x.here.map(([k, t]) => h("div", null, [h("b", { text: D.METHODS[k].n }), h("span", { text: t })]))));
  if (x.differ) v.appendChild(card("P-edge", [h("h3", { text: "Where we part ways" }), h("p", { text: x.differ })]));
  if (x.know) v.appendChild(card("E-edge", [h("h3", { text: "Worth knowing" }), h("p", { text: x.know.t }), x.know.src ? h("p", { class: "small" }, [ext(x.know.src[0], x.know.src[1])]) : null]));
  v.appendChild(h("h2", { text: "Talk about it" }));
  v.appendChild(h("ul", { class: "fn-ask" }, x.ask.map(t => h("li", { text: t }))));
  v.appendChild(card("fn-try", [h("span", { class: "tag M", text: "Try this week" }), h("p", { text: x.tryit })]));
  const find = x.link ? [ext(x.link[0], x.link[1])] : [];
  if (x.kind === "Book") find.push(find.length ? " · " : "", "Find it at the library or on Libby");
  if (x.kind === "Book") find.push(" · ", ext("Our Inspiration list", D.INSPIRATION));
  v.appendChild(h("p", { class: "small" }, find));
  // prev / next
  const i = D.ITEMS.indexOf(x), prev = D.ITEMS[i - 1], nxt = D.ITEMS[i + 1];
  v.appendChild(h("div", { class: "fn-pn" }, [prev ? h("a", { class: "btn ghost", style: "text-decoration:none", href: "#" + prev.id, text: "← " + prev.t }) : h("span"), nxt ? h("a", { class: "btn", style: "text-decoration:none", href: "#" + nxt.id, text: nxt.t + " →" }) : h("a", { class: "btn", style: "text-decoration:none", href: "#", text: "Back to all →" })]));
  app.appendChild(v);
}

route();
