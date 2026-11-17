// Wilderland Mentor relay: a Cloudflare Worker that lets signed-in Wilderland staff call Claude
// from explore.wilderland.academy without the API key ever reaching a browser.
// Setup steps are in README.md next to this file. The only secret is ANTHROPIC_API_KEY, set in Cloudflare.

const PROJECT = "wilderland-df15e";                       // Firebase project that signs staff in
const ORIGINS = ["https://explore.wilderland.academy"];   // sites allowed to call this relay
const DOMAIN = "@wilderland.academy";
const GUESTS = ["ian@silverlineventures.com", "online@bodyform.com"];   // outside guests allowed to use the relay
const ADMINS = ["alex@wilderland.academy", "sarah@wilderland.academy", "shanan@wilderland.academy", "april@wilderland.academy", "scott@wilderland.academy"];
const MODELS = { quick: "claude-haiku-5-5", deep: "claude-sonnet-5-5" };
const MAX_OUT = 1500;        // most tokens Claude may write per call
const MAX_IN_CHARS = 90000;  // largest request accepted (a 30-minute transcript is about 25,000)

let jwks = null, jwksAt = 0;
async function googleKeys() {
  if (!jwks || Date.now() - jwksAt > 3600e3) {
    const r = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
    jwks = (await r.json()).keys; jwksAt = Date.now();
  }
  return jwks;
}
function b64u(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
const dec = s => JSON.parse(new TextDecoder().decode(b64u(s)));

// Check the Firebase sign-in token: really issued by Google for this project, not expired, a school account.
async function verify(token) {
  const parts = (token || "").split(".");
  if (parts.length !== 3) throw new Error("bad token");
  const head = dec(parts[0]), pay = dec(parts[1]);
  if (head.alg !== "RS256") throw new Error("bad alg");
  const jwk = (await googleKeys()).find(k => k.kid === head.kid);
  if (!jwk) throw new Error("unknown key");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  const now = Date.now() / 1000;
  if (!ok || pay.aud !== PROJECT || pay.iss !== "https://securetoken.google.com/" + PROJECT || pay.exp < now || !pay.sub) throw new Error("invalid token");
  const email = (pay.email || "").toLowerCase();
  if (!pay.email_verified || !(email.endsWith(DOMAIN) || GUESTS.includes(email))) throw new Error("not a school account");
  return email;
}
// Staff = an admin, or listed in the Firestore "staff" collection (read with the caller's own token).
async function isStaff(email, token) {
  if (ADMINS.includes(email) || GUESTS.includes(email)) return true;
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/staff/${encodeURIComponent(email)}`, { headers: { Authorization: "Bearer " + token } });
  return r.ok;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = { "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0], "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "86400", Vary: "Origin" };
    const out = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors } });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return out(405, { error: "POST only" });
    if (!ORIGINS.includes(origin)) return out(403, { error: "origin not allowed" });
    if (!env.ANTHROPIC_API_KEY) return out(500, { error: "ANTHROPIC_API_KEY is not set on the Worker" });

    const token = (req.headers.get("Authorization") || "").replace(/^Bearer /, "");
    let email;
    try { email = await verify(token); } catch (e) { return out(401, { error: "sign-in not accepted: " + e.message }); }
    if (!(await isStaff(email, token))) return out(403, { error: "not on the staff list" });

    const raw = await req.text();
    if (raw.length > MAX_IN_CHARS) return out(413, { error: "request too large" });
    let body; try { body = JSON.parse(raw); } catch (e) { return out(400, { error: "bad JSON" }); }
    const messages = Array.isArray(body.messages) ? body.messages.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map(m => ({ role: m.role, content: m.content })) : [];
    if (!messages.length || messages[messages.length - 1].role !== "user") return out(400, { error: "messages must end with a user turn" });

    const payload = { model: MODELS[body.tier] || MODELS.deep, max_tokens: Math.min(MAX_OUT, Math.max(16, Number(body.max) || 800)), messages };
    if (typeof body.system === "string" && body.system) payload.system = body.system;
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return out(r.status === 429 ? 429 : 502, { error: (j.error && j.error.message) || "Claude API error " + r.status });
    const text = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    return out(200, { text });
  }
};
