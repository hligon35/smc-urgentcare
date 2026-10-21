import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, cpSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { origins, loadBuildEnvironment, checkEnvironment } from "../scripts/environment.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "smc-env-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of ["scripts", "wrangler.jsonc", ".env.production.example", ".env.sandbox.example", ".dev.vars.production.example", ".dev.vars.sandbox.example"])
    cpSync(resolve(file), join(root, file), { recursive: true });
  return root;
}

test("fresh checkouts use isolated canonical origins without requiring private secrets", t => {
  const root = fixture(t);
  for (const environment of Object.keys(origins)) {
    const env = loadBuildEnvironment(environment, root, {});
    assert.equal(env.EXPO_PUBLIC_SITE_URL, origins[environment]);
    assert.equal(env.EXPO_NO_DOTENV, "1");
    assert.equal(env.NODE_ENV, "production");
    assert.equal(checkEnvironment(environment, root).localSecretsPresent, false);
  }
  assert.throws(() => loadBuildEnvironment("staging", root, {}), /Expected production or sandbox/);
});

test("builds reject mixed origins and private or retired variables without revealing values", t => {
  const root = fixture(t);
  for (const value of [origins.sandbox, `${origins.production},${origins.sandbox}`, `${origins.production}/contact`, "http://smcurgentcareindy.com"]) {
    writeFileSync(join(root, ".env.production"), `EXPO_PUBLIC_SITE_URL=${value}\n`);
    assert.throws(() => loadBuildEnvironment("production", root, {}), /one HTTPS origin/);
  }
  writeFileSync(join(root, ".env.production"), `CONTACT_TO=private-inbox@example.test\nGOOGLE_CLIENT_SECRET=private-test-secret\n`);
  assert.throws(() => loadBuildEnvironment("production", root, {}), error => {
    assert.match(error.message, /unsupported variables/);
    assert.ok(!error.message.includes("private-inbox") && !error.message.includes("private-test-secret"));
    return true;
  });
});

test("local Worker secrets stay out of build variables and ordinary Wrangler vars", t => {
  const root = fixture(t);
  writeFileSync(join(root, ".dev.vars.sandbox"), "CONTACT_TO=local@example.test\nTURNSTILE_SECRET_KEY=private-test-secret\n");
  assert.equal(checkEnvironment("sandbox", root).localSecretsPresent, true);
  const env = loadBuildEnvironment("sandbox", root, {});
  assert.equal(env.CONTACT_TO, undefined);
  assert.equal(env.TURNSTILE_SECRET_KEY, undefined);
  const config = JSON.parse(readFileSync(join(root, "wrangler.jsonc")));
  config.env.sandbox.vars.CONTACT_TO = "";
  writeFileSync(join(root, "wrangler.jsonc"), JSON.stringify(config));
  assert.throws(() => checkEnvironment("sandbox", root), /must be a Worker secret/);
});

test("env:init creates private local files and preserves existing values on reruns", t => {
  const root = fixture(t);
  const run = () => spawnSync(process.execPath, ["scripts/environment-cli.mjs", "init"], { cwd: root, encoding: "utf8" });
  assert.equal(run().status, 0);
  for (const environment of Object.keys(origins)) {
    for (const prefix of [".env", ".dev.vars"])
      assert.equal(statSync(join(root, `${prefix}.${environment}`)).mode & 0o777, 0o600);
  }
  const filename = join(root, ".dev.vars.production");
  const content = "CONTACT_TO=local@example.test\nTURNSTILE_SECRET_KEY=private-test-secret\n";
  writeFileSync(filename, content);
  const rerun = run();
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.equal(readFileSync(filename, "utf8"), content);
  assert.ok(!rerun.stdout.includes("local@example.test") && !rerun.stdout.includes("private-test-secret"));
});
