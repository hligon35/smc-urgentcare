/** Synthetic preview-only content. Never replace these entries with real medical data. */
export const portalSamples = {
  results: [
    ["Example wellness panel", "Sample result • Oct 10, 2026", "Reviewed"],
    ["Example screening", "Sample result • Sep 22, 2026", "Available"],
    ["Example laboratory report", "Sample result • Aug 12, 2026", "Available"],
  ],
  medications: [
    ["Example prescription", "Illustrative instructions only", "Active"],
    ["Example refill request", "Not submitted to any pharmacy", "Draft"],
  ],
  visits: [
    ["Example follow-up visit", "Sample visit • Oct 12, 2026", "Completed"],
    ["Example care instructions", "Illustrative visit document", "View"],
  ],
  messages: [
    ["Welcome to CareConnect", "Example support conversation", "Unread"],
    ["Care team questions", "Draft — never sent", "Draft"],
  ],
  billing: [
    ["Example statement", "Illustrative balance — no amount due", "Preview"],
    ["Example receipt", "Not a real payment", "Sample"],
  ],
  insurance: [
    ["Example insurance plan", "No live coverage verification", "Not connected"],
    ["Change request", "Not submitted to the clinic", "Draft"],
  ],
  "care-team": [
    ["Your care provider", "Provider directory not connected", "Pending"],
    ["Clinic contact", "SMC Urgent Care • 317-852-3505", "Available"],
  ],
  documents: [
    ["Example discharge instructions", "Illustrative document entry", "Sample"],
    ["Release of information", "Request interface only", "Preview"],
  ],
  settings: [
    ["Contact details", "Account display data", "Edit"],
    ["Communication preferences", "Local preview only", "Edit"],
    ["Security and sessions", "Email, Google and session management", "View"],
  ],
} as const;
