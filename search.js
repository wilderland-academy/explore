// Wilderland Explore search: ⌘K / Ctrl+K (or "/") on every page, or the 🔍 button in the top bar (/wlnav.js loads this
// file the first time it's opened). Everyone finds pages, challenges, books and project ideas. Staff also find students
// (Student Roster), Labs, Behavior topics and Staff Handbook sections (full text). Parents also find Labs. Each person
// only sees what they could open anyway: the lists come from the same pages and the same database rules, and test
// accounts show only in test views.
const GS = "https://www.gstatic.com/firebasejs/13.3.0/";
const FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[–—]/g, "-");

// ---------- who is searching ----------
function role() {
  if (window.wlRole !== undefined && window.wlRole) return window.wlRole;
  try { const c = JSON.parse(localStorage.getItem("wl-role") || "null"); if (c) return { role: c.r, band: c.b, test: c.t, email: c.e }; } catch (e) { }
  return null;
}
const kind = () => { const r = role(); return r && r.role || "anon"; };

// ---------- pages: [title, url, sites it belongs to, extra words] ----------
// Sites: s = Students, g = Guides (staff), p = Parents, h = home. Staff see all; parents see Parents and Students;
// students see Students; signed-out visitors see Students and Parents.
const PAGES = [
  ["Explore home", "/", "h", "front door start"],
  ["Students home", "/students/", "s", "start"],
  ["Books (Lantern Stacks)", "/books/", "s", "read reading library lantern stacks shelf"],
  ["Challenges", "/challenges/", "s", "life skills map"],
  ["My progress", "/challenges/#progress", "s", "credits rank trail passes feats not yet"],
  ["Crew board", "/challenges/#progress", "s", "crew working on passed"],
  ["My goals", "/goals/", "s", "goal setting weekly monthly year academics apps math reading blazes habits"],
  ["Projects", "/projects/", "s", "atlas ideas sparks"],
  ["Mr. Fox", "/coach/", "s", "help chat conflict"],
  ["Store", "/store/", "s", "shop buy"],
  ["Suggestion Wall and Town Hall", "/suggest/", "s", "suggestion box wall ideas vote town hall"],
  ["Suggestion Wall (guides)", "/guides/suggest/", "g", "suggestion box wall ideas accept"],
  ["Camp Store (guides)", "/guides/store/", "g", "store rewards blazes incentives"],
  ["Guides home", "/guides/", "g", "staff"],
  ["Student Info (pickup, allergies, photos)", "/guides/roster/#info", "g", "directory contacts parents pickup emergency allergies allergy photo permission birthdays medical"],
  ["Mentor Mindset Field Guide", "/fieldguide/", "g", "mentor mindset coaching required training"],
  ["Field Guide: coach's tent", "/fieldguide/#coach", "g", "ask coach situation"],
  ["Field Guide: weekly 1:1s", "/fieldguide/#oneonone", "g", "one on one coaching weekly session 1:1 notes"],
  ["Field Guide: session room", "/fieldguide/#sessions", "g", "session room students record notes 1:1 coaching"],
  ["Field Guide: phrasebook", "/fieldguide/#phrases", "g", "phrases what to say"],
  ["Behavior Trail Guide", "/behavior/", "g", "behavior policy discipline"],
  ["Behavior: tiers", "/behavior/#tiers", "g", "tier consequences"],
  ["Behavior: Freedom Levels", "/behavior/#freedom", "g", "freedom level"],
  ["Behavior: knots (practice scenarios)", "/behavior/#knots", "g", "scenarios practice"],
  ["Behavior: toolkit", "/behavior/#toolkit", "g", "methods tools"],
  ["Behavior: Freedom Level tracker", "/behavior/#tracker", "g", "tracker students review"],
  ["Behavior: Town Hall", "/behavior/#townhall", "g", "town hall agenda"],
  ["Behavior: ask the coach", "/behavior/#coach", "g", "behavior coach"],
  ["Life Skills overview", "/guides/lifeskills/", "g", "band overview passed saved"],
  ["Challenges (guides)", "/guides/challenges/", "g", "challenge map"],
  ["Labs schedule", "/guides/lifeskills/#schedule", "g", "labs calendar"],
  ["Add a Lab", "/guides/lifeskills/#schedule=new", "g", "new lab"],
  ["Lab builder", "/guides/lifeskills/builder/", "g", "design lab scorecard"],
  ["Skill Lab ideas", "/guides/lifeskills/ideas/", "g", "lab ideas alpha workshops library"],
  ["How Labs run (Alpha's playbook)", "/guides/lifeskills/playbook/", "g", "alpha workshop test2pass skill validation playbook"],
  ["Validate a challenge", "/guides/lifeskills/#validate", "g", "log pass not yet validate"],
  ["Validate a group (end of a Lab)", "/guides/lifeskills/#validate=group", "g", "log pass many students lab"],
  ["Crew board (guides)", "/guides/lifeskills/#board", "g", "crew working"],
  ["Students (roster and parents)", "/guides/roster/", "g", "students parents roster student roster"],
  ["Add students", "/guides/roster/#add", "g", "new student import csv"],
  ["Mr. Fox alerts", "/guides/roster/#alerts", "g", "alerts flags"],
  ["All Mr. Fox conversations", "/guides/roster/#chats", "g", "chats conversations"],
  ["Parent Comms", "/guides/parents/", "g", "parent communication email draft"],
  ["Staff Handbook", "/guides/handbook/", "g", "handbook policies"],
  ["Policies & Resources", "/guides/policies/", "g", "policy policies forms resources"],
  ["Wilderland Guides on your phone (app)", "/guides/app/", "g", "app iphone android phone mobile home screen install"],
  ["Elective Time Off form", "/guides/policies/", "g", "pto time off day off vacation leave coverage form"],
  ["Role Clarity and Updates", "/guides/policies/#role-clarity", "g", "roles who owns what responsibilities coverage spending amazon"],
  ["Guide Standards & Expectations", "/guides/policies/#guide-standards", "g", "standards daily rhythm schedule pilot expectations"],
  ["Two-Adult Minimum", "/guides/policies/#two-adult", "g", "two adult ratio supervision coverage one-on-one field trip"],
  ["Raising Concerns", "/guides/policies/#raising-concerns", "g", "concern complaint whistleblower retaliation track b child safety"],
  ["Trail Partner and your conversations", "/guides/partner/", "g", "history saved drafts conversations chats mentor ai"],
  ["Parents home", "/parents/", "p", "families"],
  ["Wilderland at Home", "/parents/athome/", "p", "home routine schedule part time"],
  ["Our Approach", "/parents/approach/", "p", "approach how it works"],
  ["Field Notes", "/parents/series/", "p", "series articles"],
  ["My child (parents)", "/parents/lifeskills/", "p", "my children profile progress life skills tracker goals books"],
  ["Labs schedule (parents)", "/parents/lifeskills/#schedule", "p", "labs calendar"],
  ["Challenges (parents)", "/parents/challenges/", "p", "challenge map"],
  ["Passing off at home", "/parents/passoff/", "p", "pass off home log sheet"],
  ["How Mr. Fox keeps students safe", "/parents/ai/", "p", "ai safety coach"]
];
const SITES_FOR = { staff: "hsgp", parent: "hsp", student: "hs", anon: "hsp" };

