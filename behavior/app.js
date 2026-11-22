// Behavior Guide (staff only). The valley floor under the Mentor Mindset Field Guide: table stakes, not the climb. Sign-in comes from /auth.js. Content lives in data.js.
// Firestore: flStudents (+ /history) for Freedom Levels, townhall + townhallAgenda for Town Hall,
// behaviorProgress for training badges, behaviorProposals for the living document. AI goes through the
// same relay as the Mentor Mindset Field Guide (address saved in mentorConfig/main).
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, addDoc, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";
import * as D from "./data.js";
import { coachLog, autosaver } from "/guides/log.js";

const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function h(tag, attrs, kids) { const e = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]); } (kids || []).forEach(c => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
const ul = items => h("ul", null, items.map(t => h("li", { text: t })));
const ol = items => h("ol", null, items.map(t => h("li", { text: t })));
const card = (cls, kids) => h("div", { class: "card " + (cls || "") }, kids);
const tag = (k, t) => h("span", { class: "tag " + k, text: t });
const local = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const app = $("#app");
let fb, db, user = null, isAdmin = false, relay = "", startedFor = null, authSeq = 0;
const me = () => (user && user.email || "").toLowerCase();
const myName = () => ((user && user.displayName) || me().split("@")[0]).split(" ")[0];
const ms = ts => !ts ? 0 : typeof ts === "number" ? ts : ts.toDate ? ts.toDate().getTime() : ts.seconds ? ts.seconds * 1000 : 0;
const fmtDate = ts => { const t = ms(ts); return t ? new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: new Date(t).getFullYear() === new Date().getFullYear() ? undefined : "numeric" }) : ""; };
const daysAgo = ts => { const t = ms(ts); return t ? Math.floor((Date.now() - t) / 864e5) : null; };
function toast(t) { document.querySelectorAll(".toast").forEach(x => x.remove()); const m = h("div", { class: "toast", text: t }); document.body.appendChild(m); setTimeout(() => m.remove(), 4500); }
const STRENGTH = { strong: "strong evidence", moderate: "moderate evidence", mixed: "mixed evidence", thin: "thin evidence" };
// The guide's band in this file's own spelling (K-1, 2-4, 5-8), or "all" for admins and guests without one.
const myKey = all => ({ "K–1": "K-1", "2–4": "2-4", "5–8": "5-8" }[window.wlBand ? window.wlBand({ all }) : "All"] || (all ? "all" : "5-8"));
// Start on the guide's own policy: K–1 guides on K–1, everyone else on grades 2–8 (from /wlnav.js). A choice made
// here holds until the page is left.
const myPolicy = () => window.wlBand && window.wlBand() === "K–1" ? "k1" : "up";
let band = myPolicy(), bandPicked = false;
document.addEventListener("wl-role", () => { if (!bandPicked && myPolicy() !== band) { band = myPolicy(); drawBand(); if (typeof route === "function") route(); } });
const isK1 = () => band === "k1";
const B = (o, k) => isK1() && k ? Object.assign({}, o, k) : o;
const k1Box = t => t ? h("div", { class: "k1note" }, [h("b", { text: "K–1" }), h("span", { text: t })]) : null;
function drawBand() {
  document.body.classList.toggle("k1", isK1());
  const w = $("#bandsw"); if (!w) return; w.innerHTML = "";
  w.append(h("span", { text: "Policy for" }), ...[["up", "Grades 2–8"], ["k1", "K–1"]].map(([k, t]) => h("button", { "aria-pressed": String(band === k), text: t, onclick: () => setBand(k) })));
}
function setBand(k) { band = k; bandPicked = true; local.set("bg-band", k); drawBand(); route(); }
const ndBox = t => t ? h("div", { class: "nd" }, [h("b", { text: "Different wiring" }), h("span", { text: t })]) : null;
const trapBox = t => t ? h("div", { class: "trap" }, [h("b", { text: "Watch out" }), h("span", { text: t })]) : null;
const refLinks = ids => ids && ids.length ? h("div", { class: "refs" }, ids.filter(id => D.REFS[id]).map(id => { const r = D.REFS[id]; return h("a", { class: "ref", href: r.u, target: "_blank", rel: "noopener", text: "📚 " + r.t + " · " + STRENGTH[r.s] }); })) : null;
const openLink = id => { const o = D.OPEN.find(x => x.id === id); return o ? h("a", { class: "openq", href: "#living/" + id, text: "⚑ Still open: " + o.q }) : null; };
const confirmTap = (btn, label, fn) => { btn.onclick = async () => { if (btn.dataset.sure !== "1") { btn.dataset.sure = "1"; btn.textContent = "Tap again to " + label; setTimeout(() => { btn.dataset.sure = ""; }, 4000); return; } await fn(); }; return btn; };

/* ---------------- sign-in gate ---------------- */
function gate(msg) { startedFor = null; $("#trail").hidden = true; app.innerHTML = ""; app.appendChild(h("section", { class: "view" }, [h("div", { class: "card gate" }, [h("h2", { text: "Wilderland staff area" }), h("p", { class: "dim", text: msg })])])); }
async function onAuth(u) {
  const seq = ++authSeq; user = u;
  if (!u) return gate("Sign in with your Wilderland account, top right, to open the Behavior Guide.");
  if (startedFor === u.uid) return;
  isAdmin = ADMINS.includes(me());
  let ok = isAdmin;
  if (!ok) { try { ok = (await getDoc(doc(db, "staff", me()))).exists(); } catch (e) { ok = false; } }
  if (seq !== authSeq) return;
  if (!ok) return gate("This area is for Wilderland guides and staff. If that's you, ask Alex to add your account.");
  try { const c = await getDoc(doc(db, "mentorConfig", "main")); relay = c.exists() ? (c.data().relay || "") : ""; } catch (e) { relay = ""; }
  if (seq !== authSeq) return;
  startedFor = u.uid; cache.students = null; cache.th = null; cache.agenda = null; loadProgress(); buildNav(); drawBand(); $("#trail").hidden = false; route();
}
(async () => {
  while (!window.wlFirebase) await new Promise(r => setTimeout(r, 50));
  fb = window.wlFirebase; db = getFirestore(fb.app);
  document.addEventListener("wl-auth", e => onAuth(e.detail));
  if (fb.auth.authStateReady) { await fb.auth.authStateReady(); onAuth(fb.auth.currentUser); }
})();

