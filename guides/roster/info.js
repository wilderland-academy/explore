// Student Info, the "Pickup, allergies & photos" tab of the Students page (/guides/roster/#info; it was its own page,
// /guides/student-info/, which now redirects here). Mounted in #info, which the roster's app.js shows for #info and
// #info=<student id>. Its classes are drawn with an "si-" prefix and its styles are in roster.css, so they never
// collide with the roster's. Staff only: everything the office keeps about each enrolled student, searchable by name: the family
// directory with emergency profiles (parents, emergency contact, authorized pickup, do-not-release, physician,
// insurance, hospital, parent-reported health notes), allergies, photo and video permissions, and birthdays.
// The data is NOT in this public repo. It lives in Firestore at studentInfo/{studentId} plus studentInfo/meta, which
// only guides and admins can read and only admins can write (firestore.rules). Admins update it at the bottom of this
// page by importing the JSON file built from the office's PDFs. Nothing is cached in the browser.
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";

const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const $ = s => document.querySelector(s);
function h(tag, attrs, kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) { if (k === "class") e.className = String(attrs[k]).split(/\s+/).filter(Boolean).map(c => "si-" + c).join(" "); else if (k === "text") e.textContent = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]); }
  (kids || []).forEach(c => { if (c != null && c !== false) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return e;
}
const app = $("#info");
let db, user, meta = null, S = [], q = "", band = "All", only = "", sel = null;

// ---------------- reading a record ----------------
const NONE = /^(none reported|not on file|n\/a|not applicable|none\b|no\b)/i;
const has = t => !!t && !NONE.test(String(t).trim());
const dnr = s => has(s.dir && s.dir.dnr) ? s.dir.dnr : "";
const health = s => has(s.dir && s.dir.health) ? s.dir.health : "";
const display = s => s.first + (s.nick ? " (" + s.nick + ")" : "") + " " + s.last;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const bdayThisMonth = s => s.birthday && s.birthday.celebrate.slice(0, 3) === MONTHS[new Date().getMonth()];
function flags(s) {
  const out = [], a = s.allergy && s.allergy.status, p = s.photo && s.photo.status;
  if (dnr(s)) out.push(["red", "Do not release"]);
  if (a === "CRITICAL") out.push(["red", "Allergy: critical"]); else if (a === "NO FORM") out.push(["red", "No allergy form"]); else if (a === "MODERATE") out.push(["amber", "Allergy: moderate"]); else if (a === "MILD") out.push(["", "Allergy: mild"]);
  if (p === "NO SHARING" || p === "NO RELEASE") out.push(["red", "No photos"]); else if (p === "COMMUNITY ONLY") out.push(["amber", "Photos: community only"]);
  if (health(s)) out.push(["blue", "Health notes"]);
  if ((s.dir && s.dir.warning) || s.verify.length) out.push(["", "Verify"]);
  if (bdayThisMonth(s)) out.push(["ok", "🎂 " + s.birthday.celebrate]);
  return out;
}
const ONLY = {
  allergy: ["Allergies", s => s.allergy && s.allergy.status !== "NONE REPORTED"],
  photo: ["Photo limits", s => s.photo && s.photo.status !== "PUBLIC OK"],
  dnr: ["Do not release", s => !!dnr(s)],
  health: ["Health notes", s => !!health(s)],
  verify: ["Needs verifying", s => !!(s.dir && s.dir.warning) || s.verify.length > 0],
  bday: ["Birthdays this month", bdayThisMonth]
};

// ---------------- search: by student name first, then by a parent or pickup name ----------------
const fold = t => String(t || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const words = t => fold(t).split(/[^a-z0-9]+/).filter(Boolean);
function match(s) {
  const toks = words(q); if (!toks.length) return { ok: true };
  const mine = words([s.first, s.nick, s.last, s.legal].join(" "));
  if (toks.every(t => mine.some(w => w.startsWith(t)))) return { ok: true };
  const people = [].concat(s.dir.parents || [], s.dir.emergency || [], s.dir.pickup || []).map(x => x.split(" · ")[0]);
  const hit = people.find(p => { const w = words(p); return toks.every(t => w.some(x => x.startsWith(t))); });
  return hit ? { ok: true, via: hit } : { ok: false };
}
function shown() {
  return S.filter(s => (band === "All" || s.band === band) && (!only || ONLY[only][1](s))).map(s => ({ s, m: match(s) })).filter(x => x.m.ok)
    .sort((a, b) => (a.m.via ? 1 : 0) - (b.m.via ? 1 : 0) || a.s.last.localeCompare(b.s.last) || a.s.first.localeCompare(b.s.first));
}

// ---------------- the page ----------------
function frame() {
  app.innerHTML = "";
  const input = h("input", { type: "search", id: "si-q", placeholder: "Search a student (or a parent or pickup name)", "aria-label": "Search students", autocomplete: "off", value: q });
  input.oninput = () => { q = input.value; drawList(); };
  input.onkeydown = e => { if (e.key === "Enter") { const f = shown()[0]; if (f) pick(f.s.id); } };
  const bands = h("div", { class: "chips", role: "group", "aria-label": "Band" }, ["All", "K–1", "2–4", "5–8"].map(b => h("button", { type: "button", "aria-pressed": String(band === b), text: b === "All" ? "All bands" : b, onclick: () => { band = b; frame(); } })));
  const onlys = h("div", { class: "chips", role: "group", "aria-label": "Show only" }, Object.entries(ONLY).map(([k, [label]]) => h("button", { type: "button", "aria-pressed": String(only === k), text: label, onclick: () => { only = only === k ? "" : k; frame(); } })));
  app.append(
    h("p", { class: "conf" }, ["🔒 Confidential: family contacts, health, custody and safety information. Look it up when you need it; don't copy it into messages, docs or AI tools." + (meta ? " From the office's " + (meta.year || "") + " lists, compiled " + (meta.compiled || "") + "." : "")]),
    h("div", { class: "search" }, [input, bands, onlys]),
    notices() || "",
    h("div", { class: "wrap" }, [h("div", null, [h("p", { class: "count", id: "si-count" }), h("div", { class: "list", id: "si-list" })]), h("div", { class: "card detail", id: "si-detail" })]),
    adminBox() || ""
  );
  drawList(); drawDetail();
  if (!matchMedia("(max-width:860px)").matches) input.focus();
}
function notices() {
  if (!meta || !meta.notices) return null;
  const list = meta.notices.filter(n => band === "All" || n.band === band);
  if (!list.length) return null;
  return h("details", { class: "card", open: band !== "All" ? "" : null }, [h("summary", null, [h("b", { text: "Read first: notices from the allergy and photo lists" + (band === "All" ? " (" + list.length + ")" : "") })]),
    h("div", { class: "notices" }, list.map(n => h("div", { class: n.kind === "allergy" ? "alert" : "warn" }, [h("b", { text: n.band + " · " + n.title }), h("p", { class: "small", text: n.text })]))),
    meta.notPlaced ? h("p", { class: "small dim", text: "Not yet placed in a band: " + meta.notPlaced }) : null]);
}
function drawList() {
  const L = $("#si-list"); if (!L) return; L.innerHTML = "";
  const rows = shown();
  $("#si-count").textContent = rows.length + " of " + S.length + " students" + (q ? " matching “" + q + "”" : "");
  rows.forEach(({ s, m }) => L.appendChild(h("button", { type: "button", class: "row", "aria-current": String(sel === s.id), onclick: () => pick(s.id) }, [
    h("b", { text: display(s) }), h("span", { class: "meta", text: (s.grade === "K" ? "Kindergarten" : "Grade " + s.grade) + " · " + s.band + (m.via ? " · matched " + m.via : "") }),
    h("span", { class: "flags" }, flags(s).map(([c, t]) => h("span", { class: "f " + c, text: t })))
  ])));
  if (!rows.length) L.appendChild(h("p", { class: "dim", text: "No student matches. Try part of a first or last name." }));
}
function pick(id) { sel = id; history.replaceState(null, "", "#info=" + id); drawList(); drawDetail(); if (matchMedia("(max-width:860px)").matches) $("#si-detail").scrollIntoView({ behavior: "smooth", block: "start" }); }
const tel = t => { const frag = document.createDocumentFragment(); String(t).split(" · ").forEach((p, i) => { if (i) frag.append(" · "); const ph = /^\(?\d{3}\)?[\s.-]?\d{3}-\d{4}$/.test(p.trim()), em = /^\S+@\S+\.\S+$/.test(p.trim()); frag.append(ph ? h("a", { href: "tel:" + p.replace(/\D/g, ""), text: p }) : em ? h("a", { href: "mailto:" + p.trim(), text: p }) : p); }); return frag; };
const people = (arr, empty) => arr && arr.length ? h("ul", null, arr.map(x => h("li", null, [tel(x)]))) : h("p", { class: "dim", text: empty });
const val = (t, empty) => t ? h("dd", null, [tel(t)]) : h("dd", { class: "dim", text: empty || "Not listed" });
function drawDetail() {
  const box = $("#si-detail"); if (!box) return; box.innerHTML = "";
  const s = S.find(x => x.id === sel); box.classList.toggle("si-empty", !s);
  if (!s) { box.append(h("h2", { text: "Pick a student" }), h("p", { class: "dim", text: "Search by first or last name, or a nickname. Each card brings together the directory, emergency profile, allergies, photo permission and birthday." })); return; }
  const d = s.dir || {}, a = s.allergy || {}, p = s.photo || {}, b = s.birthday;
  const alerts = [];
  if (dnr(s)) alerts.push(h("div", { class: "alert" }, [h("b", { text: "Do not release to: " }), dnr(s)]));
  if (a.status === "CRITICAL" || a.status === "NO FORM") alerts.push(h("div", { class: "alert" }, [h("b", { text: a.status === "NO FORM" ? "No allergy form: treat as unknown, not clear. " : "Critical allergy. " }), a.status === "NO FORM" ? "Check with the family before food is shared." : "Read the allergy notes below before any food."]));
  if (p.status === "NO SHARING" || p.status === "NO RELEASE") alerts.push(h("div", { class: "alert" }, [h("b", { text: "Do not photograph. " }), p.notes]));
  if (d.warning) alerts.push(h("div", { class: "warn" }, [h("b", { text: "⚠ " }), d.warning]));
  box.append(
    h("div", null, [h("h2", { text: display(s) }), h("p", { class: "dim", text: (s.grade === "K" ? "Kindergarten" : "Grade " + s.grade) + " · " + s.band + (s.isNew ? " · new this year" : "") + (s.legal ? " · Legal name: " + s.legal : "") })]),
    ...alerts,
    h("div", { class: "sec" }, [h("h3", { text: "Allergies" }), h("p", null, [h("span", { class: "f " + ({ CRITICAL: "red", "NO FORM": "red", MODERATE: "amber" }[a.status] || ""), text: a.status ? a.status.toLowerCase() : "not listed" })]), a.notes ? h("p", { text: a.notes }) : null]),
    h("div", { class: "sec" }, [h("h3", { text: "Photo and video" }), h("p", null, [h("span", { class: "f " + ({ "NO SHARING": "red", "NO RELEASE": "red", "COMMUNITY ONLY": "amber", "PUBLIC OK": "ok" }[p.status] || ""), text: p.status ? p.status.toLowerCase() : "not listed" })]), p.notes ? h("p", { class: "small", text: p.notes }) : null]),
    h("div", { class: "sec" }, [h("h3", { text: "Birthday" }), h("p", { text: b ? (b.half ? "Celebrated " + b.celebrate + " (half-birthday; actual " + b.actual + ")" : b.actual) : "Not on file yet" })]),
    h("div", { class: "sec" }, [h("h3", { text: "Family and pickup" }), h("dl", { class: "kv" }, [
      h("dt", { text: "Parents / guardians" }), h("dd", null, [people(d.parents, "Not listed")]),
      h("dt", { text: "Emergency contact" }), h("dd", null, [people(d.emergency, "Not on file")]),
      h("dt", { text: "Authorized to pick up" }), h("dd", null, [people(d.pickup, "None listed beyond parents")]),
      h("dt", { text: "Do not release to" }), val(d.dnr, "Not on file")])]),
    h("div", { class: "sec" }, [h("h3", { text: "Medical" }), h("dl", { class: "kv" }, [
      h("dt", { text: "Health notes" }), val(d.health, "Not on file"),
      h("dt", { text: "Primary physician" }), val(d.physician),
      h("dt", { text: "Insurance" }), val(d.insurance),
      h("dt", { text: "Preferred hospital" }), val(d.hospital)])]),
    h("div", { class: "sec" }, [h("h3", { text: "Where this comes from" }), h("p", { class: "small dim", text: "Directory: " + (s.dirSource || "no source noted") + "." }),
      s.verify.length ? h("ul", { class: "small" }, s.verify.map(v => h("li", { text: v }))) : null,
      h("p", { class: "small dim", text: meta && meta.about || "" })])
  );
}
function adminBox() {
  if (!user || !ADMINS.includes((user.email || "").toLowerCase())) return null;
  const note = h("p", { class: "small", "aria-live": "polite" }), file = h("input", { type: "file", accept: "application/json,.json", "aria-label": "Student Info file" });
  let data = null; const go = h("button", { type: "button", class: "btn", text: "Replace Student Info", hidden: "" });
  file.onchange = async () => {
    data = null; go.hidden = true;
    try { const j = JSON.parse(await file.files[0].text()); if (j.kind !== "wilderland-student-info" || !Array.isArray(j.students) || !j.students.every(s => s.id && s.first && s.last && s.band)) throw 0; data = j; note.textContent = `${j.students.length} students from the ${j.year} lists (compiled ${j.compiled}). This replaces what's here now.`; go.hidden = false; }
    catch (e) { note.textContent = "That isn't a Student Info file."; }
  };
  go.onclick = async () => {
    go.disabled = true; note.textContent = "Saving…";
    try {
      const { students, ...m } = data, keep = new Set(students.map(s => s.id));
      await setDoc(doc(db, "studentInfo", "meta"), { ...m, importedAt: Date.now(), importedBy: user.email || "" });
      for (const s of students) await setDoc(doc(db, "studentInfo", s.id), s);
      for (const old of S) if (!keep.has(old.id)) await deleteDoc(doc(db, "studentInfo", old.id));
      note.textContent = "Saved " + students.length + " students."; await load();
    } catch (e) { note.textContent = "Couldn't save. Make sure the latest database rules are published (see firestore.rules)."; go.disabled = false; }
  };
  return h("details", { class: "card admin" }, [h("summary", null, [h("b", { text: "Admins: update Student Info" })]),
    h("p", { class: "small dim", text: "Import the Student Info file built from the office's directory, allergy, photo and birthday PDFs. It replaces every student's record. The file holds confidential data: keep it out of shared drives and delete your copy once it's imported." + (meta && meta.importedAt ? " Last updated " + new Date(meta.importedAt).toLocaleDateString() + (meta.importedBy ? " by " + meta.importedBy : "") + "." : "") }),
    file, go, note]);
}

// ---------------- load ----------------
async function load() {
  try {
    const snap = await getDocs(collection(db, "studentInfo"));
    S = []; meta = null;
    snap.forEach(d => { if (d.id === "meta") meta = d.data(); else S.push({ verify: [], dir: {}, ...d.data(), id: d.id }); });
  } catch (e) {
    app.innerHTML = ""; app.append(h("div", { class: "card" }, [h("p", { text: "Student Info isn't available to this account yet." }), h("p", { class: "small dim", text: "It's for Wilderland guides and admins. If that's you and this keeps showing, the database rules for Student Info may not be published yet." })]), adminBox() || "");
    return;
  }
  const m = /#info=([\w-]+)/.exec(location.hash); if (m && S.some(s => s.id === m[1])) sel = m[1];
  if (!S.length) { app.innerHTML = ""; app.append(h("div", { class: "card" }, [h("p", { text: "Nothing here yet. An admin imports the Student Info file below." })]), adminBox() || ""); return; }
  frame();
}
addEventListener("hashchange", () => { const m = /#info=([\w-]+)/.exec(location.hash); if (m && S.some(s => s.id === m[1]) && m[1] !== sel) { sel = m[1]; drawList(); drawDetail(); } });
(async () => {
  while (!window.wlFirebase) await new Promise(r => setTimeout(r, 50));
  const fb = window.wlFirebase; db = getFirestore(fb.app);
  if (fb.auth.authStateReady) await fb.auth.authStateReady();
  const start = u => { user = u; if (!u) { app.innerHTML = ""; app.append(h("p", { class: "dim", text: "Log in with your Wilderland account." })); return; } load(); };
  document.addEventListener("wl-auth", e => { if ((e.detail && e.detail.uid) !== (user && user.uid)) start(e.detail); });
  start(fb.auth.currentUser);
})();
