/**
 * The service catalogue. Single source of truth for what is sold.
 *
 * Consumed by the homepage "What we build" section and the pricing table
 * (Phase 3), the /services/[slug] pages (Phase 4), and the footer.
 *
 * The offering is modular on purpose: one primary service (the website) plus
 * seven add-ons bought when they start earning. There is deliberately no
 * bundled "full package" tier — a fixed bundle would misrepresent how this is
 * actually sold.
 *
 * Prices below are the owner's confirmed numbers as of 2026-09-21.
 */

export type ServiceSlug =
  | "website-design-build"
  | "ai-lead-response"
  | "missed-call-text-back"
  | "get-more-google-reviews"
  | "get-found-on-google"
  | "google-ads-management"
  | "social-content-engine"
  | "custom-ai-automation";

/**
 * A price band in whole US dollars. `to: null` means "from $X" with no stated
 * ceiling — used only where the scope genuinely has no upper bound, never as a
 * way to avoid publishing a number.
 */
export type PriceBand = {
  from: number;
  to: number | null;
};

/**
 * Recurring cost. A union rather than a number because the shapes genuinely
 * differ: most services are a flat monthly, Google Ads is a floor-or-percentage
 * whichever is greater. Modelling that as a string would put an unformattable
 * price in the data; modelling it as a number would be a lie.
 */
export type MonthlyPricing =
  | { kind: "flat"; amount: number }
  | { kind: "band"; band: PriceBand }
  | {
      kind: "greater-of";
      /** Floor in whole dollars. */
      minimum: number;
      /** Percentage, as a whole number: 15 means 15%. */
      percent: number;
      /** What the percentage is taken of: "ad spend". */
      percentOf: string;
    };

