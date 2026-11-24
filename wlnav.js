// Wilderland Explore: the one top bar for every page, defined in one place so all four sites look and work the same.
// Put this at the very top of <body>:
//   <div class="wlbar" data-wlnav="students" data-current="books"></div><script src="/wlnav.js"></script>
// data-wlnav: home | students | guides | parents. data-current: the tab id below for this page (or nothing).
// data-auth="off" leaves out the sign-in slot (pages with their own account menu, like the Life Skills tracker, and the Parents pages).
// Signed-in staff get a site switcher on the site name (Students / Guides / Parents); parents get Parents / Students.
// The logo and the site's name go to the current site's own home page. Links that leave Explore (Basecamp) get an arrow and open a new tab.
// Styles are in /wl.css. A plain script (not a module) so the bar is drawn before the page paints.
// Who's who, kept here so every page can use it (keep in step with auth.js, lifeskills/app.js, relay/worker.js and firestore.rules):
//   STAFF_BANDS: the grade band each guide works with. Every page with a K–1 / 2–4 / 5–8 choice starts on the visitor's own
//     band (guides from this list, students from their tracker record, parents from their children). Admins and guests
//     without a band start on "All" where a page has it, otherwise 5–8. window.wlBand({ all: true }) gives that default.
//   TESTERS: who may switch to the test guide, test student and test parent ("Test view" in the bar). The three test
//     accounts are linked to each other (the test student's guide and parent), and are hidden from everyone else.
(function () {
  var TESTERS = ["alex@wilderland.academy", "shanan@wilderland.academy", "sarah@wilderland.academy", "courtney@wilderland.academy",
    "ian@silverlineventures.com", "online@bodyform.com", "ian.silverberg@gmail.com"];
  var STAFF_BANDS = { "chelse@wilderland.academy": "K–1", "jessica@wilderland.academy": "K–1", "shanan@wilderland.academy": "2–4",
    "april@wilderland.academy": "2–4", "scott@wilderland.academy": "5–8", "sarah@wilderland.academy": "5–8" };
  var TEST = { sid: "test-student", name: "Test Student", student: "test.student@wilderland.academy", guide: "test.guide@wilderland.academy", parent: "test.parent@example.com" };
  window.WLPeople = { TESTERS: TESTERS, STAFF_BANDS: STAFF_BANDS, TEST: TEST, BANDS: ["K–1", "2–4", "5–8"] };
  // The visitor's role as last told by /auth.js or the tracker (or remembered on this device).
  function curRole() {
    if (window.wlRole) return { role: window.wlRole.role, band: window.wlRole.band || null, test: window.wlRole.test || null };
    try { var c = JSON.parse(localStorage.getItem("wl-role") || "null"); if (c) return { role: c.r, band: c.b || null, test: c.t || null }; } catch (e) { }
    return null;
  }
  // The band a page should start on. opts.all: the page has an "All" choice.
  window.wlBand = function (opts) {
    var r = curRole(), b = r && r.band;
    if (b && window.WLPeople.BANDS.indexOf(b) >= 0) return b;
    return opts && opts.all ? "All" : "5–8";
  };
  // Test view: what a tester has switched to on this device ({ as: "guide" | "student" | "parent", band, by }).
  window.wlViewAs = function () { try { var v = JSON.parse(localStorage.getItem("wl-viewas") || "null"); return v && v.as && v.by ? v : null; } catch (e) { return null; } };
})();
(function () {
  var BASECAMP = { id: "basecamp", label: "Basecamp", href: "https://my.wilderland.academy/", out: true };
  var SITES = {
    home: { name: "Wilderland Explore", home: "/", label: "", tabs: [] },
    students: { name: "Students", home: "/students/", label: "Students", tabs: [
      { id: "books", label: "Books", href: "/books/" },
      { id: "challenges", label: "Challenges", href: "/challenges/" },
      { id: "projects", label: "Projects", href: "/projects/" },
      { id: "coach", label: "Mr. Fox", href: "/coach/" },
      { id: "store", label: "Store", href: "/store/" },
      { id: "suggest", label: "Ideas", href: "/suggest/" },
      BASECAMP] },
    guides: { name: "Guides", home: "/guides/", label: "Guides", tabs: [
      // The one-way onboarding journey through everything below (/guides/onboarding/).
      { id: "onboarding", label: "Onboarding", href: "/guides/onboarding/" },
      { id: "mentor", label: "Mentor Mindset", href: "/fieldguide/" },
      // Recording and reviewing 1:1 coaching sessions: a stop inside the Field Guide, with its own tab so it's one click away.
      { id: "sessions", label: "Session Room", href: "/fieldguide/#sessions" },
      { id: "behavior", label: "Behavior", href: "/behavior/" },
      // Challenges, the Labs schedule and the Lab builder live inside Life Skills (its sub-menu: /lifeskills/subnav.js).
      { id: "lifeskills", label: "Life Skills", href: "/guides/lifeskills/" },
      { id: "roster", label: "Student Roster", href: "/guides/roster/" },
      { id: "parentcomms", label: "Parent Comms", href: "/guides/parents/" },
      // The Staff Handbook and every other staff policy and form (/guides/policies/, /guides/handbook/).
      { id: "policies", label: "Policies", href: "/guides/policies/" },
      BASECAMP] },
    parents: { name: "Parents", home: "/parents/", label: "Parents", tabs: [
      { id: "athome", label: "At Home", href: "/parents/athome/" },
      { id: "approach", label: "Our Approach", href: "/parents/approach/" },
      { id: "fieldnotes", label: "Field Notes", href: "/parents/series/" },
      // Challenges and the Labs schedule are inside Life Skills.
      { id: "lifeskills", label: "Life Skills", href: "/parents/lifeskills/" },
      BASECAMP] }
  };
  // "wlbar-logo", not the old "wlbar-mark": an old cached wl.css hid .wlbar-mark on desktop.
  var MARK = '<svg class="wlbar-logo" viewBox="1000 490 1880 640" aria-hidden="true"><path d="M1655.83 862.635L1420.76 517L1023 1103.58H1458.91L1655.83 862.635Z" fill="white"/><path d="M2851.08 1104.71L2453.14 517.773L2055.38 1104.35L2851.08 1104.71Z" fill="#D5F367"/><path d="M2124.74 867.294L1936.99 637.184L1555.82 1104.3H1964.82L2124.74 867.294Z" fill="#00B451"/></svg>';
  var ARROW = '<svg class="wlbar-out" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2h6v6M10 2 3 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  var bar = (document.currentScript && document.currentScript.previousElementSibling && document.currentScript.previousElementSibling.matches("[data-wlnav]"))
    ? document.currentScript.previousElementSibling : document.querySelector("[data-wlnav]:not([data-wlnav-done])");
  if (!bar) return;
  var key = SITES[bar.getAttribute("data-wlnav")] ? bar.getAttribute("data-wlnav") : "home";
  var site = SITES[key];

  // ---------- Sign-in gate ----------
  // explore.wilderland.academy/ is the sign-in page. The Students, Guides and Parents sites open only for a signed-in
  // account with a role (from /auth.js or the Life Skills tracker's "wl-role" event). Signed-out visitors are sent to
  // the sign-in page, which brings them back here afterwards (?next=), or to their own site if this one isn't theirs.
  // The tracker pages are left open: they show their own sign-in (the only place parents with an email-and-password
  // account can sign in) and check access themselves. While a first visit waits to hear who this is, the page stays
  // hidden. A role remembered on this device (cleared on sign-out) shows the page at once and is checked right after.
  // This only steers the screen. These files are public; what's private is protected by the Firestore rules and the relay.
  var TRACKER = /^\/(guides\/|parents\/)?lifeskills\/$/.test(location.pathname);
  var GATED = key !== "home" && !TRACKER;
  function signInUrl() { return "/?next=" + encodeURIComponent(location.pathname + location.search + location.hash); }
  function ungate() { document.documentElement.classList.remove("wl-gate"); var m = document.querySelector(".wl-gatemsg"); if (m) m.remove(); }
  var known = null; try { known = JSON.parse(localStorage.getItem("wl-role") || "null"); } catch (e) { }
  if (GATED && !(known && known.r)) {
    document.documentElement.classList.add("wl-gate");
    var gs = document.createElement("style");
    gs.textContent = "html.wl-gate body{visibility:hidden}html.wl-gate .wl-gatemsg{visibility:visible}.wl-gatemsg{position:fixed;inset:0;display:grid;place-items:center;text-align:center;padding:24px;font:500 16px/1.5 Inter,system-ui,sans-serif;color:#7f978b;background:#f5f1ea;z-index:90}.wl-gatemsg a{color:#01412f;font-weight:600}";
    document.head.appendChild(gs);
    var gm = document.createElement("div"); gm.className = "wl-gatemsg"; gm.setAttribute("role", "status"); gm.textContent = "Checking your sign-in…";
    document.body.appendChild(gm);
    setTimeout(function () { if (document.documentElement.classList.contains("wl-gate")) gm.innerHTML = 'Still checking your sign-in. <a href="' + signInUrl() + '">Go to the sign-in page</a> or reload.'; }, 10000);
  }
  // Where the sign-in page sends someone: back to ?next= if it's on their own sites, otherwise their site's home.
  function homeDest(r) {
    var m = /[?&]next=([^&#]*)/.exec(location.search), n = "";
    try { n = m ? decodeURIComponent(m[1]) : ""; } catch (e) { n = ""; }
    if (!/^\/(?![\/\\])/.test(n) || /^\/(\?|#|$)/.test(n)) n = "";
    var STU = /^\/(students|books|challenges|projects|coach|store|suggest|lifeskills)\//, PAR = /^\/(parents\/|challenges\/parents\.html)/;
    if (r.role === "student") return n && STU.test(n) && !PAR.test(n) ? n : "/students/";
    if (r.role === "parent") return n && (PAR.test(n) || STU.test(n)) ? n : "/parents/";
    return n || "/guides/";
  }
  // The current tab. The Session Room is a view of the Field Guide (/fieldguide/#sessions), so it follows the address.
  function curTab() {
    var c = bar.getAttribute("data-current") || "";
    return c === "mentor" && /^#sessions\b/.test(location.hash) ? "sessions" : c;
  }
  var cur = curTab();
  var tabs = site.tabs.map(function (t) {
    if (t.out) return '<a class="wlbar-ext" href="' + t.href + '" target="_blank" rel="noopener" aria-label="' + esc(t.label) + ' (opens in a new tab)">' + esc(t.label) + ARROW + "</a>";
    return '<a href="' + t.href + '" data-wl-tab="' + t.id + '"' + (t.id === cur ? ' aria-current="page"' : "") + (t.id === "roster" ? ' data-wl-alerts' : "") + ">" + esc(t.label) + "</a>";
  }).join("");
  addEventListener("hashchange", function () {
    var c = curTab(); if (c === cur) return; cur = c;
    bar.querySelectorAll("[data-wl-tab]").forEach(function (a) { if (a.getAttribute("data-wl-tab") === cur) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  });

  // Who may switch to which site. Staff (and team guests) see all three; parents see theirs and the students' site;
  // students and signed-out visitors get no switcher. Roles come from /auth.js or the Life Skills tracker as a
  // "wl-role" event: { role: "staff" | "student" | "parent" | null, band: "K–1" | "2–4" | "5–8" | null }.
  // This only steers the screen. What is private (records, coaching history) is protected by the Firestore rules.
  var SWITCH = { staff: ["students", "guides", "parents"], parent: ["parents", "students"] };
  var MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var CARET = '<svg class="wlbar-caret" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var role = null;

  function draw() {
    var opts = (role && SWITCH[role.role]) || null;
    var label = site.label || (opts ? "Explore" : "");
    var home = '<a class="wlbar-home" href="' + site.home + '" aria-label="' + esc(site.name) + ' home">' + MARK +
      (label && !opts ? '<span class="wlbar-site">' + esc(label) + "</span>" : "") + "</a>";
    var sw = "";
    if (opts) {
      sw = '<div class="wlbar-switch"><button type="button" class="wlbar-site" aria-haspopup="true" aria-expanded="false" title="Switch site">' + esc(label) + CARET + "</button>" +
        '<div class="wlbar-menu" hidden><p>Switch to</p>' + opts.map(function (k) {
          return '<a href="' + SITES[k].home + '"' + (k === key ? ' aria-current="true"' : "") + ">" + esc(SITES[k].label) + "</a>";
        }).join("") + "</div></div>";
    }
    var auth = bar.querySelector(".wlbar-auth");
    bar.innerHTML = '<div class="wlbar-in">' + home + sw +
      (tabs ? '<nav class="wlbar-sites" aria-label="' + esc(site.name) + '">' + tabs + "</nav>" +
        // Tabs that don't fit on this screen fold into "More" (fit() below). Never the current page's tab.
        '<div class="wlbar-more" hidden><button type="button" aria-haspopup="true" aria-expanded="false">More' + CARET + '</button><div class="wlbar-menu" hidden></div></div>' : "") +
      // Search (⌘K / Ctrl+K, or "/"), for everyone: /search.js, loaded on first use.
      '<button type="button" class="wlbar-search" data-wl-search aria-label="Search (' + (MAC ? "⌘K" : "Ctrl+K") + ')" title="Search (' + (MAC ? "⌘K" : "Ctrl+K") + ')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="wlbar-search-t">Search</span><kbd>' + (MAC ? "⌘K" : "Ctrl K") + "</kbd></button>" +
      // Trail Partner (🐲) is one click away on every staff page.
      (key === "guides" ? '<button type="button" class="wlbar-mentor" data-wl-mentor aria-label="Open Trail Partner" title="Trail Partner: ask anything about your work"><span aria-hidden="true">🐲</span><span class="wlbar-mentor-t">Trail Partner</span></button>' : "") +
      // Test view lives in the account menu. Only pages with no account menu (the Parents pages, the front door) show
      // it on its own.
      (tester && !hasPill() ? '<div class="wlbar-test"><button type="button" class="wlbar-testbtn' + (view ? " on" : "") + '" aria-haspopup="true" aria-expanded="false" title="See the site as a test guide, student or parent"><span aria-hidden="true">🧪</span><span class="wlbar-test-t">' + (view ? "Test " + view.as : "Test view") + "</span></button>" + '<div class="wlbar-menu wlbar-testmenu" hidden>' + testMenu() + "</div></div>" : "") +
      (bar.getAttribute("data-auth") === "off" ? "" : '<span class="wlbar-auth" data-wl-auth></span>') +
      // Phones: the site's sections are in this menu instead of a row that scrolls sideways.
      (tabs ? '<button type="button" class="wlbar-burger" aria-haspopup="true" aria-expanded="false" aria-controls="wlbar-drawer" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' : "") +
      "</div>" + (tabs ? '<nav class="wlbar-drawer" id="wlbar-drawer" aria-label="' + esc(site.name) + ' menu" hidden>' + drawer(opts) + "</nav>" : "") + banner();
    // Keep the sign-in chip if it was already mounted.
    var slot = bar.querySelector(".wlbar-auth");
    if (auth && slot) slot.parentNode.replaceChild(auth, slot);
    fit();
  }
  // ---------- Tabs that don't fit go in "More" ----------
  // On laptop widths a site can have more tabs than room (the Guides site, with search, Trail Partner and the account
  // chip beside them). Rather than cutting the last tabs off, they move into a "More" menu, from the end, keeping the
  // current page's tab in the row. Phones use the ☰ menu instead.
  function fit() {
    var nav = bar.querySelector(".wlbar-sites"), more = bar.querySelector(".wlbar-more");
    if (!nav || !more) return;
    if (ro) ro.observe(nav);
    var links = Array.prototype.slice.call(nav.children);
    links.forEach(function (a) { a.hidden = false; });
    more.hidden = true; more.querySelector(".wlbar-menu").hidden = true; more.querySelector("button").setAttribute("aria-expanded", "false");
    if (!nav.clientWidth || nav.scrollWidth <= nav.clientWidth + 1) return;
    more.hidden = false;
    var gone = [];
    for (var i = links.length - 1; i >= 0 && nav.scrollWidth > nav.clientWidth + 1; i--) {
      if (links[i].getAttribute("aria-current")) continue;
      links[i].hidden = true; gone.unshift(links[i]);
    }
    more.querySelector(".wlbar-menu").innerHTML = gone.map(function (a) {
      var c = a.cloneNode(true); c.hidden = false; c.removeAttribute("aria-current"); return c.outerHTML;
    }).join("");
  }
  var fitPend = false;
  addEventListener("resize", function () { if (fitPend) return; fitPend = true; requestAnimationFrame(function () { fitPend = false; fit(); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  // The sign-in chip arrives after the bar is drawn and takes room from the tabs: fit again when their row changes size.
  var ro = window.ResizeObserver ? new ResizeObserver(function () { if (fitPend) return; fitPend = true; requestAnimationFrame(function () { fitPend = false; fit(); }); }) : null;
  bar.addEventListener("click", function (e) {
    var b = e.target.closest(".wlbar-more > button"); if (!b) return;
    var m = b.nextElementSibling, open = m.hidden; m.hidden = !open; b.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", function (e) {
    var mo = bar.querySelector(".wlbar-more");
    if (mo && !mo.contains(e.target)) { mo.querySelector(".wlbar-menu").hidden = true; mo.querySelector("button").setAttribute("aria-expanded", "false"); }
  });
  // ---------- Test view (testers only) ----------
  // A tester can see the site as the test guide, test student or test parent. It's remembered on this device until they
  // switch back. The pages read it through /auth.js (and the tracker), which only honour it for the tester who set it.
  var P = window.WLPeople, tester = false, view = null;
  var AS = { guide: ["Test guide", "/guides/"], student: ["Test student", "/students/"], parent: ["Test parent", "/parents/"] };
  function testerOf(r) { return r && P.TESTERS.indexOf(String(r.real || r.email || "").toLowerCase()) >= 0; }
  // The test choices, for the account menu (/auth.js and the Life Skills tracker put this in theirs) or the standalone
  // button. Clicks are handled for the whole page below, wherever the menu is.
  function testMenu() {
    var band = (view && view.band) || "2–4";
    return '<div class="wl-testsec"><p>🧪 See the site as</p>' +
      '<a href="#" data-wl-as=""' + (!view ? ' aria-current="true"' : "") + ">Myself</a>" +
      ["guide", "student", "parent"].map(function (k) { return '<a href="#" data-wl-as="' + k + '"' + (view && view.as === k ? ' aria-current="true"' : "") + ">" + AS[k][0] + "</a>"; }).join("") +
      '<p>Test accounts\' band</p><div class="wlbar-testbands">' + P.BANDS.map(function (b) { return '<button type="button" data-wl-asband="' + b + '" aria-pressed="' + (b === band) + '">' + b + "</button>"; }).join("") + "</div>" +
      '<p class="wlbar-testnote">The test guide, student and parent are linked to each other. Only testers can see them.</p></div>';
  }
  window.WLTest = { on: function () { return tester; }, html: testMenu };
  // Pages with their own account menu: the sign-in chip (/auth.js), or the Life Skills tracker's (#acct).
  function hasPill() { return bar.getAttribute("data-auth") !== "off" || !!document.getElementById("acct") || /\/lifeskills\/$/.test(location.pathname); }
  // The phone menu: this site's sections, then the other sites this person may open, then Basecamp.
  function drawer(opts) {
    return '<div class="wlbar-drawer-in">' + site.tabs.filter(function (t) { return !t.out; }).map(function (t) {
      return '<a href="' + t.href + '" data-wl-tab="' + t.id + '"' + (t.id === cur ? ' aria-current="page"' : "") + (t.id === "roster" ? " data-wl-alerts" : "") + ">" + esc(t.label) + "</a>";
    }).join("") +
      (opts ? '<p>Switch to</p><div class="wlbar-drawer-sites">' + opts.filter(function (k) { return k !== key; }).map(function (k) { return '<a href="' + SITES[k].home + '">' + esc(SITES[k].label) + "</a>"; }).join("") + "</div>" : "") +
      '<a class="wlbar-ext" href="' + BASECAMP.href + '" target="_blank" rel="noopener">' + BASECAMP.label + ARROW + "</a></div>";
  }
  function banner() {
    if (!view) return "";
    var who = AS[view.as] ? AS[view.as][0] : "Test";
    return '<div class="wlbar-banner" role="status"><span>🧪 You\'re seeing the site as the <b>' + esc(who.toLowerCase()) + "</b> (grades " + esc(view.band || "2–4") + ")." + (view.as === "guide" ? " Life Skills, the Student Roster and the Session room show this band's real students, as its guide would see them. Real student records and Labs are read-only; Session room notes go to your own private notebook. Behavior is the real tool." : " What you do here only touches the test accounts.") + '</span><button type="button" data-wl-as="">Back to my account</button></div>';
  }
  var KEYS = ["lantern-stacks", "wl-picks", "wl-band", "atlas-sparks", "atlas-me", "wl-store", "wl-role"];
  function switchTo(as, band) {
    var by = "";
    try { var c = JSON.parse(localStorage.getItem("wl-role") || "null"); by = c && (c.x || c.e) || ""; } catch (e) { }
    if (view && view.by) by = view.by;
    try {
      // Like signing out and in: nothing saved on this device by one identity is shown to the other.
      KEYS.forEach(function (k) { localStorage.removeItem(k); });
      Object.keys(localStorage).filter(function (k) { return k.indexOf("wl-linked-") === 0; }).forEach(function (k) { localStorage.removeItem(k); });
      if (as) localStorage.setItem("wl-viewas", JSON.stringify({ as: as, band: band || "2–4", by: by }));
      else localStorage.removeItem("wl-viewas");
      sessionStorage.removeItem("wl-test-ready");
    } catch (e) { }
    location.href = as ? AS[as][1] : (/^\/(students|parents)\//.test(location.pathname) ? "/guides/" : location.pathname + location.search);
  }
  bar.addEventListener("click", function (e) {
    var t = e.target.closest(".wlbar-testbtn");
    if (t) { var m = t.nextElementSibling, o = m.hidden; m.hidden = !o; t.setAttribute("aria-expanded", String(o)); return; }
    var g = e.target.closest(".wlbar-burger");
    if (g) { var d = bar.querySelector(".wlbar-drawer"), op = d.hidden; d.hidden = !op; g.setAttribute("aria-expanded", String(op)); return; }
  });
  // Test choices, wherever they are on the page (account menu, standalone button, the banner).
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-wl-as]");
    if (a) { e.preventDefault(); var box = a.closest(".wl-testsec") || document, cur = box.querySelector("[data-wl-asband][aria-pressed=true]"); switchTo(a.getAttribute("data-wl-as"), cur ? cur.getAttribute("data-wl-asband") : (view && view.band)); return; }
    var b = e.target.closest && e.target.closest("[data-wl-asband]");
    if (b) {
      e.preventDefault(); e.stopPropagation();
      (b.closest(".wl-testsec") || document).querySelectorAll("[data-wl-asband]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      // Already in a test view: switching the band reloads that view in the new band.
      if (view) switchTo(view.as, b.getAttribute("data-wl-asband"));
    }
  }, true);
  document.addEventListener("click", function (e) {
    var w = bar.querySelector(".wlbar-test");
    if (w && !w.contains(e.target)) { w.querySelector(".wlbar-menu").hidden = true; w.querySelector("button").setAttribute("aria-expanded", "false"); }
    var d = bar.querySelector(".wlbar-drawer");
    if (d && !d.hidden && !d.contains(e.target) && !e.target.closest(".wlbar-burger")) { d.hidden = true; bar.querySelector(".wlbar-burger").setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var d = bar.querySelector(".wlbar-drawer"); if (!d || d.hidden) return;
    d.hidden = true; var g = bar.querySelector(".wlbar-burger"); g.setAttribute("aria-expanded", "false"); g.focus();
  });

  // ---------- Section menus inside pages, on phones ----------
  // A page's own row of sections (the Life Skills menu, Mentor Mindset and Behavior stops, Our Approach and At Home
  // sections) becomes one "Section ▾" button on phones that opens the list. Wide screens are unchanged.
  var NAVS = ".trail nav, .nav-links, [data-ls-subnav]";
  function collapse(nav) {
    if (nav.dataset.wlCollapse) return; nav.dataset.wlCollapse = "1";
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "wl-secbtn"; btn.setAttribute("aria-expanded", "false");
    nav.parentNode.insertBefore(btn, nav);
    nav.classList.add("wl-collapsible");
    var label = function () {
      var c = nav.querySelector('[aria-current="page"],[aria-current="location"],[aria-current="true"]');
      var t = (c ? c.textContent : (nav.getAttribute("aria-label") || "Sections")).trim();
      btn.innerHTML = '<span class="wl-secbtn-k">' + esc(nav.getAttribute("aria-label") || "Sections") + '</span><span class="wl-secbtn-t">' + esc(t) + "</span>" + CARET;
      btn.hidden = !nav.querySelector("a,button");
    };
    var set = function (open) { nav.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); };
    btn.addEventListener("click", function () { set(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    new MutationObserver(label).observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-current"] });
    label();
  }
  function collapseAll() { document.querySelectorAll(NAVS).forEach(collapse); side(); }
  // ---------- Section menus on the left, on wide screens ----------
  // A page whose section row is <div class="trail wlside"> followed by its <main> (Mentor Mindset, Behavior, At Home,
  // Our Approach) gets the sections as a menu down the left side; the page itself sits beside it. Layout is in /wl.css
  // (.wlside-wrap); between phone and wide widths the row stays as it was, and phones keep the "Section ▾" button.
  function side() {
    document.querySelectorAll(".trail.wlside").forEach(function (t) {
      if (t.parentNode.classList.contains("wlside-wrap")) return;
      var m = t.nextElementSibling;
      while (m && m.tagName === "SCRIPT") m = m.nextElementSibling;
      if (!m || m.tagName !== "MAIN") return;
      var w = document.createElement("div"); w.className = "wlside-wrap";
      t.parentNode.insertBefore(w, t); w.appendChild(t); w.appendChild(m);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", collapseAll); else collapseAll();
  // Pages that draw their section menu later.
  var pend = false;
  new MutationObserver(function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; collapseAll(); }); }).observe(document.documentElement, { childList: true, subtree: true });

  // Search: ⌘K / Ctrl+K anywhere, "/" when not typing, or the button.
  window.wlOpenSearch = function () { return import("/search.js").then(function (m) { m.open(); }); };
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-wl-search]")) { e.preventDefault(); window.wlOpenSearch(); } });
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase(), t = e.target, typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
    if ((k === "k" && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) || (k === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey)) { e.preventDefault(); window.wlOpenSearch(); }
  });

  // Trail Partner lives in /guides/mentor/mentor.js, loaded on first use.
  window.wlOpenMentor = function (opts) { return import("/guides/mentor/mentor.js").then(function (m) { return opts ? m.open(opts) : m.toggle(); }); };
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-wl-mentor]")) { e.preventDefault(); window.wlOpenMentor(); } });
  bar.addEventListener("click", function (e) {
    var b = e.target.closest(".wlbar-switch > button"); if (!b) return;
    var m = b.nextElementSibling, open = m.hidden;
    m.hidden = !open; b.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", function (e) {
    var sw = bar.querySelector(".wlbar-switch");
    if (sw && !sw.contains(e.target)) { sw.querySelector(".wlbar-menu").hidden = true; sw.querySelector("button").setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var sw = bar.querySelector(".wlbar-switch"); if (!sw || sw.querySelector(".wlbar-menu").hidden) return;
    sw.querySelector(".wlbar-menu").hidden = true; var b = sw.querySelector("button"); b.setAttribute("aria-expanded", "false"); b.focus();
  });

  // Where each role may be. Students: only the Students site. Parents: Parents and Students.
  function allowed(r) {
    if (!r || r.role === "staff") return null;
    // Keep people on the same kind of page where there is one: the tracker, or the challenge map.
    var m = /^\/(?:guides|parents)\/(lifeskills|challenges)\//.exec(location.pathname), page = m && m[1];
    if (r.role === "student" && key !== "students") return page === "lifeskills" ? "/challenges/#progress" : page === "challenges" ? "/challenges/" : "/students/";
    if (r.role === "parent" && (key === "guides" || key === "home")) return page ? "/parents/" + page + "/" : "/parents/";
    return null;
  }
  function apply(r) {
    r = r && r.role ? r : null;
    if (key === "home" && r) { location.replace(homeDest(r)); return; }
    if (GATED && !r) { location.replace(signInUrl()); return; }
    var go = allowed(r);
    if (go && location.pathname !== go.split("#")[0]) { location.replace(go); return; }
    ungate();
    var was = JSON.stringify([role, tester, view]); role = r;
    tester = testerOf(r); view = r && r.test ? { as: r.test, band: r.band, by: r.real } : null;
    if (JSON.stringify([role, tester, view]) !== was) { draw(); paintAlerts(); }
  }
  // Draw at once. A role remembered on this device (written only by /auth.js and the tracker, cleared on sign-out)
  // shows the switcher without a flicker; it never moves anyone until the signed-in account confirms it.
  try {
    var c = JSON.parse(localStorage.getItem("wl-role") || "null");
    if (c && SWITCH[c.r]) role = { role: c.r, band: c.b || null };
    if (c) { tester = P.TESTERS.indexOf(String(c.x || c.e || "").toLowerCase()) >= 0; view = c.t ? { as: c.t, band: c.b, by: c.x } : null; }
  } catch (e) { }
  draw();
  bar.setAttribute("data-wlnav-done", "");
  document.addEventListener("wl-role", function (e) { apply(e.detail); });
  // Open Mr. Fox alerts, shown as a count on the Guides "Student Roster" tab (sent by /auth.js and /guides/roster/).
  var alerts = null;
  function paintAlerts() {
    var a = bar.querySelector("[data-wl-alerts]"); if (!a) return;
    var old = a.querySelector(".wlbar-badge"); if (old) old.remove();
    if (!alerts || !alerts.open) { a.removeAttribute("title"); return; }
    var b = document.createElement("span"); b.className = "wlbar-badge" + (alerts.urgent ? " urgent" : "");
    b.textContent = alerts.open > 99 ? "99+" : String(alerts.open);
    a.appendChild(b); a.title = alerts.open + " open Mr. Fox alert" + (alerts.open === 1 ? "" : "s") + (alerts.urgent ? ", " + alerts.urgent + " urgent" : "");
  }
  document.addEventListener("wl-alerts", function (e) { alerts = e.detail; paintAlerts(); });
  if (window.wlRole !== undefined) apply(window.wlRole);
})();
