# SMC Urgent Care

Public clinic website for **https://smcurgentcareindy.com**, built with Expo Router/TypeScript and exported as static HTML on Cloudflare Workers. Patient links open the clinic’s existing [PrognoCIS portal](https://sarepta.prognocis.com/prognocis/sareptaClinicIndex.html). This repository contains no custom patient accounts, authentication, clinical dashboard, medical-record APIs, or database migrations.

## Local development and checks

Use Node 24 and npm:

```sh
npm ci
npm run env:init
npm run web
npm run check
npm run deploy:dry-run
```

`npm run web` previews the page components using sandbox metadata. `npm run preview` (or `preview:sandbox`) builds and validates the sandbox export before starting its Worker; `preview:production` does the same for production. These local previews do not deploy anything. Production exports seven content pages, the branded 404, static metadata, clinic/page structured data, robots.txt and an image sitemap. Public pages use small same-origin scripts; the contact script only loads on `/contact`.

## Pages and configuration

- `/`: clinic welcome and location
- `/services`: service groups and filters
- `/about`: approach to care
- `/visit`: preparation, payment questions and external portal
- `/contact`: phone, map, external portal, Facebook and general contact form
- `/privacy` and `/accessibility`: website information

`src/config/clinic.json` owns clinic information and the external portal destination. `src/content/routes.json` drives navigation, metadata and sitemap generation. `src/content/care.ts` owns services, visit steps and FAQs. `src/styles/palette.json` owns brand colors. LinkedIn remains hidden through `linkedinEnabled: false`.

## General contact email

The form uses the Cloudflare `CONTACT_EMAIL` send binding to deliver a general inquiry to a verified Email Routing destination. The recipient is intentionally not configured. Until `CONTACT_TO`, sender-domain/email setup, Turnstile and the rate-limit binding are ready, the UI stays unavailable and the API returns a safe error without accepting messages.

Follow [CONTACT-EMAIL.md](docs/CONTACT-EMAIL.md) after the destination is named. The form is for nonmedical questions, has no attachments or patient intake fields, and does not persist messages in a database or browser storage. No automatic emails are sent to the submitted visitor address. The form’s Reply-To allows the clinic to respond from its inbox.

## Cloudflare environments

Production and default Wrangler settings deploy the existing `smc-urgentcare` Worker and its apex/WWW custom domains. Sandbox deploys `smc-urgentcare-sandbox`, with no custom-domain routes. Runtime variables, email bindings and rate-limit namespaces are declared per environment in `wrangler.jsonc`; there are no D1 bindings.

Run `npm run env:init` to create ignored local files without overwriting existing values (optionally add `-- sandbox` or `-- production`). `npm run env:check` validates both environments without printing secret values. Builds use safe environment-specific origins even in a fresh checkout.

| Configuration | Location | Variables |
| --- | --- | --- |
| Public production/sandbox builds | `.env.production`, `.env.sandbox` | `EXPO_PUBLIC_SITE_URL` only |
| Local Worker secrets | `.dev.vars.production`, `.dev.vars.sandbox` | `CONTACT_TO`, `TURNSTILE_SECRET_KEY` |
| Runtime nonsecret settings | `wrangler.jsonc`, per environment | `ENVIRONMENT`, `SITE_ORIGIN`, `CONTACT_ALLOWED_ORIGINS`, `CONTACT_FROM`, `TURNSTILE_SITE_KEY` |
| Deployed secrets | Cloudflare via `wrangler secret put --env …` | `CONTACT_TO`, `TURNSTILE_SECRET_KEY` |

Leave contact secrets blank until the recipient is named and verified. Local `.env`/`.dev.vars` files never deploy secrets. Generic `.env`/`.env.local` files are not loaded by the npm build/development scripts. Migrate any older portal/OAuth/Resend/D1 settings out of local files; only the keys shown in the templates are accepted. All `.env*` and `.dev.vars*` files are ignored except the explicit example templates.

```sh
npm run deploy:sandbox
npm run deploy:production
npm run audit:live
```

Every build validates rendered HTML, sitemap, assets and the target environment’s indexing rules. Sandbox output is noindex and robots-disallowed. `npm run verify:build` checks existing production output; `npm run verify:build:sandbox` checks existing sandbox output.

Run `npm run audit:live` after correcting any whole-site Cloudflare Access gate and deploying. Public pages, static assets, `/api/contact/config` and `/api/contact` must be reachable without a staff login. The contact endpoint has its own origin, input, Turnstile and rate-limit controls. Preserve policies for unrelated private/staff systems. See [PUBLIC-WEBSITE.md](docs/PUBLIC-WEBSITE.md).

Legacy `/portal` links redirect to the external clinical portal without forwarding old tokens/query parameters. Retired `/api/portal/*` endpoints return HTTP 410. Rebuilding clears old output; release cleanup of previously provisioned Cloudflare resources is documented separately from repository deletion.

## Acceptance

Confirm clinic services, hours, contact information, external portal, image rights and privacy wording. No fabricated hours, wait times, credentials or ratings are published. [WEB-QUALITY.md](docs/WEB-QUALITY.md) describes search/performance behavior; [VALIDATION.md](docs/VALIDATION.md) lists release checks. DNS/email changes and production delivery need account configuration and verification; a local test does not verify real inbox delivery.
