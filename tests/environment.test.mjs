import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadBuildEnvironment } from "../scripts/environment.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "smc-env-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "wrangler.jsonc"), readFileSync("wrangler.jsonc"));
  return root;
}

test("build origins come from Wrangler without dotenv or local secrets", t => {
  const root = fixture(t);
  writeFileSync(join(root, ".env.production"), "EXPO_PUBLIC_SITE_URL=https://old.example\n");
  writeFileSync(join(root, ".dev.vars.sandbox"), "CONTACT_TO=private@example.test\n");
  const config = JSON.parse(readFileSync(join(root, "wrangler.jsonc")));
  for (const environment of ["production", "sandbox"]) {
    const env = loadBuildEnvironment(environment, root, { EXPO_PUBLIC_SITE_URL: "https://stale.example" });
    assert.equal(env.EXPO_PUBLIC_SITE_URL, config.env[environment].vars.SITE_ORIGIN);
    assert.equal(env.EXPO_NO_DOTENV, "1");
    assert.equal(env.NODE_ENV, "production");
    assert.equal(env.CONTACT_TO, undefined);
  }
  assert.throws(() => loadBuildEnvironment("staging", root, {}), /Expected production or sandbox/);
});

test("incorrect canonical or environment settings fail before export", t => {
  const root = fixture(t);
  const config = JSON.parse(readFileSync(join(root, "wrangler.jsonc")));
  config.env.production.vars.SITE_ORIGIN = config.env.sandbox.vars.SITE_ORIGIN;
  writeFileSync(join(root, "wrangler.jsonc"), JSON.stringify(config));
  assert.throws(() => loadBuildEnvironment("production", root, {}), /correct environment and canonical origin/);
});

test("contact secrets cannot be moved into public Wrangler variables", t => {
  const root = fixture(t);
  const config = JSON.parse(readFileSync(join(root, "wrangler.jsonc")));
  config.env.sandbox.vars.CONTACT_TO = "private@example.test";
  writeFileSync(join(root, "wrangler.jsonc"), JSON.stringify(config));
  assert.throws(() => loadBuildEnvironment("sandbox", root, {}), error => {
    assert.match(error.message, /must be a Worker secret/);
    assert.ok(!error.message.includes("private@example.test"));
    return true;
  });
});
