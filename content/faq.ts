/**
 * The objections, answered.
 *
 * These are the things a service-business owner is actually thinking and
 * mostly will not say out loud. Answer them straight — the anti-sell buys more
 * credibility than another claim would.
 *
 * `services` tags which service pages an entry also belongs on, so Phase 4 can
 * render a relevant subset instead of the whole list. An empty array means the
 * question is general and appears only on the homepage FAQ.
 *
 * Deliberately no prices in the answers. The pricing section is the one place
 * numbers live; repeating them here creates a second copy to keep in sync, and
 * the one that goes stale is always the one in the FAQ.
 */

import type { ServiceSlug } from "./services";

export type FaqItem = {
  /** Stable id — used as the anchor and the React key. Do not renumber. */
  id: string;
  question: string;
  /** Plain text. Kept to a few sentences; an FAQ that rambles is not read. */
  answer: string;
  /** Service pages this question also belongs on. */
  services: readonly ServiceSlug[];
};

/*
 * `as const satisfies` rather than a `: readonly FaqItem[]` annotation.
 *
 * The annotation would widen every `id` to `string`, and `FaqId` below —
 * the union of the real ids, which `content/categories.ts` uses to pick the
 * questions for a category page — would collapse to `string`. A typo would
 * then compile and render an empty FAQ section.
 *
 * `satisfies` keeps the shape checked against `FaqItem` (a missing `answer`
 * is still an error) while `as const` keeps the literal types. The two
 * together are the only way to get both.
 */
export const faqs = [
  {
    id: "buy-everything-at-once",
    question: "Do I have to buy everything at once?",
    answer:
      "No, and almost nobody does. Most people start with the website, because it is the thing every other piece plugs into, and add one automation later — usually once the site is bringing in more leads than anyone can answer. If your site already works, we skip it and start with the automation instead.",
    services: [],
  },
  {
    id: "already-have-a-website",
    question: "I already have a website.",
    answer:
      "Then the first job is working out whether it is the problem. Often it is not: the site is fine and the leads are dying after they arrive, which is an automation job, not a rebuild. The audit tells you which one you have. If the site is the problem, you will see exactly why — how long it takes to open on a phone, where people leave, and what a thumb cannot reach. And if the bones are fine, a refresh costs a fraction of a rebuild.",
    services: ["website-design-build", "website-refresh"],
  },
  {
    id: "how-long",
    question: "How long does it take?",
    answer:
      "Most sites launch in two to four weeks, depending on how quickly we get your content — photos and copy coming back is almost always the long pole, not the build. A single automation is usually one to two weeks. We don't estimate your date as a range: we commit to an exact launch date once we've seen what we're working with, and you get an update every week whether or not there is good news.",
    services: ["website-design-build", "online-booking-setup", "quote-price-calculator"],
  },
  {
    id: "who-owns-the-accounts",
    question: "Who owns the accounts?",
    answer:
      "You do. Every account — domain, hosting, Google Business Profile, the AI platform, the ad account, the phone number — is created in your name with you as the owner, and you get the credentials. If you stop working with us tomorrow, everything keeps running and you can hand it to anyone. Nothing is hostage to the relationship.",
    services: ["get-found-on-google", "google-ads-management", "online-booking-setup"],
  },
  {
    id: "works-with-my-crm",
    question: "Does it work with my CRM?",
    answer:
      "Usually. The common ones in the trades are built to connect to other tools, and most of what we do is read a job and write back a status. Before you pay for anything, we check yours specifically and tell you what will connect cleanly, what needs a workaround, and what is not worth doing. If the honest answer is that your CRM makes this more trouble than it is worth, you get that answer.",
    services: [
      "ai-lead-response",
      "get-more-google-reviews",
      "custom-ai-automation",
      "quote-price-calculator",
    ],
  },
  {
    id: "what-does-it-cost",
    question: "What does it actually cost?",
    answer:
      "Every service page lists its own price — you should not have to book a call to find out whether you can afford someone. Websites are a one-time build plus site care. Automations are a build cost plus a monthly, because they keep running. You buy them one at a time, in whatever order makes you money soonest. The audit itself is free, with no obligation attached to it.",
    services: [],
  },
  {
    id: "will-ai-replace-my-people",
    question: "Will AI replace my people?",
    answer:
      "For most of our clients there is nobody to replace — it is the owner answering texts after dinner, and that is the part that goes. If you do have a team, the honest version is that it removes the repetitive slice of their day, not the job: the twentieth person asking your hours, the review request nobody remembered. What it buys you is more volume without hiring for it. If you are hoping to cut staff, we are the wrong people to call.",
    services: ["ai-lead-response", "custom-ai-automation", "social-content-engine"],
  },
  {
    id: "when-the-ai-gets-it-wrong",
    question: "What happens when the AI gets something wrong?",
    answer:
      "It will, eventually, so it is built on that assumption. It answers only from what you gave it. It hands off to a person when it is unsure or when the customer asks for one. Anything that commits you to a price or a date can require your approval first. And every conversation is logged in full, so when something goes wrong you can read exactly what was said, and we change the rule rather than guess.",
    services: [
      "ai-lead-response",
      "missed-call-text-back",
      "custom-ai-automation",
      "social-content-engine",
    ],
  },
] as const satisfies readonly FaqItem[];

/**
 * The questions worth answering on a given service page.
 *
 * `.some()` rather than `.includes()`. Now that `faqs` is `as const`, each
 * entry's `services` is a readonly tuple of literal types — and `includes` on
 * one of those only accepts a value assignable to its element type. For the two
 * general questions, whose `services` is `readonly []`, that element type is
 * `never`, so `includes(slug)` does not compile. Comparing each element is the
 * same check without the narrowing.
 */
export function faqsForService(slug: ServiceSlug): readonly FaqItem[] {
  return faqs.filter((faq) => faq.services.some((tagged) => tagged === slug));
}

/**
 * The id of a real FAQ entry.
 *
 * Derived from the data, so it cannot drift from it. `content/categories.ts`
 * uses this to name the questions that belong on a category page: delete or
 * rename a question here and every page that referenced it fails to compile,
 * which is the whole reason the ids are stable and are never renumbered.
 */
export type FaqId = (typeof faqs)[number]["id"];

/**
 * The named questions, in the order they were named.
 *
 * Not `faqs.filter(...)` — that would return them in catalogue order and
 * silently drop an id that matched nothing. A category page states which
 * questions it wants and in which order, so that order is what it gets.
 */
export function faqsByIds(ids: readonly FaqId[]): readonly FaqItem[] {
  return ids.map((id) => {
    const item = faqs.find((faq) => faq.id === id);

    // Unreachable while `ids` is typed `FaqId[]`. It is here so that if
    // someone widens that type later, the failure is loud at build time
    // rather than a section that renders one fewer question than intended.
    if (!item) throw new Error(`No FAQ with id "${id}"`);

    return item;
  });
}
