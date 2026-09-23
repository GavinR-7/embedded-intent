/**
 * The service catalogue. Single source of truth for what is sold.
 *
 * Consumed by the homepage "What we build" section and the pricing table,
 * the /services/[slug] pages, and the footer.
 *
 * The offering is modular on purpose: one primary service (the website) plus
 * add-ons bought when they start earning. There is deliberately no bundled
 * "full package" tier — a fixed bundle would misrepresent how this is sold.
 *
 * ---------------------------------------------------------------------------
 * WRITING RULES for `symptoms` and `beforeAfter`. Read before editing.
 *
 * The reader is a contractor holding a phone in a truck cab. He is not
 * browsing; he is deciding whether you understand his business.
 *
 *   - Short sentences. He is reading one-handed.
 *   - Every symptom is a THING THAT HAPPENS IN HIS DAY, not a property of his
 *     website. "Someone searched for you and the site took six seconds" —
 *     never "slow load times hurt conversion".
 *   - Numbers and times, always: six seconds, 8:40pm, thirty-one reviews,
 *     12th on the map. Specificity is itself the trust signal.
 *   - Second person. Your site, your phone, your customer.
 *   - Banned words: leverage, optimize, streamline, solution, seamless,
 *     robust, empower, unlock, transform.
 *
 * The test: read any two services' symptoms back to back. If they could be
 * swapped without anyone noticing, they are not specific enough — rewrite
 * rather than ship them.
 * ---------------------------------------------------------------------------
 *
 * Prices are the owner's confirmed numbers as of 2026-09-21.
 */

import type { IconName } from "@/components/ui/icons";

/**
 * Grouping for the Services mega menu. The menu reads this from the data
 * rather than holding its own list, so adding a service puts it in the nav
 * automatically and it can never appear in the catalogue but not the menu.
 */
export type ServiceCategory = "websites" | "get-found" | "ai-automation";

export const serviceCategories: readonly {
  id: ServiceCategory;
  label: string;
}[] = [
  { id: "websites", label: "Websites" },
  { id: "get-found", label: "Get found" },
  { id: "ai-automation", label: "AI & automation" },
];

/** Services in a category, in catalogue order. */
export function servicesByCategory(category: ServiceCategory): readonly Service[] {
  return services.filter((service) => service.category === category);
}

/**
 * One step in the service's flow panel — the vertical "this is what actually
 * happens" readout beside the service page hero.
 */
export type FlowStep = {
  title: string;
  /** The line under the title. How the step actually works. */
  detail: string;
  icon: IconName;
};

export type ServiceSlug =
  | "website-design-build"
  | "website-refresh"
  | "online-booking-setup"
  | "quote-price-calculator"
  | "ai-lead-response"
  | "missed-call-text-back"
  | "get-more-google-reviews"
  | "get-found-on-google"
  | "google-ads-management"
  | "social-content-engine"
  | "custom-ai-automation";

/**
 * At least three, checked at compile time.
 *
 * A plain `string[]` would let a service ship with one thin symptom, which is
 * exactly the state this type was introduced to fix. The tuple-with-rest makes
 * "fewer than three" a build error rather than something you notice on the
 * live page.
 */
