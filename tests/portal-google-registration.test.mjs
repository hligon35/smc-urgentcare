import test from "node:test";
import assert from "node:assert/strict";
import {pbkdf2Sync} from "node:crypto";
import worker from "../worker/index.mjs";
import {testDatabase} from "./helpers/d1.mjs";
import {withGoogle,authVars,authRequest,cookies} from "./helpers/google.mjs";

const password="A patient test password 42!";
const salt=Buffer.from("test-unique-salt").toString("base64url");
const hash=pbkdf2Sync(password+authVars.AUTH_PEPPER,Buffer.from(salt,"base64url"),600000,32,"sha256").toString("base64url");
function seed(sqlite,email,{sub=null,verified=1,role="patient",disabled=null}={}){
  sqlite.prepare("INSERT INTO portal_users (id,email,password_hash,password_salt,google_sub,email_verified,created_at,role,disabled_at) VALUES (?,?,?,?,?,?,?,?,?)").run("existing",email,hash,salt,sub,verified,1,role,disabled);
}

test("new Google email is prefilled from a secure handoff, creates no account until submit, and supports password login",async()=>{
  const {db,sqlite}=testDatabase();const env={...authVars,AUTH_DB:db};
  try{await withGoogle(env,{email:"new.patient@gmail.com",sub:"new-google",name:"New Patient"},async({callback})=>{
    const response=await callback();
    assert.equal(response.headers.get("Location"),"/portal?mode=register&provider=google");
    assert.equal(sqlite.prepare("SELECT count(*) n FROM portal_users").get().n,0);
    assert.equal(sqlite.prepare("SELECT count(*) n FROM portal_sessions").get().n,0);
    const cookie=cookies(response);
    assert.match(response.headers.get("Set-Cookie"),/__Host-smc_google_registration=[a-f0-9]{64}; Path=\/; Secure; HttpOnly; SameSite=Lax/);
    const profile=await(await worker.fetch(authRequest("google/registration",undefined,cookie),env)).json();
    assert.equal(profile.email,"new.patient@gmail.com");assert.equal(profile.action,"register");
    const bad=await worker.fetch(authRequest("register",{email:"other@gmail.com",password,turnstileToken:"test-token",googleRegistration:"1"},cookie),env);
    assert.equal(bad.status,410);
    const request=()=>authRequest("register",{email:profile.email,password,turnstileToken:"test-token",googleRegistration:"1",role:"admin_developer"},cookie);
    const completed=await worker.fetch(request(),env);
    assert.equal(completed.status,200);assert.equal((await completed.json()).signedIn,true);
    assert.match(cookies(completed),/__Host-smc_session=/);
    const row=sqlite.prepare("SELECT * FROM portal_users").get();
    assert.equal(row.email_verified,1);assert.equal(row.google_sub,"new-google");assert.equal(row.role,"patient");assert.ok(row.password_hash);
    assert.equal((await worker.fetch(request(),env)).status,410);
    const login=await worker.fetch(authRequest("login",{email:profile.email,password,turnstileToken:"test-token"}),env);
    assert.equal(login.status,200);
    assert.equal((await worker.fetch(authRequest("login",{email:profile.email,password:"incorrect password 123",turnstileToken:"test-token"}),env)).status,401);
    assert.equal((await callback()).headers.get("Location"),"/portal/dashboard");
  });}finally{sqlite.close();}
});

test("existing verified password account can use Google without losing its password or role",async()=>{
  const {db,sqlite}=testDatabase();const email="existing.patient@gmail.com";seed(sqlite,email,{role:"admin_developer"});
  try{await withGoogle({...authVars,AUTH_DB:db},{email,sub:"existing-google"},async({callback})=>{
    const response=await callback();assert.equal(response.headers.get("Location"),"/portal/dashboard");
    const row=sqlite.prepare("SELECT * FROM portal_users").get();assert.equal(row.password_hash,hash);assert.equal(row.role,"admin_developer");assert.equal(row.google_sub,"existing-google");
    assert.equal(sqlite.prepare("SELECT count(*) n FROM portal_users").get().n,1);
  });}finally{sqlite.close();}
});

test("external Google email requires the existing password before linking",async()=>{
  const {db,sqlite}=testDatabase();const email="existing@example.com";seed(sqlite,email);const env={...authVars,AUTH_DB:db};
  try{await withGoogle(env,{email,sub:"external-google"},async({callback})=>{
    const response=await callback();assert.equal(response.headers.get("Location"),"/portal?provider=google");
    const cookie=cookies(response);assert.equal((await(await worker.fetch(authRequest("google/registration",undefined,cookie),env)).json()).action,"link");
    assert.equal(sqlite.prepare("SELECT google_sub FROM portal_users").get().google_sub,null);
    const bad=await worker.fetch(authRequest("login",{email,password:"incorrect password 123",turnstileToken:"test-token",googleRegistration:"1"},cookie),env);assert.equal(bad.status,401);
    const login=await worker.fetch(authRequest("login",{email,password,turnstileToken:"test-token",googleRegistration:"1"},cookie),env);
    assert.equal(login.status,200);assert.match(cookies(login),/__Host-smc_session=/);
    assert.equal(sqlite.prepare("SELECT google_sub FROM portal_users").get().google_sub,"external-google");
    assert.equal(sqlite.prepare("SELECT count(*) n FROM portal_google_registrations").get().n,0);
  });}finally{sqlite.close();}
});

