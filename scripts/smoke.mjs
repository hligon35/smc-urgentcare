import assert from "node:assert/strict";
const origin = process.argv[2] || "http://127.0.0.1:8787";
const paths = [
  "/",
  "/services",
  "/about",
  "/visit",
  "/contact",
  "/privacy",
  "/accessibility",
];
for (const path of paths) {
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  const html = await response.text();
  assert.ok(html.includes('id="main"'), `${path}: content landmark`);
  assert.ok(html.includes("Patient portal"), `${path}: portal access`);
}
const missing = await fetch(new URL("/a-page-that-does-not-exist", origin));
assert.equal(missing.status, 404, "Unknown pages must be real 404 responses");
assert.match(await missing.text(), /This page has moved/);
const health = await fetch(new URL("/api/health", origin));
assert.equal(health.status, 200);
assert.equal((await health.json()).ok, true);
assert.equal(health.headers.get("Cache-Control"), "no-store");
console.log("PASS: 7 routes, real 404, security headers, and health endpoint.");
