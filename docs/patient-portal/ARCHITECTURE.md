# SMC CareConnect — patient portal product & architecture proposal

**Status:** Design proposal only. **No live patient portal, patient accounts, PHI API, or payment collection is implemented.**
**Baseline:** SMC website is an Expo Router (React/TypeScript) static export on Cloudflare Workers. The existing \`clinic.portalUrl\` links directly to the clinic's PrognoCIS-branded patient portal. Preserve that working entry point until a fully authorized replacement passes acceptance.

## Product objective

Offer a calm, clear, mobile-first **SMC CareConnect** experience that helps patients access their care and communicate with SMC without pretending this public site already handles medical data. Retain the clinic's navy \`#06184c\`, red \`#b91624\`, cream \`#faf8f5\`, paper \`#fff\`, and existing identity. Prioritize clarity and privacy over busy dashboards.

### Audiences and permissions

| Audience | Permitted work | Key boundary |
| --- | --- | --- |
| Patient | View own shared records, results, medications, coverage, balance, messages, profile; request authorized changes | Only verified and correctly matched patient context |
| Parent, guardian, approved proxy | Act for explicitly granted dependent account | Age-dependent consent rules, scope, expiry and revocation; never infer permission from family name |
| Clinician | Review and reply to messages, interpret results, respond to refills within clinical workflow | Clinical role & assigned-patient access enforced by EHR/authoritative backend |
| Nurse/medical assistant | Triage inbox, approved care tasks | Assigned scope; no unnecessary billing or administrative access |
| Billing staff | Statements, claims, reconciled payments | No clinical notes or messages by default |
| Front desk | Appointments, demographics and insurance intake | No diagnosis and lab access by default |
| Security/compliance admin | Access policy, security events, investigations | Not a blanket PHI view |

**Important:** Patient accounts are **not** authenticated through the existing Google-only administrative authentication. Adopt the EHR's supported patient identity flow, or a separately vetted patient identity provider with strong identity-proofing and written vendor authorization.

## Navigation and interaction model

Suggested top-level structure (desktop persistent left navigation; mobile compact navigation plus a "More" drawer):

1. **Home** — greeting, task shortcuts, recent activity, notification preferences, emergency contact context; no sensitive preview on lock screen.
2. **My health** — test results, visit summaries, discharge instructions, document downloads, medical history, allergies, immunizations, records export/request. Use separate tabbed sections; clinical data requires authorized release, version and provenance.
3. **Medications** — active medications, dosage/directions (verified EHR values), prescribing clinician, dispensing pharmacy, refill requests, request status, safety disclaimer. No self-authorization of prescriptions.
4. **Messages** — inbox, secure two-way threads, attachments, new-message reason, recipient/team routing, delivery and staff triage status. Display "Not for emergencies; call 911 for emergencies" and clinic-specific response times only once verified.
5. **Visits** — upcoming/past visits, visit summaries, intake forms, optional appointment requests if supported by clinic workflow. Urgent-care walk-in policy remains clear; do not invent availability.
6. **Billing & payments** — statements, line items, insurance adjustments, receipts, balance, disputed-charge help, hosted provider checkout. Show posted vs pending reconciliation status.
7. **Insurance** — active plans, effective dates, member/group information partly masked, image upload or change request when approved. Label eligibility as unverified until payer response. Never equate "insurance on file" with guaranteed coverage.
8. **Care team** — verified providers, credentials, clinic telephone, specialties/services, care-team roles, referral request (if supported). Do not invent provider identities.
9. **Account & privacy** — identity and contact data, communication preferences, notification preferences, MFA, trusted devices/sessions, authorized proxies, access history, record-download requests, support.
10. **Help** — how to use the portal, non-emergency response instructions, accessibility, account recovery, accessibility/contact, phishing avoidance.

### Dashboard design

- Navy branded header, warm white content panels, high contrast red for primary actions / *only meaningful* alert states; no red critical indicators for cosmetic emphasis.
- Greeting plus 4 small action cards: **Test results**, **Medications**, **Messages**, **Billing**.
- Three information panels: **Care activity** (latest authorized items), **Your care team**, **Visits & insurance**. In demo mode all data must be obviously synthetic or disabled.
- Global task: **Contact care team**, but no actual message entry/submit until a secure EHR-backed endpoint exists.
- Status chips distinguish **New**, **Requires action**, **Pending**, **Reviewed**, **Paid**; never use color alone. Relative time accompanied by precise date.
- Search only within data the current authorized patient is permitted to see; filter and sorting are local presentation concerns, not authorization.

### Navigation and usability requirements

- 44px minimum comfortable pointer/touch targets, visible focus states, clear back action, no hidden primary navigation, no more than two levels for frequent tasks.
- WCAG 2.2 AA target: keyboard-only, screen-reader landmarks, 200%/400% zoom testing, contrast, descriptive labels, accessible error summaries, reduced motion and non-color status meanings.
- Responsive: left sidebar at 1024+; compact top tabs/mobile "More" navigation below; dashboard goes from multi-column to single column.
- Empty, loading, stale, unsupported, denied, error, expired-session, verification-needed, access-revoked, and offline states designed per module.
- No patient names, details, results or notifications appear in a public/unauthenticated shell.

## Integration strategy (source of truth)

**Preferred sequence:**

1. **Vendor-first:** verify clinic's PrognoCIS license, portal features, clinic-specific configuration, identity/MFA, staff inbox workflow, billing and scheduling. Start with branded navigation/linking to the existing trusted portal. This achieves real functionality before introducing another PHI processor.
2. **Vendor-approved APIs/SSO:** ask PrognoCIS for patient-facing OAuth/SMART on FHIR support, applicable tenant endpoints, production/sandbox registration, allowed FHIR resource scopes, results/release behavior, messaging and refill write APIs, patient identity matching, proxy access model, billing APIs, rate limits, licensing, audit requirements and BAA roles.
3. **Modular adapter layer:** if supported, use \`ehr-adapter\` for \`Patient\`, \`Observation\`/\`DiagnosticReport\`, \`DocumentReference\`, \`Encounter\`, \`MedicationRequest\`/\`MedicationStatement\`, \`Coverage\`, \`Practitioner\`, etc.; use vendor-approved operations for messages, refill requests, balances and checkout where standards coverage is incomplete. No direct scraping or database mirroring.
4. **No API support:** keep the module informational with a clearly labeled **Open secure PrognoCIS portal** action. Do not misrepresent manual links as integrated features.

FHIR/SMART resource naming above describes an *adapter target*, not a claim that SMC's specific tenant exposes these resources or operations. Confirm each capability with the vendor.

**Proposed module directories (when implementation is approved):**

\`\`\`text
src/features/patient-portal/
  components/            # navigation, state views, accessible cards
  modules/
    dashboard/
    health-records/
    medications/
    messages/
    visits/
    billing/
    insurance/
    care-team/
    account/
    help/
  domain/                # typed read/write contracts and role rules
  adapters/              # EHR, identity, payment, secure messaging
  services/              # client use-cases, never authority for permissions
  screens/               # Expo web/native entry screens
worker/portal/           # guarded API handlers and backend adapters; add later
docs/patient-portal/     # this proposal, standalone synthetic prototype
\`\`\`

Business rules remain server authoritative and role-scoped. Shared UI modules use existing design tokens and app shell conventions without pulling public static pages into patient data handling.

### Proposed data flows

- **Sign-in:** EHR-authorized login → MFA/identity verification → server-to-server token exchange (if offered) → secure, HttpOnly, Secure, SameSite session cookie with server-side state → signed-in shell. Don't store bearer or refresh tokens in \`localStorage\` or exposable client state.
- **View result:** browser → authenticated Worker/API backend → authorization to verified patient/proxy scope → EHR adapter read → sanitized UI response with \`Cache-Control: private, no-store\`; audit result access. Clearly identify result status, date, provider, source, and explanatory limitations.
- **Message:** signed-in patient → recipient/attachment checks and rate limit → EHR-backed secure message workflow → server-confirmed receipt; staff queue with assignment and escalation rules. Plain email/SMS is used only for generic "You have a portal update" prompts, without PHI.
- **Payments:** billing authority → hosted payment session at PCI-reviewed vendor → signed, idempotent webhook/payment-status reconciliation → updated receipt and ledger. Never store CVV, PAN or card images. Never mark a balance paid solely from a browser redirect.
- **Proxy switch:** explicit proxy list from verified authorization → server check every request → unambiguous patient-context banner → no token or navigation state leak to next patient.

## Security and compliance release gates

**Non-negotiable before real PHI is processed:**

- Clinic's legal authorization, written risk assessment, privacy/security policies, data-flow and vendor/subprocessor inventory.
- Signed BAAs with every qualifying PHI processor and proof that the precise cloud products/services, plan and configurations are in-scope. **Cloudflare says it signs BAAs for Enterprise customers**; do not assume default Workers/D1/R2/analytics or third-party email configurations are covered without agreement and product confirmation.
- Use EHR identity/MFA, phishing-resistant factor when supported, step-up for sensitive changes, risk-based session lifetime, active revocation, secure recovery, email/phone change verification, enrollment controls.
- Authorize on every server request with patient/guardian relationships, organization, consent and clinical release checks. Test IDOR and cross-patient / cross-proxy access. No implicit role inheritance.
- Encrypt in transit and at rest; separate key lifecycle; no PHI in console logs, tracing, request query strings, error reporting, analytics, external scripts, browser storage or CDN cache. Set \`Cache-Control: no-store\`, correct \`Vary\`, restrictive CSP and framing policies on authenticated responses.
- CSRF defenses for state-changing endpoints; strict input validation; attachment size/content/virus scan; rate limiting; automated abuse detection; idempotency and safe retry handling for external writes/webhooks.
- Tamper-evident audit metadata for access, amendments, downloads, proxy grants, refill submissions, message events and payments, while keeping actual PHI out of ordinary logs. Alert on unusual access.
- Document retention, backups/restores, incident response, access reviews, penetration testing and vulnerability management; test breach reporting procedures.
- Keep public website's existing \`clinic.portalUrl\` unchanged until the clinic approves cutover and the new pathway has passed security, accessibility and staff workflow acceptance.
- Independent PCI responsibilities remain even if checkout is fully hosted. Confirm the merchant's relevant SAQ/PCI scope with payment provider/QSA.

**Avoid**: unsecured "demo login", local passwords without an approved identity system, fake patient medical data in production, collecting medical details via public contact forms, unapproved Resend emails containing PHI, open redirects, external tracking/analytics on authenticated pages, and a parallel patient record database.

## Rollout / acceptance

| Stage | Deliverable | Acceptance |
| --- | --- | --- |
| 0 — Discovery | Clinic approval, PrognoCIS integration specification, provider capabilities, compliance/legal review | Written integration & BAA decisions; no PHI yet |
| 1 — UX | Synthetic standalone prototype, component map, responsive/accessibility review | Clinic/staff/patient feedback approves flows and branding |
| 2 — Identity & read-only | Authorized sign-in + MFA; results, medications, visits, provider and coverage via vendor | Real identity match, patient scope, audit, no-cache, multi-user isolation, support recovery |
| 3 — Actions | Secure messages, refill requests, forms and staff workflow | EHR write-back, clinical triage and escalation, staff training |
| 4 — Finances & proxies | Statements, hosted checkout, reconciliation, insurance change, authorized family view | Zero-card-data collection, webhook idempotency, proxy/consent tests |
| 5 — Launch | Security/privacy signoff, incident plans, performance + WCAG acceptance, smoke tests | Patient pilot and staff signoff, monitored rollback, unchanged public portal fallback |

**Immediate questions for clinic/vendor:** Is SMC authorized to operate a custom patient UI? Which PrognoCIS tenant/API credentials, API licenses, webhooks/SSO, sandbox and BAAs are available? Which results are released under clinic policy? Can messages/refills and billing be written back? What are the staff triage SLAs? Which proxies are allowed? Who owns the domain, payment processor and clinic's clinical/security signoff?

## External references (design research)

- [PrognoCIS patient portal capabilities](https://prognocis.com/patient-portal/)
- [PrognoCIS patient portal FAQ](https://prognocishelp.prognocis.com/prognocis/V3B4/ENG/PatientPortalFAQ.html)
- [HHS guidance: HIPAA and cloud computing](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html)
- [HHS: business associates](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html)
- [HHS: online tracking technologies](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/hipaa-online-tracking/index.html)
- [Cloudflare HIPAA / BAA position](https://www.cloudflare.com/trust-hub/us-privacy-compliance/)
- [ONC/ASTP standardized API certification criteria](https://healthit.gov/test-method/standardized-api-for-patient-and-population-services-acb-atl/)
- [SMART App Launch](https://build.fhir.org/ig/HL7/smart-app-launch/)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [PCI SSC hosted payment page FAQs](https://www.pcisecuritystandards.org/faqs/1438/)
