// Parents' Challenges page (/parents/challenges/): which challenges each of your children has passed or saved.
// Draws the "Your children" section above the map and tags challenge cards ("Norah passed", "Jonah saved it") through
// window.WLC.setFamily (/challenges/app.js). Reads what a linked parent may read (firestore.rules):
//   lsStudents (where parents contains you), lsStudents/{sid}/entries (passes), lsShared/{sid}/sites/challenges (saved).
// A tester's test parent view shows the test student plus the tester's own real children (as /lifeskills/ does).
import { getFirestore, collection, collectionGroup, query, where, getDocs } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";

const box = document.getElementById("family");
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const first = n => String(n || "").trim().split(/\s+/)[0] || "Your child";
const D = window.WL || { ch: [] }, BYID = {}; D.ch.forEach(c => { BYID[c.id] = c; });
const yearStart = () => { const d = new Date(); return (d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1) + "-08-01"; };

function storedView() { try { const v = JSON.parse(localStorage.getItem("wl-viewas") || "null"); return v && v.as ? v : null; } catch (e) { return null; } }

async function load() {
  if (!box) return;
  for (let i = 0; i < 100 && !window.wlFirebase; i++) await new Promise(r => setTimeout(r, 100));   // /auth.js loads after this
  const fb = window.wlFirebase; if (!fb) return;
  await (fb.auth.authStateReady ? fb.auth.authStateReady() : Promise.resolve());
  const u = fb.auth.currentUser; if (!u || !u.emailVerified) return;
  const real = (u.email || "").toLowerCase(), view = storedView(), TEST = (window.WLPeople || {}).TEST || {};
  const testParent = view && view.by === real && view.as === "parent";
  if (!testParent && real.endsWith("@wilderland.academy")) return;   // staff and students: not a parent view
  const db = getFirestore(fb.app), kids = {};
  const add = (snap, keep) => snap.forEach(d => { const x = { id: d.id, ...d.data() }; if (keep(x)) kids[d.id] = x; });
  if (testParent) {
    add(await getDocs(query(collection(db, "lsStudents"), where("parents", "array-contains", TEST.parent), where("test", "==", true))), () => true);
    try { add(await getDocs(query(collection(db, "lsStudents"), where("parents", "array-contains", real))), x => !x.test); } catch (e) { }
  } else add(await getDocs(query(collection(db, "lsStudents"), where("parents", "array-contains", real))), x => !x.test);
  const sids = Object.keys(kids).sort((a, b) => String(kids[a].name).localeCompare(String(kids[b].name)));
  try { localStorage.setItem("wl-kids", String(sids.length)); document.dispatchEvent(new CustomEvent("wl-kids", { detail: sids.length })); } catch (e) { }
  if (!sids.length) return;
  const picksOf = raw => { try { return JSON.parse(JSON.parse(raw || "{}")["wl-picks"] || "[]").filter(c => BYID[c]); } catch (e) { return []; } };
  await Promise.all(sids.map(async sid => {
    const k = kids[sid]; k.passed = []; k.saved = [];
    try { (await getDocs(collection(db, "lsStudents", sid, "entries"))).forEach(d => { const e = d.data(); if (e.result === "pass" && BYID[e.cid] && (e.date || "") >= yearStart()) k.passed.push(e.cid); }); } catch (e) { }
    try { (await getDocs(collection(db, "lsShared", sid, "sites"))).forEach(d => { if (d.id === "challenges") k.saved = picksOf(d.data().data); }); } catch (e) { }
  }));
  // A tester (staff) in the test parent view can read the students' own saved copies too, for anything not shared yet.
  if (testParent && sids.some(sid => !kids[sid].saved.length && kids[sid].email)) {
    try {
      (await getDocs(collectionGroup(db, "sites"))).forEach(d => {
        if (d.id !== "challenges") return;
        const x = d.data(), sid = sids.find(s => kids[s].email && kids[s].email.toLowerCase() === String(x.email || "").toLowerCase() && !!kids[s].test === !!x.test);
        if (sid && !kids[sid].saved.length) kids[sid].saved = picksOf(x.data);
      });
    } catch (e) { }
  }
  sids.forEach(sid => { const k = kids[sid]; k.passed = [...new Set(k.passed)]; k.saved = [...new Set(k.saved)].filter(c => !k.passed.includes(c)); });
  draw(sids.map(s => kids[s]));
}

function draw(list) {
  const fam = {};
  list.forEach(k => {
    k.passed.forEach(c => (fam[c] = fam[c] || []).push({ n: first(k.name), st: "pass" }));
    k.saved.forEach(c => (fam[c] = fam[c] || []).push({ n: first(k.name), st: "saved" }));
  });
  if (window.WLC && window.WLC.setFamily) window.WLC.setFamily(fam);
  const item = c => `<li><a href="#c=${encodeURIComponent(c)}">${esc(BYID[c].t)}</a></li>`;
  const col = (title, ids, empty) => `<div class="pcard"><h3>${title}</h3>${ids.length ? `<ul class="fam-list">${ids.map(item).join("")}</ul>` : `<p class="small muted">${empty}</p>`}</div>`;
  box.innerHTML = `<div class="wrap prog">
    <div class="prog-head"><p class="eyebrow">${list.length > 1 ? "Your children" : "Your child"}</p>
      <h2 id="family-title">${list.length > 1 ? "What your children are working toward" : "What " + esc(first(list[0].name)) + " is working toward"}</h2>
      <p>Challenges passed this school year and challenges saved to work on. You'll also see them tagged on the map below. We just launched this in November 2026, so most students have saved or passed only a few so far.</p></div>
    ${list.map(k => `<div class="fam-kid">${list.length > 1 ? `<h3 class="fam-name">${esc(k.name)} <span>Grades ${esc(k.band || "")}</span></h3>` : ""}
      <div class="prog-grid">${col(`Passed (${k.passed.length})`, k.passed, "None passed yet this year.")}${col(`Saved to work on (${k.saved.length})`, k.saved, "Nothing saved yet. Students save challenges on the Challenges site at school.")}</div></div>`).join("")}
    <p class="small"><a href="/parents/lifeskills/">See ${list.length > 1 ? "each child's" : "the"} full profile</a>: goals, books, project ideas and every pass.</p></div>`;
  box.hidden = false;
}

load().catch(e => console.warn("Family challenges:", e));
