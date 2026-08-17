// Single call path to the portal edge function, shared by every frontend app.
//
// Factored out rather than pasted into each HTML file on purpose: the sibling system keeps
// two copies of its auth/fetch layer, and the same duplication elsewhere in that codebase
// is what caused its one documented production incident. One copy, imported twice.

(function () {
  const cfg = window.CTG_CONFIG || {};

  const TOKEN_KEY = "ctg_internal_portal_token";

  function storageGet(k) { try { return localStorage.getItem(k); } catch (_e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (_e) { /* private mode */ } }
  function storageDel(k) { try { localStorage.removeItem(k); } catch (_e) { /* private mode */ } }

  function getToken() { return storageGet(TOKEN_KEY) || ""; }
  function setToken(t) { storageSet(TOKEN_KEY, t); }
  function clearToken() { storageDel(TOKEN_KEY); }

  // The bearer token rides inside the JSON body rather than an Authorization header --
  // matches the backend's convention and keeps every call a bare fetch with no header setup.
  async function call(api, params) {
    const body = Object.assign({ api: api }, params || {});
    const token = getToken();
    if (token && body.token === undefined) body.token = token;

    let res;
    try {
      res = await fetch(cfg.PORTAL_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (_e) {
      // Distinguish "the network/server is unreachable" from "the server said no" -- these
      // need different messages to the user and different responses from the caller.
      return { ok: false, error: "network_unreachable" };
    }

    let data;
    try {
      data = await res.json();
    } catch (_e) {
      return { ok: false, error: "bad_response", status: res.status };
    }

    // A rejected token means the session is gone; drop it so the UI falls back to sign-in
    // rather than retrying forever with a credential that will never work again.
    if (data && data.ok === false && data.error === "unauthorized") clearToken();
    return data;
  }

  window.CTG_API = { call, getToken, setToken, clearToken };
})();
