// Operator-only sample account setup. Never embed a password or AUTH_PEPPER in source.
import { pbkdf2Sync, randomBytes, randomUUID } from "node:crypto";
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { emitKeypressEvents } from "node:readline";
import { spawnSync } from "node:child_process";

const EMAIL = "user@test.com";
export function createSamplePasswordUpdate(password, pepper) {
  if (typeof pepper !== "string" || !pepper) throw Error("Existing Worker AUTH_PEPPER is required. Do not create or rotate it.");
  if (typeof password !== "string" || password.length < 8 || password.length > 128)
    throw Error("Use 8–128 characters for this operator-provisioned sample password.");
  const salt = randomBytes(24).toString("base64url");
  const hash = pbkdf2Sync(password + pepper, Buffer.from(salt,"base64url"),600000,32,"sha256").toString("base64url");
  // Every mutation is constrained to the active sample PATIENT account, never an admin.
  const target = `SELECT id FROM portal_users WHERE email='${EMAIL}' AND role='patient' AND disabled_at IS NULL`;
  return { hash, salt, sql: [
    `INSERT INTO portal_users (id,email,display_name,role,email_verified,created_at) VALUES ('${randomUUID()}','${EMAIL}','Sample User','patient',0,${Math.floor(Date.now()/1000)}) ON CONFLICT(email) DO NOTHING;`,
    `UPDATE portal_users SET password_hash='${hash}',password_salt='${salt}',email_verified=1 WHERE id IN (${target});`,
    `DELETE FROM portal_sessions WHERE user_id IN (${target});`,
    `DELETE FROM portal_email_tokens WHERE user_id IN (${target});`,
  ].join("\n") };
}

function hiddenInput(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw Error("Run in an interactive terminal, or provide SMC_SAMPLE_PASSWORD through a private environment variable.");
  process.stdout.write(label);
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolveInput,reject) => {
    let value="";
    function finish(error) {
      process.stdin.removeListener("keypress",onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error); else resolveInput(value);
    }
    function onKey(text,key={}) {
      if(key.ctrl && key.name==="c") return finish(Error("Cancelled."));
      if(key.name==="return" || key.name==="enter") return finish();
      if(key.name==="backspace") {value=Array.from(value).slice(0,-1).join("");return;}
      if(text && !key.ctrl && !key.meta && !/[\r\n\x00-\x1f\x7f]/.test(text)) value+=text;
    }
    process.stdin.on("keypress",onKey);
  });
}

async function main() {
  const environment=process.argv[2] || "production";
  if(!["production","sandbox"].includes(environment) || process.argv.length>3)
    throw Error("Usage: npm run sample-user:password [-- production|sandbox]");
  const filename=`.env.${environment}`;
  const fileEnv=existsSync(filename)?parseEnv(readFileSync(filename,"utf8")):{};
  if(fileEnv.AUTH_PEPPER && process.env.AUTH_PEPPER && fileEnv.AUTH_PEPPER!==process.env.AUTH_PEPPER)
    throw Error("AUTH_PEPPER differs between the environment and local file. Match the existing Worker secret first.");
  const pepper=process.env.AUTH_PEPPER || fileEnv.AUTH_PEPPER;
  if(!pepper) throw Error(`Set the EXISTING Worker AUTH_PEPPER in ${filename} or your private environment. Do not rotate it.`);
  const config=JSON.parse(readFileSync("wrangler.jsonc","utf8"));
  const database=config.env?.[environment]?.d1_databases?.find(item=>item.binding==="AUTH_DB")?.database_name;
  if(!database) throw Error(`No AUTH_DB database configured for ${environment}.`);
  const wrangler=resolve("node_modules/wrangler/bin/wrangler.js");
  if(!existsSync(wrangler)) throw Error("Run npm ci before setting the sample password.");
  const childEnv={...process.env};
  delete childEnv.SMC_SAMPLE_PASSWORD;
  delete childEnv.AUTH_PEPPER;
  function execute(args) {
    const result=spawnSync(process.execPath,[wrangler,"d1","execute",database,"--env",environment,"--remote","--json",...args],{encoding:"utf8",env:childEnv});
    // Wrangler output can include SQL/hash details; do not echo it to the terminal.
    if(result.status!==0) throw Error("D1 command failed. Check your Wrangler login, selected account, database binding, and applied migrations.");
    try {return JSON.parse(result.stdout).flatMap(entry=>entry.results || []);}
    catch {throw Error("Could not read Wrangler's JSON response. Check the installed Wrangler version.");}
  }
  const rows=execute(["--command",`SELECT id,email,role,disabled_at FROM portal_users WHERE email='${EMAIL}'`]);
  if(rows.length>1 || (rows.length===1 && (rows[0].role!=="patient" || rows[0].disabled_at!==null)))
    throw Error("The sample address belongs to a disabled account or another role. This command will not enable it or change roles.");
  console.log(`Setting the sample patient password for ${EMAIL} in ${database} (${environment}).`);
  let password=process.env.SMC_SAMPLE_PASSWORD;
  if(password===undefined) {
    password=await hiddenInput("Password (hidden): ");
    if(password!==await hiddenInput("Confirm password (hidden): ")) throw Error("Passwords did not match.");
  }
  const update=createSamplePasswordUpdate(password,pepper);
  const directory=mkdtempSync(join(tmpdir(),"smc-sample-password-"));
  try {
    const file=join(directory,"update.sql");
    writeFileSync(file,update.sql,{mode:0o600});
    execute(["--file",file]);
    const checked=execute(["--command",`SELECT password_hash,password_salt,email_verified FROM portal_users WHERE email='${EMAIL}' AND role='patient' AND disabled_at IS NULL`]);
    if(checked.length!==1 || checked[0].password_hash!==update.hash || checked[0].password_salt!==update.salt || checked[0].email_verified!==1)
      throw Error("Sample password update could not be verified.");
    console.log(`Sample password set and verified. Sign in as ${EMAIL} with the password you entered.`);
  } finally {rmSync(directory,{recursive:true,force:true});}
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))
  await main().catch(error=>{console.error(error.message);process.exitCode=1;});