export type AtLeastThree<T> = readonly [T, T, T, ...T[]];

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
 * One before/after pair. Short phrases, not scenes — the scenes live in
 * `symptoms`. These read as a two-column comparison, so each side should be a
 * fragment a reader takes in at a glance.
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
  /** Which mega-menu column this belongs in. */
  category: ServiceCategory;
  /** Shown in the nav and on the flow panel. */
  icon: IconName;
  /** One line. What it is, in the owner's language. */
  promise: string;
  /** The thing that actually changes in the business. */
  outcome: string;
  /** Who should buy it — and, by implication, who shouldn't. */
  forWhom: string;
  /** How long it takes, stated plainly. */
  timeline: string;
  /** Concrete deliverables. No adjectives. */
  includes: readonly string[];
  /** What is going wrong in his week right now. Minimum three. */
  symptoms: AtLeastThree<string>;
  /** The same business with the gaps closed. Minimum three. */
  beforeAfter: AtLeastThree<BeforeAfter>;
  /**
   * What this explicitly is *not*. The anti-sell — it buys more credibility
   * than another claim would, and it heads off the wrong expectation before
   * it becomes a refund conversation.
   */
  notThis?: string;
  /**
   * Named things this actually does, for services whose scope is otherwise
   * abstract. "Custom automation" means nothing until you can point at four
   * jobs it replaces.
   */
  examples?: readonly string[];
  /** What actually happens, step by step. Rendered as the flow panel. */
  flow: AtLeastThree<FlowStep>;
  /**
   * The compounding result, as a short chain. Rendered as a footer strip on
   * the flow panel. These are directions, not measurements — no numbers.
   */
  outcomeChain?: readonly string[];
  pricing: ServicePricing;
};

