import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

export const origins = {
  production: "https://smcurgentcareindy.com",
  sandbox: "https://smc-urgentcare-sandbox.hligon.workers.dev",
};
export const secretKeys = ["CONTACT_TO", "TURNSTILE_SECRET_KEY"];

export function assertEnvironment(environment) {
  if (!Object.hasOwn(origins, environment)) throw new Error("Expected production or sandbox.");
}

export function readEnvFile(filename, allowedKeys) {
  if (!existsSync(filename)) return {};
  const values = parseEnv(readFileSync(filename, "utf8"));
  const unexpected = Object.keys(values).filter(key => !allowedKeys.includes(key));
  if (unexpected.length) {
    throw new Error(`${filename}: unsupported variables (${unexpected.join(", ")}). Keep only the keys in its .example template; move Worker secrets to .dev.vars.<environment>.`);
  }
  return values;
}

export function loadBuildEnvironment(environment, root = process.cwd(), inherited = process.env) {
  assertEnvironment(environment);
  const filename = join(root, `.env.${environment}`);
  const values = readEnvFile(filename, ["EXPO_PUBLIC_SITE_URL"]);
  const raw = values.EXPO_PUBLIC_SITE_URL ?? inherited.EXPO_PUBLIC_SITE_URL ?? origins[environment];
  // Exact origins keep sandbox metadata out of production and production metadata out of sandbox.
  if (raw.trim().replace(/\/$/, "") !== origins[environment]) {
    throw new Error(`${filename}: EXPO_PUBLIC_SITE_URL must be ${origins[environment]} (one HTTPS origin).`);
  }
  return { ...inherited, EXPO_PUBLIC_SITE_URL: origins[environment], NODE_ENV: "production", EXPO_NO_DOTENV: "1" };
}

export function checkEnvironment(environment, root = process.cwd()) {
  const build = loadBuildEnvironment(environment, root, {});
  const template = readEnvFile(join(root, `.env.${environment}.example`), ["EXPO_PUBLIC_SITE_URL"]);
  if (template.EXPO_PUBLIC_SITE_URL !== origins[environment]) throw new Error(`${environment}: build template origin is out of date.`);
  const config = JSON.parse(readFileSync(join(root, "wrangler.jsonc"), "utf8"));
  const target = config.env[environment];
  if (target.vars.ENVIRONMENT !== environment || target.vars.SITE_ORIGIN !== build.EXPO_PUBLIC_SITE_URL)
    throw new Error(`${environment}: Wrangler and build origins must agree.`);
  for (const key of secretKeys) {
    if (Object.hasOwn(target.vars, key) || Object.hasOwn(config.vars, key))
      throw new Error(`${key} must be a Worker secret, not an ordinary Wrangler variable.`);
  }
  readEnvFile(join(root, `.dev.vars.${environment}.example`), secretKeys);
  const secrets = readEnvFile(join(root, `.dev.vars.${environment}`), secretKeys);
  // Never include secret values in validation output.
  if (secrets.CONTACT_TO && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(secrets.CONTACT_TO))
    throw new Error(`${environment}: CONTACT_TO must be empty or a valid email address.`);
  return { localSecretsPresent: secretKeys.every(key => !!secrets[key]), siteKeyPresent: !!target.vars.TURNSTILE_SITE_KEY };
}
