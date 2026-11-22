// Conversation history for the staff guides: one private log per person, shared by the Mentor Mindset coach,
// the Behavior coach, the Parent Communication coach and the Lab builder. Firestore coachLog/{uid}/threads/{id};
// the rules let only the owner read, write or delete their own threads (admins included: nobody else can).
// Each page passes in its own Firestore instance and signed-in user.
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore-lite.js";

export const SITES = {
  mentor: { label: "Mentor Mindset", href: "/fieldguide/#coach" },
  behavior: { label: "Behavior", href: "/behavior/#coach" },
  parents: { label: "Parent Comms", href: "/guides/parents/" },
  labs: { label: "Lab builder", href: "/guides/lifeskills/builder/" },
  guide: { label: "Guide Mentor 🐲", href: "/guides/?mentor" }
};
const MAX_MSG = 24000, MAX_TOTAL = 600000;   // Firestore documents are capped at 1 MB

export const titleFrom = msgs => {
  const first = (msgs.find(m => m.role === "user") || {}).content || "Conversation";
  const line = first.replace(/^\[[^\]]*\]\s*/, "").split("\n").map(s => s.trim()).find(s => s.length > 3) || first;
  return line.length > 90 ? line.slice(0, 87).trimEnd() + "…" : line;
};

export function coachLog(db, user) {
  const col = () => collection(db, "coachLog", user.uid, "threads");
  return {
    newId: () => doc(col()).id,
    // t = { id, site, kind, title?, messages:[{role,content}], meta?, created? }. Returns the id.
    async save(t) {
      let total = 0;
      const messages = [];
      for (const m of t.messages || []) {
        if (!m || m.err || (m.role !== "user" && m.role !== "assistant")) continue;
        const content = String(m.content || "").slice(0, MAX_MSG);
        total += content.length; if (total > MAX_TOTAL) break;
        messages.push({ role: m.role, content });
      }
      if (!messages.length) return t.id;
      const now = Date.now();
      await setDoc(doc(col(), t.id), { site: t.site, kind: t.kind || "chat", title: (t.title || titleFrom(messages)).slice(0, 140), messages, meta: t.meta || {}, created: t.created || now, updated: now });
      return t.id;
    },
    async list(n = 300) {
      const snap = await getDocs(query(col(), orderBy("updated", "desc"), limit(n)));
      const out = []; snap.forEach(d => { const x = d.data(); out.push({ id: d.id, site: x.site, kind: x.kind, title: x.title, meta: x.meta || {}, created: x.created, updated: x.updated, count: (x.messages || []).length }); });
      return out;
    },
    async get(id) { const d = await getDoc(doc(col(), id)); return d.exists() ? { id: d.id, ...d.data() } : null; },
    async remove(id) { await deleteDoc(doc(col(), id)); }
  };
}

// Save without ever breaking the page: a failed save shows one quiet note, then keeps trying on later replies.
export function autosaver(getLog, onFail) {
  let warned = false;
  return async t => {
    try { const log = getLog(); if (log) await log.save(t); }
    catch (e) { console.warn("History save failed:", e); if (!warned && onFail) { warned = true; onFail(e); } }
  };
}
