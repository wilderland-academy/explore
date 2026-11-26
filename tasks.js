// Wilderland to-dos: things a student or a guide should actually do, as opposed to notifications (/notify.js), which
// are things to look at. Loaded by /wlnav.js on every page; shows a ✓ button with a count beside the 🔔 for signed-in
// students and guides, and fills any [data-wl-tasks] element on the page (Students home, Guides home) with the list.
// Nothing here is stored: each to-do is worked out from what's already saved, so it ticks itself off when it's done.
//
// Students:  save challenges they're curious about (grades 2–8), keep a Life Skills goal and an academic goal going,
//            pick something to save for in the Camp Store, and in grades 7–8 save a project idea for the year.
//            Optional: propose their own reward (Camp Store, sent to their Field Guide). The store items start in 2nd grade.
// Guides:    finish onboarding; schedule Life Skill Labs for their band and give parents at-home instructions for
//            each one; help students who don't have a Life Skills or academic goal set one.
// Field Guides (/wlnav.js FIELD_GUIDES, one per band; only they approve their band's reward ideas): reward ideas to
//            approve or decline, this week's 1:1s, and restores to sign off after Tier 2 and Tier 3 incidents.
// Reads (all allowed by firestore.rules): a student's own students/{uid}/sites/*; for guides lsStudents,
// lsShared/{sid}/sites/goals, labs, incentives, behaviorLog and their own mentor/{uid}/sessions.
(function () {
  if (window.wlTasks) return;
  var FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
  var STEPS = [["welcome", "Welcome"], ["lifeskills", "Life Skills"], ["mentor", "Mentor Mindset"], ["behavior", "Behavior"], ["parents", "Parent Communication"], ["students", "Students"], ["partner", "Trail Partner"], ["policies", "Our policies"]];
  var role = window.wlRole || null, tasks = null, open = false, busy = false, last = 0, seq = 0;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function user() { return window.wlFirebase && window.wlFirebase.auth && window.wlFirebase.auth.currentUser; }
  async function token() { var u = user(); if (!u) throw new Error("signed out"); return u.getIdToken(); }
  function val(v) {
    if (!v) return null;
    if ("stringValue" in v) return v.stringValue; if ("integerValue" in v) return Number(v.integerValue); if ("doubleValue" in v) return v.doubleValue;
    if ("booleanValue" in v) return v.booleanValue; if ("timestampValue" in v) return v.timestampValue;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(val);
    if ("mapValue" in v) { var o = {}, f = v.mapValue.fields || {}; Object.keys(f).forEach(function (k) { o[k] = val(f[k]); }); return o; }
    return null;
  }
  function docOf(d) { var o = { id: d.name.split("/").pop() }, f = d.fields || {}; Object.keys(f).forEach(function (k) { o[k] = val(f[k]); }); return o; }
  async function get(path) {
    var r = await fetch(FS + "/" + path, { headers: { Authorization: "Bearer " + await token() } });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(path + " " + r.status);
    return docOf(await r.json());
  }
  async function query(sq, parent) {
    var r = await fetch(FS + (parent ? "/" + parent : "") + ":runQuery", { method: "POST", headers: { Authorization: "Bearer " + await token(), "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: sq }) });
    if (!r.ok) throw new Error("query " + r.status);
    return (await r.json()).filter(function (x) { return x.document; }).map(function (x) { return docOf(x.document); });
  }
  var eq = function (f, v) { return { fieldFilter: { field: { fieldPath: f }, op: "EQUAL", value: typeof v === "boolean" ? { booleanValue: v } : { stringValue: v } } }; };
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var iso = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var today = function () { return iso(new Date()); };
  var plus = function (days) { var d = new Date(); d.setDate(d.getDate() + days); return iso(d); };
  var parse = function (s) { try { return JSON.parse(s); } catch (e) { return null; } };
  // A goal is current until it's done or its date has passed (the same test as /goals/).
  var current = function (g) { return g && !g.done && String(g.due || "") >= today(); };
  window.wlGoalsCurrent = function (list) {
    var act = (list || []).filter(current);
    return { life: act.some(function (g) { return g.area === "life"; }), acad: act.some(function (g) { return g.area === "acad"; }), list: act };
  };
  var isTest = function () { return !!(role && role.test); };

  // ---------- a student's to-dos ----------
  async function studentTasks() {
    var u = user(), base = (isTest() ? "testStudents/" : "students/") + u.uid + "/sites/";
    // What this device has (newer if it was just saved), otherwise the account copy.
    async function site(name, key) {
      var here = null; try { here = localStorage.getItem(key); } catch (e) { }
      if (here) return parse(here);
      var d = await get(base + name).catch(function () { return null; });
      var all = d && parse(d.data); return all && all[key] ? parse(all[key]) : null;
    }
    var got = await Promise.all([site("challenges", "wl-picks"), site("goals", "wl-goals"), site("store", "wl-store"), site("projects", "atlas-sparks"), myIdeas(), myTools()]);
    var picks = got[0] || [], goals = (got[1] || {}).list || [], store = got[2] || {}, sparks = got[3] || [], ideas = got[4];
    var g = window.wlGoalsCurrent(goals), band = role.band || "", grade = String(role.grade || "").trim(), out = [];
    if (band !== "K–1") out.push({ id: "picks", title: "Save 3 challenges you're curious about", detail: picks.length >= 3 ? picks.length + " saved" : picks.length + " of 3 saved. Tap the bookmark on any challenge.", link: "/challenges/", done: picks.length >= 3 });
    out.push({ id: "life", title: "Set a Life Skills goal", detail: g.life ? "You have one going." : "How many challenges will you pass this week, month or year?", link: "/goals/#new=life", done: g.life });
    out.push({ id: "acad", title: "Set an academic goal", detail: g.acad ? "You have one going." : "Pick an app and how far you'll get.", link: "/goals/#new=acad", done: g.acad });
    var saving = (store.wish || []).length > 0 || g.list.some(function (x) { return x.area === "store"; });
    // The Camp Store (and reward ideas) start in 2nd grade.
    if (band !== "K–1") out.push({ id: "store", title: "Pick something to save for", detail: saving ? "On your Camp Store list." : "Find something in the Camp Store and add it to your list.", link: "/store/", done: saving });
    if (grade === "7" || grade === "8") out.push({ id: "spark", title: "Save a project idea for this year", detail: sparks.length ? "You saved " + sparks.length + "." : "Browse Project Sparks and save one you'd want to work on all year.", link: "/projects/", done: sparks.length > 0 });
    // Tool Library: anything checked out that's due today or late.
    (got[5] || []).filter(function (l) { return l.status === "out" && l.due && l.due <= today(); }).forEach(function (l) {
      out.push({ id: "tool-" + l.id, title: "Bring back the " + l.n, detail: l.due < today() ? "It was due " + fmt(l.due) + "." : "It's due back today.", link: "/tools/", done: false });
    });
    if (band === "K–1") return out;
    var seenAt = 0; try { seenAt = Number(localStorage.getItem("wl-idea-seen")) || 0; } catch (e) { }
    if (ideas.some(function (x) { return x.status !== "pending" && (x.decidedAt || 0) > seenAt; })) out.push({ id: "idea-back", title: "Your Field Guide answered your reward idea", detail: "See what they decided.", link: "/store/#idea", done: false });
    out.push({ id: "idea", optional: true, title: "Propose your own reward", detail: ideas.some(function (x) { return x.status === "pending"; }) ? "Waiting for your Field Guide." : "Something you'd love to earn that isn't in the store? Your Field Guide decides.", link: "/store/#idea", done: ideas.some(function (x) { return x.status === "pending" || x.status === "approved"; }) });
    return out;
  }
  async function myIdeas() {
    try { return await query({ from: [{ collectionId: "incentives" }], where: isTest() ? { compositeFilter: { op: "AND", filters: [eq("email", role.email), eq("test", true)] } } : eq("email", String(role.email || "").toLowerCase()), limit: 50 }); }
    catch (e) { return []; }
  }

  async function myTools() {
    try { return await query({ from: [{ collectionId: "toolLoans" }], where: isTest() ? { compositeFilter: { op: "AND", filters: [eq("email", role.email), eq("test", true)] } } : eq("email", String(role.email || "").toLowerCase()), limit: 50 }); }
    catch (e) { return []; }
  }

  // ---------- a guide's to-dos ----------
  var P = function () { return window.WLPeople || { FIELD_GUIDES: [], STAFF_BANDS: {} }; };
  function myBand() { return isTest() ? role.band : (P().STAFF_BANDS[String(role.email || "").toLowerCase()] || role.band || ""); }
  // The Field Guide for a band: the one guide who approves its reward ideas. In a test view, the test guide.
  window.wlFieldGuideFor = function (band) {
    var p = P(), f = (p.FIELD_GUIDES || []).filter(function (e) { return p.STAFF_BANDS[e] === band; });
    return f[0] || "";
  };
  function amFieldGuide() { return isTest() ? role.test === "guide" : (P().FIELD_GUIDES || []).indexOf(String(role.email || "").toLowerCase()) >= 0; }
  async function guideTasks() {
    var out = [], band = myBand(), fg = amFieldGuide(), u = user(), fails = 0;
    var soft = function (v) { return function (e) { fails++; console.warn("Tasks:", e); return v; }; };
    // Onboarding: what /auth.js last heard about this guide's finished steps.
    var un = null; try { un = parse(localStorage.getItem("wl-unlocks")); } catch (e) { }
    if (un && !un.all) {
      var done = un.done || [], left = STEPS.filter(function (s) { return done.indexOf(s[0]) < 0; });
      out.push({ id: "onboard", title: left.length ? "Finish onboarding" : "Onboarding finished", detail: left.length ? (STEPS.length - left.length) + " of " + STEPS.length + " steps done. Next: " + left[0][1] + "." : "Every part of the Guides site is open to you.", link: "/guides/onboarding/", done: !left.length });
    }
    // Tool Library desk: every guide can hand out and check in tools.
    var loans = await query({ from: [{ collectionId: "toolLoans" }], where: (function () { var st = { fieldFilter: { field: { fieldPath: "status" }, op: "IN", value: { arrayValue: { values: [{ stringValue: "requested" }, { stringValue: "out" }, { stringValue: "wish" }] } } } }; return isTest() ? { compositeFilter: { op: "AND", filters: [st, eq("test", true)] } } : st; })(), limit: 300 }).catch(soft([]));
    loans = loans.filter(function (l) { return !!l.test === isTest(); });
    var asked = loans.filter(function (l) { return l.status === "requested"; }), late = loans.filter(function (l) { return l.status === "out" && l.due && l.due < today(); });
    if (asked.length) out.push({ id: "tools-asked", title: asked.length + " Tool Library request" + (asked.length === 1 ? "" : "s"), detail: "From " + asked.slice(0, 4).map(function (l) { return first(l.name); }).join(", ") + (asked.length > 4 ? "…" : "") + ". Hand it out or say not now.", link: "/guides/tools/#desk", done: false });
    var wish = loans.filter(function (l) { return l.status === "wish"; });
    if (wish.length) out.push({ id: "tools-wish", optional: true, title: "Students asked the Tool Library for " + wish.length + " thing" + (wish.length === 1 ? "" : "s"), detail: wish.slice(0, 3).map(function (l) { return l.n; }).join(", ") + (wish.length > 3 ? "…" : "") + ". Add them, stock them, or say not now.", link: "/guides/tools/#shop", done: false });
    if (late.length) out.push({ id: "tools-late", title: late.length + " tool" + (late.length === 1 ? " is" : "s are") + " late", detail: late.slice(0, 4).map(function (l) { return first(l.name) + " (" + l.n + ")"; }).join(", ") + (late.length > 4 ? "…" : "") + ".", link: "/guides/tools/#desk", done: false });
    if (!band) { out.noBand = true; return out; }
    var bandName = band === "K–1" ? "K–1" : "grades " + band;
    var jobs = await Promise.all([
      query({ from: [{ collectionId: "lsStudents" }], where: eq("band", band), limit: 200 }).catch(soft([])),
      query({ from: [{ collectionId: "labs" }], where: { fieldFilter: { field: { fieldPath: "date" }, op: "GREATER_THAN_OR_EQUAL", value: { stringValue: today() } } }, limit: 200 }).catch(soft(null)),
      fg ? query({ from: [{ collectionId: "incentives" }], where: eq("status", "pending"), limit: 200 }).catch(soft([])) : [],
      fg ? query({ from: [{ collectionId: "behaviorLog" }], where: eq("restore", "open"), limit: 200 }).catch(soft([])) : [],
      fg ? query({ from: [{ collectionId: "sessions" }], where: { fieldFilter: { field: { fieldPath: "at" }, op: "GREATER_THAN_OR_EQUAL", value: { integerValue: String(weekStart()) } } }, limit: 400 }, "mentor/" + u.uid).catch(soft(null)) : null
    ]);
    var kids = jobs[0].filter(function (s) { return !s.archived && !!s.test === isTest(); });
    // Labs: one in the next two weeks, and at-home instructions on each one in the next three.
    var labs = jobs[1];
    if (labs) {
      labs = labs.filter(function (l) { return (l.bands || []).indexOf(band) >= 0 && !!l.test === isTest(); }).sort(function (a, b) { return a.date.localeCompare(b.date); });
      var soon = labs.filter(function (l) { return l.date <= plus(14); });
      out.push({ id: "lab", title: "Schedule a Life Skill Lab for " + bandName, detail: soon.length ? "Next: " + soon[0].title + ", " + fmt(soon[0].date) + "." : "Nothing on the schedule in the next two weeks.", link: "/guides/lifeskills/#schedule", done: soon.length > 0 });
      labs.filter(function (l) { return l.date <= plus(21) && !String(l.home || "").trim(); }).forEach(function (l) {
        out.push({ id: "home-" + l.id, title: "Tell parents how to help at home: " + l.title, detail: "The Lab is " + fmt(l.date) + ". Parents see your at-home notes on the Labs schedule.", link: "/guides/lifeskills/#schedule", done: false });
      });
    }
    // Goals: every student keeps a Life Skills goal and an academic goal going.
    if (kids.length && band !== "K–1") {
      var shared = await Promise.all(kids.map(function (s) { return get("lsShared/" + s.id + "/sites/goals").catch(soft(null)); }));
      var missing = [];
      kids.forEach(function (s, i) { var d = shared[i], all = d && parse(d.data), list = ((all && parse(all["wl-goals"])) || {}).list || [], g = window.wlGoalsCurrent(list); if (!g.life || !g.acad) missing.push(s.name || "A student"); });
      out.push({ id: "goals", title: missing.length ? "Help " + missing.length + " student" + (missing.length === 1 ? "" : "s") + " set goals" : "Every student has goals going", detail: missing.length ? "Missing a Life Skills or academic goal: " + missing.slice(0, 6).map(first).join(", ") + (missing.length > 6 ? "…" : "") + ". Set one together at their 1:1." : "Each of your students has a Life Skills goal and an academic goal.", link: "/guides/roster/#goals", done: !missing.length });
    }
    if (fg) {
      var ideas = jobs[2].filter(function (x) { return x.band === band && !!x.test === isTest(); });
      if (ideas.length) out.push({ id: "ideas", title: "Approve or decline " + ideas.length + " reward idea" + (ideas.length === 1 ? "" : "s"), detail: "From " + ideas.slice(0, 4).map(function (x) { return first(x.name); }).join(", ") + (ideas.length > 4 ? "…" : "") + ". You're the only guide who can decide these.", link: "/guides/roster/#rewards", done: false });
      var restores = jobs[3].filter(function (x) { return x.band === band && !!x.test === isTest(); });
      if (restores.length) out.push({ id: "restore", title: "Sign off " + restores.length + " restore" + (restores.length === 1 ? "" : "s"), detail: "After a Tier 2 or 3, the restore is due by the end of the next school day, signed off by the Field Guide.", link: "/guides/roster/#behavior", done: false });
      var sess = jobs[4];
      if (sess && kids.length) {
        var seen = {}; sess.forEach(function (s) { seen[s.studentId] = 1; });
        var due = kids.filter(function (s) { return !seen["ls-" + s.id]; });
        out.push({ id: "oneonone", title: due.length ? due.length + " weekly 1:1" + (due.length === 1 ? "" : "s") + " left this week" : "Every 1:1 done this week", detail: due.length ? "Still to meet: " + due.slice(0, 6).map(function (s) { return first(s.name); }).join(", ") + (due.length > 6 ? "…" : "") + "." : "Nice work.", link: "/guides/roster/#coaching", done: !due.length });
      }
    }
    if (fails) out.partial = true;
    return out;
  }
  var first = function (n) { return String(n || "").trim().split(/\s+/)[0] || "A student"; };
  var fmt = function (s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); };
  function weekStart() { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }

  // Whose list belongs on this page: a student's on the Students site (including a tester viewing as the test student),
  // a guide's only on the Guides site. A guide looking at student or parent pages sees no to-dos there.
  function site() { var b = document.querySelector(".wlbar[data-wlnav]"); return b ? b.getAttribute("data-wlnav") : ""; }
  function fits() {
    if (!role) return false;
    if (role.role === "student") return site() !== "guides" && site() !== "parents";
    if (role.role === "staff") return site() === "guides";
    return false;
  }
  // ---------- loading ----------
  async function load(force) {
    if (!role || !user() || !fits() || busy) return;
    if (!force && tasks && Date.now() - last < 120000) return;
    busy = true; var my = ++seq;
    try {
      var t = role.role === "student" ? await studentTasks() : await guideTasks();
      if (my === seq) { tasks = t; last = Date.now(); }
    } catch (e) { console.warn("Tasks:", e); }
    busy = false; paint();
  }
  window.wlTasks = { refresh: function () { return load(true); }, get list() { return tasks; } };

  // ---------- drawing ----------
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="m8 12.2 2.8 2.8L16.5 9"/></svg>';
  function openCount() { return (tasks || []).filter(function (t) { return !t.done && !t.optional; }).length; }
  function item(t) {
    return '<li class="' + (t.done ? "done" : t.optional ? "opt" : "") + '"><a href="' + esc(t.link) + '"><span class="wltk-box" aria-hidden="true">' + (t.done ? "✓" : "") + '</span><span class="wltk-t"><b>' + esc(t.title) + (t.optional && !t.done ? ' <em>Optional</em>' : "") + "</b><small>" + esc(t.detail || "") + "</small></span></a></li>";
  }
  function listHtml() {
    if (!tasks) return '<p class="wltk-empty">Working out your to-dos…</p>';
    var todo = tasks.filter(function (t) { return !t.done; }), done = tasks.filter(function (t) { return t.done; });
    return (tasks.partial ? '<p class="wltk-empty">Some to-dos couldn\'t be checked just now. Reload to try again.</p>' : "") +
      (todo.length ? "<ul>" + todo.map(item).join("") + "</ul>" : tasks.partial ? "" : tasks.noBand ? '<p class="wltk-empty">Most guide to-dos (Labs, goals, 1:1s) belong to a grade band, and you don\'t have one. To see a guide\'s list, use Test view as the test guide.</p>' : '<p class="wltk-empty">All done. Nice work.</p>') +
      (done.length ? '<p class="wltk-sub">Done</p><ul>' + done.map(item).join("") + "</ul>" : "");
  }
  function paint() {
    var s = document.querySelector(".wlbar-tasks");
    var show = role && fits() && user();
    if (s) {
      if (!show) s.innerHTML = "";
      else {
        var n = openCount();
        s.innerHTML = '<button type="button" class="wltk" aria-haspopup="true" aria-expanded="' + open + '" aria-label="To do' + (n ? ", " + n + " left" : "") + '" title="To do">' + CHECK + (n ? '<span class="wltk-n">' + n + "</span>" : "") + "</button>" +
          (open ? '<div class="wltk-menu" role="dialog" aria-label="To do"><div class="wltk-h"><b>To do</b><small>Things to do, not just look at. They tick off by themselves.</small></div>' + listHtml() + "</div>" : "");
      }
    }
    document.querySelectorAll("[data-wl-tasks]").forEach(function (el) {
      if (!show) { el.hidden = true; return; }
      el.hidden = false;
      el.innerHTML = '<div class="wltk-card"><div class="wltk-ch"><h2>' + (role.role === "student" ? "Your to-dos" : "Your to-dos") + '</h2><span>' + (tasks ? openCount() + " left" : "") + "</span></div>" + listHtml() + "</div>";
    });
    document.dispatchEvent(new CustomEvent("wl-tasks", { detail: tasks }));
  }
  document.addEventListener("click", function (e) {
    var s = document.querySelector(".wlbar-tasks"); if (!s) return;
    if (e.target.closest(".wltk")) { open = !open; if (open) load(); paint(); return; }
    if (open && !s.contains(e.target)) { open = false; paint(); }
  });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { open = false; paint(); } });
  function start(r) {
    role = r || null; tasks = null; paint();
    var wait = 0, go = function () { if (user() || wait++ > 40) load(true); else setTimeout(go, 250); };
    go();
  }
  document.addEventListener("wl-role", function (e) { start(e.detail); });
  document.addEventListener("wl-bar-drawn", paint);
  document.addEventListener("wl-unlocks", function () { if (role && role.role === "staff") load(true); });
  addEventListener("focus", function () { if (role) load(); });
  // Something was saved on this page: work the list out again shortly after.
  var soonT = null; addEventListener("storage", function () { clearTimeout(soonT); soonT = setTimeout(function () { load(true); }, 1500); });
  document.addEventListener("wl-saved", function () { clearTimeout(soonT); soonT = setTimeout(function () { load(true); }, 1500); });
  if (window.wlRole) start(window.wlRole);

  var css = document.createElement("style");
  css.textContent = ".wlbar-tasks{position:relative;display:flex;align-items:center}" +
    ".wltk{position:relative;display:grid;place-items:center;width:36px;height:36px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;cursor:pointer}" +
    ".wltk svg{width:19px;height:19px}.wltk:hover{background:rgba(255,255,255,.08)}" +
    ".wltk-n{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#ffb454;color:#2a1700;font:700 11px/18px Inter,system-ui,sans-serif;text-align:center}" +
    ".wltk-menu{position:absolute;right:0;top:calc(100% + 8px);width:min(380px,92vw);max-height:70vh;overflow:auto;background:#0f231c;color:#f6f8ea;border:1px solid #28493d;border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.45);z-index:80;font:400 14px/1.4 Inter,system-ui,sans-serif;text-align:left}" +
    ".wltk-h{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-bottom:1px solid #28493d;position:sticky;top:0;background:#0f231c}.wltk-h small{color:#a9bbb0;font-size:12px}" +
    ".wltk-menu ul,.wltk-card ul{list-style:none;margin:0;padding:6px;display:flex;flex-direction:column;gap:2px}" +
    ".wltk-menu li a,.wltk-card li a{display:flex;gap:11px;align-items:flex-start;padding:10px;border-radius:10px;color:inherit;text-decoration:none}" +
    ".wltk-menu li a:hover{background:rgba(255,255,255,.06)}" +
    ".wltk-box{flex:none;display:grid;place-items:center;width:20px;height:20px;margin-top:1px;border-radius:6px;border:2px solid #ffb454;font:700 13px/1 Inter,sans-serif;color:#0b2b20}" +
    "li.done .wltk-box{background:#d5f367;border-color:#d5f367}li.opt .wltk-box{border-style:dashed;border-color:#a9bbb0}" +
    ".wltk-t{display:flex;flex-direction:column;gap:3px}.wltk-t small{color:#a9bbb0;font-size:12.5px}.wltk-t em{font-style:normal;font:700 10px/1 Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#a9bbb0;border:1px solid #3a5a4d;border-radius:99px;padding:2px 6px;margin-left:4px;vertical-align:2px}" +
    "li.done .wltk-t b{text-decoration:line-through;text-decoration-color:rgba(255,255,255,.35);opacity:.7}" +
    ".wltk-sub{margin:6px 16px 0;font:700 11px/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#a9bbb0}.wltk-empty{padding:14px 16px;margin:0;color:#a9bbb0}" +
    // The list on a home page ([data-wl-tasks]); each page sets --wltk-bg, --wltk-ink, --wltk-line, --wltk-dim.
    ".wltk-card{background:var(--wltk-bg,#0f231c);color:var(--wltk-ink,#f6f8ea);border:1px solid var(--wltk-line,#28493d);border-radius:18px;padding:16px 12px 10px}" +
    ".wltk-ch{display:flex;align-items:baseline;justify-content:space-between;padding:0 8px 6px}.wltk-ch h2{margin:0;font-size:21px}.wltk-ch span{color:var(--wltk-dim,#a9bbb0);font-size:14px;font-weight:600}" +
    ".wltk-card li a:hover{background:var(--wltk-hover,rgba(255,255,255,.06))}.wltk-card .wltk-t small,.wltk-card .wltk-sub,.wltk-card .wltk-empty{color:var(--wltk-dim,#a9bbb0)}";
  document.head.appendChild(css);
})();
