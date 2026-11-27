// Wilderland staff training: one quiz engine for every training module (Mentor Mindset, Life Skills, Parent
// Communication, the onboarding journey and the policy knowledge checks). The Behavior badges use deal() from here.
//
// No memorizing your way through: every quiz has (at least) three different sets of questions. Each attempt takes
// the next set in turn, with the questions and their options in a new order, so a retake after a fail never repeats
// the questions just seen. An attempt counts as soon as it starts, so reloading mid-quiz moves on to the next set too.
// Policy checks go further: their questions are written fresh by the AI from the policy text each time (the policies
// are private, so no question bank about them can live in this public repo).
//
// Progress lives in Firestore at behaviorProgress/{uid} (the same staff-only document as the Behavior badges, which
// existing rules already allow: owners write, admins read). Fields written here, always with merge so nothing else
// in the document is touched: training.{quizId} = { attempts, best, total, passed, at, set }, journey.read.{lessonId}.
// A result that can't reach the account (offline) is kept until it can, then sent up on the next load.
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";

export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Split a pool into n separate sets of (nearly) equal size, spreading each kind (key) evenly across them. The split
// depends only on the pool's order, so it is the same on every device and every visit.
export function deal(pool, key = () => "", n = 3) {
  const sets = Array.from({ length: n }, () => []), per = Array.from({ length: n }, () => ({}));
  pool.forEach(item => {
    const k = key(item); let best = 0;
    for (let i = 1; i < n; i++) {
      const a = sets[i].length, b = sets[best].length;
      if (a < b || (a === b && (per[i][k] || 0) < (per[best][k] || 0))) best = i;
    }
    sets[best].push(item); per[best][k] = (per[best][k] || 0) + 1;
  });
  return sets;
}
// [prompt, [options], correctIndex, why] → the engine's question shape.
export const fromRows = rows => rows.map(r => ({ p: r[0], o: r[1], a: r[2], w: r[3] }));

// ---------------- who and where ----------------
const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function ready() {
  while (!window.wlFirebase) await sleep(50);
  const fb = window.wlFirebase;
  if (fb.auth.authStateReady) await fb.auth.authStateReady();
  return fb.auth.currentUser;
}
const fbUser = () => window.wlFirebase && window.wlFirebase.auth.currentUser;
let _db = null; const db = () => _db || (_db = getFirestore(window.wlFirebase.app));
const LKEY = () => "wl-train-" + ((fbUser() && fbUser().uid) || "anon");
const local = { get() { try { return JSON.parse(localStorage.getItem(LKEY()) || "{}"); } catch (e) { return {}; } }, set(v) { try { localStorage.setItem(LKEY(), JSON.stringify(v)); } catch (e) { } } };
const isObj = v => v && typeof v === "object" && !Array.isArray(v);
function deepMerge(a, b) { const o = Object.assign({}, a); for (const k in b) o[k] = isObj(o[k]) && isObj(b[k]) ? deepMerge(o[k], b[k]) : b[k]; return o; }

// ---------------- progress ----------------
let cache = null, cacheFor = null;
export async function loadProgress(force) {
  const u = await ready();
  if (cache && !force && cacheFor === (u && u.uid)) return cache;
  let p = local.get();
  if (u) {
    try {
      const s = await getDoc(doc(db(), "behaviorProgress", u.uid)), remote = s.exists() ? s.data() : {};
      // A result that couldn't reach the account when it was taken (offline) goes up now.
      const up = {};
      ["training", "badges"].forEach(st => Object.entries(p[st] || {}).forEach(([id, rec]) => {
        const r = (remote[st] || {})[id];
        if (rec && rec.at && (!r || !r.at || rec.at > r.at)) (up[st] = up[st] || {})[id] = rec;
      }));
      if (Object.keys(up).length) { try { await setDoc(doc(db(), "behaviorProgress", u.uid), { ...up, updated: Date.now() }, { merge: true }); } catch (e) { } }
      p = deepMerge(p, remote);
      Object.keys(up).forEach(st => { p[st] = deepMerge(p[st] || {}, up[st]); });
    } catch (e) { /* offline: the copy kept until the account can be reached */ }
  }
  cache = p; cacheFor = u && u.uid; return p;
}
export async function saveProgress(patch) {
  const u = await ready();
  cache = deepMerge(cache || {}, patch); local.set(deepMerge(local.get(), patch));
  if (!u) return false;
  try { await setDoc(doc(db(), "behaviorProgress", u.uid), { ...patch, name: u.displayName || u.email || "", email: (u.email || "").toLowerCase(), updated: Date.now() }, { merge: true }); return true; }
  catch (e) { return false; }
}
export const trainingRec = (p, id, store) => (p && p[store || "training"] && p[store || "training"][id]) || {};
// cfg.store: where a quiz's record lives. "training" (default), or "badges" for the Behavior badges taken in onboarding,
// so they count the same as in the Behavior Guide (same record, same attempts, so the sets keep taking turns).

