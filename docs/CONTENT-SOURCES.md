# Content and asset provenance

The homepage at https://smc-urgentcare.com/ was reviewed on October 18, 2026.

Facts carried into the redesign:

- SMC Urgent Care; phone 317-852-3505.
- 7411 Heathrow Way, Indianapolis, IN 46241; Heathrow Way and US 67.
- No appointment necessary for walk-in care.
- Service categories and individual services listed in `src/content/care.ts` come from the source homepage.
- Existing portal: https://sarepta.prognocis.com/prognocis/sareptaClinicIndex.html.
- Clinic update link: https://www.facebook.com/SMCUrgentcare/.

The source homepage advertises seven-day service but refers visitors to Facebook for accurate hours. No fixed hours or live open/closed claim are published in this implementation. Payment copy asks visitors to confirm individual coverage and prices.

## Supplied brand and photos — October 18, 2026

`assets/smcLogo.png` is the supplied logo. Its white circular field and transparent outer area are preserved in web header/footer branding, favicon, touch icon, and native header/footer branding. Native launch icons use the same logo with platform-appropriate sizing and an opaque white background for iOS.

The palette uses the logo’s navy, red, and white with warm off-white surfaces. A darker red is used for readable small text. `src/styles/palette.json` is authoritative; native imports it and the web build generates CSS custom properties from it.

All ten supplied healthcare photos are used on the website. Original uploads remain unchanged. Optimized derivatives, dimensions, descriptions, and source mappings are recorded in `src/content/media.json`:

| Source            | Placement                          |
| ----------------- | ---------------------------------- |
| healthcare2.jpg   | Homepage hero                      |
| healthcare1.jpg   | About introduction                 |
| healthcare3.jpg   | About listening section            |
| healthcare4.jpg   | Physical forms / visit preparation |
| healthcare6.jpg   | Illness service card               |
| healthcare7.jpg   | Minor injury service card          |
| healthcare9.avif  | Physicals service card             |
| healthcare10.jpg  | Contact welcome section            |
| healthcareB1.jpg  | Visit preparation section          |
| healthcareB2.webp | About conversation section         |

Native views use optimized local derivatives for service cards, approach, visits, and contact. The photos are illustrative; they are not identified as actual SMC staff, patients, or premises. Confirm reuse rights with the clinic before launch.

No unrelated outbound links, WordPress scripts, testimonials, or unverified clinical credentials were imported. Newly written copy remains subject to clinic approval.

## Interactive location map

The Google Maps embed URL in `src/config/clinic.json` was supplied by the user on October 18, 2026. It is used only in the shared “Your neighborhood urgent care” location section, retaining Google’s interactive controls and attribution. The frame is labelled, lazily loaded, and restricted by the parent page’s content security policy to Google’s map embed endpoint. The website privacy page describes the external map connection.
