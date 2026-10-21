# Validation and release acceptance

Run `npm run check` for TypeScript, current Worker/export tests, the production build and rendered-output checks. Run `npm run deploy:dry-run` for Worker package validation. Build checks enforce seven public pages plus branded error pages, no custom portal exports, external clinic portal links, static metadata and complete image sitemap coverage, strict scripts and small public/contact script budgets.

Contact tests cover configured delivery through a mocked Cloudflare send binding, missing configuration, fixed recipient/sender, safe Reply-To, origin checks, field/size/type validation, consent, honeypot, rate limits, Turnstile host/action/expiry failures, and safe provider errors. No actual email is sent by unit tests.

Browser acceptance includes all public pages at phone/tablet/desktop widths, no horizontal overflow, menu/filters/FAQs, visible focus and readable typography, and contact pending/loading/ready/success/error states. Third-party widgets and email may be mocked for layout checks; local passes do not establish live service delivery or field Core Web Vitals.

Before accepting production:

- Confirm the clinic’s content, external clinical portal, image rights and website privacy wording.
- Correct the Cloudflare Access gate for public pages/assets and the general contact endpoints.
- Name and verify the destination, confirm sender-domain/email setup, configure contact secrets and Turnstile hostnames, then perform one approved nonmedical inbox delivery/reply test.
- Run `npm run audit:live`, check robots/sitemap/canonical URLs, real 404s, and legacy redirect/retired API behavior.
- Review and retire unused old account resources separately; the repository cleanup does not drop deployed databases or rewrite Git history.

## Removal/contact implementation verification

- 30 current unit/regression tests passed, including Wrangler-derived build origins, secret isolation and generated-script pruning.
- Production build/export checks passed across nine HTML files (seven pages and two branded error files); no custom portal routes/styles remain.
- Production Worker packaging dry run passed with send-email/rate-limit/assets bindings and no D1 binding.
- Chromium passed 160 public-page/viewport combinations without document overflow or JavaScript errors.
- 264 contact-form assertions passed across 280, 320, 390, 600, 768, 820, 1024 and 1440px, covering pending, configured success, server failure and challenge-load failure. Widget/delivery were mocked; no real email was sent. Failure messages persist after challenge reset and entered text is retained on failure.
- The Worker handler was also exercised over local HTTP through a Node adapter: public pages, closed/pending contact endpoint, external legacy redirects, retired API 410 and real 404. Wrangler’s local simulator could not start because this host rejects network-interface enumeration; this is not a live Cloudflare email test.
- Real destination verification, sender setup, Cloudflare challenge execution and inbox/reply delivery remain pending until the recipient is provided.

## Environment and dead-file cleanup

- Public build origins come directly from Wrangler. Redundant `.env` files/templates and environment setup/check commands were removed. Only an optional sandbox Worker secret template remains; missing contact secrets are a supported pending state.
- Production and sandbox builds now run their own output validation. Preview scripts build the matching target first; component development explicitly loads sandbox settings and bypasses implicit dotenv loading.
- Removed 19 obsolete files: native-only duplicate components/screens/helpers, unused native launch/derivative images, the palette wrapper and OTA guide. Removed unused status/splash dependencies and updated the lockfile; Expo Router’s required peers remain.
- Removed obsolete quick-strip/section-head/concept CSS. Original artwork/photos, active optimized images, temporarily hidden LinkedIn resources and icon licensing are retained.
- The static export removes unused Expo application JavaScript after stripping hydration references. Only the public and contact scripts remain in the packaged script directory; both keep their existing 6 KB budgets.
- Production Chromium regression covered 160 page/viewport combinations from 280 to 1920px, including landscape, without overflow or script errors; menu behavior, typography, red brand initials, hidden LinkedIn and external portal links passed. External map/challenge/email services were not exercised by this layout check.

Removed the obsolete inline-script extraction helper and its test: the current static exporter strips application scripts and preserves inert JSON directly. Shared HTML traversal and script-type detection now live with the active public exporter. Redundant preview/verification/deploy aliases were removed; output validation still runs automatically on each build.
