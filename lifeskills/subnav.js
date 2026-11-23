// Wilderland: the Life Skills sub-menu (the slim forest bar under the top bar) for the Guides and Parents sites.
// One list, so the tracker (/lifeskills/app.js), the Challenges map (/guides/challenges/, /parents/challenges/) and the
// Lab builder all show the same Life Skills menu. Challenges and the Labs schedule live inside Life Skills.
// Use on a page:  <nav class="nav-links" data-ls-subnav="guides" data-current="challenges"></nav><script src="/lifeskills/subnav.js"></script>
// The tracker reads window.WLSubnav and draws its own links, because some of its items are views on the same page.
(function () {
  var L = {
    // Labs holds the schedule, ideas, how Labs run and the Lab builder (tabs inside it: WLLabTabs below).
    guides: [
      ["overview", "Overview", "/guides/lifeskills/#overview"],
      ["challenges", "Challenges", "/guides/challenges/"],
      ["labs", "Labs", "/guides/lifeskills/#schedule"],
      ["validate", "Validate", "/guides/lifeskills/#validate"],
      ["board", "Crew board", "/guides/lifeskills/#board"]
    ],
    // Parents: the tracker adds one tab per child before these.
    parents: [
      ["challenges", "Challenges", "/parents/challenges/"],
      ["schedule", "Labs schedule", "/parents/lifeskills/#schedule"],
      ["athome", "Passing off at home", "/challenges/parents.html"]
    ]
  };
  window.WLSubnav = L;
  // Inside Labs (guides): Schedule, Ideas (Alpha's workshops to borrow), How Labs run (Alpha's playbook) and the Lab builder.
  // <nav data-ls-labtabs data-current="schedule|ideas|playbook|build"></nav>
  var LABTABS = [["schedule", "Schedule", "/guides/lifeskills/#schedule"], ["ideas", "Ideas", "/guides/lifeskills/ideas/"],
    ["playbook", "How Labs run", "/guides/lifeskills/playbook/"], ["build", "Lab builder", "/guides/lifeskills/builder/"]];
  window.WLLabTabs = function (cur) {
    return LABTABS.map(function (x) { return '<a href="' + x[2] + '"' + (x[0] === cur ? ' aria-current="page"' : "") + ">" + x[1] + "</a>"; }).join("");
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  Array.prototype.forEach.call(document.querySelectorAll("[data-ls-labtabs]"), function (nav) {
    nav.classList.add("labtabs"); nav.setAttribute("aria-label", "Labs"); nav.innerHTML = window.WLLabTabs(nav.getAttribute("data-current") || "");
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ls-subnav]"), function (nav) {
    var site = nav.getAttribute("data-ls-subnav"), cur = nav.getAttribute("data-current") || "";
    var items = (site === "parents" ? [["child", "My child", "/parents/lifeskills/"]] : []).concat(L[site] || []);
    nav.innerHTML = items.map(function (x) {
      return '<a href="' + esc(x[2]) + '"' + (x[0] === cur ? ' aria-current="page"' : "") + ">" + esc(x[1]) + "</a>";
    }).join("");
  });
})();
