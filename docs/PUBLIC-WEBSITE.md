# Public clinic website

Production: `https://smcurgentcareindy.com`, served by `smc-urgentcare-production` with a single apex custom-domain route. `workers_dev` and preview URLs are disabled. Sandbox: `https://smc-urgentcare.hligon.workers.dev`, served by `smc-urgentcare` with `workers_dev` enabled, preview URLs disabled, no custom-domain routes, and separate contact secrets/rate limits. WWW is not included as a Worker custom domain; set up any required WWW redirect separately.

The clinic uses its existing external PrognoCIS portal. This repository implements no patient authentication or clinical records. Vital Check remains a separate application/repository and is unchanged by this work.

## Cloudflare Access

Unauthenticated checks found a whole-site Access sign-in gate on clinic pages, static assets, robots.txt and sitemap.xml. Access runs before the Worker; source changes cannot remove this account-level gate. Public website pages, static assets, `/api/contact/config` and `/api/contact` need unauthenticated reachability. Scope staff-only Access protection to the intended private hostnames/routes; do not alter unrelated apps. The general contact endpoint independently enforces origin, input, Turnstile and rate-limit checks.

After policy correction and deployment, run `npm run audit:live` and test the contact readiness endpoint without cookies. Unknown pages must return a real 404. Legacy `/portal` paths redirect to the clinic’s external portal and retired `/api/portal/*` APIs return 410.

## Email setup

See [CONTACT-EMAIL.md](CONTACT-EMAIL.md). The recipient is not yet selected. No submission can be accepted until a verified destination and required runtime configuration are present. Configure secrets on the correct Worker/environment; build settings do not provision secrets. Preserve existing clinic DNS/email services while enabling Cloudflare email capabilities.
