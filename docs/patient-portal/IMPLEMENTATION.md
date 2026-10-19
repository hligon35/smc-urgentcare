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

`ENVIRONMENT` and the `AUTH_DB` D1 binding are already declared under the two Wrangler environments in `wrangler.jsonc`. The existing D1 IDs are set in Wrangler; verify they correspond to Cloudflare databases `smc-db` (production) and `smc-sandbox` (sandbox). A plain environment variable cannot replace a D1 binding.

**Deployment distinction:** `scripts/build.mjs` reads the ignored local environment files for static build settings. This **does not** upload private variables to Cloudflare. Configure each Worker environment independently using Cloudflare secrets and variables (for example, `npx wrangler secret put AUTH_PEPPER --env sandbox`), and make sure `AUTH_ORIGIN` matches that deployed hostname. Do not put private values in `EXPO_PUBLIC_*` keys or tracked example files.

### Google sign-in and requested test account provisioning

The OAuth authorization and token-exchange requests now use the **same host-specific callback**, fixing mismatches when starting at `smcuc.alphazonelabs.com` instead of `AUTH_ORIGIN`. The Google OAuth Web application must list the exact callback `https://smcuc.alphazonelabs.com/api/portal/auth/google/callback`. Existing password accounts are not silently linked to Google; verified Google ownership may claim an explicitly provisioned account only when it has neither a password nor a previous Google identity.

The optional role migration adds `patient` and `admin_developer` to the account database. These currently only label an account; **they do not create clinical staff permissions or an administrative interface**. Any actual admin APIs must enforce authorization on the server.

To prepare the requested **synthetic-only** accounts, **first** review migration state and apply both existing auth migrations to the database attached to the active Worker. Run `node scripts/provision-portal-test-users.mjs` locally, inspect the emitted INSERT statements, and execute approved statements with Wrangler D1 against the intended database. The script is intentionally not wired to deploy. No password, email verification bypass, or Google identity is invented. The records are unclaimed until the corresponding Google account successfully authenticates with verified email. If `user@test.com` is not a controlled Google account, use ordinary registration and email verification (or a separately designed admin-approved invitation flow) instead. **Never publish common test passwords or grant account access on an unverified email assertion.**

Before deployment: check the Google Cloud OAuth consent screen/testing-users list, client ID/secret pairing, the exact registered redirect URL, Turnstile public/secret keys, D1 migration state, and the return URL in the OAuth authorization request. Avoid logging tokens, authorization codes, or patient details.

### Authentication troubleshooting on smcuc.alphazonelabs.com

The login and Google buttons are **intentionally disabled until a Turnstile challenge succeeds**. A private `TURNSTILE_SECRET_KEY` alone cannot render a challenge. Configure the matching **public** `TURNSTILE_SITE_KEY` as a Worker text variable. The login UI now reads the public key and capability flags from same-origin `/api/portal/auth/config` at runtime, rather than relying only on the old `EXPO_PUBLIC_TURNSTILE_SITE_KEY` build variable. The key is public; never place the Turnstile secret in this endpoint or an `EXPO_PUBLIC_*` setting.

