// Student Court (/court/, Students site): three ways to deal with a problem between students, plus the judge's docket.
//   Tell a guide privately: anything about safety (Tier 3) or that a student doesn't want to handle themselves. Saved as
//     a Mr. Fox alert (aiAlerts, category "student_report", or "harmed_by_others" / "self_harm" with their protocols),
//     so it lands in Guides › Students › Alerts and every guide's bell, the same as a worrying Mr. Fox conversation.
//   Peace Talk helper: an I-statement builder and the steps of a Peace Talk. Nothing is saved.
//   File a complaint: grades 2–8, Tier 1 and 2 problems, after a Peace Talk (or a guide's waiver), with the honesty
//     pledge. One classmate per complaint; at most 2 open at once. courtCases in Firestore.
//   My cases: complaints I filed (withdraw, fix and refile, appeal) and cases about me once a judge has set a court
//     day (tell my side, say I've made it right, appeal).
//   Judge's docket: for students staff have appointed (courtRoles/{email}): accept and set a court day, send back,
//     pass to a guide, run the hearing and record the finding and the repair. Guides sign off repairs (/guides/court/).
// Who can see and change what is enforced in firestore.rules (courtCases, courtRoles); this page only mirrors it.
const C = window.WLCourt, FSX = window.WLFS;
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const toast = t => { const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => { el.hidden = true; }, 3200); };
const day = s => s ? new Date(s + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "";
const when = ms => ms ? new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
const OPEN = ["filed", "returned", "scheduled"], SHOWN = ["scheduled", "restoring", "not_upheld", "closed"];
const FEELINGS = ["Hurt", "Angry", "Embarrassed", "Left out", "Frustrated", "Sad", "Scared", "Annoyed", "Disrespected", "Confused", "Lonely", "Worried"];
const NEEDS = ["Respect", "Space", "To be included", "Fairness", "Quiet to work", "My things left alone", "Kindness", "To feel safe", "The truth told"];

let ROLE = null, BAND = "5–8", ME = "", MYNAME = "", BOARD = [], ROLES = [], MYROLE = null;
let MINE = [], ABOUT = [], DOCKET = [], LOADED = false, DTAB = "new";
const F = {}; // the complaint being written
const isStudent = () => ROLE && ROLE.role === "student";
const isTest = () => !!(ROLE && ROLE.test);
const k1 = () => BAND === "K–1";
const myEmail = () => String((FSX.user() || {}).email || "").toLowerCase();
const short = n => { const p = String(n || "").trim().split(/\s+/); return p.length > 1 ? p[0] + " " + p[p.length - 1][0] + "." : p[0] || ""; };
const testOk = x => !!x.test === isTest();

// Guides for a band (and the test guide in test view), for notifications.
function bandGuides(band) {
  const P = window.WLPeople || {};
  if (isTest()) return [(P.TEST || {}).guide].filter(Boolean);
  return Object.keys(P.STAFF_BANDS || {}).filter(e => P.STAFF_BANDS[e] === band);
}
const judgesFor = band => ROLES.filter(r => r.active && (r.bands || []).includes(band) && testOk(r));
const tell = (to, text, link) => { if (window.wlNotify) window.wlNotify(to, { kind: "court", text, link }); };

// ---------- loading ----------
async function load() {
  LOADED = false; MINE = []; ABOUT = []; DOCKET = []; BOARD = []; ROLES = []; MYROLE = null;
  // In test view the test student's appointment (made on the staff desk in test view) stands in for the tester's.
  const em = myEmail(), roleKey = isTest() ? String(((window.WLPeople || {}).TEST || {}).student || "").toLowerCase() : em;
  const jobs = [
    FSX.list("courtRoles").then(r => { ROLES = r.map(x => Object.assign(x, { id: decodeURIComponent(x.id) })); MYROLE = ROLES.find(x => x.id === roleKey && x.active && testOk(x)) || null; }).catch(() => { })
  ];
  if (isStudent()) {
    ME = ROLE.sid || "";
    jobs.push(FSX.list("lsBoard").then(b => {
      const me = b.find(x => x.id === ME); MYNAME = me ? me.name : "";
      BOARD = b.filter(x => x.id !== ME && x.band === BAND && !x.test).sort((a, z) => String(a.name).localeCompare(z.name));
    }).catch(() => { }));
    jobs.push(FSX.query("courtCases", [["byEmail", em]], 100).then(r => { MINE = r.filter(testOk); }).catch(() => { }));
    if (ME) jobs.push(FSX.query("courtCases", [["againstSid", ME], ["status", SHOWN]], 100).then(r => { ABOUT = r.filter(testOk); }).catch(() => { }));
  }
  await Promise.all(jobs);
  if (MYROLE) {
    try {
      const bands = (MYROLE.bands || []).filter(b => C.BANDS.includes(b));
      const lists = await Promise.all(bands.map(b => FSX.query("courtCases", isTest() ? [["band", b], ["test", true]] : [["band", b]], 300)));
      DOCKET = lists.flat().filter(testOk);
    } catch (e) { DOCKET = []; }
  }
  LOADED = true;
}

// ---------- sections ----------
function sHelp() {
  return `<section id="help"><h2>Tell a guide privately</h2>
    <p class="lede">Some problems aren't for court. If anything below is happening, tell a guide in person if you can, or send it here. Only guides see it, and a guide will find you.</p>
    <div class="sheet">
      ${C.TIER3.map((t, i) => `<button type="button" class="opt" data-help="${i}" aria-pressed="${F.help === String(i)}">${esc(t)}</button>`).join("")}
      <button type="button" class="opt" data-help="self" aria-pressed="${F.help === "self"}">I'm having a really hard time, or thinking about hurting myself</button>
      <button type="button" class="opt" data-help="other" aria-pressed="${F.help === "other"}">Something else I want a guide to know</button>
      ${F.help === "self" ? `<div class="stop"><b>You matter, and you don't have to handle this alone.</b>Tell a guide or another adult you trust today. If you might hurt yourself right now, tell an adult near you, or call or text 988. You can also use the SafeUT app to chat with a counselor any time.</div>` : ""}
      ${F.help ? `<label class="f">What's happening? (Optional. A guide will talk with you either way.)<textarea id="h-text" maxlength="600"></textarea></label>
        <div class="row"><button class="btn" type="button" data-sendhelp>${isStudent() ? "Send to my guides" : "Students send this to their guides"}</button></div><p class="err" id="herr"></p>` : ""}
    </div></section>`;
}

function sPeace() {
  const p = F.peace || (F.peace = { feel: [], need: [] });
  const line = `When you ${p.did || "___"}, I felt ${p.feel.length ? p.feel.join(" and ").toLowerCase() : "___"}${p.need.length ? ", because I need " + p.need.join(" and ").toLowerCase() : ""}. Next time, could you ${p.ask || "___"}?`;
  return `<section id="peace"><h2>Plan a Peace Talk</h2>
    <p class="lede">${k1() ? "In K–1, a guide always helps with Peace Talks. Ask your guide, and you can use the words below." : "Most problems end with a good Peace Talk. Plan what you want to say, then find the other person (or ask a guide to help)."}</p>
    <div class="sheet">
      <p class="step"><i>1</i> Calm first</p><p class="dim" style="margin:0 0 10px">If your heart is racing or your face is hot, wait. Use your <a href="/code/#plan">calm plan</a>. A Peace Talk goes better when both of you are ready.</p>
      <p class="step"><i>2</i> What did they do?</p><label class="f">Say what happened, like a camera would see it. No names or labels like “mean”.<input type="text" id="pt-did" maxlength="140" value="${esc(p.did || "")}" placeholder="took my pencil case and wouldn't give it back"></label>
      <p class="step"><i>3</i> How did you feel?</p><div class="chips feel">${FEELINGS.map(f => `<button class="chip" type="button" data-feel="${esc(f)}" aria-pressed="${p.feel.includes(f)}">${esc(f)}</button>`).join("")}</div>
      <p class="step" style="margin-top:14px"><i>4</i> What do you need?</p><div class="chips">${NEEDS.map(f => `<button class="chip" type="button" data-need="${esc(f)}" aria-pressed="${p.need.includes(f)}">${esc(f)}</button>`).join("")}</div>
      <p class="step" style="margin-top:14px"><i>5</i> What are you asking for?</p><label class="f">One clear thing they could do.<input type="text" id="pt-ask" maxlength="140" value="${esc(p.ask || "")}" placeholder="ask before you borrow my things"></label>
      <div class="box" style="background:#fff;color:var(--ink);border-color:#c5d0c0"><b>What you can say</b><p id="pt-line" style="margin:6px 0 0;font-size:17px">“${esc(line)}”</p></div>
      <p class="step"><i>6</i> How a Peace Talk goes</p>
      <ol style="margin:0 0 12px;padding-left:20px;display:grid;gap:4px;font-size:14.5px">
        <li>Sit together with the Peace Object. Whoever holds it talks; the other listens without interrupting.</li>
        <li>You go first with what you planned above.</li>
        <li>They say back what they heard (“You felt … when I …”). Then it's their turn.</li>
        <li>You both say what you'll do next time.</li>
        <li>If it was a Tier 1 problem, the person who caused it does an act of kindness for the other before getting back to work.</li>
        <li>Shake hands, fist bump, or just say “we're good.” If it didn't work, a guide can help, or you can file a complaint.</li>
      </ol>
      <div class="row"><button class="btn" type="button" data-peacehelp>${isStudent() ? "Ask a guide to help with a Peace Talk" : "Students ask their guide for help here"}</button></div>
    </div></section>`;
}

function sFile() {
  if (k1()) return `<section id="file"><h2>File a complaint</h2><p class="empty">Student Court is for grades 2 to 8. In K–1, your guide helps you solve problems with a Peace Talk at the peace table.</p></section>`;
  if (!isStudent()) return `<section id="file"><h2>File a complaint</h2><p class="lede">Students in grades 2 to 8 file complaints here after a Peace Talk didn't fix a problem (or a guide said they could skip it). They tell what happened, how they felt, what they need, and their own part, and promise it's true. A student judge checks it and sets a court day.</p>${ROLE && ROLE.role === "staff" ? `<p><a class="ghost" href="/guides/court/">Open the staff Student Court desk</a></p>` : ""}</section>`;
  if (!ME) return `<section id="file"><h2>File a complaint</h2><p class="empty">Ask your guide to add you to the Life Skills roster, then you can file complaints here.</p></section>`;
  const open = MINE.filter(c => OPEN.includes(c.status));
  if (open.length >= 2 && !F.editId) return `<section id="file"><h2>File a complaint</h2><p class="empty">You have ${open.length} complaints waiting. Court can handle two from you at a time. When one is heard or withdrawn, you can file another. If something new is serious, <a href="#help">tell a guide</a>.</p></section>`;
  if (F.sent) return `<section id="file"><h2>File a complaint</h2><div class="box"><b>Your complaint is with the judge.</b><p class="dim" style="margin:6px 0 10px">You'll hear here (and in your 🔔) when the judge sets a court day or sends it back. Court is on Tuesdays and Thursdays.</p><button class="ghost" type="button" data-newcase>File another</button></div></section>`;
  const cat = F.cat ? C.CAT[F.cat] : null;
  const counter = F.against && ABOUT.concat([]).some(c => c.bySid === F.against && Date.now() - (c.created || 0) < 3 * 864e5);
  return `<section id="file"><h2>${F.editId ? "Fix and refile your complaint" : "File a complaint"}</h2>
    <p class="lede">Next court day: <b>${esc(day(C.nextCourtDay()))}</b>. Take your time and tell the whole truth.</p>
    <div class="sheet" id="fileform">
      <p class="step"><i>1</i> Before you start</p>
      <label class="row" style="font-size:15px"><input type="checkbox" id="f-calm" ${F.calm ? "checked" : ""}> I'm calm enough to write this clearly.</label>
      <div class="stop" style="margin-top:12px"><b>Is it any of these? Then it's not for court.</b><ul style="margin:4px 0 8px;padding-left:20px">${C.TIER3.map(t => `<li>${esc(t)}</li>`).join("")}</ul><a href="#help" style="color:#7a1610;font-weight:700">Tell a guide privately instead →</a></div>
      <label class="row" style="font-size:15px"><input type="checkbox" id="f-notsafety" ${F.notsafety ? "checked" : ""}> It isn't any of those.</label>

      <p class="step" style="margin-top:18px"><i>2</i> Who is it about?</p>
      ${F.editId ? `<p style="margin:0">${esc(F.againstName)}</p>` : `<select id="f-against"><option value="">Choose one classmate…</option>${BOARD.map(b => `<option value="${esc(b.id)}" ${b.id === F.against ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select>
      <p class="dim small" style="margin:6px 0 0">One person per complaint. If more than one person was part of it, tell a guide.</p>`}
      ${counter ? `<p class="dim small">They filed a complaint about you recently. The judge will hear both together, and the guides will see both.</p>` : ""}

      <p class="step" style="margin-top:18px"><i>3</i> What kind of problem?</p>
      ${C.CATS.map(c => `<button type="button" class="opt" data-cat="${c.id}" aria-pressed="${F.cat === c.id}">${esc(c.t)}<small>Usually Tier ${c.tier}${c.tier === 2 ? ": it caused real harm" : ": it got in the way"}</small></button>`).join("")}

      <p class="step" style="margin-top:18px"><i>4</i> What happened</p>
      <label class="f">When and where, and exactly what they did and said. Like a camera would see it.<textarea id="f-what" maxlength="1200">${esc(F.what || "")}</textarea></label>
      <label class="f">How I felt<input type="text" id="f-felt" maxlength="300" value="${esc(F.felt || "")}" placeholder="embarrassed and angry"></label>
      <label class="f">What I need<input type="text" id="f-need" maxlength="300" value="${esc(F.need || "")}" placeholder="for my things to be left alone"></label>
      <label class="f">My part. Did I do anything that added to it? Be honest. (If nothing, write “nothing.”)<textarea id="f-mypart" maxlength="600">${esc(F.myPart || "")}</textarea></label>
      <label class="f">What I'm asking for<input type="text" id="f-ask" maxlength="300" value="${esc(F.ask || "")}" placeholder="for them to apologize and give my cards back"></label>

      <p class="step" style="margin-top:18px"><i>5</i> Peace Talk</p>
      <button type="button" class="opt" data-tried="peace" aria-pressed="${F.tried === "peace"}">We had a Peace Talk, and it didn't fix it</button>
      <button type="button" class="opt" data-tried="waived" aria-pressed="${F.tried === "waived"}">A guide said I could skip the Peace Talk</button>
      ${F.tried === "waived" ? `<label class="f">Which guide?<input type="text" id="f-waived" maxlength="60" value="${esc(F.waivedBy || "")}"></label>` : ""}
      <p class="dim small" style="margin:6px 0 0">No Peace Talk yet? <a href="#peace">Plan one first</a>. Most problems end there.</p>

      <p class="step" style="margin-top:18px"><i>6</i> My promise</p>
      <label class="row" style="font-size:15px;align-items:flex-start"><input type="checkbox" id="f-pledge" ${F.pledge ? "checked" : ""} style="margin-top:4px"> <span>I promise this is true and complete, including my own part. I understand that making up a complaint on purpose goes to a guide.</span></label>
      ${cat ? `<p class="dim small" style="margin:12px 0 0">If the judge agrees, the usual way to make it right is: <b>${esc(C.RESTORES[cat.restore].t)}</b>.</p>` : ""}
      <div class="row" style="margin-top:14px"><button class="btn" type="button" data-submit>${F.editId ? "Refile" : "Send to the judge"}</button>${F.editId ? `<button class="ghost" type="button" data-canceledit>Cancel</button>` : ""}</div>
      <p class="err" id="ferr"></p>
    </div></section>`;
}

function caseBody(c, opts = {}) {
  const cat = C.CAT[c.cat] || { t: c.cat }, R = c.restore && C.RESTORES[c.restore];
  return `<div class="row" style="justify-content:space-between"><span class="pill">${esc(C.STATUS[c.status] || c.status)}</span><span class="meta">Filed ${esc(when(c.created))}${c.courtDay && c.status === "scheduled" ? " · Court " + esc(day(c.courtDay)) : ""}</span></div>
    <h3>${esc(opts.title || cat.t)}</h3>
    <dl>${opts.parties ? `<dt>Filed by</dt><dd>${esc(c.byName)}</dd><dt>About</dt><dd>${esc(c.againstName)}</dd>` : ""}
      <dt>Kind</dt><dd>${esc(cat.t)} (Tier ${esc(c.tier)})</dd>
      ${opts.full ? `<dt>What happened</dt><dd>${esc(c.what)}</dd><dt>Felt</dt><dd>${esc(c.felt)}</dd><dt>Needs</dt><dd>${esc(c.need)}</dd><dt>Their own part</dt><dd>${esc(c.myPart)}</dd><dt>Asking for</dt><dd>${esc(c.ask)}</dd><dt>Peace Talk</dt><dd>${c.tried === "waived" ? "Skipped with " + esc(c.waivedBy || "a guide") + "'s OK" : "Tried, didn't fix it"}</dd>` : ""}
      ${c.response && opts.response !== false ? `<dt>Other side</dt><dd>${esc(c.response)}</dd>` : ""}
      ${c.note ? `<dt>Judge's note</dt><dd>${esc(c.note)}</dd>` : ""}
      ${c.finding ? `<dt>Finding</dt><dd>${c.finding === "upheld" ? "Upheld" : c.finding === "not_upheld" ? "Not upheld" : "Passed to a guide"}${c.findingNote ? ": " + esc(c.findingNote) : ""}</dd>` : ""}
      ${R ? `<dt>Make it right</dt><dd><b>${esc(R.t)}</b>${c.restoreText ? "<br>" + esc(c.restoreText) : ""}${c.due ? `<br><span class="dim">Due by the end of ${esc(day(c.due))}</span>` : ""}</dd>` : ""}
      ${c.doneAt ? `<dt>Done</dt><dd>Marked done ${esc(when(c.doneAt))}${c.signedName ? ", signed off by " + esc(c.signedName) : ", waiting for a guide to sign off"}</dd>` : ""}
      ${c.appealStatus ? `<dt>Appeal</dt><dd>${c.appealStatus === "open" ? "With the guides" : c.appealStatus === "granted" ? "Granted: heard again" : "Not granted"}</dd>` : ""}
    </dl>`;
}

function sMine() {
  if (!isStudent() || k1()) return "";
  const appealOk = c => ["restoring", "not_upheld", "closed"].includes(c.status) && !c.appealStatus;
  const mine = MINE.slice().sort((a, z) => (z.updated || 0) - (a.updated || 0)), about = ABOUT.slice().sort((a, z) => (z.updated || 0) - (a.updated || 0));
  return `<section id="mine"><h2>My cases</h2>
    ${!LOADED ? `<p class="dim">Loading…</p>` : ""}
    ${about.length ? `<h3 style="margin:14px 0 4px">About me</h3><p class="dim small" style="margin:0">A classmate filed these and a judge set a court day. Court is private and fair: you'll get to tell your side without being interrupted.</p>
      ${about.map(c => `<article class="case s-${esc(c.status)}">${caseBody(c, { title: "From " + c.byName, response: true })}
        ${c.status === "scheduled" ? `<label class="f">Your side, before court (optional)<textarea data-resp="${esc(c.id)}" maxlength="1200">${esc(c.response || "")}</textarea></label><button class="ghost" type="button" data-sendresp="${esc(c.id)}">Save my side</button>` : ""}
        ${c.status === "restoring" && !c.doneAt ? `<div class="row" style="margin-top:8px"><button class="btn" type="button" data-done="${esc(c.id)}">I've made it right</button><span class="dim small">A guide checks it and signs it off.</span></div>` : ""}
        ${appealOk(c) ? appealBox(c) : ""}</article>`).join("")}` : ""}
    <h3 style="margin:14px 0 4px">Complaints I filed</h3>
    ${LOADED && !mine.length ? `<p class="empty">None. That's a good thing.</p>` : ""}
    ${mine.map(c => `<article class="case s-${esc(c.status)}">${caseBody(c, { title: "About " + c.againstName, response: false })}
      <div class="row">${c.status === "returned" ? `<button class="btn" type="button" data-edit="${esc(c.id)}">Fix and refile</button>` : ""}${OPEN.includes(c.status) ? `<button class="ghost" type="button" data-withdraw="${esc(c.id)}">Withdraw</button>` : ""}</div>
      ${appealOk(c) ? appealBox(c) : ""}</article>`).join("")}
  </section>`;
}
const appealBox = c => `<details style="margin-top:8px"><summary class="small dim">Ask the guides to look again</summary><label class="f">Why wasn't it fair? (Once per case.)<textarea data-appeal="${esc(c.id)}" maxlength="600"></textarea></label><button class="ghost" type="button" data-sendappeal="${esc(c.id)}">Send to the guides</button></details>`;

// ---------- the judge's docket ----------
function sDocket() {
  if (!MYROLE) return "";
  const judge = MYROLE.role === "judge", sid = MYROLE.sid || ME;
  // A judge never sees cases they're part of (the rules also stop them acting on one). Test view skips this, since
  // every test case is filed by the test student.
  const mineIn = c => !isTest() && (c.bySid === sid || c.againstSid === sid);
  const all = DOCKET.filter(c => !mineIn(c)), recused = DOCKET.filter(c => mineIn(c) && OPEN.includes(c.status)).length;
  const groups = { new: all.filter(c => c.status === "filed"), court: all.filter(c => c.status === "scheduled"), repair: all.filter(c => c.status === "restoring"), done: all.filter(c => !["filed", "scheduled", "restoring"].includes(c.status)) };
  const label = { new: "New", court: "Court day", repair: "Making it right", done: "Done" };
  const list = groups[DTAB].sort((a, z) => DTAB === "court" ? String(a.courtDay).localeCompare(z.courtDay) : (z.updated || 0) - (a.updated || 0));
  return `<section id="docket"><h2>${judge ? "Judge's" : "Clerk's"} docket</h2>
    <p class="lede">You serve grades ${esc((MYROLE.bands || []).join(" and "))}${MYROLE.until ? " until " + esc(day(MYROLE.until)) : ""}. ${judge ? "You check complaints, set court days, run hearings and decide." : "Clerks check complaints are complete and set court days. The judge runs hearings and decides."} Everything here is private.</p>
    ${recused ? `<p class="dim small">${recused} case${recused > 1 ? "s" : ""} you're part of ${recused > 1 ? "go" : "goes"} to another judge or a guide. You can't see or act on ${recused > 1 ? "them" : "it"}.</p>` : ""}
    <details class="box"><summary><b>How to run a hearing</b></summary><ol style="margin:8px 0 0;padding-left:20px;display:grid;gap:4px;font-size:14.5px">
      <li>Meet in a private spot with a guide nearby. No audience.</li>
      <li>Say the rules: one person talks at a time, no interrupting, tell the truth, be respectful.</li>
      <li>The person who filed speaks. Then the other person speaks.</li>
      <li>Ask questions to understand. Don't argue or take sides.</li>
      <li>Ask each: what do you need to make this right?</li>
      <li>Decide: is it more likely than not that it happened the way the complaint says? Explain your reason kindly.</li>
      <li>If it's upheld, agree the repair with both of them and write it as a SMART plan: “I will ___ for ___ by ___ so that ___.”</li>
      <li>If you learn it's about safety, or it was made up on purpose, stop and pass it to a guide.</li></ol></details>
    <div class="tabs" role="group" aria-label="Docket">${Object.keys(groups).map(k => `<button type="button" data-dtab="${k}" aria-pressed="${DTAB === k}">${label[k]}<span>${groups[k].length}</span></button>`).join("")}</div>
    ${list.length ? list.map(c => docketCard(c, judge)).join("") : `<p class="empty">Nothing here.</p>`}
  </section>`;
}
function flags(c) {
  const out = [], y0 = C.schoolYearStart();
  const counter = DOCKET.find(x => x.id !== c.id && x.bySid === c.againstSid && x.againstSid === c.bySid && Math.abs((x.created || 0) - (c.created || 0)) < 3 * 864e5);
  if (counter) out.push("Counter-complaint: they filed one about each other within 3 days. Hear them together, and tell a guide.");
  const prior = DOCKET.filter(x => x.id !== c.id && x.againstSid === c.againstSid && x.finding === "upheld" && (x.created || 0) >= y0);
  const same = prior.filter(x => x.cat === c.cat).length;
  if (prior.length) out.push(`${c.againstName} has had ${prior.length} upheld complaint${prior.length > 1 ? "s" : ""} this school year${same ? `, ${same} of the same kind` : ""}.`);
  const filed = DOCKET.filter(x => x.bySid === c.bySid && (x.created || 0) >= Date.now() - 14 * 864e5).length;
  if (filed >= 3) out.push(`${c.byName} has filed ${filed} complaints in two weeks. A guide may want to check in.`);
  return out;
}
function repeatFor(c) {
  const y0 = C.schoolYearStart();
  return DOCKET.filter(x => x.id !== c.id && x.againstSid === c.againstSid && x.cat === c.cat && x.finding === "upheld" && (x.created || 0) >= y0).length + 1;
}
function docketCard(c, judge) {
  const fl = flags(c), cat = C.CAT[c.cat] || {}, rk = c.restore || cat.restore || "ack", rep = repeatFor(c);
  return `<article class="case s-${esc(c.status)}">${caseBody(c, { parties: true, full: true, title: (cat.t || c.cat) })}
    ${fl.length ? `<div class="stop" style="background:#fff4dc;color:#5a3d00">${fl.map(esc).join("<br>")}</div>` : ""}
    ${c.status === "filed" ? `<div class="sheet" style="margin:10px 0 0;padding:14px 16px">
        <p class="dim small" style="margin:0 0 6px">Is it complete and true-sounding? Is it a Tier 1 or 2 problem between these two students? If it's about safety, pass it to a guide.</p>
        <label class="f">Court day<input type="date" data-cday="${esc(c.id)}" value="${esc(C.nextCourtDay())}"></label>
        <label class="f">Note to ${esc(c.byName)} (needed to send it back or pass it on)<input type="text" data-note="${esc(c.id)}" maxlength="300"></label>
        <div class="row"><button class="btn" type="button" data-accept="${esc(c.id)}">Accept and set court day</button><button class="ghost" type="button" data-return="${esc(c.id)}">Send back to fix</button><button class="ghost" type="button" data-refer="${esc(c.id)}">Pass to a guide</button></div>
        <p class="err" data-derr="${esc(c.id)}"></p></div>` : ""}
    ${c.status === "scheduled" ? (judge ? `<div class="sheet" style="margin:10px 0 0;padding:14px 16px">
        <p class="step"><i>⚖</i> Finding</p>
        <button type="button" class="opt" data-find="${esc(c.id)}:upheld" aria-pressed="${F["find" + c.id] === "upheld"}">Upheld: it more likely than not happened this way</button>
        <button type="button" class="opt" data-find="${esc(c.id)}:not_upheld" aria-pressed="${F["find" + c.id] === "not_upheld"}">Not upheld</button>
        <button type="button" class="opt" data-find="${esc(c.id)}:false" aria-pressed="${F["find" + c.id] === "false"}">Made up on purpose: pass to a guide</button>
        <button type="button" class="opt" data-find="${esc(c.id)}:refer" aria-pressed="${F["find" + c.id] === "refer"}">It's about safety, or too big for court: pass to a guide</button>
        ${F["find" + c.id] === "upheld" ? `<label class="f">Tier<select data-tier="${esc(c.id)}"><option value="1" ${c.tier === 1 ? "selected" : ""}>Tier 1: it got in the way</option><option value="2" ${c.tier === 2 ? "selected" : ""}>Tier 2: it caused real harm</option></select></label>
          <label class="f">How they'll make it right<select data-restore="${esc(c.id)}">${Object.keys(C.RESTORES).map(k => `<option value="${k}" ${k === rk ? "selected" : ""}>${esc(C.RESTORES[k].t)}</option>`).join("")}</select></label>
          <p class="dim small" style="margin:0">${esc(C.RESTORES[rk].how)}</p>
          <label class="f">The SMART plan, agreed with both: “I will ___ for ___ by ___ so that ___.”<textarea data-rtext="${esc(c.id)}" maxlength="600"></textarea></label>
          <label class="f">Due by the end of<input type="date" data-due="${esc(c.id)}" value="${esc(C.nextSchoolDay())}"></label>
          <label class="f">What was underneath it? (For the guides: a need, a misunderstanding, a pattern.)<input type="text" data-root="${esc(c.id)}" maxlength="300"></label>
          <p class="dim small" style="margin:0">${esc(C.REPEAT[Math.min(rep, 3) - 1])}</p>` : ""}
        ${F["find" + c.id] ? `<label class="f">Your reason, in a sentence or two<input type="text" data-fnote="${esc(c.id)}" maxlength="300"></label>
          <div class="row"><button class="btn" type="button" data-decide="${esc(c.id)}">Record the finding</button></div>` : ""}
        <p class="err" data-derr="${esc(c.id)}"></p></div>` : `<p class="dim small">Waiting for the judge's hearing on ${esc(day(c.courtDay))}.</p>`) : ""}
  </article>`;
}

function sHow() {
  return `<section id="how"><h2>How court works</h2>
    <p class="lede">Court is for problems between two students in grades 2 to 8 that a Peace Talk didn't fix. It's never for things someone can't help yet (Tier 0), and never for safety problems (Tier 3), which go straight to a guide.</p>
    <ol class="steps">${C.STEPS.map(s => `<li><b>${esc(s[0])}</b>${esc(s[1])}</li>`).join("")}</ol>
    <div class="box"><b>Who serves</b>${judgesFor(BAND).length ? `<ul style="margin:6px 0 0;padding-left:20px">${judgesFor(BAND).map(r => `<li>${esc(short(r.name))}: ${r.role === "judge" ? "judge" : "clerk"}${r.until ? `, until ${esc(when(new Date(r.until + "T12:00").getTime()))}` : ""}</li>`).join("")}</ul>` : `<p class="dim small" style="margin:6px 0 0">${k1() ? "Student Court is for grades 2 to 8." : "Guides haven't appointed a judge for these grades yet. Until they do, a guide hears complaints."}</p>`}
      <p class="dim small" style="margin:8px 0 0">Staff appoint judges and clerks for a term. A judge never hears a case they're part of.</p></div>
    <div class="box"><b>Ways to make it right</b><ul style="margin:6px 0 0;padding-left:20px;display:grid;gap:6px;font-size:14.5px">${Object.values(C.RESTORES).map(r => `<li><b>${esc(r.t)}.</b> ${esc(r.how)}</li>`).join("")}</ul></div>
    <div class="box"><b>If it happens again</b><ul style="margin:6px 0 0;padding-left:20px;font-size:14.5px">${C.REPEAT.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
      <p class="dim small" style="margin:8px 0 0">More support, not more punishment. The tier rules in <a href="/code/#tiers">Our Code</a> still apply: guides respond to Tier 1 and 2 behavior when it happens, whether or not anyone files.</p></div>
    <div class="box"><b>Fair for everyone</b><ul style="margin:6px 0 0;padding-left:20px;font-size:14.5px;display:grid;gap:4px">
      <li>The other student only sees a complaint once a judge accepts it, and always gets to tell their side.</li>
      <li>Hearings are private. Never talk about someone's case with other students.</li>
      <li>Making up a complaint on purpose, or filing to get back at someone, goes to a guide.</li>
      <li>If you think a finding wasn't fair, either of you can ask the guides to look again, once.</li>
      <li>Things a classmate can't help, like fidgeting, humming or blurting, are never for court.</li></ul></div>
  </section>`;
}

function bandPicker() {
  const wrap = $("#bandpick"), box = $("#bands");
  if (isStudent()) { wrap.hidden = true; return; }
  wrap.hidden = false;
  box.innerHTML = ["K–1", "2–4", "5–8"].map(b => `<button class="chip" type="button" data-band="${b}" aria-pressed="${b === BAND}">${b}</button>`).join("");
}
function draw() {
  $("#app").innerHTML = (isStudent() && ABOUT.some(c => c.status === "scheduled") ? `<div class="box" style="border-color:var(--warn)"><b>You have a court day.</b> <a href="#mine">See it and tell your side</a>.</div>` : "")
    + (MYROLE && DOCKET.some(c => c.status === "filed") ? `<div class="box" style="border-color:var(--lamp)"><b>New complaints are waiting.</b> <a href="#docket">Open your docket</a>.</div>` : "")
    + sHelp() + sPeace() + sFile() + sMine() + sDocket() + sHow();
  const dl = document.querySelector("[data-docket]"); if (dl) dl.hidden = !MYROLE;
  document.querySelectorAll('.sub a[href="#file"],.sub a[href="#mine"]').forEach(a => { a.hidden = k1() || (!isStudent() && a.getAttribute("href") === "#mine"); });
  if (location.hash && !draw._jumped && LOADED) { draw._jumped = true; const el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(() => el.scrollIntoView(), 60); }
}
function redraw(id) { const y = scrollY; draw(); if (id) { const el = document.getElementById(id); if (el) el.scrollIntoView(); } else scrollTo(0, y); }

// Keep what's typed in the complaint form when the page redraws.
function keepForm() {
  const v = id => { const el = document.getElementById(id); return el ? el.value : undefined; };
  const c = id => { const el = document.getElementById(id); return el ? el.checked : undefined; };
  [["what", "f-what"], ["felt", "f-felt"], ["need", "f-need"], ["myPart", "f-mypart"], ["ask", "f-ask"], ["waivedBy", "f-waived"], ["against", "f-against"]].forEach(([k, id]) => { const x = v(id); if (x !== undefined) F[k] = x; });
  [["calm", "f-calm"], ["notsafety", "f-notsafety"], ["pledge", "f-pledge"]].forEach(([k, id]) => { const x = c(id); if (x !== undefined) F[k] = x; });
  if (F.peace) { const d = v("pt-did"), a = v("pt-ask"); if (d !== undefined) F.peace.did = d; if (a !== undefined) F.peace.ask = a; }
}
document.addEventListener("input", e => {
  if (e.target.id === "pt-did" || e.target.id === "pt-ask") { keepForm(); const p = F.peace; const el = $("#pt-line"); if (el) el.textContent = "“" + `When you ${p.did || "___"}, I felt ${p.feel.length ? p.feel.join(" and ").toLowerCase() : "___"}${p.need.length ? ", because I need " + p.need.join(" and ").toLowerCase() : ""}. Next time, could you ${p.ask || "___"}?` + "”"; }
});

async function save(path, data, okMsg) {
  try { await FSX.patch(path, data); if (okMsg) toast(okMsg); return true; }
  catch (e) { toast(e.status === 403 ? "That isn't allowed. If you think it should be, ask a guide." : "Couldn't save. Check your connection and try again."); return false; }
}
const find = id => DOCKET.find(c => c.id === id) || MINE.find(c => c.id === id) || ABOUT.find(c => c.id === id);
const touch = (c, d) => Object.assign(c, d);

document.addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b) return;
  keepForm();
  const D = b.dataset;
  if (D.band) { BAND = D.band; bandPicker(); draw(); return; }
  // Tell a guide
  if (D.help !== undefined) { F.help = D.help; redraw("help"); return; }
  if (b.hasAttribute("data-sendhelp")) {
    if (!isStudent()) return;
    const i = F.help, text = ($("#h-text") || {}).value || "";
    const what = i === "self" ? "Having a really hard time, or thinking about self-harm" : i === "other" ? "Something they want a guide to know" : C.TIER3[+i];
    const category = i === "self" ? "self_harm" : i === "6" ? "harmed_by_others" : "student_report";
    const severity = i === "other" || i === "2" ? "high" : "urgent";
    const a = { uid: FSX.user().uid, email: isTest() ? (window.WLPeople.TEST || {}).student : myEmail(), name: MYNAME, band: BAND, category, severity, status: "open", at: Date.now(),
      reason: "Sent from Student Court › Tell a guide: " + what, quote: text.trim().slice(0, 600), source: "court" };
    if (isTest()) a.test = true;
    b.disabled = true;
    try { await FSX.create("aiAlerts", a); F.help = ""; toast("Sent. A guide will find you soon."); redraw("help"); }
    catch (x) { b.disabled = false; $("#herr").textContent = "Couldn't send. Please tell a guide in person."; }
    return;
  }
  // Peace Talk
  if (D.feel || D.need) {
    const p = F.peace, arr = D.feel ? p.feel : p.need, v = D.feel || D.need, i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else arr.push(v);
    redraw("peace"); return;
  }
  if (b.hasAttribute("data-peacehelp")) {
    if (!isStudent()) return;
    if (window.wlNotifyGuides) window.wlNotifyGuides({ kind: "court", text: `${MYNAME || "A student"} would like help with a Peace Talk`, link: "/guides/court/" });
    toast("Your guides know. One of them will help you find a time.");
    return;
  }
  // Filing
  if (D.cat) { F.cat = D.cat; redraw("file"); return; }
  if (D.tried) { F.tried = D.tried; redraw("file"); return; }
  if (b.hasAttribute("data-newcase")) { Object.keys(F).forEach(k => { if (!["peace", "help"].includes(k)) delete F[k]; }); redraw("file"); return; }
  if (b.hasAttribute("data-canceledit")) { Object.keys(F).forEach(k => { if (!["peace", "help"].includes(k)) delete F[k]; }); redraw("mine"); return; }
  if (b.hasAttribute("data-submit")) return submit(b);
  if (D.edit) {
    const c = MINE.find(x => x.id === D.edit); if (!c) return;
    Object.assign(F, { editId: c.id, against: c.againstSid, againstName: c.againstName, cat: c.cat, what: c.what, felt: c.felt, need: c.need, myPart: c.myPart, ask: c.ask, tried: c.tried, waivedBy: c.waivedBy, calm: false, notsafety: false, pledge: false, sent: false });
    redraw("file"); return;
  }
  if (D.withdraw) {
    const c = MINE.find(x => x.id === D.withdraw); if (!c) return;
    if (await save("courtCases/" + c.id, { status: "withdrawn", updated: Date.now() }, "Withdrawn.")) {
      touch(c, { status: "withdrawn" });
      if (c.status === "scheduled" || c.judgeEmail) tell(judgesFor(c.band).map(r => r.id), `${c.byName} withdrew a complaint`, "/court/#docket");
      redraw("mine");
    }
    return;
  }
  if (D.sendresp) {
    const c = ABOUT.find(x => x.id === D.sendresp), t = (document.querySelector(`[data-resp="${D.sendresp}"]`) || {}).value || "";
    if (c && await save("courtCases/" + c.id, { response: t.trim(), respondedAt: Date.now(), updated: Date.now() }, "Saved. The judge will read it before court.")) touch(c, { response: t.trim() });
    return;
  }
  if (D.done) {
    const c = ABOUT.find(x => x.id === D.done); if (!c) return;
    if (await save("courtCases/" + c.id, { doneAt: Date.now(), updated: Date.now() }, "Thanks. A guide will check it and sign it off.")) {
      touch(c, { doneAt: Date.now() }); tell(bandGuides(c.band), `Student Court repair ready to sign off: ${c.againstName}`, "/guides/court/#repairs"); redraw("mine");
    }
    return;
  }
  if (D.sendappeal) {
    const id = D.sendappeal, c = find(id), t = ((document.querySelector(`[data-appeal="${id}"]`) || {}).value || "").trim();
    if (!c) return; if (t.length < 10) { toast("Say a little more about why it wasn't fair."); return; }
    if (await save("courtCases/" + id, { appeal: t, appealBy: myEmail(), appealAt: Date.now(), appealStatus: "open", updated: Date.now() }, "Sent. The guides will look at it.")) {
      touch(c, { appealStatus: "open" }); tell(bandGuides(c.band), `A Student Court finding was appealed (grades ${c.band})`, "/guides/court/#appeals"); redraw("mine");
    }
    return;
  }
  // Docket
  if (D.dtab) { DTAB = D.dtab; redraw("docket"); return; }
  if (D.accept || D.return || D.refer) return triage(b, D.accept ? "scheduled" : D.return ? "returned" : "referred", D.accept || D.return || D.refer);
  if (D.find) { const [id, v] = D.find.split(":"); F["find" + id] = v; redraw("docket"); const el = document.querySelector(`[data-find="${D.find}"]`); if (el) el.scrollIntoView({ block: "center" }); return; }
  if (D.decide) return decide(b, D.decide);
});
document.addEventListener("change", e => {
  if (e.target.matches("[data-restore]")) { const p = e.target.closest(".sheet").querySelector("p.dim.small"); const r = C.RESTORES[e.target.value]; if (p && r) p.textContent = r.how; }
  if (e.target.id === "f-against") F.against = e.target.value;
});

async function submit(b) {
  const err = t => { $("#ferr").textContent = t; };
  const who = F.editId ? { id: F.against, name: F.againstName } : BOARD.find(x => x.id === F.against);
  if (!F.calm) return err("Wait until you're calm, then check the first box.");
  if (!F.notsafety) return err("If it's about safety, tell a guide instead. If it isn't, check the second box.");
  if (!who) return err("Choose who it's about.");
  if (!F.cat) return err("Choose what kind of problem it is.");
  if (String(F.what || "").trim().length < 20) return err("Tell what happened in a little more detail.");
  if (!String(F.felt || "").trim() || !String(F.need || "").trim() || !String(F.ask || "").trim()) return err("Fill in how you felt, what you need and what you're asking for.");
  if (!String(F.myPart || "").trim()) return err("Write your part, or “nothing.”");
  if (!F.tried) return err("Say whether you had a Peace Talk, or a guide said you could skip it.");
  if (F.tried === "waived" && !String(F.waivedBy || "").trim()) return err("Say which guide said you could skip the Peace Talk.");
  if (!F.pledge) return err("Check the promise box.");
  const cat = C.CAT[F.cat], now = Date.now();
  const text = { cat: F.cat, tier: cat.tier, what: F.what.trim(), felt: F.felt.trim(), need: F.need.trim(), myPart: F.myPart.trim(), ask: F.ask.trim(), tried: F.tried, waivedBy: F.tried === "waived" ? F.waivedBy.trim() : "" };
  b.disabled = true; err("");
  try {
    if (F.editId) {
      await FSX.patch("courtCases/" + F.editId, { ...text, status: "filed", updated: now });
      const c = MINE.find(x => x.id === F.editId); if (c) Object.assign(c, text, { status: "filed", updated: now });
    } else {
      const d = { bySid: ME, byEmail: myEmail(), byName: short(MYNAME) || "A student", band: BAND, againstSid: who.id, againstName: short(who.name), ...text, pledge: true, status: "filed", created: now, updated: now };
      if (isTest()) d.test = true;
      const made = await FSX.create("courtCases", d); MINE.unshift(made);
    }
    const judges = judgesFor(BAND).map(r => r.id);
    tell(judges, `A complaint is waiting for the judge (grades ${BAND})`, "/court/#docket");
    tell(bandGuides(BAND), `New Student Court complaint (grades ${BAND})${judges.length ? "" : ": no judge is appointed yet"}`, "/guides/court/");
    const keep = F.peace; Object.keys(F).forEach(k => delete F[k]); F.peace = keep; F.sent = true;
    toast("Sent to the judge."); redraw("file");
  } catch (x) { b.disabled = false; err(x.status === 403 ? "Court couldn't take this complaint. Ask your guide to check you're on the roster for your grades." : "Couldn't send. Check your connection and try again."); }
}

async function triage(b, status, id) {
  const c = DOCKET.find(x => x.id === id); if (!c) return;
  const note = ((document.querySelector(`[data-note="${id}"]`) || {}).value || "").trim(), cday = (document.querySelector(`[data-cday="${id}"]`) || {}).value || "";
  const errEl = document.querySelector(`[data-derr="${id}"]`);
  if (status !== "scheduled" && note.length < 5) { errEl.textContent = "Write a short note saying why."; return; }
  if (status === "scheduled" && !cday) { errEl.textContent = "Pick a court day."; return; }
  const d = { status, judgeEmail: myEmail(), judgeName: short(MYROLE.name), note, updated: Date.now() };
  if (status === "scheduled") d.courtDay = cday;
  b.disabled = true;
  if (!await save("courtCases/" + id, d)) { b.disabled = false; return; }
  touch(c, d);
  const msg = status === "scheduled" ? `The judge set your court day: ${day(cday)}` : status === "returned" ? "The judge sent your complaint back to fix" : "The judge passed your complaint to a guide";
  tell([c.byEmail], msg, "/court/#mine");
  tell(bandGuides(c.band), status === "scheduled" ? `Student Court on ${day(cday)}: ${c.byName} and ${c.againstName}. Please let ${c.againstName} know.` : status === "referred" ? `A Student Court complaint was passed to you: ${c.byName} about ${c.againstName}` : `A Student Court complaint was sent back to ${c.byName}`, "/guides/court/");
  toast(status === "scheduled" ? "Court day set." : status === "returned" ? "Sent back." : "Passed to a guide.");
  redraw("docket");
}

async function decide(b, id) {
  const c = DOCKET.find(x => x.id === id); if (!c || MYROLE.role !== "judge") return;
  const v = F["find" + id], q = s => document.querySelector(`[data-${s}="${id}"]`), errEl = q("derr");
  const reason = (q("fnote").value || "").trim();
  if (reason.length < 5) { errEl.textContent = "Write your reason."; return; }
  const d = { judgeEmail: myEmail(), judgeName: short(MYROLE.name), findingNote: reason, heardAt: Date.now(), updated: Date.now() };
  if (v === "upheld") {
    const rt = (q("rtext").value || "").trim(), due = q("due").value;
    if (rt.length < 15) { errEl.textContent = "Write the SMART plan you agreed."; return; }
    if (!due) { errEl.textContent = "Pick when it's due."; return; }
    Object.assign(d, { status: "restoring", finding: "upheld", tier: +q("tier").value, restore: q("restore").value, restoreText: rt, due, root: (q("root").value || "").trim(), repeat: repeatFor(c) });
  } else if (v === "not_upheld") Object.assign(d, { status: "not_upheld", finding: "not_upheld" });
  else Object.assign(d, { status: "referred", finding: v === "false" ? "false" : "referred" });
  b.disabled = true;
  if (!await save("courtCases/" + id, d)) { b.disabled = false; return; }
  touch(c, d);
  const fn = { upheld: "upheld", not_upheld: "not upheld", false: "passed to a guide", refer: "passed to a guide" }[v];
  tell([c.byEmail], `Court decided your complaint: ${fn}`, "/court/#mine");
  tell(bandGuides(c.band), v === "upheld" ? `Student Court: ${c.againstName} makes it right by ${day(d.due)} (${C.RESTORES[d.restore].t}). Sign off when it's done.${d.repeat > 1 ? " Repeat #" + d.repeat + " of this kind." : ""}`
    : v === "not_upheld" ? `Student Court: complaint not upheld (${c.byName} about ${c.againstName})` : v === "false" ? `Student Court: the judge thinks ${c.byName}'s complaint was made up on purpose. Please follow up.` : `Student Court: a case needs a guide (${c.byName} and ${c.againstName})`, "/guides/court/");
  delete F["find" + id];
  toast("Finding recorded."); redraw("docket");
}

// ---------- start ----------
async function start(r) {
  ROLE = r && r.role ? r : null;
  BAND = isStudent() && ROLE.band ? ROLE.band : (window.wlBand ? window.wlBand({}) : "5–8");
  bandPicker(); LOADED = false; draw();
  if (ROLE) await load(); else LOADED = true;
  draw();
}
let started = "";
document.addEventListener("wl-role", e => { const k = JSON.stringify(e.detail || null); if (k === started) return; started = k; start(e.detail); });
if (window.wlRole !== undefined) { started = JSON.stringify(window.wlRole || null); start(window.wlRole); }
else start(null);
