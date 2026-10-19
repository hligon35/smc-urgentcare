export const portalSections = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", description: "Your health at a glance." },
  { id: "results", label: "Test results", icon: "results", description: "Released laboratory and diagnostic results." },
  { id: "medications", label: "Medications", icon: "medications", description: "Prescriptions, pharmacies and refill requests." },
  { id: "visits", label: "Visits", icon: "calendar", description: "Appointments, care summaries and visit history." },
  { id: "messages", label: "Messages", icon: "mail", description: "Secure messages and care-team conversations." },
  { id: "billing", label: "Billing", icon: "billing", description: "Statements, insurance adjustments and payment history." },
  { id: "insurance", label: "Insurance", icon: "insurance", description: "Coverage details, plans and claim information." },
  { id: "care-team", label: "Care team", icon: "team", description: "Your physicians and clinical team." },
  { id: "documents", label: "Documents", icon: "document", description: "Discharge instructions, forms and document requests." },
  { id: "settings", label: "Settings", icon: "settings", description: "Profile, privacy, notifications and sessions." },
] as const;
export type PortalSection = (typeof portalSections)[number]["id"];

