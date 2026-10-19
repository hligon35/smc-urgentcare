const COOKIE = "__Host-smc_google_registration";
const now = () => Math.floor(Date.now() / 1000);
const cookie = (token, age) => `${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${age}`;
export const clearGoogleRegistration = () => cookie("", 0);
async function digest(token, pepper) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token + pepper));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2,"0")).join("");
}
export function authoritativeGoogleEmail(identity) {
  // Google recommends a separate ownership challenge for external email accounts without hd.
  return identity.email_verified === true &&
    (String(identity.email).toLowerCase().endsWith("@gmail.com") || (typeof identity.hd === "string" && identity.hd.length > 0));
}
export async function beginGoogleRegistration(env, identity) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,"0")).join("");
  await env.AUTH_DB.prepare("DELETE FROM portal_google_registrations WHERE expires_at<=?").bind(now()).run();
  await env.AUTH_DB.prepare(
    "INSERT INTO portal_google_registrations (id,email,google_sub,display_name,authoritative,expires_at) VALUES (?,?,?,?,?,?)"
  ).bind(await digest(token, env.AUTH_PEPPER), identity.email.trim().toLowerCase(), identity.sub,
    String(identity.name || "").slice(0,90) || null, Number(authoritativeGoogleEmail(identity)), now()+600).run();
  return cookie(token,600);
}
export async function pendingGoogleRegistration(req, env) {
  const token = (req.headers.get("Cookie") || "").split(";").map(s=>s.trim()).find(s=>s.startsWith(COOKIE+"="))?.slice(COOKIE.length+1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return env.AUTH_DB.prepare(
    "SELECT id,email,google_sub,display_name,authoritative FROM portal_google_registrations WHERE id=? AND expires_at>?"
  ).bind(await digest(token,env.AUTH_PEPPER),now()).first();
}

/** Insert only while the verified handoff is valid; consuming it and creating the account are atomic. */
export async function completeGoogleRegistration(env, pending, passwordHash, passwordSalt) {
  const id=crypto.randomUUID();
  const results=await env.AUTH_DB.batch([
    env.AUTH_DB.prepare(
      "INSERT INTO portal_users (id,email,display_name,password_hash,password_salt,google_sub,email_verified,created_at,role) " +
      "SELECT ?,email,display_name,?,?,google_sub,authoritative,?,'patient' FROM portal_google_registrations WHERE id=? AND expires_at>?"
    ).bind(id,passwordHash,passwordSalt,now(),pending.id,now()),
    env.AUTH_DB.prepare("DELETE FROM portal_google_registrations WHERE id=?").bind(pending.id),
  ]);
  return results[0]?.meta?.changes===1 ? {id,email:pending.email,email_verified:pending.authoritative} : null;
}
