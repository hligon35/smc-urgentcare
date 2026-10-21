# Public website quality pass

## Public experience

- Shared header/footer wordmark uses `brandRed` (`#e50914`) for the S.
- Public patient portal links use `clinic.portalUrl` (the clinic’s PrognoCIS portal). The public visit page and FAQs describe that destination, and no public navigation advertises the local sample CareConnect interface. Its existing routes remain session-protected and noindex.
- LinkedIn is hidden in web/native social navigation and clinic structured data. Restore it by setting `linkedinEnabled` in `src/config/clinic.json` to true.
- Body/service/FAQ/visit copy uses 16px; lead text scales from 17px to 18px; navigation/buttons use 16px (15px for the narrow mobile action bar); secondary/footer labels use 14px; copyright/legal notes use 13px. The logo typography and large headings retain their own scale.
- Navigation collapses before the header crowds, includes the patient portal, closes with Escape or an outside click, and resets on desktop resize. Narrow grids reflow instead of relying on horizontal overflow clipping. Landscape menus and device safe areas are accommodated.

## Search and performance

The previous metadata checked the retired domain when deciding whether pages were indexable. Production metadata now uses `https://smcurgentcareindy.com` for indexability and default canonical origin. Sandbox/alias/portal/error exclusions remain in place, and APIs also receive noindex headers.

Every production export regenerates `sitemap.xml` from the public route registry and images actually present in each exported page. It includes all seven public routes, no private/duplicate URLs, and the image sitemap namespace. No fabricated last-modified dates are emitted. `robots.txt` advertises the canonical sitemap; non-production exports prohibit crawling.

Rendered JSON-LD connects the clinic, website, individual page, and breadcrumb entities. Clinic contact/address/social facts come from the shared configuration. No unsupported hours, reviews, credentials, or prices are added. Clear local page titles and server-rendered text support discovery by conventional and AI-powered search; inclusion or ranking cannot be guaranteed.

Facebook’s supplied image was resized from 247,112 bytes to 2,339 bytes for its 24px display footprint. The temporarily hidden LinkedIn image also has a small reusable web variant. Both web icons have explicit dimensions, lazy loading and async decoding. Versioned JPG/AVIF images now receive the same immutable caching policy as versioned PNG/WebP assets. Existing eager/high-priority hero loading and lazy maps/care images are retained.

## Validation

Run `npm run check` for type checking, the regression suite, production export, and the expanded rendered-output checks. These check canonical/indexing consistency, unique metadata, both brand initials, portal destinations, hidden LinkedIn, complete public/image sitemap, static assets, shared shell, and strict CSP compatibility across all exported HTML.

The CI workflow no longer invokes the nonexistent `build:mobile` command in this web-only repo. CSS side-effect imports have TypeScript declarations. Deployment packaging can be checked without publishing with `npx wrangler deploy --env production --dry-run`.

After deployment, submit `https://smcurgentcareindy.com/sitemap.xml` in the verified Google Search Console and Bing Webmaster Tools properties. Use URL Inspection/Rich Results Test on production URLs and monitor field Core Web Vitals. Search account submission and live-device/network measurements are separate from local build validation.

References:
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://web.dev/learn/images/performance-issues

Local browser audit: Chromium completed 215 page/viewport combinations without horizontal document overflow or JavaScript errors. Public pages and the 404 were checked at 280, 320, 360, 390, 414, 480, 600, 744, 768, 820, 900, 1024, 1120, 1280, 1281, 1366, 1440 and 1920px, plus 844×390 and 1024×600 landscape views. Menu opening/Escape, red initials, hidden LinkedIn, portal hrefs and body/service/FAQ/visit font sizes were checked. Existing local portal screens were checked at five widths using a synthetic session. External maps/auth services were blocked or mocked; this validates layout, not provider integrations or live network performance.

## Follow-up: static public delivery and launch audit

Public HTML now uses a 2,877-byte deferred enhancer for menu and service filtering instead of downloading the Expo/React application runtime. Public exports retain the server-rendered content, image preloads, styles, metadata and JSON-LD, while omitting application script preloads and private portal CSS. Portal exports retain their complete application runtime and authentication behavior. No-script CSS exposes mobile navigation, keeps all services visible, and hides nonfunctional filters. The public enhancer has a 6 KB build budget and a content-addressed filename covered by immutable caching.

The menu measures its available viewport height and reserves the bottom action bar’s actual height, including safe-area padding. It updates on resize, scroll, visual viewport and header/action-bar size changes. Service and footer links have 44px touch targets. Menu icon and expanded states stay synchronized.

Sitemap generation now fails if an exported public HTML page is absent from the route registry, preventing a future route from silently disappearing from the sitemap. Unit coverage checks public/portal runtime separation, repeatable exports, production sitemap/image entries, sandbox crawl exclusion and missing-route detection.

Run `npm run audit:live` after deploying. It checks unauthenticated public pages, canonical URLs, indexability, robots.txt and complete sitemap coverage, and explicitly rejects Access redirects, login pages returned as HTTP 200, and firewall blocks. It does not use authenticated cookies or follow sign-in redirects.

An unauthenticated production probe on October 21, 2026 redirected the homepage to Cloudflare Access. This account-level gate is outside the repository. In Cloudflare Zero Trust, scope Access protection to intended private/staff resources and allow the public clinic pages, robots.txt, sitemap.xml and static assets to load without authentication. Preserve patient session checks and all private-resource policies. Rerun the live audit before requesting indexing; local build success does not mean the public launch is complete.

The follow-up browser pass repeated all 215 page/viewport combinations and passed 162 interaction/no-script assertions: category filters and live announcements, native FAQs, menu fit and last-link reachability at 280–1024px widths with 320–600px heights, desktop/mobile transitions, reduced motion, and navigation/content reflow with JavaScript disabled. Eight final typography/header-spacing checks also passed. The 49-test suite, production output verification and Worker packaging dry run passed. Unauthenticated probes of `/`, `/services`, `/contact`, `/robots.txt`, `/sitemap.xml`, and `/favicon.ico` all received HTTP 302 to the Access login host, so production crawling remains blocked until that account-level policy is corrected.

Access path scoping reference: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
