import test from "node:test";
import assert from "node:assert/strict";
import { allowedAuthOrigins, requestAuthOrigin } from "../worker/portal-origins.mjs";
import { validatePortalTurnstile } from "../worker/portal-turnstile.mjs";
import { handlePortalAuth } from "../worker/portal-auth.mjs";

const env = {
 AUTH_ORIGIN: "https://smcuc.alphazonelabs.com",
 AUTH_ALLOWED_ORIGINS: "https://smc-urgentcare.com",
 TURNSTILE_SECRET_KEY: "unit-test-placeholder"
};
test("only explicitly approved HTTPS origins are accepted for patient auth", () => {
 assert.deepEqual([...allowedAuthOrigins(env)], ["https://smcuc.alphazonelabs.com","https://smc-urgentcare.com"]);
 assert.equal(requestAuthOrigin(new Request("https://smcuc.alphazonelabs.com/portal"), env), "https://smcuc.alphazonelabs.com");
 assert.equal(requestAuthOrigin(new Request("https://smc-urgentcare.com/portal"), env), "https://smc-urgentcare.com");
 assert.equal(requestAuthOrigin(new Request("https://evil.example.com/portal"), env), null);
 assert.equal(requestAuthOrigin(new Request("http://smcuc.alphazonelabs.com/portal"), env), null);
});
test("Turnstile verifies expected action and request hostname", async () => {
 const req = new Request("https://smcuc.alphazonelabs.com/api/portal/auth/login");
 const verify = (hostname, action = "patient_auth") => async () => Response.json({success:true,hostname,action});
 assert.equal(await validatePortalTurnstile(req,env,"valid-demo-token",verify("smcuc.alphazonelabs.com")),true);
 assert.equal(await validatePortalTurnstile(req,env,"valid-demo-token",verify("smc-urgentcare.com")),false);
 assert.equal(await validatePortalTurnstile(req,env,"valid-demo-token",verify("smcuc.alphazonelabs.com","other")),false);
 assert.equal(await validatePortalTurnstile(req,env,"",verify("smcuc.alphazonelabs.com")),false);
 assert.equal(await validatePortalTurnstile(req,{...env,TURNSTILE_SECRET_KEY:""},"anything",verify("smcuc.alphazonelabs.com")),false);
 assert.equal(await validatePortalTurnstile(req,env,"anything",async()=>{throw new Error("offline");}),false);
});

test("config endpoint returns 403 for unapproved origin and safe readiness for approved origin", async () => {
 const allowed = await handlePortalAuth(new Request("https://smcuc.alphazonelabs.com/api/portal/auth/config"), {
   ...env, TURNSTILE_SITE_KEY: "public-test-key", AUTH_PEPPER: "test-pepper", AUTH_DB: {},
   GOOGLE_CLIENT_ID: "client-id", GOOGLE_CLIENT_SECRET: "secret"
 });
 assert.equal(allowed.status, 200);
 const status = await allowed.json();
 assert.equal(status.turnstileSiteKey, "public-test-key");
 assert.equal(status.googleReady, true);
 assert.equal(status.emailPasswordReady, true);
 assert.equal(status.recoveryReady, false);
 assert.equal(JSON.stringify(status).includes("test-pepper"), false);
 const denied = await handlePortalAuth(new Request("https://unapproved.example.com/api/portal/auth/config"), env);
 assert.equal(denied.status, 403);
 assert.deepEqual(await denied.json(), {error:"Invalid origin."});
});
