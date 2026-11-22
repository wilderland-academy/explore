// Wilderland Explore: the one top bar for every page, defined in one place so all four sites look and work the same.
// Put this at the very top of <body>:
//   <div class="wlbar" data-wlnav="students" data-current="books"></div><script src="/wlnav.js"></script>
// data-wlnav: home | students | guides | parents. data-current: the tab id below for this page (or nothing).
// data-auth="off" leaves out the sign-in slot (pages with their own account menu, like the Life Skills tracker).
// The logo goes to the current site's own home page. Links that leave Explore (Basecamp) get an arrow and open a new tab.
// Styles are in /wl.css. A plain script (not a module) so the bar is drawn before the page paints.
(function () {
  var BASECAMP = { id: "basecamp", label: "Basecamp", href: "https://my.wilderland.academy/", out: true };
  var SITES = {
    home: { name: "Wilderland Explore", home: "/", tabs: [] },
    students: { name: "Students", home: "/students/", tabs: [
      { id: "books", label: "Books", href: "/books/" },
      { id: "challenges", label: "Challenges", href: "/challenges/" },
      { id: "lifeskills", label: "Life Skills", href: "/lifeskills/" },
      { id: "projects", label: "Projects", href: "/projects/" },
      { id: "store", label: "Store", href: "/store/" },
      { id: "suggest", label: "Ideas", href: "/suggest/" },
      BASECAMP] },
    guides: { name: "Guides", home: "/guides/", tabs: [
      { id: "mentor", label: "Mentor Mindset", href: "/fieldguide/" },
      { id: "behavior", label: "Behavior", href: "/behavior/" },
      { id: "lifeskills", label: "Life Skills", href: "/guides/lifeskills/" },
      { id: "parentcomms", label: "Parent Comms", href: "/guides/parents/" },
      BASECAMP] },
    parents: { name: "Parents", home: "/parents/", tabs: [
      { id: "athome", label: "At Home", href: "/parents/athome/" },
      { id: "approach", label: "Our Approach", href: "/parents/approach/" },
      { id: "fieldnotes", label: "Field Notes", href: "/parents/series/" },
      { id: "lifeskills", label: "Life Skills", href: "/parents/lifeskills/" },
      BASECAMP] }
  };
  var MARK = '<svg class="wlbar-mark" viewBox="1000 490 1880 640" aria-hidden="true"><path d="M1655.83 862.635L1420.76 517L1023 1103.58H1458.91L1655.83 862.635Z" fill="white"/><path d="M2851.08 1104.71L2453.14 517.773L2055.38 1104.35L2851.08 1104.71Z" fill="#D5F367"/><path d="M2124.74 867.294L1936.99 637.184L1555.82 1104.3H1964.82L2124.74 867.294Z" fill="#00B451"/></svg>';
  var ARROW = '<svg class="wlbar-out" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2h6v6M10 2 3 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  var bar = (document.currentScript && document.currentScript.previousElementSibling && document.currentScript.previousElementSibling.matches("[data-wlnav]"))
    ? document.currentScript.previousElementSibling : document.querySelector("[data-wlnav]:not([data-wlnav-done])");
  if (!bar) return;
  var site = SITES[bar.getAttribute("data-wlnav")] || SITES.home, cur = bar.getAttribute("data-current") || "";
  var tabs = site.tabs.map(function (t) {
    if (t.out) return '<a class="wlbar-ext" href="' + t.href + '" target="_blank" rel="noopener" aria-label="' + esc(t.label) + ' (opens in a new tab)">' + esc(t.label) + ARROW + "</a>";
    return '<a href="' + t.href + '"' + (t.id === cur ? ' aria-current="page"' : "") + ">" + esc(t.label) + "</a>";
  }).join("");
  bar.innerHTML = '<div class="wlbar-in"><a class="wlbar-home" href="' + site.home + '" aria-label="' + esc(site.name) + ' home">' + MARK + "</a>" +
    (tabs ? '<nav class="wlbar-sites" aria-label="' + esc(site.name) + '">' + tabs + "</nav>" : "") +
    (bar.getAttribute("data-auth") === "off" ? "" : '<span class="wlbar-auth" data-wl-auth></span>') + "</div>";
  bar.setAttribute("data-wlnav-done", "");
  // On narrow screens the tabs scroll sideways; bring the current one into view.
  var nav = bar.querySelector(".wlbar-sites"), here = nav && nav.querySelector('[aria-current="page"]');
  if (nav && here) nav.scrollLeft = here.offsetLeft - nav.clientWidth / 2 + here.offsetWidth / 2;
})();
