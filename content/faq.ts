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

export const faqs: readonly FaqItem[] = [
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
      "Then the first job is working out whether it is the problem. Often it is not: the site is fine and the leads are dying after they arrive, which is an automation job, not a rebuild. The audit tells you which one you have. If the site is the problem, you will see exactly why — how long it takes to open on a phone, where people leave, and what a thumb cannot reach.",
    services: ["website-design-build"],
  },
  {
    id: "how-long",
    question: "How long does it take?",
    answer:
      "A website is typically three to six weeks from kickoff. The long pole is almost always content and photos coming back, not the build. A single automation is usually one to two weeks. We agree the date before anything starts, and you get an update every week whether or not there is good news.",
    services: ["website-design-build"],
  },
  {
    id: "who-owns-the-accounts",
    question: "Who owns the accounts?",
    answer:
      "You do. Every account — domain, hosting, Google Business Profile, the AI platform, the phone number — is created in your name with you as the owner, and you get the credentials. If you stop working with me tomorrow, everything keeps running and you can hand it to anyone. Nothing is hostage to the relationship.",
    services: [],
  },
  {
    id: "works-with-my-crm",
    question: "Does it work with my CRM?",
    answer:
      "Usually. The common ones in the trades are built to connect to other tools, and most of what we do is read a job and write back a status. Before you pay for anything, I check yours specifically and tell you what will connect cleanly, what needs a workaround, and what is not worth doing. If the honest answer is that your CRM makes this more trouble than it is worth, you get that answer.",
    services: ["ai-lead-response", "review-automation", "internal-ai-assistant"],
  },
  {
    id: "what-does-it-cost",
    question: "What does it actually cost?",
    answer:
      "The prices are on this page — you should not have to book a call to find out whether you can afford someone. Websites are a one-time build. Automations are a build cost plus a monthly, because they keep running. The audit is paid, and it comes off whatever you build afterwards.",
    services: [],
  },
  {
    id: "will-ai-replace-my-people",
    question: "Will AI replace my people?",
    answer:
      "For most of my clients there is nobody to replace — it is the owner answering texts after dinner, and that is the part that goes. If you do have a team, the honest version is that it removes the repetitive slice of their day, not the job: the twentieth person asking your hours, the review request nobody remembered. What it buys you is more volume without hiring for it. If you are hoping to cut staff, I am the wrong person to call.",
    services: ["ai-lead-response", "internal-ai-assistant"],
  },
  {
    id: "when-the-ai-gets-it-wrong",
    question: "What happens when the AI gets something wrong?",
    answer:
      "It will, eventually, so it is built on that assumption. It answers only from what you gave it. It hands off to a person when it is unsure or when the customer asks for one. Anything that commits you to a price or a date can require your approval first. And every conversation is logged in full, so when something goes wrong you can read exactly what was said, and we change the rule rather than guess.",
    services: ["ai-lead-response", "missed-call-text-back", "internal-ai-assistant"],
  },
];

/** The questions worth answering on a given service page. */
export function faqsForService(slug: ServiceSlug): readonly FaqItem[] {
  return faqs.filter((faq) => faq.services.includes(slug));
}
