import { describeAuthFailure, logAuthFailure } from "./portal-errors.mjs";

// Validate the schema without reading account rows. A binding alone isn't readiness.
const schemaChecks = [
  "SELECT id,email,google_sub,display_name,authoritative,expires_at FROM portal_google_registrations LIMIT 0",
  "SELECT id,email,display_name,password_hash,password_salt,google_sub,email_verified,created_at,disabled_at,role FROM portal_users LIMIT 0",
  "SELECT id,user_id,created_at,expires_at FROM portal_sessions LIMIT 0",
  "SELECT id,user_id,purpose,expires_at FROM portal_email_tokens LIMIT 0",
  "SELECT id,verifier,nonce,expires_at FROM portal_oauth_states LIMIT 0",
  "SELECT id,attempts,expires_at FROM portal_auth_limits LIMIT 0",
];

export async function portalDatabaseStatus(env, request) {
  let failure;
  if (typeof env.AUTH_DB?.prepare !== "function" || typeof env.AUTH_DB?.batch !== "function") {
    failure = { code: "AUTH_DATABASE_BINDING_MISSING" };
  } else {
    try {
      await env.AUTH_DB.batch(schemaChecks.map(sql => env.AUTH_DB.prepare(sql)));
      return { ready: true };
    } catch (error) {
      failure = describeAuthFailure(error);
    }
  }
  return { ready: false, code: failure.code, requestId: logAuthFailure(failure, request) };
}
