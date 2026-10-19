import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../worker/index.mjs";
import { testDatabase } from "./helpers/d1.mjs";

const origin = "https://smcuc.alphazonelabs.com";
const vars = {
  AUTH_ORIGIN: origin, AUTH_PEPPER: "test-private-pepper",
  TURNSTILE_SITE_KEY: "test-public-key", TURNSTILE_SECRET_KEY: "test-private-turnstile",
  GOOGLE_CLIENT_ID: "test-client", GOOGLE_CLIENT_SECRET: "test-private-google",
};
const request = (route, body) => new Request(`${origin}/api/portal/auth/${route}`, body === undefined ? {} : {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

test("Google start creates a persisted OAuth state, PKCE redirect and secure cookie", async () => {
  const { db, sqlite } = testDatabase();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    return Response.json({ success: true, hostname: "smcuc.alphazonelabs.com", action: "patient_auth" });
  };
  try {
    const response = await worker.fetch(request("google/start", { turnstileToken: "test-token" }), { ...vars, AUTH_DB: db });
    assert.equal(response.status, 200);
    const redirect = new URL((await response.json()).redirect);
    assert.equal(redirect.origin, "https://accounts.google.com");
    assert.equal(redirect.searchParams.get("redirect_uri"), `${origin}/api/portal/auth/google/callback`);
    assert.equal(redirect.searchParams.get("code_challenge_method"), "S256");
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM portal_oauth_states").get().n, 1);
    assert.equal(sqlite.prepare("SELECT attempts FROM portal_auth_limits").get().attempts, 1);
    assert.match(response.headers.get("Set-Cookie"), /__Host-smc_oauth=.*; Path=\/; Secure; HttpOnly; SameSite=Lax/);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  } finally { globalThis.fetch = originalFetch; sqlite.close(); }
});

test("missing migrations disable capability flags and return safe, actionable failures", async () => {
  const { db, sqlite } = testDatabase(false);
  const originalFetch = globalThis.fetch, originalError = console.error;
  const logs = [];
  console.error = entry => logs.push(entry);
  globalThis.fetch = async () => Response.json({ success: true, hostname: "smcuc.alphazonelabs.com", action: "patient_auth" });
  try {
    const env = { ...vars, AUTH_DB: db };
    const config = await (await worker.fetch(request("config"), env)).json();
    assert.equal(config.databaseReady, false);
    assert.equal(config.googleReady, false);
    assert.equal(config.emailPasswordReady, false);
    assert.equal(config.configurationCode, "AUTH_SCHEMA_MISSING");
    const response = await worker.fetch(request("google/start", { turnstileToken: "test-token" }), env);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.code, "AUTH_SCHEMA_MISSING");
    assert.ok(body.requestId);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const output = JSON.stringify({ config, body, logs });
    for (const privateValue of ["test-private", "test-token", "portal_oauth_states", "portal_auth_limits"])
      assert.equal(output.includes(privateValue), false);
  } finally { globalThis.fetch = originalFetch; console.error = originalError; sqlite.close(); }
});

test("Google callback verifies a signed identity, creates a session and rejects state replay", async () => {
  const { db, sqlite } = testDatabase();
  const originalFetch = globalThis.fetch;
  const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256" }, true, ["sign","verify"]);
  const jwk = { ...await crypto.subtle.exportKey("jwk", pair.publicKey), kid: "test-key", use: "sig" };
  let redirect;
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  globalThis.fetch = async (url, options) => {
    if (url.includes("siteverify")) return Response.json({ success: true, hostname: "smcuc.alphazonelabs.com", action: "patient_auth" });
    if (url === "https://www.googleapis.com/oauth2/v3/certs") return Response.json({ keys: [jwk] });
    assert.equal(url, "https://oauth2.googleapis.com/token");
    assert.equal(options.body.get("redirect_uri"), `${origin}/api/portal/auth/google/callback`);
    const input = encode({alg:"RS256",kid:"test-key"}) + "." + encode({
      iss:"https://accounts.google.com", aud:vars.GOOGLE_CLIENT_ID,
      exp:Math.floor(Date.now()/1000)+600, nonce:redirect.searchParams.get("nonce"),
      email:"flow-test@example.com", email_verified:true, sub:"google-test-sub", name:"Flow Test",
    });
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(input));
    return Response.json({ id_token: input + "." + Buffer.from(signature).toString("base64url") });
  };
  try {
    const env = {...vars,AUTH_DB:db};
    const start = await worker.fetch(request("google/start", {turnstileToken:"test-token"}),env);
    redirect = new URL((await start.json()).redirect);
    const callback = new Request(`${origin}/api/portal/auth/google/callback?state=${redirect.searchParams.get("state")}&code=test-code`, {
      headers:{Cookie:start.headers.get("Set-Cookie").split(";")[0]},
    });
    const response = await worker.fetch(callback,env);
    assert.equal(response.headers.get("Location"),"/portal/dashboard");
    const cookies = response.headers.getSetCookie();
    const session = cookies.find(c=>c.startsWith("__Host-smc_session="));
    assert.ok(session);
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM portal_sessions").get().n,1);
    const sessionResponse = await worker.fetch(new Request(`${origin}/api/portal/auth/session`,{headers:{Cookie:session.split(";")[0]}}),env);
    assert.equal((await sessionResponse.json()).user.email,"flow-test@example.com");
    const replay = await worker.fetch(callback,env);
    assert.equal(replay.headers.get("Location"),"/portal?error=google");
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM portal_sessions").get().n,1);
  } finally { globalThis.fetch=originalFetch;sqlite.close(); }
});

test("malformed requests stay 400 rather than being mislabeled server failures", async () => {
  const response = await worker.fetch(new Request(`${origin}/api/portal/auth/google/start`, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{",
  }), { ...vars, AUTH_DB: {} });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, "AUTH_REQUEST_INVALID");
});

test("default and production deployments agree; sandbox cannot overwrite the live Worker", () => {
  const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  assert.equal(config.name, "smc-urgentcare");
  assert.equal(config.vars.AUTH_ORIGIN, origin);
  assert.equal(config.d1_databases[0].database_name, "smc-db");
  assert.deepEqual(config.vars, config.env.production.vars);
  assert.deepEqual(config.d1_databases, config.env.production.d1_databases);
  assert.notEqual(config.env.sandbox.name, config.name);
  assert.equal(config.env.sandbox.d1_databases[0].binding, "AUTH_DB");
  assert.notEqual(config.env.sandbox.d1_databases[0].database_id, config.d1_databases[0].database_id);
});
