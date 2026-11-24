// Wilderland: open any challenge as a modal over the current page, from anywhere on Explore.
// Any page can link a challenge with either of these, and this script opens it in place instead of leaving the page:
//   <a href="/challenges/#c=EN-03.2" data-wl-ch="EN-03.2">Run a mile without stopping</a>
//   <button type="button" data-wl-ch="EN-03.2">…</button>
// Or from code: WLChallenge.open("EN-03.2"). WLChallenge.link(id, text) returns such a link as an HTML string.
// On the Challenges page itself this hands off to the page's own, fuller sheet (window.WLC.open).
// Needs /challenges/data.js (window.WL); if the page doesn't have it, it is loaded the first time a challenge opens.
// A plain script, so it works on module and non-module pages alike. Styles are added on first use.
(function () {
  if (window.WLChallenge) return;
  var D = null, BYID = {}, SK = {}, dlg = null, lastFocus = null, loading = null;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  // The map for the site you're on, so "Open on the map" keeps you in your own site.
  var MAP = location.pathname.indexOf("/guides/") === 0 ? "/guides/challenges/" : location.pathname.indexOf("/parents/") === 0 ? "/parents/challenges/" : "/challenges/";
  var PARENT = location.pathname.indexOf("/parents/") === 0;
  var HOME = {
    v: "A parent can film it instead of showing a guide: one continuous take from the last 7 days, with no help during the attempt.",
    l: "A parent can sign a log: agree on what counts first, write each entry the same day, and count only what you saw.",
    o: "A parent who sees it happen can write a witness note the same day: when, where, and exactly what the child did and said.",
    t: "This Epic starts and ends with a parent's check: a week of evidence of the problem before, and the same kind of evidence after.",
    x: "Someone outside the family confirms this one: a customer, a judge, an instructor or a certificate.",
    g: "Shown to a guide in person. Families can help practice at home.",
    s: "Safety Gate: a guide or certified instructor checks it, never a parent."
  };

  function data() {
    if (D) return Promise.resolve(D);
    var ready = function () { D = window.WL; D.ch.forEach(function (c) { BYID[c.id] = c; }); D.skills.forEach(function (s) { SK[s.k] = s; }); return D; };
    if (window.WL && window.WL.ch) return Promise.resolve(ready());
    if (!loading) loading = new Promise(function (ok, no) {
      var s = document.createElement("script"); s.src = "/challenges/data.js";
      s.onload = function () { window.WL ? ok(ready()) : no(new Error("no data")); }; s.onerror = no; document.head.appendChild(s);
    });
    return loading;
  }

  var CSS = ".wlch{border:0;padding:0;border-radius:20px;width:min(680px,calc(100vw - 32px));max-height:calc(100vh - 48px);background:#fbfcf6;color:#14231c;box-shadow:0 24px 60px rgba(1,40,30,.35);font:400 16px/1.55 Inter,\"Uncut Sans\",system-ui,sans-serif}" +
    ".wlch::backdrop{background:rgba(1,40,30,.5)}" +
    ".wlch *{box-sizing:border-box}" +
    ".wlch-in{display:flex;flex-direction:column;gap:16px;padding:0 0 22px}" +
    ".wlch-band{background:var(--c,#015640);color:#fff;padding:18px 64px 16px 22px;font-size:13.5px;font-weight:600;letter-spacing:.01em}" +
    ".wlch-x{position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:24px;line-height:1;cursor:pointer}" +
    ".wlch-x:focus-visible,.wlch a:focus-visible,.wlch button:focus-visible{outline:2px solid #d5f367;outline-offset:2px}" +
    ".wlch h2{margin:0;padding:0 22px;font:700 24px/1.2 \"Uncut Sans\",Inter,system-ui,sans-serif;letter-spacing:-.01em}" +
    ".wlch .id{padding:0 22px;margin:-10px 0 0;color:#56665c;font-size:13.5px}" +
    ".wlch-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;padding:0 22px}" +
    ".wlch-facts div{background:#fff;border:1px solid #e1e7d6;border-radius:12px;padding:9px 12px;font-size:14.5px}" +
    ".wlch-facts b{display:block;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:#56665c}" +
    ".wlch-sec{padding:0 22px;display:flex;flex-direction:column;gap:6px}" +
    ".wlch-sec h3{margin:0;font:700 17px/1.25 \"Uncut Sans\",Inter,system-ui,sans-serif}" +
    ".wlch-sec ol,.wlch-sec ul{margin:0;padding-left:22px;display:flex;flex-direction:column;gap:4px}" +
    ".wlch-sec a{color:#015640}" +
    ".wlch-call{margin:0 22px;padding:10px 14px;border-radius:12px;background:#f2f8dc;font-size:15px}" +
    ".wlch-acts{display:flex;flex-wrap:wrap;gap:10px;padding:0 22px}" +
    ".wlch-acts a,.wlch-acts button{display:inline-flex;align-items:center;min-height:42px;padding:0 16px;border-radius:12px;font:700 15px Inter,sans-serif;text-decoration:none;cursor:pointer;border:0}" +
    ".wlch-acts .go{background:#015640;color:#fff}.wlch-acts .ghost{background:#eef1ea;color:#14231c}" +
    ".wlch-load{padding:40px 22px;color:#56665c}" +
    "a.wl-ch,button.wl-ch{all:unset;cursor:pointer;color:#015640;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:2px;font:inherit}" +
    "a.wl-ch:hover,button.wl-ch:hover{text-decoration-thickness:2px}" +
    "a.wl-ch:focus-visible,button.wl-ch:focus-visible{outline:2px solid #015640;outline-offset:2px;border-radius:3px}" +
    "@media (max-width:640px){.wlch{width:100vw;max-width:100vw;max-height:100vh;height:100vh;border-radius:0;margin:0}}";

  function mount() {
    if (dlg) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    dlg = document.createElement("dialog"); dlg.className = "wlch"; dlg.setAttribute("aria-labelledby", "wlch-t");
    dlg.innerHTML = '<div class="wlch-in" id="wlch-body"></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-wlch-close]")) dlg.close(); });
    dlg.addEventListener("close", function () { if (dlg.dataset.wlcKeep) return; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); });
  }

  function render(c) {
    var comp = D.comps[c.c] || {}, s = SK[comp.k] || { n: "", col: "#015640" }, h = "";
    h += '<button class="wlch-x" type="button" data-wlch-close aria-label="Close">×</button>';
    h += '<div class="wlch-band" style="--c:' + esc(s.col) + '">' + esc([s.n, comp.s, comp.n].filter(Boolean).join(" › ")) + "</div>";
    h += '<h2 id="wlch-t">' + esc(c.t) + "</h2>";
    h += '<p class="id">' + esc(c.id) + (c.z === "Epic" ? " · Epic" : "") + "</p>";
    h += '<div class="wlch-facts"><div><b>Grades</b>' + esc(c.gr || c.b) + "</div><div><b>Time</b>" + esc(c.tm || "") + "</div><div><b>Credits</b>" + esc(c.cr || 1) + "</div><div><b>How it's shown</b>" + esc(c.w || "") + "</div></div>";
    if (c.gate) h += '<p class="wlch-call"><b>Safety Gate.</b> Pass this before: ' + esc(c.gate) + ". A guide or certified instructor checks it.</p>";
    if (c.ta) h += '<p class="wlch-call"><b>Turnaround Epic.</b> It only counts when it fixes a real problem or builds something new. A parent (or guide) confirms the problem before and the change after.</p>';
    if (c.how && c.how.length) h += '<div class="wlch-sec"><h3>' + (c.b === "K–1" ? "How to run it (for guides)" : "How to do it") + "</h3><ol>" + c.how.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div>";
    if (c.st && c.st.length) h += '<div class="wlch-sec"><h3>' + (c.z === "Epic" ? "Checkpoints" : "Stages") + "</h3><ol>" + c.st.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div>";
    if (c.r && c.r.length && D.res) h += '<div class="wlch-sec"><h3>Where to learn</h3><ul>' + c.r.map(function (i) { var r = D.res[i]; return r ? '<li><a href="' + esc(r[2]) + '" target="_blank" rel="noopener">' + esc(r[0]) + "</a> <small>" + esc(r[1]) + "</small></li>" : ""; }).join("") + "</ul></div>";
    if (HOME[c.p]) h += '<div class="wlch-sec"><h3>' + (PARENT ? "At home" : "Passing it off") + "</h3><p>" + esc(HOME[c.p]) + ' <a href="/parents/passoff/">How passing off at home works</a></p></div>';
    h += '<div class="wlch-acts"><a class="go" href="' + MAP + "#c=" + encodeURIComponent(c.id) + '">Open on the Challenges map</a><button class="ghost" type="button" data-wlch-close>Back</button></div>';
    return h;
  }

  function open(id) {
    id = String(id || "").trim();
    // On the Challenges page, use its own sheet (save to plan, Mr. Fox, progress).
    if (window.WLC && window.WLC.open && document.getElementById("detail")) { window.WLC.open(id); return; }
    mount();
    var body = dlg.querySelector("#wlch-body");
    if (!dlg.open) { lastFocus = document.activeElement; body.innerHTML = '<p class="wlch-load">Loading…</p>'; dlg.showModal(); }
    data().then(function () {
      var c = BYID[id];
      body.innerHTML = c ? render(c) : '<button class="wlch-x" type="button" data-wlch-close aria-label="Close">×</button><div class="wlch-band">Challenge</div><h2 id="wlch-t">' + esc(id) + '</h2><p class="wlch-sec">This challenge is no longer in the challenge list.</p>';
      var x = dlg.querySelector(".wlch-x"); if (x) x.focus();
      body.scrollTop = 0; dlg.scrollTop = 0;
    }).catch(function () { body.innerHTML = '<p class="wlch-load">Couldn\'t load the challenge list. Check your connection.</p>'; });
  }
  // A link to a challenge, as HTML: opens the modal here, and still works (goes to the map) if scripts are off.
  function link(id, text, cls) {
    var href = MAP + "#c=" + encodeURIComponent(id);
    return '<a class="wl-ch' + (cls ? " " + cls : "") + '" href="' + esc(href) + '" data-wl-ch="' + esc(id) + '">' + esc(text == null ? id : text) + "</a>";
  }
  // The same link as an element, for pages that build their DOM in code.
  function el(id, text) { var t = document.createElement("template"); t.innerHTML = link(id, text); return t.content.firstChild; }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("[data-wl-ch]"); if (!a) return;
    e.preventDefault(); open(a.getAttribute("data-wl-ch"));
  });
  window.WLChallenge = { open: open, link: link, el: el, title: function (id) { var c = (window.WL && window.WL.ch || []).find(function (x) { return x.id === id; }); return c ? c.t : id; } };
})();
