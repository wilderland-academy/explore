// Wilderland Explore: the one top bar for every page, defined in one place so all four sites look and work the same.
// Put this at the very top of <body>:
//   <div class="wlbar" data-wlnav="students" data-current="books"></div><script src="/wlnav.js"></script>
// data-wlnav: home | students | guides | parents. data-current: the tab id below for this page (or nothing).
// data-auth="off" leaves out the sign-in slot (pages with their own account menu, like the Life Skills tracker, and the Parents pages).
// Signed-in staff get a site switcher on the site name (Students / Guides / Parents); parents get Parents / Students.
// The logo and the site's name go to the current site's own home page. Links that leave Explore (Basecamp) get an arrow and open a new tab.
// Styles are in /wl.css. A plain script (not a module) so the bar is drawn before the page paints.
(function () {
  var BASECAMP = { id: "basecamp", label: "Basecamp", href: "https://my.wilderland.academy/", out: true };
  var SITES = {
    home: { name: "Wilderland Explore", home: "/", label: "", tabs: [] },
    students: { name: "Students", home: "/students/", label: "Students", tabs: [
      { id: "books", label: "Books", href: "/books/" },
      { id: "challenges", label: "Challenges", href: "/challenges/" },
      { id: "projects", label: "Projects", href: "/projects/" },
      { id: "coach", label: "AI Coach", href: "/coach/" },
      { id: "store", label: "Store", href: "/store/" },
      { id: "suggest", label: "Ideas", href: "/suggest/" },
      BASECAMP] },
    guides: { name: "Guides", home: "/guides/", label: "Guides", tabs: [
      { id: "mentor", label: "Mentor Mindset", href: "/fieldguide/" },
      { id: "behavior", label: "Behavior", href: "/behavior/" },
      { id: "lifeskills", label: "Life Skills", href: "/guides/lifeskills/" },
      { id: "challenges", label: "Challenges", href: "/guides/challenges/" },
      { id: "parentcomms", label: "Parent Comms", href: "/guides/parents/" },
      { id: "students", label: "Students", href: "/guides/students/" },
      BASECAMP] },
    parents: { name: "Parents", home: "/parents/", label: "Parents", tabs: [
      { id: "athome", label: "At Home", href: "/parents/athome/" },
      { id: "approach", label: "Our Approach", href: "/parents/approach/" },
      { id: "fieldnotes", label: "Field Notes", href: "/parents/series/" },
      { id: "lifeskills", label: "Life Skills", href: "/parents/lifeskills/" },
      { id: "challenges", label: "Challenges", href: "/parents/challenges/" },
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
  var site = SITES[key], cur = bar.getAttribute("data-current") || "";
  var tabs = site.tabs.map(function (t) {
    if (t.out) return '<a class="wlbar-ext" href="' + t.href + '" target="_blank" rel="noopener" aria-label="' + esc(t.label) + ' (opens in a new tab)">' + esc(t.label) + ARROW + "</a>";
    return '<a href="' + t.href + '"' + (t.id === cur ? ' aria-current="page"' : "") + (t.id === "students" ? ' data-wl-alerts' : "") + ">" + esc(t.label) + "</a>";
  }).join("");

  // Who may switch to which site. Staff (and team guests) see all three; parents see theirs and the students' site;
  // students and signed-out visitors get no switcher. Roles come from /auth.js or the Life Skills tracker as a
  // "wl-role" event: { role: "staff" | "student" | "parent" | null, band: "K–1" | "2–4" | "5–8" | null }.
  // This only steers the screen. What is private (records, coaching history) is protected by the Firestore rules.
  var SWITCH = { staff: ["students", "guides", "parents"], parent: ["parents", "students"] };
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
      (tabs ? '<nav class="wlbar-sites" aria-label="' + esc(site.name) + '">' + tabs + "</nav>" : "") +
      (bar.getAttribute("data-auth") === "off" ? "" : '<span class="wlbar-auth" data-wl-auth></span>') + "</div>";
    // Keep the sign-in chip if it was already mounted.
    var slot = bar.querySelector(".wlbar-auth");
    if (auth && slot) slot.parentNode.replaceChild(auth, slot);
    // On narrow screens the tabs scroll sideways; bring the current one into view.
    var nav = bar.querySelector(".wlbar-sites"), here = nav && nav.querySelector('[aria-current="page"]');
    if (nav && here) nav.scrollLeft = here.offsetLeft - nav.clientWidth / 2 + here.offsetWidth / 2;
  }
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
    var go = allowed(r);
    if (go && location.pathname !== go.split("#")[0]) { location.replace(go); return; }
    var was = JSON.stringify(role); role = r;
    if (JSON.stringify(role) !== was) { draw(); paintAlerts(); }
  }
  // Draw at once. A role remembered on this device (written only by /auth.js and the tracker, cleared on sign-out)
  // shows the switcher without a flicker; it never moves anyone until the signed-in account confirms it.
  try { var c = JSON.parse(localStorage.getItem("wl-role") || "null"); if (c && SWITCH[c.r]) role = { role: c.r, band: c.b || null }; } catch (e) { }
  draw();
  bar.setAttribute("data-wlnav-done", "");
  document.addEventListener("wl-role", function (e) { apply(e.detail); });
  // Open AI Coach alerts, shown as a count on the Guides "Students" tab (sent by /auth.js and /guides/students/).
  var alerts = null;
  function paintAlerts() {
    var a = bar.querySelector("[data-wl-alerts]"); if (!a) return;
    var old = a.querySelector(".wlbar-badge"); if (old) old.remove();
    if (!alerts || !alerts.open) { a.removeAttribute("title"); return; }
    var b = document.createElement("span"); b.className = "wlbar-badge" + (alerts.urgent ? " urgent" : "");
    b.textContent = alerts.open > 99 ? "99+" : String(alerts.open);
    a.appendChild(b); a.title = alerts.open + " open AI Coach alert" + (alerts.open === 1 ? "" : "s") + (alerts.urgent ? ", " + alerts.urgent + " urgent" : "");
  }
  document.addEventListener("wl-alerts", function (e) { alerts = e.detail; paintAlerts(); });
  if (window.wlRole !== undefined) apply(window.wlRole);
})();
