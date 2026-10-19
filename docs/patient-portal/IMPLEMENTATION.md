# SMC CareConnect implementation

## Status and scope

**Implemented in source (not deployed):** branded responsive sign-in/register/recovery UI, email/password identity with PBKDF2-SHA256 + per-account salts and server pepper, email-verification and reset links sent by Resend, Google OpenID Connect with authorization-code + PKCE + ID token signature verification, HttpOnly signed-in session cookies backed by D1, guarded `/portal/*` pages, sign-out, and ten patient modules with synthetic data, navigation, search, filters and sample-only local draft interactions.

**Not implemented:** EHR integration, clinical messages/refills, actual billing, appointment booking, insurance eligibility, physician roster, HIPAA risk approval, authorized patient identity-proofing, proxy accounts, MFA and live patient medical records. **Do not use this as a clinical portal until these are separately reviewed.** Existing PrognoCIS link is preserved for real clinical workflows.

### Routes
- `/portal` — email/password registration, sign in, verification, reset links, Google sign-in
- `/portal/dashboard` — session-protected patient overview
- `/portal/results`, `/portal/medications`, `/portal/visits`, `/portal/messages`, `/portal/billing`, `/portal/insurance`, `/portal/care-team`, `/portal/documents`, `/portal/settings` — session-protected **synthetic** screens

All `/portal*` output has `no-store` and `noindex` response headers. Server session checks protect the private UI route before assets are served. No medical records are ingested or exposed by this code.

### Environment templates

The repository includes `.env.production.example` and `.env.sandbox.example` with every current patient-authentication setting. Copy each to its corresponding ignored local `.env.production` or `.env.sandbox`, enter a matching HTTPS `AUTH_ORIGIN`, and supply non-public values only in your private environment.

| Setting | Purpose | Location |
| --- | --- | --- |
| `EXPO_PUBLIC_SITE_URL` | Public Expo build origin and canonical links | Local environment / client build |
| `AUTH_ORIGIN` | Exact HTTPS origin validated by the authentication Worker | Worker runtime setting |
| `AUTH_PEPPER` | Secret for credential/session hashes | Worker secret; never commit |
| `GOOGLE_CLIENT_ID` | Google OAuth Web client | Worker runtime setting |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Worker secret; never commit |
| `RESEND_API_KEY` | Resend email API | Worker secret; never commit |
| `RESEND_FROM` | Domain-verified sender | Worker runtime setting |

`ENVIRONMENT` and the `AUTH_DB` D1 binding are already declared under the two Wrangler environments in `wrangler.jsonc`. Replace the D1 database-ID placeholders after creating separate databases. A plain environment variable cannot replace a D1 binding.

**Deployment distinction:** `scripts/build.mjs` reads the ignored local environment files for static build settings. This **does not** upload private variables to Cloudflare. Configure each Worker environment independently using Cloudflare secrets and variables (for example, `npx wrangler secret put AUTH_PEPPER --env sandbox`), and make sure `AUTH_ORIGIN` matches that deployed hostname. Do not put private values in `EXPO_PUBLIC_*` keys or tracked example files.

### Configuration (required before real sign-in works)

1. Have a clinician/owner approve use of the SMC CareConnect name, registration policy, account issuance, external auth providers, data flows and exact production deployment. Confirm whether account enrollment should be restricted to invited/verified patients; **self-registration is currently allowed for UI-only accounts** and does not verify a patient relationship.
2. Create **two distinct Cloudflare D1 databases**, one sandbox and one production, and replace both `REPLACE_WITH_*_D1_ID` placeholders in `wrangler.jsonc`. A deploy with placeholders must not be treated as a working environment.
3. Apply `migrations/0001_portal_auth.sql` to each database via Wrangler, using the proper environment and binding; review with `wrangler d1 migrations list` / `apply`.
4. Set Worker secrets in each environment:
   - `AUTH_PEPPER`: cryptographically random server-only secret, protected in a secret store; changing it invalidates credentials.
   - `AUTH_ORIGIN`: exact HTTPS origin (e.g. `https://smc-urgentcare.com` for production).
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth Web app credentials from Google's Console.
   - `RESEND_API_KEY`, `RESEND_FROM`: domain-verified sender authorized for **non-PHI** verification/recovery messages only.
5. Configure Google OAuth callback `https://<AUTH_ORIGIN_HOST>/api/portal/auth/google/callback` and authorized origins in the same Google OAuth project. Sandbox gets a separate OAuth client and exact origin.
6. Run `npm ci && npm run check && npm run build:mobile && npm run deploy:dry-run` locally. Inspect CSP/auth response behavior in real browsers, then deploy sandbox and perform end-to-end enrollment, email link, Google sign-in, session expiry and logout checks. Verify no private data in static bundles, browser storage, logs or cache.
7. Review protected route behavior under Expo static export + Cloudflare ASSETS binding. Only then promote to production after clinic approval.

### Security notes

- Auth SQL stores only account identity/session state (email, name, auth hashes/tokens). Medical data remains with PrognoCIS.
- Google accounts are not silently linked to existing password accounts using email alone. Existing password users signing in with Google receive an error until a verified linking flow is designed.
- Sessions are random opaque bearer values, stored hashed server-side and sent via HttpOnly, Secure, SameSite=Lax cookies. Do not add client-side token storage.
- Account recovery revokes prior sessions. Email/reset links are short-lived and single use. Email enumeration-resistant replies are used for registration and reset.
- Google ID token signatures, audience, nonce, issuer and expiration are validated using Google's published public JWKs.
- Abuse protection is basic IP-based D1 rate limiting; expand to identity/device rate limiting, Turnstile where appropriate, audit and security monitoring before exposing account creation publicly.
- Real patient data, real communication, payments, or MFA cannot safely be added as a front-end-only feature. A compliant authenticated clinical backend will need an additional project phase and legal review.

### Acceptance checklist

- Public homepage, about, services, visit and contact still render with original navigation.
- CareConnect login doesn't inherit the public site header/footer, and the existing clinical portal link remains available.
- When backend secrets/bindings are missing, auth fails closed with an error; protected pages redirect to login.
- Bad credentials, unverified email, expired/reused token, Google issuer/signature/nonce mismatch and cross-origin POSTs are rejected.
- Sandbox and production identities remain separate.
- Test responsive width 320px-1440px, keyboard navigation, focus states, sign-in errors, links, search, filters, demo drafts, phone links, screen readers and browser back.
