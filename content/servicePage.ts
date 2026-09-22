/**
 * Static labels for /services/[slug].
 *
 * The per-service content all comes from `content/services.ts` — this is only
 * the furniture around it: section headings, column labels, the closing block.
 * One copy of each, shared by all eight pages, so a heading cannot say
 * "What's included" on one page and "What you get" on another.
 */
export const servicePage = {
  eyebrow: "Service",
  backLabel: "All services",

  forWhomHeading: "Who it's for",

  problemEyebrow: "The problem",
  problemHeading: "What this fixes",

  includesEyebrow: "Included",
  includesHeading: "What you actually get",

  changeEyebrow: "What changes",
  changeHeading: "Before, and after.",
  beforeLabel: "Before",
  afterLabel: "After",

  notThisEyebrow: "Straight answer",

  pricingEyebrow: "Pricing",
  pricingHeading: "What it costs.",
  buildLabel: "Build",
  monthlyLabel: "Monthly",
  typicalLabel: "Most projects land",
  noBuildLabel: "No setup fee",
  noMonthlyLabel: "No monthly",

  faqEyebrow: "Questions",
  faqHeading: "Worth asking before you buy this.",

  closeEyebrow: "Next step",
  closeHeading: "Not sure this is the piece you need first?",
  closeBody:
    "That's what the audit is for. Thirty minutes on where your leads are actually leaking, then an honest answer about what to build first — which is sometimes not this.",
} as const;