// ---------------- the quiz view ----------------
const CSS = `
.wlq{display:flex;flex-direction:column;gap:14px}
.wlq .wlq-k{font:700 12px/1.2 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin:0}
.wlq .wlq-q{font-size:19px;font-weight:600;line-height:1.4;margin:0}
.wlq .wlq-ctx{opacity:.8;margin:0}
.wlq .wlq-opts{display:flex;flex-direction:column;gap:8px}
.wlq .wlq-opts button{text-align:left;font:inherit;color:inherit;background:transparent;border:1.5px solid color-mix(in srgb,currentColor 22%,transparent);border-radius:12px;padding:11px 14px;cursor:pointer;line-height:1.4}
.wlq .wlq-opts button:hover:not(:disabled){border-color:color-mix(in srgb,currentColor 55%,transparent)}
.wlq .wlq-opts button:disabled{cursor:default}
.wlq .wlq-opts button.right{border-color:#00a34a;background:rgba(0,180,81,.13)}
.wlq .wlq-opts button.wrong{border-color:#d4373d;background:rgba(229,72,77,.12)}
.wlq .wlq-why{margin:0;padding:10px 14px;border-radius:12px;background:color-mix(in srgb,currentColor 6%,transparent)}
.wlq .wlq-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.wlq .wlq-btn{font:600 15px Inter,system-ui,sans-serif;border:0;border-radius:999px;padding:10px 18px;cursor:pointer;background:#00b451;color:#05170f;text-decoration:none;display:inline-block}
.wlq .wlq-btn.ghost{background:transparent;color:inherit;border:1.5px solid color-mix(in srgb,currentColor 30%,transparent)}
.wlq .wlq-btn:disabled{opacity:.55;cursor:default}
.wlq .wlq-big{font-size:34px;font-weight:700;margin:0}
.wlq .wlq-dim{opacity:.75;margin:0}
.wlq .wlq-bar{height:6px;border-radius:999px;background:color-mix(in srgb,currentColor 12%,transparent);overflow:hidden}
.wlq .wlq-bar i{display:block;height:100%;background:#00b451;transition:width .2s}
.wlq .wlq-src{font-size:14px;opacity:.8;margin:0;font-style:italic}`;
function css() { if (document.getElementById("wlq-css")) return; const s = document.createElement("style"); s.id = "wlq-css"; s.textContent = CSS; document.head.appendChild(s); }
function h(tag, attrs, kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else if (k.startsWith("on")) e[k] = attrs[k]; else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]); }
  (kids || []).forEach(c => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return e;
}
const put = (e, ...k) => e.append(...k.filter(Boolean));
const status = (rec, pass) => rec.passed ? `✓ Passed${rec.best != null ? ` · best ${rec.best}/${rec.total}` : ""}` : rec.attempts ? `Not passed yet${rec.best != null ? ` · best ${rec.best}/${rec.total}` : ""} · ${rec.attempts} ${rec.attempts === 1 ? "try" : "tries"}` : `Not started · pass with ${pass}`;

