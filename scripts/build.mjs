import { readFileSync, existsSync, rmSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawnSync } from "node:child_process";

const environment = process.argv[2] || "production";
if (!["production", "sandbox"].includes(environment))
  throw new Error("Expected production or sandbox.");
const filename = `.env.${environment}`;
const fileEnv = existsSync(filename)
  ? parseEnv(readFileSync(filename, "utf8"))
  : {};
const env = {
  ...process.env,
  ...fileEnv,
  NODE_ENV: "production",
  EXPO_NO_DOTENV: "1",
};
if (environment === "sandbox" && !env.EXPO_PUBLIC_SITE_URL)
  throw new Error(
    "Set EXPO_PUBLIC_SITE_URL to your sandbox origin in .env.sandbox.",
  );
env.EXPO_PUBLIC_SITE_URL ||= "https://smcurgentcareindy.com";
const rawOrigin = env.EXPO_PUBLIC_SITE_URL.trim();
if (rawOrigin.includes(","))
  throw new Error(`${filename}: EXPO_PUBLIC_SITE_URL must be ONE URL (not a comma-separated list). Use ${environment === "sandbox" ? "https://smc-urgentcare.hligon.workers.dev" : "https://smcurgentcareindy.com"}.`);
let url;
try { url = new URL(rawOrigin); }
catch { throw new Error(`${filename}: Invalid EXPO_PUBLIC_SITE_URL; specify one HTTPS origin.`); }
if (
  url.protocol !== "https:" ||
  url.pathname !== "/" ||
  url.search ||
  url.hash ||
  url.username ||
  url.password ||
  url.origin !== rawOrigin.replace(/\/$/, "")
)
  throw new Error(
    "EXPO_PUBLIC_SITE_URL must be an HTTPS origin without a path, credentials, or query.",
  );
if (environment === "production" && url.origin !== "https://smcurgentcareindy.com")
  throw new Error("Production origin must be an approved SMC domain.");
if (
  environment === "sandbox" &&
  url.origin !== "https://smc-urgentcare.hligon.workers.dev"
)
  throw new Error("Sandbox origin must match the existing smc-urgentcare.hligon.workers.dev Worker.");
env.EXPO_PUBLIC_SITE_URL = url.origin;
// Clear generated output so retired routes and obsolete hashed assets cannot survive a rebuild.
rmSync("dist", { recursive: true, force: true });
for (const args of [
  ["scripts/prepare-theme.mjs"],
  ["node_modules/expo/bin/cli", "export", "--platform", "web"],
  ["scripts/prepare-web.mjs"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