// ---------- the index, built in pieces as each source arrives ----------
const IX = { pages: [], challenges: [], books: [], projects: [], students: [], info: [], labs: [], behavior: [], handbook: [], policies: [] };
const GROUPS = [["pages", "Pages", 6], ["students", "Students", 6], ["info", "Student Info", 6], ["challenges", "Challenges", 8], ["labs", "Labs", 5], ["handbook", "Staff Handbook", 6], ["policies", "Policies", 6], ["behavior", "Behavior Guide", 5], ["books", "Books", 6], ["projects", "Project ideas", 6]];
let loading = 0, built = false;
const add = (g, items) => { IX[g] = items; draw(); };
async function job(f) { loading++; draw(); try { await f(); } catch (e) { console.warn("Search:", e); } loading--; draw(); }

function chHref(id) { const k = kind(); return (k === "staff" ? "/guides/challenges/" : k === "parent" ? "/parents/challenges/" : "/challenges/") + "#c=" + encodeURIComponent(id); }
async function fbUser() {
  if (window.wlFirebase) return window.wlFirebase.auth.currentUser;
  try { const a = await import(GS + "firebase-app.js"); if (!a.getApps().length) return null; const au = await import(GS + "firebase-auth.js"); return au.getAuth(a.getApps()[0]).currentUser; } catch (e) { return null; }
}
async function fsList(coll, tok) {
  const out = []; let page = "";
  do {
    const r = await fetch(`${FS}/${coll}?pageSize=300${page ? "&pageToken=" + encodeURIComponent(page) : ""}`, { headers: { Authorization: "Bearer " + tok } });
    if (!r.ok) throw new Error(coll + " " + r.status);
    const j = await r.json();
    (j.documents || []).forEach(d => { const f = d.fields || {}, v = x => x ? (x.stringValue ?? x.booleanValue ?? (x.arrayValue ? (x.arrayValue.values || []).map(y => y.stringValue) : null)) : null; out.push({ id: d.name.split("/").pop(), name: v(f.name), title: v(f.title), band: v(f.band), bands: v(f.bands), email: v(f.email), date: v(f.date), test: v(f.test) === true }); });
    page = j.nextPageToken || "";
  } while (page);
  return out;
}
function loadScript(src) { return new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }

