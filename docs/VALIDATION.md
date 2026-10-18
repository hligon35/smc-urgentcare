# Validation and release acceptance

## Automated checks completed — October 18, 2026

- TypeScript check of web and native source.
- Static web export of all seven content routes and the branded 404.
- iOS and Android Metro/Hermes bundle exports.
- Worker tests: security headers, immutable versioned assets, HTML revalidation, error no-store, sandbox noindex, unsupported POST methods, no API caching, HEAD behavior, canonical alias redirect, and workers.dev noindex.
- Build checks: page headings, static metadata/canonicals, local routes and assets, shared header/footer, clinic schema without invented hours, no executable inline scripts.
- Cloudflare production package dry run passed.
- HTTP smoke passed against the local Cloudflare Worker: all seven pages, branded 404 status/body, response security headers, and health endpoint.

Real browser interaction and native-device testing were not performed in this environment.

## Manual acceptance still required

- Real browser checks at narrow mobile, tablet, and desktop widths, 200% zoom, keyboard-only navigation, and a screen reader.
- Menu open/close, Escape focus return, service filters, FAQ expansion, and cross-page fragment links.
- Native real-device checks: safe areas, text scaling, navigation, phone actions, maps, external portal, and back behavior.
- Clinic confirmation of services, hours, contact details, insurance/payment wording, portal ownership, photo rights, and branding.
- Clinic review of privacy wording and any required legal notices; this website statement is not a medical Notice of Privacy Practices.
- Sandbox deployment smoke, observability review, custom-domain cutover, TLS, DNS/email preservation, and WWW redirect.
- Investigate and clean up the old WordPress installation and compromised outbound links separately before launch.

No Cloudflare deployment, domain changes, native binary signing, or app-store submission are performed by repository implementation alone.