export type ServicePricing = {
  /** One-time build or setup. Absent where there is no setup fee. */
  build?: PriceBand;
  /** Where most projects actually land, inside `build`. Honest narrowing. */
  buildTypical?: PriceBand;
  monthly?: MonthlyPricing;
  /**
   * Third-party cost the client pays at cost, with no markup. This is a trust
   * signal and must be stated on the page wherever it applies — burying it is
   * exactly the behaviour the positioning is defined against.
   */
  passThrough?: string;
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
  /**
   * What this explicitly is *not*. The anti-sell — it buys more credibility
   * than another claim would, and it heads off the wrong expectation before
   * it becomes a refund conversation.
   */
  notThis?: string;
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
      "Site care from launch: hosting, updates, backups, and fixes when something breaks",
    ],
    pricing: {
      build: { from: 1500, to: 5000 },
      buildTypical: { from: 2500, to: 4000 },
      monthly: { kind: "flat", amount: 150 },
    },
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
      build: { from: 1500, to: 2500 },
      monthly: { kind: "flat", amount: 250 },
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
    promise: "Every call you can't pick up gets a text back within seconds.",
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
      build: { from: 800, to: 1200 },
      monthly: { kind: "flat", amount: 100 },
      passThrough:
        "Twilio messaging usage is billed to you at cost, with no markup.",
    },
    beforeAfter: {
      before:
        "Your phone rings while you are on a roof. It goes to voicemail. They call the next company on the list.",
      after:
        "Seconds later they get a text asking what they need and where. The conversation is already moving by the time you are back down the ladder.",
    },
  },
  {
    slug: "get-more-google-reviews",
    name: "Get More Google Reviews",
    tier: "add-on",
    promise:
      "The review request fires automatically when a job completes, without anyone remembering to send it.",
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
      build: { from: 1200, to: 2000 },
      monthly: { kind: "flat", amount: 100 },
    },
    beforeAfter: {
      before:
        "Four hundred finished jobs and thirty-one Google reviews. You mean to ask every time, and then the next job starts.",
      after:
        "The ask goes out when the job closes, every time, and the ones who were going to complain reach you instead of your profile.",
    },
  },
  {
    slug: "get-found-on-google",
    name: "Get Found on Google",
    tier: "add-on",
    promise:
      "Show up in the map pack when someone nearby searches for what you do.",
    outcome:
      "You appear in the three results Google puts above everything else, for the towns you actually drive to.",
    forWhom:
      "Businesses that are invisible on Google unless someone searches their name.",
    includes: [
      "Google Business Profile claimed, verified and filled out properly",
      "Correct categories, service areas and hours",
      "Photos and posts kept current, because a dead profile ranks like one",
      "Name, address and phone made consistent everywhere they appear",
      "Service and area pages written for the towns you serve",
      "Rank tracking by town, so you can see movement rather than take my word for it",
      "A monthly report of calls, direction requests and what moved",
    ],
    pricing: {
      build: { from: 800, to: 1500 },
      monthly: { kind: "flat", amount: 300 },
    },
    beforeAfter: {
      before:
        "Someone two towns over searches for your trade. Three competitors fill the map. You are on page two, below a directory listing you never created.",
      after:
        "You are in the map pack for the towns you actually serve, with photos, hours and a call button, and you can see which town produced which call.",
    },
  },
  {
    slug: "google-ads-management",
    name: "Google Ads Management",
    tier: "add-on",
    promise: "Paid search that gets switched off when it stops earning.",
    outcome:
      "A predictable flow of people searching for your service right now, with a real cost per booked job attached to it.",
    forWhom:
      "Businesses that need leads sooner than local SEO can produce them, and have the capacity to take them.",
    includes: [
      "Campaign built around the jobs you actually want, not the ones with the most searches",
      "Keyword and negative keyword management — the negatives are where the money is saved",
      "Geo targeting to the areas you will actually drive to",
      "Call tracking, so a lead is attributed to the ad that produced it",
      "A landing page that matches the ad, instead of dropping people on the homepage",
      "A monthly review of cost per lead and cost per booked job",
      "An honest recommendation to stop, if the numbers do not work",
    ],
    notThis:
      "Not a retainer that keeps billing while the campaign loses money. If the cost per booked job does not work in your market, I will tell you, and we stop.",
    pricing: {
      monthly: {
        kind: "greater-of",
        minimum: 500,
        percent: 15,
        percentOf: "ad spend",
      },
      passThrough:
        "Ad spend is paid directly to Google and is never marked up. You pay Google what Google charges, and you see the account.",
    },
    beforeAfter: {
      before:
        "You boosted a post once, it brought nothing, and you decided ads do not work for your trade.",
      after:
        "You know what a booked job costs you from search, which towns produce the cheap ones, and exactly when to turn the spend up or off.",
    },
  },
  {
    slug: "social-content-engine",
    name: "Social Content Engine",
    tier: "add-on",
    promise:
      "Posts drafted from your own jobs and your own pricing. You approve them in minutes.",
    outcome:
      "A steady feed that sounds like you and shows your actual work, without you writing anything.",
    forWhom:
      "Owners who know they should be posting, have the photos on their phone, and are never going to sit down and write the captions.",
    includes: [
      "Drafts built from your real jobs, photos and prices — not generic industry filler",
      "Written in your voice, from how you already describe the work",
      "You approve, edit or reject in a few minutes on your phone",
      "Scheduled automatically once approved",
      "Nothing is ever posted without your approval",
    ],
    notThis:
      "This is not 'we run your social media'. Nobody here is pretending to be you in your comments. It drafts, you approve, it posts — you stay the author.",
    pricing: {
      build: { from: 600, to: 1000 },
      monthly: { kind: "flat", amount: 200 },
    },
    beforeAfter: {
      before:
        "Your last post is from fourteen months ago. Your phone has four hundred photos of finished work on it.",
      after:
        "Drafts land with the photos already attached. You read three, tap approve, and the feed stays alive.",
    },
  },
  {
    slug: "custom-ai-automation",
    name: "Custom AI Automation",
    tier: "add-on",
    promise:
      "The repetitive thing eating your week, automated. Scoped on the call.",
    outcome:
      "The task that used to need someone to remember it now happens whether or not anyone does.",
    forWhom:
      "Businesses with a specific, repetitive process that none of the packaged services covers — quoting, scheduling, follow-up, paperwork, internal lookups.",
    includes: [
      "We map the process as it actually runs today, not as the manual describes it",
      "A written scope with a fixed price before any work starts",
      "Built against the tools you already use",
      "Guardrails and human approval on anything that commits you to money or a date",
      "Full logging, so you can audit what it did",
      "Handover documentation, in an account you own",
    ],
    notThis:
      "If the honest answer is that a process should not be automated — too rare, too high-stakes, or just broken and needing fixing first — that is the answer you get.",
    pricing: {
      build: { from: 1500, to: null },
    },
    beforeAfter: {
      before:
        "Every Friday you spend two hours doing the same copy-and-paste between two systems that do not talk.",
      after:
        "It runs on its own, logs what it did, and asks you before anything irreversible.",
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

/** The seven add-ons, in catalogue order. */
export const addOnServices: readonly Service[] = services.filter(
  (service) => service.tier === "add-on",
);

/* -------------------------------------------------------------------------
   Formatting.

   Pure functions, no JSX — this module is still data only. They live here so
   the homepage pricing table and the service pages cannot drift into two
   different ways of writing the same price.
   ------------------------------------------------------------------------- */

const dollars = (amount: number) => `$${amount.toLocaleString("en-US")}`;

/** "$1,500–5,000", or "from $1,500" for an open-ended band. */
export function formatPriceBand(band: PriceBand): string {
  return band.to === null
    ? `from ${dollars(band.from)}`
    : `${dollars(band.from)}–${band.to.toLocaleString("en-US")}`;
}

/** "$150/mo", "$150–300/mo", or "$500/mo or 15% of ad spend, whichever is greater". */
export function formatMonthly(monthly: MonthlyPricing): string {
  switch (monthly.kind) {
    case "flat":
      return `${dollars(monthly.amount)}/mo`;
    case "band":
      return `${formatPriceBand(monthly.band)}/mo`;
    case "greater-of":
      return `${dollars(monthly.minimum)}/mo or ${monthly.percent}% of ${monthly.percentOf}, whichever is greater`;
  }
}

/** The build column of the pricing table. "—" where there is no setup fee. */
export function formatBuild(pricing: ServicePricing): string {
  return pricing.build ? formatPriceBand(pricing.build) : "—";
}

/** One-line summary, for cards rather than the table. */
export function formatPricing(pricing: ServicePricing): string {
  const parts: string[] = [];
  if (pricing.build) parts.push(`${formatPriceBand(pricing.build)} to build`);
  if (pricing.monthly) parts.push(formatMonthly(pricing.monthly));
  return parts.join(", then ");
}
