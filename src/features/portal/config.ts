export const portalSections = [
  { id: "dashboard", label: "Dashboard", icon: "⌂", description: "Your health at a glance." },
  { id: "results", label: "Test results", icon: "◈", description: "Released laboratory and diagnostic results." },
  { id: "medications", label: "Medications", icon: "✚", description: "Prescriptions, pharmacies and refill requests." },
  { id: "visits", label: "Visits", icon: "▦", description: "Appointments, care summaries and visit history." },
  { id: "messages", label: "Messages", icon: "✉", description: "Secure messages and care-team conversations." },
  { id: "billing", label: "Billing", icon: "▤", description: "Statements, insurance adjustments and payment history." },
  { id: "insurance", label: "Insurance", icon: "◇", description: "Coverage details, plans and claim information." },
  { id: "care-team", label: "Care team", icon: "♡", description: "Your physicians and clinical team." },
  { id: "documents", label: "Documents", icon: "▣", description: "Discharge instructions, forms and document requests." },
  { id: "settings", label: "Settings", icon: "⚙", description: "Profile, privacy, notifications and sessions." },
] as const;
export type PortalSection = (typeof portalSections)[number]["id"];
