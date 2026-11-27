// Wilderland Tool & Materials Library (/tools/ for students, /guides/tools/ for guides; both from _includes/tools.html).
// The catalog is /tools/catalog.js (WLTools). Firestore, over REST with the sign-in from /auth.js:
//   toolInventory/{item id}  what a guide counted: { have, broken, loc, note, stock (materials: ok|low|out), counted,
//                            out (how many are checked out right now), updated, by }. Overrides the catalog's numbers.
//                            Every signed-in student and guide reads it (availability); guides write it.
//   toolLoans/{id}           one request or checkout: { item, n, kind (borrow|book|material|badge|wish|new|reserve),
//                            email, sid, name, band, status (requested|waiting|wish|reserved|out|returned|declined|
//                            cancelled|done), at, when (an old booking: "YYYY-MM-DD morning"; a reservation:
//                            "YYYY-MM-DD HH:00"), amt, note, due (YYYY-MM-DD), out, back, by, byName,
//                            cond (fine|repair|missing), gnote, test?, and for a reservation start, end (ms), qty }.
//                            A student creates their own requests and reservations and can cancel them; guides do
//                            everything else.
//   toolHolds/{loan id}      a reservation's place on the calendar, with no name on it: { item, start, end (ms), qty,
//                            out (a guide handed it over), test? }. Everyone at school reads them, so a student can
//                            see when a tool is free; only the student who reserved (or a guide) can add or remove one.
//                            Materials have no hold: they're used up, so guides just set some aside.
//   Reservations come in 4-hour blocks on the clock (12, 4 and 8, AM and PM), from 4 hours up to a week.
//   toolReports/{id}         "this is running low": { item, n, email, name, band, level (low|out), note, at, test? }.
//                            Any student (or guide) files one from a material's sheet; guides see them on the Desk and
//                            the Shopping list, and they close when a guide restocks the item, adds it to the restock
//                            list, or dismisses them. A student reads only their own.
//   toolBadges/{sid}         { certs: { cert id: { at, by, byName } }, items (older per-tool badges, still honored),
//                            by, at }: the safety certifications a student passed. Guides write it.
//   toolConfig/certs         { map: { tool id: cert id | "open" | "guide" | "staff" }, custom: { cert id: { n, e, rules,
//                            check } } }: guides' changes to which tools each certification covers, and certifications
//                            they added. The built-in certifications are in /tools/certs.js.
//   No tool is limited by grade. A tool that needs a certification can be borrowed by any Upper Campus student who has
//   passed it (rules, quiz, a guide's check-off). Students ask for a check-off with a toolLoans request of kind "cert"
//   (item = the cert id).
// Like a book library: a student asks, a guide hands it over (that's the checkout) and checks it back in.
(function () {
  var FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
  var T = window.WLTools, SITE = document.body.dataset.site === "guides" ? "guides" : "students";
  // The library is Upper Campus only (grades 2–8). K–1 students don't see it; guides on both campuses do.
    var S = { role: null, inv: {}, loans: [], holds: [], reports: [], badges: {}, certs: {}, cfg: { map: {}, custom: {} }, quiz: {}, kids: [], cert: "", q: "", cat: "all", f: "", view: "", band: "All", kid: "", dirty: {}, msg: "" };
  var $ = function (q) { return document.querySelector(q); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var byId = {}; T.TOOLS.forEach(function (t) { byId[t.id] = t; });
  var BUILTIN = T.TOOLS.length;
  // Items guides added (toolItems/{id}): same shape as the catalog's. Merged in, replacing an earlier copy.
  function addCustom(d) {
    if (!d || !d.n || !T.CATS[d.c]) return;
    var t = { id: d.id, n: d.n, c: d.c, k: ["tool", "machine", "material"].indexOf(d.k) >= 0 ? d.k : "tool", have: 0, want: Number(d.want) || 0, a: T.ACCESS[d.a] ? d.a : "open", cert: d.cert || "", a0: T.ACCESS[d.a] ? d.a : "open", cert0: d.cert || "", loan: T.LOAN[d.loan] ? d.loan : "day", e: d.e || "🧰", d: d.d || "", m: d.m || "", tip: d.tip || "", custom: true };
    var i = T.TOOLS.findIndex(function (x) { return x.id === t.id; });
    if (i >= 0) T.TOOLS[i] = t; else T.TOOLS.push(t);
    byId[t.id] = t;
  }
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var iso = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var today = function () { return iso(new Date()); };
  var plusDays = function (n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  var fmt = function (s) { if (!s) return ""; var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); };
  var whenTxt = function (w) { if (!w) return ""; var p = String(w).split(" "); return fmt(p[0]) + (p[1] ? ", " + p[1] : ""); };
  var first = function (n) { return String(n || "").trim().split(/\s+/)[0] || "A student"; };
  var isTest = function () { return !!(S.role && S.role.test); };
  var guide = function () { return SITE === "guides" && S.role && S.role.role === "staff"; };

  // ---------- reservations: 4-hour blocks ----------
  var HOUR = 3600000, BLOCKS = [0, 4, 8, 12, 16, 20], AHEAD = 90;
  var LENGTHS = [[4, "4 hours"], [8, "8 hours"], [12, "12 hours"], [16, "16 hours"], [20, "20 hours"], [24, "1 day"], [48, "2 days"], [72, "3 days"], [168, "1 week"]];
  // Local clock time, so a block always starts on 12, 4 or 8 even across a daylight-saving change.
  var blockAt = function (date, h) { var p = String(date).split("-"); return new Date(+p[0], +p[1] - 1, +p[2], h).getTime(); };
  var clock = function (ms) { return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric" }); };
  var hourTxt = function (h) { return clock(new Date(2000, 0, 1, h).getTime()); };
  function spanTxt(a, b) {
    if (!a || !b) return "";
    var d1 = iso(new Date(a)), d2 = iso(new Date(b - 1));
    return fmt(d1) + ", " + clock(a) + " to " + (d1 === d2 ? "" : fmt(d2) + ", ") + clock(b);
  }
  var endOfToday = function () { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime(); };
  var isResv = function (l) { return l.kind === "reserve"; };
  var liveResv = function (l) { return isResv(l) && l.status === "reserved" && (l.end || 0) > Date.now(); };
  // The most of an item held at any one moment between a and b (holds can overlap the window without overlapping each other).
  function peakHeld(id, a, b) {
    var hs = S.holds.filter(function (h) { return h.item === id && h.start < b && h.end > a; });
    return hs.reduce(function (m, x) {
      var t = Math.max(a, x.start);
      var n = hs.filter(function (h) { return h.start <= t && h.end > t; }).reduce(function (s, h) { return s + (h.qty || 1); }, 0);
      return Math.max(m, n);
    }, 0);
  }
  // How many of a tool are free for the whole window. Checked out right now without a reservation counts against today.
  function freeFor(t, a, b) {
    var s = stock(t), cap = Math.max(0, s.have - s.broken), busy = peakHeld(t.id, a, b);
    if (a < endOfToday()) {
      var heldOut = S.holds.filter(function (h) { return h.item === t.id && h.out; }).reduce(function (n, h) { return n + (h.qty || 1); }, 0);
      busy += Math.max(0, s.out - heldOut);
    }
    return Math.max(0, cap - busy);
  }
  // The next block worth suggesting: the next 8 AM or 12 PM start that hasn't begun.
  function nextSlot() {
    var d = new Date(), h = d.getHours();
    if (h < 8) return [iso(d), 8];
    if (h < 12) return [iso(d), 12];
    d.setDate(d.getDate() + 1); return [iso(d), 8];
  }

  // ---------- Firestore over REST ----------
  var user = function () { return window.wlFirebase && window.wlFirebase.auth && window.wlFirebase.auth.currentUser; };
  async function tok() { var u = user(); if (!u) throw new Error("signed out"); return u.getIdToken(); }
  function val(v) {
    if (!v) return null;
    if ("stringValue" in v) return v.stringValue; if ("integerValue" in v) return Number(v.integerValue); if ("doubleValue" in v) return v.doubleValue;
    if ("booleanValue" in v) return v.booleanValue; if ("nullValue" in v) return null;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(val);
    if ("mapValue" in v) { var o = {}, f = v.mapValue.fields || {}; Object.keys(f).forEach(function (k) { o[k] = val(f[k]); }); return o; }
    return null;
  }
  function enc(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
    if (typeof v === "object") return { mapValue: { fields: fields(v) } };
    return { stringValue: String(v) };
  }
  var fields = function (o) { var f = {}; Object.keys(o).forEach(function (k) { f[k] = enc(o[k]); }); return f; };
  var doc = function (d) { var o = { id: d.name.split("/").pop() }, f = d.fields || {}; Object.keys(f).forEach(function (k) { o[k] = val(f[k]); }); return o; };
  async function list(coll) {
    var out = [], page = "";
    do {
      var r = await fetch(FS + "/" + coll + "?pageSize=300" + (page ? "&pageToken=" + page : ""), { headers: { Authorization: "Bearer " + await tok() } });
      if (!r.ok) throw Object.assign(new Error(coll + " " + r.status), { status: r.status });
      var j = await r.json(); (j.documents || []).forEach(function (d) { out.push(doc(d)); }); page = j.nextPageToken || "";
    } while (page);
    return out;
  }
  var eq = function (f, v) { return { fieldFilter: { field: { fieldPath: f }, op: "EQUAL", value: enc(v) } }; };
  async function query(coll, where) {
    var r = await fetch(FS + ":runQuery", { method: "POST", headers: { Authorization: "Bearer " + await tok(), "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: coll }], where: where, limit: 500 } }) });
    if (!r.ok) throw Object.assign(new Error(coll + " " + r.status), { status: r.status });
    return (await r.json()).filter(function (x) { return x.document; }).map(function (x) { return doc(x.document); });
  }
  // writes: [{ path, data, merge (update only these fields), create (fail if it exists), inc: { field: n } }, or { path, del: true }]
  async function commit(writes) {
    var W = writes.map(function (w) {
      if (w.del) return { delete: "projects/wilderland-df15e/databases/(default)/documents/" + w.path };
      var o = { update: { name: "projects/wilderland-df15e/databases/(default)/documents/" + w.path, fields: fields(w.data || {}) } };
      if (w.merge) o.updateMask = { fieldPaths: Object.keys(w.data || {}) };
      if (w.create) o.currentDocument = { exists: false };
      if (w.inc) o.updateTransforms = Object.keys(w.inc).map(function (k) { return { fieldPath: k, increment: { integerValue: String(w.inc[k]) } }; });
      return o;
    });
    var r = await fetch(FS + ":commit", { method: "POST", headers: { Authorization: "Bearer " + await tok(), "Content-Type": "application/json" }, body: JSON.stringify({ writes: W }) });
    if (!r.ok) { var t = await r.text(); throw Object.assign(new Error(r.status === 403 ? "Not allowed: the Tool Library's database rules may not be published yet." : "Couldn't save (" + r.status + ")"), { status: r.status, body: t }); }
  }
  var newId = function () { var a = "abcdefghijklmnopqrstuvwxyz0123456789", s = ""; for (var i = 0; i < 20; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };

  // ---------- what the library has ----------
  function stock(t) {
    var v = S.inv[t.id] || {}, have = v.have != null ? v.have : t.have, broken = v.broken || 0, out = Math.max(0, v.out || 0);
    if (guide()) out = S.loans.filter(function (l) { return l.item === t.id && l.status === "out" && l.kind !== "material"; }).reduce(function (n, l) { return n + (l.qty || 1); }, 0);
    return { have: have, broken: broken, out: out, free: Math.max(0, have - broken - out), loc: v.loc || "", note: v.note || "", stock: v.stock || (have > 0 ? "ok" : ""), counted: !!v.counted };
  }
  function availHtml(t) {
    var s = stock(t);
    if (t.k === "material") return s.stock === "out" || (!s.have && !S.inv[t.id]) ? (s.have || S.inv[t.id] ? '<span class="av out">Out of stock</span>' : '<span class="av no">Not stocked yet</span>') : s.stock === "low" ? '<span class="av out">Running low</span>' : '<span class="av ok">In stock</span>';
    if (!s.have) return '<span class="av no">Not in the library yet</span>';
    if (t.k === "machine") return s.free > 0 ? '<span class="av ok">Ready to book</span>' : '<span class="av out">In use</span>';
    return s.free > 0 ? '<span class="av ok">' + (s.have > 1 ? s.free + " of " + s.have + " on the shelf" : "On the shelf") + "</span>" : '<span class="av out">All out' + (s.broken && s.broken >= s.have ? " (being fixed)" : "") + "</span>";
  }
  var accessPill = function (t) { return t.a === "badge" && !guide() && S.role && S.role.role === "student" && certOk(t) ? '<span class="pill p-out">You\'re certified</span>' : '<span class="pill p-' + t.a + '">' + esc(T.ACCESS[t.a][0]) + "</span>"; };
  // ---------- certifications ----------
  // CERT: the built-in certifications plus any a guide added. applyCerts() sets each tool's cert (and access, when a
  // guide moved it) from certs.js, then the custom items' own cert, then the guides' map.
  var CERT = {};
  var ORIG = {}; T.TOOLS.forEach(function (t) { ORIG[t.id] = t.a; });
  function applyCerts() {
    CERT = {}; Object.keys(T.CERTS || {}).forEach(function (k) { CERT[k] = T.CERTS[k]; });
    Object.keys(S.cfg.custom || {}).forEach(function (k) { var c = S.cfg.custom[k]; if (c && c.n) CERT[k] = { n: c.n, e: c.e || "🛡️", rules: c.rules || [], check: c.check || [], quiz: [], custom: true }; });
    T.TOOLS.forEach(function (t) { if (!t.custom) { t.cert = ""; if (ORIG[t.id]) t.a = ORIG[t.id]; } else { t.a = t.a0 || t.a; t.cert = CERT[t.cert0] ? t.cert0 : ""; } });
    Object.keys(T.CERTS || {}).forEach(function (k) { (T.CERTS[k].tools || []).forEach(function (id) { if (byId[id] && !byId[id].custom) byId[id].cert = k; }); });
    var m = S.cfg.map || {};
    Object.keys(m).forEach(function (id) { var t = byId[id], v = m[id]; if (!t) return; if (CERT[v]) { t.cert = v; t.a = "badge"; } else if (T.ACCESS[v] && v !== "badge") { t.a = v; t.cert = ""; } });
  }
  var certTools = function (cid) { return T.TOOLS.filter(function (t) { return t.a === "badge" && t.cert === cid; }); };
  var certsOf = function (sid) { return (sid && S.certs[sid]) || {}; };
  var mySid = function () { return S.role && S.role.sid; };
  // Has this student passed the certification this tool needs? (An older per-tool badge still counts for that tool.)
  var certOk = function (t, sid) { sid = sid || mySid(); if (t.a !== "badge") return true; return !!(t.cert && certsOf(sid)[t.cert]) || (S.badges[sid] || []).indexOf(t.id) >= 0; };
  var canUse = function (t) { return t.a === "open" || (t.a === "badge" && certOk(t)); };
  var pendingCert = function (cid) { return S.loans.find(function (l) { return l.kind === "cert" && l.item === cid && l.status === "requested"; }); };
  try { S.quiz = JSON.parse(localStorage.getItem("wl-tool-quiz") || "{}") || {}; } catch (e) { S.quiz = {}; }
  var passQuiz = function (cid) { S.quiz[cid] = Date.now(); try { localStorage.setItem("wl-tool-quiz", JSON.stringify(S.quiz)); } catch (e) { } };
  var k1 = function () { return SITE === "students" && S.role && S.role.role === "student" && S.role.band === "K–1"; };
  var upper = function (s) { return s.band !== "K–1"; };
  
  // ---------- loading ----------
  async function load() {
    if (!S.role || !user()) return;
    if (k1()) { S.loaded = true; draw(); return; }
    var none = function () { return []; };
    var inv = list("toolInventory").catch(none), items = list("toolItems").catch(none), holds = list("toolHolds").catch(none);
    var cfg = fetch(FS + "/toolConfig/certs", { headers: { Authorization: "Bearer " + await tok() } }).then(function (r) { return r.ok ? r.json().then(doc) : null; }).catch(function () { return null; });
    var loans = Promise.resolve([]), badgesP = Promise.resolve([]), kids = Promise.resolve(null), reps = Promise.resolve([]);
    if (guide()) {
      loans = list("toolLoans").catch(function () { return isTest() ? query("toolLoans", eq("test", true)).catch(none) : []; });
      badgesP = list("toolBadges").catch(none);
      kids = list("lsStudents").catch(none);
      reps = list("toolReports").catch(none);
    } else if (S.role.role === "student") {
      var em = String(S.role.email || "").toLowerCase();
      loans = query("toolLoans", isTest() ? { compositeFilter: { op: "AND", filters: [eq("email", em), eq("test", true)] } } : eq("email", em)).catch(none);
      reps = query("toolReports", eq("email", em)).catch(none);
      badgesP = S.role.sid ? fetch(FS + "/toolBadges/" + S.role.sid, { headers: { Authorization: "Bearer " + await tok() } }).then(function (r) { return r.ok ? r.json().then(function (d) { return [doc(d)]; }) : []; }).catch(none) : Promise.resolve([]);
    }
    var got = await Promise.all([inv, items, holds, loans, badgesP, kids, reps, cfg]);
    S.inv = {}; got[0].forEach(function (d) { S.inv[d.id] = d; });
    got[1].forEach(addCustom);
    S.cfg = { map: (got[7] && got[7].map) || {}, custom: (got[7] && got[7].custom) || {} }; applyCerts();
    // Holds that have ended don't block anything. Test holds only count in test views, and real ones only outside them.
    var now = Date.now();
    S.holds = (got[2] || []).filter(function (h) { return !!h.test === isTest() && (h.end || 0) > now; });
    S.loans = (got[3] || []).filter(function (l) { return !!l.test === isTest(); }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    S.reports = (got[6] || []).filter(function (x) { return !!x.test === isTest(); }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    S.badges = {}; S.certs = {}; (got[4] || []).forEach(function (d) { S.badges[d.id] = d.items || []; S.certs[d.id] = d.certs || {}; });
    if (got[5]) S.kids = got[5].filter(function (s) { return !s.archived && !!s.test === isTest(); }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
    S.loaded = true; draw();
  }

  // ---------- drawing ----------
  function draw() {
    if (!S.loaded) { $("#view").innerHTML = '<p class="note">Loading the library…</p>'; return; }
    if (k1()) { $("#side").innerHTML = ""; $("#gtabs").innerHTML = ""; $("#view").innerHTML = '<section class="panel"><h2>The Tool Library opens in 2nd grade</h2><p class="sub">It\'s for Upper Campus students. Until then, your guides have the tools you need for your work. Ask them!</p></section>'; return; }
    var v = guide() ? (location.hash.replace("#", "") || "desk") : "catalog";
    S.view = v;
    $("#side").innerHTML = guide() ? deskSummary() : myTools();
    $("#gtabs").innerHTML = guide() ? gtabs(v) : "";
    setTimeout(chipState, 0);
    $("#view").innerHTML = v === "desk" ? desk() : v === "inventory" ? inventory() : v === "certs" || v === "badges" ? certsView() : v === "shop" ? shop() : catalog();
  }
  // The category chips scroll sideways: show arrows and a fade on whichever side has more.
  function chipState() {
    var w = document.querySelector(".chipwrap"), c = w && w.querySelector(".chips"); if (!c) return;
    var set = function () { w.classList.toggle("at-start", c.scrollLeft <= 2); w.classList.toggle("at-end", c.scrollLeft + c.clientWidth >= c.scrollWidth - 2); w.classList.toggle("fits", c.scrollWidth <= c.clientWidth + 2); };
    if (!c._wl) { c._wl = 1; c.addEventListener("scroll", set, { passive: true }); var on = c.querySelector(".on"); if (on && on.offsetLeft + on.offsetWidth > c.clientWidth) c.scrollLeft = on.offsetLeft - 40; }
    set();
  }
  addEventListener("resize", function () { chipState(); });
  function myTools() {
    var rank = function (l) { return l.status === "out" ? (l.due < today() ? 0 : 1) : l.status === "reserved" ? 2 : 3; };
    var mine = S.loans.filter(function (l) { return ["requested", "waiting", "out", "wish"].indexOf(l.status) >= 0 || liveResv(l); })
      .sort(function (a, b) { return rank(a) - rank(b) || (a.start || 0) - (b.start || 0); });
    var li = function (l) {
      var t = byId[l.item] || { e: "🧰", n: l.n }, late = l.status === "out" && l.due && l.due < today();
      var st = l.status === "out" ? (late ? '<span class="pill p-late">Late</span>' : '<span class="pill p-out">You have it</span>') : l.status === "reserved" ? '<span class="pill p-wait">Reserved</span>' : l.status === "waiting" ? '<span class="pill p-wait">In line</span>' : l.status === "wish" ? '<span class="pill p-wait">Requested</span>' : '<span class="pill p-wait">Asked</span>';
      var sub = l.status === "out" ? (l.kind === "book" ? "Booked for " + fmt(l.due) : late ? "It was due " + fmt(l.due) + ". Bring it back today." : "Bring it back by " + (l.due === today() ? "the end of today" : fmt(l.due))) : l.status === "reserved" ? esc(spanTxt(l.start, l.end)) + ((l.qty || 1) > 1 ? " · " + l.qty + " of them" : "") + (l.amt ? " · " + esc(l.amt) : "") + ". A guide hands it to you then." : l.kind === "book" && l.when ? "Asked for " + esc(whenTxt(l.when)) : l.kind === "badge" ? "Wants to learn it and get its badge" : l.status === "waiting" ? "You're in line for the next one" : l.status === "wish" ? "Guides see this on their shopping list" : "A guide will hand it to you";
      return '<li class="' + (late ? "late" : "") + '"><span class="em">' + t.e + '</span><span class="t"><b>' + esc(t.n || l.n) + "</b><small>" + sub + "</small></span>" + st + (["requested", "waiting", "wish", "reserved"].indexOf(l.status) >= 0 ? ' <button class="ghost sm" data-cancel="' + l.id + '">Cancel</button>' : "") + "</li>";
    };
    return '<div class="panel"><h2>My tools</h2>' + (mine.length ? '<ul class="loans">' + mine.map(li).join("") + "</ul>" : '<p class="sub">Nothing borrowed. Find what your project needs below and ask for it.</p>') +
      (function () {
        var mine = Object.keys(CERT).filter(function (k) { return certsOf(mySid())[k]; }), wait = S.loans.filter(function (l) { return l.kind === "cert" && l.status === "requested" && CERT[l.item]; });
        return '<div class="certmine"><h3>Safety certifications</h3><p class="sub">' + (mine.length ? "You're certified for: " + mine.map(function (k) { return CERT[k].e + " " + esc(CERT[k].n); }).join(", ") + "." : "One certification covers a group of similar tools. Learn the rules, take the quiz, then show a guide.") +
          (wait.length ? " Waiting for a check-off: " + wait.map(function (l) { return esc(CERT[l.item].n); }).join(", ") + "." : "") + '</p><button type="button" class="ghost sm" data-certlist>See all certifications</button></div>';
      })() + "</div>";
  }
  function filtered() {
    var q = S.q.trim().toLowerCase(), band = S.role && S.role.band;
    return T.TOOLS.filter(function (t) {
      if (S.cat !== "all" && t.c !== S.cat) return false;
      if (q && (t.n + " " + (t.m || "") + " " + t.d + " " + T.CATS[t.c][0] + " " + (t.ch || []).join(" ")).toLowerCase().indexOf(q) < 0) return false;
      if (S.f === "ch" && !(t.ch && t.ch.length)) return false;
      var s = stock(t);
      if (S.f === "shelf" && !(t.k === "material" ? s.stock && s.stock !== "out" && (s.have || S.inv[t.id]) : s.free > 0)) return false;
      if (S.f === "mine" && !canUse(t)) return false;
      if (S.f === "need" && !(t.k !== "material" && s.have < t.want)) return false;
      return true;
    });
  }
  function catalog() {
    var xs = filtered(), stu = !guide();
    var cats = '<div class="chipwrap at-start"><button type="button" class="cs l" data-scroll="-1" aria-label="Scroll categories left" tabindex="-1">‹</button><div class="chips" role="group" aria-label="Kind of tool"><button type="button" data-cat="all" class="' + (S.cat === "all" ? "on" : "") + '">Everything</button>' + Object.keys(T.CATS).map(function (k) { return '<button type="button" data-cat="' + k + '" class="' + (S.cat === k ? "on" : "") + '">' + T.CATS[k][1] + " " + esc(T.CATS[k][0]) + "</button>"; }).join("") + "</div><button type=\"button\" class=\"cs r\" data-scroll=\"1\" aria-label=\"Scroll categories right\" tabindex=\"-1\">›</button></div>";
    var tg = '<div class="tg" role="group" aria-label="Show">' + [["", "All"], ["shelf", "On the shelf now"]].concat(stu ? [["mine", "I can borrow"]] : [["need", "Need more"]]).concat([["ch", "For a challenge"]]).map(function (x) { return '<button type="button" data-f="' + x[0] + '" class="' + (S.f === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div>";
    return '<div class="ctrl"><div class="in"><input type="search" id="q" placeholder="Search tools, materials or a challenge (like NL-25.3)" value="' + esc(S.q) + '" autocomplete="off">' + tg + cats + "</div></div>" +
      '<div class="newbar"><p class="count">' + xs.length + " of " + T.TOOLS.length + " tools and materials</p>" + (stu ? '<button type="button" class="ghost sm" data-newreq>Can\'t find it? Ask for it</button>' : '<button type="button" class="go sm" data-additem>Add a tool or material</button>') + "</div>" +
      (!xs.length && stu ? '<section class="panel" style="margin-top:10px"><h2>Nothing matches' + (S.q ? " “" + esc(S.q) + "”" : "") + '</h2><p class="sub">If your project needs something we don\'t have, ask for it. Guides see every request and decide what to get.</p><button type="button" class="go" data-newreq>Ask for it</button></section>' : "") +
      '<div class="grid">' + xs.map(function (t) {
        var s = stock(t);
        return '<button type="button" class="tc' + (!s.have && t.k !== "material" ? " need" : "") + '" data-open="' + t.id + '"><span class="top"><span class="em" aria-hidden="true">' + t.e + '</span><span><h3>' + esc(t.n) + "</h3>" + (t.m && t.m !== t.n ? '<p class="m">' + esc(T.CATS[t.c][0]) + "</p>" : '<p class="m">' + esc(T.CATS[t.c][0]) + "</p>") + '</span></span><p class="d">' + esc(t.d) + '</p><span class="st">' + availHtml(t) + " " + accessPill(t) + "</span></button>";
      }).join("") + "</div>";
  }
  // The detail sheet, with what this student (or guide) can do.
  function openItem(id) {
    var t = byId[id]; if (!t) return;
    var s = stock(t), dd = $("#dd"), band = S.role && S.role.band, act = "";
    var active = S.loans.filter(function (l) { return l.item === id && ["requested", "waiting", "out", "wish"].indexOf(l.status) >= 0; });
    if (!guide()) {
      var mineNow = active[0];
      if (mineNow) act = '<p class="note ok">' + (mineNow.status === "out" ? "You have this one. Bring it back by " + (mineNow.due === today() ? "the end of today" : fmt(mineNow.due)) + "." : mineNow.status === "wish" ? "You asked us to get this one." : "You asked for this. A guide will hand it to you.") + "</p>";
      else if (t.k === "material" ? (!s.have && !S.inv[t.id]) || s.stock === "out" : !s.have) act = '<p class="note">' + (t.k === "material" ? (s.stock === "out" ? "We're out of this right now." : "We don't stock this yet.") : "Not in the library yet.") + ' If your project needs it, tell us: it moves up the shopping list.</p><label>What would you use it for?<input id="ddnote" maxlength="200"></label><button class="go" data-ask="wish" data-id="' + id + '">Request it</button>';
      else if (t.k === "material") act = '<label>How much do you need, and for what?<input id="ddamt" maxlength="120" placeholder="For example: 2 boards for my birdhouse"></label><button class="go" data-ask="material" data-id="' + id + '">Ask for it</button>';
      else if (t.a === "staff") act = '<p class="note">Guides run this one. Tell us your project and a guide will plan it with you.</p><label>Your project<input id="ddnote" maxlength="200"></label><button class="go" data-ask="borrow" data-id="' + id + '">Ask a guide</button>';
      else if (t.a === "badge" && !certOk(t)) act = certNeed(t);
      // Machines stay put, so students reserve a time instead of borrowing them now.
      else if (t.loan === "place") act = '<p class="note">Reserve a time below.' + (t.a === "guide" ? " A guide will be there the whole time." : "") + "</p>";
      else act = (s.free > 0 ? "" : '<p class="note">All of them are out right now. Get in line and you\'re next, or reserve one for later.</p>') + '<label>What\'s it for?<input id="ddnote" maxlength="200"></label><button class="go" data-ask="' + (s.free > 0 ? "borrow" : "wait") + '" data-id="' + id + '">' + (s.free > 0 ? "Borrow it now" : "Get in line") + "</button>" + (t.a === "guide" ? '<p class="note">A guide will be with you while you use it.</p>' : "");
      if (canReserve(t, s, band)) act += reserveForm(t);
      if (t.k === "material" && S.inv[t.id]) act += reportForm(t);
    } else {
      act = active.length ? '<p class="note"><b>Right now:</b> ' + active.map(function (l) { return esc(first(l.name)) + " (" + ({ out: "has it, due " + fmt(l.due), requested: "asked", waiting: "in line", wish: "asked us to get it" })[l.status] + ")"; }).join(", ") + '</p>' : "";
      var rs = S.loans.filter(function (l) { return l.item === id && liveResv(l); }).sort(function (a, b) { return a.start - b.start; });
      if (rs.length) act += '<p class="note"><b>Reserved:</b> ' + rs.map(function (l) { return esc(first(l.name)) + " (" + esc(spanTxt(l.start, l.end)) + ((l.qty || 1) > 1 ? ", " + l.qty : "") + ")"; }).join("; ") + "</p>";
      var rp = reportsFor(t.id);
      if (rp.length) act += '<p class="note"><b>Reported ' + (rp.some(function (x) { return x.level === "out"; }) ? "out" : "running low") + ":</b> " + rp.map(reportTxt).join("; ") + ". Saving the stock level below clears these.</p>";
      act += stockForm(t, s);
      act += '<p class="note">Inventory: ' + s.have + " owned" + (s.broken ? ", " + s.broken + " out of service" : "") + (s.loc ? ", kept at " + esc(s.loc) : "") + (s.counted ? "" : " (not counted yet)") + '. <a href="#inventory">Update</a> · <a href="#desk">Check it out to a student</a></p>';
    }
    dd.innerHTML = '<div class="b"><div class="h"><span class="em">' + t.e + "</span><h2>" + esc(t.n) + '</h2><button class="x" data-close aria-label="Close">✕</button></div><p>' + esc(t.d) + "</p>" +
      (t.tip ? '<p class="tip">⚠️ ' + esc(t.tip) + "</p>" : "") +
      "<dl><dt>Status</dt><dd>" + availHtml(t) + "</dd><dt>Who</dt><dd>" + accessPill(t) + " " + esc(T.ACCESS[t.a][1]) + "</dd>" + (t.a === "badge" ? "<dt>Certification</dt><dd>" + (t.cert && CERT[t.cert] ? '<button type="button" class="linkish" data-cert="' + t.cert + '">' + CERT[t.cert].e + " " + esc(CERT[t.cert].n) + "</button>" : "Ask a guide") + "</dd>" : "") + "</dd><dt>Loan</dt><dd>" + esc(T.LOAN[t.loan]) + "</dd>" + (t.m ? "<dt>Model</dt><dd>" + esc(t.m) + "</dd>" : "") +
      (t.ch && t.ch.length ? "<dt>Challenges</dt><dd>" + t.ch.map(function (c) { return '<a href="' + (SITE === "guides" ? "/guides/challenges/" : "/challenges/") + "#c=" + encodeURIComponent(c) + '">' + esc(c) + "</a>"; }).join(", ") + "</dd>" : "") + (s.loc ? "<dt>Where</dt><dd>" + esc(s.loc) + "</dd>" : "") + "</dl>" +
      '<div class="act">' + act + '</div><p class="note" id="ddmsg" role="status"></p></div>';
    if (!dd.open) dd.showModal();
    var rb = dd.querySelector("[data-reserve]"); if (rb) showFree(rb.dataset.reserve);
  }
  // Can this student reserve this item? The same checks as borrowing it now: its certification, and that we have one.
  function canReserve(t, s, band) {
    if (t.a === "staff" || !certOk(t)) return false;
    if (t.k === "material") return !!(s.have || S.inv[t.id]) && s.stock !== "out";
    return s.have - s.broken > 0;
  }
  function reserveForm(t) {
    var mat = t.k === "material", s = stock(t), cap = Math.max(1, s.have - s.broken), d = nextSlot();
    var mine = S.loans.filter(function (l) { return l.item === t.id && liveResv(l); }).sort(function (a, b) { return a.start - b.start; });
    var opt = function (v, label, cur) { return '<option value="' + v + '"' + (v === cur ? " selected" : "") + ">" + esc(label) + "</option>"; };
    return '<div class="resv"><h3>' + (mat ? "Set some aside for later" : "Reserve it for later") + '</h3><p class="note">In 4-hour blocks. A guide hands it to you when your time starts.</p>' +
      (mine.length ? '<p class="note ok">You reserved it: ' + mine.map(function (l) { return esc(spanTxt(l.start, l.end)); }).join("; ") + ".</p>" : "") +
      '<div class="form">' +
      '<label>Day<input type="date" id="rv-date" min="' + today() + '" max="' + plusDays(AHEAD) + '" value="' + d[0] + '"></label>' +
      '<label>Starting at<select id="rv-h">' + BLOCKS.map(function (h) { return opt(h, hourTxt(h), d[1]); }).join("") + "</select></label>" +
      '<label>For<select id="rv-len">' + LENGTHS.map(function (x) { return opt(x[0], x[1], 4); }).join("") + "</select></label>" +
      (mat ? '<label>How much, and for what?<input id="rv-amt" maxlength="120" placeholder="For example: 2 boards for my birdhouse"></label>'
        : cap > 1 ? '<label>How many<input type="number" id="rv-qty" min="1" max="' + cap + '" value="1"></label>' : "") +
      '<label class="wide">What\'s it for?<input id="rv-note" maxlength="200"></label></div>' +
      '<p class="note" id="rv-free" role="status"></p><button class="go" data-reserve="' + t.id + '">Reserve it</button></div>';
  }
  // A reservation may start in the block that's under way, but no earlier (firestore.rules allows a start up to 4 hours back).
  var startGone = function (w) { return w.a <= Date.now() - 4 * HOUR; };
  // The window the reservation form describes right now, or null if it isn't a real one.
  function formWindow() {
    var date = ($("#rv-date") || {}).value, h = Number(($("#rv-h") || {}).value), len = Number(($("#rv-len") || {}).value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || BLOCKS.indexOf(h) < 0 || !LENGTHS.some(function (x) { return x[0] === len; })) return null;
    return { date: date, h: h, a: blockAt(date, h), b: blockAt(date, h + len) };
  }
  function showFree(id) {
    var t = byId[id], el = $("#rv-free"), w = formWindow(); if (!t || !el || !w) return;
    if (startGone(w)) { el.className = "note bad"; el.textContent = "That start time has passed. Pick the block that's under way now or a later one."; return; }
    if (t.k === "material") { el.className = "note"; el.textContent = spanTxt(w.a, w.b) + "."; return; }
    var s = stock(t), cap = Math.max(0, s.have - s.broken), f = freeFor(t, w.a, w.b);
    el.className = f > 0 ? "note ok" : "note bad";
    el.textContent = spanTxt(w.a, w.b) + ": " + (f > 0 ? (cap > 1 ? f + " of " + cap + " free." : "free.") : "already taken. Try another time.");
  }
  async function reserve(id, btn) {
    var t = byId[id], r = S.role, msg = $("#ddmsg"), w = formWindow(), mat = t.k === "material", now = Date.now();
    var bad = function (m) { msg.className = "note bad"; msg.textContent = m; };
    if (!w) return bad("Pick a day, a start time and how long.");
    if (startGone(w)) return bad("That start time has passed. Pick the block that's under way now or a later one.");
    if (w.a > now + AHEAD * 24 * HOUR) return bad("You can reserve up to " + AHEAD + " days ahead.");
    var qty = mat ? 1 : Math.max(1, Math.min(50, Math.round(Number(($("#rv-qty") || {}).value) || 1)));
    var amt = mat ? (($("#rv-amt") || {}).value || "").trim() : "", note = (($("#rv-note") || {}).value || "").trim();
    if (mat && !amt) return bad("Say how much you need.");
    if (!mat) { var f = freeFor(t, w.a, w.b); if (qty > f) return bad(f ? "Only " + f + " free then. Ask for fewer or pick another time." : "That time is already taken. Try another time."); }
    btn.disabled = true; msg.className = "note"; msg.textContent = "Reserving…";
    try {
      var name = isTest() ? "Test Student" : String((user() && user().displayName) || String(r.email).split("@")[0]);
      var data = { item: id, n: t.n, kind: "reserve", email: String(r.email || "").toLowerCase(), sid: r.sid || "", name: name.slice(0, 60), band: r.band || "", status: "reserved", at: now, when: w.date + " " + pad(w.h) + ":00", amt: amt.slice(0, 120), note: note.slice(0, 200), start: w.a, end: w.b, qty: qty };
      var hold = { item: id, start: w.a, end: w.b, qty: qty };
      if (isTest()) { data.test = true; hold.test = true; }
      var lid = newId(), W = [{ path: "toolLoans/" + lid, data: data, create: true }];
      if (!mat) W.push({ path: "toolHolds/" + lid, data: hold, create: true });
      await commit(W);
      S.loans.unshift(Object.assign({ id: lid }, data));
      if (!mat) S.holds.push(Object.assign({ id: lid }, hold));
      if (window.wlNotifyGuides) window.wlNotifyGuides({ kind: "tool", text: first(name) + " reserved " + t.n + (qty > 1 ? " (" + qty + ")" : "") + " for " + spanTxt(w.a, w.b) + (amt ? ": " + amt.slice(0, 80) : ""), link: "/guides/tools/#desk" });
      draw(); openItem(id); var m = $("#ddmsg"); if (m) { m.className = "note ok"; m.textContent = "Reserved: " + spanTxt(w.a, w.b) + ". It's under My tools, where you can cancel it."; }
      refreshTasks();
    } catch (e) { btn.disabled = false; bad(e.message); }
  }

  // Guides: set what we have of an item, which moves it from "Not in the library yet" to on the shelf / ready to book.
  function stockForm(t, s) {
    var mat = t.k === "material", label = mat ? "In stock" : t.k === "machine" ? "Ready to book" : "On the shelf";
    var wants = S.loans.filter(function (l) { return l.item === t.id && l.status === "wish"; }).length;
    return '<div class="stock"><h3>' + (s.have || (mat && S.inv[t.id] && s.stock !== "out") ? "Update stock" : "Stock it: mark it " + label.toLowerCase()) + "</h3>" +
      (mat ? '<label>Stock<select id="stk-stock">' + [["ok", "In stock"], ["low", "Running low"], ["out", "Out"]].map(function (o) { return '<option value="' + o[0] + '"' + ((S.inv[t.id] || {}).stock === o[0] || (!S.inv[t.id] && o[0] === "ok") ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>"
        : '<label>How many we have<input type="number" id="stk-have" min="0" max="999" value="' + (s.have || 1) + '"></label>') +
      '<label>Where it lives<input id="stk-loc" maxlength="60" value="' + esc(s.loc) + '" placeholder="For example: Shed, shelf 2"></label>' +
      '<button class="go" data-stock="' + t.id + '">' + (s.have ? "Save" : "Mark " + label.toLowerCase()) + "</button>" +
      (wants ? '<p class="note">' + wants + " student" + (wants === 1 ? " asked" : "s asked") + " for this. They'll be told it's here.</p>" : "") +
      (t.custom ? ' <button class="ghost sm" data-edititem="' + t.id + '">Edit details</button>' : "") + "</div>";
  }
  async function stockIt(id, btn) {
    var t = byId[id], mat = t.k === "material", now = Date.now(), d = { updated: now, by: me(), counted: true, loc: (($("#stk-loc") || {}).value || "").trim().slice(0, 60) };
    if (mat) { d.stock = $("#stk-stock").value; d.have = d.stock === "out" ? 0 : 1; }
    else d.have = Math.max(0, Math.min(999, Math.round(Number($("#stk-have").value) || 0)));
    var waiting = d.have > 0 ? S.loans.filter(function (l) { return l.item === id && l.status === "wish"; }) : [];
    // A guide setting the level answers any "running low" reports: in stock means restocked, low or out puts it on the restock list.
    var reps = mat ? reportsFor(id) : [];
    btn.disabled = true;
    try {
      await commit([{ path: "toolInventory/" + id, data: d, merge: true }].concat(waiting.map(function (l) { return { path: "toolLoans/" + l.id, data: { status: "done", closed: now, by: me(), byName: myName() }, merge: true }; }))
        .concat(reps.map(function (x) { return { path: "toolReports/" + x.id, del: true }; })));
      dropReports(id);
      S.inv[id] = Object.assign(S.inv[id] || {}, d);
      waiting.forEach(function (l) { l.status = "done"; });
      var emails = waiting.map(function (l) { return l.email; }).filter(Boolean);
      if (emails.length && window.wlNotify) window.wlNotify(emails, { kind: "tool", text: t.n + " is in the Tool Library now. You asked for it: go borrow it.", link: "/tools/" });
      S.msg = t.n + (d.have ? " is " + (mat ? "in stock" : t.k === "machine" ? "ready to book" : "on the shelf") : " is marked not in the library") + (emails.length ? ". " + emails.length + " student" + (emails.length === 1 ? " who asked was" : "s who asked were") + " told." : ".");
      draw(); openItem(id); var m = $("#ddmsg"); if (m) { m.className = "note ok"; m.textContent = S.msg; }
    } catch (e) { btn.disabled = false; alert(e.message); }
  }

  // ---------- "running low" reports ----------
  var reportsFor = function (id) { return S.reports.filter(function (x) { return x.item === id; }); };
  var dropReports = function (id) { S.reports = S.reports.filter(function (x) { return x.item !== id; }); };
  var reportTxt = function (x) { return esc(first(x.name)) + " (" + (x.level === "out" ? "out" : "low") + ", " + esc(fmt(iso(new Date(x.at)))) + (x.note ? ": " + esc(x.note) : "") + ")"; };
  function reportForm(t) {
    var mine = reportsFor(t.id)[0], lvl = (S.inv[t.id] || {}).stock;
    if (mine) return '<div class="resv"><h3>Running low?</h3><p class="note ok">You told the guides on ' + esc(fmt(iso(new Date(mine.at)))) + ". It's on their restock list.</p></div>";
    return '<div class="resv"><h3>Running low?</h3><p class="note">' + (lvl === "low" || lvl === "out" ? "Guides already know it's " + (lvl === "out" ? "out" : "low") + ". Tell them anyway if you need it soon." : "Tell the guides so it goes on the restock list.") + "</p>" +
      '<div class="form"><label>How much is left?<select id="rp-level"><option value="low">A little</option><option value="out">None</option></select></label>' +
      '<label>Anything else?<input id="rp-note" maxlength="200" placeholder="For example: only white PLA left"></label></div>' +
      '<button class="ghost" data-report="' + t.id + '">Tell the guides</button></div>';
  }
  async function report(id, btn) {
    var t = byId[id], r = S.role, msg = $("#ddmsg"), now = Date.now();
    var level = ($("#rp-level") || {}).value === "out" ? "out" : "low", note = (($("#rp-note") || {}).value || "").trim().slice(0, 200);
    var name = isTest() ? "Test Student" : String((user() && user().displayName) || String(r.email).split("@")[0]).slice(0, 60);
    var data = { item: id, n: t.n.slice(0, 80), email: String(r.email || "").toLowerCase(), name: name, band: r.band || "", level: level, note: note, at: now };
    if (isTest()) data.test = true;
    btn.disabled = true;
    try {
      var rid = newId();
      await commit([{ path: "toolReports/" + rid, data: data, create: true }]);
      S.reports.unshift(Object.assign({ id: rid }, data));
      if (window.wlNotifyGuides) window.wlNotifyGuides({ kind: "tool", text: first(name) + " says " + t.n + (level === "out" ? " is out" : " is running low") + (note ? ": " + note.slice(0, 80) : ""), link: "/guides/tools/#desk" });
      openItem(id); var m = $("#ddmsg"); if (m) { m.className = "note ok"; m.textContent = "Thanks. The guides see it on their restock list."; }
    } catch (e) { btn.disabled = false; msg.className = "note bad"; msg.textContent = e.message; }
  }
  // Guides: put a reported item on the restock list (its level becomes low or out) or dismiss the reports.
  async function settleReports(id, how, btn) {
    var t = byId[id], reps = reportsFor(id), now = Date.now(), W = reps.map(function (x) { return { path: "toolReports/" + x.id, del: true }; });
    if (how === "list") {
      var level = reps.some(function (x) { return x.level === "out"; }) ? "out" : "low";
      W.unshift({ path: "toolInventory/" + id, data: { stock: level, have: level === "out" ? 0 : 1, counted: true, updated: now, by: me() }, merge: true });
    }
    btn.disabled = true;
    try {
      await commit(W);
      if (how === "list") S.inv[id] = Object.assign(S.inv[id] || {}, W[0].data);
      dropReports(id);
      S.msg = how === "list" ? t.n + " is on the restock list as " + (S.inv[id].stock === "out" ? "out." : "running low.") : "Dismissed the reports for " + t.n + ".";
      draw();
    } catch (e) { btn.disabled = false; alert(e.message); }
  }

  // Guides: add a new tool or material to the catalog (or edit one they added). from: a student's request to turn into an item.
  var EMOJI = { digital: "🖨️", wood: "🪚", carve: "🔪", clay: "🏺", fiber: "🧵", elec: "🔌", nature: "🔭", garden: "🌱", camp: "🏕️", kitchen: "🍳", art: "🎨", media: "📷", measure: "📏", bike: "🚲", safety: "🦺", play: "🤸", learn: "📋", mat: "📦" };
  function itemForm(id, from) {
    var t = id ? byId[id] : null, req = from ? S.loans.find(function (l) { return l.id === from; }) : null;
    var v = t || { n: req ? req.n : "", c: "wood", k: req && req.amt === "material" ? "material" : "tool", a: "open", cert: "", loan: "day", e: "", d: "", m: "", tip: "", want: 1 };
    var sel = function (idn, opts, cur) { return '<select id="' + idn + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"; };
    var dd = $("#dd");
    dd.innerHTML = '<div class="b"><div class="h"><span class="em">' + (v.e || "🧰") + "</span><h2>" + (t ? "Edit " + esc(t.n) : "Add a tool or material") + '</h2><button class="x" data-close aria-label="Close">✕</button></div>' +
      (req ? '<p class="note">' + esc(first(req.name)) + " asked for this" + (req.note ? ": “" + esc(req.note) + "”" : "") + ". They'll be told when it's in the library.</p>" : "") +
      '<div class="form">' +
      '<label class="wide">Name<input id="it-n" maxlength="100" value="' + esc(v.n) + '" placeholder="For example: Hot glue gun"></label>' +
      "<label>Kind" + sel("it-k", [["tool", "Tool (borrow it)"], ["machine", "Machine (book a time)"], ["material", "Material (used up)"]], v.k) + "</label>" +
      "<label>Category" + sel("it-c", Object.keys(T.CATS).map(function (k) { return [k, T.CATS[k][1] + " " + T.CATS[k][0]]; }), v.c) + "</label>" +
      "<label>Who can use it" + sel("it-a", Object.keys(T.ACCESS).map(function (k) { return [k, T.ACCESS[k][0]]; }), v.a) + "</label>" +
      "<label>Certification (if it needs one)" + sel("it-cert", [["", "None"]].concat(Object.keys(CERT).map(function (k) { return [k, CERT[k].e + " " + CERT[k].n]; })), v.cert || "") + "</label>" +
      "<label>Loan" + sel("it-loan", Object.keys(T.LOAN).map(function (k) { return [k, T.LOAN[k]]; }), v.loan) + "</label>" +
      '<label>Icon (an emoji)<input id="it-e" maxlength="4" value="' + esc(v.e) + '" placeholder="' + (EMOJI[v.c] || "🧰") + '"></label>' +
      (t ? "" : '<label>How many we have now<input type="number" id="it-have" min="0" max="999" value="' + (req ? 0 : 1) + '"></label>') +
      '<label>How many we should have<input type="number" id="it-want" min="0" max="999" value="' + (v.want || 1) + '"></label>' +
      '<label>Model or brand<input id="it-m" maxlength="80" value="' + esc(v.m) + '"></label>' +
      '<label class="wide">What it\'s for<textarea id="it-d" maxlength="300" rows="2">' + esc(v.d) + "</textarea></label>" +
      '<label class="wide">Safety note (optional)<input id="it-tip" maxlength="200" value="' + esc(v.tip) + '"></label>' +
      '</div><div class="act"><button class="go" data-saveitem="' + (t ? t.id : "") + '" data-from="' + (from || "") + '">' + (t ? "Save" : "Add it to the library") + "</button>" +
      (t && t.custom ? ' <button class="ghost" data-delitem="' + t.id + '">Remove from the catalog</button>' : "") + '</div><p class="note" id="ddmsg" role="status"></p></div>';
    if (!dd.open) dd.showModal();
    setTimeout(function () { var n = $("#it-n"); if (n) n.focus(); }, 50);
  }
  var slug = function (n) { return String(n).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "item"; };
  async function saveItem(id, from, btn) {
    var val = function (x) { return (($("#" + x) || {}).value || "").trim(); }, msg = $("#ddmsg");
    var n = val("it-n"); if (!n) { msg.className = "note bad"; msg.textContent = "Give it a name."; return; }
    var dup = !id && T.TOOLS.find(function (t) { return t.n.toLowerCase() === n.toLowerCase(); });
    if (dup) { msg.className = "note bad"; msg.innerHTML = "That's already in the catalog. <button class=\"ghost sm\" data-open=\"" + dup.id + "\">Open it</button>"; return; }
    var c = val("it-c"), d = { n: n.slice(0, 100), c: c, k: val("it-k"), a: val("it-cert") ? "badge" : val("it-a") === "badge" ? "open" : val("it-a"), cert: val("it-cert"), loan: val("it-loan"), e: val("it-e") || EMOJI[c] || "🧰", d: val("it-d").slice(0, 300), m: val("it-m").slice(0, 80), tip: val("it-tip").slice(0, 200), want: Math.max(0, Math.min(999, Math.round(Number(val("it-want")) || 0))), by: me(), at: Date.now() };
    if (d.k === "material") d.loan = "take";
    var nid = id || "x-" + slug(n) + "-" + newId().slice(0, 5), have = id ? null : Math.max(0, Math.min(999, Math.round(Number(val("it-have")) || 0)));
    var req = from ? S.loans.find(function (l) { return l.id === from; }) : null, now = Date.now();
    var W = [{ path: "toolItems/" + nid, data: d }];
    if (have != null) W.push({ path: "toolInventory/" + nid, data: d.k === "material" ? { have: have ? 1 : 0, stock: have ? "ok" : "", counted: true, updated: now, by: me() } : { have: have, counted: true, updated: now, by: me() }, merge: true });
    // The student's request now points at the real item: still "asked us to get it" until it's stocked, then they're told.
    if (req) W.push({ path: "toolLoans/" + req.id, data: { item: nid, n: d.n, kind: "wish" }, merge: true });
    btn.disabled = true;
    try {
      await commit(W);
      addCustom(Object.assign({ id: nid }, d));
      if (have != null) S.inv[nid] = Object.assign(S.inv[nid] || {}, W[1].data);
      if (req) { req.item = nid; req.n = d.n; req.kind = "wish"; }
      if (req && have && window.wlNotify && req.email) { await commit([{ path: "toolLoans/" + req.id, data: { status: "done", closed: now }, merge: true }]).catch(function () { }); req.status = "done"; window.wlNotify([req.email], { kind: "tool", text: d.n + " is in the Tool Library now. You asked for it: go borrow it.", link: "/tools/" }); }
      S.msg = d.n + (id ? " saved." : " is in the catalog."); draw(); openItem(nid);
    } catch (e) { btn.disabled = false; msg.className = "note bad"; msg.textContent = e.message; }
  }
  async function delItem(id, btn) {
    var t = byId[id]; if (!t || !t.custom) return;
    if (S.loans.some(function (l) { return l.item === id && l.status === "out"; })) { alert("Someone has this checked out. Check it in first."); return; }
    if (!confirm("Remove " + t.n + " from the catalog? Past checkouts stay in the records.")) return;
    btn.disabled = true;
    try {
      var r = await fetch(FS + "/toolItems/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + await tok() } });
      if (!r.ok) throw new Error(r.status === 403 ? "Not allowed: the Tool Library's database rules may not be published yet." : "Couldn't remove it (" + r.status + ")");
      T.TOOLS.splice(T.TOOLS.indexOf(t), 1); delete byId[id]; $("#dd").close(); S.msg = t.n + " was removed."; draw();
    } catch (e) { btn.disabled = false; alert(e.message); }
  }

  // Students: ask for something that isn't in the catalog at all.
  function newReqForm() {
    var dd = $("#dd");
    dd.innerHTML = '<div class="b"><div class="h"><span class="em">💡</span><h2>Ask for something new</h2><button class="x" data-close aria-label="Close">✕</button></div>' +
      '<p>Something your project needs that isn\'t in the library? Tell the guides. They see every request and decide what to get.</p><div class="act">' +
      '<label>What is it?<input id="nr-n" maxlength="100" value="' + esc(S.q) + '" placeholder="For example: a hot glue gun, clay, a GoPro"></label>' +
      '<label>Is it something you use up?<select id="nr-k"><option value="tool">No, it\'s a tool or machine</option><option value="material">Yes, it\'s a material (wood, glue, paper…)</option></select></label>' +
      '<label>What\'s it for?<input id="nr-note" maxlength="200" placeholder="Your project"></label>' +
      '<button class="go" data-sendnew>Send my request</button></div><p class="note" id="ddmsg" role="status"></p></div>';
    if (!dd.open) dd.showModal();
    setTimeout(function () { var n = $("#nr-n"); if (n) n.focus(); }, 50);
  }
  async function sendNew(btn) {
    var n = $("#nr-n").value.trim(), note = $("#nr-note").value.trim(), k = $("#nr-k").value, msg = $("#ddmsg"), r = S.role;
    if (!n) { msg.className = "note bad"; msg.textContent = "Say what it is."; return; }
    btn.disabled = true; msg.textContent = "Sending…";
    try {
      var name = isTest() ? "Test Student" : String((user() && user().displayName) || String(r.email).split("@")[0]);
      var data = { item: "new", n: n.slice(0, 100), kind: "new", email: String(r.email || "").toLowerCase(), sid: r.sid || "", name: name.slice(0, 60), band: r.band || "", status: "wish", at: Date.now(), when: "", amt: k, note: note.slice(0, 200) };
      if (isTest()) data.test = true;
      var lid = newId(); await commit([{ path: "toolLoans/" + lid, data: data, create: true }]);
      S.loans.unshift(Object.assign({ id: lid }, data));
      if (window.wlNotifyGuides) window.wlNotifyGuides({ kind: "tool", text: first(name) + " asked the Tool Library to get: " + data.n + (note ? " (" + note.slice(0, 80) + ")" : ""), link: "/guides/tools/#shop" });
      msg.className = "note ok"; msg.textContent = "Sent. You'll see it under My tools, and you'll hear when it's in the library.";
      btn.textContent = "Sent"; draw();
    } catch (e) { btn.disabled = false; msg.className = "note bad"; msg.textContent = e.message; }
  }
  async function ask(kind, id, btn) {
    var t = byId[id], s = stock(t), msg = $("#ddmsg"), r = S.role;
    var note = ($("#ddnote") || {}).value || "", amt = ($("#ddamt") || {}).value || "";
    var when = kind === "book" ? ($("#dddate").value || today()) + " " + $("#ddpart").value.toLowerCase() : "";
    if (kind === "material" && !amt.trim()) { msg.textContent = "Say how much you need."; return; }
    btn.disabled = true; msg.textContent = "Sending…";
    try {
      var name = isTest() ? "Test Student" : String((user() && user().displayName) || String(r.email).split("@")[0]);
      var data = { item: id, n: t.n, kind: kind === "wait" ? "borrow" : kind, email: String(r.email || "").toLowerCase(), sid: r.sid || "", name: name.slice(0, 60), band: r.band || "", status: kind === "wait" ? "waiting" : kind === "wish" ? "wish" : "requested", at: Date.now(), when: when, amt: amt.trim().slice(0, 120), note: note.trim().slice(0, 200) };
      if (isTest()) data.test = true;
      var lid = newId(); await commit([{ path: "toolLoans/" + lid, data: data, create: true }]);
      S.loans.unshift(Object.assign({ id: lid }, data));
      var what = kind === "wish" ? "asked us to get: " : kind === "badge" ? "wants to learn (badge): " : kind === "book" ? "wants to book " : kind === "material" ? "asked for " : kind === "wait" ? "is in line for " : "asked to borrow ";
      if (window.wlNotifyGuides) window.wlNotifyGuides({ kind: "tool", text: first(name) + " " + what + t.n + (when ? " (" + whenTxt(when) + ")" : "") + (amt ? ": " + amt : ""), link: kind === "wish" ? "/guides/tools/#shop" : "/guides/tools/#desk" });
      msg.className = "note ok"; msg.textContent = kind === "wish" ? "Sent. Guides see it on their shopping list, and you'll hear when it's in the library." : kind === "wait" ? "You're in line." : "Sent. A guide will hand it to you.";
      draw(); setTimeout(function () { openItem(id); }, 400);
      if (window.wlTasks) window.wlTasks.refresh();
    } catch (e) { btn.disabled = false; msg.className = "note bad"; msg.textContent = e.message; }
  }
  async function cancel(lid) {
    var l = S.loans.find(function (x) { return x.id === lid; }); if (!l) return;
    var W = [{ path: "toolLoans/" + lid, data: { status: "cancelled", closed: Date.now() }, merge: true }];
    if (hasHold(l)) W.push({ path: "toolHolds/" + lid, del: true });
    try { await commit(W); l.status = "cancelled"; dropHold(lid); draw(); refreshTasks(); }
    catch (e) { alert(e.message); }
  }

  // A reservation of a tool or machine has a hold on the calendar with the same id; a material doesn't.
  var hasHold = function (l) { return isResv(l) && (byId[l.item] || {}).k !== "material"; };
  var dropHold = function (lid) { S.holds = S.holds.filter(function (h) { return h.id !== lid; }); };

  // ---------- Guides: the desk ----------
  function gtabs(v) {
    var req = S.loans.filter(function (l) { return l.status === "requested" && l.kind !== "cert"; }).length, late = S.loans.filter(function (l) { return l.status === "out" && l.due < today(); }).length, rtoday = resvToday().length;
    var a = function (id, label, n) { return '<a href="#' + id + '"' + (v === id ? ' aria-current="page"' : "") + ">" + label + (n ? '<span class="n">' + n + "</span>" : "") + "</a>"; };
    return '<nav class="gtabs" aria-label="Tool Library">' + a("desk", "Desk", req + late + rtoday + reportedItems().length) + a("catalog", "Catalog") + a("inventory", "Inventory") + a("certs", "Certifications", S.loans.filter(function (l) { return l.kind === "cert" && l.status === "requested"; }).length) + a("shop", "Shopping list") + "</nav>";
  }
  function deskSummary() {
    var out = S.loans.filter(function (l) { return l.status === "out"; }), late = out.filter(function (l) { return l.due < today(); });
    var counted = T.TOOLS.filter(function (t) { return (S.inv[t.id] || {}).counted; }).length;
    return '<div class="panel"><h2>Today</h2><p class="sub">' + S.loans.filter(function (l) { return l.status === "requested"; }).length + " asked for · " + out.length + " out · " + (late.length ? '<b style="color:var(--bad)">' + late.length + " late</b>" : "none late") + " · " + resvToday().length + " reserved for today</p>" +
      '<p class="sub">Inventory: ' + counted + " of " + T.TOOLS.length + ' items counted</p><div class="bar"><i style="width:' + Math.round(100 * counted / T.TOOLS.length) + '%"></i></div>' +
      '<p class="sub"><a href="#inventory">Count what we have</a> · <a href="#shop">What to buy</a>' + (S.loans.some(function (l) { return l.status === "wish"; }) ? ' · <b><a href="#shop">' + S.loans.filter(function (l) { return l.status === "wish"; }).length + " student requests</a></b>" : "") + '</p><button type="button" class="ghost sm" data-additem>Add a tool or material</button></div>';
  }
  // Items with open "running low" reports, most recent first.
  var reportedItems = function () { var seen = {}; return S.reports.filter(function (x) { if (seen[x.item] || !byId[x.item]) return false; seen[x.item] = 1; return true; }).map(function (x) { return x.item; }); };
  // Reservations still waiting to be handed over that start before the end of today.
  var resvToday = function () { return S.loans.filter(function (l) { return liveResv(l) && l.start < endOfToday(); }); };
  // A reservation is due back on the day its last block ends (one that ends at midnight is due the day before).
  var dueFor = function (t, l) { return l && isResv(l) && l.end ? iso(new Date(l.end - 1)) : l && l.kind === "book" && l.when ? l.when.split(" ")[0] : t && t.loan === "week" ? plusDays(7) : today(); };
  function loanRow(l, actions) {
    var t = byId[l.item] || (l.kind === "cert" && CERT[l.item]) || { e: "🧰", n: l.n }, late = l.status === "out" && l.due < today();
    var kind = { borrow: "Borrow", book: "Booking", reserve: "Reserved" + ((l.qty || 1) > 1 ? " × " + l.qty : ""), material: "Materials", badge: "Wants its badge", cert: "Ready for a check-off", wish: "Asked us to get it", "new": "New request" + (l.amt === "material" ? " (material)" : "") }[l.kind] || "";
    return '<li class="' + (late ? "late" : "") + '"><span class="em">' + t.e + '</span><span class="t"><b>' + esc(l.name) + "</b> · " + esc(t.n || l.n) + "<small>" + esc(kind) + (isResv(l) ? " · " + esc(spanTxt(l.start, l.end)) : l.when ? " · " + esc(whenTxt(l.when)) : "") + (l.amt && l.kind !== "new" ? " · " + esc(l.amt) : "") + (l.note ? " · “" + esc(l.note) + "”" : "") + (l.status === "out" ? " · " + (late ? "was due " : "due ") + esc(fmt(l.due)) : "") + "</small></span>" + actions + "</li>";
  }
  function desk() {
    var req = S.loans.filter(function (l) { return l.status === "requested" && l.kind !== "cert"; }), wait = S.loans.filter(function (l) { return l.status === "waiting"; });
    var out = S.loans.filter(function (l) { return l.status === "out"; }).sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); });
    var resv = S.loans.filter(liveResv).sort(function (a, b) { return a.start - b.start; });
    var missed = S.loans.filter(function (l) { return isResv(l) && l.status === "reserved" && (l.end || 0) <= Date.now(); });
    var give = function (l) {
      var t = byId[l.item];
      if (t && t.a === "badge" && l.kind !== "cert" && !certOk(t, l.sid)) return '<span class="pill p-late" title="This student hasn\'t passed ' + esc(CERT[t.cert] ? CERT[t.cert].n : "this tool's certification") + '">Not certified</span> ' + give2(l);
      return give2(l);
    };
    var give2 = function (l) {
      var t = byId[l.item];
      if (l.kind === "badge") return '<button class="ghost sm" data-badge-from="' + l.id + '">Taught: give badge</button><button class="ghost sm" data-decline="' + l.id + '">Not now</button>';
      if (l.kind === "cert") return '<button class="ghost sm" data-checkoff="' + esc(l.item) + '">Check off</button>';
      if (l.kind === "material" || (isResv(l) && t && t.k === "material")) return '<button class="ghost sm" data-given="' + l.id + '">Given</button><button class="ghost sm" data-decline="' + l.id + '">' + (isResv(l) ? "Cancel it" : "Not now") + "</button>";
      if (isResv(l)) return '<input type="date" value="' + dueFor(t, l) + '" id="due-' + l.id + '" aria-label="Due"><button class="ghost sm" data-hand="' + l.id + '">Hand it out</button><button class="ghost sm" data-decline="' + l.id + '">Cancel it</button>';
      return '<input type="date" value="' + dueFor(t, l) + '" id="due-' + l.id + '" aria-label="Due"><button class="ghost sm" data-hand="' + l.id + '">Hand it out</button><button class="ghost sm" data-decline="' + l.id + '">Not now</button>';
    };
    var back = function (l) { return '<select id="cond-' + l.id + '" aria-label="Condition"><option value="fine">Fine</option><option value="repair">Needs repair</option><option value="missing">Missing pieces</option></select><button class="ghost sm" data-back="' + l.id + '">Back</button>'; };
    var section = function (h, xs, act, empty) { return '<section class="panel"><h2>' + h + " (" + xs.length + ")</h2>" + (xs.length ? '<ul class="loans">' + xs.map(function (l) { return loanRow(l, act(l)); }).join("") + "</ul>" : '<p class="sub">' + empty + "</p>") + "</section>"; };
    var kidOpts = S.kids.filter(upper).map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + " (" + esc(s.band) + ")</option>"; }).join("");
    var itemOpts = T.TOOLS.filter(function (t) { return t.k !== "material" && stock(t).have > 0; }).map(function (t) { return '<option value="' + t.id + '">' + esc(t.n) + "</option>"; }).join("");
    return (S.msg ? '<p class="note ok" role="status">' + esc(S.msg) + "</p>" : "") + certQueue() + '<div class="cols">' +
      section("Asked for", req, give, "No requests right now.") +
      section("Out now", out, back, "Nothing checked out.") +
      (function () {
        var ids = reportedItems(); if (!ids.length) return "";
        return '<section class="panel"><h2>Running low (' + ids.length + ')</h2><p class="sub">Students said these are low or out.</p><ul class="loans">' + ids.map(function (id) {
          var t = byId[id], rp = reportsFor(id);
          return '<li><span class="em">' + t.e + '</span><span class="t"><b>' + esc(t.n) + "</b><small>" + rp.map(reportTxt).join("; ") + "</small></span>" +
            '<button class="ghost sm" data-relist="' + id + '">Add to restock list</button><button class="ghost sm" data-redismiss="' + id + '">Dismiss</button></li>';
        }).join("") + "</ul></section>";
      })() +
      section("Reserved", resv, give, "No reservations coming up. Students reserve from each item's sheet, in 4-hour blocks.") +
      (missed.length ? section("Reservations nobody picked up", missed, function (l) { return '<button class="ghost sm" data-expire="' + l.id + '">Clear</button>'; }, "") : "") +
      section("Waiting in line", wait, function (l) { return stock(byId[l.item] || {}).free > 0 ? give(l) : '<button class="ghost sm" data-decline="' + l.id + '">Remove</button>'; }, "Nobody in line.") +
      '<section class="panel"><h2>Check out to a student</h2><p class="sub">For an Upper Campus student who asked in person, or who doesn\'t sign in.</p><div class="act" style="display:grid;gap:8px"><select id="co-kid"><option value="">Student…</option>' + kidOpts + '</select><select id="co-item"><option value="">Tool…</option>' + itemOpts + '</select><input type="date" id="co-due" value="' + today() + '"><button class="go" data-checkout>Check it out</button></div>' +
      (itemOpts ? "" : '<p class="sub">Only tools with at least one counted in Inventory can be checked out.</p>') + "</section></div>";
  }
  async function hand(lid, btn) {
    var l = S.loans.find(function (x) { return x.id === lid; }); if (!l) return;
    var t = byId[l.item], n = l.qty || 1, due = ($("#due-" + lid) || {}).value || dueFor(t, l), now = Date.now(), nm = myName();
    if (t && stock(t).free < n && !confirm("The inventory says " + (n > 1 ? "fewer than " + n + " are" : "none are") + " free. Hand it out anyway?")) return;
    btn.disabled = true;
    try {
      var W = [{ path: "toolLoans/" + lid, data: { status: "out", due: due, out: now, by: me(), byName: nm }, merge: true }, { path: "toolInventory/" + l.item, data: { updated: now }, merge: true, inc: { out: n } }];
      if (hasHold(l)) W.push({ path: "toolHolds/" + lid, data: { out: true }, merge: true });
      await commit(W);
      Object.assign(l, { status: "out", due: due, out: now, by: me(), byName: nm }); bumpInv(l.item, n);
      S.holds.forEach(function (h) { if (h.id === lid) h.out = true; });
      if (window.wlNotify && l.email) window.wlNotify([l.email], { kind: "tool", text: (l.kind === "book" ? "You're booked: " + l.n + " on " + fmt(due) : "You've got " + l.n + ". Bring it back by " + (due === today() ? "the end of today" : fmt(due))) + ".", link: "/tools/" });
      S.msg = l.n + " is checked out to " + l.name + "."; draw(); refreshTasks();
    } catch (e) { btn.disabled = false; alert(e.message); }
  }
  async function back(lid, btn) {
    var l = S.loans.find(function (x) { return x.id === lid; }); if (!l) return;
    var cond = ($("#cond-" + lid) || {}).value || "fine", gnote = cond === "fine" ? "" : (prompt(cond === "repair" ? "What needs fixing?" : "What's missing?") || "");
    btn.disabled = true;
    try {
      var now = Date.now(), n = l.qty || 1, inc = { out: -n }; if (cond === "repair") inc.broken = 1;
      var W = [{ path: "toolLoans/" + lid, data: { status: "returned", back: now, cond: cond, gnote: gnote.slice(0, 200) }, merge: true }, { path: "toolInventory/" + l.item, data: { updated: now }, merge: true, inc: inc }];
      if (hasHold(l)) W.push({ path: "toolHolds/" + lid, del: true });
      await commit(W);
      Object.assign(l, { status: "returned", back: now, cond: cond }); bumpInv(l.item, -n); dropHold(lid); if (cond === "repair") { S.inv[l.item].broken = (S.inv[l.item].broken || 0) + 1; }
      S.msg = l.n + " is back" + (cond === "fine" ? "." : ", marked " + (cond === "repair" ? "needs repair" : "missing pieces") + "."); draw(); refreshTasks();
    } catch (e) { btn.disabled = false; alert(e.message); }
  }
  async function closeLoan(lid, status, btn) {
    var l = S.loans.find(function (x) { return x.id === lid; }); if (!l) return; btn.disabled = true; var was = l.status;
    try {
      var W = [{ path: "toolLoans/" + lid, data: { status: status, closed: Date.now(), by: me(), byName: myName() }, merge: true }];
      if (hasHold(l)) W.push({ path: "toolHolds/" + lid, del: true });
      await commit(W);
      l.status = status; dropHold(lid);
      if (status === "declined" && window.wlNotify && l.email) window.wlNotify([l.email], { kind: "tool", text: was === "wish" ? myName() + " says the library won't get " + l.n + " for now. Ask them about it." : was === "reserved" ? myName() + " cancelled your reservation of " + l.n + " (" + spanTxt(l.start, l.end) + "). Ask them about it." : myName() + " couldn't hand out " + l.n + " right now. Ask them about it.", link: "/tools/" });
      draw(); refreshTasks();
    } catch (e) { btn.disabled = false; alert(e.message); }
  }
  async function checkout(btn) {
    var sid = $("#co-kid").value, id = $("#co-item").value, due = $("#co-due").value || today();
    if (!sid || !id) { alert("Pick a student and a tool."); return; }
    var s = S.kids.find(function (k) { return k.id === sid; }), t = byId[id], now = Date.now(), lid = newId(), nm = myName();
    if (t.a === "badge" && !certOk(t, sid) && !confirm(s.name + " hasn't passed the " + (CERT[t.cert] ? CERT[t.cert].n : "") + " certification. Check it out anyway (only if you'll be right there)?")) return;
    var data = { item: id, n: t.n, kind: "borrow", email: String(s.email || "").toLowerCase(), sid: sid, name: s.name || "", band: s.band || "", status: "out", at: now, when: "", amt: "", note: "", due: due, out: now, by: me(), byName: nm };
    if (isTest()) data.test = true;
    btn.disabled = true;
    try {
      await commit([{ path: "toolLoans/" + lid, data: data, create: true }, { path: "toolInventory/" + id, data: { updated: now }, merge: true, inc: { out: 1 } }]);
      S.loans.unshift(Object.assign({ id: lid }, data)); bumpInv(id, 1); S.msg = t.n + " is checked out to " + s.name + "."; draw();
    } catch (e) { btn.disabled = false; alert(e.message); }
  }
  function bumpInv(id, n) { S.inv[id] = S.inv[id] || {}; S.inv[id].out = Math.max(0, (S.inv[id].out || 0) + n); }
  var me = function () { return String((S.role && S.role.email) || "").toLowerCase(); };
  var myName = function () { return isTest() ? "Test Guide" : first((user() && user().displayName) || me().split("@")[0]); };
  var refreshTasks = function () { if (window.wlTasks) window.wlTasks.refresh(); };

  // ---------- Guides: inventory ----------
  function inventory() {
    var counted = T.TOOLS.filter(function (t) { return (S.inv[t.id] || {}).counted; }).length;
    var rows = Object.keys(T.CATS).map(function (c) {
      var xs = T.TOOLS.filter(function (t) { return t.c === c && (!S.f || S.f !== "uncounted" || !(S.inv[t.id] || {}).counted); });
      if (!xs.length) return "";
      return '<tr><th colspan="7" style="background:var(--shelf);color:var(--paper)">' + T.CATS[c][1] + " " + esc(T.CATS[c][0]) + "</th></tr>" + xs.map(function (t) {
        var s = stock(t), d = S.dirty[t.id] ? " dirty" : "";
        return '<tr class="' + d + '" data-row="' + t.id + '"><td>' + t.e + " " + esc(t.n) + "</td>" +
          (t.k === "material" ? '<td colspan="2"><select data-f="stock"><option value="">Not stocked</option>' + ["ok", "low", "out"].map(function (v) { return '<option value="' + v + '"' + ((S.inv[t.id] || {}).stock === v ? " selected" : "") + ">" + { ok: "In stock", low: "Low", out: "Out" }[v] + "</option>"; }).join("") + "</select></td>"
            : '<td><input type="number" min="0" max="999" data-f="have" value="' + s.have + '" aria-label="How many we own"></td><td><input type="number" min="0" max="999" data-f="broken" value="' + s.broken + '" aria-label="Out of service"></td>') +
          '<td>' + (t.k === "material" ? "" : s.out) + '</td><td><input data-f="loc" value="' + esc(s.loc) + '" placeholder="Where it lives" maxlength="60"></td><td><input type="checkbox" data-f="counted"' + (s.counted ? " checked" : "") + ' aria-label="Counted"></td><td><button class="ghost sm" data-save="' + t.id + '">Save</button></td></tr>';
      }).join("");
    }).join("");
    return '<section class="panel" style="margin:12px 0"><div class="newbar"><h2>Count what we have</h2><button type="button" class="go sm" data-additem>Add a tool or material</button></div><p class="sub">Go shelf by shelf. Set how many we own and how many are out of service, where each lives, and tick Counted. ' + counted + " of " + T.TOOLS.length + ' counted so far.</p><div class="bar"><i style="width:' + Math.round(100 * counted / T.TOOLS.length) + '%"></i></div><div class="tg"><button data-f="" class="' + (S.f !== "uncounted" ? "on" : "") + '">Everything</button><button data-f="uncounted" class="' + (S.f === "uncounted" ? "on" : "") + '">Not counted yet</button></div></section>' +
      '<div class="tblw"><table class="tbl"><thead><tr><th>Item</th><th>Own</th><th>Out of service</th><th>Out now</th><th>Where</th><th>Counted</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  }
  async function saveRow(id, btn) {
    var tr = document.querySelector('tr[data-row="' + id + '"]'), t = byId[id], d = { updated: Date.now(), by: me() };
    tr.querySelectorAll("[data-f]").forEach(function (el) { var f = el.dataset.f; d[f] = el.type === "checkbox" ? el.checked : el.type === "number" ? Math.max(0, Math.round(Number(el.value) || 0)) : el.value.trim(); });
    if (t.k === "material" && d.stock) d.have = d.stock === "out" ? 0 : 1;
    btn.disabled = true;
    try { await commit([{ path: "toolInventory/" + id, data: d, merge: true }]); S.inv[id] = Object.assign(S.inv[id] || {}, d); delete S.dirty[id]; btn.textContent = "Saved"; setTimeout(draw, 600); }
    catch (e) { btn.disabled = false; alert(e.message); }
  }

  // ---------- certifications: students ----------
  // On a tool's sheet, when the student isn't certified for it yet.
  function certNeed(t) {
    var c = CERT[t.cert];
    if (!c) return '<p class="note">This one needs a guide to check you off first. Ask a guide.</p>';
    var others = certTools(t.cert).filter(function (x) { return x.id !== t.id; });
    var p = pendingCert(t.cert);
    return '<p class="note">To borrow this on your own, pass the <b>' + c.e + " " + esc(c.n) + "</b> certification" + (others.length ? ". It also covers " + others.map(function (x) { return esc(x.n); }).join(", ") : "") + ". " +
      (p ? "You've asked for your check-off: a guide will watch you and sign you off." : "Learn the safety rules, take a short quiz, then show a guide.") + '</p><button class="go" data-cert="' + t.cert + '">' + (p ? "See my certification" : "Start the certification") + "</button>";
  }
  // Every certification and where this student stands.
  function openCertList() {
    var dd = $("#dd"), sid = mySid();
    dd.innerHTML = '<div class="b"><div class="h"><span class="em">🛡️</span><h2>Safety certifications</h2><button class="x" data-close aria-label="Close">✕</button></div>' +
      '<p class="sub">No tool here is for “older kids only.” Each certification covers a group of similar tools: learn its safety rules, pass the quiz, and show a guide you can use them safely. Then you can borrow every tool in the group on your own.</p>' +
      '<div class="clist">' + Object.keys(CERT).map(function (k) {
        var c = CERT[k], done = certsOf(sid)[k], p = pendingCert(k), ts = certTools(k);
        return '<button type="button" class="crow" data-cert="' + k + '"><span class="em">' + c.e + '</span><span class="t"><b>' + esc(c.n) + "</b><small>" + esc(ts.map(function (x) { return x.n; }).join(", ") || "No tools yet") + "</small></span>" +
          (done ? '<span class="pill p-out">Certified</span>' : p ? '<span class="pill p-wait">Check-off asked</span>' : S.quiz[k] ? '<span class="pill p-wait">Quiz passed</span>' : "") + "</button>";
      }).join("") + "</div></div>";
    if (!dd.open) dd.showModal();
  }
  // One certification: the rules, the quiz, and asking for a check-off.
  function openCert(cid) {
    var c = CERT[cid]; if (!c) return;
    if (guide()) { openCheck(cid); return; }
    var dd = $("#dd"), done = certsOf(mySid())[cid], p = pendingCert(cid), ts = certTools(cid), quizOk = !c.quiz.length || S.quiz[cid];
    var step = function (n, h, body) { return '<div class="cstep"><h3><i>' + n + "</i> " + h + "</h3>" + body + "</div>"; };
    dd.innerHTML = '<div class="b"><div class="h"><span class="em">' + c.e + "</span><h2>" + esc(c.n) + '</h2><button class="x" data-close aria-label="Close">✕</button></div>' +
      '<p class="sub">Covers: ' + (ts.map(function (x) { return x.e + " " + esc(x.n); }).join(", ") || "no tools yet") + "</p>" +
      (done ? '<p class="note ok">You\'re certified' + (done.byName ? " (checked off by " + esc(done.byName) + (done.at ? ", " + fmt(iso(new Date(done.at))) : "") + ")" : "") + ". You can borrow all of these on your own. Keep following the rules: a guide can take a certification back if it isn't used safely.</p>" : "") +
      step(1, "The safety rules", '<ol class="rules">' + c.rules.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ol>") +
      (c.quiz.length ? step(2, "Quiz", quizOk && !S.retake ? '<p class="note ok">Passed. <button type="button" class="linkish" data-retake="' + cid + '">Take it again</button></p>' :
        c.quiz.map(function (q, i) { return '<fieldset class="q"><legend>' + esc(q[0]) + "</legend>" + q[1].map(function (a, j) { return '<label><input type="radio" name="q' + i + '" value="' + j + '"> ' + esc(a) + "</label>"; }).join("") + '<p class="why" id="why' + i + '"></p></fieldset>'; }).join("") +
        '<button class="go" data-quiz="' + cid + '">Check my answers</button>') : "") +
      step(c.quiz.length ? 3 : 2, "Show a guide", '<p class="sub">A guide watches you do each of these, then signs you off. Guides often check off a few students at once, so you might do it with friends.</p><ul class="check">' + c.check.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" +
        (done ? "" : p ? '<p class="note ok">You asked for your check-off. A guide will find you.</p><button class="ghost sm" data-cancel="' + p.id + '">Cancel my request</button>'
          : quizOk ? (c.quiz.length ? "" : '<label class="agree"><input type="checkbox" id="agree"> I read the rules and I\'ll follow them.</label>') + '<button class="go" data-certask="' + cid + '">I\'m ready for my check-off</button>' : '<p class="note">Pass the quiz first.</p>')) +
      '<p class="note" id="ddmsg" role="status"></p></div>';
    S.retake = false;
    if (!dd.open) dd.showModal();
  }
  function gradeQuiz(cid, btn) {
    var c = CERT[cid], right = 0;
    c.quiz.forEach(function (q, i) {
      var pick = document.querySelector('input[name="q' + i + '"]:checked'), el = $("#why" + i), ok = pick && +pick.value === q[2];
      if (ok) right++;
      el.className = "why " + (ok ? "ok" : "bad"); el.textContent = !pick ? "Pick an answer." : ok ? "Right. " + q[3] : "Not quite. " + q[3];
    });
    var msg = $("#ddmsg");
    if (right === c.quiz.length) { passQuiz(cid); openCert(cid); var m = $("#ddmsg"); if (m) { m.className = "note ok"; m.textContent = "All right! Now ask a guide for your check-off."; } }
    else { msg.className = "note bad"; msg.textContent = right + " of " + c.quiz.length + " right. Read the rules again and try once more."; }
  }
  async function certAsk(cid, btn) {
    var c = CERT[cid], r = S.role, msg = $("#ddmsg"), ag = $("#agree");
    if (ag && !ag.checked) { msg.className = "note bad"; msg.textContent = "Check the box to say you read the rules."; return; }
    btn.disabled = true;
    try {
      var name = isTest() ? "Test Student" : String((user() && user().displayName) || String(r.email).split("@")[0]);
      var data = { item: cid, n: c.n.slice(0, 100), kind: "cert", email: String(r.email || "").toLowerCase(), sid: r.sid || "", name: name.slice(0, 60), band: r.band || "", status: "requested", at: Date.now(), when: "", amt: "", note: c.quiz.length ? "Passed the quiz" : "Read the rules" };
      if (isTest()) data.test = true;
      var lid = newId(); await commit([{ path: "toolLoans/" + lid, data: data, create: true }]);
      S.loans.unshift(Object.assign({ id: lid }, data));
      if (window.wlNotifyGuides) window.wlNotifyGuides({ kind: "tool", text: first(name) + " is ready for a " + c.n + " check-off", link: "/guides/tools/#certs" });
      draw(); openCert(cid);
      if (window.wlTasks) window.wlTasks.refresh();
    } catch (e) { btn.disabled = false; msg.className = "note bad"; msg.textContent = e.message; }
  }

  // ---------- certifications: guides ----------
  var waitingFor = function (cid) { return S.loans.filter(function (l) { return l.kind === "cert" && l.status === "requested" && l.item === cid; }); };
  // The Desk's strip of students waiting, grouped by certification, so one check-off session covers them all.
  function certQueue() {
    var ids = Object.keys(CERT).filter(function (k) { return waitingFor(k).length; });
    if (!ids.length) return "";
    return '<section class="panel" style="margin:12px 0"><h2>Ready for a check-off</h2><p class="sub">They read the rules and passed the quiz. Watch each one do the check-off list, then sign them off together.</p><div class="clist">' +
      ids.map(function (k) { var w = waitingFor(k); return '<button type="button" class="crow" data-checkoff="' + k + '"><span class="em">' + CERT[k].e + '</span><span class="t"><b>' + esc(CERT[k].n) + "</b><small>" + w.map(function (l) { return esc(first(l.name)); }).join(", ") + '</small></span><span class="pill p-wait">' + w.length + " waiting</span></button>"; }).join("") + "</div></section>";
  }
  function certsView() {
    var cur = S.kid && S.kids.find(function (k) { return k.id === S.kid; }), have = cur ? certsOf(cur.id) : {};
    var loose = T.TOOLS.filter(function (t) { return t.a === "badge" && !CERT[t.cert]; });
    return (S.msg ? '<p class="note ok" role="status">' + esc(S.msg) + "</p>" : "") + certQueue() +
      '<section class="panel" style="margin:12px 0"><h2>Certifications</h2><p class="sub">No tool is limited by grade. A tool that needs a certification can be borrowed by any student who passed it: they read the rules, pass the quiz on their own, then you watch them do the check-off list. One certification covers a group of similar tools, so a student is checked off once for all of them. Move tools between groups, or add a new group, with “Tools”.</p>' +
      '<div class="clist">' + Object.keys(CERT).map(function (k) {
        var c = CERT[k], n = Object.keys(S.certs).filter(function (sid) { return S.certs[sid][k]; }).length, w = waitingFor(k).length;
        return '<div class="crow"><span class="em">' + c.e + '</span><span class="t"><b>' + esc(c.n) + "</b><small>" + esc(certTools(k).map(function (x) { return x.n; }).join(", ") || "No tools yet") + " · " + n + " certified" + (w ? " · " + w + " waiting" : "") + '</small></span><button class="ghost sm" data-checkoff="' + k + '">Check off</button><button class="ghost sm" data-certtools="' + k + '">Tools</button></div>';
      }).join("") + "</div>" +
      (loose.length ? '<p class="note bad" style="margin-top:10px">These need a certification but aren\'t in a group yet, so students can\'t get certified for them: ' + loose.map(function (t) { return esc(t.n); }).join(", ") + ". Add each to a group with “Tools”.</p>" : "") +
      '<button class="ghost sm" style="margin-top:10px" data-newcert>Add a certification</button></section>' +
      '<section class="panel" style="margin:12px 0"><h2>One student</h2><p class="sub">See or change a student\'s certifications. Take one away if a tool isn\'t used safely; they can earn it back.</p>' +
      '<select id="bk"><option value="">Pick a student…</option>' + S.kids.filter(upper).map(function (s) { return '<option value="' + esc(s.id) + '"' + (S.kid === s.id ? " selected" : "") + ">" + esc(s.name) + " (" + esc(s.band) + ") · " + Object.keys(certsOf(s.id)).length + "</option>"; }).join("") + "</select>" +
      (cur ? '<div class="ckgrid">' + Object.keys(CERT).map(function (k) { return '<label><input type="checkbox" data-scert="' + k + '"' + (have[k] ? " checked" : "") + "> " + CERT[k].e + " " + esc(CERT[k].n) + (have[k] && have[k].byName ? ' <small>(' + esc(have[k].byName) + ")</small>" : "") + "</label>"; }).join("") + '</div><button class="go sm" data-savescert>Save</button>' : "") + "</section>";
  }
  // The check-off sheet: what to watch for, and who to sign off (the students who asked, plus any others you watched).
  function openCheck(cid) {
    var c = CERT[cid]; if (!c) return;
    var dd = $("#dd"), w = waitingFor(cid), wsid = w.map(function (l) { return l.sid; });
    var others = S.kids.filter(upper).filter(function (s) { return wsid.indexOf(s.id) < 0 && !certsOf(s.id)[cid]; });
    var certified = S.kids.filter(function (s) { return certsOf(s.id)[cid]; });
    dd.innerHTML = '<div class="b"><div class="h"><span class="em">' + c.e + "</span><h2>Check off: " + esc(c.n) + '</h2><button class="x" data-close aria-label="Close">✕</button></div>' +
      '<p class="sub">Covers ' + (certTools(cid).map(function (x) { return esc(x.n); }).join(", ") || "no tools yet") + '. <button type="button" class="linkish" data-certtools="' + cid + '">Change tools</button></p>' +
      '<div class="cstep"><h3>Watch them do</h3><ul class="check">' + c.check.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + '</ul><details><summary class="sub">The safety rules they learned</summary><ol class="rules">' + c.rules.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ol></details></div>" +
      '<div class="cstep"><h3>Sign off</h3>' +
      (w.length ? '<p class="sub">Asked for a check-off (' + (c.quiz.length ? "quiz passed" : "read the rules") + "):</p>" + w.map(function (l) { return '<div class="who"><label><input type="checkbox" data-co="' + esc(l.sid) + '" data-lid="' + l.id + '" checked> ' + esc(l.name) + '</label><button class="ghost sm" data-notyet="' + l.id + '">Not yet</button></div>'; }).join("") : '<p class="sub">Nobody has asked yet.</p>') +
      (others.length ? '<details' + (w.length ? "" : " open") + '><summary class="sub">Add students you taught in person (a Lab or a group lesson)</summary><div class="ckgrid">' + others.map(function (s) { return '<label><input type="checkbox" data-co="' + esc(s.id) + '"> ' + esc(s.name) + " <small>" + esc(s.band) + "</small></label>"; }).join("") + "</div></details>" : "") +
      '<button class="go" data-certify="' + cid + '">Certify the checked students</button></div>' +
      (certified.length ? '<p class="sub">Already certified: ' + certified.map(function (s) { return esc(s.name); }).join(", ") + ".</p>" : "") +
      '<p class="note" id="ddmsg" role="status"></p></div>';
    if (!dd.open) dd.showModal();
  }
  async function certify(cid, btn) {
    var boxes = [].slice.call(document.querySelectorAll("[data-co]:checked")), msg = $("#ddmsg");
    if (!boxes.length) { msg.className = "note bad"; msg.textContent = "Check at least one student."; return; }
    var now = Date.now(), nm = myName(), W = [], sids = [], lids = [];
    boxes.forEach(function (b) {
      var sid = b.dataset.co; if (!sid || sids.indexOf(sid) >= 0) return; sids.push(sid); if (b.dataset.lid) lids.push(b.dataset.lid);
      var m = Object.assign({}, certsOf(sid)); m[cid] = { at: now, by: me(), byName: nm };
      W.push({ path: "toolBadges/" + sid, data: { certs: m, by: me(), at: now }, merge: true });
    });
    lids.forEach(function (lid) { W.push({ path: "toolLoans/" + lid, data: { status: "done", closed: now, by: me(), byName: nm }, merge: true }); });
    if (!W.length) { msg.className = "note bad"; msg.textContent = "Those students have no roster record to save the certification on."; return; }
    btn.disabled = true;
    try {
      await commit(W);
      sids.forEach(function (sid) { S.certs[sid] = Object.assign({}, certsOf(sid)); S.certs[sid][cid] = { at: now, by: me(), byName: nm }; });
      lids.forEach(function (lid) { var l = S.loans.find(function (x) { return x.id === lid; }); if (l) l.status = "done"; });
      var emails = sids.map(function (sid) { var k = S.kids.find(function (x) { return x.id === sid; }); return k && k.email; }).filter(Boolean);
      if (window.wlNotify && emails.length) window.wlNotify(emails, { kind: "tool", text: "You're certified: " + CERT[cid].n + ". You can borrow " + (certTools(cid).length > 1 ? "all of those tools" : "it") + " on your own now.", link: "/tools/" });
      S.msg = sids.length + (sids.length > 1 ? " students are" : " student is") + " certified for " + CERT[cid].n + ".";
      $("#dd").close(); draw(); refreshTasks();
    } catch (e) { btn.disabled = false; msg.className = "note bad"; msg.textContent = e.message; }
  }
  async function notYet(lid, btn) {
    var l = S.loans.find(function (x) { return x.id === lid; }); if (!l) return;
    var why = prompt("What should " + first(l.name) + " practice first? (They'll see this.)") ; if (why === null) return;
    btn.disabled = true;
    try {
      await commit([{ path: "toolLoans/" + lid, data: { status: "declined", gnote: why.slice(0, 200), closed: Date.now(), by: me(), byName: myName() }, merge: true }]);
      l.status = "declined";
      if (window.wlNotify && l.email) window.wlNotify([l.email], { kind: "tool", text: "Not yet for " + l.n + (why ? ": " + why.slice(0, 160) : "") + ". Practice and ask again.", link: "/tools/" });
      openCheck(l.item); draw(); refreshTasks();
    } catch (e) { btn.disabled = false; alert(e.message); }
  }
  async function saveStudentCerts(btn) {
    var sid = S.kid, old = certsOf(sid), m = {}, now = Date.now();
    [].forEach.call(document.querySelectorAll("[data-scert]"), function (x) { if (x.checked) m[x.dataset.scert] = old[x.dataset.scert] || { at: now, by: me(), byName: myName() }; });
    btn.disabled = true;
    try { await commit([{ path: "toolBadges/" + sid, data: { certs: m, by: me(), at: now }, merge: true }]); S.certs[sid] = m; S.msg = "Certifications saved."; draw(); }
    catch (e) { btn.disabled = false; alert(e.message); }
  }
  // Which tools a certification covers. Each tool can be in one group; moving it out makes it open, guide-only or
  // guide-run instead. Saved for everyone in toolConfig/certs.
  function openCertTools(cid) {
    var c = CERT[cid], dd = $("#dd");
    var opts = function (cur) { return [["open", "Anyone (no certification)"], ["guide", "Only with a guide there"], ["staff", "Guides use it"]].concat(Object.keys(CERT).map(function (k) { return [k, CERT[k].e + " " + CERT[k].n]; })).map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join(""); };
    var ts = certTools(cid), rest = T.TOOLS.filter(function (t) { return t.cert !== cid; }).sort(function (a, b) { return a.n.localeCompare(b.n); });
    dd.innerHTML = '<div class="b"><div class="h"><span class="em">' + c.e + "</span><h2>Tools in " + esc(c.n) + '</h2><button class="x" data-close aria-label="Close">✕</button></div>' +
      '<p class="sub">Students certified for ' + esc(c.n) + " can borrow every tool here. Add a similar tool and everyone already certified can borrow it too, with no new check-off.</p>" +
      (ts.length ? '<ul class="loans">' + ts.map(function (t) { return '<li><span class="em">' + t.e + '</span><span class="t"><b>' + esc(t.n) + '</b></span><select data-move="' + t.id + '" aria-label="Move ' + esc(t.n) + '">' + opts(cid) + "</select></li>"; }).join("") + "</ul>" : '<p class="sub">No tools yet.</p>') +
      '<div class="act" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><select id="addtool" style="flex:1 1 240px"><option value="">Add a tool…</option>' + rest.map(function (t) { return '<option value="' + t.id + '">' + t.e + " " + esc(t.n) + (t.cert && CERT[t.cert] ? " (now in " + esc(CERT[t.cert].n) + ")" : t.a !== "open" ? " (" + esc(T.ACCESS[t.a][0]) + ")" : "") + "</option>"; }).join("") + '</select><button class="go sm" data-addtool="' + cid + '">Add</button></div>' +
      '<button class="go" style="margin-top:12px" data-savemoves="' + cid + '">Save changes</button> <button class="ghost" data-checkoff="' + cid + '">Back to check-off</button><p class="note" id="ddmsg" role="status"></p></div>';
    if (!dd.open) dd.showModal();
  }
  async function saveMap(changes, btn, then) {
    var m = Object.assign({}, S.cfg.map); Object.keys(changes).forEach(function (id) { m[id] = changes[id]; });
    btn.disabled = true;
    try { await commit([{ path: "toolConfig/certs", data: { map: m, updated: Date.now(), by: me() }, merge: true }]); S.cfg.map = m; applyCerts(); S.msg = "Saved."; draw(); then(); }
    catch (e) { btn.disabled = false; var msg = $("#ddmsg"); if (msg) { msg.className = "note bad"; msg.textContent = e.message; } }
  }
  function openNewCert() {
    var dd = $("#dd");
    dd.innerHTML = '<div class="b"><div class="h"><span class="em">🛡️</span><h2>Add a certification</h2><button class="x" data-close aria-label="Close">✕</button></div>' +
      '<p class="sub">For a group of similar tools that need the same safety rules. Students read the rules and agree to them (there\'s no quiz for groups you add), then you check them off.</p><div class="form">' +
      '<label class="wide">Name<input id="nc-n" maxlength="60" placeholder="For example: Kitchen knives"></label><label>Icon (an emoji)<input id="nc-e" maxlength="4" placeholder="🛡️"></label><span></span>' +
      '<label class="wide">Safety rules, one per line<textarea id="nc-r" rows="5" maxlength="1500"></textarea></label>' +
      '<label class="wide">What the guide watches them do, one per line<textarea id="nc-c" rows="4" maxlength="1000"></textarea></label></div>' +
      '<button class="go" data-savecert>Add it, then choose its tools</button><p class="note" id="ddmsg" role="status"></p></div>';
    if (!dd.open) dd.showModal();
  }
  async function saveNewCert(btn) {
    var v = function (x) { return ($("#" + x).value || "").trim(); }, lines = function (x) { return v(x).split("\n").map(function (l) { return l.trim(); }).filter(Boolean).slice(0, 12); }, msg = $("#ddmsg");
    var n = v("nc-n"), rules = lines("nc-r"), check = lines("nc-c");
    if (!n || !rules.length || !check.length) { msg.className = "note bad"; msg.textContent = "Give it a name, at least one rule and at least one thing to watch."; return; }
    var id = "c-" + slug(n), custom = Object.assign({}, S.cfg.custom); custom[id] = { n: n.slice(0, 60), e: v("nc-e") || "🛡️", rules: rules, check: check };
    btn.disabled = true;
    try { await commit([{ path: "toolConfig/certs", data: { custom: custom, updated: Date.now(), by: me() }, merge: true }]); S.cfg.custom = custom; applyCerts(); draw(); openCertTools(id); }
    catch (e) { btn.disabled = false; msg.className = "note bad"; msg.textContent = e.message; }
  }
  // Older per-tool badge requests from before certifications.
  async function saveBadges(sid, items, btn) {
    if (btn) btn.disabled = true;
    try { await commit([{ path: "toolBadges/" + sid, data: { items: items, by: me(), at: Date.now() }, merge: true }]); S.badges[sid] = items; S.msg = "Badge saved."; draw(); }
    catch (e) { if (btn) btn.disabled = false; alert(e.message); }
  }
  async function badgeFrom(lid, btn) {
    var l = S.loans.find(function (x) { return x.id === lid; }); if (!l || !l.sid) { alert("This request has no student record to put the badge on."); return; }
    var items = (S.badges[l.sid] || []).slice(); if (items.indexOf(l.item) < 0) items.push(l.item);
    await saveBadges(l.sid, items, btn);
    await closeLoan(lid, "done", btn).catch(function () { });
    if (window.wlNotify && l.email) window.wlNotify([l.email], { kind: "tool", text: "You can borrow " + l.n + " on your own now.", link: "/tools/" });
  }
  function certClick(d, b) {
    if (d.certlist !== undefined) { openCertList(); return true; }
    if (d.cert) { openCert(d.cert); return true; }
    if (d.retake) { S.retake = true; openCert(d.retake); return true; }
    if (d.quiz) { gradeQuiz(d.quiz, b); return true; }
    if (d.certask) { certAsk(d.certask, b); return true; }
    if (d.checkoff) { openCheck(d.checkoff); return true; }
    if (d.certify) { certify(d.certify, b); return true; }
    if (d.notyet) { notYet(d.notyet, b); return true; }
    if (d.savescert !== undefined) { saveStudentCerts(b); return true; }
    if (d.certtools) { openCertTools(d.certtools); return true; }
    if (d.addtool) { var id = $("#addtool").value; if (!id) return true; var ch = {}; ch[id] = d.addtool; saveMap(ch, b, function () { openCertTools(d.addtool); }); return true; }
    if (d.savemoves) { var ch2 = {}; [].forEach.call(document.querySelectorAll("[data-move]"), function (s) { if (s.value !== d.savemoves) ch2[s.dataset.move] = s.value; }); if (!Object.keys(ch2).length) { $("#dd").close(); return true; } saveMap(ch2, b, function () { openCertTools(d.savemoves); }); return true; }
    if (d.newcert !== undefined) { openNewCert(); return true; }
    if (d.savecert !== undefined) { saveNewCert(b); return true; }
    return false;
  }

  // ---------- Guides: shopping list ----------
  function shop() {
    var wishes = {}; S.loans.filter(function (l) { return l.status === "wish"; }).forEach(function (l) { (wishes[l.item] = wishes[l.item] || []).push(l); });
    var rows = T.TOOLS.map(function (t) { var s = stock(t), rp = reportsFor(t.id), buy = t.k === "material" ? (s.stock === "low" || s.stock === "out" || rp.length || (!s.have && !S.inv[t.id]) ? 1 : 0) : Math.max(0, t.want - s.have); return { t: t, s: s, buy: buy, w: wishes[t.id] || [], rp: rp }; }).filter(function (r) { return r.buy > 0 || r.w.length; })
      .sort(function (a, b) { return (b.w.length + b.rp.length) - (a.w.length + a.rp.length) || Object.keys(T.CATS).indexOf(a.t.c) - Object.keys(T.CATS).indexOf(b.t.c); });
    var news = S.loans.filter(function (l) { return l.status === "wish" && l.item === "new"; });
    var text = news.map(function (l) { return "New request: " + l.n + " (from " + first(l.name) + ")"; }).concat(rows.map(function (r) { return (r.t.k === "material" ? "Restock: " : r.buy + " × ") + r.t.n + (r.w.length ? " (asked for by " + r.w.length + ")" : "") + (r.rp.length ? " (reported " + (r.rp.some(function (x) { return x.level === "out"; }) ? "out" : "low") + ")" : ""); })).join("\n");
    return '<section class="panel" style="margin:12px 0"><h2>What to buy</h2><p class="sub">Everything below what a school our size should have, by what we\'ve counted. Items students asked for come first. Count first (Inventory), so we don\'t buy what we already own.</p><button class="ghost" data-copy>Copy the list</button> <span class="note" id="copied"></span><textarea id="shoptext" hidden>' + esc(text) + "</textarea></section>" +
      '<section class="panel" style="margin:12px 0"><h2>New things students asked for (' + news.length + ')</h2>' + (news.length ? '<p class="sub">Not in the catalog yet. Add one to the catalog (with how many we have, if any) and the student is told when it\'s in.</p><ul class="loans">' + news.map(function (l) { return loanRow(l, '<button class="ghost sm" data-additem-from="' + l.id + '">Add to catalog</button><button class="ghost sm" data-decline="' + l.id + '">Not now</button>'); }).join("") + "</ul>" : '<p class="sub">None right now. Students ask from the Catalog with "Can\'t find it? Ask for it."</p>') + "</section>" +
      '<div class="tblw"><table class="tbl"><thead><tr><th>Item</th><th>Have</th><th>Aim for</th><th>Buy</th><th>Asked for / reported</th></tr></thead><tbody>' + rows.map(function (r) {
        return "<tr><td>" + r.t.e + " " + esc(r.t.n) + "</td><td>" + (r.t.k === "material" ? esc({ ok: "In stock", low: "Low", out: "Out" }[r.s.stock] || "None") : r.s.have + (r.s.counted ? "" : " ?")) + "</td><td>" + (r.t.k === "material" ? "" : r.t.want) + "</td><td><b>" + (r.t.k === "material" ? "Restock" : r.buy) + "</b></td><td>" + [r.w.length ? r.w.map(function (l) { return esc(first(l.name)) + (l.note ? ": " + esc(l.note) : ""); }).join("; ") : "", r.rp.length ? "Reported: " + r.rp.map(reportTxt).join("; ") : ""].filter(Boolean).join("<br>") + "</td></tr>";
      }).join("") + "</tbody></table></div><p class=\"note\">? means not counted yet.</p>";
  }

  // ---------- events ----------
  document.addEventListener("input", function (e) {
    if (e.target.id === "q") { S.q = e.target.value; var pos = e.target.selectionStart; draw(); var q = $("#q"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) { } } }
    var tr = e.target.closest && e.target.closest("tr[data-row]"); if (tr) { S.dirty[tr.dataset.row] = 1; tr.classList.add("dirty"); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id === "bk") { S.kid = e.target.value; draw(); }
    if (/^rv-/.test(e.target.id || "")) { var rb = document.querySelector("[data-reserve]"); if (rb) showFree(rb.dataset.reserve); }
    var tr = e.target.closest && e.target.closest("tr[data-row]"); if (tr) { S.dirty[tr.dataset.row] = 1; tr.classList.add("dirty"); }
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button,a"); if (!b) { if (e.target === $("#dd")) $("#dd").close(); return; }
    var d = b.dataset;
    if (d.scroll) { var cw = document.querySelector(".chipwrap .chips"); if (cw) cw.scrollBy({ left: +d.scroll * cw.clientWidth * 0.7, behavior: "smooth" }); return; }
    if (d.cat) { S.cat = d.cat; draw(); return; }
    if (d.f !== undefined && b.closest(".tg") && !b.closest("tr")) { S.f = d.f; draw(); return; }
    if (d.open) { openItem(d.open); return; }
    if (d.close !== undefined) { $("#dd").close(); return; }
    if (d.ask) { ask(d.ask, d.id, b); return; }
    if (d.cancel) { cancel(d.cancel); return; }
    if (d.hand) { hand(d.hand, b); return; }
    if (d.back) { back(d.back, b); return; }
    if (d.given) { closeLoan(d.given, "done", b); return; }
    if (d.expire) { closeLoan(d.expire, "done", b); return; }
    if (d.reserve) { reserve(d.reserve, b); return; }
    if (d.report) { report(d.report, b); return; }
    if (d.relist) { settleReports(d.relist, "list", b); return; }
    if (d.redismiss) { settleReports(d.redismiss, "dismiss", b); return; }
    if (d.decline) { closeLoan(d.decline, "declined", b); return; }
    if (d.badgeFrom) { badgeFrom(d.badgeFrom, b); return; }
    if (certClick(d, b)) return;
    if (d.checkout !== undefined) { checkout(b); return; }
    if (d.save) { saveRow(d.save, b); return; }
    if (d.newreq !== undefined) { newReqForm(); return; }
    if (d.sendnew !== undefined) { sendNew(b); return; }
    if (d.additem !== undefined) { itemForm(null); return; }
    if (d.additemFrom) { itemForm(null, d.additemFrom); return; }
    if (d.edititem) { itemForm(d.edititem); return; }
    if (d.saveitem !== undefined) { saveItem(d.saveitem, d.from, b); return; }
    if (d.delitem) { delItem(d.delitem, b); return; }
    if (d.stock) { stockIt(d.stock, b); return; }
    if (d.copy !== undefined) { var tx = $("#shoptext").value; (navigator.clipboard ? navigator.clipboard.writeText(tx) : Promise.reject()).then(function () { $("#copied").textContent = "Copied."; }).catch(function () { $("#shoptext").hidden = false; $("#shoptext").select(); }); return; }
    if (b.getAttribute("href") && /^#/.test(b.getAttribute("href")) && $("#dd").open) $("#dd").close();
  });
  addEventListener("hashchange", function () { S.msg = ""; S.f = ""; draw(); });
  function onRole(r) { S.role = r || null; S.loaded = false; if (!r) return; var go = function (n) { if (user()) load().catch(function (e) { console.warn("Tool Library:", e); $("#view").innerHTML = '<p class="note bad">Couldn\'t load the library (' + esc(e.message) + ").</p>"; }); else if (n < 40) setTimeout(function () { go(n + 1); }, 250); }; draw(); go(0); }
  document.addEventListener("wl-role", function (e) { onRole(e.detail); });
  if (window.wlRole) onRole(window.wlRole);
})();
