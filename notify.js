// Wilderland notifications: the 🔔 in the top bar for students and guides, and the helpers other pages use to send one.
// Loaded by /wlnav.js on every page. Needs a signed-in Firebase user (window.wlFirebase, from /auth.js or the Life
// Skills tracker) and the role ("wl-role" event / window.wlRole).
//
// Firestore: wlNotes/{id} = { to, from, fromName, kind, text, link, at (ms), read, test? }. Rules (firestore.rules): you
// read, mark read and delete only your own; anyone at school can send one in their own name. In a test view the notes
// are marked test and go between the test accounts.
//
//   window.wlNotify(["kid@wilderland.academy"], { kind: "pass", text: "You passed …", link: "/challenges/#c=EN-03.2" })
//   window.wlNotifyGuides({ kind: "save", text: "Ava saved a challenge: …", link: "/guides/lifeskills/#s=<sid>" })
//       (a student's own guides: the ones named on their tracker record, otherwise their band's guides)
//   window.wlNotifyParents({ kind: "goal", text: "Ava set a goal: …" })   (from a student's page: their linked parents)
//   window.wlNotifyFamily({ student: "ava@…", sid, kind: "pass", text: "You passed …", link, parentText: "Ava passed …" })
//       (from a guide's page: the student, and every parent linked to them on the Student Roster)
// Parents get the bell too (Parents site), for their children's progress. Parents never send.
(function () {
  if (window.wlNotify) return;
  var FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
  var role = window.wlRole || null, notes = [], open = false, timer = null, guidesCache = null;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function user() { return window.wlFirebase && window.wlFirebase.auth && window.wlFirebase.auth.currentUser; }
  function me() { return String((role && role.email) || (user() && user().email) || "").toLowerCase(); }
  function isTest() { return !!(role && role.test); }
  async function token() { var u = user(); if (!u) throw new Error("signed out"); return u.getIdToken(); }
  var val = function (v) { return !v ? null : "stringValue" in v ? v.stringValue : "integerValue" in v ? Number(v.integerValue) : "booleanValue" in v ? v.booleanValue : null; };
  var str = function (s) { return { stringValue: String(s == null ? "" : s) }; };

  // ---------- sending ----------
  function senderName() {
    var u = user(); if (!u) return "";
    if (isTest()) return role.test === "student" ? "Test S." : role.test === "guide" ? "Test Guide" : "Test";
    var n = String(u.displayName || u.email.split("@")[0]).trim().split(/\s+/);
    return role && role.role === "student" && n.length > 1 ? n[0] + " " + n[n.length - 1][0] + "." : n[0];
  }
  window.wlNotify = async function (to, n) {
    try {
      var u = user(); if (!u || !n || !n.text) return;
      var from = String(u.email || "").toLowerCase(), list = [];
      (Array.isArray(to) ? to : [to]).forEach(function (e) { e = String(e || "").trim().toLowerCase(); if (e && e.indexOf("@") > 0 && list.indexOf(e) < 0 && (e !== me() || isTest())) list.push(e); });
      if (!list.length) return;
      var H = { Authorization: "Bearer " + await token(), "Content-Type": "application/json" };
      await Promise.all(list.slice(0, 40).map(function (e) {
        var f = { to: str(e), from: str(from), fromName: str(n.fromName || senderName()), kind: str(n.kind || "note"), text: str(String(n.text).slice(0, 300)), link: str(String(n.link || "").slice(0, 300)), at: { integerValue: String(Date.now()) }, read: { booleanValue: false } };
        if (isTest()) f.test = { booleanValue: true };
        return fetch(FS + "/wlNotes", { method: "POST", headers: H, body: JSON.stringify({ fields: f }) });
      }));
    } catch (e) { console.warn("Notify:", e); }
  };
  // A student's guides: named on their tracker record (lsStudents/{sid}.guide), else their band's guides.
  window.wlMyGuides = async function () {
    if (guidesCache) return guidesCache;
    var r = role || {}, out = [], P = window.WLPeople || {};
    if (r.role !== "student") return [];
    if (isTest()) return (guidesCache = [(P.TEST || {}).guide].filter(Boolean));
    try {
      if (r.sid) {
        var d = await fetch(FS + "/lsStudents/" + r.sid, { headers: { Authorization: "Bearer " + await token() } });
        if (d.ok) out = String(val(((await d.json()).fields || {}).guide) || "").toLowerCase().split(/[\s,;]+/).filter(function (e) { return e.indexOf("@") > 0; });
      }
    } catch (e) { }
    if (!out.length) Object.keys(P.STAFF_BANDS || {}).forEach(function (e) { if (P.STAFF_BANDS[e] === r.band) out.push(e); });
    return (guidesCache = out);
  };
  window.wlNotifyGuides = async function (n) { window.wlNotify(await window.wlMyGuides(), n); };
  // A student's own linked parents (their tracker record, which they can read), for their progress.
  var parentsCache = null;
  async function myParents() {
    var r = role || {};
    if (r.role !== "student") return [];
    if (isTest()) return [(window.WLPeople || {}).TEST && window.WLPeople.TEST.parent].filter(Boolean);
    if (parentsCache) return parentsCache;
    try {
      if (r.sid) {
        var d = await fetch(FS + "/lsStudents/" + r.sid, { headers: { Authorization: "Bearer " + await token() } });
        if (d.ok) return (parentsCache = (val(((await d.json()).fields || {}).parents) || []).map(function (e) { return String(e).toLowerCase(); }));
      }
    } catch (e) { }
    return [];
  }
  var parentLink = function (sid) { return "/parents/lifeskills/" + (sid ? "#c=" + sid : ""); };
  window.wlNotifyParents = async function (n) {
    var ps = await myParents(); if (!ps.length) return;
    window.wlNotify(ps, { kind: n.kind, text: n.text, link: n.link || parentLink((role || {}).sid), fromName: n.fromName });
  };
  // From a guide's page: the student and their linked parents. parentText says it to a parent ("Ava passed …").
  window.wlNotifyFamily = async function (n) {
    try {
      var em = String(n.student || "").toLowerCase(), sid = n.sid || "", parents = [], name = "";
      if (em || sid) {
        var H = { Authorization: "Bearer " + await token(), "Content-Type": "application/json" }, rec = null;
        if (sid) { var d = await fetch(FS + "/lsStudents/" + sid, { headers: H }); if (d.ok) rec = await d.json(); }
        else {
          var q = await fetch(FS + ":runQuery", { method: "POST", headers: H, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "lsStudents" }], where: { fieldFilter: { field: { fieldPath: "email" }, op: "EQUAL", value: str(em) } }, limit: 1 } }) });
          if (q.ok) { var x = (await q.json()).filter(function (y) { return y.document; })[0]; if (x) { rec = x.document; sid = rec.name.split("/").pop(); } }
        }
        if (rec) { var f = rec.fields || {}; parents = (val(f.parents) || []).map(function (e) { return String(e).toLowerCase(); }); name = String(val(f.name) || "").split(/\s+/)[0]; if (!em) em = String(val(f.email) || "").toLowerCase(); }
      }
      if (em && n.text) window.wlNotify([em], { kind: n.kind, text: n.text, link: n.link });
      if (parents.length && n.parentText) window.wlNotify(parents, { kind: n.kind, text: n.parentText.replace(/\{name\}/g, name || "Your child"), link: n.parentLink || parentLink(sid) });
    } catch (e) { console.warn("Notify family:", e); }
  };

  // ---------- the bell ----------
  var bell = null;
  function slot() { return document.querySelector(".wlbar-bell"); }
  function ago(ms) {
    var m = Math.round((Date.now() - ms) / 60000);
    return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : m < 2880 ? "yesterday" : new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  var ICON = { coach: "📝", pass: "✅", notyet: "🔁", reward: "🎁", accepted: "🌟", reply: "💬", townhall: "🏛️", vote: "👍", save: "🔖", goal: "🎯", book: "📚", project: "💡", store: "🛒", idea: "🗳️", working: "🧭", note: "🔔" };
  function draw() {
    var s = slot(); if (!s) return;
    var show = role && (role.role === "student" || role.role === "staff" || role.role === "parent") && user();
    if (!show) { s.innerHTML = ""; return; }
    var unread = notes.filter(function (n) { return !n.read; }).length;
    s.innerHTML = '<button type="button" class="wlbell" aria-haspopup="true" aria-expanded="' + open + '" aria-label="Notifications' + (unread ? ", " + unread + " new" : "") + '" title="Notifications">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>' +
      (unread ? '<span class="wlbell-n">' + (unread > 99 ? "99+" : unread) + "</span>" : "") + "</button>" +
      (open ? '<div class="wlbell-menu" role="dialog" aria-label="Notifications"><div class="wlbell-h"><b>Notifications</b>' + (unread ? '<button type="button" data-wlbell-all>Mark all read</button>' : "") + "</div>" +
        (notes.length ? "<ul>" + notes.slice(0, 40).map(function (n) {
          return '<li class="' + (n.read ? "" : "new") + '"><a href="' + esc(n.link || "#") + '" data-wlbell-id="' + esc(n.id) + '"><span class="i" aria-hidden="true">' + (ICON[n.kind] || "🔔") + '</span><span class="t">' + esc(n.text) +
            '<small>' + esc(n.fromName ? n.fromName + " · " : "") + ago(n.at || 0) + "</small></span></a></li>";
        }).join("") + "</ul>" : '<p class="wlbell-empty">' + (role.role === "staff" ? "Nothing yet. You'll hear here when your students pass challenges, save things, set goals or post ideas."
          : role.role === "parent" ? "Nothing yet. You'll hear here when your child passes a challenge, sets or finishes a goal, saves something new, has a reward idea approved, has an idea accepted, or gets takeaways from a 1:1 with their Field Guide."
          : "Nothing yet. You'll hear here when a guide checks a challenge you showed them, approves your reward idea or shares takeaways from your 1:1, and when someone votes for or accepts your Suggestion Wall idea or puts your Town Hall item on the agenda.") + "</p>") + "</div>" : "");
  }
  async function load() {
    if (!role || !user() || !(role.role === "student" || role.role === "staff" || role.role === "parent")) { notes = []; draw(); return; }
    try {
      var where = { fieldFilter: { field: { fieldPath: "to" }, op: "EQUAL", value: str(me()) } };
      if (isTest()) where = { compositeFilter: { op: "AND", filters: [where, { fieldFilter: { field: { fieldPath: "test" }, op: "EQUAL", value: { booleanValue: true } } }] } };
      var r = await fetch(FS + ":runQuery", { method: "POST", headers: { Authorization: "Bearer " + await token(), "Content-Type": "application/json" },
        body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "wlNotes" }], where: where, limit: 200 } }) });
      if (!r.ok) throw new Error("notes " + r.status);
      notes = (await r.json()).filter(function (x) { return x.document; }).map(function (x) {
        var f = x.document.fields || {}, o = { id: x.document.name.split("/").pop() };
        Object.keys(f).forEach(function (k) { o[k] = val(f[k]); }); return o;
      }).filter(function (n) { return !!n.test === isTest(); }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    } catch (e) { notes = []; }
    draw();
  }
  async function markRead(ids) {
    if (!ids.length) return;
    var H = { Authorization: "Bearer " + await token(), "Content-Type": "application/json" };
    notes.forEach(function (n) { if (ids.indexOf(n.id) >= 0) n.read = true; });
    draw();
    await Promise.all(ids.map(function (id) { return fetch(FS + "/wlNotes/" + id + "?updateMask.fieldPaths=read", { method: "PATCH", headers: H, body: JSON.stringify({ fields: { read: { booleanValue: true } } }) }); })).catch(function () { });
  }
  document.addEventListener("click", function (e) {
    var s = slot(); if (!s) return;
    if (e.target.closest(".wlbell")) { open = !open; draw(); return; }
    var all = e.target.closest("[data-wlbell-all]");
    if (all) { markRead(notes.filter(function (n) { return !n.read; }).map(function (n) { return n.id; })); return; }
    var a = e.target.closest("[data-wlbell-id]");
    if (a) { var n = notes.filter(function (x) { return x.id === a.getAttribute("data-wlbell-id"); })[0]; if (n && !n.read) markRead([n.id]); if (!n || !n.link) e.preventDefault(); open = false; return; }
    if (open && !s.contains(e.target)) { open = false; draw(); }
  });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { open = false; draw(); } });
  function start(r) {
    role = r || null; guidesCache = null; parentsCache = null;
    clearInterval(timer);
    var wait = 0, go = function () { if (user() || wait++ > 40) { load(); timer = setInterval(load, 120000); } else setTimeout(go, 250); };
    go();
  }
  document.addEventListener("wl-role", function (e) { start(e.detail); });
  // /wlnav.js redraws the bar now and then; put the bell back each time.
  document.addEventListener("wl-bar-drawn", draw);
  addEventListener("focus", function () { if (role) load(); });
  if (window.wlRole) start(window.wlRole);

  var css = document.createElement("style");
  css.textContent = ".wlbar-bell{position:relative;display:flex;align-items:center}" +
    ".wlbell{position:relative;display:grid;place-items:center;width:36px;height:36px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;cursor:pointer}" +
    ".wlbell svg{width:18px;height:18px}.wlbell:hover{background:rgba(255,255,255,.08)}" +
    ".wlbell-n{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#d5f367;color:#0b2b20;font:700 11px/18px Inter,system-ui,sans-serif;text-align:center}" +
    ".wlbell-menu{position:absolute;right:0;top:calc(100% + 8px);width:min(380px,92vw);max-height:70vh;overflow:auto;background:#0f231c;color:#f6f8ea;border:1px solid #28493d;border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.45);z-index:80;font:400 14px/1.4 Inter,system-ui,sans-serif}" +
    ".wlbell-h{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #28493d;position:sticky;top:0;background:#0f231c}" +
    ".wlbell-h button{background:none;border:0;color:#d5f367;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}" +
    ".wlbell-menu ul{list-style:none;margin:0;padding:6px}.wlbell-menu li a{display:flex;gap:10px;padding:10px;border-radius:10px;color:inherit;text-decoration:none}" +
    ".wlbell-menu li a:hover{background:rgba(255,255,255,.06)}.wlbell-menu li.new a{background:rgba(213,243,103,.08)}" +
    ".wlbell-menu .i{font-size:18px;line-height:1.2}.wlbell-menu .t{display:flex;flex-direction:column;gap:3px}.wlbell-menu small{color:#a9bbb0;font-size:12px}" +
    ".wlbell-empty{padding:16px 14px;color:#a9bbb0;margin:0}";
  document.head.appendChild(css);
})();
