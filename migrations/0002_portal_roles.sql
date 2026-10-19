-- Add role for interface-only access. No clinical privileges are granted.
ALTER TABLE portal_users ADD COLUMN role TEXT NOT NULL DEFAULT 'patient' CHECK(role IN ('patient','admin_developer'));
