import { readFileSync, writeFileSync } from "node:fs";
import { assertEnvironment, checkEnvironment } from "./environment.mjs";

const [action = "check", selected] = process.argv.slice(2);
if (!["init", "check"].includes(action)) throw new Error("Expected init or check.");
const environments = selected ? [selected] : ["production", "sandbox"];
for (const environment of environments) {
  assertEnvironment(environment);
  if (action === "init") {
    for (const prefix of [".env", ".dev.vars"]) {
      const filename = `${prefix}.${environment}`;
      try {
        writeFileSync(filename, readFileSync(`${filename}.example`), { flag: "wx", mode: 0o600 });
        console.log(`Created ${filename}; fill only the documented values.`);
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        console.log(`Kept existing ${filename}.`);
      }
    }
  }
  const result = checkEnvironment(environment);
  console.log(`PASS: ${environment} configuration; local contact secrets ${result.localSecretsPresent ? "present" : "pending"}, public widget key ${result.siteKeyPresent ? "present" : "pending"}. Cloudflare delivery is verified separately.`);
}