test("new external Google email requires inbox verification and cannot bypass it by signing in again",async()=>{
  const {db,sqlite}=testDatabase();const email="new@example.com";const env={...authVars,AUTH_DB:db,RESEND_API_KEY:"test-resend",RESEND_FROM:"verified@example.com"};
  try{await withGoogle(env,{email,sub:"external-new"},async({callback,mails})=>{
    const pending=await callback();const cookie=cookies(pending);
    const body={email,password,turnstileToken:"test-token",googleRegistration:"1"};
    assert.equal((await worker.fetch(authRequest("register",body,cookie),{...env,RESEND_API_KEY:""})).status,503);
    const registered=await worker.fetch(authRequest("register",body,cookie),env);assert.equal(registered.status,200);assert.equal((await registered.json()).signedIn,undefined);
    assert.equal(sqlite.prepare("SELECT email_verified FROM portal_users").get().email_verified,0);assert.equal(mails.length,1);
    const oldError=console.error;console.error=()=>{};
    try{assert.equal((await callback()).headers.get("Location"),"/portal?error=google");}finally{console.error=oldError;}
    const token=new URL(mails[0].text.split("\n")[1]).searchParams.get("token");
    assert.equal((await worker.fetch(authRequest("verify",{token}),env)).status,200);
    assert.equal((await callback()).headers.get("Location"),"/portal/dashboard");
  });}finally{sqlite.close();}
});

test("plain email/password registration retains inbox verification and login",async()=>{
  const {db,sqlite}=testDatabase();const email="password@example.com";const env={...authVars,AUTH_DB:db,RESEND_API_KEY:"test-resend",RESEND_FROM:"verified@example.com"};
  try{await withGoogle(env,{email,sub:"unused"},async({mails})=>{
    assert.equal((await worker.fetch(authRequest("register",{email,password,turnstileToken:"test-token"}),env)).status,200);
    assert.equal((await worker.fetch(authRequest("login",{email,password,turnstileToken:"test-token"}),env)).status,401);
    const token=new URL(mails[0].text.split("\n")[1]).searchParams.get("token");
    assert.equal((await worker.fetch(authRequest("verify",{token}),env)).status,200);
    assert.equal((await worker.fetch(authRequest("login",{email,password,turnstileToken:"test-token"}),env)).status,200);
    assert.equal(sqlite.prepare("SELECT google_sub FROM portal_users").get().google_sub,null);
  });}finally{sqlite.close();}
});

test("handoffs expire and cannot be read without the browser cookie",async()=>{
  const {db,sqlite}=testDatabase();const env={...authVars,AUTH_DB:db};
  try{await withGoogle(env,{email:"expiry@gmail.com",sub:"expiry"},async({callback})=>{
    const pending=await callback();
    assert.equal((await worker.fetch(authRequest("google/registration"),env)).status,410);
    sqlite.exec("UPDATE portal_google_registrations SET expires_at=0");
    assert.equal((await worker.fetch(authRequest("google/registration",undefined,cookies(pending)),env)).status,410);
  });}finally{sqlite.close();}
});

test("disabled, mismatched and unverified password accounts cannot be claimed through Google",async()=>{
  for(const options of [{disabled:1},{sub:"different-google"},{verified:0}]){
    const {db,sqlite}=testDatabase();const email="protected@gmail.com";seed(sqlite,email,options);
    const originalError=console.error;console.error=()=>{};
    try{await withGoogle({...authVars,AUTH_DB:db},{email,sub:"attempted-google"},async({callback})=>{
      assert.equal((await callback()).headers.get("Location"),"/portal?error=google");
      assert.equal(sqlite.prepare("SELECT count(*) n FROM portal_sessions").get().n,0);
      const row=sqlite.prepare("SELECT google_sub,password_hash FROM portal_users").get();
      assert.equal(row.google_sub,options.sub || null);assert.equal(row.password_hash,hash);
    });}finally{console.error=originalError;sqlite.close();}
  }
});

test("Workspace email can link a verified password account after Google proves the hosted domain",async()=>{
  const {db,sqlite}=testDatabase();const email="patient@workspace.example";seed(sqlite,email);
  try{await withGoogle({...authVars,AUTH_DB:db},{email,sub:"workspace-google",hd:"workspace.example"},async({callback})=>{
    assert.equal((await callback()).headers.get("Location"),"/portal/dashboard");
    assert.equal(sqlite.prepare("SELECT google_sub FROM portal_users").get().google_sub,"workspace-google");
  });}finally{sqlite.close();}
});
