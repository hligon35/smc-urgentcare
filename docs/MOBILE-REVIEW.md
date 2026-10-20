# Mobile layout review

Reviewed source on 2026-10-19, based on main commit c68aef8f0a83386d43b4db14d0f24ed4796b1f29.

This is a source-level audit with targeted layout corrections and build verification. It is not a completed visual or device certification. Native patient authentication and clinical screens remain unimplemented; every native portal route still uses the informational portal screen.

## Coverage

- Public native screens: home, services, approach, visit, contact, privacy, accessibility, not-found; shared header, footer, brand, buttons, social links, and FAQ interaction.
- Public web screens: the corresponding routes, shared navigation, photographs, maps, contact cards, sticky mobile call/find-us bar, legal links and FAQs.
- Web authentication: email/password login, registration, Google continuation, recovery, reset, verification and invitation activation. Reviewed common form/layout code, not live provider outcomes.
- Authenticated web portal: dashboard, results, medications, visits, messages, billing, insurance, care team, documents, settings; search/filter controls, sample rows, detail panels, message drafts, navigation and sign-out. Patient/admin_developer sessions share this presentation; there is no separate native admin UI.

## Findings and corrections

| Priority | Area | Source finding | Correction |
| --- | --- | --- | --- |
| High | Native portal container | Portal routes returned before SafeAreaView and ScrollView. Content could overlap system UI or become unreachable with large text. | Keep safe areas, scrolling and the 720-point centered content container on portal routes; omit only the public header/footer. |
| High | Native portal navigation | The placeholder offered only an external clinical-portal button. | Add an explicit return-home action and use shared native section/text/button styling. |
| High | Web portal sign-out | The only sign-out action was inside a sidebar hidden at 780px and below. | Add a labeled sign-out button to the mobile top bar using the existing logout handler. |
| Medium | Public web navigation | Full navigation remained active until 760px despite logo, icons and action buttons competing for space. | Collapse the header navigation at 1120px; retain the existing menu toggle, Escape and outside-click behavior. Bound and scroll the expanded menu on short screens. |
| Medium | Narrow public editorial layouts | 110px photographs remained beside paragraphs and headings even at 320px. | Stack compact care stories and visit preparation below 480px; use full-width, consistently proportioned photos. |
| Medium | Web portal dashboard | Two cards stayed side by side below 480px, leaving approximately 119px for text per card at a 320px viewport. | Use one column below 480px and remove the forced card height. |
| Medium | Web portal forms | Inputs used 15px text; password, recovery and filter targets did not explicitly enforce a 44px minimum. | Use 16px field text and 48px field heights; enforce 44px target heights and visible field focus. |
| Medium | Security check width | The default Turnstile widget requires 300px, but the 320px sign-in layout provided 276px after horizontal padding. | Measure the widget container; use compact below 300px, flexible otherwise. Remove/reset the existing widget when its size mode changes. |
| Medium | Native footer | Legal-link row did not wrap; larger system text could exceed its available width. | Wrap navigation rows, keep labels shrinkable and use 44-point Pressable targets. |
| Medium | Native sizing consistency | Images had a fixed 200-point height at all available widths; button target width was implicit. | Use a shared 1.6 image aspect ratio and explicit full-width button targets. Preserve automatic text scaling. |
| Medium | Brand/social text | Text beside fixed-size images did not have explicit shrinking constraints. | Keep images fixed while allowing accompanying text to shrink/wrap within the available width. |
| Low | Web finishing | Fixed heading sizes, rigid contact-card padding and narrow action groups could crowd small phones. | Scale headings, wrap long text, align primary actions, stack narrow notices and location actions, and match contact-photo bleed to card padding. |
| Low | Safe-area spacing | Web fixed action bar accounted for bottom inset, but viewport-fit was absent and content reserve used a fixed amount. | Add viewport-fit=cover and inset-aware bottom content spacing. Keep zoom enabled. |

Cloudflare documents flexible Turnstile as a minimum of 300px wide, and compact as 150px × 140px: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/

## Design decisions

Retain the supplied navy/red brand, cream surfaces, serif web headings and shared native typography. Use 44px/point minimums for reviewed navigation and utility controls, 48px/point primary/native button and input heights, stable icon footprints, and one-column content when two-column text becomes cramped. Existing long-page scrolling and external-map behavior remain intact.

The horizontal portal section strip intentionally scrolls; it is not page-level overflow. Active-page links retain aria-current and the strip can receive keyboard focus. Real health data must not be entered into the sample portal.

## Validation status

Build results are recorded in the pull request. The following visual matrix remains pending because this environment has no supported browser-preview capability or iOS/Android runner. No screenshots or visual pass counts are claimed.

| Surface | Required checks before visual sign-off |
| --- | --- |
| Phone web | All public routes and all portal sections at 320, 360, 375, 390, 414 and 480 CSS pixels; no page overflow, clipped labels or covered content. |
| Tablet/breakpoints | 768, 780, 781, 820, 1024, 1120, 1121 and 1440 widths; verify menu transitions, portal sidebar transition and desktop regression. |
| Short/landscape web | 844×390 and a short phone viewport; open menu, scroll to its last link and verify fixed-bar clearance. |
| iOS Safari | Focus every auth field; check keyboard visibility, input zoom, safe areas, password toggle and 200% zoom. Verify compact/flexible Turnstile with a real challenge. |
| Android Chrome | Repeat navigation, keyboard, form errors, Google return, filters, sample-row selection and sign-out. |
| Native iOS/Android | Small phone and tablet, default and maximum system text sizes; portal scrolling, home action, footer wrapping, images and external links. Check VoiceOver/TalkBack labels and focus order. |
| Long/error content | Long email/name, unbroken reference text, registration/provider errors, empty search, long sample message and wrapped status tags. |
| Permissions/integration | Confirm authenticated mobile sign-out invalidates the session; test real email/Google/Turnstile callbacks after deployment. Backend authentication rules were not changed. |

Do not treat successful Expo exports as installed-app or store-release validation. The native portal still needs its own authentication/dashboard implementation in a separate feature change.
