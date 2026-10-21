import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { loadBuildEnvironment } from "./environment.mjs";

const environment = process.argv[2] || "production";
const env = loadBuildEnvironment(environment);
// Clear generated output so retired routes and obsolete hashed assets cannot survive a rebuild.
rmSync("dist", { recursive: true, force: true });
for (const args of [
  ["scripts/prepare-theme.mjs"],
  ["node_modules/expo/bin/cli", "export", "--platform", "web"],
  ["scripts/prepare-web.mjs"],
  ["scripts/check-build.mjs", environment],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
