/**
 * Static labels for /faq.
 *
 * The questions themselves are `content/faq.ts` and are not repeated here — the
 * page, the homepage FAQ section, every category page, every service page and
 * the FAQPage structured data all read that one list. There is no second copy
 * of an answer anywhere on this site, which is the only way the answer a crawler
 * sees can be guaranteed to be the answer a reader sees.
 */
export const faqPage = {
  eyebrow: "FAQ",
  heading: "The things people actually ask.",
  sub: "Mostly the awkward ones. If something you want to know isn't here, ask us directly — the answer will be the same either way.",
  /** Sits above the jump links. */
  jumpLabel: "Jump to",
  closeEyebrow: "Still deciding",
  closeHeading: "Ask us the one that isn't here.",
  closeBody:
    "The audit is free and there is nothing attached to it. If the honest answer is that you don't need us yet, that is the answer you'll get.",
} as const;
