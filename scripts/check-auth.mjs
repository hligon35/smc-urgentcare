// Read-only deployment check. Prints public readiness flags, never tokens or credentials.
const origin = new URL(process.argv[2] || "https://smcuc.alphazonelabs.com").origin;
const response = await fetch(`${origin}/api/portal/auth/config`, {
  redirect: "manual", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000),
});
console.log(`Auth config HTTP ${response.status}`);
if (response.status >= 300 && response.status < 400) {
  console.error("An upstream login gate redirected the request. Check from your authenticated browser session.");
  process.exitCode = 1;
} else if (!(response.headers.get("Content-Type") || "").includes("application/json")) {
  console.error("The response is not Worker JSON. Inspect Cloudflare Access/WAF before changing app auth.");
  process.exitCode = 1;
} else {
  const data = await response.json();
  for (const key of ["error", "code", "configurationCode", "requestId", "databaseReady", "emailPasswordReady", "googleReady", "recoveryReady"])
    if (key in data) console.log(`${key}: ${data[key]}`);
  if (!response.ok || !data.googleReady) process.exitCode = 1;
}
