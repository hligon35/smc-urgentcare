import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.mjs";
import {createSamplePasswordUpdate} from "../scripts/set-sample-password.mjs";
import {testDatabase} from "./helpers/d1.mjs";
import {withGoogle,authVars,authRequest} from "./helpers/google.mjs";

test("operator sets only the sample patient password and can log in with eight characters",async()=>{
  const {sqlite,db}=testDatabase();const password="x".repeat(8);
  const env={...authVars,AUTH_DB:db};
  try {
    sqlite.exec("INSERT INTO portal_users (id,email,role,email_verified,created_at) VALUES ('sample','user@test.com','patient',0,1),('admin','admin@example.com','admin_developer',1,1)");
    sqlite.exec("INSERT INTO portal_sessions VALUES ('sample-session','sample',1,9999999999),('admin-session','admin',1,9999999999)");
    const update=createSamplePasswordUpdate(password,env.AUTH_PEPPER);
    assert.equal(update.sql.includes(password),false);assert.equal(update.sql.includes(env.AUTH_PEPPER),false);
    sqlite.exec(update.sql);
    assert.equal(sqlite.prepare("SELECT email_verified FROM portal_users WHERE id='sample'").get().email_verified,1);
    assert.equal(sqlite.prepare("SELECT count(*) n FROM portal_sessions WHERE user_id='sample'").get().n,0);
    assert.equal(sqlite.prepare("SELECT count(*) n FROM portal_sessions WHERE user_id='admin'").get().n,1);
    assert.equal(sqlite.prepare("SELECT password_hash FROM portal_users WHERE id='admin'").get().password_hash,null);
    await withGoogle(env,{email:"unused@gmail.com",sub:"unused"},async()=>{
      const login=await worker.fetch(authRequest("login",{email:"user@test.com",password,turnstileToken:"test-token"}),env);
      assert.equal(login.status,200);assert.match(login.headers.get("Set-Cookie"),/__Host-smc_session=/);
      assert.equal((await worker.fetch(authRequest("login",{email:"user@test.com",password:"wrong123",turnstileToken:"test-token"}),env)).status,401);
      const registration=await worker.fetch(authRequest("register",{email:"new@example.com",password,turnstileToken:"test-token"}),env);
      assert.equal(registration.status,400);
    });
  } finally {sqlite.close();}
});

test("sample SQL cannot change a disabled account or an account with an admin role",()=>{
  for(const [role,disabled] of [["admin_developer",null],["patient",1]]){
    const {sqlite}=testDatabase();
    try {
      sqlite.prepare("INSERT INTO portal_users (id,email,role,email_verified,created_at,disabled_at) VALUES (?,?,?,?,?,?)").run("protected","user@test.com",role,0,1,disabled);
      sqlite.exec(createSamplePasswordUpdate("x".repeat(8),"test-pepper").sql);
      const row=sqlite.prepare("SELECT password_hash,email_verified FROM portal_users").get();
      assert.equal(row.password_hash,null);assert.equal(row.email_verified,0);
    } finally {sqlite.close();}
  }
});

test("provisioning requires a pepper and an operator-selected password",()=>{
  assert.throws(()=>createSamplePasswordUpdate("x".repeat(8),""),/AUTH_PEPPER/);
  assert.throws(()=>createSamplePasswordUpdate("short","test-pepper"),/8–128/);
});

test("provisioning can create the missing sample patient without an inbox",()=>{
  const {sqlite}=testDatabase();
  try {
    sqlite.exec(createSamplePasswordUpdate("x".repeat(8),"test-pepper").sql);
    const row=sqlite.prepare("SELECT email,display_name,role,email_verified FROM portal_users").get();
    assert.equal(row.email,"user@test.com");assert.equal(row.display_name,"Sample User");
    assert.equal(row.role,"patient");assert.equal(row.email_verified,1);
  } finally {sqlite.close();}
});
