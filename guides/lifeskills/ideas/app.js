// Skill Lab ideas (staff): our Epic Labs plus every workshop in the workshop ledger, filterable by band, length, guide
// prep, cost, Life Skill and source, each with links to learn more. Data and what each field means: ideas.js.
// "Build a Lab from this" opens the Lab builder on that idea (/guides/lifeskills/builder/?idea=<id> or ?epic=<id>).
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";
import { LIBRARY as IDEAS, SOURCES, LEDGER_URL } from "./ideas.js";

const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const GUESTS = ["ian@silverlineventures.com", "online@bodyform.com", "ian.silverberg@gmail.com"];   // keep in step with auth.js
const BANDS = ["K–1", "2–4", "5–8"];
const LEN = [["day", "A day or less"], ["short", "1–2 weeks"], ["mid", "3–5 weeks"], ["session", "6–8 weeks (a session)"], ["year", "All year"]];
const PREP = [["low", "Light prep", "under 1 hr a week"], ["med", "Some prep", "1–3 hrs a week"], ["high", "Heavy prep", "3+ hrs a week or booking a partner"]];
const COST = [[1, "Under $50"], [2, "$50–300"], [3, "$300–1,000"], [4, "Over $1,000"]];
const SRC = { epic: "Our Epic Labs", named: "Named workshops", described: "Described workshops", high: "High school", summer: "Summer camps", second: "Secondhand, unconfirmed", gt: "GT School" };
const W = window.WL || { skills: [] };
const SKILL = Object.fromEntries((W.skills || []).map(s => [s.k, s]));

const $ = s => document.querySelector(s);
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c);
  return e;
}
const app = $("#app");
const mine = () => { const b = window.wlBand ? window.wlBand({ all: true }) : "All"; return BANDS.includes(b) ? b : ""; };
const f = { band: mine(), bandPicked: false, len: new Set(), prep: new Set(), cost: new Set(), k: "", src: "", q: "", sort: "list" };
document.addEventListener("wl-role", () => { if (!f.bandPicked && f.band !== mine()) { f.band = mine(); if (started) draw(); } });
let started = false, seq = 0;

/* ---------------- sign-in ---------------- */
function gate(msg) { started = false; app.replaceChildren(el("section", { class: "wrap gate2" }, el("div", { class: "panel" }, el("h2", { text: "Wilderland staff area" }), el("p", { text: msg })))); }
async function onAuth(u, db) {
  const my = ++seq;
  if (!u) return gate("Sign in with your Wilderland account, top right, to browse Skill Lab ideas.");
  const email = (u.email || "").toLowerCase();
  let ok = ADMINS.includes(email) || GUESTS.includes(email);
  if (!ok) { try { ok = (await getDoc(doc(db, "staff", email))).exists(); } catch (e) { ok = false; } }
  if (my !== seq) return;
  if (!ok) return gate("This area is for Wilderland guides and staff. If that's you, ask Alex to add your account.");
  started = true; draw();
}
(async () => {
  while (!window.wlFirebase) await new Promise(r => setTimeout(r, 50));
  const db = getFirestore(window.wlFirebase.app);
  document.addEventListener("wl-auth", e => onAuth(e.detail, db));
  const a = window.wlFirebase.auth; if (a.authStateReady) { await a.authStateReady(); onAuth(a.currentUser, db); }
})();

