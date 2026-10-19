# Patient authentication deployment

The deployed application Worker is `smc-urgentcare`. Both an ordinary Wrangler
deployment and `--env production` target that Worker with `AUTH_DB -> smc-db` and
the same public runtime variables. Sandbox targets `smc-urgentcare-sandbox` with
`AUTH_DB -> smc-sandbox`. Never attach both databases under the same binding name.
Do not delete either database, rotate the existing pepper, or copy production
credentials into sandbox while repairing deployment settings.

## Apply this repair

1. Pull the repair commit and run `npm ci`.
2. In the existing `smc-urgentcare` Worker, confirm one D1 binding named `AUTH_DB`
   points to `smc-db`. Keep its existing runtime secrets.
3. Apply pending migrations to that remote database:
   `npm run db:migrate:production`.
4. Build and deploy with `npm run deploy:production`.
   For Cloudflare Git builds, use build command `npm run build` and deploy command
   `npx wrangler deploy --env production`. A plain `wrangler deploy` is also aligned
   with production in the repaired configuration.
5. Reload `/portal`; complete Turnstile, then select Google. The config response
   must have `databaseReady: true` and `googleReady: true`.

`.env.production` is build input, not deployed runtime configuration. Public
Worker variables are in `wrangler.jsonc`; private credentials must already be
Worker secrets: `AUTH_PEPPER`, `TURNSTILE_SECRET_KEY`, `GOOGLE_CLIENT_ID`, and
`GOOGLE_CLIENT_SECRET`. Email additionally requires `RESEND_API_KEY` and a verified
`RESEND_FROM`. Preserve the existing `AUTH_PEPPER`: changing it breaks existing
password verification and invalidates sessions.

## Read-only checks

`npm run auth:check:production` reports public capability flags. If Cloudflare
Access redirects this command, inspect `/api/portal/auth/config` in an authenticated
browser instead; do not bypass Access merely to run the check.

To inspect schema names without reading user records:

```sh
npx wrangler d1 execute smc-db --env production --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'portal_%' ORDER BY name"
```

Expected tables: `portal_users`, `portal_sessions`, `portal_email_tokens`,
`portal_oauth_states`, `portal_auth_limits`. The second migration adds the `role`
column; the config endpoint checks required columns as well as table presence.

## Interpret failures

| Result | Meaning and next step |
| --- | --- |
| JSON `Invalid origin.` / 403 | Active Worker vars do not approve the request's exact HTTPS origin. Confirm `AUTH_ORIGIN=https://smcuc.alphazonelabs.com`, with no slash/path, and the deployment target. |
| HTML, redirect, or non-JSON 403 | An upstream Access/WAF rule may be answering. Inspect the actual response before changing application auth. |
| `AUTH_DATABASE_BINDING_MISSING` | Bind a real D1 database as `AUTH_DB`; a text variable is not a binding. |
| `AUTH_SCHEMA_MISSING` | Apply pending migrations to the database actually attached to the deployed Worker. |
| `AUTH_DATABASE_ERROR` | D1 operation failed. Match `requestId` to `portal_auth_failure` in Worker logs. |
| `AUTH_INTERNAL_ERROR` | Unexpected server exception; use the reference and request path in Worker logs to isolate it. |
| `Bot verification failed.` / 403 | Server verification rejected the token. Check matching Turnstile keys, hostname, action, and token expiry. |
| `googleReady: false` with database ready | Check the existing auth pepper, origin, Turnstile keys, and Google client credentials. Presence flags do not validate credential correctness. |
| Google displays `redirect_uri_mismatch` | Authorize `https://smcuc.alphazonelabs.com/api/portal/auth/google/callback` on that Google OAuth Web client. |
| `recoveryReady: false` | Configure Resend to deliver account activation, verification and recovery email. This is separate from Google OAuth. |

Unexpected auth failures now return safe codes and reference IDs with 5xx status,
instead of mislabeling every exception as a bad request. Logs omit request bodies,
email addresses, cookies, OAuth tokens, secrets, and raw database exception text.
The public capability endpoint checks schema with zero-row queries and never
returns database IDs or account data. Authentication stays fail closed.

No Cloudflare account settings, secrets, migrations, or deployments can be verified
from repository tests alone. Verify the deployed flow after applying this repair.

## Access session expires while the portal is open

The preview Access session is separate from the CareConnect patient session.
An API request redirected to `*.cloudflareaccess.com` is being intercepted before
it reaches the Worker. Adding that login domain to `connect-src` does not renew
an Access session or make interactive login work inside a fetch.

Portal config, session and mutation requests now send
`X-Requested-With: XMLHttpRequest` and same-origin credentials. Access can return
401 for an expired AJAX session. Requests also use manual redirect handling so
login redirects cannot be followed as API calls. The page offers a full-page
"Renew preview access" link; Worker JSON 401/403 responses keep their existing
meaning. Reopening the preview lets Access perform its login navigation.

If a stale Access session persists, the user can manually visit
`https://smcuc.alphazonelabs.com/cdn-cgi/access/logout`, then reopen `/portal` and
complete Access sign-in. Cloudflare documents that this logout revokes Access
sessions across applications, so it is deliberately not performed automatically.
Keep the preview gate and CSP enabled.

## Patient enrollment

See [patient sign-in setup](PATIENT-SIGN-IN-SETUP.md) for email/password enrollment,
Google registration handoff, the third migration, and public patient-route Access
policy settings. The Access preview allowlist must not control patient eligibility.
