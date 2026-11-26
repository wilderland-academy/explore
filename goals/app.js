// My goals (students site). A student sets goals for this week, this month and the school year: Life Skills
// challenges, academic apps (by grade, from /goals/apps.js), Camp Store rewards, projects, and habits or behavior.
// A current Life Skills goal and a current academic goal are expected; the rest are optional.
// Saved in localStorage "wl-goals"; /auth.js copies it to the student's own record (students/{uid}/sites/goals).
// Life Skills goals fill in by themselves from the passes guides record in the tracker (lsStudents/{sid}/entries).
(function () {
  const KEY = "wl-goals";
  const W = window.WL || { ch: [], skills: [], comps: {} }, APPS = window.WLApps;
  const CH = {}; W.ch.forEach(c => { CH[c.id] = c; });
  const SKILL = {}; W.skills.forEach(s => { SKILL[s.k] = s; });
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = n => String(n).padStart(2, "0");
  const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parse = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => iso(new Date());
  const fmt = s => s ? parse(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ---------- when each kind of goal is due ----------
  const SPANS = { week: "This week", month: "This month", year: "This school year" };
  function schoolYearEnd(d) { const y = d.getMonth() >= 7 ? d.getFullYear() + 1 : d.getFullYear(); return new Date(y, 4, 31); }
  function schoolYearStart(d) { const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return new Date(y, 7, 1); }
  function dueFor(span, from) {
    const d = from ? parse(from) : new Date();
    if (span === "week") { const day = d.getDay(), add = day === 6 ? 6 : day === 0 ? 5 : 5 - day; return iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + add)); }
    if (span === "month") return iso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    return iso(schoolYearEnd(d));
  }
  function startFor(span, due) {
    const d = parse(due);
    if (span === "week") { const back = (d.getDay() + 6) % 7; return iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() - back)); }
    if (span === "month") return iso(new Date(d.getFullYear(), d.getMonth(), 1));
    return iso(schoolYearStart(d));
  }

  // ---------- saved data ----------
  let S = { grade: "", list: [] };
  try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && Array.isArray(v.list)) S = { grade: v.grade || "", list: v.list, gg: v.gg || [] }; } catch (e) { }
  // /auth.js copies this to the student's account and to lsShared/{sid}/sites/goals for their guides and parents.
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };

  // ---------- who's signed in, and their Life Skills passes ----------
  let ROLE = null, PASSES = null, BAND = null;   // PASSES: [{ cid, date }] once loaded
  const FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
  const val = v => !v ? null : "stringValue" in v ? v.stringValue : "integerValue" in v ? Number(v.integerValue) : "booleanValue" in v ? v.booleanValue : null;
  async function loadPasses(sid) {
    const u = window.wlFirebase && window.wlFirebase.auth.currentUser; if (!u) return;
    const H = { Authorization: "Bearer " + await u.getIdToken() }, out = [];
    let page = "";
    do {
      const r = await fetch(`${FS}/lsStudents/${sid}/entries?pageSize=300` + (page ? "&pageToken=" + encodeURIComponent(page) : ""), { headers: H });
      if (!r.ok) throw new Error("entries " + r.status);
      const j = await r.json();
      (j.documents || []).forEach(d => { const f = d.fields || {}; if (val(f.result) === "pass") out.push({ cid: val(f.cid), date: val(f.date) || "", cr: val(f.credits) || 1 }); });
      page = j.nextPageToken || "";
    } while (page);
    PASSES = out;
  }
  // Goals a guide set with this student on the Guides site (guideGoals/{id}): added to the list once, then theirs
  // like any other goal (S.gg remembers which ones were added, so a goal they remove doesn't come back).
  async function pullGuideGoals(r) {
    const u = window.wlFirebase && window.wlFirebase.auth.currentUser; if (!u || !r.email) return;
    const eq = (f, v) => ({ fieldFilter: { field: { fieldPath: f }, op: "EQUAL", value: typeof v === "boolean" ? { booleanValue: v } : { stringValue: v } } });
    const where = r.test ? { compositeFilter: { op: "AND", filters: [eq("email", r.email), eq("test", true)] } } : eq("email", String(r.email).toLowerCase());
    const res = await fetch(FS + ":runQuery", { method: "POST", headers: { Authorization: "Bearer " + await u.getIdToken(), "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "guideGoals" }], where, limit: 100 } }) });
    if (!res.ok) throw new Error("guide goals " + res.status);
    S.gg = S.gg || []; let added = [];
    (await res.json()).filter(x => x.document).forEach(x => {
      const id = x.document.name.split("/").pop(), f = x.document.fields || {};
      if (S.gg.includes(id) || !!val(f.test) !== !!r.test) return;
      let g = null; try { g = JSON.parse(val(f.goal)); } catch (e) { }
      S.gg.push(id);
      if (!g || !g.area || !AREAS[g.area]) return;
      g = Object.assign(g, { id: "gg-" + id, by: val(f.byName) || "your guide", created: g.created || today(), at: 0, done: "" });
      if (!S.list.some(x => x.id === g.id)) { S.list.push(g); added.push(g); }
    });
    if (S.gg.length) save();
    if (added.length) { draw(); toast(added.length === 1 ? `${added[0].by} added a goal you set together.` : `Your guide added ${added.length} goals you set together.`); }
  }
  // Takeaways a Field Guide shared after a Summit Session (coachShare, /fieldguide/): what they talked about and what the student
  // said they'd do. Newest first; the latest is open.
  async function loadOneOnOnes(r) {
    const u = window.wlFirebase && window.wlFirebase.auth.currentUser, box = $("#oneonone"); if (!u || !r.email || !box) return;
    const auth = { Authorization: "Bearer " + await u.getIdToken(), "Content-Type": "application/json" };
    const fam = { fieldFilter: { field: { fieldPath: "family" }, op: "ARRAY_CONTAINS", value: { stringValue: String(r.email).toLowerCase() } } };
    const where = r.test ? { compositeFilter: { op: "AND", filters: [fam, { fieldFilter: { field: { fieldPath: "test" }, op: "EQUAL", value: { booleanValue: true } } }] } } : fam;
    let xs = [];
    try {
      const res = await fetch(FS + ":runQuery", { method: "POST", headers: auth, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "coachShare" }], where, limit: 60 } }) });
      if (!res.ok) throw new Error("Summit Sessions " + res.status);
      const arr = v => (v && v.arrayValue && v.arrayValue.values || []).map(val).filter(Boolean);
      xs = (await res.json()).filter(x => x.document).map(x => { const f = x.document.fields || {}; return { at: val(f.sessionAt) || val(f.at) || 0, by: val(f.byName) || "your guide", talked: arr(f.talked), actions: arr(f.actions), checkIn: val(f.checkIn) || "", test: !!val(f.test) }; })
        .filter(x => x.test === !!r.test).sort((a, b) => b.at - a.at);
    } catch (e) { console.warn("Summit Session takeaways:", e); }
    // What the student wants to talk about at their next Summit Session (coachAgenda/{sid}): their guide sees it before the meeting.
    let agenda = [], agendaAt = 0;
    if (r.sid) try {
      const res = await fetch(FS + "/coachAgenda/" + encodeURIComponent(r.sid), { headers: auth });
      if (res.ok) { const f = (await res.json()).fields || {}; agenda = (f.items && f.items.arrayValue && f.items.arrayValue.values || []).map(val).filter(Boolean); agendaAt = val(f.at) || 0; }
    } catch (e) { }
    const day = ms => new Date(ms).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const one = x => `${x.actions.length ? `<h3>What you said you'd do</h3><ul class="acts">${x.actions.map(t => `<li><span>${esc(t)}</span></li>`).join("")}</ul>` : ""}${x.checkIn ? `<h3>When ${esc(x.by)} will check in</h3><p class="ck">${esc(x.checkIn)}</p>` : ""}${x.talked.length ? `<h3>What you talked about</h3><ul>${x.talked.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}`;
    const prep = r.sid ? `<div class="prep"><h2>For my next Summit Session</h2><p class="meta">Your weekly one-on-one with your guide. It's your meeting. Add what you want to talk about, one per line: anything at all, school or not. Your guide sees it before you meet.</p>
      <textarea id="agendaIn" rows="4" maxlength="1200" placeholder="A goal I want to work on&#10;Something that's in my way&#10;Something I'm proud of"></textarea>
      <details class="qs"><summary>Questions to think about first</summary><ul><li>What do I want to get done or get better at?</li><li>What's in my way?</li><li>Why does it matter to me? What would it mean to get there?</li><li>What's one small step I could take this week?</li></ul></details>
      <div class="row"><button class="btn" id="agendaSave" type="button">Save for my Summit Session</button><span class="meta" id="agendaSt">${agenda.length ? "Saved " + esc(day(agendaAt)) + "." : ""}</span></div></div>` : "";
    box.innerHTML = prep + (xs.length ? `<h2${prep ? ' style="margin-top:22px"' : ""}>From your Summit Sessions</h2><p class="meta">With ${esc(xs[0].by)}, ${esc(day(xs[0].at))}. Turn what you said you'd do into a goal if it helps.</p>${one(xs[0])}` +
      (xs.length > 1 ? `<details><summary>Earlier Summit Sessions (${xs.length - 1})</summary>${xs.slice(1, 10).map(x => `<p class="meta" style="margin-top:12px">With ${esc(x.by)}, ${esc(day(x.at))}</p>${one(x)}`).join("")}</details>` : "") : "");
    if (!prep && !xs.length) { box.hidden = true; return; }
    if (prep) {
      const ta = $("#agendaIn"), st = $("#agendaSt"); ta.value = agenda.join("\n");
      $("#agendaSave").onclick = async () => {
        const items = ta.value.split("\n").map(x => x.replace(/^[-•*\s]+/, "").trim()).filter(Boolean).slice(0, 8).map(x => x.slice(0, 200));
        st.textContent = "Saving…";
        try {
          const fields = { items: { arrayValue: { values: items.map(x => ({ stringValue: x })) } }, at: { integerValue: String(Date.now()) } };
          if (r.test) fields.test = { booleanValue: true };
          const res = await fetch(FS + "/coachAgenda/" + encodeURIComponent(r.sid), { method: "PATCH", headers: { Authorization: "Bearer " + await u.getIdToken(), "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
          if (!res.ok) throw new Error(String(res.status));
          st.textContent = items.length ? "Saved. Your guide will see it before you meet." : "Cleared.";
        } catch (e) { st.textContent = "Couldn't save. Try again in a minute."; }
      };
    }
    box.hidden = false;
    if (/^#oneonone\b/.test(location.hash)) box.scrollIntoView({ block: "start" });
  }
  function onRole(r) {
    ROLE = r || null;
    if (r && r.role === "student") loadOneOnOnes(r).catch(e => console.warn("Summit Session takeaways:", e));
    if (r && r.role === "student") pullGuideGoals(r).catch(e => console.warn("Goals from guides:", e));
    BAND = r && r.band || BAND;
    if (r && r.role === "student" && !S.grade && /^[2-8]$/.test(String(r.grade || "").trim())) { S.grade = String(r.grade).trim(); save(); }
    if (r && r.role === "student" && r.sid) { loadPasses(r.sid).then(draw).catch(e => { console.warn("Goals:", e); draw(); }); }
    else draw();
  }

  // ---------- describing a goal and its progress ----------
  const AREAS = {
    life: { n: "Life Skills", e: "🧭", req: true },
    acad: { n: "Academics", e: "📚", req: true },
    store: { n: "Camp Store", e: "🔥" },
    project: { n: "Project", e: "🛠️" },
    habit: { n: "Habit or behavior", e: "🌱" }
  };
  const products = () => (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).map(p => ({ id: p.id, n: p.n, e: p.e, b: Math.round(p.p * 2) }));
  const PROD = {}; products().forEach(p => { PROD[p.id] = p; });
  function appOf(g) { return APPS.forGrade(g.grade || S.grade).find(a => a.id === g.app) || null; }
  function title(g) {
    if (g.area === "life") return g.kind === "one" ? "Pass “" + ((CH[g.item] || {}).t || "a challenge") + "”" : `Pass ${g.n} Life Skills challenge${g.n == 1 ? "" : "s"}`;
    if (g.area === "acad" && g.kind === "text") return g.text;   // K–1 (no app list): a goal in their own words
    if (g.area === "acad") { const nm = g.appName || (appOf(g) || {}).n || "App"; return g.kind === "finish" ? `${nm}: ${g.item}` : `${nm}: ${g.n} ${g.unit}`; }
    if (g.area === "store") return `Save ${g.n} blazes for ${g.item === "custom" ? g.text : (PROD[g.item] || {}).n || "a reward"}`;
    if (g.area === "habit") return g.text + (g.freq ? " (" + g.freq + ")" : "");
    return g.text;
  }
  // { at, of, auto } for goals that count something; null for goals you just finish.
  function progress(g) {
    if (g.area === "life" && g.kind === "count") {
      if (!PASSES) return { at: null, of: g.n, auto: true };
      const from = startFor(g.span, g.due);
      return { at: PASSES.filter(p => p.date >= from && p.date <= g.due).length, of: g.n, auto: true };
    }
    if (g.area === "life" && g.kind === "one") return PASSES ? { at: PASSES.some(p => p.cid === g.item && p.date >= iso(schoolYearStart(parse(g.due)))) ? 1 : 0, of: 1, auto: true, one: true } : { at: null, of: 1, auto: true, one: true };
    if ((g.area === "acad" && g.kind === "count") || g.area === "store") return { at: Number(g.at) || 0, of: Number(g.n) || 0 };
    return null;
  }
  // Passes already in the window a new count goal would cover (so a goal isn't met the moment it's set).
  const already = g => PASSES && g.due ? PASSES.filter(p => p.date >= startFor(g.span, g.due) && p.date <= g.due).length : 0;
  function status(g) {
    if (g.done) return "done";
    const p = progress(g);
    if (p && p.auto && p.at != null && p.at >= p.of) { g.done = today(); save(); return "done"; }
    return g.due < today() ? "past" : "active";
  }
  const current = g => status(g) === "active";

  // ---------- drawing ----------
  let FILTER = "all", EDIT = null, FORM = null;
  function goalCard(g) {
    const st = status(g), a = AREAS[g.area], p = progress(g), pct = p && p.of ? Math.min(100, Math.round((p.at || 0) / p.of * 100)) : 0;
    const left = Math.round((parse(g.due) - parse(today())) / 864e5);
    const when = st === "done" ? "Done " + fmt(g.done) : st === "past" ? "Was due " + fmt(g.due) : left === 0 ? "Due today" : left === 1 ? "Due tomorrow" : `By ${fmt(g.due)} · ${left} days left`;
    let prog = "";
    if (p && p.auto) prog = p.at == null ? `<p class="small dim">Fills in from your Life Skills passes once you're signed in and on the tracker.</p>`
      : p.one ? `<p class="small dim">${p.at ? "Passed." : "Not passed yet. Your guide records it when you pass."}</p>` : `<div class="bar" aria-label="${p.at} of ${p.of}"><i style="width:${pct}%"></i></div><p class="small dim">${p.at} of ${p.of} passed ${g.span === "year" ? "this school year" : g.span === "month" ? "this month" : "this week"}. Your guide records each pass.</p>`;
    else if (p) prog = `<div class="bar"><i style="width:${pct}%"></i></div><label class="small dim at">So far: <input type="number" min="0" inputmode="numeric" data-at="${g.id}" value="${esc(p.at)}" aria-label="How far you are"> of ${esc(p.of)} ${esc(g.area === "store" ? "blazes" : g.unit)}</label>`;
    const why = g.why ? `<p class="why">Why: ${esc(g.why)}</p>` : "";
    const acts = st === "done" ? `<button class="ghost" data-undone="${g.id}">Not done yet</button>`
      : st === "past" ? `<button class="ghost" data-renew="${g.id}">Go again: ${esc(SPANS[g.span].toLowerCase())}</button>`
      : (p && p.auto ? "" : `<button class="ghost" data-done="${g.id}">${g.area === "habit" ? "✓ I kept it" : "✓ Done"}</button>`) + `<button class="ghost" data-edit="${g.id}">Edit</button>`;
    return `<li class="goal ${st}" data-area="${g.area}"><div class="gh"><span class="tag">${a.e} ${esc(a.n)}</span><span class="when">${esc(when)}</span></div>
      <p class="gt">${st === "done" ? "✓ " : ""}${esc(title(g))}</p>${g.by ? `<p class="by">Set with ${esc(g.by)}</p>` : ""}${why}${prog}
      <div class="acts">${acts}<button class="ghost x" data-del="${g.id}" aria-label="Remove this goal">Remove</button></div></li>`;
  }
  function needs() {
    const act = S.list.filter(current);
    return { life: act.some(g => g.area === "life"), acad: act.some(g => g.area === "acad") };
  }
  function draw() {
    const nd = needs();
    $("#need").innerHTML = `<p class="ey">What's expected</p><p>Every Wilderland student keeps two goals going all the time: one for <b>Life Skills</b> and one for <b>academics</b>. Everything else is up to you.</p>
      <div class="needs">${[["life", "Life Skills goal", "a Life Skills goal"], ["acad", "Academic goal", "an academic goal"]].map(([k, n, a]) => nd[k]
        ? `<span class="ok">✓ ${n} set</span>` : `<button class="btn" type="button" data-new="${k}">+ Set ${a}</button>`).join("")}</div>`;
    $("#need").className = "box need" + (nd.life && nd.acad ? " met" : "");
    // Grade picker (for the academic apps).
    $("#grade").innerHTML = `<option value="">Pick your grade</option>` + APPS.GRADES.map(g => `<option value="${g}"${S.grade === g ? " selected" : ""}>Grade ${g}</option>`).join("") + `<option value="K1"${S.grade === "K1" ? " selected" : ""}>Kindergarten or 1st</option>`;
    const act = S.list.filter(current), counts = { week: 0, month: 0, year: 0 };
    act.forEach(g => { counts[g.span]++; });
    $("#filters").innerHTML = [["all", "All current", act.length], ["week", "This week", counts.week], ["month", "This month", counts.month], ["year", "This school year", counts.year]]
      .map(([k, n, c]) => `<button type="button" data-filter="${k}" class="${FILTER === k ? "on" : ""}">${n} <span>${c}</span></button>`).join("");
    const spans = FILTER === "all" ? ["week", "month", "year"] : [FILTER];
    $("#goals").innerHTML = spans.map(sp => {
      const gs = act.filter(g => g.span === sp).sort((a, b) => a.due.localeCompare(b.due) || Number(!AREAS[a.area].req) - Number(!AREAS[b.area].req));
      return `<section class="span"><div class="sh"><h2>${SPANS[sp]}</h2><button class="ghost" type="button" data-new-span="${sp}">+ Add</button></div>
        ${gs.length ? `<ul class="glist">${gs.map(goalCard).join("")}</ul>` : `<p class="empty">${sp === "week" ? "Nothing for this week yet. A weekly goal is the easiest one to keep." : sp === "month" ? "No goals for this month yet." : "No goals for the school year yet. Where do you want to be by May?"}</p>`}</section>`;
    }).join("");
    const old = S.list.filter(g => !current(g)).sort((a, b) => (b.done || b.due).localeCompare(a.done || a.due));
    $("#history").innerHTML = old.length ? `<details><summary>Finished and past goals (${old.length})</summary><ul class="glist">${old.map(goalCard).join("")}</ul></details>` : "";
    drawForm();
  }

  // ---------- the add / edit form ----------
  function blank(area, span) { const sp = span || "week"; return { id: "", area: area || "", span: sp, due: dueFor(sp), kind: area === "life" ? "count" : area === "acad" ? "" : "", n: area === "life" ? (sp === "year" ? 16 : sp === "month" ? 2 : 1) : "", unit: "", app: "", item: "", text: "", freq: "", why: "", at: 0 }; }
  function open(g) { FORM = Object.assign({}, g); if (!g.id && g.area === "life" && g.kind === "count") FORM.n = Math.max(Number(FORM.n) || 1, already(FORM) + 1); EDIT = g.id || null; drawForm(); const f = $("#form"); f.hidden = false; f.scrollIntoView({ block: "start", behavior: "smooth" }); }
  function close() { FORM = null; EDIT = null; $("#form").hidden = true; }
  const opt = (v, label, cur) => `<option value="${esc(v)}"${String(cur) === String(v) ? " selected" : ""}>${esc(label)}</option>`;
  function challengeOptions(cur) {
    const band = BAND && BAND !== "K–1" ? BAND : null;
    const list = W.ch.filter(c => !band || c.b === band);
    const bySkill = {};
    list.forEach(c => { const k = (W.comps[c.c] || {}).k; (bySkill[k] = bySkill[k] || []).push(c); });
    return W.skills.map(s => bySkill[s.k] ? `<optgroup label="${esc(s.n)}">${bySkill[s.k].map(c => opt(c.id, c.t.length > 90 ? c.t.slice(0, 88) + "…" : c.t, cur)).join("")}</optgroup>` : "").join("");
  }
  function storeOptions(cur) {
    let wish = [];
    try { wish = (JSON.parse(localStorage.getItem("wl-store") || "{}").wish || []).filter(id => PROD[id]); } catch (e) { }
    const all = products().sort((a, b) => a.n.localeCompare(b.n));
    return (wish.length ? `<optgroup label="On your Camp Store list">${wish.map(id => opt(id, PROD[id].n + " · " + PROD[id].b + " blazes", cur)).join("")}</optgroup>` : "")
      + `<optgroup label="Everything in the Camp Store">${all.map(p => opt(p.id, p.n + " · " + p.b + " blazes", cur)).join("")}</optgroup>` + opt("custom", "Something else (type it)", cur);
  }
  function drawForm() {
    const box = $("#form"); if (!FORM) { box.hidden = true; return; }
    const g = FORM, apps = APPS.forGrade(S.grade), app = apps.find(a => a.id === g.app);
    let fields = "";
    if (g.area === "life") {
      fields = `<label>What kind?<select data-f="kind">${opt("count", "Pass a number of challenges", g.kind)}${opt("one", "Pass one challenge I've picked", g.kind)}</select></label>`
        + (g.kind === "one" ? `<label>Which challenge?<select data-f="item"><option value="">Pick a challenge</option>${challengeOptions(g.item)}</select></label>`
          : `<label>How many?<input type="number" min="1" max="40" data-f="n" value="${esc(g.n)}"></label><p class="small dim">${already(g) ? `You've already passed ${already(g)} in this stretch, so aim above that. ` : ""}Wilderland expects 16 this year: 2 in each Life Skill. You pick your own number. One a week is a strong pace.</p>`);
    } else if (g.area === "acad") {
      if (!S.grade) fields = `<label>Your grade, so you see your own apps<select id="grade2"><option value="">Pick your grade</option>${APPS.GRADES.map(x => opt(x, "Grade " + x, "")).join("")}${opt("K1", "Kindergarten or 1st", "")}</select></label>`;
      else if (!apps.length) fields = `<label>Your goal<input type="text" maxlength="140" data-f="text" value="${esc(g.text)}" placeholder="For example: read 20 minutes every day"></label><p class="small dim">Your guide can help you pick the right app goal.</p>`;
      else {
        fields = `<label>Which app?<select data-f="app"><option value="">Pick an app</option>${["Math", "Reading", "Language", "Science", "Social Studies"].map(s => { const as = apps.filter(a => a.s === s); return as.length ? `<optgroup label="${s}">${as.map(a => opt(a.id, a.n, g.app)).join("")}</optgroup>` : ""; }).join("")}</select></label>`;
        if (app) {
          fields += `<p class="small dim">${esc(app.d)}.</p>`;
          const kinds = (app.finish ? [["finish", "Finish something"]] : []).concat([["count", "Do a certain amount"]]);
          if (kinds.length > 1) fields += `<label>What kind?<select data-f="kind">${kinds.map(([k, n]) => opt(k, n, g.kind)).join("")}</select></label>`;
          const kind = g.kind || kinds[0][0];
          if (kind === "finish") fields += `<label>Finish what?<select data-f="item"><option value="">Pick one</option>${app.finish.map(gr => `<optgroup label="${esc(gr.group)}">${gr.items.map(i => opt(i, i, g.item)).join("")}</optgroup>`).join("")}</select></label>`;
          else fields += `<div class="two"><label>How many?<input type="number" min="1" data-f="n" value="${esc(g.n)}"></label><label>Of what?<select data-f="unit">${app.units.map(u => opt(u, u, g.unit || app.units[0])).join("")}</select></label></div>`
            + (app.id === "mathacademy" ? `<p class="small dim">1 XP is about 1 minute of focused work.</p>` : app.id === "membean" ? `<p class="small dim">Membean works best in short sessions, about 15 minutes, on 3 or more days a week.</p>` : "");
        }
      }
    } else if (g.area === "store") {
      fields = `<label>What are you saving for?<select data-f="item"><option value="">Pick a reward</option>${storeOptions(g.item)}</select></label>`
        + (g.item === "custom" ? `<div class="two"><label>What is it?<input type="text" maxlength="80" data-f="text" value="${esc(g.text)}"></label><label>Blazes it costs<input type="number" min="1" data-f="n" value="${esc(g.n)}"></label></div>` : "")
        + `<p class="small dim">Blazes are worth 50 cents each. You earn them for academic work.</p>`;
    } else if (g.area === "project") {
      fields = `<label>Your project goal<input type="text" maxlength="140" data-f="text" value="${esc(g.text)}" placeholder="For example: finish the frame of my birdhouse"></label><p class="small dim">Big project? Set the year goal for the finished thing, then a weekly goal for the next step.</p>`;
    } else if (g.area === "habit") {
      fields = `<label>Your habit or behavior goal<input type="text" maxlength="140" data-f="text" value="${esc(g.text)}" placeholder="For example: ask for help before I get stuck"></label>
        <label>How often?<select data-f="freq">${opt("", "Not a set schedule", g.freq)}${["every day", "every school day", "3 times a week", "once a week"].map(f => opt(f, f[0].toUpperCase() + f.slice(1), g.freq)).join("")}</select></label>`;
    }
    box.innerHTML = `<div class="fh"><h2>${EDIT ? "Change your goal" : "New goal"}</h2><button class="ghost" type="button" data-cancel>Cancel</button></div>
      <p class="fsub">Fill this in, then press ${EDIT ? "Save changes" : "Set this goal"} at the bottom.</p>
      <p class="step"><i>1</i> What is this goal about?</p>
      <div class="areas" role="group" aria-label="What is this goal about?">${Object.entries(AREAS).filter(([k]) => k !== "store" || BAND !== "K–1" || g.area === "store").map(([k, a]) => `<button type="button" data-area-pick="${k}" class="${g.area === k ? "on" : ""}">${a.e} ${a.n}${a.req ? " <small>expected</small>" : ""}</button>`).join("")}</div>
      ${g.area ? `<p class="step"><i>2</i> When, and what exactly?</p><div class="two"><label>When?<select data-f="span">${Object.entries(SPANS).map(([k, n]) => opt(k, n, g.span)).join("")}</select></label><label>By<input type="date" data-f="due" value="${esc(g.due)}" min="${today()}"></label></div>
      ${fields}
      <p class="step"><i>3</i> Why does it matter? <span class="dim" style="font-weight:500">(optional)</span></p>
      <label>Why does it matter to you?<input type="text" maxlength="140" data-f="why" value="${esc(g.why)}" placeholder="What will be different when you've done it?"></label>
      <p class="err" id="ferr" role="alert"></p>
      <button class="btn" type="button" data-save>${EDIT ? "Save changes" : "Set this goal"}</button>` : `<p class="dim">Pick one above to keep going.</p>`}`;
    box.hidden = false;
  }
  function check(g) {
    if (!g.due) return "Pick a date.";
    if (g.area === "life") {
      if (g.kind === "one" ? !g.item : !(Number(g.n) >= 1)) return g.kind === "one" ? "Pick a challenge." : "How many challenges?";
      if (g.kind === "count" && !EDIT && Number(g.n) <= already(g)) return `You've already passed ${already(g)} in this stretch. Aim for more than that.`;
      if (g.kind === "one" && PASSES && PASSES.some(p => p.cid === g.item && p.date >= iso(schoolYearStart(parse(g.due))))) return "You've already passed that one this year. Pick a new one.";
    }
    else if (g.area === "acad") {
      const apps = APPS.forGrade(S.grade);
      if (!S.grade) return "Pick your grade first.";
      if (!apps.length) { if (!g.text.trim()) return "Write your goal."; }
      else if (!g.app) return "Pick an app.";
      else if (g.kind === "finish" ? !g.item : !(Number(g.n) >= 1)) return g.kind === "finish" ? "Pick what you'll finish." : "How many?";
    } else if (g.area === "store") { if (!g.item) return "Pick what you're saving for."; if (g.item === "custom" && (!g.text.trim() || !(Number(g.n) >= 1))) return "Name it and say how many blazes."; }
    else if (!g.text.trim()) return "Write your goal.";
    return "";
  }
  function saveForm() {
    const g = FORM, apps = APPS.forGrade(S.grade), app = apps.find(a => a.id === g.app);
    if (g.area === "acad" && app) { g.kind = g.kind || (app.finish ? "finish" : "count"); if (g.kind === "count") g.unit = g.unit || app.units[0]; g.appName = app.n; g.grade = S.grade; }
    if (g.area === "acad" && !apps.length) { g.kind = "text"; }
    if (g.area === "store" && g.item !== "custom" && PROD[g.item]) g.n = PROD[g.item].b;
    const err = check(g); if (err) { $("#ferr").textContent = err; return; }
    g.n = g.n === "" ? "" : Number(g.n);
    g.label = title(g);
    if (EDIT) S.list = S.list.map(x => x.id === EDIT ? Object.assign({}, x, g) : x);
    else S.list.push(Object.assign(g, { id: uid(), created: today(), at: 0, done: "" }));
    save(); close(); draw(); toast(EDIT ? "Saved." : "Goal set. Your guide will ask about it at your Summit Session.");
  }
  function toast(t) { const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 2800); }

  // ---------- events ----------
  document.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    const d = t.dataset, find = id => S.list.find(g => g.id === id);
    if (d.new) return open(blank(d.new, d.new === "life" ? "week" : "month"));
    if (d.newSpan) return open(blank("", d.newSpan));
    if (t.id === "add") return open(blank("", FILTER === "all" ? "week" : FILTER));
    if (d.filter) { FILTER = d.filter; return draw(); }
    if (d.cancel !== undefined) return close();
    if (d.areaPick) { const b = blank(d.areaPick, FORM.span); FORM = Object.assign(b, { due: FORM.due, why: FORM.why }); if (b.area === "life") FORM.n = Math.max(FORM.n, already(FORM) + 1); return drawForm(); }
    if (d.save !== undefined) return saveForm();
    if (d.done) { const g = find(d.done); g.done = today(); save(); draw(); return toast("Nice work. That's one done."); }
    if (d.undone) { const g = find(d.undone); g.done = ""; save(); return draw(); }
    if (d.renew) { const g = find(d.renew), due = dueFor(g.span); S.list.push(Object.assign({}, g, { id: uid(), due, created: today(), done: "", at: 0 })); save(); draw(); return toast("Set again, due " + fmt(due) + "."); }
    if (d.edit) return open(find(d.edit));
    if (d.del) {
      if (t.dataset.sure) { S.list = S.list.filter(g => g.id !== d.del); save(); return draw(); }
      t.dataset.sure = "1"; t.textContent = "Tap again to remove"; setTimeout(() => { if (t.isConnected) { delete t.dataset.sure; t.textContent = "Remove"; } }, 3000);
    }
  });
  document.addEventListener("change", e => {
    const el = e.target;
    if (el.id === "grade" || el.id === "grade2") { S.grade = el.value; save(); if (FORM && FORM.area === "acad") Object.assign(FORM, { app: "", item: "", kind: "", unit: "" }); return draw(); }
    if (el.dataset.at) { const g = S.list.find(x => x.id === el.dataset.at); g.at = Math.max(0, Number(el.value) || 0); save(); return draw(); }
    const f = el.dataset.f; if (!f || !FORM) return;
    FORM[f] = el.value;
    if (f === "span") { FORM.due = dueFor(el.value); if (FORM.area === "life" && FORM.kind === "count") FORM.n = Math.max(el.value === "year" ? 16 : el.value === "month" ? 2 : 1, already(FORM) + 1); }
    if (f === "app") Object.assign(FORM, { kind: "", item: "", unit: "", n: "" });
    if (f === "kind") Object.assign(FORM, { item: "", n: FORM.area === "life" ? FORM.n || 1 : "" });
    if (["span", "app", "kind", "item"].includes(f)) drawForm();
  });
  document.addEventListener("input", e => { const f = e.target.dataset.f; if (f && FORM && e.target.tagName === "INPUT") FORM[f] = e.target.value; });

  document.addEventListener("wl-role", e => onRole(e.detail));
  if (window.wlRole !== undefined) onRole(window.wlRole); else draw();
  // From a to-do (/tasks.js): /goals/#new=life or #new=acad opens the form for that kind of goal.
  function fromHash() { const m = /^#new=(life|acad|store|project|habit)$/.exec(location.hash); if (m) { open(blank(m[1], m[1] === "life" ? "week" : "month")); history.replaceState(null, "", location.pathname); } }
  fromHash(); addEventListener("hashchange", fromHash);
  window.WLGoals = { dueFor, startFor };   // for tests
})();
