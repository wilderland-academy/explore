// A small Firestore REST helper for Our Code, Student Court and the staff court desk. Every call uses the signed-in
// person's own token (from /auth.js), so firestore.rules decide what they can read and write.
window.WLFS = (function () {
  var FS = "https://firestore.googleapis.com/v1/projects/wilderland-df15e/databases/(default)/documents";
  function user() { return window.wlFirebase && window.wlFirebase.auth && window.wlFirebase.auth.currentUser; }
  async function H(json) { var u = user(); if (!u) throw Object.assign(new Error("signed out"), { status: 401 }); var h = { Authorization: "Bearer " + await u.getIdToken() }; if (json) h["Content-Type"] = "application/json"; return h; }
  function enc(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
    if (typeof v === "object") return { mapValue: { fields: fields(v) } };
    return { stringValue: String(v) };
  }
  function fields(o) { var f = {}; Object.keys(o).forEach(function (k) { if (o[k] !== undefined) f[k] = enc(o[k]); }); return f; }
  function dec(v) {
    if (!v) return null;
    if ("stringValue" in v) return v.stringValue; if ("integerValue" in v) return Number(v.integerValue); if ("doubleValue" in v) return v.doubleValue;
    if ("booleanValue" in v) return v.booleanValue; if ("timestampValue" in v) return v.timestampValue; if ("nullValue" in v) return null;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(dec);
    if ("mapValue" in v) { var o = {}; var f = v.mapValue.fields || {}; Object.keys(f).forEach(function (k) { o[k] = dec(f[k]); }); return o; }
    return null;
  }
  function doc(d) { var o = { id: d.name.split("/").pop() }; var f = d.fields || {}; Object.keys(f).forEach(function (k) { o[k] = dec(f[k]); }); return o; }
  async function fail(r, what) { var e = new Error(what + " " + r.status); e.status = r.status; throw e; }
  return {
    user: user,
    async get(path) { var r = await fetch(FS + "/" + path, { headers: await H() }); if (r.status === 404) return null; if (!r.ok) await fail(r, "read " + path); return doc(await r.json()); },
    async list(coll) {
      var out = [], page = "";
      do { var r = await fetch(FS + "/" + coll + "?pageSize=300" + (page ? "&pageToken=" + encodeURIComponent(page) : ""), { headers: await H() }); if (!r.ok) await fail(r, "list " + coll); var j = await r.json(); (j.documents || []).forEach(function (d) { out.push(doc(d)); }); page = j.nextPageToken || ""; } while (page);
      return out;
    },
    // where: [[field, value], ...], all equality (no composite index needed).
    async query(coll, where, limit) {
      var f = where.map(function (w) { return { fieldFilter: { field: { fieldPath: w[0] }, op: Array.isArray(w[1]) ? "IN" : "EQUAL", value: enc(w[1]) } }; });
      var q = { from: [{ collectionId: coll }], limit: limit || 300 };
      if (f.length === 1) q.where = f[0]; else if (f.length) q.where = { compositeFilter: { op: "AND", filters: f } };
      var r = await fetch(FS + ":runQuery", { method: "POST", headers: await H(true), body: JSON.stringify({ structuredQuery: q }) });
      if (!r.ok) await fail(r, "query " + coll);
      return (await r.json()).filter(function (x) { return x.document; }).map(function (x) { return doc(x.document); });
    },
    async create(coll, data, id) {
      var r = await fetch(FS + "/" + coll + (id ? "?documentId=" + encodeURIComponent(id) : ""), { method: "POST", headers: await H(true), body: JSON.stringify({ fields: fields(data) }) });
      if (!r.ok) await fail(r, "create " + coll);
      return doc(await r.json());
    },
    // Changes only the fields given (creates the document if it doesn't exist and the rules allow it).
    async patch(path, data) {
      var mask = Object.keys(data).map(function (k) { return "updateMask.fieldPaths=" + encodeURIComponent(k); }).join("&");
      var r = await fetch(FS + "/" + path + "?" + mask, { method: "PATCH", headers: await H(true), body: JSON.stringify({ fields: fields(data) }) });
      if (!r.ok) await fail(r, "save " + path);
      return doc(await r.json());
    },
    async remove(path) { var r = await fetch(FS + "/" + path, { method: "DELETE", headers: await H() }); if (!r.ok) await fail(r, "delete " + path); }
  };
})();
