# General contact form using Cloudflare Email Routing

## Delivery path

Visitor → `/api/contact` Worker → Cloudflare `CONTACT_EMAIL` send binding → the clinic’s verified destination inbox.

Email Routing receives/forwards mail; the HTTP form needs the Worker email send binding to turn a submission into email. The current Cloudflare binding supports a structured message with fixed server-side From/To and visitor Reply-To. No Resend, OAuth client, database or custom patient portal is used.

The contact recipient is configured as `front-desk@alphazonelabs.com` in the server-side Worker environment. The page initially disables its fields, requests `/api/contact/config`, and only enables the form if email and security configuration are present. Missing mail verification, Turnstile secret or another required binding returns `ready: false`; POST returns HTTP 503. Nothing is queued or accepted for later delivery. The page keeps the clinic’s phone and existing clinical portal available.

## Finish Cloudflare sending setup

1. Confirm the intended Cloudflare account/zone for `smcurgentcareindy.com` and its current email provider. Configure Cloudflare Email Routing/email sending for the website sender domain. Review existing MX records before changing them; preserve any established clinic mailbox service. If needed, onboard a dedicated sending subdomain and update `CONTACT_FROM` plus the sender restriction in `send_email` together.
2. Add `front-desk@alphazonelabs.com` as an Email Routing destination and complete the verification email. A placeholder or unverified inbox is not a usable destination.
3. `CONTACT_TO` is currently a non-sensitive, server-side Wrangler variable for both environments; do not also configure a duplicate secret of the same name. Previous secret-based instructions were:

   ```sh
   npx wrangler secret put CONTACT_TO --env production
   ```

   Keep this out of `EXPO_PUBLIC_*` variables and page HTML. Sandbox has its own secret and must use an approved test destination. Do not declare a blank `CONTACT_TO` ordinary var that would overwrite the secret on deployment.
4. Confirm `CONTACT_FROM` (currently `front-desk@alphazonelabs.com`) belongs to the onboarded domain and agrees with the sender allowlist on the `CONTACT_EMAIL` binding. The visitor address is never used as From or as the delivery destination.
5. Configure a Turnstile widget for the enabled website hostnames. Set its public key in that environment’s `TURNSTILE_SITE_KEY` and its matching secret:

   ```sh
   npx wrangler secret put TURNSTILE_SECRET_KEY --env production
   ```

   The contact widget uses `contact_form`; the server requires that action and the request hostname. The existing public production site key may be reused only with its matching secret/hostname configuration. Use separate sandbox/test configuration.
6. Deploy the reviewed code and verify the public contact config returns `ready: true`. Submit one approved nonmedical test message and confirm receipt and Reply-To in the named inbox. This final delivery test is pending the recipient selection and verification.

The binding restricts the sender and Cloudflare limits the default destination scope to verified destinations. The application always selects `CONTACT_TO` on the server and rejects unknown request fields such as `to`. Once the destination is final, the binding may instead be pinned to a single `destination_address` (choose a supported restriction type; do not combine incompatible restriction variants).

## Optional local secrets

Builds and development read public settings directly from `wrangler.jsonc`; no `.env` files or environment initialization scripts are required. For local contact testing, copy `.dev.vars.sandbox.example` to `.dev.vars.sandbox` only when an approved test recipient and matching Turnstile secret are available. The file contains only `CONTACT_TO` and `TURNSTILE_SECRET_KEY`; it is ignored by Git. Keep the sandbox public widget key in Wrangler. Without local secrets the form intentionally stays unavailable.

`npm run preview` builds and checks sandbox output before starting the local Worker. Local configuration does not verify Cloudflare sending or real inbox delivery. Deployed secrets must be configured separately with the explicit Wrangler commands above.

## Security and behavior

- Exact allowed request origin/host; no permissive CORS or cross-site form submissions.
- 16 KB streamed body cap, JSON-only requests, strict field/type/length validation, checkbox acknowledgement and honeypot.
- Turnstile server validation with timeout, expected action and hostname; expiry/replay failures require a new challenge.
- Per-email hashed rate-limit key, five attempts per minute per Cloudflare location; separate production/sandbox namespaces. Cloudflare’s limiter is approximate and supplements Turnstile, not a strict global quota.
- Plain text inbound clinic email and a short branded HTML/plain-text visitor confirmation attempt. No attachments.
- Awaited send result; provider failures never appear as success. Network uncertainty tells visitors to call instead of silently retrying. The browser does not automatically resend.
- No application database, browser draft storage or contact-content logging. Email/infrastructure providers still process delivery/security information and the clinic controls retention in its inbox.
- This is general contact only. No symptoms, records, dates of birth, insurance information or other sensitive health details should be submitted. Clinical questions belong in the existing portal or by phone. It is not an emergency channel.

## Removal of the former custom portal

All former account/clinical source, styles, SQL/migrations, auth/provisioning scripts and related tests were removed. Wrangler no longer binds D1 or declares auth/OAuth/Resend variables. Legacy portal links redirect to PrognoCIS and retired account APIs return 410 without cookies.

No deployed database was dropped and no unrelated app was changed. After the release is accepted, review and retire any former Worker-only auth/Google/Resend secrets, OAuth callbacks and unused databases in the Cloudflare/provider accounts according to the clinic’s retention requirements. Keep the Turnstile secret if it is intentionally reused for contact. Git history is not rewritten by this cleanup.

References:
- https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/
- https://developers.cloudflare.com/email-service/configuration/send-bindings/
- https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
