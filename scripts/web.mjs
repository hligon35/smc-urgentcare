import { spawnSync } from "node:child_process";
import { loadBuildEnvironment } from "./environment.mjs";

// Component development uses the sandbox origin; never auto-load generic/stale .env files.
const env = { ...loadBuildEnvironment("sandbox"), NODE_ENV: "development" };
for (const args of [["scripts/prepare-theme.mjs"], ["node_modules/expo/bin/cli", "start", "--web", ...process.argv.slice(2)]]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
