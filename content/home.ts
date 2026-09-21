/**
 * Homepage copy.
 *
 * Section components under components/sections/ render this; none of them
 * contain a sentence of their own. Sections 5–10 are appended to this file as
 * they are built.
 *
 * Where copy already exists elsewhere it is referenced rather than repeated:
 * the trust line and both CTAs come from content/site.ts, the service cards
 * and every before/after pair come from content/services.ts. Retyping any of
 * it here would create a second copy to keep in sync.
 */

import type { ServiceSlug } from "./services";

export type JourneyStep = {
  /** Stable key. */
  id: string;
  label: string;
};

export const home = {
  hero: {
    eyebrow: "AI automation & websites for service businesses",
    heading: "AI that answers your phone at 9pm.",
    subheading:
      "Most of your leads arrive when nobody's there to catch them. We build the website that brings them in — and the AI that answers, qualifies and books them in under a minute. Every time, including Sunday.",
    /** Secondary CTA. The primary one is site.primaryCta. */
    secondaryCta: { label: "See how it works", href: "/#how-it-works" },
  },

  /**
   * The hero visual: a lead moving through the system with nobody touching it.
   * The counter beside it is the actual claim — four things happened and the
   * owner did none of them.
   */
  leadJourney: {
    steps: [
      { id: "captured", label: "New lead captured" },
      { id: "qualified", label: "AI qualifies & replies" },
      { id: "booked", label: "Routed & booked" },
      { id: "review", label: "Review request sent" },
    ] satisfies JourneyStep[],
    counterLabel: "Manual steps",
    counterValue: "0",
  },

  problem: {
    eyebrow: "The real problem",
    heading: "You're not losing jobs because you're bad at the work.",
    body: "You already do good work and you already have customers. What's missing is everything between “someone was interested” and “we got paid and they told three people.” That's a systems problem, and it's fixable.",
    /** Scenes, not bullets. Each one is something that actually happens. */
    symptoms: [
      "A form comes in Friday at 7pm. You see it Monday. They booked someone else on Saturday.",
      "You've done four hundred jobs and have thirty-one Google reviews.",
      "Every quote goes out and then waits on whoever remembers to chase it.",
      "Your phone rings while you're on a roof. That's the whole lead process.",
      "You know AI could help. Nobody has shown you where it plugs in.",
    ],
  },

  whatWeBuild: {
    eyebrow: "What we build",
    heading: "Start with the website. Add the rest when it's earning.",
    body: "Everything below is bought one piece at a time, in whatever order makes you money soonest. There is no bundle, because a bundle would mean selling you something you don't need yet.",
  },

  beforeAfter: {
    eyebrow: "What changes",
    heading: "The same business, with the gaps closed.",
    /**
     * Which services' before/after pairs to show, in order. The copy itself
     * lives on the service, so a page and its card can never disagree.
     */
    services: [
      "ai-lead-response",
      "missed-call-text-back",
      "get-more-google-reviews",
      "website-design-build",
    ] satisfies ServiceSlug[],
  },
} as const;
