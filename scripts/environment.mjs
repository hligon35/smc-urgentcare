import { readFileSync } from "node:fs";
import { join } from "node:path";

// Wrangler is the single source for public build and Worker environment settings.
export function loadBuildEnvironment(environment, root = process.cwd(), inherited = process.env) {
  if (!["production", "sandbox"].includes(environment)) throw new Error("Expected production or sandbox.");
  const config = JSON.parse(readFileSync(join(root, "wrangler.jsonc"), "utf8"));
  const target = config.env[environment];
  const origin = target.vars.SITE_ORIGIN;
  const expected = environment === "production"
    ? "https://smcurgentcareindy.com"
    : `https://${target.name}.hligon.workers.dev`;
  if (target.vars.ENVIRONMENT !== environment || origin !== expected)
    throw new Error(`${environment}: Wrangler must declare the correct environment and canonical origin.`);
  for (const key of ["CONTACT_TO", "TURNSTILE_SECRET_KEY"]) {
    if (Object.hasOwn(target.vars, key) || Object.hasOwn(config.vars, key))
      throw new Error(`${key} must be a Worker secret, not an ordinary Wrangler variable.`);
  }
  return { ...inherited, EXPO_PUBLIC_SITE_URL: origin, NODE_ENV: "production", EXPO_NO_DOTENV: "1" };
}