function build() {
  if (built) return; built = true;
  const k = kind(), r = role() || {}, sites = SITES_FOR[k] || SITES_FOR.anon, test = !!r.test;
  IX.pages = PAGES.filter(p => sites.includes(p[2])).map(([t, u, s, w]) => ({ t, u, sub: { s: "Students", g: "Guides", p: "Parents", h: "Explore" }[s], w }));
  // Staff: Trail Partner, as an action.
  if (k === "staff") IX.pages.push({ step: "partner", t: "Ask Trail Partner 🐲", act: q => window.wlOpenMentor && window.wlOpenMentor(q ? { prefill: q } : undefined), sub: "Guides", w: "mentor ai help question policy" });
  // Challenges (students see their own band and older, as on the map).
  job(async () => {
    if (!window.WL) await loadScript("/challenges/data.js");
    const W = window.WL, SK = {}; W.skills.forEach(s => SK[s.k] = s);
    const order = ["K–1", "2–4", "5–8"], from = k === "student" && order.includes(r.band) ? order.indexOf(r.band) : 0;
    add("challenges", W.ch.filter(c => order.indexOf(c.b) >= from).map(c => { const sk = SK[(W.comps[c.c] || {}).k] || {}; return { t: c.t, u: chHref(c.id), sub: `${sk.n || ""} · ${c.id} · grades ${c.b}`, w: c.id + " " + (sk.n || ""), col: sk.col }; }));
  });
  // Books and project ideas, read from their own pages (the same lists the pages use).
  job(async () => {
    const t = await (await fetch("/books/")).text(), seen = new Set(), out = [];
    const push = (id, ti, a) => { if (seen.has(id)) return; seen.add(id); out.push({ t: ti.replace(/\\"/g, '"'), u: "/books/#book-" + id, sub: a ? "by " + a.replace(/\\"/g, '"') : "Book", w: a }); };
    for (const m of t.matchAll(/\{id:"([^"]+)",t:"((?:[^"\\]|\\.)*)",a:"((?:[^"\\]|\\.)*)"/g)) push(m[1], m[2], m[3]);
    for (const m of t.matchAll(/"id": "([^"]+)", "t": "((?:[^"\\]|\\.)*)", "a": "((?:[^"\\]|\\.)*)"/g)) push(m[1], m[2], m[3]);
    add("books", out);
  });
  job(async () => {
    const t = await (await fetch("/projects/")).text(), out = [];
    for (const m of t.matchAll(/^W\("([^"]+)", "([^"]+)", "((?:[^"\\]|\\.)*)", "((?:[^"\\]|\\.)*)"/gm)) out.push({ t: m[3], u: "/projects/#" + m[2], sub: m[4], w: m[1] });
    add("projects", out);
  });
  if (k === "staff") {
    // Behavior Guide topics (staff pages; the data file is public like the page).
    job(async () => {
      const D = await import("/behavior/data.js");
      add("behavior", [...D.STANDARDS.map(s => ({ t: s.name, u: "/behavior/#standard/" + s.id, sub: "Standard · " + (s.short || ""), w: (s.rules || []).join(" ") })),
        ...D.KNOTS.map(x => ({ t: x.title, u: "/behavior/#knots/" + x.id, sub: "Practice knot · " + (x.band || ""), w: (x.where || "") + " " + (x.story || "") })),
        ...D.TOOLS.map(x => ({ t: x.name, u: "/behavior/#toolkit", sub: "Toolkit · " + (x.when || ""), w: "" }))]);
    });
  }
  if (k === "staff" || k === "parent") {
    job(async () => {
      const u = await fbUser(); if (!u) return;
      const tok = await u.getIdToken();
      // Labs (staff and linked parents can read them; parents see their children's bands).
      const labsP = fsList("labs", tok).then(ls => {
        const mine = k === "parent" ? (r.bands || (r.band ? [r.band] : [])) : null;
        add("labs", ls.filter(l => !!l.test === test || (test && !l.test)).filter(l => !mine || !mine.length || (l.bands || []).some(b => mine.includes(b)))
          .sort((a, b) => String(b.date).localeCompare(String(a.date)))
          .map(l => ({ t: l.title, u: (k === "staff" ? "/guides/lifeskills/" : "/parents/lifeskills/") + "#schedule=" + l.id, sub: `Lab · ${l.date || ""} · grades ${(l.bands || []).join(", ")}`, w: "lab" })));
      }).catch(() => { });
      // Students, for staff: straight to their Student Roster page.
      const studentsP = k !== "staff" ? null : fsList("lsStudents", tok).then(ss => add("students", ss.filter(s => s.test === test)
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map(s => ({ t: s.name, u: "/guides/roster/#s=" + encodeURIComponent(s.email ? String(s.email).toLowerCase() : "sid:" + s.id), sub: `Student · grades ${s.band || "?"}${s.email ? " · " + s.email : ""}`, w: s.email })))).catch(() => { });
      // Student Info (directory, pickup, allergies, photo permission, birthday), for staff: straight to the student's card.
      // Only names go into the search list; the details stay on the Student Info page.
      const infoP = k !== "staff" || test ? null : (async () => {
        const r = await fetch(`${FS}/studentInfo?pageSize=300&mask.fieldPaths=first&mask.fieldPaths=last&mask.fieldPaths=nick&mask.fieldPaths=grade&mask.fieldPaths=band`, { headers: { Authorization: "Bearer " + tok } });
        if (!r.ok) return;
        const v = x => x && x.stringValue || "";
        add("info", ((await r.json()).documents || []).map(d => ({ id: d.name.split("/").pop(), f: d.fields || {} })).filter(d => d.id !== "meta")
          .map(({ id, f }) => ({ t: v(f.first) + (v(f.nick) ? " (" + v(f.nick) + ")" : "") + " " + v(f.last), u: "/guides/roster/#info=" + id, sub: `Student Info · ${v(f.grade) === "K" ? "K" : "grade " + v(f.grade)} · family, pickup, allergies, photo permission, birthday`, w: v(f.nick) + " student info allergy pickup" })));
      })().catch(() => { });
      await Promise.all([labsP, studentsP, infoP]);
    });
    // The Staff Handbook, full text (school staff only; it's read from the relay, never stored in the site).
    if (k === "staff" && String((role() || {}).real || (role() || {}).email || "").endsWith("@wilderland.academy") && !test) job(async () => {
      const u = await fbUser(); if (!u) return;
      const tok = await u.getIdToken();
      const cfg = await (await fetch(FS + "/mentorConfig/main", { headers: { Authorization: "Bearer " + tok } })).json();
      const relay = cfg.fields && cfg.fields.relay && cfg.fields.relay.stringValue; if (!relay) return;
      const res = await fetch(relay, { method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: JSON.stringify({ mode: "doc", key: "handbook" }) });
      if (!res.ok) return;
      const text = (await res.json()).text || "", out = [];
      let cur = null;
      text.split("\n").forEach(line => {
        const m = /^##\s+(\d+)\.\s+(.+)$/.exec(line);
        if (m) { cur = { n: m[1], t: m[2].trim(), body: [] }; out.push(cur); } else if (cur) cur.body.push(line);
      });
      add("handbook", out.map(s => ({ t: s.n + ". " + s.t, u: "/guides/handbook/#s" + s.n, sub: "Staff Handbook", body: s.body.join(" ").replace(/\s+/g, " ") })));
      // The other staff policies (Policies & Resources), section by section. Keep in step with DOCS in /guides/policies/.
      const slug = s => String(s).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
      const pol = await Promise.all([["role-clarity", "policy-role-clarity", "Role Clarity"], ["guide-standards", "policy-guide-standards", "Guide Standards"], ["two-adult", "policy-two-adult", "Two-Adult Minimum"], ["raising-concerns", "policy-raising-concerns", "Raising Concerns"]].map(async ([id, key, title]) => {
        const r = await fetch(relay, { method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: JSON.stringify({ mode: "doc", key }) }).catch(() => null);
        if (!r || !r.ok) return [];
        const secs = []; let c = null;
        ((await r.json()).text || "").split("\n").forEach(line => {
          const m = /^#{2,3}\s+(.+)$/.exec(line.trim());
          if (m) { c = { t: m[1].trim(), body: [] }; secs.push(c); } else if (c) c.body.push(line);
        });
        return secs.map(s => ({ t: s.t, u: "/guides/policies/#" + id + "--" + slug(s.t), sub: title, body: s.body.join(" ").replace(/[*|#]+/g, " ").replace(/\s+/g, " ") }));
      }));
      add("policies", pol.flat());
    });
  }
}

// ---------- matching ----------
// Every word must appear in the title, the extra words or (handbook) the text. Title matches rank first.
function score(it, words, q) {
  const t = norm(it.t), w = norm(it.w || "") + " " + norm(it.sub || ""), b = it.body ? norm(it.body) : "";
  let s = 0;
  for (const x of words) {
    if (t.startsWith(x)) s += 6; else if (new RegExp("(^|[^a-z0-9])" + x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(t)) s += 4; else if (t.includes(x)) s += 3;
    else if (w.includes(x)) s += 1.5; else if (b.includes(x)) s += 0.6; else return 0;
  }
  if (t === q) s += 10;
  // On a tie, the shorter title (the closer match) first.
  return s - Math.min(t.length, 400) / 1000;
}
function snippet(body, words) {
  const b = norm(body), i = Math.min(...words.map(x => { const k = b.indexOf(x); return k < 0 ? Infinity : k; }));
  if (!isFinite(i)) return "";
  const a = Math.max(0, i - 50);
  return (a ? "…" : "") + body.slice(a, a + 150).trim() + "…";
}
// Parts of the Guides site a guide hasn't trained for yet stay out of search too (/wlnav.js decides, from onboarding).
const shown = it => !(it.step && window.wlStepHidden && window.wlStepHidden(it.step)) && (!it.u || !window.wlHiddenPath || !window.wlHiddenPath(it.u));
function results(q) {
  const nq = norm(q).trim(), words = nq.split(/\s+/).filter(Boolean);
  if (!words.length) return [["pages", IX.pages.filter(shown).slice(0, 8)]];
  return GROUPS.map(([g, , max]) => [g, IX[g].filter(shown).map(it => [score(it, words, nq), it]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, max).map(x => x[1])]).filter(x => x[1].length);
}

// ---------- the dialog ----------
const CSS = `
.wls-back{position:fixed;inset:0;z-index:200;background:rgba(5,20,15,.55);display:flex;justify-content:center;align-items:flex-start;padding:10vh 16px 16px;font:400 15px/1.4 Inter,"Uncut Sans",system-ui,sans-serif}
.wls{width:min(640px,100%);max-height:76vh;display:flex;flex-direction:column;background:#fff;color:#121213;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);overflow:hidden}
.wls-top{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #e4e7e2}
.wls-top svg{width:20px;height:20px;flex:none;color:#4d4d51}
.wls-top input{flex:1;min-width:0;border:0;outline:0;font:500 18px/1.3 inherit;font-family:inherit;color:#121213;background:none}
.wls-top kbd,.wls-foot kbd{font:600 12px/1 ui-monospace,Menlo,monospace;border:1px solid #c9c9c9;border-bottom-width:2px;border-radius:5px;padding:3px 6px;color:#4d4d51;background:#fafafa}
.wls-x{border:0;background:none;font:600 14px inherit;font-family:inherit;color:#015640;cursor:pointer;padding:6px}
.wls-list{overflow-y:auto;padding:6px 8px 10px;overscroll-behavior:contain}
.wls-h{margin:12px 8px 4px;font:700 11.5px/1 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b6b70}
.wls-i{display:flex;gap:10px;align-items:flex-start;padding:9px 10px;border-radius:10px;color:inherit;text-decoration:none;cursor:pointer}
.wls-i[aria-selected=true]{background:#eef6e0}
.wls-i i{flex:none;width:6px;align-self:stretch;border-radius:3px;background:#015640}
.wls-i b{font-weight:600;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.wls-i small{display:block;color:#5b5b60;font-size:13px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.wls-i mark{background:#e6f5a8;color:inherit;border-radius:2px}
.wls-empty{padding:22px 12px;color:#5b5b60;text-align:center}
.wls-foot{display:flex;gap:14px;align-items:center;padding:9px 16px;border-top:1px solid #e4e7e2;color:#6b6b70;font-size:12.5px}
.wls-foot .ld{margin-left:auto}
@media (max-width:640px){.wls-back{padding:8px}.wls{max-height:calc(100vh - 16px);max-height:calc(100dvh - 16px)}.wls-foot .keys{display:none}.wls-top kbd{display:none}}
`;
let back = null, input = null, list = null, foot = null, sel = 0, flat = [], lastFocus = null;
function mark(t, words) {
  let h = esc(t);
  words.filter(w => w.length > 1).forEach(w => { h = h.replace(new RegExp("(" + esc(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
  return h;
}
function draw() {
  if (!back) return;
  const q = input.value, words = norm(q).trim().split(/\s+/).filter(Boolean), groups = results(q);
  flat = []; let html = "";
  const label = Object.fromEntries(GROUPS.map(g => [g[0], g[1]]));
  groups.forEach(([g, items]) => {
    html += `<p class="wls-h">${esc(words.length ? label[g] : "Jump to")}</p>`;
    items.forEach(it => {
      const i = flat.length; flat.push(it);
      const sub = it.body ? snippet(it.body, words) || it.sub : it.sub;
      html += `<a class="wls-i" role="option" id="wls-o${i}" data-i="${i}" ${it.u ? `href="${esc(it.u)}"` : 'href="#"'} aria-selected="${i === sel}"><i${it.col ? ` style="background:${esc(it.col)}"` : ""}></i><span><b>${mark(it.t, words)}</b>${sub ? `<small>${mark(sub, words)}</small>` : ""}</span></a>`;
    });
  });
  if (words.length && (kind() === "staff") && window.wlOpenMentor && !(window.wlStepHidden && window.wlStepHidden("partner"))) {
    const i = flat.length; flat.push({ t: "Ask Trail Partner", act: () => window.wlOpenMentor({ prefill: q }) });
    html += `<p class="wls-h">Not finding it?</p><a class="wls-i" role="option" id="wls-o${i}" data-i="${i}" href="#" aria-selected="${i === sel}"><i></i><span><b>Ask Trail Partner 🐲: “${esc(q)}”</b><small>Answers from the Staff Handbook, the Behavior Policy and our approach.</small></span></a>`;
  }
  if (!flat.length) html = `<p class="wls-empty">${loading ? "Searching…" : "Nothing matches “" + esc(q) + "”. Try fewer or different words."}</p>`;
  if (sel >= flat.length) sel = Math.max(0, flat.length - 1);
  list.innerHTML = html;
  input.setAttribute("aria-activedescendant", flat.length ? "wls-o" + sel : "");
  foot.querySelector(".ld").textContent = loading ? "Loading more…" : "";
}
function move(d) {
  if (!flat.length) return;
  sel = (sel + d + flat.length) % flat.length;
  list.querySelectorAll(".wls-i").forEach(a => a.setAttribute("aria-selected", String(+a.dataset.i === sel)));
  input.setAttribute("aria-activedescendant", "wls-o" + sel);
  const el = list.querySelector(`[data-i="${sel}"]`); if (el) el.scrollIntoView({ block: "nearest" });
}
function go(i, newTab) {
  const it = flat[i]; if (!it) return;
  if (it.act) { close(); it.act(input.value.trim()); return; }
  if (newTab) { window.open(it.u, "_blank", "noopener"); return; }
  close();
  const u = new URL(it.u, location.href);
  location.href = it.u;
  // Same page, different view (a #hash): make sure the page notices even if the hash is unchanged.
  if (u.pathname === location.pathname && u.hash === location.hash) dispatchEvent(new HashChangeEvent("hashchange"));
}
export function open() {
  if (back) { input.focus(); input.select(); return; }
  lastFocus = document.activeElement;
  if (!document.getElementById("wls-css")) { const s = document.createElement("style"); s.id = "wls-css"; s.textContent = CSS; document.head.appendChild(s); }
  back = document.createElement("div"); back.className = "wls-back";
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  back.innerHTML = `<div class="wls" role="dialog" aria-modal="true" aria-label="Search Explore">
    <div class="wls-top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input type="search" placeholder="Search pages, challenges, books${kind() === "staff" ? ", students, the handbook" : ""}…" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="wls-list" autocomplete="off" spellcheck="false">
      <kbd>esc</kbd><button class="wls-x" type="button" aria-label="Close search">Close</button></div>
    <div class="wls-list" id="wls-list" role="listbox"></div>
    <div class="wls-foot"><span class="keys"><kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>enter</kbd> to open · <kbd>${mac ? "⌘" : "Ctrl"}</kbd> <kbd>K</kbd> anywhere</span><span class="ld"></span></div></div>`;
  document.body.appendChild(back);
  input = back.querySelector("input"); list = back.querySelector(".wls-list"); foot = back.querySelector(".wls-foot");
  input.addEventListener("input", () => { sel = 0; draw(); });
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") { e.preventDefault(); go(sel, e.metaKey || e.ctrlKey); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
  });
  list.addEventListener("click", e => { const a = e.target.closest(".wls-i"); if (!a) return; if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); go(+a.dataset.i); });
  list.addEventListener("mousemove", e => { const a = e.target.closest(".wls-i"); if (a && +a.dataset.i !== sel) { sel = +a.dataset.i; list.querySelectorAll(".wls-i").forEach(x => x.setAttribute("aria-selected", String(x === a))); } });
  back.addEventListener("mousedown", e => { if (e.target === back) close(); });
  back.querySelector(".wls-x").addEventListener("click", close);
  document.documentElement.style.overflow = "hidden";
  build(); sel = 0; draw(); input.focus();
}
export function close() {
  if (!back) return;
  back.remove(); back = null; document.documentElement.style.overflow = "";
  if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { }
}
// The index depends on who's signed in: start again if that changes.
document.addEventListener("wl-role", () => { built = false; Object.keys(IX).forEach(k => IX[k] = []); if (back) { build(); draw(); } });