// Mount a quiz with fixed question sets.
//   cfg: { id, name, pass, sets: [[{p, o, a, w, ctx}], ...], intro?, onDone?(rec) }
export async function mountQuiz(el, cfg) {
  css(); el.classList.add("wlq"); el.innerHTML = "";
  el.appendChild(h("p", { class: "wlq-dim", text: "Loading…" }));
  const p = await loadProgress();
  const rec = () => trainingRec(cache || p, cfg.id, cfg.store);
  const start = async () => {
    el.querySelectorAll("button").forEach(b => { b.disabled = true; });
    const r = rec(), n = r.attempts || 0, set = n % cfg.sets.length;
    await saveProgress({ [cfg.store || "training"]: { [cfg.id]: { ...rec(), attempts: n + 1, set, at: Date.now() } } });
    run(el, shuffle(cfg.sets[set]).map(q => { if (q.keep) return q; const order = shuffle(q.o.map((t, i) => i)); return { ...q, o: order.map(i => q.o[i]), a: order.indexOf(q.a) }; }), cfg, intro, start);
  };
  const intro = () => {
    const r = rec(); el.innerHTML = "";
    put(el, h("p", { class: "wlq-k", text: status(r, cfg.pass) }),
      cfg.intro ? h("p", { class: "wlq-dim", text: cfg.intro }) : null,
      h("p", { class: "wlq-dim", text: `${cfg.sets[0].length} questions. Pass with ${cfg.pass}. ${r.attempts ? "Each try uses a different set of questions." : "If you don't pass, the next try uses a different set of questions."}` }),
      h("div", { class: "wlq-row" }, [h("button", { class: "wlq-btn", text: r.passed ? "Take it again" : r.attempts ? "Try again" : "Start", onclick: start })]));
  };
  intro();
}

// Run one attempt over the given questions, then save the result.
function run(el, qs, cfg, back, again) {
  let i = 0, score = 0;
  const show = async () => {
    el.innerHTML = "";
    if (i >= qs.length) {
      const passed = score >= cfg.pass, prev = trainingRec(cache, cfg.id, cfg.store);
      const r = { best: Math.max(prev.best || 0, score), total: qs.length, passed: !!(prev.passed || passed), at: Date.now(), last: score };
      const saved = await saveProgress({ [cfg.store || "training"]: { [cfg.id]: { ...prev, ...r } } });
      put(el, h("p", { class: "wlq-k", text: passed ? "Passed" : "Not yet" }), h("p", { class: "wlq-big", text: `${score} / ${qs.length}` }),
        h("p", { class: "wlq-dim", text: passed ? (cfg.passText || "Nice work. Your result is saved to your account.") : `You need ${cfg.pass}. Read back over what you missed, then try again. The next try uses different questions.` }),
        saved ? null : h("p", { class: "wlq-dim", text: "Your account couldn't be reached just now. This result goes to your account the next time you open training with a connection." }),
        h("div", { class: "wlq-row" }, [h("button", { class: "wlq-btn" + (passed ? " ghost" : ""), text: passed ? "Back" : "Try again with new questions", onclick: passed || !again ? back : again })]));
      if (cfg.onDone) cfg.onDone(trainingRec(cache, cfg.id, cfg.store), passed);
      return;
    }
    const q = qs[i], opts = h("div", { class: "wlq-opts" }), after = h("div", { class: "wlq-row" });
    put(el, h("div", { class: "wlq-bar" }, [h("i", { style: `width:${Math.round(i / qs.length * 100)}%` })]),
      h("p", { class: "wlq-k", text: `Question ${i + 1} of ${qs.length}` }), q.ctx ? h("p", { class: "wlq-ctx", text: q.ctx }) : null, h("p", { class: "wlq-q", text: q.p }), opts, after);
    q.o.forEach((t, j) => opts.appendChild(h("button", { type: "button", text: t, onclick: e => {
      const right = j === q.a; if (right) score++;
      opts.querySelectorAll("button").forEach((b, k) => { b.disabled = true; if (k === q.a) b.classList.add("right"); });
      if (!right) e.currentTarget.classList.add("wrong");
      after.before(h("p", { class: "wlq-why", text: (right ? "Yes. " : "Not quite. ") + (q.w || "") }));
      if (q.src) after.before(h("p", { class: "wlq-src", text: "From the policy: “" + q.src + "”" }));
      const nx = h("button", { class: "wlq-btn", text: i + 1 < qs.length ? "Next" : "See my result", onclick: () => { i++; show(); } });
      after.appendChild(nx); nx.focus();
    } })));
  };
  show();
}

