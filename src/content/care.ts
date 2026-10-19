export const services = [
  {
    id: "illness",
    label: "Illness & allergies",
    icon: "heart",
    title: "When you’re feeling off.",
    description:
      "Care for common illnesses and everyday health concerns, with time to talk through what’s bothering you.",
    items: [
      "Strep throat",
      "Ear infections",
      "Bronchitis",
      "Gastroenteritis",
      "Asthma care",
      "Allergies",
      "Poison ivy and rashes",
    ],
    note: "Call to discuss your symptoms and confirm that the clinic is appropriate for your needs.",
  },
  {
    id: "injury",
    label: "Minor injuries",
    icon: "cross",
    title: "For life’s little mishaps.",
    description:
      "Help for non-life-threatening injuries and minor procedures. Ask about the care you need before heading over.",
    items: [
      "Laceration repair",
      "Minor fracture care",
      "Abscess drainage",
      "Minor surgical services",
    ],
    note: "The team can help confirm service availability. Severe injuries require emergency care.",
  },
  {
    id: "physical",
    label: "Physicals & work care",
    icon: "bag",
    title: "Ready for what’s next.",
    description:
      "A starting point for school, sports, and workplace requirements, plus care for work-related injuries.",
    items: [
      "Sports physicals",
      "Pre-employment physicals",
      "DOT physicals",
      "Workers’ compensation care",
    ],
    note: "Call ahead about required forms, examination availability, and employer instructions.",
  },
] as const;

export const values = [
  {
    title: "A conversation, not just a checklist.",
    text: "Bring your questions. Understanding your concerns is part of caring for you.",
  },
  {
    title: "You’re part of the plan.",
    text: "Person-centered care means your needs and preferences belong in the conversation.",
  },
  {
    title: "Support beyond the first hello.",
    text: "Ask about payment options and use the patient portal to stay connected to your care.",
  },
];
export const visitSteps = [
  {
    title: "Give us a quick call.",
    text: "Confirm current hours and ask whether your concern or required physical can be handled here.",
  },
  {
    title: "Bring the essentials.",
    text: "Have a photo ID, insurance card if applicable, a current medication list, and any required physical forms handy.",
  },
  {
    title: "Walk in. We’ll take it from there.",
    text: "No appointment is necessary. Our team can help you understand the check-in process when you arrive.",
  },
];
export const faqs = [
  {
    question: "Do I need an appointment?",
    answer:
      "No appointment is necessary for walk-in care. Please call first to confirm current hours and availability for your needs.",
  },
  {
    question: "What are your hours?",
    answer:
      "Hours can change. Call the clinic before traveling to confirm current hours. You can also check SMC’s Facebook page for updates.",
    link: "facebook",
  },
  {
    question: "Can I visit without insurance?",
    answer:
      "Ask our team about current self-pay pricing and available payment arrangements before your visit. Specific pricing and insurance participation should be confirmed directly.",
  },
  {
    question: "What should I bring for a physical?",
    answer:
      "Bring a photo ID, a medication list, any required examination forms, and relevant employer or school instructions. Call ahead to confirm the requirements for your particular physical.",
  },
  {
    question: "How do I access the patient portal?",
    answer:
      "Sign in to CareConnect using the patient portal link. CareConnect currently displays sample clinical information; use the clinic’s existing secure portal for real medical records and messaging.",
    link: "portal",
  },
  {
    question: "Is urgent care right for an emergency?",
    answer:
      "This clinic’s services are for non-life-threatening concerns. For a life-threatening emergency, call 911 or go to the nearest emergency department.",
  },
];
