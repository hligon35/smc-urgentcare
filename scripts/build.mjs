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
env.EXPO_PUBLIC_SITE_URL ||= "https://smc-urgentcare.com";
const url = new URL(env.EXPO_PUBLIC_SITE_URL);
if (
  url.protocol !== "https:" ||
  url.pathname !== "/" ||
  url.search ||
  url.hash ||
  url.username ||
  url.password
)
  throw new Error(
    "EXPO_PUBLIC_SITE_URL must be an HTTPS origin without a path, credentials, or query.",
  );
if (environment === "production" && url.origin !== "https://smc-urgentcare.com")
  throw new Error("Production origin must be https://smc-urgentcare.com.");
if (
  environment === "sandbox" &&
  ["smc-urgentcare.com", "www.smc-urgentcare.com"].includes(url.hostname)
)
  throw new Error("Sandbox must use a separate origin.");
env.EXPO_PUBLIC_SITE_URL = url.origin;
// Clear generated output so retired routes and obsolete hashed assets cannot survive a rebuild.
rmSync("dist", { recursive: true, force: true });
for (const args of [
  ["node_modules/expo/bin/cli", "export", "--platform", "web"],
  ["scripts/prepare-web.mjs"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
