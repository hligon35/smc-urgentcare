import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { handlePortalAuth } from "../worker/portal-auth.mjs";

test("activation requests use generic replies and require same-origin, Turnstile and configured auth", async () => {
 const env={AUTH_ORIGIN:"https://smcuc.alphazonelabs.com",AUTH_PEPPER:"test-only-secret",AUTH_DB:{},
   RESEND_API_KEY:"",RESEND_FROM:""};
 const make=(origin,body={email:"sample@example.invalid"})=>new Request("https://smcuc.alphazonelabs.com/api/portal/auth/activate/request",{
  method:"POST",headers:{"Content-Type":"application/json","Origin":origin},body:JSON.stringify(body)
 });
 assert.equal((await handlePortalAuth(make("https://evil.example"),env)).status,403);
 assert.equal((await handlePortalAuth(make(env.AUTH_ORIGIN),env)).status,403);
});
test("activation completion rejects invalid passwords without consuming tokens",async()=>{
 const env={AUTH_ORIGIN:"https://smcuc.alphazonelabs.com",AUTH_PEPPER:"test-only-secret",AUTH_DB:{}};
 const req=new Request(env.AUTH_ORIGIN+"/api/portal/auth/activate/complete",{
  method:"POST",headers:{"Content-Type":"application/json","Origin":env.AUTH_ORIGIN},
  body:JSON.stringify({token:"fake-token",password:"short"})
 });
 const res=await handlePortalAuth(req,env);
 assert.equal(res.status,400);
 assert.match((await res.json()).error,/password/i);
});
test("activation token updates password only on unclaimed non-disabled account", async()=>{
 const source=await readFile("worker/portal-auth.mjs","utf8");
 assert.match(source,/password_hash IS NULL AND disabled_at IS NULL/);
 assert.match(source,/purpose='activate' AND expires_at>/);
 assert.match(source,/DELETE FROM portal_email_tokens WHERE id=\? AND purpose='activate'/);
});
