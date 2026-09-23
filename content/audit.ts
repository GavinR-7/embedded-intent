/**
 * The audit offer.
 *
 * Its own module because it is used in two places that are not otherwise
 * related: the homepage close (Phase 3) and the contact page (Phase 6). Living
 * here means the promise made on the homepage and the one made on the form
 * cannot drift apart.
 *
 * The audit is free and it is a form, not a calendar booking. There is no
 * scheduler anywhere on this site — the research between the submission and
 * the reply is the product.
 */
import type { ServiceSlug } from "./services";

export type AuditInterest = {
  id: string;
  label: string;
  /** The catalogue service this maps to, where one exists. */
  slug: ServiceSlug | null;
};

export const audit = {
  isNotHeading: "What the audit is not",

  /**
   * The anti-sell. Naming what this is not buys more credibility than another
   * claim would, and it stops anyone arriving braced for a pitch.
   */
  isNot: [
    "Not a sales call.",
    "Not a demo of software you've never heard of.",
    "Not a proposal you have to sign.",
  ],

  /* -----------------------------------------------------------------------
     The form.

     Options live here rather than in the component for the same reason all
     copy does, and each one carries the `ServiceSlug` it corresponds to where
     a real service exists. That mapping means a submission arrives naming
     services from the catalogue rather than free text, and renaming a service
     cannot silently desync the form from what is actually sold.

     `slug: null` is for the two options that are genuinely not a single
     service: "more leads" spans several, and "not sure yet" is the honest
     answer the audit exists to resolve.
     ----------------------------------------------------------------------- */
  form: {
    heading: "Get your free audit",
    intro:
      "Tell us what's going on. We'll look at your website, your Google listing and your reviews, and email you what we'd fix first — usually within one business day.",
    interestLegend: "What are you after?",
    interestHint: "Pick as many as apply.",
    submitLabel: "Send it",
    submittingLabel: "Sending…",
    successHeading: "Got it.",
    successBody:
      "We'll look at your website, your Google listing and your reviews, then email you what we'd fix first — usually within one business day.",
    errorHeading: "That didn't send.",
    /** Shown when the server is reachable but something went wrong our end. */
    errorBody:
      "Something broke on our end, not yours. Email us directly and we'll pick it up from there.",
    requiredNote: "Required",
    optionalNote: "Optional",
    interests: [
      { id: "website", label: "New website or rebuild", slug: "website-design-build" },
      { id: "found-on-google", label: "Getting found on Google", slug: "get-found-on-google" },
      { id: "google-ads", label: "Google Ads", slug: "google-ads-management" },
      { id: "reviews", label: "More Google reviews", slug: "get-more-google-reviews" },
      { id: "online-booking", label: "Online booking", slug: "online-booking-setup" },
      { id: "quote-calculator", label: "Instant quote calculator", slug: "quote-price-calculator" },
      { id: "more-leads", label: "More leads", slug: null },
      { id: "ai-automation", label: "AI / automation", slug: "ai-lead-response" },
      { id: "not-sure", label: "Not sure yet", slug: null },
    ],
  },

  contactHeading: "Reach us directly",
  contactSub: "You'll reach {owner} directly.",
} as const;
