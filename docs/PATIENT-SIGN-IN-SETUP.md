# Patient sign-in setup

Email/password is the primary sign-in method. Google is an alternative patient
identity provider, independent of the Cloudflare Access staff/preview allowlist.

## Account journeys

| Patient | Result |
| --- | --- |
| Email/password, verified account | Signs in with the existing password. |
| Google, linked account | Signs in using the verified Google subject. |
| Google, existing verified Gmail/Workspace account | Connects Google while retaining the password and existing role. |
| Google, new email | Opens Create account with the Google email prefilled and locked; no account or login session exists until the form is submitted. The patient chooses a password. |
| Google, external email without Workspace verification | Existing accounts confirm their password once before linking; new accounts verify their inbox before either login method can grant access. |
| Disabled account or mismatched Google subject | Access remains denied. |

The browser receives only a random, 10-minute HttpOnly/Secure cookie for onboarding.
Its digest and verified identity live in `portal_google_registrations`. No email
address, Google token, or onboarding token is put in a redirect URL or localStorage.
The Worker ignores submitted Google identities and uses the stored handoff.
Account insertion and handoff consumption are a single D1 transaction. New accounts
always have role `patient`; client data cannot assign staff roles.

Google's guidance on external email ownership:
https://developers.google.com/identity/sign-in/web/backend-auth

## 1. Deploy the account flow

Merge this repair, pull it locally, then run:

```sh
npm ci
npm run db:migrate:production
npm run deploy:production
```

This applies additive migration `0003_google_registration.sql` to `smc-db` before
the new Worker uses it. Keep existing accounts, databases, and AUTH_PEPPER. A
pending migration intentionally makes the capability endpoint report not-ready.

## 2. Let patients reach their sign-in endpoints

In Cloudflare Zero Trust > Access controls > Applications, the existing whole-site
preview application currently blocks people outside its allowlist. Changing
CareConnect cannot override an Access rejection at the edge.

To keep the rest of the preview private while opening patient access, create a
more-specific self-hosted Access application named `SMC patient portal` for these
destinations on `smcuc.alphazonelabs.com`:

| Path | Purpose |
| --- | --- |
| `portal` | Patient sign-in entrance |
| `portal/*` | Account pages; the Worker still requires a valid patient session |
| `api/portal/auth/*` | Configuration, email/password, registration, recovery, Google start/callback and identity handoff |
| `_expo/static/*` | Scripts, CSS and fonts needed to render the portal |
| `images/*` | Public branding and imagery used by the portal |

Use additional public hostname/path entries, or separate path applications if
required by the dashboard. For these destinations, create a policy with **Action:
Bypass; Include: Everyone**. A more-specific path application takes precedence
over the existing whole-site preview application. Do not use an email allowlist
for these public patient destinations. Keep staff/admin applications protected.
If an existing more-specific application overlaps a listed destination, update or
remove that conflicting entry so it does not keep enforcing the old allowlist.

This bypasses only the Access gate for patient routes/public assets. CareConnect
still checks passwords, Google signatures, same-origin POSTs, Turnstile, disabled
accounts, server sessions and roles. It does not make account data public.
The Worker still sends `no-store` on auth/private responses. Do not add an Access
service token to frontend code or relax CSP to make API redirects work.

Cloudflare references:
https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
https://developers.cloudflare.com/cloudflare-one/access-controls/policies/common-policies/

## 3. Google OAuth application

In the Google Cloud project that owns GOOGLE_CLIENT_ID:

- Use an OAuth **Web application** client.
- Set the audience to **External** for patients outside your organization.
- For general availability, use **In production** rather than a test-user-only
  setup and complete any Google-required branding/domain verification.
- Authorized redirect URI:
  `https://smcuc.alphazonelabs.com/api/portal/auth/google/callback`.
- Use only the existing `openid email profile` scopes.
- Keep GOOGLE_CLIENT_SECRET as a Worker secret; the callback must use the same
  approved origin that started the flow.

Google can still enforce organization restrictions or suspend accounts; the app
must never bypass an identity provider's rejection. Google application audience
settings and the Cloudflare Access allowlist are different controls.

## 4. Email and Turnstile

The `smc-urgentcare` Worker needs AUTH_DB bound to `smc-db`, its existing AUTH_PEPPER,
AUTH_ORIGIN, TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, GOOGLE_CLIENT_ID, and
GOOGLE_CLIENT_SECRET. Keep the current exact origin `https://smcuc.alphazonelabs.com`.

For primary email/password enrollment and recovery, set RESEND_API_KEY as a secret
and RESEND_FROM to a sender on a verified Resend domain. Confirm Resend can deliver
to patients outside the owner's address. Also put the verified public sender in
the production/default Wrangler vars, so a later deploy retains it. Avoid sending
any patient medical information through these account emails.

Turnstile must allow `smcuc.alphazonelabs.com` and use the matching site/secret keys.
Do not turn off bot verification to make new accounts work.

## 5. Verify the deployed flow

Use a clean browser session with an account **outside** the Access allowlist:

1. Open `/portal`. It and its assets should load without an Access login prompt.
2. `/api/portal/auth/config` should return JSON with `databaseReady`,
   `emailPasswordReady`, `googleReady`, and `recoveryReady` all true.
3. Register with email/password, follow the inbox verification link, then sign in.
4. Select Google using a new Gmail account. Confirm Create account is shown with
   its email prefilled, choose a password, and finish registration.
5. Sign out, then test both email/password and Google for that same account.
6. Test an existing account; confirm it retains its role and password. New patient
   registration must never grant the seeded admin/developer role.
7. Staff-only Access destinations should still reject unauthorized accounts.

Repository tests simulate Google/Resend; they do not change or prove the live
Cloudflare policy, Google audience, or sender verification. Configure those account
settings and perform these live checks after deploying.

## Set the sample account password

After deploying the password-provisioning change, run `npm run sample-user:password`
from the repository root. It prompts twice for a hidden password. For the agreed
sample credential, enter the password provided privately by the operator; no
password is embedded in this repository. The command accepts 8–128 characters for
this sample account only. Public password creation/reset still requires 12+.

The existing Worker AUTH_PEPPER must be available in `.env.production` or a private
environment variable; this command cannot retrieve a Cloudflare secret. Do not
rotate it. Wrangler must be authenticated to the correct Cloudflare account.
The default target is the remote production AUTH_DB from wrangler.jsonc. Use
`npm run sample-user:password -- sandbox` only for the separate sandbox database.

The command creates the `user@test.com` sample patient if missing, or updates the\nexisting enabled patient account.
The command sets its password hash and marks this operator-owned sample verified,
clears its old sessions/email tokens, and verifies the stored hash. It does not\nenable disabled users, change existing roles, or modify the admin account.
It hashes with the same salt/pepper/600,000-iteration format as the Worker and
removes its private temporary SQL file afterward. Neither passwords nor peppers
are passed as command-line arguments or printed in Wrangler output.

Then use the email/password form at `/portal` with `user@test.com` and the password
you entered. Running the command is required: merging the code does not change D1.
