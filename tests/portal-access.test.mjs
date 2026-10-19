import test from "node:test";
import assert from "node:assert/strict";
import { AccessSessionError, fetchPortalAuth } from "../src/features/portal/auth-fetch.ts";

test("portal requests use Access AJAX handling, same-origin cookies and no redirect following", async () => {
  const body = JSON.stringify({turnstileToken:"test-token"});
  const result = await fetchPortalAuth("/api/portal/auth/google/start", {
    method:"POST",headers:{"Content-Type":"application/json"},body,
  }, async (path, options) => {
    assert.equal(path,"/api/portal/auth/google/start");
    assert.equal(options.headers.get("X-Requested-With"),"XMLHttpRequest");
    assert.equal(options.headers.get("Content-Type"),"application/json");
    assert.equal(options.credentials,"same-origin");
    assert.equal(options.redirect,"manual");
    assert.equal(options.cache,"no-store");
    assert.equal(options.body,body);
    return Response.json({redirect:"https://accounts.google.com"});
  });
  assert.equal(result.status,200);
});

test("Access responses prompt top-level reauthentication without consuming login HTML", async () => {
  for (const response of [
    new Response(null,{status:302,headers:{Location:"https://example.cloudflareaccess.com"}}),
    new Response("Access login",{status:401,headers:{"Content-Type":"text/html"}}),
    new Response("Forbidden",{status:403,headers:{"Content-Type":"text/html"}}),
    {type:"opaqueredirect",status:0,headers:new Headers()},
  ]) {
    await assert.rejects(fetchPortalAuth("/api/portal/auth/config",{},async()=>response),AccessSessionError);
  }
});

test("Worker JSON errors keep their meaning, including missing portal sessions", async () => {
  for (const [status,error] of [[401,"Not authenticated."],[403,"Invalid origin."],[503,"Database unavailable."]]) {
    const result=await fetchPortalAuth("/api/portal/auth/session",{},async()=>Response.json({error},{status}));
    assert.equal(result.status,status);
    assert.deepEqual(await result.json(),{error});
  }
});
