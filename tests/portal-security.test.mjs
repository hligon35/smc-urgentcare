import test from "node:test";
import assert from "node:assert/strict";
import { allowedAuthOrigins, requestAuthOrigin } from "../worker/portal-origins.mjs";
import { validatePortalTurnstile } from "../worker/portal-turnstile.mjs";

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
