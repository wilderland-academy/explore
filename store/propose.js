// Camp Store (students): "Propose your own reward". A student describes something they'd love to earn that isn't in
// the store, what they'll do to earn it and a fair price in blazes. It goes to their band's Field Guide (/wlnav.js
// FIELD_GUIDES), the only guide who can approve it (/guides/roster/#rewards). Approved, it becomes a guide reward in
// this student's store (storeRewards, for them only); declined, the Field Guide says why.
// Firestore incentives/{id} = { email, sid, name, band, n, earn, why, b, status: pending|approved|declined, note,
//   decidedBy, decidedAt, rewardId, at, test? }. Rules (firestore.rules): a student creates and reads their own; only
//   the band's Field Guide decides.
(function () {
  var FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
  var box = document.getElementById("idea"); if (!box) return;
  var role = null, mine = [], formOpen = false, msg = "";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var user = function () { return window.wlFirebase && window.wlFirebase.auth.currentUser; };
  var tok = async function () { return user().getIdToken(); };
  var str = function (s) { return { stringValue: String(s == null ? "" : s) }; };
  var val = function (v) { return !v ? null : "stringValue" in v ? v.stringValue : "integerValue" in v ? Number(v.integerValue) : "booleanValue" in v ? v.booleanValue : null; };
  var isTest = function () { return !!(role && role.test); };
  var STATUS = { pending: ["Waiting for your Field Guide", "p"], approved: ["Approved: it's in your store", "a"], declined: ["Not this time", "d"] };
  async function load() {
    if (!role || role.role !== "student" || !user()) { box.hidden = true; return; }
    box.hidden = false;
    try {
      var eq = function (f, v) { return { fieldFilter: { field: { fieldPath: f }, op: "EQUAL", value: typeof v === "boolean" ? { booleanValue: v } : str(v) } }; };
      var where = isTest() ? { compositeFilter: { op: "AND", filters: [eq("email", role.email), eq("test", true)] } } : eq("email", String(role.email).toLowerCase());
      var r = await fetch(FS + ":runQuery", { method: "POST", headers: { Authorization: "Bearer " + await tok(), "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "incentives" }], where: where, limit: 50 } }) });
      if (!r.ok) throw new Error("ideas " + r.status);
      mine = (await r.json()).filter(function (x) { return x.document; }).map(function (x) { var f = x.document.fields || {}, o = { id: x.document.name.split("/").pop() }; Object.keys(f).forEach(function (k) { o[k] = val(f[k]); }); return o; })
        .filter(function (x) { return !!x.test === isTest(); }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    } catch (e) { mine = []; console.warn("Reward ideas:", e); }
    draw();
    if (/^#idea\b/.test(location.hash)) { box.scrollIntoView({ block: "center" }); seen(); }
  }
  function seen() { try { localStorage.setItem("wl-idea-seen", String(Date.now())); } catch (e) { } }
  function draw() {
    var pending = mine.filter(function (x) { return x.status === "pending"; });
    box.innerHTML = '<h3>💡 Your own reward idea</h3>' +
      (mine.length ? '<ul class="ideas">' + mine.slice(0, 6).map(function (x) {
        var s = STATUS[x.status] || STATUS.pending;
        return '<li><b>' + esc(x.n) + '</b> <span class="st ' + s[1] + '">' + esc(s[0]) + "</span><small>" + esc(x.b) + " blazes" + (x.note ? " · " + esc(x.note) : "") + "</small></li>";
      }).join("") + "</ul>" : '<p class="sm">Something you\'d love to earn that isn\'t in the store? Propose it. Your Field Guide decides, and if it\'s a yes it shows up here in your store.</p>') +
      (formOpen ? '<form class="ideaf" id="ideaf">' +
        '<label>What would you earn?<input name="n" maxlength="80" required placeholder="For example: a morning teaching the crew to juggle"></label>' +
        '<label>What will you do to earn it?<input name="earn" maxlength="200" required placeholder="For example: pass 2 challenges this month"></label>' +
        '<label>Why does it matter to you? (optional)<input name="why" maxlength="200"></label>' +
        '<label>A fair price in blazes<input name="b" type="number" min="1" max="2000" required inputmode="numeric" placeholder="For example: 60"></label>' +
        '<p class="sm">1 blaze is worth 50 cents. Your guide may change the price.</p>' +
        '<div class="r"><button type="submit" class="go">Send to my Field Guide</button><button type="button" data-idea-x>Cancel</button></div></form>'
        : pending.length >= 3 ? '<p class="sm">You have 3 ideas waiting. Wait for an answer before sending another.</p>' : '<button type="button" class="go" data-idea-open>+ Propose a reward</button>') +
      (msg ? '<p class="sm ok" role="status">' + esc(msg) + "</p>" : "");
  }
  box.addEventListener("click", function (e) {
    if (e.target.closest("[data-idea-open]")) { formOpen = true; msg = ""; draw(); var i = box.querySelector("input"); if (i) i.focus(); }
    if (e.target.closest("[data-idea-x]")) { formOpen = false; draw(); }
  });
  box.addEventListener("submit", async function (e) {
    e.preventDefault();
    var f = e.target, btn = f.querySelector("button[type=submit]"), d = Object.fromEntries(new FormData(f).entries());
    var b = Math.round(Number(d.b)); if (!(b >= 1 && b <= 2000)) { alert("Pick a price from 1 to 2000 blazes."); return; }
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      var name = isTest() ? "Test Student" : String(user().displayName || role.email.split("@")[0]);
      var fields = { email: str(String(role.email).toLowerCase()), sid: str(role.sid || ""), name: str(name.slice(0, 60)), band: str(role.band || ""), n: str(d.n.trim().slice(0, 80)),
        earn: str(d.earn.trim().slice(0, 200)), why: str((d.why || "").trim().slice(0, 200)), b: { integerValue: String(b) }, status: str("pending"), at: { integerValue: String(Date.now()) } };
      if (isTest()) fields.test = { booleanValue: true };
      var r = await fetch(FS + "/incentives", { method: "POST", headers: { Authorization: "Bearer " + await tok(), "Content-Type": "application/json" }, body: JSON.stringify({ fields: fields }) });
      if (!r.ok) throw new Error(r.status === 403 ? "not allowed yet" : "error " + r.status);
      // Tell the Field Guide (the bell), with a link to where they decide.
      var P = window.WLPeople || { FIELD_GUIDES: [], STAFF_BANDS: {}, TEST: {} };
      var fg = isTest() ? P.TEST.guide : P.FIELD_GUIDES.filter(function (e) { return P.STAFF_BANDS[e] === role.band; })[0];
      if (fg && window.wlNotify) window.wlNotify([fg], { kind: "idea", text: name.split(" ")[0] + " proposed a reward: “" + d.n.trim().slice(0, 80) + "” for " + b + " blazes", link: "/guides/roster/#rewards" });
      formOpen = false; msg = "Sent. Your Field Guide will decide."; await load();
      if (window.wlTasks) window.wlTasks.refresh();
    } catch (x) { btn.disabled = false; btn.textContent = "Send to my Field Guide"; alert("Couldn't send it (" + x.message + "). Try again in a minute."); }
  });
  document.addEventListener("wl-role", function (e) { role = e.detail; load(); });
  if (window.wlRole) { role = window.wlRole; load(); }
  addEventListener("hashchange", function () { if (/^#idea\b/.test(location.hash)) { box.scrollIntoView({ block: "center" }); seen(); } });
})();