// ---------------- policy knowledge checks ----------------
// The policies live in Cloudflare KV behind the relay (staff only), never in this repo. Each check reads one part of
// the document (a different part on each try), asks the AI for questions, and keeps only questions whose supporting
// sentence really appears in the policy text, word for word.
let relayUrl = null; const docText = {};
async function relay() {
  if (relayUrl !== null) return relayUrl;
  try { const s = await getDoc(doc(db(), "mentorConfig", "main")); relayUrl = s.exists() ? (s.data().relay || "") : ""; } catch (e) { relayUrl = ""; }
  return relayUrl;
}
async function callRelay(body) {
  const url = await relay(), u = fbUser();
  if (!url) throw new Error("The AI isn't connected yet. Ask an admin.");
  if (!u) throw new Error("Sign in first.");
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + await u.getIdToken() }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(r.status === 429 ? "The AI is busy. Wait a minute and try again." : r.status === 403 ? "Policy checks are for Wilderland staff accounts." : j.error || "The AI didn't answer. Try again.");
  return j;
}
// Sections by markdown heading (## and ###), gathered into parts of a readable size.
export function policyParts(md, min = 5000, max = 16000) {
  const secs = []; let cur = null;
  String(md).split("\n").forEach(line => {
    const m = /^(#{1,3})\s+(.*)$/.exec(line);
    if (m && m[1].length >= 2) { cur = { title: m[2].trim(), text: line + "\n" }; secs.push(cur); }
    else if (cur) cur.text += line + "\n";
    else { cur = { title: "", text: line + "\n" }; secs.push(cur); }
  });
  const parts = []; let p = null;
  secs.filter(s => s.text.trim().length > 200).forEach(s => {
    if (!p || (p.text.length >= min) || (p.text.length + s.text.length > max)) { p = { titles: [], text: "" }; parts.push(p); }
    p.titles.push(s.title); p.text += s.text;
  });
  if (parts.length > 1 && parts[parts.length - 1].text.length < 1500) { const l = parts.pop(); parts[parts.length - 1].titles.push(...l.titles); parts[parts.length - 1].text += l.text; }
  return parts.map(x => ({ ...x, text: x.text.slice(0, max + 4000) }));
}
const norm = s => String(s || "").replace(/[*_`#>]/g, "").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
export function checkQuestions(raw, text) {
  const t = norm(text), out = [];
  (raw || []).forEach(q => {
    if (!q || typeof q.q !== "string" || !Array.isArray(q.options) || q.options.length < 3 || q.options.length > 5) return;
    const a = Number(q.answer); if (!(a >= 0 && a < q.options.length)) return;
    const opts = q.options.map(String); if (new Set(opts.map(norm)).size !== opts.length) return;
    const quote = String(q.quote || "").trim(), nq = norm(quote).replace(/^"|"$/g, "");
    if (nq.length < 25 || !t.includes(nq)) return;   // the proof has to be really in the policy
    out.push({ p: q.q, o: opts, a, w: q.why ? String(q.why) : "", src: quote.replace(/^["“]|["”]$/g, "") });
  });
  return out;
}
const POLICY_SYSTEM = `You write short knowledge checks for the staff of Wilderland Academy, a nature-based K-8 microschool, from an excerpt of one of the school's own policy documents. The goal is that a guide who has read the policy can answer, and a guide who hasn't can't guess.

Write 8 multiple-choice questions about what the excerpt actually requires or says: procedures and their order, who to tell and by when, numbers and deadlines, what is and isn't allowed, and how to handle a realistic situation the policy covers. Prefer short realistic situations ("A parent volunteer offers to drive three students...") over bare recall. Each question has exactly 4 options: one correct, three plausible but wrong according to the excerpt. Vary which position holds the right answer. Never ask about section numbers, document titles, page layout or exact wording. Use only the excerpt, no outside knowledge. If the excerpt says something is a draft or not yet in effect, don't ask about that part. Plain words, short sentences, no em dashes.

Return ONLY a JSON object, no markdown, in exactly this shape:
{"questions":[{"q":"question","options":["a","b","c","d"],"answer":0,"why":"one sentence on why that answer is right","quote":"one exact sentence copied character for character from the excerpt that proves the answer"}]}`;
// Build one policy check: returns { qs, part } or throws.
// A private policy's text (staff only, through the relay).
export async function fetchDoc(key) {
  if (!docText[key]) { const j = await callRelay({ mode: "doc", key }); docText[key] = j.text || ""; }
  return docText[key];
}
async function policyQuestions(key, label, attempt, want) {
  await fetchDoc(key);
  const parts = policyParts(docText[key]); if (!parts.length) throw new Error("That policy is empty.");
  for (let k = 0; k < 2; k++) {
    const part = parts[(attempt + k * Math.max(1, Math.floor(parts.length / 2))) % parts.length];
    const j = await callRelay({ system: POLICY_SYSTEM, tier: "deep", max: 3000, messages: [{ role: "user", content: `Document: ${label}\nSections in this excerpt: ${part.titles.filter(Boolean).join("; ")}\n\n<excerpt>\n${part.text}\n</excerpt>` }] });
    let parsed = null; try { const t = String(j.text || ""); parsed = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); } catch (e) { parsed = null; }
    const qs = checkQuestions(parsed && parsed.questions, part.text);
    if (qs.length >= want) return { qs: shuffle(qs).slice(0, want), part };
  }
  throw new Error("Couldn't build a reliable check from that part of the policy. Try again.");
}
//   cfg: { id, key, label, n (questions), pass, intro?, onDone? }
export async function mountPolicyCheck(el, cfg) {
  css(); el.classList.add("wlq"); el.innerHTML = "";
  el.appendChild(h("p", { class: "wlq-dim", text: "Loading…" }));
  await loadProgress();
  const n = cfg.n || 6, pass = cfg.pass || 5;
  const intro = (err) => {
    const r = trainingRec(cache, cfg.id); el.innerHTML = "";
    put(el, h("p", { class: "wlq-k", text: status(r, pass) }), cfg.intro ? h("p", { class: "wlq-dim", text: cfg.intro }) : null,
      h("p", { class: "wlq-dim", text: `${n} questions written fresh from a different part of the ${cfg.label} each time. Pass with ${pass}.` }),
      err ? h("p", { class: "wlq-why", text: err }) : null,
      h("div", { class: "wlq-row" }, [h("button", { class: "wlq-btn", text: r.passed ? "Take another check" : r.attempts ? "Try again" : "Start", onclick: start })]));
  };
  const start = async e => {
    const b = e && e.currentTarget; if (b) { b.disabled = true; b.textContent = "Writing your questions…"; }
    const r = trainingRec(cache, cfg.id), n0 = r.attempts || 0;
    try {
      const { qs, part } = await policyQuestions(cfg.key, cfg.label, n0, n);
      await saveProgress({ training: { [cfg.id]: { attempts: n0 + 1, set: n0, at: Date.now() } } });
      run(el, qs.map(q => { const order = shuffle(q.o.map((t, i) => i)); return { ...q, o: order.map(i => q.o[i]), a: order.indexOf(q.a), ctx: null }; }), { ...cfg, pass, passText: "Passed. This check covered: " + part.titles.filter(Boolean).join("; ") + "." }, () => intro(), () => intro());
    } catch (err) { intro(err.message || "Something went wrong. Try again."); }
  };
  intro();
}