/* ---------------- the list ---------------- */
const norm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
function shown() {
  const q = norm(f.q).split(/\s+/).filter(Boolean);
  let list = IDEAS.filter(x => (!f.band || x.b.includes(f.band)) && (!f.len.size || f.len.has(x.len)) && (!f.prep.size || f.prep.has(x.prep)) && (!f.cost.size || f.cost.has(x.cost)) && (!f.k || x.k === f.k) && (!f.src || x.src === f.src)
    && (!q.length || q.every(w => norm([x.t, x.d, x.n, (SKILL[x.k] || {}).n].join(" ")).includes(w))));
  const PR = { low: 0, med: 1, high: 2 }, LN = Object.fromEntries(LEN.map((l, i) => [l[0], i]));
  if (f.sort === "cost") list = list.slice().sort((a, b) => a.cost - b.cost || PR[a.prep] - PR[b.prep]);
  if (f.sort === "prep") list = list.slice().sort((a, b) => PR[a.prep] - PR[b.prep] || a.cost - b.cost);
  if (f.sort === "len") list = list.slice().sort((a, b) => LN[a.len] - LN[b.len]);
  if (f.sort === "az") list = list.slice().sort((a, b) => a.t.localeCompare(b.t));
  return list;
}
const chip = (on, text, onclick, title) => el("button", { class: "chip", type: "button", "aria-pressed": String(!!on), title, onclick }, text);
const toggle = (set, v) => { set.has(v) ? set.delete(v) : set.add(v); draw(); };
function builderLink(x) {
  if (x.src === "epic") return "/guides/lifeskills/builder/?epic=" + encodeURIComponent(x.id);
  const band = f.band || (x.b.length === 1 ? x.b[0] : "");
  return "/guides/lifeskills/builder/?" + new URLSearchParams({ idea: x.id, ...(band ? { band } : {}) }).toString();
}
// The Epic Lab's plan, folded away.
function epicDetails(e) {
  return el("details", {}, el("summary", { text: "How it hits the Scorecard" }),
    el("dl", {}, [["High standards", e.standards], ["High support", e.support], ["High autonomy", e.autonomy], ["Skill Validation", e.test], ["Showcase", e.showcase], ["Safety", e.safety], ["Worth knowing", e.note]].flatMap(([k, v]) => v ? [el("dt", { text: k }), el("dd", { text: v })] : [])));
}
function card(x) {
  const sk = SKILL[x.k] || { n: x.k, col: "#4d4d51" };
  const tag = (t, cls) => el("span", { class: "tag " + (cls || "") }, t);
  return el("article", { class: "idea" },
    el("div", { class: "idea-top" }, el("span", { class: "sw", style: `background:${sk.col}`, "aria-hidden": "true" }), el("span", { class: "sk", text: sk.n })),
    el("h3", { text: x.t }),
    el("p", { class: "d", text: x.d }),
    x.n ? el("p", { class: "n" }, el("b", { text: "For us: " }), x.n) : null,
    el("div", { class: "tags" },
      tag("Grades " + x.b.join(", ")),
      tag(x.weeks || LEN.find(l => l[0] === x.len)[1]),
      tag(PREP.find(p => p[0] === x.prep)[1]),
      tag(COST.find(c => c[0] === x.cost)[1])),
    x.e ? epicDetails(x.e) : null,
    (x.s || []).length ? el("p", { class: "src" }, "Learn more: ", (x.s || []).filter(k => SOURCES[k]).flatMap((k, i) => [i ? " · " : "", el("a", { href: SOURCES[k][1], target: "_blank", rel: "noopener" }, SOURCES[k][0])])) : null,
    x.src === "epic" ? el("p", { class: "src", text: "One of our Epic Labs" }) : x.src === "second" ? el("p", { class: "src", text: "Secondhand: not confirmed" }) : null,
    el("a", { class: "btn", href: builderLink(x) }, "Build a Lab from this"));
}
function draw() {
  const list = shown();
  const search = el("input", { type: "search", class: "in", id: "iq", placeholder: "Search ideas: climbing, sell, podcast…", value: f.q, "aria-label": "Search ideas" });
  search.addEventListener("input", e => { f.q = e.target.value; drawList(); });
  const skillSel = el("select", { class: "in", id: "ik", "aria-label": "Life Skill", onchange: e => { f.k = e.target.value; draw(); } },
    el("option", { value: "", text: "All Life Skills" }), (W.skills || []).map(s => el("option", { value: s.k, text: s.n, selected: f.k === s.k ? "" : null })));
  const srcSel = el("select", { class: "in", id: "is", "aria-label": "Source", onchange: e => { f.src = e.target.value; draw(); } },
    el("option", { value: "", text: "Every source" }), Object.entries(SRC).map(([k, t]) => el("option", { value: k, text: t, selected: f.src === k ? "" : null })));
  const sortSel = el("select", { class: "in", id: "isort", "aria-label": "Sort", onchange: e => { f.sort = e.target.value; draw(); } },
    [["list", "Ledger order"], ["cost", "Cheapest first"], ["prep", "Least prep first"], ["len", "Shortest first"], ["az", "A to Z"]].map(([k, t]) => el("option", { value: k, text: t, selected: f.sort === k ? "" : null })));
  const any = f.len.size || f.prep.size || f.cost.size || f.k || f.src || f.q || f.band !== mine();
  const listBox = el("div", { id: "ilist" });
  const count = el("p", { class: "small muted", id: "icount", "aria-live": "polite" });
  const drawList = () => {
    const l = shown();
    count.textContent = `${l.length} of ${IDEAS.length} ideas`;
    // Nothing in this band? Say how many the other bands have, one tap away.
    const other = !l.length && f.band ? (() => { const b = f.band; f.band = ""; const n = shown().length; f.band = b; return n; })() : 0;
    listBox.replaceChildren(l.length ? el("div", { class: "ideas" }, l.map(card)) : el("p", { class: "empty" }, "No ideas match. ",
      other ? el("button", { class: "btn plain", type: "button", onclick: () => { f.band = ""; f.bandPicked = true; draw(); } }, `Show ${other} in other bands`) : "Clear a filter or two."));
  };
  app.replaceChildren(
    el("div", { class: "wrap page-head" },
      el("h1", { text: "Skill Lab ideas" }),
      el("p", {}, `${IDEAS.length} Skill Lab ideas: our own Epic Labs, plus workshops and life-skills challenges other schools have run. Grades, length, prep and cost are our estimates for a crew of about 12. Pick one and build a Lab from it, or see `, el("a", { href: "/guides/lifeskills/playbook/" }, "how Labs run"), ".")),
    el("section", { class: "band" }, el("div", { class: "wrap stack" },
      el("div", { class: "filters" },
        el("div", { class: "frow" }, search),
        el("div", { class: "frow" }, el("span", { class: "lbl", text: "Grades" }), el("div", { class: "chips" }, chip(!f.band, "All", () => { f.band = ""; f.bandPicked = true; draw(); }), BANDS.map(b => chip(f.band === b, b, () => { f.band = b; f.bandPicked = true; draw(); })))),
        el("div", { class: "frow" }, el("span", { class: "lbl", text: "Length" }), el("div", { class: "chips" }, LEN.map(([k, t]) => chip(f.len.has(k), t, () => toggle(f.len, k))))),
        el("div", { class: "frow" }, el("span", { class: "lbl", text: "Prep" }), el("div", { class: "chips" }, PREP.map(([k, t, s]) => chip(f.prep.has(k), t, () => toggle(f.prep, k), s)))),
        el("div", { class: "frow" }, el("span", { class: "lbl", text: "Cost" }), el("div", { class: "chips" }, COST.map(([k, t]) => chip(f.cost.has(k), t, () => toggle(f.cost, k))))),
        el("div", { class: "frow sel3" }, skillSel, srcSel, sortSel),
        el("div", { class: "row" }, count, any ? el("button", { class: "btn plain", type: "button", onclick: () => { Object.assign(f, { band: mine(), bandPicked: false, k: "", src: "", q: "", sort: "list" }); f.len.clear(); f.prep.clear(); f.cost.clear(); draw(); } }, "Clear filters") : null)),
      listBox,
      el("p", { class: "small muted" }, "Gathered from school sites, podcasts, news and parent accounts as of Oct 1, 2026 (", el("a", { href: LEDGER_URL, target: "_blank", rel: "noopener" }, "full source list"), "). Prep and cost assume what we already have on campus.")))
  );
  drawList();
  if (document.activeElement === document.body && f.q) $("#iq")?.focus();
}
