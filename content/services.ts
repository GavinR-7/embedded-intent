/**
 * The service catalogue. Single source of truth for what is sold.
 *
 * Consumed by the homepage "What we build" section (Phase 3), the
 * /services/[slug] pages (Phase 4), and the footer's Services column.
 *
 * ⚠️ PRICING IS PROPOSED, NOT CONFIRMED. Every number in this file is
 * calibrated against the competitor ladder in AGENCY_SITE_COPY.md — it is a
 * starting point for a decision, not a decision. Confirm before Phase 3 puts
 * these on a public page. Tracked in CONTENT_TODO.md.
 */

export type ServiceSlug =
  | "website-design-build"
  | "ai-lead-response"
  | "missed-call-text-back"
  | "review-automation"
  | "internal-ai-assistant";

/**
 * A price band in whole US dollars. `to: null` means "from $X" with no stated
 * ceiling — used where the scope genuinely has no upper bound, not as a way to
 * avoid publishing a number.
 */
export type PriceBand = {
  from: number;
  to: number | null;
};

export type ServicePricing = {
  /** One-time build or setup cost. */
  build: PriceBand;
  /** Ongoing monthly cost. Absent when the service has no retainer. */
  monthly?: PriceBand;
};

/**
 * A before/after pair, written as a scene rather than a claim. Both halves
 * describe the reader's own business — neither is a statement about a client,
 * so nothing here needs measuring.
 */
export type BeforeAfter = {
  before: string;
  after: string;
};

export type Service = {
  slug: ServiceSlug;
  name: string;
  /** Whether this is the entry product or something added to it. */
  tier: "primary" | "add-on";
  /** One line. What it is, in the owner's language. */
  promise: string;
  /** The thing that actually changes in the business. */
  outcome: string;
  /** Who should buy it — and, by implication, who shouldn't. */
  forWhom: string;
  /** Concrete deliverables. No adjectives. */
  includes: readonly string[];
  pricing: ServicePricing;
  beforeAfter: BeforeAfter;
};

