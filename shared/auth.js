// Sign-in flow shared by every frontend app: password, optional TOTP second step, and the
// session bootstrap that every page runs before rendering anything.

(function () {
  const API = window.CTG_API;

  let pendingLoginToken = null; // set between password step and 2FA step

  // Resolves to a user object, or null when nobody is signed in. Every page calls this
  // first and renders either its app or the sign-in screen based on the answer.
  async function currentUser() {
    if (!API.getToken()) return null;
    const res = await API.call("me");
    return res && res.ok ? res.user : null;
  }

  async function permissions() {
    const res = await API.call("my_perms");
    return res && res.ok ? res : null;
  }

  // Returns {status:"ok"} | {status:"2fa"} | {status:"error", message}
  async function signIn(email, password) {
    const res = await API.call("login", { email: email, password: password, token: undefined });
    if (!res || res.ok !== true) {
      return { status: "error", message: friendlyError(res && res.error) };
    }
    if (res.requires_2fa) {
      pendingLoginToken = res.login_token;
      return { status: "2fa" };
    }
    API.setToken(res.token);
    return { status: "ok", user: res.user };
  }

  async function submitTwoFactor(code) {
    if (!pendingLoginToken) return { status: "error", message: "Start again from the sign-in screen." };
    const res = await API.call("login_2fa", { login_token: pendingLoginToken, code: code, token: undefined });
    if (!res || res.ok !== true) {
      return { status: "error", message: friendlyError(res && res.error) };
    }
    pendingLoginToken = null;
    API.setToken(res.token);
    return { status: "ok", user: res.user };
  }

  async function signOut() {
    await API.call("logout");
    API.clearToken();
  }

  // Backend error codes are stable identifiers for code; people need sentences.
  function friendlyError(code) {
    switch (code) {
      case "invalid_credentials": return "That email and password don't match.";
      case "invalid_code":        return "That code isn't right. Check your authenticator app and try again.";
      case "challenge_expired":   return "That took too long. Sign in again.";
      case "network_unreachable": return "Can't reach the server. Check your connection and try again.";
      case "unauthorized":        return "Your session has expired. Sign in again.";
      default:                    return code ? String(code) : "Something went wrong. Try again.";
    }
  }

  window.CTG_AUTH = { currentUser, permissions, signIn, submitTwoFactor, signOut, friendlyError };
})();
