# Public clinic website

Production: `https://smcurgentcareindy.com` and WWW (redirected to apex), served by the existing `smc-urgentcare` Worker. The production `smc-urgentcare.hligon.workers.dev` alias is noindex. Sandbox is `smc-urgentcare-sandbox.hligon.workers.dev`, has no custom-domain routes and uses separate contact secrets/rate limits.

The clinic uses its existing external PrognoCIS portal. This repository implements no patient authentication or clinical records. Vital Check remains a separate application/repository and is unchanged by this work.

## Cloudflare Access

Unauthenticated checks found a whole-site Access sign-in gate on clinic pages, static assets, robots.txt and sitemap.xml. Access runs before the Worker; source changes cannot remove this account-level gate. Public website pages, static assets, `/api/contact/config` and `/api/contact` need unauthenticated reachability. Scope staff-only Access protection to the intended private hostnames/routes; do not alter unrelated apps. The general contact endpoint independently enforces origin, input, Turnstile and rate-limit checks.

After policy correction and deployment, run `npm run audit:live` and test the contact readiness endpoint without cookies. Unknown pages must return a real 404. Legacy `/portal` paths redirect to the clinic’s external portal and retired `/api/portal/*` APIs return 410.

## Email setup

See [CONTACT-EMAIL.md](CONTACT-EMAIL.md). The recipient is not yet selected. No submission can be accepted until a verified destination and required runtime configuration are present. Configure secrets on the correct Worker/environment; `.env` build files do not provision them. Preserve existing clinic DNS/email services while enabling Cloudflare email capabilities.
