# Public website quality

The clinic website has seven public content routes with server-rendered content, unique titles/descriptions, canonical URLs on `smcurgentcareindy.com`, and clinic/website/page/breadcrumb structured data using configured clinic facts. No invented hours, ratings or credentials are included.

Every build clears old output and regenerates robots.txt and the complete public/image sitemap. Duplicate/invalid route entries and unexpected exported pages fail the build. The custom portal is absent from source/output; legacy URL handling is implemented at the Worker edge. No account pages are indexed or linked.

Public pages use a small deferred menu/service-filter script; the contact page adds a separate small form script. Each has a 6 KB build budget. Only a configured contact page loads Turnstile. Image dimensions, lazy loading, high-priority hero loading, optimized social icons and immutable caching for hashed/versioned assets are retained. No-script navigation and all services remain available; contact requires JavaScript for the security check and otherwise offers the phone alternative.

Body/service/FAQ/visit copy uses 16px; leads scale 17–18px, navigation/buttons use 15–16px, secondary/footer labels 14px and minor legal copy 13px. Headings retain responsive scaling. Navigation collapses before header crowding, uses the measured available height above the bottom action bar, and supports Escape/outside click/resize. Service/footer links have 44px targets. Contact fields use 16px text and 48px heights, reflow into one column below 600px and support a compact security widget.

`npm run check` validates the code/export. `npm run audit:live` validates unauthenticated availability, clinic schema, canonical/indexability, robots.txt and sitemap after deployment. It also probes the homepage with Googlebot, Bingbot and OAI-SearchBot user-agent strings to detect obvious edge blocks; these simulated requests do not establish verified bot access or indexing. A Cloudflare Access whole-site gate was observed on October 21, 2026 and remains an account-level release dependency. Correct public scope before submitting `https://smcurgentcareindy.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools. Check URL inspection and indexed-page coverage there; submit only after production is publicly accessible. Review Cloudflare bot/WAF policies for verified search bots and AI search crawlers without automatically trusting spoofed user-agent strings. Neither static metadata nor special AI markup can make a gated page public.

See [CONTACT-EMAIL.md](CONTACT-EMAIL.md) for recipient verification and operational cleanup, and [VALIDATION.md](VALIDATION.md) for release acceptance. Real inbox delivery, external security challenges, screen-reader/device checks and field performance are separate from local mocks.

References:
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://web.dev/learn/images/performance-issues
- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/

Build cleanup also removes unused Expo hydration chunks from the deployment package after all static pages have been transformed. Required CSS, image preloads, JSON-LD and the two small standalone scripts remain. Production and sandbox output checks enforce their own canonical origins and indexing policies.
