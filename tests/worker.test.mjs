import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.mjs";

function env(status = 200, type = "text/html", environment = "production") {
  return {
    ENVIRONMENT: environment,
    ASSETS: {
      fetch: async () =>
        new Response("<html>Care</html>", {
          status,
          headers: { "Content-Type": type },
        }),
    },
  };
}
test("public pages receive security headers and revalidation without advertising or permission access", async () => {
  const response = await worker.fetch(
    new Request("https://smc-urgentcare.com/visit"),
    env(),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  assert.equal(
    response.headers.get("Cache-Control"),
    "public, max-age=0, must-revalidate",
  );
  assert.match(
    response.headers.get("Content-Security-Policy"),
    /script-src 'self';/,
  );
  assert.doesNotMatch(
    response.headers.get("Content-Security-Policy"),
    /script-src[^;]*unsafe-inline/,
  );
  assert.match(response.headers.get("Permissions-Policy"), /camera=\(\)/);
  assert.match(
    response.headers.get("Content-Security-Policy"),
    /frame-src https:\/\/www\.google\.com\/maps\/embed;/,
  );
  assert.match(
    response.headers.get("Content-Security-Policy"),
    /frame-ancestors 'none'/,
  );
  assert.equal(response.headers.has("X-Robots-Tag"), false);
});
test("hashed bundles and explicitly versioned images can be cached immutably; HTML cannot", async () => {
  for (const path of [
    "/_expo/static/js/web/entry-abc.js",
    "/images/caring-visit-v1.webp",
    "/images/smc-logo-v1.png",
  ]) {
    const response = await worker.fetch(
      new Request(`https://smc-urgentcare.com${path}`),
      env(200, "application/octet-stream"),
    );
    assert.equal(
      response.headers.get("Cache-Control"),
      "public, max-age=31536000, immutable",
    );
  }
});
test("unknown URLs preserve 404 and cannot be cached or indexed", async () => {
  const response = await worker.fetch(
    new Request("https://smc-urgentcare.com/missing"),
    env(404),
  );
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
});
test("sandbox disables indexing even when serving an otherwise production static export", async () => {
  const environment = env(200, "text/html", "sandbox");
  const page = await worker.fetch(
    new Request("https://smc-urgentcare.com/"),
    environment,
  );
  assert.equal(page.headers.get("X-Robots-Tag"), "noindex, nofollow");
  const robots = await worker.fetch(
    new Request("https://smc-urgentcare.com/robots.txt"),
    environment,
  );
  assert.equal(await robots.text(), "User-agent: *\nDisallow: /\n");
});
test("health, invalid APIs, and unsupported submission methods never use public cache", async () => {
  const health = await worker.fetch(
    new Request("https://smc-urgentcare.com/api/health"),
    env(),
  );
  assert.equal(health.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await health.json(), {
    ok: true,
    service: "smc-urgentcare",
    environment: "production",
  });
  const missing = await worker.fetch(
    new Request("https://smc-urgentcare.com/api/patients"),
    env(),
  );
  assert.equal(missing.status, 404);
  const post = await worker.fetch(
    new Request("https://smc-urgentcare.com/contact", {
      method: "POST",
      body: "sensitive",
    }),
    env(),
  );
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("Allow"), "GET, HEAD");
  assert.equal(post.headers.get("Cache-Control"), "no-store");
});
test("asset binding failures return a protected, uncacheable error without leaking details", async () => {
  const response = await worker.fetch(
    new Request("https://smc-urgentcare.com/"),
    {
      ENVIRONMENT: "production",
      ASSETS: {
        fetch: async () => {
          throw new Error("internal detail");
        },
      },
    },
  );
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.doesNotMatch(await response.text(), /internal detail/);
});
test("HEAD retains the response status and headers with no body", async () => {
  const response = await worker.fetch(
    new Request("https://smc-urgentcare.com/visit", { method: "HEAD" }),
    env(),
  );
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("Content-Type"), "text/html");
});

test("production aliases retain paths and query parameters when redirecting to the canonical host", async () => {
  const response = await worker.fetch(
    new Request("https://www.smc-urgentcare.com/visit?source=link"),
    env(),
  );
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("Location"),
    "https://smc-urgentcare.com/visit?source=link",
  );
});
test("workers.dev origins stay out of search results even for a production deployment", async () => {
  const response = await worker.fetch(
    new Request("https://smc-urgentcare.example.workers.dev/"),
    env(),
  );
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
});


test("unconfigured patient authentication fails closed and is not cached", async () => {
  const response = await worker.fetch(new Request("https://smc-urgentcare.com/api/portal/auth/session"), env());
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
});
test("private portal routes redirect unauthenticated users to the sign-in page", async () => {
  const response = await worker.fetch(new Request("https://smc-urgentcare.com/portal/dashboard"), env());
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("Location"), "https://smc-urgentcare.com/portal");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
});
test("portal entry is public but uncached and excluded from indexing", async () => {
  const response = await worker.fetch(new Request("https://smc-urgentcare.com/portal"), env());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
});
