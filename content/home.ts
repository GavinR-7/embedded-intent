/**
 * Homepage copy.
 *
 * Section components under components/sections/ render this; none of them
 * contain a sentence of their own.
 *
 * Where copy already exists elsewhere it is referenced rather than repeated:
 * the trust line and both CTAs come from content/site.ts, the service cards,
 * the pricing table and every before/after pair come from content/services.ts,
 * the FAQ from content/faq.ts, the case study from content/work.ts, and the
 * audit anti-sell from content/audit.ts. Retyping any of it here would create
 * a second copy to keep in sync.
 */

import type { ServiceSlug } from "./services";

export type SystemRow = {
  /** Stable key. */
  id: string;
  title: string;
  /** The detail line under the title — what actually happens at this step. */
  detail: string;
  /** Right-aligned status chip. */
  status: string;
};

export type Step = {
  id: string;
  name: string;
  body: string;
};

export type ComparisonRow = {
  /** What is being compared. */
  aspect: string;
  typical: string;
  ours: string;
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
   * Presented as a panel of working software rather than a diagram, because
   * the claim is concrete — these are the four things that happen, and the
   * footer counts how many of them need a human.
   *
   * Every row's status reads AUTO. An earlier draft had "0.4s" on the first
   * row; it was removed because nothing measured it. A panel styled as live
   * instrumentation is the last place an unsourced number should sit — it is
   * the context most likely to be read as a real reading. The only numbers on
   * this site are published prices and measured results with a stated source.
   */
  leadSystem: {
    title: "Lead system",
    statusLabel: "Live",
    rows: [
      {
        id: "captured",
        title: "New lead captured",
        detail: "Website form, call, or Google",
        status: "AUTO",
      },
      {
        id: "qualified",
        title: "AI qualifies & replies",
        detail: "Job type, timeline, budget, ZIP",
        status: "AUTO",
      },
      {
        id: "booked",
        title: "Routed & booked",
        detail: "SMS + calendar hold",
        status: "AUTO",
      },
      {
        id: "review",
        title: "Job complete → review ask",
        detail: "SMS 2h after sign-off",
        status: "AUTO",
      },
    ] satisfies SystemRow[],
    footerLabel: "Manual steps required",
    footerValue: "0",
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
    /** Prices are deliberately not on these cards — see the pricing section. */
    pricingNote: "Every price is published further down this page.",
    primaryCardCta: "What's included, in full",
    addOnCardCta: "What it does",
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

  howItWorks: {
    eyebrow: "How it works",
    heading: "Find the leak. Close it. Prove it closed.",
    steps: [
      {
        id: "find",
        name: "Find",
        body: "Thirty minutes on where the money is leaking — how leads reach you, what happens to the ones that arrive after hours, and where your team loses time. You leave with a prioritised list whether or not you hire me.",
      },
      {
        id: "build",
        name: "Build",
        body: "The website first, in accounts created in your name. You get the credentials at handover and a walkthrough of how to run it, so nothing is hostage to the relationship.",
      },
      {
        id: "automate",
        name: "Automate",
        body: "One automation at a time, starting with whichever one pays for itself fastest. It runs whether or not anyone remembers it, with approval rules on anything that commits you to a price or a date.",
      },
      {
        id: "measure",
        name: "Measure",
        body: "Qualified leads, speed to first response, hours returned, cost per booked job. Not impressions, not reach. If a piece isn't earning its keep, I'll tell you to switch it off.",
      },
    ] satisfies Step[],
  },

  work: {
    eyebrow: "Work",
    heading: "One site, live, honestly reported.",
    body: "There is one case study here because there is one client site currently live. When the others launch they'll appear, with real numbers once there are real numbers.",
    viewAllLabel: "See the full case study",
  },

  pricing: {
    eyebrow: "Pricing",
    heading: "Published, so you don't have to book a call to find out.",
    body: "Buy one piece at a time, in any order. The website is where most people start; the add-ons are bought when they start earning.",
    columns: {
      service: "Service",
      build: "Build",
      monthly: "Monthly",
    },
    /** Shown under the table. Honest scope-setting, not fine print. */
    notes: [
      "Website builds most often land in the middle of the published range — the full range is there because scope genuinely varies.",
      "Third-party costs are passed through at cost and never marked up.",
    ],
  },

  whyMe: {
    eyebrow: "Why me",
    /** The primary differentiator. It leads — it is not a table row. */
    heading:
      "You work directly with the person building it — not an account manager, not a sales rep, not an outsourced team.",
    body: "Everything below follows from that one fact. A solo practice can't hide behind a process, so it doesn't have one to hide behind.",
    columns: {
      aspect: "",
      typical: "Typical agency",
      ours: "Embedded Intent",
    },
    rows: [
      {
        aspect: "Who does the work",
        typical: "A junior, or a contractor you never meet",
        ours: "Me. The person you talked to on the call",
      },
      {
        aspect: "Who owns the accounts",
        typical: "The agency, until you leave",
        ours: "You, from the day they're created",
      },
      {
        aspect: "What reporting means",
        typical: "Impressions, reach, a PDF nobody reads",
        ours: "Qualified leads, response time, cost per booked job",
      },
      {
        aspect: "Contract length",
        typical: "Twelve months, auto-renewing",
        ours: "None. Month to month, cancel whenever",
      },
      {
        aspect: "Who you talk to",
        typical: "An account manager who relays your questions",
        ours: "Me, directly",
      },
    ] satisfies ComparisonRow[],
  },

  faq: {
    eyebrow: "Questions",
    heading: "The things people actually ask.",
  },

  close: {
    eyebrow: "Next step",
    heading: "Let's find the fastest win in your business.",
    body: "Thirty minutes. We look at how leads reach you, what happens to the ones that arrive after hours, and where your team is losing time — then I tell you what to build first and what it costs.",
    proofHeading: "Most recent build",
  },
} as const;
