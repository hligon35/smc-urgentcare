-- Pending Google identities are not patient accounts or login sessions.
CREATE TABLE IF NOT EXISTS portal_google_registrations (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL,
 google_sub TEXT NOT NULL,
 display_name TEXT,
 authoritative INTEGER NOT NULL CHECK(authoritative IN (0,1)),
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS portal_google_registrations_expiry ON portal_google_registrations(expires_at);
