-- Patient portal identity only. No patient medical records or billing data.
CREATE TABLE IF NOT EXISTS portal_users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT,
 password_hash TEXT, password_salt TEXT, google_sub TEXT UNIQUE,
 email_verified INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL,
 disabled_at INTEGER
);
CREATE TABLE IF NOT EXISTS portal_sessions (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS portal_sessions_user ON portal_sessions(user_id);
CREATE TABLE IF NOT EXISTS portal_email_tokens (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
 purpose TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS portal_oauth_states (
 id TEXT PRIMARY KEY, verifier TEXT NOT NULL, nonce TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS portal_auth_limits (
 id TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