For the active `smc-urgentcare` Worker, check Production runtime vars and D1 bindings: `ENVIRONMENT=production`, `AUTH_ORIGIN=https://smcuc.alphazonelabs.com`, `AUTH_ALLOWED_ORIGINS=https://smc-urgentcare.com`, `TURNSTILE_SITE_KEY`, `GOOGLE_CLIENT_ID`, `RESEND_FROM`, and verified Worker secrets `AUTH_PEPPER`, `TURNSTILE_SECRET_KEY`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`. Bind `AUTH_DB` to `smc-db` for production. Google sign-in requires the callback registered for smcuc. Registration and recovery also require Resend setup. Confirm the Turnstile widget allows `smcuc.alphazonelabs.com`. Test `/api/portal/auth/config` (safe, public readiness flags) before attempting sign-in; the endpoint should not expose secret values. D1 migrations still need to exist on the bound database.

**Important:** The screenshot showed `ENVIRONMENT=sandbox` and `AUTH_DB=smc-sandbox` on the active Worker. Do not change database bindings blindly if that database already contains test accounts; review and migrate intentionally. Sandbox and production Wrangler environments currently target the same Worker name, so deploying sandbox can overwrite the intended production configuration.

### Production testing domain and Turnstile

The approved production-compatible testing origin is **https://smcuc.alphazonelabs.com**. The eventual SMC hostname remains **https://smc-urgentcare.com**. The app supports either in `EXPO_PUBLIC_SITE_URL` when built for production; this does not automatically attach or configure DNS/custom domains. The test domain is intentionally **noindex**. Keep the clinical PrognoCIS link available.

Set the local **gitignored** `.env.production` values from the updated template:

- `EXPO_PUBLIC_SITE_URL=https://smcuc.alphazonelabs.com` for test-domain builds (or `https://smc-urgentcare.com` for approved final builds).
- `AUTH_ORIGIN=https://smcuc.alphazonelabs.com` and `AUTH_ALLOWED_ORIGINS=https://smc-urgentcare.com` to explicitly permit both hostnames **in the same Worker deployment**, if both resolve there. You may switch the two values at final cutover. The Worker derives the OAuth callback and email verification/reset link from the validated **request origin**, and host-only Secure cookies remain isolated per hostname. Sessions are not magically shared between domains.
- `EXPO_PUBLIC_TURNSTILE_SITE_KEY` is public and embedded in the Expo bundle. It must correspond to a Cloudflare Turnstile widget configured to allow **both hostnames** (and any actual sandbox hostname you want to test).
- `TURNSTILE_SECRET_KEY` is sensitive, must be set as a Worker secret, and never as an `EXPO_PUBLIC_` value. Sandbox should use its own widget/secret.
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` belong to a Google OAuth Web application that explicitly authorizes both exact origins **and** these redirect URLs:
  `https://smcuc.alphazonelabs.com/api/portal/auth/google/callback` and `https://smc-urgentcare.com/api/portal/auth/google/callback`.
- `RESEND_API_KEY`, `RESEND_FROM` and `AUTH_PEPPER` still need private per-environment configuration, D1 migration and deployment. Locally saved `.env` values are **not** automatically Cloudflare deployed secrets.
- Siteverify runs **server-side** for email/password registration and login, password recovery/reset, and Google sign-in start, validating challenge success, intended action and actual request hostname. Verification fails closed. Email-link confirmation consumes a single-use email token rather than prompting another challenge. Turnstile tokens are not placed in query strings.
- Ensure the testing domain is connected to the correct Worker in Cloudflare, TLS/DNS are ready, the D1 `AUTH_DB` binding is provisioned, and both Google and Turnstile approve its hostname. Run a complete sandbox-like test on the production-compatible hostname before public exposure.

```sh
# Local build origin must match the test hostname:
npm run build
npm test
npm run deploy:dry-run

# Configure Worker secrets securely (repeat for production and sandbox as needed):
npx wrangler secret put AUTH_PEPPER --env production
npx wrangler secret put TURNSTILE_SECRET_KEY --env production
npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
npx wrangler secret put RESEND_API_KEY --env production
# Add AUTH_ORIGIN, AUTH_ALLOWED_ORIGINS, GOOGLE_CLIENT_ID, RESEND_FROM as
# Worker vars/secrets using your approved deployment configuration.
```

**Release caveat:** These are source/configuration changes, not proof of a working deployed login. Real-email tests, Google callback tests, siteverify challenge tests, token expiry/replay tests, redirects, production session protection, and domain DNS/TLS verification are still required. Clinical data stays disconnected.

### Configuration (required before real sign-in works)

1. Have a clinician/owner approve use of the SMC CareConnect name, registration policy, account issuance, external auth providers, data flows and exact production deployment. Confirm whether account enrollment should be restricted to invited/verified patients; **self-registration is currently allowed for UI-only accounts** and does not verify a patient relationship.
2. Use the existing Cloudflare D1 databases `smc-sandbox` and `smc-db`. Their configured UUIDs are preserved; verify each ID matches the intended database in Cloudflare before applying migrations.
3. Apply `migrations/0001_portal_auth.sql` using `npx wrangler d1 migrations apply smc-sandbox --env sandbox --remote` and `npx wrangler d1 migrations apply smc-db --env production --remote` only after verifying the IDs and reviewing migration impact. **Both Wrangler environments currently name the same Worker `smc-urgentcare`; deploying sandbox may replace the production deployment.** Keep sandbox deployment disabled until its isolation or deployment strategy is corrected.
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
