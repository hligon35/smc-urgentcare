// Generate reviewed, idempotent D1 SQL for test accounts. No passwords, secrets or live execution.
import { randomUUID } from "node:crypto";
const now = Math.floor(Date.now()/1000);
const users = [
  { email:"user@test.com", name:"Sample User", role:"patient" },
  { email:"hligon@getsparqd.com", name:null, role:"admin_developer" },
];
for (const user of users) {
  const id=randomUUID();
  const escapedName=user.name===null?"NULL":`'${user.name.replaceAll("'","''")}'`;
  console.log(`INSERT INTO portal_users (id,email,display_name,role,email_verified,created_at) VALUES ('${id}','${user.email}',${escapedName},'${user.role}',0,${now}) ON CONFLICT(email) DO NOTHING;`);
}
console.error("Accounts remain unclaimed. Google login requires a verified matching Google account. No password is assigned.");
