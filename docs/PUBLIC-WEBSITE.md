# Public website and separate mobile app

The public clinic website belongs to `hligon35/smc-urgentcare`:

- `https://smcurgentcareindy.com` (canonical)
- `https://www.smcurgentcareindy.com` (redirects to the canonical host)
- `https://smc-urgentcare.hligon.workers.dev` (production alias)
- `https://smc-urgentcare-sandbox.hligon.workers.dev` (isolated sandbox)

Production (including the default Wrangler target) deploys to the existing `smc-urgentcare` Worker, which already owns the custom domains. Sandbox deploys only to `smc-urgentcare-sandbox`, has no custom-domain routes and uses the separate `smc-sandbox` database. Do not transfer the custom domains to a new Worker.

Both deployments enable workers.dev. These aliases serve public pages without a website login; workers.dev pages remain noindex. Patient portal routes retain their own session authorization. Vital Check is a separate native app in `hligon35/vital-check`, with its own platform at `https://vitalcheck.alphazonelabs.com`. Do not deploy Vital Check to the clinic website Worker or reuse the website's database bindings.

## Required Cloudflare Access change

Live checks on 2026-10-20 found that `/` on both the custom domain and `smc-urgentcare.hligon.workers.dev` alias redirects to `getsparqd-server.cloudflareaccess.com`. Both redirects identify Access application audience `752410fc43a894f81155036fb309ed04acd59350c4df4c6c449daf7649045cfa`. This happens at the edge before the Worker executes; changing Worker code cannot remove that gate.

In Zero Trust, find the Access application containing these website hostnames. Remove the public website hostnames from its protected destinations, or replace whole-site protection with narrowly scoped destinations for any staff-only routes. Include WWW and both workers.dev aliases when checking destinations. Do not broaden Access policies for unrelated applications. Keep patient authentication and authenticated APIs protected by their existing application checks.

Deploy with `npm run deploy:sandbox` and `npm run deploy:production`. Verify each hostname without cookies: `/`, `/services`, `/contact`, and static bundles must load without an Access login; unknown URLs must remain 404; `/portal/dashboard` must still require a patient session. A noindex header does not prevent public access.

If `.env.sandbox` already exists, change both `EXPO_PUBLIC_SITE_URL` and `AUTH_ORIGIN`/`AUTH_ALLOWED_ORIGINS` to `https://smc-urgentcare-sandbox.hligon.workers.dev`. Configure sandbox-only secrets, OAuth callbacks and Turnstile hostnames for the new sandbox Worker before testing sign-in. Keep production secrets on `smc-urgentcare`; secrets are attached to Worker names and are not transferred by this source change.
