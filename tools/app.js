// Wilderland Tool & Materials Library (/tools/ for students, /guides/tools/ for guides; both from _includes/tools.html).
// The catalog is /tools/catalog.js (WLTools). Firestore, over REST with the sign-in from /auth.js:
//   toolInventory/{item id}  what a guide counted: { have, broken, loc, note, stock (materials: ok|low|out), counted,
//                            out (how many are checked out right now), updated, by }. Overrides the catalog's numbers.
//                            Every signed-in student and guide reads it (availability); guides write it.
//   toolLoans/{id}           one request or checkout: { item, n, kind (borrow|book|material|badge|wish), email, sid,
//                            name, band, status (requested|waiting|wish|out|returned|declined|cancelled|done), at,
//                            when (a booking: "YYYY-MM-DD morning"), amt, note, due (YYYY-MM-DD), out, back, by,
//                            byName, cond (fine|repair|missing), gnote, test? }. A student creates their own
//                            requests and can cancel them; guides do everything else.
//   toolBadges/{sid}         { items: [item ids], by, at }: tools a student was taught and signed off on.
// Like a book library: a student asks, a guide hands it over (that's the checkout) and checks it back in.
(function () {
  var FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
  var T = window.WLTools, SITE = document.body.dataset.site === "guides" ? "guides" : "students";
  var BANDS = ["K–1", "2–4", "5–8"];
  var S = { role: null, inv: {}, loans: [], badges: {}, kids: [], q: "", cat: "all", f: "", view: "", band: "All", kid: "", dirty: {}, msg: "" };
  var $ = function (q) { return document.querySelector(q); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var byId = {}; T.TOOLS.forEach(function (t) { byId[t.id] = t; });
  var BUILTIN = T.TOOLS.length;
  // Items guides added (toolItems/{id}): same shape as the catalog's. Merged in, replacing an earlier copy.
  function addCustom(d) {
    if (!d || !d.n || !T.CATS[d.c]) return;
    var t = { id: d.id, n: d.n, c: d.c, k: ["tool", "machine", "material"].indexOf(d.k) >= 0 ? d.k : "tool", have: 0, want: Number(d.want) || 0, a: T.ACCESS[d.a] ? d.a : "open", b: BANDS.indexOf(d.b) >= 0 ? d.b : "K–1", loan: T.LOAN[d.loan] ? d.loan : "day", e: d.e || "🧰", d: d.d || "", m: d.m || "", tip: d.tip || "", custom: true };
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
  // writes: [{ path, data, merge (update only these fields), create (fail if it exists), inc: { field: n } }]
  async function commit(writes) {
    var W = writes.map(function (w) {
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
    if (guide()) out = S.loans.filter(function (l) { return l.item === t.id && l.status === "out" && l.kind !== "material"; }).length;
    return { have: have, broken: broken, out: out, free: Math.max(0, have - broken - out), loc: v.loc || "", note: v.note || "", stock: v.stock || (have > 0 ? "ok" : ""), counted: !!v.counted };
  }
  function availHtml(t) {
    var s = stock(t);
    if (t.k === "material") return s.stock === "out" || (!s.have && !S.inv[t.id]) ? (s.have || S.inv[t.id] ? '<span class="av out">Out of stock</span>' : '<span class="av no">Not stocked yet</span>') : s.stock === "low" ? '<span class="av out">Running low</span>' : '<span class="av ok">In stock</span>';
    if (!s.have) return '<span class="av no">Not in the library yet</span>';
    if (t.k === "machine") return s.free > 0 ? '<span class="av ok">Ready to book</span>' : '<span class="av out">In use</span>';
    return s.free > 0 ? '<span class="av ok">' + (s.have > 1 ? s.free + " of " + s.have + " on the shelf" : "On the shelf") + "</span>" : '<span class="av out">All out' + (s.broken && s.broken >= s.have ? " (being fixed)" : "") + "</span>";
  }
  var accessPill = function (t) { return '<span class="pill p-' + t.a + '">' + esc(T.ACCESS[t.a][0]) + "</span>"; };
  var bandOk = function (t, band) { return BANDS.indexOf(band || "5–8") >= BANDS.indexOf(t.b); };
  var gradesFrom = function (t) { return t.b === "K–1" ? "every grade" : t.b === "2–4" ? "grades 2 and up" : "grades 5 and up"; };
  var myBadges = function () { var sid = S.role && S.role.sid; return (sid && S.badges[sid]) || []; };

  // ---------- loading ----------
  async function load() {
    if (!S.role || !user()) return;
    var jobs = [list("toolInventory").catch(function () { return []; }), list("toolItems").catch(function () { return []; })];
    if (guide()) {
      jobs.push(list("toolLoans").catch(function () { return isTest() ? query("toolLoans", eq("test", true)).catch(function () { return []; }) : []; }));
      jobs.push(list("toolBadges").catch(function () { return []; }));
      jobs.push(list("lsStudents").catch(function () { return []; }));
    } else if (S.role.role === "student") {
      var em = String(S.role.email || "").toLowerCase();
      jobs.push(query("toolLoans", isTest() ? { compositeFilter: { op: "AND", filters: [eq("email", em), eq("test", true)] } } : eq("email", em)).catch(function () { return []; }));
      jobs.push(S.role.sid ? fetch(FS + "/toolBadges/" + S.role.sid, { headers: { Authorization: "Bearer " + await tok() } }).then(function (r) { return r.ok ? r.json().then(function (d) { return [doc(d)]; }) : []; }).catch(function () { return []; }) : Promise.resolve([]));
    }
    var got = await Promise.all(jobs);
    S.inv = {}; got[0].forEach(function (d) { S.inv[d.id] = d; });
    got.splice(1, 1)[0].forEach(addCustom);
    S.loans = (got[1] || []).filter(function (l) { return !!l.test === isTest(); }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    S.badges = {}; (got[2] || []).forEach(function (d) { S.badges[d.id] = d.items || []; });
    if (got[3]) S.kids = got[3].filter(function (s) { return !s.archived && !!s.test === isTest(); }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
    S.loaded = true; draw();
  }

  // ---------- drawing ----------
  function draw() {
    if (!S.loaded) { $("#view").innerHTML = '<p class="note">Loading the library…</p>'; return; }
    var v = guide() ? (location.hash.replace("#", "") || "desk") : "catalog";
    S.view = v;
    $("#side").innerHTML = guide() ? deskSummary() : myTools();
    $("#gtabs").innerHTML = guide() ? gtabs(v) : "";
    $("#view").innerHTML = v === "desk" ? desk() : v === "inventory" ? inventory() : v === "badges" ? badges() : v === "shop" ? shop() : catalog();
  }
  function myTools() {
    var rank = function (l) { return l.status === "out" ? (l.due < today() ? 0 : 1) : 2; };
    var mine = S.loans.filter(function (l) { return ["requested", "waiting", "out", "wish"].indexOf(l.status) >= 0; }).sort(function (a, b) { return rank(a) - rank(b); });
    var li = function (l) {
      var t = byId[l.item] || { e: "🧰", n: l.n }, late = l.status === "out" && l.due && l.due < today();
      var st = l.status === "out" ? (late ? '<span class="pill p-late">Late</span>' : '<span class="pill p-out">You have it</span>') : l.status === "waiting" ? '<span class="pill p-wait">In line</span>' : l.status === "wish" ? '<span class="pill p-wait">Requested</span>' : '<span class="pill p-wait">Asked</span>';
      var sub = l.status === "out" ? (l.kind === "book" ? "Booked for " + fmt(l.due) : late ? "It was due " + fmt(l.due) + ". Bring it back today." : "Bring it back by " + (l.due === today() ? "the end of today" : fmt(l.due))) : l.kind === "book" && l.when ? "Asked for " + esc(whenTxt(l.when)) : l.kind === "badge" ? "Wants to learn it and get its badge" : l.status === "waiting" ? "You're in line for the next one" : l.status === "wish" ? "Guides see this on their shopping list" : "A guide will hand it to you";
      return '<li class="' + (late ? "late" : "") + '"><span class="em">' + t.e + '</span><span class="t"><b>' + esc(t.n || l.n) + "</b><small>" + sub + "</small></span>" + st + (["requested", "waiting", "wish"].indexOf(l.status) >= 0 ? ' <button class="ghost sm" data-cancel="' + l.id + '">Cancel</button>' : "") + "</li>";
    };
    return '<div class="panel"><h2>My tools</h2>' + (mine.length ? '<ul class="loans">' + mine.map(li).join("") + "</ul>" : '<p class="sub">Nothing borrowed. Find what your project needs below and ask for it.</p>') +
      (myBadges().length ? '<p class="sub" style="margin-top:12px">Your badges: ' + myBadges().map(function (id) { return byId[id] ? byId[id].e + " " + esc(byId[id].n) : ""; }).filter(Boolean).join(", ") + "</p>" : "") + "</div>";
  }
  function filtered() {
    var q = S.q.trim().toLowerCase(), band = S.role && S.role.band;
    return T.TOOLS.filter(function (t) {
      if (S.cat !== "all" && t.c !== S.cat) return false;
      if (q && (t.n + " " + (t.m || "") + " " + t.d + " " + T.CATS[t.c][0]).toLowerCase().indexOf(q) < 0) return false;
      var s = stock(t);
      if (S.f === "shelf" && !(t.k === "material" ? s.stock && s.stock !== "out" && (s.have || S.inv[t.id]) : s.free > 0)) return false;
      if (S.f === "mine" && !(t.a === "open" || (t.a === "badge" && myBadges().indexOf(t.id) >= 0)) ) return false;
      if (S.f === "mine" && band && !bandOk(t, band)) return false;
      if (S.f === "need" && !(t.k !== "material" && s.have < t.want)) return false;
      return true;
    });
  }
  function catalog() {
    var xs = filtered(), stu = !guide();
    var cats = '<div class="chips" role="group" aria-label="Kind of tool"><button type="button" data-cat="all" class="' + (S.cat === "all" ? "on" : "") + '">Everything</button>' + Object.keys(T.CATS).map(function (k) { return '<button type="button" data-cat="' + k + '" class="' + (S.cat === k ? "on" : "") + '">' + T.CATS[k][1] + " " + esc(T.CATS[k][0]) + "</button>"; }).join("") + "</div>";
    var tg = '<div class="tg" role="group" aria-label="Show">' + [["", "All"], ["shelf", "On the shelf now"]].concat(stu ? [["mine", "I can borrow"]] : [["need", "Need more"]]).map(function (x) { return '<button type="button" data-f="' + x[0] + '" class="' + (S.f === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div>";
    return '<div class="ctrl"><div class="in"><input type="search" id="q" placeholder="Search tools and materials" value="' + esc(S.q) + '" autocomplete="off">' + tg + cats + "</div></div>" +
      '<div class="newbar"><p class="count">' + xs.length + " of " + T.TOOLS.length + " tools and materials</p>" + (stu ? '<button type="button" class="ghost sm" data-newreq>Can\'t find it? Ask for it</button>' : '<button type="button" class="go sm" data-additem>Add a tool or material</button>') + "</div>" +
      (!xs.length && stu ? '<section class="panel" style="margin-top:10px"><h2>Nothing matches' + (S.q ? " “" + esc(S.q) + "”" : "") + '</h2><p class="sub">If your project needs something we don\'t have, ask for it. Guides see every request and decide what to get.</p><button type="button" class="go" data-newreq>Ask for it</button></section>' : "") +
      '<div class="grid">' + xs.map(function (t) {
        var s = stock(t);
        return '<button type="button" class="tc' + (!s.have && t.k !== "material" ? " need" : "") + '" data-open="' + t.id + '"><span class="top"><span class="em" aria-hidden="true">' + t.e + '</span><span><h3>' + esc(t.n) + "</h3>" + (t.m && t.m !== t.n ? '<p class="m">' + esc(T.CATS[t.c][0]) + "</p>" : '<p class="m">' + esc(T.CATS[t.c][0]) + "</p>") + '</span></span><p class="d">' + esc(t.d) + '</p><span class="st">' + availHtml(t) + " " + accessPill(t) + (t.b !== "K–1" ? ' <span class="pill" style="background:var(--shelf2);color:var(--dim)">' + (t.b === "2–4" ? "2nd+" : "5th+") + "</span>" : "") + "</span></button>";
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
      else if (band && !bandOk(t, band)) act = '<p class="note">This one is for ' + gradesFrom(t) + ". Ask a guide what you could use instead.</p>";
      else if (t.k === "material" ? (!s.have && !S.inv[t.id]) || s.stock === "out" : !s.have) act = '<p class="note">' + (t.k === "material" ? (s.stock === "out" ? "We're out of this right now." : "We don't stock this yet.") : "Not in the library yet.") + ' If your project needs it, tell us: it moves up the shopping list.</p><label>What would you use it for?<input id="ddnote" maxlength="200"></label><button class="go" data-ask="wish" data-id="' + id + '">Request it</button>';
      else if (t.k === "material") act = '<label>How much do you need, and for what?<input id="ddamt" maxlength="120" placeholder="For example: 2 boards for my birdhouse"></label><button class="go" data-ask="material" data-id="' + id + '">Ask for it</button>';
      else if (t.a === "staff") act = '<p class="note">Guides run this one. Tell us your project and a guide will plan it with you.</p><label>Your project<input id="ddnote" maxlength="200"></label><button class="go" data-ask="borrow" data-id="' + id + '">Ask a guide</button>';
      else if (t.a === "badge" && myBadges().indexOf(id) < 0) act = '<p class="note">You need this tool\'s badge first: a guide shows you how and watches you use it safely.</p><button class="go" data-ask="badge" data-id="' + id + '">I want to learn it</button>';
      else if (t.loan === "place") act = '<div class="act"><label>When?<span style="display:flex;gap:8px"><input type="date" id="dddate" min="' + today() + '" value="' + today() + '"><select id="ddpart"><option>Morning</option><option>Afternoon</option></select></span></label><label>What are you making?<input id="ddnote" maxlength="200"></label><button class="go" data-ask="book" data-id="' + id + '">Book it</button>' + (t.a === "guide" ? '<p class="note">A guide will be there the whole time.</p>' : "") + "</div>";
      else act = (s.free > 0 ? "" : '<p class="note">All of them are out right now. Get in line and you\'re next.</p>') + '<label>What\'s it for?<input id="ddnote" maxlength="200"></label><button class="go" data-ask="' + (s.free > 0 ? "borrow" : "wait") + '" data-id="' + id + '">' + (s.free > 0 ? "Borrow it" : "Get in line") + "</button>" + (t.a === "guide" ? '<p class="note">A guide will be with you while you use it.</p>' : "");
    } else {
      act = active.length ? '<p class="note"><b>Right now:</b> ' + active.map(function (l) { return esc(first(l.name)) + " (" + ({ out: "has it, due " + fmt(l.due), requested: "asked", waiting: "in line", wish: "asked us to get it" })[l.status] + ")"; }).join(", ") + '</p>' : "";
      act += stockForm(t, s);
      act += '<p class="note">Inventory: ' + s.have + " owned" + (s.broken ? ", " + s.broken + " out of service" : "") + (s.loc ? ", kept at " + esc(s.loc) : "") + (s.counted ? "" : " (not counted yet)") + '. <a href="#inventory">Update</a> · <a href="#desk">Check it out to a student</a></p>';
    }
    dd.innerHTML = '<div class="b"><div class="h"><span class="em">' + t.e + "</span><h2>" + esc(t.n) + '</h2><button class="x" data-close aria-label="Close">✕</button></div><p>' + esc(t.d) + "</p>" +
      (t.tip ? '<p class="tip">⚠️ ' + esc(t.tip) + "</p>" : "") +
      "<dl><dt>Status</dt><dd>" + availHtml(t) + "</dd><dt>Who</dt><dd>" + accessPill(t) + " " + esc(T.ACCESS[t.a][1]) + "</dd><dt>Grades</dt><dd>" + (t.b === "K–1" ? "Every grade" : t.b === "2–4" ? "2nd grade and up" : "5th grade and up") + "</dd><dt>Loan</dt><dd>" + esc(T.LOAN[t.loan]) + "</dd>" + (t.m ? "<dt>Model</dt><dd>" + esc(t.m) + "</dd>" : "") + (s.loc ? "<dt>Where</dt><dd>" + esc(s.loc) + "</dd>" : "") + "</dl>" +
      '<div class="act">' + act + '</div><p class="note" id="ddmsg" role="status"></p></div>';
    if (!dd.open) dd.showModal();
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
    btn.disabled = true;
    try {
      await commit([{ path: "toolInventory/" + id, data: d, merge: true }].concat(waiting.map(function (l) { return { path: "toolLoans/" + l.id, data: { status: "done", closed: now, by: me(), byName: myName() }, merge: true }; })));
      S.inv[id] = Object.assign(S.inv[id] || {}, d);
      waiting.forEach(function (l) { l.status = "done"; });
      var emails = waiting.map(function (l) { return l.email; }).filter(Boolean);
      if (emails.length && window.wlNotify) window.wlNotify(emails, { kind: "tool", text: t.n + " is in the Tool Library now. You asked for it: go borrow it.", link: "/tools/" });
      S.msg = t.n + (d.have ? " is " + (mat ? "in stock" : t.k === "machine" ? "ready to book" : "on the shelf") : " is marked not in the library") + (emails.length ? ". " + emails.length + " student" + (emails.length === 1 ? " who asked was" : "s who asked were") + " told." : ".");
      draw(); openItem(id); var m = $("#ddmsg"); if (m) { m.className = "note ok"; m.textContent = S.msg; }
    } catch (e) { btn.disabled = false; alert(e.message); }
  }

  // Guides: add a new tool or material to the catalog (or edit one they added). from: a student's request to turn into an item.
  var EMOJI = { digital: "🖨️", wood: "🪚", carve: "🔪", clay: "🏺", fiber: "🧵", elec: "🔌", nature: "🔭", garden: "🌱", camp: "🏕️", kitchen: "🍳", art: "🎨", media: "📷", measure: "📏", bike: "🚲", safety: "🦺", mat: "📦" };
  function itemForm(id, from) {
    var t = id ? byId[id] : null, req = from ? S.loans.find(function (l) { return l.id === from; }) : null;
    var v = t || { n: req ? req.n : "", c: "wood", k: req && req.amt === "material" ? "material" : "tool", a: "open", b: "K–1", loan: "day", e: "", d: "", m: "", tip: "", want: 1 };
    var sel = function (idn, opts, cur) { return '<select id="' + idn + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"; };
    var dd = $("#dd");
    dd.innerHTML = '<div class="b"><div class="h"><span class="em">' + (v.e || "🧰") + "</span><h2>" + (t ? "Edit " + esc(t.n) : "Add a tool or material") + '</h2><button class="x" data-close aria-label="Close">✕</button></div>' +
      (req ? '<p class="note">' + esc(first(req.name)) + " asked for this" + (req.note ? ": “" + esc(req.note) + "”" : "") + ". They'll be told when it's in the library.</p>" : "") +
      '<div class="form">' +
      '<label class="wide">Name<input id="it-n" maxlength="100" value="' + esc(v.n) + '" placeholder="For example: Hot glue gun"></label>' +
      "<label>Kind" + sel("it-k", [["tool", "Tool (borrow it)"], ["machine", "Machine (book a time)"], ["material", "Material (used up)"]], v.k) + "</label>" +
      "<label>Category" + sel("it-c", Object.keys(T.CATS).map(function (k) { return [k, T.CATS[k][1] + " " + T.CATS[k][0]]; }), v.c) + "</label>" +
      "<label>Who can use it" + sel("it-a", Object.keys(T.ACCESS).map(function (k) { return [k, T.ACCESS[k][0]]; }), v.a) + "</label>" +
      "<label>Grades" + sel("it-b", [["K–1", "Every grade"], ["2–4", "2nd grade and up"], ["5–8", "5th grade and up"]], v.b) + "</label>" +
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
    var c = val("it-c"), d = { n: n.slice(0, 100), c: c, k: val("it-k"), a: val("it-a"), b: val("it-b"), loan: val("it-loan"), e: val("it-e") || EMOJI[c] || "🧰", d: val("it-d").slice(0, 300), m: val("it-m").slice(0, 80), tip: val("it-tip").slice(0, 200), want: Math.max(0, Math.min(999, Math.round(Number(val("it-want")) || 0))), by: me(), at: Date.now() };
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
    try { await commit([{ path: "toolLoans/" + lid, data: { status: "cancelled", closed: Date.now() }, merge: true }]); l.status = "cancelled"; draw(); }
    catch (e) { alert(e.message); }
  }

  // ---------- Guides: the desk ----------
  function gtabs(v) {
    var req = S.loans.filter(function (l) { return l.status === "requested"; }).length, late = S.loans.filter(function (l) { return l.status === "out" && l.due < today(); }).length;
    var a = function (id, label, n) { return '<a href="#' + id + '"' + (v === id ? ' aria-current="page"' : "") + ">" + label + (n ? '<span class="n">' + n + "</span>" : "") + "</a>"; };
    return '<nav class="gtabs" aria-label="Tool Library">' + a("desk", "Desk", req + late) + a("catalog", "Catalog") + a("inventory", "Inventory") + a("badges", "Badges") + a("shop", "Shopping list") + "</nav>";
  }
  function deskSummary() {
    var out = S.loans.filter(function (l) { return l.status === "out"; }), late = out.filter(function (l) { return l.due < today(); });
    var counted = T.TOOLS.filter(function (t) { return (S.inv[t.id] || {}).counted; }).length;
    return '<div class="panel"><h2>Today</h2><p class="sub">' + S.loans.filter(function (l) { return l.status === "requested"; }).length + " asked for · " + out.length + " out · " + (late.length ? '<b style="color:var(--bad)">' + late.length + " late</b>" : "none late") + "</p>" +
      '<p class="sub">Inventory: ' + counted + " of " + T.TOOLS.length + ' items counted</p><div class="bar"><i style="width:' + Math.round(100 * counted / T.TOOLS.length) + '%"></i></div>' +
      '<p class="sub"><a href="#inventory">Count what we have</a> · <a href="#shop">What to buy</a>' + (S.loans.some(function (l) { return l.status === "wish"; }) ? ' · <b><a href="#shop">' + S.loans.filter(function (l) { return l.status === "wish"; }).length + " student requests</a></b>" : "") + '</p><button type="button" class="ghost sm" data-additem>Add a tool or material</button></div>';
  }
  var dueFor = function (t, l) { return l && l.kind === "book" && l.when ? l.when.split(" ")[0] : t && t.loan === "week" ? plusDays(7) : today(); };
  function loanRow(l, actions) {
    var t = byId[l.item] || { e: "🧰", n: l.n }, late = l.status === "out" && l.due < today();
    var kind = { borrow: "Borrow", book: "Booking", material: "Materials", badge: "Wants its badge", wish: "Asked us to get it", "new": "New request" + (l.amt === "material" ? " (material)" : "") }[l.kind] || "";
    return '<li class="' + (late ? "late" : "") + '"><span class="em">' + t.e + '</span><span class="t"><b>' + esc(l.name) + "</b> · " + esc(t.n || l.n) + "<small>" + esc(kind) + (l.when ? " · " + esc(whenTxt(l.when)) : "") + (l.amt && l.kind !== "new" ? " · " + esc(l.amt) : "") + (l.note ? " · “" + esc(l.note) + "”" : "") + (l.status === "out" ? " · " + (late ? "was due " : "due ") + esc(fmt(l.due)) : "") + "</small></span>" + actions + "</li>";
  }
  function desk() {
    var req = S.loans.filter(function (l) { return l.status === "requested"; }), wait = S.loans.filter(function (l) { return l.status === "waiting"; });
    var out = S.loans.filter(function (l) { return l.status === "out"; }).sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); });
    var give = function (l) {
      var t = byId[l.item];
      if (l.kind === "badge") return '<button class="ghost sm" data-badge-from="' + l.id + '">Taught: give badge</button><button class="ghost sm" data-decline="' + l.id + '">Not now</button>';
      if (l.kind === "material") return '<button class="ghost sm" data-given="' + l.id + '">Given</button><button class="ghost sm" data-decline="' + l.id + '">Not now</button>';
      return '<input type="date" value="' + dueFor(t, l) + '" id="due-' + l.id + '" aria-label="Due"><button class="ghost sm" data-hand="' + l.id + '">Hand it out</button><button class="ghost sm" data-decline="' + l.id + '">Not now</button>';
    };
    var back = function (l) { return '<select id="cond-' + l.id + '" aria-label="Condition"><option value="fine">Fine</option><option value="repair">Needs repair</option><option value="missing">Missing pieces</option></select><button class="ghost sm" data-back="' + l.id + '">Back</button>'; };
    var section = function (h, xs, act, empty) { return '<section class="panel"><h2>' + h + " (" + xs.length + ")</h2>" + (xs.length ? '<ul class="loans">' + xs.map(function (l) { return loanRow(l, act(l)); }).join("") + "</ul>" : '<p class="sub">' + empty + "</p>") + "</section>"; };
    var kidOpts = S.kids.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + " (" + esc(s.band) + ")</option>"; }).join("");
    var itemOpts = T.TOOLS.filter(function (t) { return t.k !== "material" && stock(t).have > 0; }).map(function (t) { return '<option value="' + t.id + '">' + esc(t.n) + "</option>"; }).join("");
    return (S.msg ? '<p class="note ok" role="status">' + esc(S.msg) + "</p>" : "") + '<div class="cols">' +
      section("Asked for", req, give, "No requests right now.") +
      section("Out now", out, back, "Nothing checked out.") +
      section("Waiting in line", wait, function (l) { return stock(byId[l.item] || {}).free > 0 ? give(l) : '<button class="ghost sm" data-decline="' + l.id + '">Remove</button>'; }, "Nobody in line.") +
      '<section class="panel"><h2>Check out to a student</h2><p class="sub">For a student who asked in person, or who doesn\'t sign in (K–1).</p><div class="act" style="display:grid;gap:8px"><select id="co-kid"><option value="">Student…</option>' + kidOpts + '</select><select id="co-item"><option value="">Tool…</option>' + itemOpts + '</select><input type="date" id="co-due" value="' + today() + '"><button class="go" data-checkout>Check it out</button></div>' +
      (itemOpts ? "" : '<p class="sub">Only tools with at least one counted in Inventory can be checked out.</p>') + "</section></div>";
  }
  async function hand(lid, btn) {
    var l = S.loans.find(function (x) { return x.id === lid; }), t = byId[l.item]; if (!l) return;
    var due = ($("#due-" + lid) || {}).value || dueFor(t, l), now = Date.now(), nm = myName();
    if (t && stock(t).free <= 0 && !confirm("The inventory says none are free. Hand it out anyway?")) return;
    btn.disabled = true;
    try {
      await commit([{ path: "toolLoans/" + lid, data: { status: "out", due: due, out: now, by: me(), byName: nm }, merge: true }, { path: "toolInventory/" + l.item, data: { updated: now }, merge: true, inc: { out: 1 } }]);
      Object.assign(l, { status: "out", due: due, out: now, by: me(), byName: nm }); bumpInv(l.item, 1);
      if (window.wlNotify && l.email) window.wlNotify([l.email], { kind: "tool", text: (l.kind === "book" ? "You're booked: " + l.n + " on " + fmt(due) : "You've got " + l.n + ". Bring it back by " + (due === today() ? "the end of today" : fmt(due))) + ".", link: "/tools/" });
      S.msg = l.n + " is checked out to " + l.name + "."; draw(); refreshTasks();
    } catch (e) { btn.disabled = false; alert(e.message); }
  }
  async function back(lid, btn) {
    var l = S.loans.find(function (x) { return x.id === lid; }); if (!l) return;
    var cond = ($("#cond-" + lid) || {}).value || "fine", gnote = cond === "fine" ? "" : (prompt(cond === "repair" ? "What needs fixing?" : "What's missing?") || "");
    btn.disabled = true;
    try {
      var now = Date.now(), inc = { out: -1 }; if (cond === "repair") inc.broken = 1;
      await commit([{ path: "toolLoans/" + lid, data: { status: "returned", back: now, cond: cond, gnote: gnote.slice(0, 200) }, merge: true }, { path: "toolInventory/" + l.item, data: { updated: now }, merge: true, inc: inc }]);
      Object.assign(l, { status: "returned", back: now, cond: cond }); bumpInv(l.item, -1); if (cond === "repair") { S.inv[l.item].broken = (S.inv[l.item].broken || 0) + 1; }
      S.msg = l.n + " is back" + (cond === "fine" ? "." : ", marked " + (cond === "repair" ? "needs repair" : "missing pieces") + "."); draw(); refreshTasks();
    } catch (e) { btn.disabled = false; alert(e.message); }
  }
  async function closeLoan(lid, status, btn) {
    var l = S.loans.find(function (x) { return x.id === lid; }); if (!l) return; btn.disabled = true; var was = l.status;
    try {
      await commit([{ path: "toolLoans/" + lid, data: { status: status, closed: Date.now(), by: me(), byName: myName() }, merge: true }]);
      l.status = status;
      if (status === "declined" && window.wlNotify && l.email) window.wlNotify([l.email], { kind: "tool", text: was === "wish" ? myName() + " says the library won't get " + l.n + " for now. Ask them about it." : myName() + " couldn't hand out " + l.n + " right now. Ask them about it.", link: "/tools/" });
      draw(); refreshTasks();
    } catch (e) { btn.disabled = false; alert(e.message); }
  }
  async function checkout(btn) {
    var sid = $("#co-kid").value, id = $("#co-item").value, due = $("#co-due").value || today();
    if (!sid || !id) { alert("Pick a student and a tool."); return; }
    var s = S.kids.find(function (k) { return k.id === sid; }), t = byId[id], now = Date.now(), lid = newId(), nm = myName();
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

  // ---------- Guides: badges ----------
  function badges() {
    var kids = S.kids.filter(function (s) { return S.band === "All" || s.band === S.band; });
    var bt = T.TOOLS.filter(function (t) { return t.a === "badge"; });
    var cur = S.kid && S.kids.find(function (k) { return k.id === S.kid; });
    var has = cur ? (S.badges[cur.id] || []) : [];
    var learners = S.loans.filter(function (l) { return l.kind === "badge" && l.status === "requested"; });
    return '<div class="cols"><section class="panel"><h2>Give a badge</h2><p class="sub">A badge means you taught the student this tool and watched them use it safely. With it, they can borrow the tool without asking each time.</p>' +
      '<div class="tg" style="margin-bottom:8px">' + ["All"].concat(BANDS).map(function (b) { return '<button data-band="' + b + '" class="' + (S.band === b ? "on" : "") + '">' + (b === "All" ? "All bands" : b) + "</button>"; }).join("") + "</div>" +
      '<select id="bk"><option value="">Pick a student…</option>' + kids.map(function (s) { return '<option value="' + esc(s.id) + '"' + (S.kid === s.id ? " selected" : "") + ">" + esc(s.name) + " (" + esc(s.band) + ") · " + (S.badges[s.id] || []).length + " badges</option>"; }).join("") + "</select>" +
      (cur ? '<div style="display:grid;gap:6px;margin-top:12px">' + bt.map(function (t) { var ok = bandOk(t, cur.band); return '<label style="display:flex;gap:8px;align-items:center;font-size:14px' + (ok ? "" : ";opacity:.5") + '"><input type="checkbox" data-bdg="' + t.id + '"' + (has.indexOf(t.id) >= 0 ? " checked" : "") + (ok ? "" : " disabled") + "> " + t.e + " " + esc(t.n) + (ok ? "" : " <small>(" + gradesFrom(t) + ")</small>") + "</label>"; }).join("") + '<button class="go" data-save-badges>Save ' + esc(first(cur.name)) + "'s badges</button></div>" : "") + "</section>" +
      '<section class="panel"><h2>Want to learn (' + learners.length + ")</h2>" + (learners.length ? '<ul class="loans">' + learners.map(function (l) { return loanRow(l, '<button class="ghost sm" data-badge-from="' + l.id + '">Taught: give badge</button>'); }).join("") + "</ul>" : '<p class="sub">No one is waiting to learn a tool.</p>') + "</section></div>";
  }
  async function saveBadges(sid, items, btn) {
    if (btn) btn.disabled = true;
    try { await commit([{ path: "toolBadges/" + sid, data: { items: items, by: me(), at: Date.now() } }]); S.badges[sid] = items; S.msg = "Badges saved."; draw(); }
    catch (e) { if (btn) btn.disabled = false; alert(e.message); }
  }
  async function badgeFrom(lid, btn) {
    var l = S.loans.find(function (x) { return x.id === lid; }); if (!l || !l.sid) { alert("This request has no student record to put the badge on."); return; }
    var items = (S.badges[l.sid] || []).slice(); if (items.indexOf(l.item) < 0) items.push(l.item);
    await saveBadges(l.sid, items, btn);
    await closeLoan(lid, "done", btn).catch(function () { });
    if (window.wlNotify && l.email) window.wlNotify([l.email], { kind: "tool", text: "You earned the " + l.n + " badge. You can borrow it now.", link: "/tools/" });
  }

  // ---------- Guides: shopping list ----------
  function shop() {
    var wishes = {}; S.loans.filter(function (l) { return l.status === "wish"; }).forEach(function (l) { (wishes[l.item] = wishes[l.item] || []).push(l); });
    var rows = T.TOOLS.map(function (t) { var s = stock(t), buy = t.k === "material" ? (s.stock === "low" || s.stock === "out" || (!s.have && !S.inv[t.id]) ? 1 : 0) : Math.max(0, t.want - s.have); return { t: t, s: s, buy: buy, w: wishes[t.id] || [] }; }).filter(function (r) { return r.buy > 0 || r.w.length; })
      .sort(function (a, b) { return b.w.length - a.w.length || Object.keys(T.CATS).indexOf(a.t.c) - Object.keys(T.CATS).indexOf(b.t.c); });
    var news = S.loans.filter(function (l) { return l.status === "wish" && l.item === "new"; });
    var text = news.map(function (l) { return "New request: " + l.n + " (from " + first(l.name) + ")"; }).concat(rows.map(function (r) { return (r.t.k === "material" ? "Restock: " : r.buy + " × ") + r.t.n + (r.w.length ? " (asked for by " + r.w.length + ")" : ""); })).join("\n");
    return '<section class="panel" style="margin:12px 0"><h2>What to buy</h2><p class="sub">Everything below what a school our size should have, by what we\'ve counted. Items students asked for come first. Count first (Inventory), so we don\'t buy what we already own.</p><button class="ghost" data-copy>Copy the list</button> <span class="note" id="copied"></span><textarea id="shoptext" hidden>' + esc(text) + "</textarea></section>" +
      '<section class="panel" style="margin:12px 0"><h2>New things students asked for (' + news.length + ')</h2>' + (news.length ? '<p class="sub">Not in the catalog yet. Add one to the catalog (with how many we have, if any) and the student is told when it\'s in.</p><ul class="loans">' + news.map(function (l) { return loanRow(l, '<button class="ghost sm" data-additem-from="' + l.id + '">Add to catalog</button><button class="ghost sm" data-decline="' + l.id + '">Not now</button>'); }).join("") + "</ul>" : '<p class="sub">None right now. Students ask from the Catalog with "Can\'t find it? Ask for it."</p>') + "</section>" +
      '<div class="tblw"><table class="tbl"><thead><tr><th>Item</th><th>Have</th><th>Aim for</th><th>Buy</th><th>Students asking</th></tr></thead><tbody>' + rows.map(function (r) {
        return "<tr><td>" + r.t.e + " " + esc(r.t.n) + "</td><td>" + (r.t.k === "material" ? esc({ ok: "In stock", low: "Low", out: "Out" }[r.s.stock] || "None") : r.s.have + (r.s.counted ? "" : " ?")) + "</td><td>" + (r.t.k === "material" ? "" : r.t.want) + "</td><td><b>" + (r.t.k === "material" ? "Restock" : r.buy) + "</b></td><td>" + (r.w.length ? r.w.map(function (l) { return esc(first(l.name)) + (l.note ? ": " + esc(l.note) : ""); }).join("; ") : "") + "</td></tr>";
      }).join("") + "</tbody></table></div><p class=\"note\">? means not counted yet.</p>";
  }

  // ---------- events ----------
  document.addEventListener("input", function (e) {
    if (e.target.id === "q") { S.q = e.target.value; var pos = e.target.selectionStart; draw(); var q = $("#q"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) { } } }
    var tr = e.target.closest && e.target.closest("tr[data-row]"); if (tr) { S.dirty[tr.dataset.row] = 1; tr.classList.add("dirty"); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id === "bk") { S.kid = e.target.value; draw(); }
    var tr = e.target.closest && e.target.closest("tr[data-row]"); if (tr) { S.dirty[tr.dataset.row] = 1; tr.classList.add("dirty"); }
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button,a"); if (!b) { if (e.target === $("#dd")) $("#dd").close(); return; }
    var d = b.dataset;
    if (d.cat) { S.cat = d.cat; draw(); return; }
    if (d.f !== undefined && b.closest(".tg") && !b.closest("tr")) { S.f = d.f; draw(); return; }
    if (d.band) { S.band = d.band; draw(); return; }
    if (d.open) { openItem(d.open); return; }
    if (d.close !== undefined) { $("#dd").close(); return; }
    if (d.ask) { ask(d.ask, d.id, b); return; }
    if (d.cancel) { cancel(d.cancel); return; }
    if (d.hand) { hand(d.hand, b); return; }
    if (d.back) { back(d.back, b); return; }
    if (d.given) { closeLoan(d.given, "done", b); return; }
    if (d.decline) { closeLoan(d.decline, "declined", b); return; }
    if (d.badgeFrom) { badgeFrom(d.badgeFrom, b); return; }
    if (d.checkout !== undefined) { checkout(b); return; }
    if (d.save) { saveRow(d.save, b); return; }
    if (d.saveBadges !== undefined) { var items = [].map.call(document.querySelectorAll("[data-bdg]:checked"), function (x) { return x.dataset.bdg; }); saveBadges(S.kid, items, b); return; }
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
