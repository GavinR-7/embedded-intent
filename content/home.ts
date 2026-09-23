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

import type { IconName } from "@/components/ui/icons";

export type SystemRow = {
  /** Stable key. */
  id: string;
  title: string;
  /** The detail line under the title — what actually happens at this step. */
  detail: string;
  icon: IconName;
  /** Right-aligned status chip. Optional: service flow panels have none. */
  status?: string;
};

export type Step = {
  id: string;
  name: string;
  body: string;
  /** Deliverables, as short chips. What the step actually hands you. */
  chips: readonly string[];
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
    heading: "AI that picks up when you can't.",
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
        icon: "inbox",
        title: "New lead captured",
        detail: "Website form, call, or Google",
        status: "AUTO",
      },
      {
        id: "qualified",
        icon: "chat",
        title: "AI qualifies & replies",
        detail: "Job type, timeline, budget, ZIP",
        status: "AUTO",
      },
      {
        id: "booked",
        icon: "calendar",
        title: "Routed & booked",
        detail: "SMS + calendar hold",
        status: "AUTO",
      },
      {
        id: "review",
        icon: "star",
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
    eyebrow: "Where AI actually plugs in",
    heading: "Four places it earns its keep.",
    /**
     * Homepage-specific, unlike the service pages, which use their own
     * service-specific pairs. The question this section answers — where does
     * AI touch my business at all — is not one any single service answers.
     */
    pairs: [
      {
        before: "A form arrives at 8:40pm and sits until morning",
        after: "Answered, qualified and booked before you've finished dinner",
      },
      {
        before: "The review ask depends on who remembers",
        after: "It fires when the job is marked complete, every time",
      },
      {
        before: "Every estimate is written from scratch",
        after: "Drafted from your own pricing, for you to check and send",
      },
      {
        before: "Every new hire asks you the same twenty questions",
        after: "They ask the assistant and get the page the answer came from",
      },
    ],
  },

  howItWorks: {
    eyebrow: "How it works",
    heading: "Find the leak. Close it. Prove it closed.",
    steps: [
      {
        id: "find",
        name: "Find",
        body: "Thirty minutes on where the money is leaking — how leads reach you, what happens to the ones that arrive after hours, and where your team loses time. You leave with a prioritised list whether or not you hire me.",
        chips: ["Lead path audit", "Review gap check", "Time-drain list", "Tool map"],
      },
      {
        id: "build",
        name: "Build",
        body: "The website first, in accounts created in your name. You get the credentials at handover and a walkthrough of how to run it, so nothing is hostage to the relationship.",
        chips: ["In your accounts", "Documented as we go", "2–4 weeks"],
      },
      {
        id: "automate",
        name: "Automate",
        body: "One automation at a time, starting with whichever one pays for itself fastest. It runs whether or not anyone remembers it, with approval rules on anything that commits you to a price or a date.",
        chips: ["Runs 24/7", "Human handoff where it matters", "Fails loudly"],
      },
      {
        id: "measure",
        name: "Measure",
        body: "Qualified leads, speed to first response, hours returned, cost per booked job. Not impressions, not reach. If a piece isn't earning its keep, I'll tell you to switch it off.",
        chips: ["Monthly review", "Source-level tracking", "Cut what doesn't work"],
      },
    ] satisfies Step[],
  },

  whatWeMeasure: {
    eyebrow: "What we measure",
    heading: "Outcomes, not activity.",
    body: "Impressions and reach don't pay anyone. These are the things we track, and the ones we'll show you every month.",
    /**
     * IMPORTANT: these are the metrics we track — not results, not claims.
     * There are no numbers here and there must never be. A figure only goes
     * on this site once it has been measured for a named client with a stated
     * source, which is what content/work.ts enforces.
     */
    outcomes: [
      { name: "Qualified leads per month", detail: "People who want the job you actually do" },
      { name: "Speed to first response", detail: "Minutes from enquiry to a real reply" },
      { name: "New reviews per month", detail: "And how many came from the automated ask" },
      { name: "Hours returned to your team", detail: "Work nobody has to do by hand any more" },
      { name: "Cost per new customer", detail: "Across every channel, not just the ads" },
      { name: "Missed calls recovered", detail: "Calls that turned into a conversation anyway" },
    ],
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
  },
} as const;
