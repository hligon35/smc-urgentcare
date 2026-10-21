import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../worker/index.mjs";
import { testDatabase } from "./helpers/d1.mjs";

const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
test("public portal configuration and Google callbacks work on both approved production hosts", async () => {
  const { db, sqlite } = testDatabase();
  const originalFetch = globalThis.fetch;
  try {
    for (const origin of ["https://smcurgentcareindy.com", "https://smc-urgentcare.hligon.workers.dev"]) {
      const env = { ...config.env.production.vars, AUTH_DB: db, AUTH_PEPPER: "test-pepper", TURNSTILE_SECRET_KEY: "test-turnstile", GOOGLE_CLIENT_SECRET: "test-google" };
      const response = await worker.fetch(new Request(origin + "/api/portal/auth/config"), env);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.databaseReady, true);
      assert.equal(body.googleReady, true);
      globalThis.fetch = async url => {
        assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
        return Response.json({ success: true, hostname: new URL(origin).hostname, action: "patient_auth" });
      };
      const start = await worker.fetch(new Request(origin + "/api/portal/auth/google/start", {
        method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken: "test-token" })
      }), env);
      assert.equal(start.status, 200);
      const redirect = new URL((await start.json()).redirect);
      assert.equal(redirect.searchParams.get("redirect_uri"), origin + "/api/portal/auth/google/callback");
    }
    for (const origin of ["https://evil.example", "https://smc-urgentcare-sandbox.hligon.workers.dev"]) {
      const response = await worker.fetch(new Request(origin + "/api/portal/auth/config", { headers: { Origin: config.vars.AUTH_ORIGIN } }), { ...config.env.production.vars, AUTH_DB: db });
      assert.equal(response.status, 403);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
    }
  } finally { globalThis.fetch = originalFetch; sqlite.close(); }
});
