# SMC Urgent Care

A warm, accessible public website and native mobile shell built in one **Expo Router / TypeScript** project. The web build exports a complete HTML page for each route and runs on **Cloudflare Workers with Static Assets**. The visual direction uses the supplied SMC logo’s navy, red, and white, balanced with warm off-white backgrounds.

## Start locally

Use Node **24 LTS** and npm.

```sh
npm ci
npm run web
```

For the Expo native experience:

```sh
npm start
npm run android
# macOS with an iOS simulator, or use a device through Expo:
npm run ios
```

The mobile shell uses native controls, shared clinic/service content, device call and directions actions, and the external patient portal. It does not implement patient accounts, medical-record storage, or appointment booking. Native exports are verified; store signing, identifiers, real-device acceptance, and submission remain release steps.

## Pages and shared components

- `/` — homepage
- `/services` — service groups and complete lists, with filters
- `/about` — person-centered care approach
- `/visit` — preparation, payment questions, portal, and FAQs
- `/contact` — clinic phone, location, directions, portal, and updates
- `/privacy` — website privacy statement, distinct from the clinic’s privacy notice
- `/accessibility` — accessibility information and assistance
- Unknown paths — branded page with an HTTP 404 response

`src/app/_layout.tsx` owns the shared shell. `src/components/Header.web.tsx` and `Footer.web.tsx` render on **every web page**; native uses the corresponding base components. Active navigation changes with the route, while the component structure, links, and branding stay consistent.

`src/config/clinic.json` is the authority for phone, address, portal, directions, the supplied Google Maps embed URL, and operating notices. The shared location section embeds that interactive map responsively, with lazy loading and a Google-only frame policy. `src/content/care.ts` contains shared service, FAQ, and visit content. `src/content/routes.json` drives navigation, route metadata, and sitemap generation. `src/content/media.json` records supplied photo placements and descriptions. `src/styles/palette.json` is shared by native styles and generated web color tokens (`npm run build` refreshes `palette.css`). Web-specific semantic HTML and native views use the same configuration.

## Environments

Copy `.env.production.example` to `.env.production`. Production defaults to `https://smc-urgentcare.com` when the file is absent.

Copy `.env.sandbox.example` to `.env.sandbox` and set the **actual HTTPS sandbox Worker origin** before building or deploying that environment. Example origins must be replaced. The explicit build wrapper loads `.env.sandbox` or `.env.production`; these local files are ignored by Git. Only the public canonical origin is required. No passwords or provider secrets belong in `EXPO_PUBLIC_*` values.

```sh
npm run build
npm run build:sandbox
npm run preview
```

`preview` serves the current `dist` with the sandbox Worker configuration. Sandbox blocks indexing regardless of the existing static export. Export the matching environment before deploying it.

## Verify

```sh
npm run check
npm run build:mobile
npm run deploy:dry-run
```

For a locally running Worker (`npm run preview` in another terminal):

```sh
npm run smoke
# Or check the deployed sandbox:
npm run smoke -- https://YOUR-SANDBOX-ORIGIN
```

Checks cover TypeScript, Worker response security, cache policy, errors, sandbox indexing, static route output, metadata, local links/assets, identical shared shells, and compatibility with the script policy. CI also exports both native platforms and dry-runs the Cloudflare package. `docs/VALIDATION.md` records completed verification and remaining acceptance.

## Cloudflare deployment

Authenticate Wrangler to the intended Cloudflare account and verify the account before publishing:

```sh
npx wrangler login
npx wrangler whoami
npm run deploy:sandbox
```

After sandbox acceptance:

```sh
npm run deploy:production
```

The production Worker is named `smc-urgentcare`; sandbox is `smc-urgentcare-sandbox`. The repository intentionally contains **no account IDs or live DNS changes**. Attach `smc-urgentcare.com` and `www.smc-urgentcare.com` as Worker custom domains only after clinic approval and the existing website cleanup. The Worker redirects WWW to the canonical apex. Workers.dev responses are marked noindex. Deployment commands do not automatically alter the current website’s DNS.

`wrangler.jsonc` serves exported routes using `404-page` handling; it does not use a blanket SPA fallback. HTML revalidates, hashed bundles/versioned images cache immutably, and errors/API responses are not cached. All responses receive security headers. Worker observability is enabled. `/api/health` reports service status; there are no medical-data APIs.

No D1, R2, Resend, Turnstile, or authentication integration is added: this scope is an informational site that routes sensitive workflows to the existing portal. Add server-side capabilities behind dedicated adapters if a later requirement needs them.

## Before replacing the existing website

Confirm phone, address, portal ownership/destination, current services, physical availability, accepted insurance, self-pay policies, and actual hours with SMC. Hours are deliberately displayed as **call to confirm**, with no fabricated wait times, staff credentials, reviews, or opening-hours schema. Confirm image reuse rights. The supplied `assets/smcLogo.png` is used in shared branding, favicon/touch icons, and native icons. See `docs/CONTENT-SOURCES.md`.

The old WordPress page contains unrelated gambling/essay links. This repository does not copy its scripts or third-party embeds. Investigate the existing host, accounts, plugins, files, redirects, and search indexing before cutover; the original installation has not been repaired by this implementation. Preserve domain/email records and arrange the clinic’s legal/privacy review as part of launch acceptance.