export const services: readonly Service[] = [
  {
    slug: "website-design-build",
    name: "Website Design & Build",
    tier: "primary",
    category: "websites",
    icon: "browser",
    promise:
      "A fast, custom site that turns the people already searching for you into booked jobs.",
    outcome:
      "A site that opens in under two seconds on a phone, where the call button is always within reach of a thumb.",
    forWhom:
      "Service businesses with no website, or with one that looks fine and books nothing.",
    timeline: "Two to four weeks, depending on how fast your content comes back.",
    includes: [
      "Custom design — not a template with your logo dropped in",
      "Built mobile-first, because that is where your customers actually are",
      "Next.js on Vercel: static pages, image optimisation, real speed scores",
      "Call and quote buttons reachable by thumb on every screen",
      "Service pages and area pages you can add to as you grow",
      "Google Business Profile connected and verified",
      "Analytics, so you can see what people actually do",
      "Seasonal content refresh included in site care — prices, offers and photos updated as your year changes",
      "Every account created in your name, credentials handed over, and a walkthrough of how to run it",
    ],
    symptoms: [
      "Someone searches for what you do, finds you, and the site takes six seconds to open. They're back on Google before it finishes.",
      "Your phone number is text inside an image. On a phone, tapping it does nothing.",
      "It looks fine on your laptop. On a phone the menu covers the screen and the buttons are too small to hit.",
      "You paid someone in 2019 and haven't been able to change a word since.",
    ],
    beforeAfter: [
      { before: "Six seconds to open on a phone", after: "Under two seconds, every page" },
      {
        before: "Your number is an image nobody can tap",
        after: "A call button that follows them down the page",
      },
      {
        before: "The form goes to an inbox nobody checks",
        after: "The quote lands on your phone before they've closed the tab",
      },
      {
        before: "You call the old developer to change a price",
        after: "You text me, or change it yourself",
      },
    ],
    flow: [
      { title: "Someone finds you on Google", detail: "Search, the map pack, or a card you handed them", icon: "search" },
      { title: "The page opens in under two seconds", detail: "Static pages, compressed photos, no builder bloat", icon: "bolt" },
      { title: "They tap the call button", detail: "Reachable by thumb on every screen", icon: "phone" },
      { title: "Or the quote lands on your phone", detail: "Job, address and date, before they close the tab", icon: "inbox" },
    ],
    outcomeChain: [
      "Faster pages",
      "More people who stay",
      "More calls from the same traffic",
    ],
    pricing: {
      build: { from: 1500, to: 5000 },
      buildTypical: { from: 2500, to: 4000 },
      monthly: { kind: "flat", amount: 150 },
    },
  },
  {
    slug: "website-refresh",
    name: "Website Refresh",
    tier: "add-on",
    category: "websites",
    icon: "refresh",
    promise: "Keep the site you have. Fix the parts that are costing you.",
    outcome:
      "A site that looks current and opens fast, without starting over or changing your address.",
    forWhom:
      "Businesses whose site basically works. It's just dated, slow, or falls apart on a phone.",
    timeline: "One to two weeks.",
    includes: [
      "An honest look at what's worth keeping before anything is touched",
      "Layout and design rebuilt on the pages you already have",
      "Reworked mobile-first, since that's where it's failing",
      "Photos compressed and resized — usually the whole speed problem",
      "Prices, services and copy brought up to what you actually do now",
      "Your web address stays the same",
      "Seasonal content refresh included in site care",
    ],
    symptoms: [
      "The site works. It just looks like it was built in 2016, because it was.",
      "The prices on it are two years old, so you've quietly stopped sending people there.",
      "Every photo on it came straight off a camera at four megabytes. That is the whole reason it is slow.",
      "The photos are from your first van. You've had three since.",
    ],
    beforeAfter: [
      {
        before: "A template every company in your trade uses",
        after: "Your work, your prices, your photos",
      },
      { before: "Four seconds to open on a phone", after: "Under two seconds, same pages" },
      {
        before: "A page that still says 'coming soon'",
        after: "Every page says what you do today",
      },
      {
        before: "Starting over would cost you a month",
        after: "One to two weeks, and the address stays the same",
      },
    ],
    notThis:
      "Not a rebuild wearing a refresh's price tag. If what's underneath is past saving, I'll say so — and a new build costs more than this.",
    flow: [
      { title: "We look at what's worth keeping", detail: "Structure, addresses, anything already working", icon: "search" },
      { title: "Photos get compressed and resized", detail: "Usually the entire speed problem", icon: "bolt" },
      { title: "Layout rebuilt on your existing pages", detail: "Mobile-first, same addresses", icon: "browser" },
      { title: "Prices and copy brought current", detail: "What you actually do today", icon: "document" },
    ],
    outcomeChain: [
      "Same web address",
      "Faster on a phone",
      "A site you're willing to send people to",
    ],
    pricing: {
      build: { from: 800, to: 2000 },
      monthly: { kind: "flat", amount: 150 },
    },
  },
  {
    slug: "online-booking-setup",
    name: "Online Booking Setup",
    tier: "add-on",
    category: "websites",
    icon: "calendar",
    promise: "Let people book you at 11pm without picking up the phone.",
    outcome:
      "A calendar that fills itself, with deposits taken and reminders sent, in an account that stays yours.",
    forWhom:
      "Businesses that book appointments by phone or DM, and quietly lose everyone who won't do either.",
    timeline: "One week.",
    includes: [
      "Booking set up in a tool the account for which is in your name",
      "Your real availability, with buffers and travel time already subtracted",
      "Deposits taken at the time of booking, if you want them",
      "Confirmation by text and email the moment it's booked",
      "Reminders before the appointment, so fewer people forget",
      "Reschedule and cancel links, so changes stop coming through you",
      "Wired into the site, so it's one tap from any page",
    ],
    symptoms: [
      "Someone messages at 10pm asking if you're free Saturday. You answer at 7am. They booked someone else.",
      "Six messages back and forth to agree one appointment time.",
      "You get no-shows because nobody reminded them, and you eat the slot.",
      "Your calendar lives in your head and on a whiteboard in the shop.",
    ],
    beforeAfter: [
      { before: "Booking takes six messages back and forth", after: "They pick a slot you actually have free" },
      { before: "A no-show costs you the whole slot", after: "A deposit at booking and a reminder before" },
      { before: "Someone has to answer for anything to get booked", after: "It books at 11pm while you're asleep" },
      { before: "Every change comes through you", after: "They reschedule themselves with a link" },
    ],
    flow: [
      { title: "They tap Book on any page", detail: "Not a phone number and a hope", icon: "calendar" },
      { title: "They see your real availability", detail: "Buffers and travel time already subtracted", icon: "clock" },
      { title: "Deposit taken, if you want one", detail: "The no-show stops being free", icon: "shield" },
      { title: "Confirmation goes out instantly", detail: "Text and email, with the details", icon: "send" },
      { title: "Reminder before the appointment", detail: "And a link to move it if they must", icon: "check" },
    ],
    outcomeChain: ["Bookings after hours", "Fewer no-shows", "A calendar you didn't have to manage"],
    pricing: {
      build: { from: 600, to: 1200 },
      passThrough:
        "The booking tool's own subscription is billed to you directly by them, at their price, and is never marked up. There is no monthly from me on this one.",
    },
  },
  {
    slug: "quote-price-calculator",
    name: "Quote & Price Calculator",
    tier: "add-on",
    category: "websites",
    icon: "calculator",
    promise: "A ballpark price on your site, before they ever call you.",
    outcome:
      "People arrive already knowing roughly what it costs, and the ones who were never close stop filling your inbox.",
    forWhom:
      "Businesses whose first question on every single call is \"roughly what does this run?\"",
    timeline: "One to two weeks.",
    includes: [
      "A few questions a customer can actually answer — size, date, guest count, square footage",
      "A ballpark built from your own pricing, not a guess",
      "Ranges rather than fake precision, with the things that move the number named",
      "A quote request pre-filled with everything they just answered",
      "You see the number they were shown before you call them back",
      "Kept current under the $150/mo site care plan that covers your site — no second monthly for this",
    ],
    symptoms: [
      "Every call opens with \"roughly what does this run?\" and you're guessing on the spot.",
      "You spend forty minutes quoting someone whose budget was never close.",
      "Plenty of people never call at all, because nobody in your trade will say what anything costs.",
      "Two customers got different numbers for the same job, because you quoted from memory.",
    ],
    beforeAfter: [
      { before: "Every call starts with \"what does it cost?\"", after: "They arrive already knowing the range" },
      { before: "Forty minutes quoting someone who was never close", after: "The mismatch shows up before you drive out" },
      { before: "Quotes from memory, different every time", after: "The same pricing every time, from your own numbers" },
      { before: "A contact form with a name and a phone number", after: "A request with the size, the date and the number they saw" },
    ],
    flow: [
      { title: "They answer a few questions", detail: "Size, date, guest count, square footage", icon: "filter" },
      { title: "They see a ballpark, not a riddle", detail: "A range built from your own pricing", icon: "calculator" },
      { title: "The quote request fills itself in", detail: "Everything they just answered, attached", icon: "document" },
      { title: "It lands on your phone", detail: "With the number they were shown", icon: "inbox" },
    ],
    outcomeChain: ["Fewer tyre-kicker calls", "Quotes that start informed", "Pricing that doesn't vary by memory"],
    pricing: {
      build: { from: 900, to: 2000 },
    },
  },
  {
    slug: "ai-lead-response",
    name: "AI Lead Response",
    tier: "add-on",
    category: "ai-automation",
    icon: "chat",
    promise:
      "Answers their questions, qualifies the job and books it — in under a minute, at any hour.",
    outcome:
      "Every enquiry gets a real answer the moment it lands, and the ones worth having arrive on your calendar already qualified.",
    forWhom:
      "Businesses getting enough enquiries that answering them all, fast, has become the bottleneck.",
    timeline: "One to two weeks.",
    includes: [
      "Replies within a minute to web forms, texts and web chat, around the clock",
      "Answers the questions you get every week — do you cover my town, roughly what does this cost, how soon can you come — from your own pricing and service area",
      "Asks the qualifying questions you choose: job type, address, timeline, budget",
      "Offers real slots from your actual calendar and books them",
      "Hands off to you the moment someone asks for a person, or when it isn't sure",
      "Every conversation logged in full, so you can read exactly what was said",
      "Approval rules on anything that commits you to a price or a date",
      "Automatic follow-up when a quote goes cold — day 2, day 5, day 14, then it stops",
    ],
    symptoms: [
      "A form comes in at 8:40pm. You see it at 7am. They booked someone else at 9.",
      "Half your calls are the same four questions: do you cover my town, what does it cost roughly, how soon, do you even do this kind of job.",
      "You're up a ladder. The phone rings. You call back at six and they've moved on.",
      "Saturday and Sunday leads sit there until Monday morning.",
      "You sent a quote nine days ago. You don't know if they opened it, and you're not going to chase it.",
    ],
    beforeAfter: [
      {
        before: "A lead at 8:40pm waits until morning",
        after: "Answered in under a minute, every night",
      },
      {
        before: "You answer the same four questions all week",
        after: "It answers them from your own pricing and service area",
      },
      { before: "You call back and play voicemail tag", after: "Three real slots offered, one booked" },
      {
        before: "You find out what the job is on the call",
        after: "Job type, address and timeline are written down before you speak",
      },
      {
        before: "A quote goes quiet and stays quiet",
        after: "Follow-ups at day 2, day 5 and day 14, until they answer either way",
      },
    ],
    notThis:
      "Not a chatbot that makes things up. It answers from what you gave it, says it doesn't know otherwise, and anything that commits you to a price or a date waits for you.",
    flow: [
      { title: "New lead captured", detail: "Website form, call, or Google", icon: "inbox" },
      { title: "It answers their questions", detail: "Service area, rough price, what you take on", icon: "chat" },
      { title: "It asks yours", detail: "Job type, timeline, budget, ZIP", icon: "filter" },
      { title: "Routed and booked", detail: "Real slots from your calendar", icon: "calendar" },
      { title: "You get the briefing", detail: "Everything they said, before you speak", icon: "document" },
    ],
    outcomeChain: [
      "Answered in under a minute",
      "Qualified before it reaches you",
      "Fewer calls that go nowhere",
    ],
    pricing: {
      build: { from: 1500, to: 2500 },
      monthly: { kind: "flat", amount: 250 },
    },
  },
  {
    slug: "missed-call-text-back",
    name: "Missed-Call Text-Back",
    tier: "add-on",
    category: "ai-automation",
    icon: "phone",
    promise: "Every call you can't pick up gets a text back within seconds.",
    outcome: "A missed call stops being a lost job.",
    forWhom:
      "Anyone whose phone rings while their hands are full — which is most trades.",
    includes: [
      "Automatic text the second a call goes unanswered",
      "The conversation carries on by text, so they never have to call twice",
      "Routes to your calendar or to a person once the job is clear",
      "Works with the business line you already have — no new number to publish",
      "A separate after-hours message you set yourself",
    ],
    timeline: "One week.",
    symptoms: [
      "Your hands are inside a panel. The phone rings twice and stops.",
      "You call back at 5:40. It goes to their voicemail. That's the end of it.",
      "You have no idea how many calls you missed last week.",
      "The ones who do leave a voicemail leave a first name and nothing else.",
    ],
    beforeAfter: [
      {
        before: "A missed call is a lost job",
        after: "A text goes out in seconds asking what they need",
      },
      {
        before: "You call back hours later",
        after: "They've already texted you the job and the address",
      },
      { before: "No record of who called", after: "Every missed call and reply in one thread" },
      {
        before: "After six it goes to voicemail",
        after: "After six they get an answer and a time you'll call",
      },
    ],
    flow: [
      { title: "A call goes unanswered", detail: "Your hands are full. It happens.", icon: "phone" },
      { title: "A text goes out in seconds", detail: "From your business line, not a new number", icon: "send" },
      { title: "They reply with the job", detail: "What they need, and where", icon: "chat" },
      { title: "Routed to you or the calendar", detail: "Once the job is clear enough to book", icon: "calendar" },
    ],
    outcomeChain: [
      "No missed call left cold",
      "A written record of every one",
      "Jobs you used to lose",
    ],
    pricing: {
      build: { from: 800, to: 1200 },
      monthly: { kind: "flat", amount: 100 },
      passThrough: "Twilio messaging usage is billed to you at cost, with no markup.",
    },
  },
  {
    slug: "get-more-google-reviews",
    name: "Get More Google Reviews",
    tier: "add-on",
    category: "get-found",
    icon: "star",
    promise:
      "The review request fires when the job closes, without anyone remembering to send it.",
    outcome:
      "Your review count starts to match the number of jobs you've actually done.",
    forWhom:
      "Businesses with far more finished jobs than reviews, and a competitor outranking them on both.",
    timeline: "One to two weeks.",
    includes: [
      "Triggered by job completion, not by someone's memory",
      "Sent by text or email, with a direct link to your Google profile",
      "One polite follow-up, then it stops",
      "Unhappy customers routed privately to you first, before they post",
      "A simple view of what went out and what came back",
      "A drafted reply to every review, good or bad, for you to approve before it posts",
    ],
    symptoms: [
      "Four hundred finished jobs. Thirty-one reviews.",
      "The guy two towns over has 340, and he's above you on the map.",
      "You mean to ask every time. Then the next job starts.",
      "The only person who asks is whoever remembers — about one customer in fifteen.",
    ],
    beforeAfter: [
      {
        before: "Asking depends on who remembers",
        after: "The ask fires when the job is marked complete",
      },
      {
        before: "The unhappy one posts before you hear about it",
        after: "They route to you privately first, so you can fix it",
      },
      {
        before: "You're 12th in the map pack for your own town",
        after: "Recent reviews lift you where people actually look",
      },
      {
        before: "Someone has to log in and find the link",
        after: "One tap from the text to your review box",
      },
    ],
    flow: [
      { title: "Job marked complete", detail: "From your CRM, your field app, or a text", icon: "check" },
      { title: "Request goes out", detail: "SMS and email, while they're still happy", icon: "send" },
      { title: "Happy? Public. Unhappy?", detail: "Unhappy customers reach you privately first", icon: "shield" },
      { title: "One tap to your review box", detail: "No searching, no login", icon: "link" },
      { title: "Reminder if they forget", detail: "Stops the moment they've left one", icon: "clock" },
      { title: "Replies drafted for every review", detail: "Good or bad. You approve, or edit, then it posts", icon: "reply" },
    ],
    outcomeChain: [
      "More reviews",
      "Better map ranking",
      "More calls from people who trust you",
    ],
    pricing: {
      build: { from: 1200, to: 2000 },
      monthly: { kind: "flat", amount: 100 },
    },
  },
  {
    slug: "get-found-on-google",
    name: "Get Found on Google",
    tier: "add-on",
    category: "get-found",
    icon: "map",
    promise: "Show up in the map pack when someone nearby searches for what you do.",
    outcome:
      "You appear in the three results Google puts above everything else, for the towns you actually drive to.",
    forWhom:
      "Businesses that only come up on Google when someone already knows their name.",
    timeline: "Two weeks to set up. Movement in the map takes two to three months.",
    includes: [
      "Google Business Profile claimed, verified and filled out properly",
      "The right categories, service areas and hours",
      "Photos and posts kept current, because a dead profile ranks like one",
      "Your name, address and phone made identical everywhere they appear",
      "Service and area pages written for the towns you serve",
      "Rank tracking by town, so you can see movement rather than take my word for it",
      "A monthly count of calls and direction requests, and what moved",
    ],
    symptoms: [
      "Someone in the next town searches your trade. Three companies show on the map. You're not one of them.",
      "You come up when people search your business name. That's it.",
      "Your profile still lists the hours from before you changed them, and has one photo.",
      "A directory you never signed up for outranks your own site.",
    ],
    beforeAfter: [
      {
        before: "You show up for your name and nothing else",
        after: "You show up for the job, in the towns you drive to",
      },
      { before: "One photo from 2021", after: "Current photos, hours and services, kept up" },
      {
        before: "Your address reads differently on four websites",
        after: "One address everywhere Google checks",
      },
      {
        before: "No idea whether any of it worked",
        after: "Calls and direction requests, by town, every month",
      },
    ],
    flow: [
      { title: "Profile claimed and filled", detail: "Categories, service areas, hours, photos", icon: "map" },
      { title: "Your details matched everywhere", detail: "The same name, address and phone Google checks", icon: "check" },
      { title: "Pages written for your towns", detail: "The places you actually drive to", icon: "document" },
      { title: "Tracked by town, monthly", detail: "Rank, calls, direction requests", icon: "chart" },
    ],
    outcomeChain: [
      "Visible in the map pack",
      "Calls from the next town over",
      "Proof of which town produced what",
    ],
    pricing: {
      build: { from: 800, to: 1500 },
      monthly: { kind: "flat", amount: 300 },
    },
  },
  {
    slug: "google-ads-management",
    name: "Google Ads Management",
    tier: "add-on",
    category: "get-found",
    icon: "target",
    promise: "Paid search that gets switched off when it stops earning.",
    outcome:
      "A steady flow of people searching for your job right now, with a real cost per booked job attached.",
    forWhom:
      "Businesses that need leads sooner than local SEO can produce them, and have the capacity to take them.",
    timeline: "One to two weeks to build. First real read on the numbers at 30 days.",
    includes: [
      "Built around the jobs you want, not the ones with the most searches",
      "Keyword and negative keyword management — the negatives are where the money is saved",
      "Targeted to the areas you'll actually drive to",
      "Call tracking, so a lead is tied to the ad that produced it",
      "A landing page that matches the ad instead of dropping people on your homepage",
      "A monthly read on cost per lead and cost per booked job",
      "An honest recommendation to stop, if the numbers don't work",
    ],
    symptoms: [
      "You boosted a post once. Nothing came of it. That's your whole experience of paid.",
      "You're paying for clicks from three counties away.",
      "Someone set the account up a year ago and it's been running ever since.",
      "You know what you spent last month. You don't know what a booked job cost you.",
    ],
    beforeAfter: [
      {
        before: "Paying for clicks from outside your area",
        after: "Only the towns you'll actually drive to",
      },
      { before: "Ads point at your homepage", after: "Ads point at the page for that exact job" },
      { before: "You know what you spent", after: "You know what a booked job cost" },
      {
        before: "It runs whether or not it works",
        after: "It gets switched off when it stops earning",
      },
    ],
    notThis:
      "Not a retainer that keeps billing while the campaign loses money. If the cost per booked job doesn't work in your market, I'll tell you, and we stop.",
    flow: [
      { title: "Built around the jobs you want", detail: "Not the ones with the most searches", icon: "target" },
      { title: "Negatives cut the waste", detail: "Where the money is actually saved", icon: "filter" },
      { title: "The ad points at a matching page", detail: "Not your homepage", icon: "link" },
      { title: "Calls tracked back to the ad", detail: "You see which one paid", icon: "phone" },
      { title: "Monthly read, honest call", detail: "Including when to stop", icon: "chart" },
    ],
    outcomeChain: [
      "A known cost per booked job",
      "Spend only where it works",
      "A switch you can turn off",
    ],
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
  },
  {
    slug: "social-content-engine",
    name: "Social Content Engine",
    tier: "add-on",
    category: "get-found",
    icon: "megaphone",
    promise: "Posts drafted from your own jobs and your own prices. You approve them in minutes.",
    outcome:
      "A steady feed that shows your actual work and sounds like you, without you writing anything.",
    forWhom:
      "Owners who know they should post, have the photos on their phone, and are never going to sit down and write the captions.",
    timeline: "One to two weeks.",
    includes: [
      "Drafts built from your real jobs, photos and prices — not industry filler",
      "Written from how you already describe the work",
      "You approve, edit or bin each one in a couple of minutes on your phone",
      "Scheduled automatically once approved",
      "Nothing is ever posted without your approval",
    ],
    symptoms: [
      "Two thousand photos of finished work on your phone. Last post: fourteen months ago.",
      "You open the app to write a caption and close it again.",
      "The one competitor who posts every week is the one customers mention to you.",
      "You've thought about paying someone, then read what they wrote and hated it.",
    ],
    beforeAfter: [
      { before: "You write the caption, or nobody does", after: "Drafts arrive with the photo attached" },
      { before: "Fourteen months since the last post", after: "A post a week that you approved" },
      {
        before: "An agency writes it and it sounds like an agency",
        after: "It's written from how you already talk about the work",
      },
      {
        before: "You'd have to hand someone your account",
        after: "Nothing goes out until you tap approve",
      },
    ],
    notThis:
      "This is not 'we run your social media'. Nobody here is pretending to be you in your comments. It drafts, you approve, it posts — you stay the author.",
    flow: [
      { title: "You finish a job and take photos", detail: "The part you already do", icon: "user" },
      { title: "Drafts come back written", detail: "From your real work and your real prices", icon: "document" },
      { title: "You approve on your phone", detail: "A couple of minutes, not an afternoon", icon: "check" },
      { title: "It posts on schedule", detail: "Nothing goes out unapproved", icon: "send" },
    ],
    outcomeChain: [
      "A feed that stays alive",
      "Work customers can actually see",
      "Still your voice",
    ],
    pricing: {
      build: { from: 600, to: 1000 },
      monthly: { kind: "flat", amount: 200 },
    },
  },
  {
    slug: "custom-ai-automation",
    name: "Custom AI Automation",
    tier: "add-on",
    category: "ai-automation",
    icon: "gears",
    promise: "The repetitive thing eating your week, automated. Scoped on the call.",
    outcome:
      "The task that used to need someone to remember it now happens whether or not anyone does.",
    forWhom:
      "Businesses with one specific, repetitive process none of the packaged services covers — quoting, scheduling, follow-up, paperwork, internal lookups.",
    timeline: "Scoped on the call. Most builds run two to four weeks.",
    includes: [
      "We map the process as it actually runs, not as the manual describes it",
      "A written scope with a fixed price before any work starts",
      "Built against the tools you already use",
      "Guardrails and your approval on anything that commits money or a date",
      "Full logging, so you can audit what it did",
      "Handover documentation, in an account you own",
    ],
    symptoms: [
      "Every Friday you copy the same job details out of one system and into another.",
      "The quote sits in your drafts for three days because you need one number from the office.",
      "The same address gets retyped four times before a job is on the calendar.",
      "There's one task in your week everyone agrees is stupid, and nobody has time to fix it.",
    ],
    beforeAfter: [
      {
        before: "Two hours of copy-and-paste every Friday",
        after: "It runs on its own and logs what it did",
      },
      {
        before: "Nobody can say exactly where the process breaks",
        after: "The whole process is written down before anything is built",
      },
      {
        before: "Fixing it would cost you a week you don't have",
        after: "A fixed scope and a fixed price before work starts",
      },
      {
        before: "Automation nobody can check",
        after: "Every action logged, and anything irreversible asks you first",
      },
    ],
    examples: [
      "Quote to invoice: an approved estimate becomes an invoice without anyone retyping it",
      "Intake forms landing straight in your CRM or your spreadsheet",
      "Estimates drafted from your own pricing and past jobs, for you to approve",
      "An internal assistant that answers your team's questions out of your own documents",
    ],
    notThis:
      "If the honest answer is that a process shouldn't be automated — too rare, too high-stakes, or just broken and needing fixing first — that's the answer you get.",
    flow: [
      { title: "We map what actually happens", detail: "Not what the manual says happens", icon: "search" },
      { title: "Fixed scope, fixed price", detail: "Written down before any work starts", icon: "document" },
      { title: "Built into the tools you use", detail: "No new system for anyone to learn", icon: "gears" },
      { title: "Guardrails on anything irreversible", detail: "It asks you first", icon: "shield" },
      { title: "Everything logged", detail: "You can audit exactly what it did", icon: "chart" },
    ],
    outcomeChain: [
      "A week that runs itself",
      "An audit trail",
      "Nothing that commits you without asking",
    ],
    pricing: {
      build: { from: 1500, to: null },
    },
  },
];

/** Lookup by slug. Returns undefined for an unknown slug — callers decide. */
export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

/** The entry product. The homepage renders this as the primary card. */
export const primaryService: Service = services.find(
  (service) => service.tier === "primary",
)!;

/** The add-ons, in catalogue order. */
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