/* ---------------- AI through the relay ---------------- */
async function ai(messages, { system = "", tier = "deep", max = 1000 } = {}) {
  if (!relay) throw { code: "norelay" };
  const r = await fetch(relay, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + await user.getIdToken() }, body: JSON.stringify({ system, messages, tier, max }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw { code: r.status, message: j.error || "" };
  return j.text || "";
}
const aiErr = e => e && e.code === "norelay" ? "The AI isn't connected yet. An admin adds the relay address in the Mentor Mindset Field Guide's Admin stop." : e && e.code === 429 ? "The AI is busy. Wait a minute and try again." : (e && (e.code === 401 || e.code === 403)) ? "The AI relay didn't recognize your account. Sign out and back in, or ask an admin." : "The AI didn't answer. Try again in a moment.";

/* ---------------- routing ---------------- */
// [id, label, blurb, kind]: kind S = standard, T = toolkit, N = different wiring, D = data tools
const STOPS = [["map", "Start", "", ""], ["standard", "The Standard", "What every guide does the same way", "S"], ["tiers", "Tier ladder", "Sort by impact, with exact counts", "S"], ["freedom", "Freedom Levels", "Four domains, one rung at a time", "S"], ["knots", "Knots", "Real scenarios, untangled", "S"], ["toolkit", "Toolkit", "Methods you choose", "T"], ["wiring", "Different wiring", "Neurodivergent students", "N"], ["evidence", "Evidence", "What the research says, honestly", "T"], ["training", "Training", "Earn your behavior badges", "S"], ["coach", "Ask the coach", "Untangle your own situation", "T"], ["tracker", "Level tracker", "Weekly Freedom Level reviews", "D"], ["townhall", "Town Hall", "Student agenda items", "D"], ["living", "Living doc", "Open questions and proposals", "D"]];
function buildNav() { const nav = $("#nav"); nav.innerHTML = ""; STOPS.concat(isAdmin ? [["admin", "Admin"]] : []).forEach(s => nav.appendChild(h("a", { href: "#" + s[0], text: s[1] }))); }
const VIEWS = {};
function route() {
  if (!startedFor) return;
  let [v, sub] = location.hash.slice(1).split("/"); if (!VIEWS[v] || (v === "admin" && !isAdmin)) { v = "map"; sub = ""; }
  document.querySelectorAll("#nav a").forEach(a => { if (a.getAttribute("href") === "#" + v) { a.setAttribute("aria-current", "page");  } else a.removeAttribute("aria-current"); });
  const sec = h("section", { class: "view" }); app.innerHTML = ""; app.appendChild(sec); VIEWS[v](sec, decodeURIComponent(sub || "")); window.scrollTo(0, 0);
}
addEventListener("hashchange", route);
const head = (sec, title, lede) => { sec.appendChild(h("h1", { html: title })); if (lede) sec.appendChild(h("p", { class: "lede", text: lede })); };
const back = (sec, href, label) => sec.appendChild(h("a", { class: "chip noprint", href, text: "← " + label }));

/* ---------------- training progress ---------------- */
let progress = {};
async function loadProgress() {
  progress = local.get("bg-progress-" + (user && user.uid), {});
  try { const s = await getDoc(doc(db, "behaviorProgress", user.uid)); if (s.exists()) progress = Object.assign({}, progress, s.data().badges || {}); } catch (e) { }
}
async function saveBadge(id, score, total) {
  const prev = progress[id] || {}; const passed = score >= D.MODULES.find(m => m.id === id).pass;
  progress[id] = { best: Math.max(prev.best || 0, score), total, passed: !!(prev.passed || passed), at: Date.now() };
  local.set("bg-progress-" + user.uid, progress);
  try { await setDoc(doc(db, "behaviorProgress", user.uid), { name: user.displayName || me(), email: me(), badges: progress, certified: D.MODULES.every(m => progress[m.id] && progress[m.id].passed), updated: Date.now() }); } catch (e) { }
}
const earned = () => D.MODULES.filter(m => progress[m.id] && progress[m.id].passed).length;

/* ---------------- map ---------------- */
VIEWS.map = sec => {
  head(sec, "The Behavior <span>Guide</span>", "How we keep every child safe, in school, and getting along with others: the standards every guide holds the same way, the tools you choose with judgment, and support for neurodivergent students throughout.");
  // the peaks and the valley
  const pn = h("div", { class: "pathnet" });
  pn.append(h("div", { class: "p" }, [h("span", { style: "font:800 11px var(--body);letter-spacing:.1em;text-transform:uppercase;opacity:.8", text: "The peaks · the climb to excellence" }), h("h2", { text: "The Mentor Mindset" }), h("p", { text: D.PATHNET.path }), h("a", { href: "/fieldguide/", text: "Go to the Mentor Mindset Field Guide →" })]),
    h("div", { class: "n" }, [h("span", { class: "tag S", text: "The valley · table stakes" }), h("h2", { text: "This site: Behavior" }), h("p", { class: "dim", text: D.PATHNET.net })]));
  sec.appendChild(pn);
  // prevention pyramid
  const pyr = `<svg viewBox="0 0 760 330" role="img" aria-label="Pyramid: the Mentor Mindset is the wide base for every child; the toolkit supports some; tier responses catch a few">
  <polygon points="380,18 470,98 290,98" fill="#b3263a"/><text x="380" y="80" text-anchor="middle" fill="#fff" font-weight="700" font-size="14">Tiers 2–3</text>
  <polygon points="290,104 470,104 560,184 200,184" fill="#8f5410"/><text x="380" y="140" text-anchor="middle" fill="#fff" font-weight="700" font-size="15">Toolkit and Tiers 0–1</text><text x="380" y="161" text-anchor="middle" fill="#fff" font-size="12.5">some children, some days</text>
  <polygon points="200,190 560,190 680,300 80,300" fill="#0b3d2e"/><text x="380" y="235" text-anchor="middle" fill="#d5f367" font-weight="800" font-size="21">The Mentor Mindset</text><text x="380" y="260" text-anchor="middle" fill="#f3f7e6" font-size="13.5">every child, every interaction: high standards, high support, respect</text><text x="380" y="282" text-anchor="middle" fill="#f3f7e6" font-size="12.5" opacity=".85">plus a predictable day and expectations we teach</text>
  <text x="600" y="60" fill="#5b6575" font-size="12.5">fewer children need these</text><path d="M596 56 476 70" stroke="#5b6575" stroke-dasharray="3 4"/>
  <text x="20" y="325" fill="#5b6575" font-size="11.5">Shape adapted from the Pyramid Model and PBIS: prevention for all at the base, more intensive help for fewer children above it.</text></svg>`;
  sec.appendChild(card("", [h("h2", { text: "Where your time goes" }), h("p", { class: "dim", text: "The base does most of the work. When the Mentor Mindset is practiced consistently, fewer children ever reach the top. If you only have time to get better at one thing this month, make it the base." }), h("div", { class: "pyr", html: pyr }), refLinks(["pyramid"])]));
  // band
  sec.appendChild(card(isK1() ? "K-edge" : "", [h("h3", { text: "Which policy are you reading?" }), h("p", { class: "dim", text: "K–1 keeps the same values with different mechanics: taught expectations, in-the-moment responses, same-day repairs and family updates. Pick your band. Every page follows it." }), h("div", { class: "chips" }, [["up", "Grades 2–8"], ["k1", "K–1 (lower campus)"]].map(([k, t]) => h("button", { class: "chip", "aria-pressed": String(band === k), text: t, onclick: () => setBand(k) })))]));
  if (isK1()) sec.appendChild(k1Compare());
  // valley map: the peaks above are the Mentor Mindset; the stops here sit on the valley floor
  const isl = STOPS.slice(1), col = { S: "#1d4e89", T: "#8f5410", N: "#6a4bb0", D: "#8a6100" };
  const pts = isl.map((_, i) => i < 6 ? [110 + i * 136, 318 + (i % 2 ? 16 : -8)] : [790 - (i - 6) * 136, 458 + ((i - 6) % 2 ? -14 : 10)]);
  const route = "M" + pts.slice(0, 6).map(p => p.join(" ")).join(" L") + " C 880 " + (pts[5][1] + 20) + " 880 " + (pts[6][1] - 30) + " " + pts[6].join(" ") + " L" + pts.slice(6).map(p => p.join(" ")).join(" L");
  const tree = (x, y, k = 1) => `<path d="M${x} ${y - 22 * k}l${9 * k} ${16 * k}h${-18 * k}z M${x} ${y - 14 * k}l${11 * k} ${18 * k}h${-22 * k}z" fill="#3f6b4f"/>`;
  let svg = `<svg viewBox="0 0 900 560" role="img" aria-label="Valley map of the Behavior Guide, with the Mentor Mindset peaks above">
  <defs><linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0ea"/><stop offset="1" stop-color="#eef2ec"/></linearGradient></defs>
  <rect width="900" height="560" fill="url(#vsky)"/>
  <a href="/fieldguide/" aria-label="The peaks: Mentor Mindset Field Guide">
    <path d="M0 210 90 120 150 160 250 50 330 130 420 70 470 20 540 100 610 60 700 140 780 80 900 170 900 280 0 280Z" fill="#0b3d2e"/>
    <path d="M250 50 232 74 250 68 268 76Z M470 20 450 46 470 40 490 48Z M780 80 764 102 780 96 796 104Z" fill="#fff"/>
    <circle cx="470" cy="20" r="6" fill="#d5f367"/>
    <rect x="540" y="14" width="236" height="28" rx="14" fill="#d5f367"/><text x="658" y="33" text-anchor="middle" style="font:800 13.5px Inter;fill:#0b2b20;stroke:none">▲ The peaks: Mentor Mindset ↗</text>
  </a>
  <path d="M0 225C120 200 200 250 300 238S520 210 600 232 780 250 900 222V560H0Z" fill="#9db48a"/>
  <path d="M0 255C150 240 260 268 450 262S760 240 900 258V560H0Z" fill="#dfe4c7"/>
  <path d="M470 236C430 300 520 340 450 390S380 470 470 560" fill="none" stroke="#9cc3d6" stroke-width="16" stroke-linecap="round" opacity=".8"/>
  ${tree(40, 300) + tree(66, 312, .8) + tree(850, 300) + tree(826, 318, .85) + tree(320, 545, .8) + tree(860, 540, .9) + tree(300, 400, .7) + tree(620, 395, .75)}
  <g transform="translate(560 392)"><rect x="-22" y="-16" width="44" height="26" fill="#fffdf8" stroke="#15263d" stroke-width="2"/><path d="M-28 -16 0 -36 28 -16Z" fill="#b4532a" stroke="#15263d" stroke-width="2"/><rect x="-5" y="-2" width="10" height="12" fill="#15263d"/></g>
  <g transform="translate(250 395)"><rect x="-14" y="-10" width="28" height="18" fill="#fffdf8" stroke="#15263d" stroke-width="2"/><path d="M-18 -10 0 -24 18 -10Z" fill="#1d4e89" stroke="#15263d" stroke-width="2"/></g>
  <text x="18" y="550" style="font:700 12px Inter;fill:#5b6575">The valley floor: where we all live together</text>
  <path d="${route}" fill="none" stroke="#15263d" stroke-width="2.5" stroke-dasharray="1 9" stroke-linecap="round" opacity=".7"/>`;
  isl.forEach((s, i) => { const [x, y] = pts[i]; const below = i >= 6; svg += `<a href="#${s[0]}" aria-label="${esc(s[1])}"><circle cx="${x}" cy="${y}" r="16" fill="${col[s[3]]}" stroke="#fffdf8" stroke-width="3"/><text class="n" x="${x}" y="${y + 4.5}" text-anchor="middle">${i + 1}</text><text x="${x}" y="${below ? y + 36 : y - 24}" text-anchor="middle">${esc(s[1])}</text></a>`; });
  sec.appendChild(h("div", { class: "map", html: svg + "</svg>" }));
  sec.appendChild(h("div", { class: "grid g3" }, [
    card("S-edge", [tag("S", "Standard"), h("p", { text: D.KINDS.standard.say })]),
    card("T-edge", [tag("T", "Toolkit"), h("p", { text: D.KINDS.toolkit.say })]),
    card("N-edge", [tag("N", "Different wiring"), h("p", { text: "Notes on neurodivergent students appear on nearly every page, in this color. The first principle is Inclusive Excellence." })])
  ]));
  const g = h("div", { class: "stops" });
  isl.forEach((s, i) => g.appendChild(h("a", { class: "stop " + s[3], href: "#" + s[0] }, [h("i", { text: (i + 1) + " · " + ({ S: "STANDARD", T: "TOOLKIT", N: "DIFFERENT WIRING", D: "TOOLS" }[s[3]]) }), h("b", { text: s[1] }), h("span", { text: s[2] })])));
  sec.appendChild(g);
  const tip = D.ND_TIPS[Math.floor(Date.now() / 864e5) % D.ND_TIPS.length];
  sec.appendChild(h("div", { class: "grid g2" }, [
    card("N-edge", [tag("N", "Today's different-wiring tip"), h("p", { style: "font:700 19px/1.35 var(--display)", text: tip })]),
    card("", [h("h3", { text: "Your badges" }), h("p", { class: "dim", text: earned() + " of " + D.MODULES.length + " earned. Earn all six to be certified on our behavior standards." }), h("a", { class: "btn", style: "align-self:flex-start;text-decoration:none", href: "#training", text: "Go to training" })])
  ]));
  sec.appendChild(card("", [h("h3", { text: "Something just happened?" }), h("p", { text: "Check the Tier ladder for what the standard requires, find a similar Knot, or describe it to the coach. If anyone is unsafe or a student mentions self-harm, stop and follow the Mental Health Crisis Policy first." }), h("p", { class: "small", html: "Edition " + esc(D.VERSION.n) + ", " + esc(D.VERSION.date) + ". This is a living document: see <a href=\"#living\">open questions and proposals</a>. Day-to-day conversations with students belong in the <a href=\"/fieldguide/\">Mentor Mindset Field Guide</a>." })]));
};
function k1Compare() {
  const t = h("table"); t.appendChild(h("tr", null, [h("th", { text: "" }), h("th", { text: "Grades 2–8" }), h("th", { style: "color:#a2481f", text: "K–1" })]));
  D.K1.diffs.forEach(r => t.appendChild(h("tr", null, [h("th", { text: r[0] }), h("td", { class: "dim", text: r[1] }), h("td", { style: "background:#fbeee6", text: r[2] })])));
  return card("K-edge", [tag("K", "K–1"), h("h2", { text: "Same values, different mechanics" }), h("p", { text: D.K1.intro }), h("div", { class: "scroll" }, [t]),
    h("h3", { text: "Why it's different" }), h("div", { class: "grid g2" }, D.K1.why.map(w => h("div", null, [h("b", { text: w[0] }), h("p", { class: "dim", text: w[1] }), refLinks([w[2]])])))]);
}

/* ---------------- the standard ---------------- */
VIEWS.standard = (sec, sub) => {
  head(sec, "The <span>Standard</span>", "Twelve practices every guide does the same way. Consistency is a form of fairness: a student should get the same answer from any adult on either campus.");
  sec.appendChild(card("", [h("p", { text: "The 2026-27 Community Accountability System (Guide Reference Edition) and the 2026-27 Freedom Level proposal are the sources for these rules. Where an older rule conflicts, the newer one wins here, and the conflict is listed in the Living doc." }), h("p", { class: "small", text: isK1() ? "Showing K–1. Cards marked K–1 differ from grades 2–8; the rest are the same in every band. The Tier 3 send-home rule is the same in every band." : "Showing grades 2–8. K–1 keeps the same values with different mechanics; switch to K–1 at the top to see them." })]));
  if (isK1()) sec.appendChild(k1Compare());
  const g = h("div", { class: "grid g2" });
  D.STANDARDS.forEach(s0 => { const k = D.K1.standards[s0.id], s = B(s0, k && Object.assign({ src: "K–1 version (Nov 2026), adapted from early-childhood research. Based on: " + s0.src }, k)); g.appendChild(card(isK1() && k ? "K-edge" : "S-edge", [h("div", { class: "row" }, [h("span", { style: "font-size:26px", text: s.icon }), tag("S", "Standard"), isK1() && k ? tag("K", "K–1 version") : null]), h("h3", { id: "s-" + s.id, text: s.name }), h("p", { class: "dim", text: s.short }), ul(s.rules), ndBox(s.nd), refLinks(s.research), s.open ? openLink(s.open) : null, h("p", { class: "small", text: "Source: " + s.src }), s.link ? h("a", { class: "chip", style: "align-self:flex-start", href: "#" + s.link, text: "Go deeper →" }) : null])); });
  sec.appendChild(g);
  if (sub) setTimeout(() => { const t = document.getElementById("s-" + sub); t && t.scrollIntoView({ block: "start" }); }, 30);
};

/* ---------------- tiers ---------------- */
VIEWS.tiers = sec => {
  head(sec, "The <span>Tier</span> ladder", "Sort by impact first. Intent, age, skill and history shape how you respond, not which tier it is.");
  let sel = 1; const ladder = h("div", { class: "ladder" }), detail = h("div"), TT = D.TIERS.map(t => B(t, D.K1.tiers[t.n]));
  if (isK1()) sec.appendChild(card("K-edge", [tag("K", "K–1"), h("p", { text: "Impact still sets the tier. In K–1, hitting, pushing or biting without injury is usually Tier 2, and injury or danger is Tier 3. Responses happen in the moment, and families hear the same day." }), refLinks(["aggress", "brief"])]));
  const draw = () => {
    ladder.innerHTML = ""; TT.forEach(t => ladder.appendChild(h("button", { class: "rung " + t.color, "aria-pressed": String(sel === t.n), onclick: () => { sel = t.n; draw(); } }, [h("div", { class: "num", text: String(t.n) }), h("div", null, [h("b", { text: "Tier " + t.n + " · " + t.name }), h("br"), h("span", { text: t.q })])])));
    const t = TT[sel]; detail.innerHTML = "";
    detail.appendChild(card("tierbox " + t.color, [h("h2", { text: "Tier " + t.n + ": " + t.name }), h("p", { style: "font:700 19px/1.35 var(--display);color:var(--paper)", text: t.voice }), h("div", { class: "grid g2" }, [h("div", null, [h("h3", { style: "color:var(--paper);margin-bottom:6px", text: "Looks like" }), ul(t.examples)]), h("div", null, [h("h3", { style: "color:var(--paper);margin-bottom:6px", text: "The standard response" }), ol(t.response)])]), h("div", { class: "say", style: "color:var(--paper)", text: "Moves up when: " + t.escalate }), ndBox(t.nd)]));
  };
  draw(); sec.append(card("", [h("p", { class: "small", text: "Tap a rung." }), ladder]), detail);
  if (isK1()) {
    sec.appendChild(card("K-edge", [tag("K", "K–1"), h("h2", { text: "Tier 1, in the moment" }), h("div", { class: "steps" }, [["Cue and redo", "A picture or gesture, then “Show me ___.”"], ["Next to the guide", "Work beside the guide for a bit. Framed as help."], ["Calm-down spot", "A minute or two within sight, then rejoin and try again."], ["End-of-day note", "One note home, with something that went well."]].map(x => h("div", null, [h("b", { text: x[0] }), x[1]]))), h("p", { class: "small", text: "Same Tier 1 behavior on 3 or more days in a school week: a family check-in." })]));
    sec.appendChild(card("", [h("h3", { text: "K–1 quick reference" }), h("div", { class: "scroll", html: "<table><tr><th>Situation</th><th>K–1 response</th></tr>" + [["Tier 0 → Tier 1", "After 2 cues and redos on the same behavior in one day, if it keeps affecting another child"], ["Tier 1", "Cue and redo · next to the guide · calm-down spot · one end-of-day note"], ["Tier 1 → family check-in", "Same behavior on 3 or more days in a school week"], ["Peace Talk", "Guide-led, under five minutes, at the peace table"], ["Tier 2", "Care for the hurt child · calm · same-day repair from the picture menu · family told the same day"], ["Tier 2 → Tier 3", "Someone is injured or in danger"], ["Tier 3", "Sent home for a full school day; picture story and drop-off meeting for the return"]].map(r => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>").join("") + "</table>" })]));
  } else {
    sec.appendChild(card("S-edge", [tag("S", "Standard"), h("h2", { text: "Tier 1 within one day" }), h("div", { class: "steps" }, [["Reminder", "Name the Code of Conduct expectation."], ["Closer to the guide", "Move near the guide; lose seating preference. Frame it as help."], ["Yellow card", "Text home."]].map(s => h("div", null, [h("b", { text: s[0] }), s[1]]))), h("p", { class: "small", text: "2 or more Tier 1s against the same student in a day: Peace Talk with the peace stone, plus an act of kindness before the offending student resumes scheduled work. Same Tier 1 behavior on 3 or more days in a school week: the guide may call a parent meeting." })]));
    sec.appendChild(card("", [h("h3", { text: "Quick reference: exact counts" }), h("div", { class: "scroll", html: "<table><tr><th>Situation</th><th>Exact parameter</th></tr>" + [["Tier 0 → Tier 1", "After 2 reminders on the same behavior in one day, if it continues and affects another student"], ["Tier 1 ladder", "1st reminder · 2nd proximity · 3rd yellow card and text home (within one day)"], ["Peace Talk + act of kindness", "2 or more Tier 1s against the same student in one day"], ["Tier 1 → parent meeting", "Same behavior on 3 or more days within one school week"], ["Tier 1 → Tier 2", "Continues after a yellow card and a Peace Talk, and causes actual harm"], ["SMART Restore due", "Signed off by the end of the following school day"], ["Tier 2 → parent email", "2 Tier 2s within one school week"], ["Tier 3", "Any single incident: immediate removal"], ["Escalating after failed repair", "Generally at least 2 documented attempts at Peace Talks, coaching or repair"]].map(r => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>").join("") + "</table>" })]));
  }
  sec.appendChild(card("", [h("h2", { text: "Tier 3: the way out and the way back" }), h("div", { class: "tl" }, (isK1() ? [["Safety", "Protect the hurt child and the group."], ["Sent home", "Right away. Never called a suspension."], ["A full day away", "The next school day too, if it happened late."], ["Family talk", "Parent-guide conversation before return."], ["Picture story", "Who meets them, what happens first."], ["Back with a repair", "Guide meets them at drop-off."]] : [["Safety", "Protect the harmed student and the group."], ["Sent home", "Right away. Never called a suspension."], ["A full day away", "The next school day too, if it happened late."], ["Family talk", "Parent-guide conversation before return."], ["Repair plan", "Agreed by everyone involved."], ["Back with a repair", "Their own Field Guide owns the return."]]).map(x => h("div", null, [h("b", { text: x[0] }), h("span", { class: "dim", text: x[1] })])))]));
  // tier sorter game
  const game = card("", []); let cur, streak = 0, best = local.get("bg-sort-best", 0), SRC = isK1() ? D.SORT_K1 : D.SORT, pool = shuffle(SRC);
  const next = () => { if (!pool.length) pool = shuffle(SRC); cur = pool.pop(); game.innerHTML = ""; game.append(h("h2", { text: "Tier sorter" + (isK1() ? " · K–1" : "") }), h("p", { class: "small", text: "Which tier? Streak " + streak + " · best " + best }), h("p", { class: "big", text: cur[0] }), h("div", { class: "tierbtns" }, TT.map(t => h("button", { class: t.color, onclick: () => answer(t.n) }, ["Tier " + t.n, h("span", { text: t.name })])))); };
  const answer = n => { const right = n === cur[1]; streak = right ? streak + 1 : 0; if (streak > best) { best = streak; local.set("bg-sort-best", best); } const t = TT[cur[1]]; game.innerHTML = ""; game.append(h("h2", { text: right ? "Yes." : "That one's Tier " + cur[1] + "." }), h("p", { class: "big", text: cur[0] }), h("p", { class: "dim", text: t.q }), h("div", { class: "row" }, [h("button", { class: "btn", text: "Next", onclick: next }), h("span", { class: "small", text: "Streak " + streak + " · best " + best })])); };
  next(); sec.appendChild(game);
  sec.appendChild(card("N-edge", [tag("N", "Different wiring"), h("h3", { text: "Can't, or won't?" }), h("p", { text: "Before you count anything, ask whether the student has the skill to do what you're asking right now, in this setting, with this noise level, at this time of day. If the answer is no, you're in Tier 0 territory: change the support, keep the standard." })]));
};

/* ---------------- freedom levels ---------------- */
VIEWS.freedom = sec => {
  head(sec, "<span>Freedom</span> Levels", "A picture of trust. It names how much independence a student has earned in one part of the day, and it grows or shrinks as their responsibility does. High standards, high support.");
  if (isK1()) sec.appendChild(card("K-edge", [tag("K", "K–1"), h("h2", { text: "In K–1: the Nature Walk only" }), ul(D.K1.standards.freedom.rules), h("p", { class: "small", text: "Montessori calls the rest “freedom within limits”: freedom is given and withdrawn in the moment, which is the timescale a five-year-old understands." }), refLinks(["brief"])]));
  // overview chart: what each level allows, by domain
  const doms = isK1() ? D.DOMAINS.filter(d => d.id === "walk") : D.DOMAINS;
  const fg = h("div", { class: "flgrid", style: isK1() ? "grid-template-columns:110px 1fr" : "" });
  fg.append(h("div", { class: "hd", text: "Level" }), ...doms.map(d => h("div", { class: "hd", text: d.name })));
  [4, 3, 2, 1].forEach(n => { fg.append(h("div", { class: "lvn", text: String(n) + (n === 3 ? "★" : "") }), ...doms.map(d => h("div", { class: "c l" + n, text: d.L[n] }))); });
  sec.appendChild(card("", [h("h2", { text: "The levels at a glance" }), h("p", { class: "small", text: "★ Everyone starts at 3. Darker means more independence. Each column moves on its own." }), h("div", { class: "scroll" }, [fg])]));
  sec.appendChild(h("div", { class: "grid g3" }, [card("", [h("h3", { text: "Start at 3" }), h("p", { class: "dim", text: "Every student starts at Level 3, the baseline, in every domain." })]), card("", [h("h3", { text: "Four separate domains" }), h("p", { class: "dim", text: "A child who's great with tools but still building academic stamina isn't penalized everywhere." })]), card("", [h("h3", { text: "Private, weekly" }), h("p", { class: "dim", text: "Reviewed weekly. Delivered at the one-on-one. Never posted as a ranking." })])]));
  const g = h("div", { class: "grid g2" });
  (isK1() ? D.DOMAINS.filter(d => d.id === "walk") : D.DOMAINS).forEach(d => g.appendChild(card("", [h("h2", { text: d.name }), h("p", { class: "dim", text: d.sub }), h("div", { class: "say", text: "Move up when you: " + d.up }), h("div", { class: "dom" }, [4, 3, 2, 1].map(n => h("div", { class: "lv" + (n === 3 ? " base" : "") }, [h("b", { text: String(n) }), h("span", { text: d.L[n] + (n === 3 ? " (baseline)" : "") })]))), d.id === "walk" ? h("p", { class: "small", text: "Level 4 must be confirmed by a second guide and paired with tool-handling expectations every time." }) : null, ndBox(d.nd)])));
  sec.appendChild(g);
  sec.appendChild(card("S-edge", [h("div", { class: "row" }, [h("span", { style: "font-size:28px", text: "⛰️" }), h("h2", { text: "Level 5: the summit" })]), h("p", { text: "Earned only when a student holds Level 4 in all four domains at the same time. It pulls a student's weakest area upward and reconnects the domains into a picture of the whole child." }), h("h3", { text: "A Level 5 student may" }), ul(D.LEVEL5)]));
  sec.appendChild(card("", [h("h2", { text: "How a guide decides" }), h("div", { class: "grid g2" }, D.FL_RULES.map(r => h("div", null, [h("b", { text: r[0] }), h("p", { class: "dim", text: r[1] })])))]));
  sec.appendChild(card("", [h("h2", { text: "Language that keeps it about trust" }), h("p", { class: "small", text: "Moving up" }), h("div", { class: "say", text: "“You've shown me all week that I can trust you with more space. This week you're at Level 4 in the Field Block. Here's what that opens up.”" }), h("p", { class: "small", text: "Stepping down" }), h("div", { class: "say", text: "“This week the walk got a little unsafe, so we're going to stay closer together for a bit at Level 2. That's not a punishment. It's how we rebuild trust. Show me the safe choices, and we'll climb back to Level 3 together.”" })]));
  sec.appendChild(card("N-edge", [tag("N", "Different wiring"), h("h3", { text: "Where level systems go wrong" }), h("p", { text: "Research on point-and-level systems in special education is thin, and the common failure is a child who stalls at the bottom and stops trying. Our design avoids points and keeps domains separate, which helps. The remaining risk is a lagging skill read as a choice. Before a step down, ask what support would let this student meet the criteria, and try it for a week." }), refLinks(["levels"]), openLink("wallchart")]));
  sec.appendChild(h("a", { class: "btn", style: "align-self:flex-start;text-decoration:none", href: "#tracker", text: "Open the level tracker" }));
};

/* ---------------- knots ---------------- */
VIEWS.knots = (sec, sub) => {
  const k = D.KNOTS.find(x => x.id === sub);
  if (k) return knotView(sec, k);
  head(sec, "Untangling <span>knots</span>", "Situations like the ones on our campuses this year, rewritten as composites with names and details removed. Pick one, make the call, then see the standard, the options and the neurodivergent angle.");
  const g = h("div", { class: "stops" });
  sec.appendChild(h("p", { class: "small", text: isK1() ? "Showing K–1 and all-band knots. Switch to Grades 2–8 at the top for the rest." : "Showing grades 2–8 and all-band knots. Switch to K–1 at the top for the lower campus." }));
  D.KNOTS.filter(k => isK1() ? /K–1|All/.test(k.band) : !/^K–1$/.test(k.band)).forEach(k => { const done = local.get("bg-knots", {})[k.id]; g.appendChild(h("a", { class: "stop S", href: "#knots/" + k.id }, [h("i", { text: (done ? "✓ " : "") + k.band + " · " + k.where.toUpperCase() }), h("b", { text: k.title }), h("span", { text: k.q })])); });
  sec.appendChild(g);
};
function knotView(sec, k) {
  back(sec, "#knots", "All knots");
  head(sec, esc(k.title), k.band + " · " + k.where);
  sec.appendChild(card("", [h("p", { style: "font-size:17px", text: k.story })]));
  const qc = card("", [h("h2", { text: k.q })]), opts = h("div", { class: "opts" }), why = h("div");
  shuffle(k.opts).forEach(o => { const b = h("button", { class: "opt", text: o[0] }); b.onclick = () => { opts.querySelectorAll("button").forEach(x => { x.disabled = true; const oo = k.opts.find(y => y[0] === x.textContent); if (oo && oo[1]) x.classList.add("right"); }); if (!o[1]) b.classList.add("wrong"); why.innerHTML = ""; why.appendChild(h("p", { class: o[1] ? "" : "dim", text: (o[1] ? "Yes. " : "Not quite. ") + o[2] })); const d = local.get("bg-knots", {}); d[k.id] = true; local.set("bg-knots", d); rest.hidden = false; }; opts.appendChild(b); });
  qc.append(opts, why); sec.appendChild(qc);
  const rest = h("div", { class: "view", style: "padding-top:0" }); rest.hidden = true;
  rest.appendChild(h("div", { class: "grid g2" }, [card("S-edge", [tag("S", "Standard"), h("h3", { text: "What the standard requires" }), ul(k.standard)]), card("T-edge", [tag("T", "Toolkit"), h("h3", { text: "Options to consider" }), ul(k.toolkit)])]));
  rest.appendChild(card("N-edge", [tag("N", "Different wiring"), h("p", { text: k.nd })]));
  rest.appendChild(trapBox(k.trap));
  if (k.research && k.research.length) rest.appendChild(card("", [h("h3", { text: "Research behind this" }), ...k.research.map(id => { const r = D.REFS[id]; return h("div", null, [h("b", { text: r.t }), h("p", { class: "dim", text: r.f }), h("a", { class: "ref", href: r.u, target: "_blank", rel: "noopener", text: "Source · " + STRENGTH[r.s] })]); })]));
  if (k.open) rest.appendChild(openLink(k.open));
  rest.appendChild(h("a", { class: "chip", style: "align-self:flex-start", href: "#coach", text: "Something like this happening now? Ask the coach →" }));
  sec.appendChild(rest);
}

/* ---------------- toolkit ---------------- */
VIEWS.toolkit = sec => {
  head(sec, "The <span>toolkit</span>", "Methods you choose with judgment. None of these is required every time. Each card says when it fits, how to run it, what the evidence says, and the trap to avoid.");
  const best = ids => { const order = ["strong", "moderate", "mixed", "thin"]; let b = null; (ids || []).forEach(id => { const s = D.REFS[id].s; if (b === null || order.indexOf(s) < order.indexOf(b)) b = s; }); return b; };
  let f = "all"; const chips = h("div", { class: "chips" }), out = h("div", { class: "grid g2" });
  const draw = () => { chips.innerHTML = ""; [["all", "All"], ["ev", "Has research"], ["pw", "Practice wisdom"]].forEach(([k, t]) => chips.appendChild(h("button", { class: "chip", "aria-pressed": String(f === k), text: t, onclick: () => { f = k; draw(); } }))); out.innerHTML = ""; D.TOOLS.forEach(t => { const b = best(t.research); if (f === "ev" && !b) return; if (f === "pw" && b) return; out.appendChild(card("T-edge", [h("div", { class: "row" }, [tag("T", "Toolkit"), h("span", { class: "small", text: b ? "Best evidence: " + b : "Practice wisdom, not yet tested" })]), h("h3", { id: "t-" + t.id, text: t.name }), h("p", { class: "dim", text: "When: " + t.when }), h("details", null, [h("summary", { text: "How to run it" }), ol(t.how)]), ndBox(t.nd), trapBox(t.trap), t.extra ? h("p", { class: "small", text: t.extra }) : null, refLinks(t.research)])); }); };
  sec.append(chips, out); draw();
};

/* ---------------- different wiring ---------------- */
VIEWS.wiring = sec => {
  const N = D.ND;
  head(sec, "Different <span>wiring</span>", "How we support autistic, ADHD and otherwise neurodivergent students. Wilderland was built partly with them in mind, and we likely have more of them than an average school.");
  sec.appendChild(card("N-edge", [h("p", { style: "font-size:17px", text: N.why })]));
  const I = D.IE, ie = h("div", { class: "ie" });
  ie.append(h("div", { class: "ax ay", text: "Standards →" }));
  [[0, 1], [2, 3]].forEach(r => r.forEach(i => { const q = I.quad[i]; ie.append(h("div", { class: "q" + (i === 1 ? " win" : "") }, [h("b", { text: q[0] }), q[1], q[2] ? h("div", { style: "font:700 11px var(--body);letter-spacing:.07em;text-transform:uppercase;margin-top:6px;opacity:.8", text: q[2] }) : null])); }));
  ie.append(h("div", { class: "ax ax2", text: "Support →" }));
  // grid order: row 1 = high standards (exclusive, inclusive), row 2 = low (neglect, non-excellence)
  sec.appendChild(card("N-edge", [tag("N", "Principle 1"), h("h2", { html: "Inclusive <span>Excellence</span>" }), h("p", { style: "font:700 21px/1.35 var(--display)", text: I.line }), h("p", { text: I.body }), ie,
    h("h3", { text: "What it looks like" }), h("p", { class: "dim", text: I.story }), h("a", { class: "ref", href: I.storyUrl, target: "_blank", rel: "noopener", text: "📚 Keivan Stassun and autistic researchers at Vanderbilt" }),
    h("h3", { text: "At Wilderland" }), ul(I.doThis), refLinks(["wise"]), h("a", { class: "chip", style: "align-self:flex-start", href: "/fieldguide/", text: "It's the Mentor Mindset, applied. Go to the Field Guide →" })]));
  sec.appendChild(h("div", { class: "grid g3" }, N.principles.slice(1).map(p => card("N-edge", [h("h3", { text: p[0] }), h("p", { class: "dim", text: p[1] })]))));
  // mirrors
  let f = "all"; const chips = h("div", { class: "chips" }), mg = h("div", { class: "grid g4" });
  const drawM = () => { chips.innerHTML = ""; [["all", "All"], ["autism", "Autism"], ["adhd", "ADHD"]].forEach(([k, t]) => chips.appendChild(h("button", { class: "chip", "aria-pressed": String(f === k), text: t, onclick: () => { f = k; drawM(); } }))); mg.innerHTML = ""; N.mirrors.filter(m => f === "all" || m[2] === f).forEach(m => { const b = h("button", { class: "flip" }); let on = false; const face = () => { b.classList.toggle("on", on); b.innerHTML = ""; b.append(h("span", { class: "small", text: on ? "The mirror strength" : "The label (" + (m[2] === "adhd" ? "ADHD" : "autism") + ")" }), h("span", { class: "q", text: on ? m[1] : m[0] }), h("span", { class: "small", text: on ? "" : "Tap to flip" })); }; b.onclick = () => { on = !on; face(); }; face(); mg.appendChild(b); }); };
  sec.appendChild(card("", [h("h2", { text: "Every label has a mirror" }), h("p", { class: "dim", text: "Tap a label to see the strength on the other side. Use the mirror words in coaching notes and with families." }), chips, mg])); drawM();
  sec.appendChild(h("div", { class: "grid g2" }, [
    card("", [h("h2", { text: "ADHD: what helps" }), ...N.adhd.map(a => h("div", null, [h("b", { text: a[0] }), h("p", { class: "dim", text: a[1] })])), refLinks(["adhdemo", "move"])]),
    card("", [h("h2", { text: "Autism: what helps" }), ...N.autism.map(a => h("div", null, [h("b", { text: a[0] }), h("p", { class: "dim", text: a[1] })])), refLinks(["mask", "dep", "ncaep"])])
  ]));
  sec.appendChild(card("", [h("h2", { text: "Healthy autistic behaviors" }), h("p", { class: "dim", text: "These are normal and healthy. They are not behavior problems." }), ul(N.healthy), h("p", { class: "small", text: "From Devon Price, Unmasking Autism." })]));
  sec.appendChild(card("", [h("h2", { text: "Communication accommodations" }), h("div", { class: "grid g3" }, N.comm.map(c => h("div", null, [h("h3", { style: "margin-bottom:6px", text: c[0] }), ul(c[1])])))]));
  sec.appendChild(card("", [h("h2", { text: "The room matters" }), h("div", { class: "grid g4" }, N.sensory.map(s => h("div", null, [h("b", { text: s[0] }), h("p", { class: "dim", text: s[1] })]))), h("p", { class: "small", text: "Regulation spaces are a time-in, never a time-out. Introduce them as a positive choice for everyone before anyone needs one." })]));
  sec.appendChild(card("W-edge", [tag("W", "Watch our own systems"), h("h2", { text: "Where Wilderland's systems can hurt ND kids" }), ...N.watch.map(w => h("div", null, [h("b", { text: w[0] }), h("p", { class: "dim", text: w[1] })]))]));
  sec.appendChild(h("div", { class: "grid g2" }, [
    card("", [h("h3", { text: "The research, briefly" }), ...["dep", "bully", "mask", "adhdemo", "move", "ncaep"].map(id => { const r = D.REFS[id]; return h("details", null, [h("summary", { text: r.t }), h("p", { class: "dim", text: r.f }), h("p", { class: "small", text: "Caveat: " + r.c }), h("a", { class: "ref", href: r.u, target: "_blank", rel: "noopener", text: "Source · " + STRENGTH[r.s] })]); })]),
    card("", [h("h3", { text: "Questions for families at intake" }), ul(N.intake), h("h3", { text: "Reflection prompts for students" }), ul(N.reflect), h("p", { class: "small", text: "Adapted from Unmasking Autism." })])
  ]));
  sec.appendChild(card("", [h("h3", { text: "The staff library" }), h("div", { class: "scroll", html: "<table>" + N.books.map(b => "<tr><td><b>" + esc(b[0]) + "</b></td><td>" + esc(b[1]) + "</td></tr>").join("") + "</table>" }), h("p", { class: "small", text: "Many books on autism published before about 2015 treat it as a disease to cure. The field and the autistic community have moved on." })]));
};

/* ---------------- evidence ---------------- */
VIEWS.evidence = sec => {
  head(sec, "What the <span>evidence</span> says", "Honest summaries of the research behind our practices, including where it's weak or mixed. Each card links to the source.");
  sec.appendChild(card("", [h("div", { class: "grid g4" }, [["strong", "Several trials or a meta-analysis agree."], ["moderate", "At least one good trial."], ["mixed", "Good studies disagree, or results differ by age."], ["thin", "Theory, small studies, or no rigorous tests yet."]].map(s => h("div", null, [h("div", { class: "meterw " + s[0], html: "<i></i><i></i><i></i><i></i>" }), h("b", { text: s[0] }), h("p", { class: "small", text: s[1] })])))]));
  const cnt = { strong: 0, moderate: 0, mixed: 0, thin: 0 }; Object.values(D.REFS).forEach(r => cnt[r.s]++); const mx = Math.max(...Object.values(cnt)), cc = { strong: "var(--t0)", moderate: "#5d9c72", mixed: "var(--t1)", thin: "var(--W)" };
  sec.appendChild(card("", [h("h3", { text: "How much of this rests on strong evidence?" }), h("div", { class: "evbars" }, Object.entries(cnt).map(([k, v]) => h("div", null, [h("span", { text: k }), h("i", { style: `width:${Math.max(4, v / mx * 100)}%;background:${cc[k]}` }), h("b", { text: String(v) })]))), h("p", { class: "small", text: "Number of research cards on this site at each strength." })]));
  let f = "all"; const chips = h("div", { class: "chips" }), out = h("div", { class: "grid g2" });
  const draw = () => { chips.innerHTML = ""; ["all", "strong", "moderate", "mixed", "thin"].forEach(k => chips.appendChild(h("button", { class: "chip", "aria-pressed": String(f === k), text: k === "all" ? "All" : k, onclick: () => { f = k; draw(); } }))); out.innerHTML = ""; Object.entries(D.REFS).forEach(([id, r]) => { if (f !== "all" && r.s !== f) return; out.appendChild(card("", [h("div", { class: "meterw " + r.s, html: "<i></i><i></i><i></i><i></i>" }), h("h3", { text: r.t }), h("p", { text: r.f }), h("p", { class: "small", text: "Caveat: " + r.c }), h("a", { class: "ref", href: r.u, target: "_blank", rel: "noopener", text: "Read the source →" })])); }); };
  sec.append(chips, out); draw();
  sec.appendChild(card("", [h("h3", { text: "Reading these honestly" }), ul(["Most studies come from public schools far larger than ours. They point a direction more than they predict our results.", "Several of our frameworks (Nonviolent Communication, trauma-informed practice, Personal Fire Drills) have little rigorous testing. That doesn't make them wrong. It means we should watch what happens when we use them.", "The best evidence we have is our own records. Write down what you tried and what happened."])]));
};

/* ---------------- training ---------------- */
VIEWS.training = (sec, sub) => {
  const m = D.MODULES.find(x => x.id === sub);
  if (m) return quizView(sec, m);
  head(sec, "Behavior <span>badges</span>", "Short drills on the standards. Earn all six to be certified on our behavior standards. Retake any time; your best score counts.");
  const cert = D.MODULES.every(x => progress[x.id] && progress[x.id].passed);
  if (cert) sec.appendChild(card("S-edge", [h("h2", { text: "🏅 Certified on the behavior standards" }), h("p", { text: "You've passed every module. Leadership can see that on the training roster." })]));
  const g = h("div", { class: "grid g3" });
  D.MODULES.forEach(x => { const p = progress[x.id]; g.appendChild(h("a", { class: "stop S", href: "#training/" + x.id }, [h("i", { text: p && p.passed ? "✓ EARNED · BEST " + p.best + "/" + p.total : p ? "BEST " + p.best + "/" + p.total + " · PASS " + x.pass : "PASS " + x.pass + " TO EARN" }), h("b", { text: x.icon + " " + x.name }), h("span", { text: x.blurb })])); });
  sec.appendChild(g);
  sec.appendChild(card("", [h("p", { class: "small", text: "Badges are saved to your account. Admins can see who has earned which badges, not individual answers." })]));
};
function buildQuestions(m) {
  if (m.kind === "sort") return shuffle(D.SORT).slice(0, 10).map(s => ({ p: s[0], o: ["Tier 0", "Tier 1", "Tier 2", "Tier 3"], a: s[1], w: D.TIERS[s[1]].q }));
  if (m.kind === "kinds") return shuffle(D.SORTKIND).slice(0, 10).map(s => ({ p: s[0], o: ["Standard", "Toolkit"], a: s[1] === "standard" ? 0 : 1, w: s[2] }));
  if (m.kind === "knots") return shuffle(D.KNOTS).slice(0, 10).map(k => { const o = shuffle(k.opts); return { p: k.title + ": " + k.q, ctx: k.story, o: o.map(x => x[0]), a: o.findIndex(x => x[1]), w: o.find(x => x[1])[2] }; });
  return shuffle(m.qs).map(q => ({ p: q[0], o: q[1], a: q[2], w: q[3] }));
}
function quizView(sec, m) {
  back(sec, "#training", "All badges");
  head(sec, m.icon + " " + esc(m.name), m.blurb + " Pass with " + m.pass + " or more.");
  const qs = buildQuestions(m); let i = 0, score = 0; const box = card("", []);
  const show = () => {
    box.innerHTML = "";
    if (i >= qs.length) {
      const passed = score >= m.pass; saveBadge(m.id, score, qs.length);
      box.append(h("h2", { text: passed ? "Badge earned: " + m.name : "Not yet: " + score + " of " + qs.length }), h("p", { class: "big", text: score + " / " + qs.length }), h("p", { class: "dim", text: passed ? "Nice work. Your best score is saved." : "You need " + m.pass + ". The explanations after each question are the fastest way to close the gap." }), h("div", { class: "row" }, [h("button", { class: "btn", text: "Try again", onclick: () => route() }), h("a", { class: "btn ghost", style: "text-decoration:none", href: "#training", text: "All badges" })]));
      return;
    }
    const q = qs[i]; const opts = h("div", { class: "opts" }), why = h("div");
    box.append(h("p", { class: "small", text: "Question " + (i + 1) + " of " + qs.length + " · score " + score }), q.ctx ? h("p", { class: "dim", text: q.ctx }) : null, h("p", { class: "big", text: q.p }), opts, why);
    q.o.forEach((t, j) => { const b = h("button", { class: "opt", text: t }); b.onclick = () => { const right = j === q.a; if (right) score++; opts.querySelectorAll("button").forEach((x, k) => { x.disabled = true; if (k === q.a) x.classList.add("right"); }); if (!right) b.classList.add("wrong"); why.append(h("p", { class: right ? "" : "dim", text: (right ? "Yes. " : "Not quite. ") + q.w }), h("button", { class: "btn", style: "margin-top:10px", text: i + 1 < qs.length ? "Next" : "See result", onclick: () => { i++; show(); } })); }; opts.appendChild(b); });
  };
  show(); sec.appendChild(box);
}

/* ---------------- coach ---------------- */
// Each coach conversation is saved to the guide's private history (/guides/log.js, viewable at /guides/history/).
let thread = [], threadId = null, threadBand = "";
const saveLog = autosaver(() => user && db ? coachLog(db, user) : null, () => toast("Couldn't save this conversation to your history."));
VIEWS.coach = sec => {
  head(sec, "Ask the <span>coach</span>", "Describe what happened. The coach separates what the standard requires from the options you can choose, and adds the neurodivergent angle. It knows our policy, not your students.");
  sec.appendChild(card("W-edge", [h("p", { text: "Use first names or initials only. If anyone is unsafe or a student has mentioned self-harm, abuse or being harmed, stop here and follow the Mental Health Crisis Policy with leadership now." })]));
  const mine = { "2–4": "Grades 2–4", "5–8": "Grades 5–8", "K–1": "K–1 (lower campus)" }[window.wlBand ? window.wlBand() : "5–8"];
  const band = h("select", { id: "cBand" }, ["Grades 2–4", "Grades 5–8", "K–1 (lower campus)"].map(t => h("option", { text: t, selected: t === mine })));
  const ta = h("textarea", { id: "cTa", placeholder: "What happened, who was involved (first names or initials), what you've already tried, and what you're unsure about." });
  const out = h("div", { class: "thread" }), status = h("p", { class: "small" });
  const draw = () => { out.innerHTML = ""; thread.forEach(m => out.appendChild(h("div", { class: "msg " + (m.role === "user" ? "u" : "a"), text: m.content }))); };
  const send = async () => { const t = ta.value.trim(); if (t.length < 15) { status.textContent = "Add a little more detail."; return; } thread.push({ role: "user", content: (thread.length ? "" : "[" + band.value + "] ") + t }); ta.value = ""; draw(); status.textContent = "Thinking…"; btn.disabled = true; try { const r = await ai(thread, { system: D.COACH, max: 1100 }); thread.push({ role: "assistant", content: r }); status.textContent = ""; if (!threadId) { threadId = coachLog(db, user).newId(); threadBand = band.value; } saveLog({ id: threadId, site: "behavior", kind: "coach", messages: thread, meta: { band: threadBand } }); } catch (e) { thread.pop(); ta.value = t; status.textContent = aiErr(e); } btn.disabled = false; draw(); };
  const btn = h("button", { class: "btn", text: "Ask", onclick: send });
  sec.appendChild(card("", [h("label", { for: "cBand" }, ["Band", band]), h("label", { for: "cTa" }, ["The situation", ta]), h("div", { class: "row" }, [btn, h("button", { class: "btn ghost", text: "Start over", onclick: () => { thread = []; threadId = null; draw(); status.textContent = ""; } }), h("a", { class: "chip", href: "/guides/history/#behavior", text: "Past conversations" })]), status, out]));
  draw();
  sec.appendChild(card("", [h("p", { class: "small", text: "The coach drafts; you decide. It can be wrong about policy details, so check the Tier ladder before you act on anything it says the standard requires. Each conversation is saved to your private history, which only you can see. Delete it there anytime." })]));
};

/* ---------------- level tracker ---------------- */
const cache = { students: null, th: null, agenda: null };
const DOM_SHORT = { academic: "AC", walk: "NW", table: "TB", field: "FB" };
const isL5 = s => D.DOMAINS.every(d => (s.levels || {})[d.id] === 4);
async function loadStudents(force) {
  if (cache.students && !force) return cache.students;
  const snap = await getDocs(query(collection(db, "flStudents"), limit(400)));
  cache.students = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.archived).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return cache.students;
}
const pills = s => h("div", { class: "pills" }, D.DOMAINS.map(d => { const v = (s.levels || {})[d.id] || 3; return h("span", { title: d.name, style: "display:inline-flex;align-items:center;gap:3px" }, [h("small", { text: DOM_SHORT[d.id] }), h("span", { class: "pill l" + v, text: String(v) })]); }).concat(isL5(s) ? [h("span", { class: "star", text: "★ Level 5" })] : []).concat(s.pending ? [h("span", { class: "star", text: "⏳ NW4 awaiting 2nd guide" })] : []));
VIEWS.tracker = async (sec, sub) => {
  if (sub === "review") return reviewView(sec);
  if (sub === "add") return addView(sec);
  if (sub) return studentView(sec, sub);
  head(sec, "Level <span>tracker</span>", "Each student's Freedom Levels across the four domains, with the reason behind every move. Staff only. Levels are shared with each student privately at their one-on-one, never posted.");
  const list = h("div", { class: "grid g3" }), q = h("input", { type: "search", placeholder: "Search students", id: "trQ" }), chips = h("div", { class: "chips" });
  let f = local.get("bg-tr-f", { band: "all", mine: false, due: false });
  // The band filter always starts on the guide's own band (All for admins).
  f.band = { "K–1": "K-1", "2–4": "2-4", "5–8": "5-8" }[window.wlBand ? window.wlBand({ all: true }) : "All"] || "all";
  sec.appendChild(card("noprint", [h("div", { class: "row" }, [h("a", { class: "btn", style: "text-decoration:none", href: "#tracker/review", text: "Weekly review" }), h("a", { class: "btn ghost", style: "text-decoration:none", href: "#tracker/add", text: "Add students" })]), h("label", { for: "trQ" }, ["Find a student", q]), chips]));
  sec.appendChild(list);
  let all = [];
  const draw = () => {
    chips.innerHTML = ""; [["all", "All bands"], ["K-1", "K–1"], ["2-4", "2–4"], ["5-8", "5–8"]].forEach(([k, t]) => chips.appendChild(h("button", { class: "chip", "aria-pressed": String(f.band === k), text: t, onclick: () => { f.band = k; local.set("bg-tr-f", f); draw(); } })));
    chips.appendChild(h("button", { class: "chip", "aria-pressed": String(f.mine), text: "My students", onclick: () => { f.mine = !f.mine; local.set("bg-tr-f", f); draw(); } }));
    chips.appendChild(h("button", { class: "chip", "aria-pressed": String(f.due), text: "Due for review", onclick: () => { f.due = !f.due; local.set("bg-tr-f", f); draw(); } }));
    const s = q.value.trim().toLowerCase(); list.innerHTML = "";
    const shown = all.filter(x => (f.band === "all" || x.band === f.band) && (!f.mine || x.guide === me()) && (!f.due || daysAgo(x.reviewedAt) === null || daysAgo(x.reviewedAt) >= 7) && (!s || (x.name || "").toLowerCase().includes(s)));
    if (!shown.length) list.appendChild(h("p", { class: "dim", text: all.length ? "No students match." : "No students yet. Add your students to start." }));
    shown.forEach(x => { const d = daysAgo(x.reviewedAt); list.appendChild(h("button", { class: "kid", onclick: () => location.hash = "#tracker/" + x.id }, [h("b", { text: x.name }), h("span", { class: "small", text: (x.band || "") + " · " + (x.guideName || x.guide || "no guide") }), pills(x), h("span", { class: "small" }, [h("span", { class: "dot" + (d !== null && d < 7 ? " ok" : "") }), d === null ? "Never reviewed" : d === 0 ? "Reviewed today" : "Reviewed " + d + " days ago"])])); });
  };
  q.oninput = draw;
  try { all = await loadStudents(true); } catch (e) { list.appendChild(h("p", { class: "dim", text: "Couldn't load students. The database rules for the tracker may not be published yet." })); return; }
  draw();
};
async function addView(sec) {
  back(sec, "#tracker", "Tracker");
  head(sec, "Add <span>students</span>", "Everyone starts at Level 3 in all four domains.");
  const names = h("textarea", { id: "aN", placeholder: "One student per line. First name and last initial is enough." }), band = h("select", { id: "aB" }, [["2-4", "Grades 2–4"], ["5-8", "Grades 5–8"], ["K-1", "K–1"]].map(o => h("option", { value: o[0], text: o[1], selected: o[0] === myKey(false) ? "" : false }))), guide = h("input", { type: "email", id: "aG", value: me() }), note = h("p", { class: "small" });
  sec.appendChild(card("", [h("label", { for: "aN" }, ["Students", names]), h("label", { for: "aB" }, ["Band", band]), h("label", { for: "aG" }, ["Field Guide's email", guide]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Add", onclick: async () => {
    const list = names.value.split("\n").map(s => s.trim()).filter(Boolean); if (!list.length) { note.textContent = "Add at least one name."; return; }
    const existing = (await loadStudents()).map(s => (s.name || "").toLowerCase());
    const g = guide.value.trim().toLowerCase(); let n = 0, skipped = [];
    for (const nm of list) { if (existing.includes(nm.toLowerCase())) { skipped.push(nm); continue; } try { await addDoc(collection(db, "flStudents"), { name: nm.slice(0, 60), band: band.value, guide: g, guideName: g === me() ? myName() : g.split("@")[0], levels: { academic: 3, walk: 3, table: 3, field: 3 }, pending: null, reviewedAt: null, updatedAt: Date.now(), created: Date.now(), createdBy: me(), archived: false }); n++; } catch (e) { note.textContent = "Couldn't save. The database rules may not be published yet."; return; } }
    cache.students = null; note.textContent = "Added " + n + "." + (skipped.length ? " Skipped (already listed): " + skipped.join(", ") : ""); names.value = "";
  } })]), note]));
}
function scriptFor(kind, d, L) { return D.FL_SAY[kind].replace("{L}", L).replace("{D}", d.name).replace("{UP}", d.up); }
async function addHistory(id, e) { await addDoc(collection(db, "flStudents", id, "history"), Object.assign({ at: Date.now(), by: user.uid, byEmail: me(), byName: myName() }, e)); }
// Apply one decision for one domain. dir: -1, 0, +1. Returns a short status string.
async function decide(s, dom, dir, why, next) {
  const from = (s.levels || {})[dom] || 3, to = Math.max(1, Math.min(4, from + dir)), d = D.DOMAINS.find(x => x.id === dom);
  const upd = { reviewedAt: Date.now(), updatedAt: Date.now() };
  if (dir === 0 || to === from) { await updateDoc(doc(db, "flStudents", s.id), upd); await addHistory(s.id, { kind: "hold", domain: dom, from, to: from, why, next }); s.reviewedAt = upd.reviewedAt; return d.name + ": holding at " + from; }
  if (dom === "walk" && to === 4) { const p = { domain: "walk", to: 4, by: user.uid, byEmail: me(), byName: myName(), why, next, at: Date.now() }; upd.pending = p; await updateDoc(doc(db, "flStudents", s.id), upd); await addHistory(s.id, { kind: "pending", domain: dom, from, to, why, next }); s.pending = p; s.reviewedAt = upd.reviewedAt; return "Nature Walk 4 requested; waiting for a second guide"; }
  const lv = Object.assign({ academic: 3, walk: 3, table: 3, field: 3 }, s.levels || {}); lv[dom] = to; upd.levels = lv;
  if (dom === "walk" && s.pending) upd.pending = null;
  await updateDoc(doc(db, "flStudents", s.id), upd); await addHistory(s.id, { kind: "move", domain: dom, from, to, why, next });
  s.levels = lv; s.reviewedAt = upd.reviewedAt; if (upd.pending === null) s.pending = null;
  return d.name + ": " + from + " → " + to;
}
async function studentView(sec, id) {
  back(sec, "#tracker", "Tracker");
  let s; try { const snap = await getDoc(doc(db, "flStudents", id)); if (!snap.exists()) { sec.appendChild(h("p", { class: "dim", text: "Student not found." })); return; } s = { id, ...snap.data() }; } catch (e) { sec.appendChild(h("p", { class: "dim", text: "Couldn't load this student." })); return; }
  head(sec, esc(s.name) + (isL5(s) ? " <span>★ Level 5</span>" : ""), (s.band || "") + " · Field Guide " + (s.guideName || s.guide || "not set") + (s.reviewedAt ? " · last reviewed " + fmtDate(s.reviewedAt) : " · not reviewed yet"));
  sec.appendChild(h("p", { class: "printonly", text: "Coaching card · private · " + new Date().toLocaleDateString() }));
  if (s.pending) {
    const p = s.pending, mine = p.by === user.uid;
    const box = card("S-edge", [h("h3", { text: "⏳ Nature Walk Level 4 is waiting for a second guide" }), h("p", { text: "Requested by " + (p.byName || p.byEmail) + " on " + fmtDate(p.at) + ". Reason: " + (p.why || "") }), h("p", { class: "small", text: mine ? "Another guide needs to confirm. You can't confirm your own request." : "Confirm only if you've seen this student handle tools safely yourself." })]);
    const row = h("div", { class: "row noprint" });
    if (!mine) row.appendChild(h("button", { class: "btn", text: "I confirm: Level 4", onclick: async () => { try { const lv = Object.assign({ academic: 3, walk: 3, table: 3, field: 3 }, s.levels || {}); lv.walk = 4; await updateDoc(doc(db, "flStudents", id), { levels: lv, pending: null, updatedAt: Date.now() }); await addHistory(id, { kind: "confirm", domain: "walk", from: 3, to: 4, why: "Second-guide confirmation of " + (p.byName || p.byEmail) + "'s request", next: p.next || "" }); cache.students = null; route(); } catch (e) { toast("Couldn't save."); } } }));
    if (mine || isAdmin) row.appendChild(confirmTap(h("button", { class: "btn ghost", text: "Withdraw request" }), "withdraw", async () => { await updateDoc(doc(db, "flStudents", id), { pending: null, updatedAt: Date.now() }); await addHistory(id, { kind: "cancel", domain: "walk", from: 3, to: 3, why: "Request withdrawn", next: "" }); cache.students = null; route(); }));
    box.appendChild(row); sec.appendChild(box);
  }
  const g = h("div", { class: "grid g2" });
  D.DOMAINS.forEach(d => {
    const cur = (s.levels || {})[d.id] || 3;
    const form = h("div", { class: "noprint", style: "display:flex;flex-direction:column;gap:8px" });
    const openForm = dir => {
      form.innerHTML = ""; const to = Math.max(1, Math.min(4, cur + dir));
      const why = h("textarea", { placeholder: dir === 0 ? "Optional: what you saw this week" : "Required: the pattern you saw this week, tied to the criteria", style: "min-height:80px" });
      const next = h("input", { type: "text", placeholder: dir < 0 ? "The path back: what Level " + cur + " will look like again" : "The next step", value: dir < 0 ? "" : "" });
      const kind = dir > 0 ? "up" : dir < 0 ? "down" : "hold";
      const sayL = dir === 0 ? cur : to;
      form.append(h("p", { class: "small", text: dir === 0 ? "Hold at Level " + cur + " (counts as reviewed)" : (dir > 0 ? "Up" : "Down") + " to Level " + to + (d.id === "walk" && to === 4 ? " (needs a second guide to confirm)" : "") }), why, next, h("div", { class: "say", text: scriptFor(kind, d, sayL) }), h("div", { class: "row" }, [h("button", { class: "btn", text: "Save", onclick: async () => { if (dir !== 0 && why.value.trim().length < 8) { toast("Say what you saw this week, tied to the criteria."); return; } try { toast(await decide(s, d.id, dir, why.value.trim(), next.value.trim())); cache.students = null; route(); } catch (e) { toast("Couldn't save. The database rules may not be published yet."); } } }), h("button", { class: "btn ghost", text: "Cancel", onclick: () => { form.innerHTML = ""; } })]));
    };
    g.appendChild(card("", [h("h3", { text: d.name }), h("div", { class: "dom" }, [4, 3, 2, 1].map(n => h("div", { class: "lv" + (n === cur ? " on" : "") + (s.pending && d.id === "walk" && n === 4 ? " pend" : "") }, [h("b", { text: String(n) }), h("span", { text: d.L[n] })]))), h("p", { class: "small", text: "Move up when: " + d.up }), h("div", { class: "row noprint" }, [h("button", { class: "chip", text: "↓ Step down", disabled: cur <= 1 ? "" : false, onclick: () => openForm(-1) }), h("button", { class: "chip", text: "Hold", onclick: () => openForm(0) }), h("button", { class: "chip", text: "↑ Step up", disabled: cur >= 4 || (d.id === "walk" && s.pending) ? "" : false, onclick: () => openForm(1) })]), form]));
  });
  sec.appendChild(g);
  sec.appendChild(card("N-edge noprint", [tag("N", "Before a step down"), h("p", { text: "Can't, or won't? If a skill, sensory load or a specific peer is in the way, change the support for a week first: seat, timing, a movement break, a written checklist. Keep the standard; change the route." })]));
  const hist = card("", [h("h3", { text: "History" })]); sec.appendChild(hist);
  try { const snap = await getDocs(query(collection(db, "flStudents", id, "history"), orderBy("at", "desc"), limit(80))); if (snap.empty) hist.appendChild(h("p", { class: "dim", text: "No reviews yet." })); snap.forEach(x => { const e = x.data(), d = D.DOMAINS.find(y => y.id === e.domain); const what = e.kind === "hold" ? (e.domain === "all" ? "held in every domain" : "held at " + e.from) : e.kind === "pending" ? "Level 4 requested" : e.kind === "confirm" ? "Level 4 confirmed" : e.kind === "cancel" ? "Level 4 request withdrawn" : e.from + " → " + e.to; hist.appendChild(h("div", { style: "border-bottom:1px solid var(--line);padding:8px 0" }, [h("b", { text: fmtDate(e.at) + " · " + (d ? d.name : e.domain === "all" ? "Weekly review" : e.domain) + " · " + what }), e.why ? h("p", { class: "dim", text: e.why }) : null, e.next ? h("p", { class: "small", text: "Next: " + e.next }) : null, h("p", { class: "small", text: "by " + (e.byName || e.byEmail || "") })])); }); } catch (e) { hist.appendChild(h("p", { class: "dim", text: "Couldn't load history." })); }
  // edit
  const band = h("select", null, [["2-4", "Grades 2–4"], ["5-8", "Grades 5–8"], ["K-1", "K–1"]].map(o => h("option", { value: o[0], text: o[1], selected: (s.band || { "K–1": "K-1", "2–4": "2-4", "5–8": "5-8" }[window.wlBand ? window.wlBand() : "5–8"]) === o[0] ? "" : false }))), gd = h("input", { type: "email", value: s.guide || "" }), nm = h("input", { type: "text", value: s.name || "", maxlength: 60 });
  sec.appendChild(h("details", { class: "card noprint" }, [h("summary", { text: "Edit or archive" }), h("label", null, ["Name", nm]), h("label", null, ["Band", band]), h("label", null, ["Field Guide's email", gd]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Save", onclick: async () => { const g2 = gd.value.trim().toLowerCase(); await updateDoc(doc(db, "flStudents", id), { name: nm.value.trim().slice(0, 60) || s.name, band: band.value, guide: g2, guideName: g2 === me() ? myName() : (g2 === s.guide ? s.guideName : g2.split("@")[0]), updatedAt: Date.now() }); cache.students = null; route(); } }), confirmTap(h("button", { class: "btn ghost", text: "Archive (left school)" }), "archive", async () => { await updateDoc(doc(db, "flStudents", id), { archived: true, updatedAt: Date.now() }); cache.students = null; location.hash = "#tracker"; })])]));
  sec.appendChild(h("button", { class: "chip noprint", style: "align-self:flex-start", text: "🖨 Print a private coaching card", onclick: () => print() }));
}
async function reviewView(sec) {
  back(sec, "#tracker", "Tracker");
  head(sec, "Weekly <span>review</span>", "One pass through your students. For each domain: down one, hold, or up one. Any move needs a reason tied to the criteria. Holding counts as reviewed.");
  sec.appendChild(card("", [h("p", { class: "small", text: "Remember: the week's pattern, not one moment. One rung at a time. Keep the domains separate. Nature Walk Level 4 goes to a second guide for confirmation." })]));
  let mine = true; const chips = h("div", { class: "chips" }), list = h("div"); sec.append(chips, list);
  let all; try { all = await loadStudents(true); } catch (e) { list.appendChild(h("p", { class: "dim", text: "Couldn't load students." })); return; }
  const draw = () => {
    chips.innerHTML = ""; chips.append(h("button", { class: "chip", "aria-pressed": String(mine), text: "My students", onclick: () => { mine = true; draw(); } }), h("button", { class: "chip", "aria-pressed": String(!mine), text: "Everyone", onclick: () => { mine = false; draw(); } }));
    list.innerHTML = ""; const shown = all.filter(x => !mine || x.guide === me());
    if (!shown.length) list.appendChild(h("p", { class: "dim", text: mine ? "No students list you as their Field Guide. Switch to Everyone, or set the guide on each student." : "No students yet." }));
    shown.forEach(s => {
      const pick = {}; D.DOMAINS.forEach(d => pick[d.id] = 0);
      const why = h("input", { type: "text", placeholder: "What you saw this week (required for any move)" }), stat = h("span", { class: "small" });
      const segs = D.DOMAINS.map(d => { const cur = (s.levels || {})[d.id] || 3; const seg = h("div", { class: "seg", role: "group", "aria-label": d.name }); const paint = () => { seg.innerHTML = ""; [[-1, "−"], [0, String(cur)], [1, "+"]].forEach(([v, t]) => seg.appendChild(h("button", { "aria-pressed": String(pick[d.id] === v), disabled: (v < 0 && cur <= 1) || (v > 0 && (cur >= 4 || (d.id === "walk" && s.pending))) ? "" : false, text: t, title: v < 0 ? "Down one" : v > 0 ? "Up one" : "Hold", onclick: () => { pick[d.id] = v; paint(); } }))); }; paint(); return h("div", null, [h("span", { class: "dn", text: d.name }), seg]); });
      const d0 = daysAgo(s.reviewedAt);
      const row = h("div", { class: "rev" }, [h("div", null, [h("b", { text: s.name }), h("div", { class: "small" }, [h("span", { class: "dot" + (d0 !== null && d0 < 7 ? " ok" : "") }), d0 === null ? "never reviewed" : d0 === 0 ? "reviewed today" : d0 + " days ago"])]), ...segs]);
      const save = h("button", { class: "btn", text: "Save " + s.name.split(" ")[0], onclick: async () => {
        const moves = Object.entries(pick).filter(([, v]) => v !== 0);
        if (moves.length && why.value.trim().length < 8) { stat.textContent = "Add what you saw this week."; return; }
        save.disabled = true; stat.textContent = "Saving…";
        try {
          const out = []; for (const [dom, v] of moves) out.push(await decide(s, dom, v, why.value.trim(), ""));
          if (!moves.length) { const t = Date.now(); await updateDoc(doc(db, "flStudents", s.id), { reviewedAt: t, updatedAt: t }); await addHistory(s.id, { kind: "hold", domain: "all", from: 0, to: 0, why: why.value.trim() || "Weekly review: holding in every domain", next: "" }); s.reviewedAt = t; }
          stat.textContent = moves.length ? "Saved. " + out.join(" · ") : "Saved: holding in every domain."; cache.students = null; save.textContent = "Saved ✓";
        } catch (e) { stat.textContent = "Couldn't save."; save.disabled = false; }
      } });
      list.append(row, h("div", { class: "row", style: "padding:6px 0 14px;border-bottom:1px solid var(--line)" }, [h("div", { style: "flex:1;min-width:220px" }, [why]), save, stat]));
    });
  };
  draw();
}

/* ---------------- town hall review ---------------- */
async function loadTH(force) {
  if (!cache.th || force) { const snap = await getDocs(query(collection(db, "townhall"), limit(500))); cache.th = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b.created) - ms(a.created)); }
  if (!cache.agenda || force) { const snap = await getDocs(query(collection(db, "townhallAgenda"), limit(500))); cache.agenda = snap.docs.map(d => ({ id: d.id, ...d.data() })); }
}
VIEWS.townhall = async (sec, sub) => {
  if (sub === "agenda") return agendaView(sec);
  head(sec, "Town <span>Hall</span>", "What students have asked to bring to Town Hall. Put good items on an agenda with a student-safe title, reply to the rest, and record what the community decided.");
  sec.appendChild(h("div", { class: "grid g2" }, [card("S-edge", [tag("S", "Standard"), h("h3", { text: "What Town Halls are for" }), ul(["System-level and group concerns, run by students.", "Not individual discipline, and never public shaming.", "A specific student can be discussed. Keep it on solving the problem together, not on the behavior, and tell the student first.", "3 or more concerns about the same student: the guide and class president may convene a restorative Town Hall about impact and repair.", "Concerns about a person can also go to a Peace Talk or a guide first."]), openLink("townhallnames")]), card("T-edge", [tag("T", "Toolkit"), h("h3", { text: "Running it well" }), ul(D.TH_GUIDE), refLinks(["townhall", "rc"])])]));
  let tab = local.get("bg-th-tab", "new"), band = myKey(true); // starts on the guide's own band each visit
  const tabs = h("div", { class: "chips" }), bands = h("div", { class: "chips" }), list = h("div", { class: "grid", style: "gap:10px" });
  sec.append(card("noprint", [h("div", { class: "row" }, [h("a", { class: "btn", style: "text-decoration:none", href: "#townhall/agenda", text: "Build an agenda" })]), tabs, bands]), list);
  try { await loadTH(true); } catch (e) { list.appendChild(h("p", { class: "dim", text: "Couldn't load Town Hall items. The database rules may not be published yet." })); return; }
  const draw = () => {
    tabs.innerHTML = ""; [["new", "New"], ["agenda", "On an agenda"], ["discussed", "Discussed"], ["declined", "Declined"]].forEach(([k, t]) => tabs.appendChild(h("button", { class: "chip", "aria-pressed": String(tab === k), text: t + " (" + cache.th.filter(x => x.status === k && (band === "all" || x.band === band)).length + ")", onclick: () => { tab = k; local.set("bg-th-tab", k); draw(); } })));
    bands.innerHTML = ""; [["all", "All bands"], ["K-1", "K–1"], ["2-4", "2–4"], ["5-8", "5–8"]].forEach(([k, t]) => bands.appendChild(h("button", { class: "chip", "aria-pressed": String(band === k), text: t, onclick: () => { band = k; local.set("bg-th-band", k); draw(); } })));
    list.innerHTML = ""; const items = cache.th.filter(x => x.status === tab && (band === "all" || x.band === band));
    if (!items.length) list.appendChild(h("p", { class: "dim", text: tab === "new" ? "Nothing new. Students submit items from the Suggestion Box." : "Nothing here." }));
    items.forEach(x => list.appendChild(thCard(x, draw)));
  };
  draw();
};
function thCard(x, redraw) {
  const c = card("th " + (x.kind === "people" ? "people" : ""), [h("div", { class: "row" }, [h("span", { class: "tag", text: D.TH_KINDS[x.kind] || x.kind }), h("span", { class: "small", text: (x.band || "") + " · " + (x.name || "a student") + " · " + fmtDate(x.created) })]), h("p", { style: "font-size:17px", text: x.text })]);
  if (x.kind === "people") c.appendChild(ndBox("This is about how people are treating each other. Talk with the student privately first, and consider a Peace Talk. Only if 3 or more concerns about the same student arrive should a restorative Town Hall be considered, and never one that shames."));
  if (x.meeting) c.appendChild(h("p", { class: "small", text: "Meeting: " + x.meeting }));
  if (x.note) c.appendChild(h("div", { class: "note", text: "Reply to student: " + x.note }));
  if (x.outcome) c.appendChild(h("div", { class: "say", text: "Decided: " + x.outcome }));
  const acts = h("div", { class: "row noprint" }), form = h("div", { style: "display:flex;flex-direction:column;gap:8px" });
  const upd = async (fields, agendaFields) => { try { await updateDoc(doc(db, "townhall", x.id), Object.assign({ reviewedBy: me(), reviewedAt: Date.now() }, fields)); if (agendaFields && x.agendaId) await updateDoc(doc(db, "townhallAgenda", x.agendaId), agendaFields); Object.assign(x, fields); toast("Saved."); redraw(); } catch (e) { toast("Couldn't save. The database rules may not be published yet."); } };
  if (x.status === "new" || x.status === "declined") acts.appendChild(h("button", { class: "btn", text: "Put on an agenda", onclick: () => {
    form.innerHTML = ""; const date = h("input", { type: "date" }), title = h("input", { type: "text", maxlength: 160, value: x.kind === "people" ? "" : x.text.slice(0, 160) });
    form.append(h("label", null, ["Meeting date", date]), h("label", null, ["Title students will see (no names)", title]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Add to agenda", onclick: async () => { if (!date.value || title.value.trim().length < 6) { toast("Pick a date and write a title."); return; } try { const a = await addDoc(collection(db, "townhallAgenda"), { title: title.value.trim(), meeting: date.value, band: x.band || "", itemId: x.id, status: "upcoming", outcome: "", created: Date.now(), by: me() }); x.agendaId = a.id; await upd({ status: "agenda", meeting: date.value, agendaId: a.id }); cache.agenda = null; } catch (e) { toast("Couldn't save."); } } }), h("button", { class: "btn ghost", text: "Cancel", onclick: () => { form.innerHTML = ""; } })]));
  } }));
  if (x.status === "new") acts.appendChild(h("button", { class: "btn ghost", text: "Decline with a reply", onclick: () => { form.innerHTML = ""; const n = h("textarea", { maxlength: 300, placeholder: "Tell the student why, and what they could do instead. They'll see this." }); form.append(n, h("div", { class: "row" }, [h("button", { class: "btn", text: "Decline", onclick: () => { if (n.value.trim().length < 6) { toast("Write a short reply."); return; } upd({ status: "declined", note: n.value.trim() }); } })])); } }));
  if (x.status === "agenda") acts.appendChild(h("button", { class: "btn", text: "Record the decision", onclick: () => { form.innerHTML = ""; const n = h("textarea", { maxlength: 400, placeholder: "What the community decided, including any trial period." }); form.append(n, h("div", { class: "row" }, [h("button", { class: "btn", text: "Save as discussed", onclick: () => { if (n.value.trim().length < 4) { toast("Write the decision."); return; } upd({ status: "discussed", outcome: n.value.trim() }, { status: "done", outcome: n.value.trim() }); } })])); } }));
  acts.appendChild(h("button", { class: "btn ghost", text: x.note ? "Edit reply" : "Reply", onclick: () => { form.innerHTML = ""; const n = h("textarea", { maxlength: 300 }); n.value = x.note || ""; form.append(n, h("div", { class: "row" }, [h("button", { class: "btn", text: "Save reply", onclick: () => upd({ note: n.value.trim() }) })])); } }));
  if (isAdmin) acts.appendChild(confirmTap(h("button", { class: "btn ghost", text: "Delete" }), "delete", async () => { try { if (x.agendaId) await deleteDoc(doc(db, "townhallAgenda", x.agendaId)).catch(() => { }); await deleteDoc(doc(db, "townhall", x.id)); cache.th = cache.th.filter(y => y.id !== x.id); redraw(); } catch (e) { toast("Couldn't delete."); } }));
  c.append(acts, form); return c;
}
async function agendaView(sec) {
  back(sec, "#townhall", "Town Hall items");
  head(sec, "Town Hall <span>agenda</span>", "Pick a meeting. Print it for the student facilitator. Students see upcoming titles on the Suggestion Box page.");
  try { await loadTH(true); } catch (e) { sec.appendChild(h("p", { class: "dim", text: "Couldn't load the agenda." })); return; }
  const dates = [...new Set(cache.agenda.map(a => a.meeting).filter(Boolean))].sort().reverse();
  let pick = local.get("bg-th-date", "") || dates[0] || "";
  const sel = h("select", { id: "agD" }, dates.map(d => h("option", { value: d, text: d, selected: d === pick ? "" : false }))), out = h("div", { class: "view", style: "padding-top:0" });
  const addT = h("input", { type: "text", maxlength: 160, placeholder: "Add an item yourself (no names)" }), addD = h("input", { type: "date" }), addB = h("select", null, [["5-8", "5–8"], ["2-4", "2–4"], ["K-1", "K–1"], ["", "All upper campus"]].map(o => h("option", { value: o[0], text: o[1], selected: o[0] === myKey(false) ? "" : false })));
  sec.appendChild(card("noprint", [dates.length ? h("label", { for: "agD" }, ["Meeting", sel]) : h("p", { class: "dim", text: "No meetings yet. Put an item on an agenda, or add one below." }), h("details", null, [h("summary", { text: "Add an item directly" }), h("label", null, ["Title", addT]), h("label", null, ["Meeting date", addD]), h("label", null, ["Band", addB]), h("button", { class: "btn", style: "align-self:flex-start", text: "Add", onclick: async () => { if (!addD.value || addT.value.trim().length < 6) { toast("Add a title and a date."); return; } try { await addDoc(collection(db, "townhallAgenda"), { title: addT.value.trim(), meeting: addD.value, band: addB.value, itemId: "", status: "upcoming", outcome: "", created: Date.now(), by: me() }); local.set("bg-th-date", addD.value); route(); } catch (e) { toast("Couldn't save."); } } })])]));
  const draw = () => {
    out.innerHTML = ""; if (!pick) return; const items = cache.agenda.filter(a => a.meeting === pick).sort((a, b) => ms(a.created) - ms(b.created));
    out.appendChild(card("", [h("h2", { text: "Town Hall · " + pick }), h("h3", { text: "Opening: our principles, read by students" }), h("p", { class: "dim", text: "Show Respect · Take Accountability · Work Hard · Stay Humble · Be a Peacemaker · Prepare Yourself · Be Grateful" }), h("h3", { text: "Roles" }), h("p", { text: "Facilitator: ________  Timekeeper: ________  Scribe: ________" }), h("h3", { text: "Agenda" }), ...items.map((a, i) => h("div", { style: "border-bottom:1px solid var(--line);padding:10px 0" }, [h("b", { text: (i + 1) + ". " + a.title }), a.band ? h("span", { class: "small", text: "  (" + a.band + ")" }) : null, a.outcome ? h("div", { class: "say", style: "margin-top:6px", text: "Decided: " + a.outcome }) : h("p", { class: "small", text: "Proposal: ____________________   Vote: ___ for / ___ against   Decision: ____________________" }), h("div", { class: "row noprint", style: "margin-top:6px" }, [a.status !== "done" ? h("button", { class: "chip", text: "Record decision", onclick: async () => { const o = prompt("What did the community decide?"); if (!o) return; try { await updateDoc(doc(db, "townhallAgenda", a.id), { status: "done", outcome: o.trim().slice(0, 400) }); if (a.itemId) await updateDoc(doc(db, "townhall", a.itemId), { status: "discussed", outcome: o.trim().slice(0, 400), reviewedBy: me(), reviewedAt: Date.now() }).catch(() => { }); route(); } catch (e) { toast("Couldn't save."); } } }) : null, confirmTap(h("button", { class: "chip", text: "Remove" }), "remove", async () => { try { await deleteDoc(doc(db, "townhallAgenda", a.id)); if (a.itemId) await updateDoc(doc(db, "townhall", a.itemId), { status: "new", meeting: "", agendaId: "", reviewedBy: me(), reviewedAt: Date.now() }).catch(() => { }); route(); } catch (e) { toast("Couldn't remove."); } })])])), h("p", { class: "small", text: "Guides speak last and least. Aim for students doing about 95 percent of the talking. Rules can be tried for a set time and revisited." })]));
    out.appendChild(h("button", { class: "btn noprint", style: "align-self:flex-start", text: "🖨 Print agenda", onclick: () => print() }));
  };
  sel.onchange = () => { pick = sel.value; local.set("bg-th-date", pick); draw(); };
  sec.appendChild(out); draw();
}

/* ---------------- living document ---------------- */
VIEWS.living = async (sec, sub) => {
  head(sec, "A <span>living</span> document", "This guide changes as we learn. Here's what's still undecided, what's changed, and how to propose an improvement.");
  sec.appendChild(card("", [h("h3", { text: "How this guide changes" }), h("div", { class: "steps" }, [["Propose", "Any guide proposes a change below, with the reason or evidence."], ["Discuss", "Leadership brings proposals and open questions to All Hands."], ["Decide", "Leadership adopts or declines, with a reply."], ["Update", "The guide's text changes and the change is logged with a date."]].map(s => h("div", null, [h("b", { text: s[0] }), s[1]])))]));
  sec.appendChild(h("h2", { text: "Open questions" }));
  const g = h("div", { class: "grid g2" });
  D.OPEN.forEach(o => g.appendChild(card("", [h("h3", { id: "o-" + o.id, text: "⚑ " + o.q, style: sub === o.id ? "color:var(--gold)" : "" }), h("p", { class: "dim", text: o.why }), h("p", { class: "small", text: "Sources: " + o.sources })])));
  sec.appendChild(g);
  if (sub) setTimeout(() => { const t = document.getElementById("o-" + sub); t && t.scrollIntoView({ block: "center" }); }, 30);
  sec.appendChild(h("h2", { text: "Proposals" }));
  const t = h("input", { type: "text", id: "pT", maxlength: 120, placeholder: "One-line change" }), b = h("textarea", { id: "pB", maxlength: 1500, placeholder: "What should change, why, and any evidence or example. No student names." }), note = h("span", { class: "small" }), list = h("div", { class: "grid", style: "gap:10px" });
  sec.appendChild(card("", [h("label", { for: "pT" }, ["Proposal", t]), h("label", { for: "pB" }, ["Details", b]), h("div", { class: "row" }, [h("button", { class: "btn", text: "Propose", onclick: async () => { if (t.value.trim().length < 6 || b.value.trim().length < 20) { note.textContent = "Add a title and a few sentences."; return; } try { await addDoc(collection(db, "behaviorProposals"), { title: t.value.trim(), body: b.value.trim(), by: user.uid, name: myName(), status: "open", reply: "", created: Date.now() }); t.value = b.value = ""; note.textContent = "Proposed."; load(); } catch (e) { note.textContent = "Couldn't save. The database rules may not be published yet."; } } }), note])]));
  sec.appendChild(list);
  const load = async () => {
    list.innerHTML = "";
    try {
      const snap = await getDocs(query(collection(db, "behaviorProposals"), orderBy("created", "desc"), limit(100)));
      if (snap.empty) list.appendChild(h("p", { class: "dim", text: "No proposals yet." }));
      snap.forEach(d => { const p = d.data(); const c = card(p.status === "adopted" ? "S-edge" : p.status === "declined" ? "W-edge" : "", [h("div", { class: "row" }, [h("span", { class: "tag " + (p.status === "adopted" ? "S" : p.status === "declined" ? "W" : ""), text: p.status }), h("span", { class: "small", text: (p.name || "A guide") + " · " + fmtDate(p.created) })]), h("h3", { text: p.title }), h("p", { style: "white-space:pre-wrap", text: p.body }), p.reply ? h("div", { class: "note", text: "Leadership: " + p.reply }) : null]);
        if (isAdmin) { const r = h("input", { type: "text", maxlength: 400, placeholder: "Reply" }); r.value = p.reply || ""; c.append(r, h("div", { class: "row" }, [["adopted", "Adopt"], ["declined", "Decline"], ["open", "Reopen"]].map(([s, l]) => h("button", { class: "chip", text: l, onclick: async () => { try { await updateDoc(doc(db, "behaviorProposals", d.id), { status: s, reply: r.value.trim() }); load(); } catch (e) { toast("Couldn't save."); } } })))); }
        if (isAdmin || p.by === user.uid) c.appendChild(confirmTap(h("button", { class: "chip", style: "align-self:flex-start", text: "Delete" }), "delete", async () => { await deleteDoc(doc(db, "behaviorProposals", d.id)); load(); }));
        list.appendChild(c); });
    } catch (e) { list.appendChild(h("p", { class: "dim", text: "Proposals will appear here once the database rules are published." })); }
  };
  load();
  sec.appendChild(card("", [h("h3", { text: "Change log" }), ...D.CHANGELOG.map(c => h("div", null, [h("b", { text: "Edition " + c[0] + " · " + c[1] }), h("p", { class: "dim", text: c[2] })]))]));
  sec.appendChild(card("", [h("h3", { text: "Sources for this edition" }), ul(["Community Accountability System, Guide Reference Edition with exact parameters (2026-27)", "Revised Freedom Level Proposal for 2026-27", "Wilderland Behavior Policy (Notion, last updated Aug 2025)", "How Wilderland Supports Neurodivergent Children (Notion)", "MacKenzie Price, “What Happens When You Let Kids Choose Their Own Rules” (Future of Education, 2026)", "Staff discussion in #student-behavior and the operational-meeting channels (composites only)", "Research cards on the Evidence page"])]));
};

/* ---------------- admin ---------------- */
VIEWS.admin = async sec => {
  head(sec, "Admin", "Training roster and settings.");
  const box = card("", [h("h3", { text: "Training roster" })]); sec.appendChild(box);
  try {
    const snap = await getDocs(query(collection(db, "behaviorProgress"), limit(200)));
    if (snap.empty) box.appendChild(h("p", { class: "dim", text: "Nobody has started training yet." }));
    else box.appendChild(h("div", { class: "scroll", html: "<table><tr><th>Guide</th>" + D.MODULES.map(m => "<th title=\"" + esc(m.name) + "\">" + m.icon + "</th>").join("") + "<th>Certified</th></tr>" + snap.docs.map(d => { const p = d.data(), b = p.badges || {}; return "<tr><td>" + esc(p.name || p.email) + "</td>" + D.MODULES.map(m => "<td>" + (b[m.id] ? (b[m.id].passed ? "✓" : esc(b[m.id].best + "/" + b[m.id].total)) : "·") + "</td>").join("") + "<td>" + (p.certified ? "🏅" : "") + "</td></tr>"; }).join("") + "</table>" }));
  } catch (e) { box.appendChild(h("p", { class: "dim", text: "Publish the updated database rules to see the roster." })); }
  sec.appendChild(card("", [h("h3", { text: "Settings live elsewhere" }), ul(["Who can open this site: the staff list on the Mentor Mindset Field Guide's Admin stop (same list for both).", "AI relay address: also set on the Field Guide's Admin stop. Status here: " + (relay ? "connected" : "not set") + ".", "Content: edit behavior/data.js in the explore repository, then add a line to CHANGELOG."]), h("a", { class: "chip", style: "align-self:flex-start", href: "/fieldguide/#admin", text: "Open Field Guide admin →" })]));
};
