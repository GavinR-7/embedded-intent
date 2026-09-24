/**
 * Static labels for the three category pages.
 *
 * The per-category content lives in `content/categories.ts` and the service
 * rows come from `content/services.ts` — this is only the furniture around
 * them. One copy of each heading, shared by all three pages, so a section
 * cannot say "What's happening now" on one and "The problem" on another.
 *
 * The same split as `content/servicePage.ts`, for the same reason.
 */
export const categoryPage = {
  symptomsEyebrow: "The problem",
  symptomsHeading: "What's happening now",

  servicesEyebrow: "What we build",
  servicesHeading: "The pieces, and what each one does.",
  /** Shown under the heading, above the rows. */
  servicesNote: "Buy one at a time, in whatever order makes you money soonest.",
  serviceRowCta: "See how it works",

  changeEyebrow: "The fix",
  changeHeading: "What changes",
  beforeLabel: "Before",
  afterLabel: "After",

  faqEyebrow: "Questions",
  faqHeading: "Worth asking before you start here.",

  closeEyebrow: "Next step",
  closeHeading: "Not sure which piece you need first?",
  closeBody:
    "That's what the free audit is for. Tell us about your business. We'll look at how leads reach you and what happens to the ones that arrive after hours, then email you what to fix first and what it costs. Sometimes the answer is that none of this is what you need first.",
} as const;
