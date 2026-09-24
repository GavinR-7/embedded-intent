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
  panelStatusLabel: "How it runs",

  forWhomHeading: "Who it's for",
  timelineHeading: "How long",
  outcomeHeading: "What you end up with",

  symptomsEyebrow: "The problem",
  symptomsHeading: "What's happening now",

  includesEyebrow: "Included",
  includesHeading: "What you actually get",
  examplesHeading: "For example",

  changeEyebrow: "The fix",
  changeHeading: "What changes",
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
    "That's what the free audit is for. Tell us about your business. We'll look at how leads reach you and what happens to the ones that arrive after hours, then email you what to fix first and what it costs. Sometimes the answer is that this is not the piece you need first.",
} as const;
