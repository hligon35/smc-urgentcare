import { requestAuthOrigin } from "./portal-origins.mjs";
import { validatePortalTurnstile } from "./portal-turnstile.mjs";
// Authentication is intentionally isolated from the static patient experience.
// No PHI is processed here. Do not turn on clinical APIs without a separate review.
const SESSION = "__Host-smc_session";
const OAUTH = "__Host-smc_oauth";
const enc = new TextEncoder();
const b64 = (bytes) => {
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
const unb64 = (str) => Uint8Array.from(atob(str.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const random = (n = 32) => b64(crypto.getRandomValues(new Uint8Array(n)));
async function sha(value) {
  const bytes = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return b64(new Uint8Array(bytes));
}
const json = (data, status = 200, headers = {}) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
const cookie = (name, value, age) =>
  name + "=" + value + "; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=" + age;
const getCookie = (req, key) =>
  (req.headers.get("Cookie") || "").split(";").map((p) => p.trim()).find((p) => p.startsWith(key + "="))?.slice(key.length + 1) || "";
const sessionCookie = (token) => cookie(SESSION, token, 8 * 60 * 60);
const clearSession = () => cookie(SESSION, "", 0);
const cleanEmail = (email) => String(email || "").trim().toLowerCase();
const clock = () => Math.floor(Date.now() / 1000);
const configured = (env) => Boolean(env.AUTH_DB && env.AUTH_PEPPER && env.AUTH_ORIGIN);
const fail = (message, status = 400) => json({ error: message }, status);
async function payload(req) {
  if (!req.headers.get("Content-Type")?.startsWith("application/json")) throw Error("JSON required.");
  if (Number(req.headers.get("Content-Length") || 0) > 8192) throw Error("Request too large.");
  const raw = await req.text();
  if (raw.length > 8192) throw Error("Request too large.");
  const obj = JSON.parse(raw);
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw Error("Invalid request.");
  return obj;
}
async function hashPassword(password, salt, pepper) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password + pepper), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unb64(salt), iterations: 600000 }, key, 256);
  return b64(new Uint8Array(hash));
}
function equal(a, b) {
  const x = enc.encode(a), y = enc.encode(b);
  let different = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) different |= (x[i] || 0) ^ (y[i] || 0);
  return different === 0;
}
async function limit(req, env, scope, max = 10) {
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  const key = await sha(env.AUTH_PEPPER + ":" + scope + ":" + ip);
  const now = clock();
  await env.AUTH_DB.prepare(
    "INSERT INTO portal_auth_limits (id, attempts, expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN expires_at < ? THEN 1 ELSE attempts+1 END, expires_at=CASE WHEN expires_at < ? THEN ? ELSE expires_at END"
  ).bind(key, now + 600, now, now, now + 600).run();
  const row = await env.AUTH_DB.prepare("SELECT attempts FROM portal_auth_limits WHERE id=?").bind(key).first();
  return row && row.attempts <= max;
}
async function createSession(user, env) {
  const token = random(48);
  const digest = await sha(token + env.AUTH_PEPPER);
  const now = clock();
  await env.AUTH_DB.prepare(
    "INSERT INTO portal_sessions (id, user_id, created_at, expires_at) VALUES (?,?,?,?)"
  ).bind(digest, user.id, now, now + 8 * 3600).run();
  return sessionCookie(token);
}
export async function resolveSession(req, env) {
  if (!configured(env)) return null;
  const token = getCookie(req, SESSION);
  if (!token) return null;
  const digest = await sha(token + env.AUTH_PEPPER);
  const row = await env.AUTH_DB.prepare(
    "SELECT u.id, u.email, u.display_name, u.email_verified FROM portal_sessions s JOIN portal_users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>? AND u.disabled_at IS NULL"
  ).bind(digest, clock()).first();
  return row || null;
}
async function sendMail(env, email, subject, url) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM, to: [email], subject,
      text: "You requested access to SMC CareConnect. Open this secure link:\n" + url + "\nIf this was not you, you can ignore this email."
    })
  });
  return response.ok;
}
async function createEmailToken(env, user, purpose, origin) {
  const token = random(32);
  await env.AUTH_DB.prepare(
    "INSERT INTO portal_email_tokens (id, user_id, purpose, expires_at) VALUES (?,?,?,?)"
  ).bind(await sha(token + env.AUTH_PEPPER), user.id, purpose, clock() + 1800).run();
  const url = origin + "/portal?mode=" + encodeURIComponent(purpose) + "&token=" + encodeURIComponent(token);
  const delivered = await sendMail(env, user.email, purpose === "verify" ? "Confirm your SMC CareConnect email" : "Reset your SMC CareConnect password", url);
  if (!delivered) throw Error("Email delivery unavailable");
}
async function consumeToken(env, token, purpose) {
  if (typeof token !== "string" || token.length < 30 || token.length > 150) return null;
  const digest = await sha(token + env.AUTH_PEPPER);
  const row = await env.AUTH_DB.prepare(
    "SELECT id, user_id FROM portal_email_tokens WHERE id=? AND purpose=? AND expires_at>?"
  ).bind(digest, purpose, clock()).first();
  if (!row) return null;
  const result = await env.AUTH_DB.prepare(
    "DELETE FROM portal_email_tokens WHERE id=? AND purpose=? AND expires_at>?"
  ).bind(digest, purpose, clock()).run();
  return result.meta.changes === 1 ? row.user_id : null;
}
async function googleStart(req, env, origin) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail("Google sign-in is not configured.", 503);
  const state = random(32), nonce = random(32), verifier = random(64);
  const challenge = await sha(verifier);
  await env.AUTH_DB.prepare(
    "INSERT INTO portal_oauth_states (id, verifier, nonce, expires_at) VALUES (?,?,?,?)"
  ).bind(await sha(state + env.AUTH_PEPPER), verifier, nonce, clock() + 600).run();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", origin + "/api/portal/auth/google/callback");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return json({ redirect: url.href }, 200, { "Set-Cookie": cookie(OAUTH, state, 600) });
}
async function verifyGoogleIdToken(jwt, env, expectedNonce) {
  if (typeof jwt !== "string") throw Error("Missing identity token");
  const chunks = jwt.split(".");
  if (chunks.length !== 3) throw Error("Malformed identity token");
  const header = JSON.parse(new TextDecoder().decode(unb64(chunks[0])));
  const claims = JSON.parse(new TextDecoder().decode(unb64(chunks[1])));
  if (header.alg !== "RS256" || !header.kid) throw Error("Unexpected signing algorithm");
  const jwksResponse = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!jwksResponse.ok) throw Error("Key retrieval failed");
  const jwks = await jwksResponse.json();
  const jwk = jwks.keys.find((k) => k.kid === header.kid && k.kty === "RSA" && k.use === "sig");
  if (!jwk) throw Error("Unknown signing key");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, unb64(chunks[2]), enc.encode(chunks[0] + "." + chunks[1]));
  if (!valid || !["accounts.google.com", "https://accounts.google.com"].includes(claims.iss) ||
      claims.aud !== env.GOOGLE_CLIENT_ID || claims.nonce !== expectedNonce ||
      claims.exp <= clock() || claims.iat > clock() + 60 ||
      claims.email_verified !== true || !claims.sub || !claims.email) {
    throw Error("Invalid Google identity");
  }
  return claims;
}
async function googleCallback(req, env, origin) {
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const cookies = { "Set-Cookie": cookie(OAUTH, "", 0) };
  if (!state || !code || !equal(state, getCookie(req, OAUTH))) return new Response(null, { status: 302, headers: { Location: "/portal?error=google", ...cookies } });
  const digest = await sha(state + env.AUTH_PEPPER);
  const attempt = await env.AUTH_DB.prepare(
    "SELECT verifier, nonce FROM portal_oauth_states WHERE id=? AND expires_at>?"
  ).bind(digest, clock()).first();
  if (!attempt) return new Response(null, { status: 302, headers: { Location: "/portal?error=google", ...cookies } });
  const deleted = await env.AUTH_DB.prepare("DELETE FROM portal_oauth_states WHERE id=? AND expires_at>?").bind(digest, clock()).run();
  if (deleted.meta.changes !== 1) return new Response(null, { status: 302, headers: { Location: "/portal?error=google", ...cookies } });
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.AUTH_ORIGIN + "/api/portal/auth/google/callback", grant_type: "authorization_code",
        code, code_verifier: attempt.verifier })
    });
    if (!response.ok) throw Error("OAuth exchange failed");
    const tokens = await response.json();
    const identity = await verifyGoogleIdToken(tokens.id_token, env, attempt.nonce);
    const email = cleanEmail(identity.email);
    let user = await env.AUTH_DB.prepare("SELECT id, google_sub, disabled_at FROM portal_users WHERE email=?").bind(email).first();
    if (user && (user.disabled_at || user.google_sub !== identity.sub)) {
      throw Error("Account exists under a different sign-in method");
    }
    if (!user) {
      const id = crypto.randomUUID();
      await env.AUTH_DB.prepare(
        "INSERT INTO portal_users (id,email,display_name,google_sub,email_verified,created_at) VALUES (?,?,?,?,1,?)"
      ).bind(id, email, String(identity.name || "").slice(0, 90) || null, identity.sub, clock()).run();
      user = { id };
    }
    const authenticated = await createSession(user, env);
    const headers = new Headers({ Location: "/portal/dashboard", "Cache-Control": "no-store" });
    headers.append("Set-Cookie", cookie(OAUTH, "", 0));
    headers.append("Set-Cookie", authenticated);
    return new Response(null, { status: 302, headers });
  } catch {
    return new Response(null, { status: 302, headers: { Location: "/portal?error=google", ...cookies } });
  }
}
export async function handlePortalAuth(req, env) {
  const url = new URL(req.url);
  const route = url.pathname.replace("/api/portal/auth/", "");
  if (route === "config" && req.method === "GET") {
    if (!requestAuthOrigin(req, env)) return fail("Invalid origin.", 403);
    // Public capability flags and the public widget key only; never expose
    // secrets, database IDs, access tokens, or provider error details.
    const baseReady = configured(env) &&
      Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
    const emailPasswordReady = baseReady;
    const recoveryReady = baseReady &&
      Boolean(env.RESEND_API_KEY && env.RESEND_FROM);
    return json({
      turnstileSiteKey: String(env.TURNSTILE_SITE_KEY || ""),
      emailPasswordReady,
      recoveryReady,
      googleReady: baseReady &&
        Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    });
  }
  if (!configured(env)) return fail("Patient sign-in is not configured yet.", 503);
  const origin = requestAuthOrigin(req, env);
  if (!origin) return fail("Invalid origin.", 403);
  if (route === "google/start" && req.method === "POST") {
    if (req.headers.get("Origin") !== origin) return fail("Invalid request origin.", 403);
    const data = await payload(req);
    if (!await validatePortalTurnstile(req, env, data.turnstileToken))
      return fail("Bot verification failed.", 403);
    if (!await limit(req, env, "google-start", 15))
      return fail("Too many attempts. Try again later.", 429);
    return googleStart(req, env, origin);
  }
  if (route === "google/callback" && req.method === "GET") return googleCallback(req, env, origin);
  if (route === "session" && req.method === "GET") {
    const user = await resolveSession(req, env);
    return user ? json({ user: { email: user.email, displayName: user.display_name } }) : fail("Not authenticated.", 401);
  }
  if (req.method !== "POST") return fail("Method not allowed.", 405);
  if (req.headers.get("Origin") !== origin) return fail("Invalid request origin.", 403);
  if (!["register", "login", "logout", "verify", "forgot", "reset"].includes(route)) return fail("Not found.", 404);
  if (route === "logout") {
    const token = getCookie(req, SESSION);
    if (token) await env.AUTH_DB.prepare("DELETE FROM portal_sessions WHERE id=?").bind(await sha(token + env.AUTH_PEPPER)).run();
    return json({ ok: true }, 200, { "Set-Cookie": clearSession() });
  }
  const data = await payload(req);
  if (!["logout", "verify"].includes(route) &&
      !await validatePortalTurnstile(req, env, data.turnstileToken))
    return fail("Bot verification failed. Please complete the security check again.", 403);
  const email = cleanEmail(data.email);
  if (route === "verify") {
    const user = await consumeToken(env, data.token, "verify");
    if (!user) return fail("Verification link is invalid or expired.");
    await env.AUTH_DB.prepare("UPDATE portal_users SET email_verified=1 WHERE id=?").bind(user).run();
    return json({ ok: true });
  }
  if (route === "reset") {
    if (typeof data.password !== "string" || data.password.length < 12 || data.password.length > 128) return fail("Use a password between 12 and 128 characters.");
    const user = await consumeToken(env, data.token, "reset");
    if (!user) return fail("Reset link is invalid or expired.");
    const salt = random(24), hash = await hashPassword(data.password, salt, env.AUTH_PEPPER);
    await env.AUTH_DB.batch([
      env.AUTH_DB.prepare("UPDATE portal_users SET password_salt=?, password_hash=? WHERE id=?").bind(salt, hash, user),
      env.AUTH_DB.prepare("DELETE FROM portal_sessions WHERE user_id=?").bind(user)
    ]);
    return json({ ok: true });
  }
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
  if (!await limit(req, env, "login:" + route, 8)) return fail("Too many attempts. Try again later.", 429);
  if (route === "forgot") {
    const user = await env.AUTH_DB.prepare("SELECT id,email FROM portal_users WHERE email=? AND password_hash IS NOT NULL AND disabled_at IS NULL").bind(email).first();
    if (user && env.RESEND_API_KEY && env.RESEND_FROM) await createEmailToken(env, user, "reset", origin);
    return json({ ok: true, message: "If the account exists, recovery instructions will be sent." });
  }
  if (typeof data.password !== "string" || data.password.length < 12 || data.password.length > 128) return fail("Password must be between 12 and 128 characters.");
  if (route === "register") {
    if (!env.RESEND_API_KEY || !env.RESEND_FROM) return fail("Email verification is not configured.", 503);
    const existing = await env.AUTH_DB.prepare("SELECT id,email FROM portal_users WHERE email=?").bind(email).first();
    if (!existing) {
      const salt = random(24), hash = await hashPassword(data.password, salt, env.AUTH_PEPPER);
      const id = crypto.randomUUID();
      await env.AUTH_DB.prepare(
        "INSERT INTO portal_users (id,email,password_hash,password_salt,email_verified,created_at) VALUES (?,?,?,?,0,?)"
      ).bind(id, email, hash, salt, clock()).run();
      await createEmailToken(env, { id, email }, "verify", origin);
    }
    return json({ ok: true, message: "If eligible, check your email for a verification link." });
  }
  const user = await env.AUTH_DB.prepare(
    "SELECT id, password_salt, password_hash, email_verified FROM portal_users WHERE email=? AND disabled_at IS NULL"
  ).bind(email).first();
  const fakeSalt = "VGVzdFN0YXRpY1NhbHRGb3JUaW1pbmc";
  const calculated = await hashPassword(data.password, user?.password_salt || fakeSalt, env.AUTH_PEPPER);
  if (!user?.password_hash || !equal(calculated, user.password_hash) || !user.email_verified) return fail("Invalid credentials or email not verified.", 401);
  return json({ ok: true }, 200, { "Set-Cookie": await createSession(user, env) });
}