export const services: readonly Service[] = [
  {
    slug: "website-design-build",
    name: "Website Design & Build",
    tier: "primary",
    promise:
      "A fast, custom site that turns the people already searching for you into booked jobs.",
    outcome:
      "A site that loads in under two seconds on a phone, where every page has one obvious next step and the phone number is always within reach of a thumb.",
    forWhom:
      "Service businesses with no website, or with one that looks fine and books nothing.",
    includes: [
      "Custom design — not a template with your logo dropped in",
      "Built mobile-first, because that is where your customers actually are",
      "Next.js on Vercel: static pages, image optimisation, real speed scores",
      "Call and quote buttons reachable by thumb on every screen",
      "Service pages and area pages you can add to as you grow",
      "Google Business Profile connected and verified",
      "Analytics, so you can see what people actually do",
      "Every account created in your name, credentials handed over, and a walkthrough of how to run it",
    ],
    pricing: { build: { from: 3500, to: 9000 } },
    beforeAfter: {
      before:
        "Your site was built in 2019 on a template, takes six seconds to open on a phone, and your number is an image in the footer that nobody can tap.",
      after:
        "It opens in under two seconds, the call button follows the customer down the page, and the quote form lands on your phone before they have closed the tab.",
    },
  },
  {
    slug: "ai-lead-response",
    name: "AI Lead Response",
    tier: "add-on",
    promise:
      "Answers, qualifies and books every lead in under a minute — including at 9pm on a Sunday.",
    outcome: "No lead sits overnight waiting for someone to notice it.",
    forWhom:
      "Businesses already getting enough enquiries that answering them all, fast, has become the bottleneck.",
    includes: [
      "Replies within a minute to web forms, texts and chat, around the clock",
      "Asks the qualifying questions you choose — job type, address, timeline, budget",
      "Offers real slots from your actual calendar and books them",
      "Hands off to a person the moment the customer asks, or when it is unsure",
      "Every conversation logged in full, so you can read exactly what was said",
      "Approval rules for anything that commits you to a price or a date",
    ],
    pricing: {
      build: { from: 2000, to: 4000 },
      monthly: { from: 300, to: 600 },
    },
    beforeAfter: {
      before:
        "A lead comes in at 8:40pm. Someone sees it at 9:15 the next morning and calls back. They booked your competitor before breakfast.",
      after:
        "It replies in under a minute, asks what the job is and where, offers three real appointment slots, and puts a briefed lead on the right person's calendar.",
    },
  },
  {
    slug: "missed-call-text-back",
    name: "Missed-Call Text-Back",
    tier: "add-on",
    promise: "Every call you can't pick up gets a text back within ten seconds.",
    outcome: "A missed call stops being a lost job.",
    forWhom:
      "Anyone whose phone rings while their hands are full — which is most trades.",
    includes: [
      "Automatic text the moment a call goes unanswered",
      "The conversation continues by text, so the customer never has to call twice",
      "Routes to your calendar or to a person once the job is clear",
      "Works with the business line you already have — no new number to publish",
      "After-hours messaging you can set separately",
    ],
    pricing: {
      build: { from: 750, to: 1500 },
      monthly: { from: 150, to: 300 },
    },
    beforeAfter: {
      before:
        "Your phone rings while you are on a roof. It goes to voicemail. They call the next company on the list.",
      after:
        "Ten seconds later they get a text asking what they need and where. The conversation is already moving by the time you are back down the ladder.",
    },
  },
  {
    slug: "review-automation",
    name: "Review Automation",
    tier: "add-on",
    promise:
      "The review request goes out the moment a job closes, without anyone remembering to send it.",
    outcome:
      "Your review count starts to reflect the number of jobs you have actually done.",
    forWhom:
      "Businesses with far more finished jobs than reviews — and a competitor outranking them on both.",
    includes: [
      "Triggered by job completion, not by someone's memory",
      "Sent by text or email, with a direct link to your Google profile",
      "One polite follow-up, then it stops",
      "Unhappy customers are routed privately to you first, before they post",
      "A simple view of what went out and what came back",
    ],
    pricing: {
      build: { from: 1000, to: 2000 },
      monthly: { from: 150, to: 250 },
    },
    beforeAfter: {
      before:
        "Four hundred finished jobs and thirty-one Google reviews. You mean to ask every time, and then the next job starts.",
      after:
        "The ask goes out when the job closes, every time, and the ones who were going to complain reach you instead of your profile.",
    },
  },
  {
    slug: "internal-ai-assistant",
    name: "Internal AI Assistant",
    tier: "add-on",
    promise:
      "Your pricing, process and paperwork, answerable in a sentence by anyone on your team.",
    outcome:
      "New people stop interrupting you to ask what something costs or where the form lives.",
    forWhom:
      "Businesses with staff, where the same questions come back to the owner every week.",
    includes: [
      "Trained on your own pricing, procedures and documents — nothing else",
      "Answers by chat or text, wherever your team already works",
      "Every answer cites the document it came from, so it can be checked",
      "Says it does not know instead of guessing",
      "You control who can see what",
      "Update a document and the answers update with it",
    ],
    pricing: {
      build: { from: 2500, to: 6000 },
      monthly: { from: 250, to: 500 },
    },
    beforeAfter: {
      before:
        "Every new hire asks the same twenty questions, and they ask you, usually while you are driving.",
      after:
        "They ask the assistant, get the answer with the page it came from, and you find out it happened when you read the log.",
    },
  },
];

/** Lookup by slug. Returns undefined for an unknown slug — callers decide. */
export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

/** The entry product. Phase 3 renders this as the primary card. */
export const primaryService: Service = services.find(
  (service) => service.tier === "primary",
)!;

/** The four add-ons, in catalogue order. */
export const addOnServices: readonly Service[] = services.filter(
  (service) => service.tier === "add-on",
);

/**
 * Formats a band as "$3,500–9,000" or "from $3,500".
 *
 * Lives here rather than in a component so Phases 3 and 4 cannot drift into
 * two different ways of writing a price. Pure function, no JSX — this phase is
 * still data only.
 */
export function formatPriceBand(band: PriceBand): string {
  const dollars = (amount: number) => `$${amount.toLocaleString("en-US")}`;
  return band.to === null
    ? `from ${dollars(band.from)}`
    : `${dollars(band.from)}–${band.to.toLocaleString("en-US")}`;
}

/** "$2,000–4,000 to build, then $300–600/mo" */
export function formatPricing(pricing: ServicePricing): string {
  const build = formatPriceBand(pricing.build);
  if (!pricing.monthly) return build;
  return `${build} to build, then ${formatPriceBand(pricing.monthly)}/mo`;
}
