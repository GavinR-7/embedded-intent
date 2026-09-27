/**
 * Copy for /company.
 *
 * The page exists because the Company tab used to point at `/#how-it-works`,
 * which meant every route into "who are these people" landed back on the
 * homepage and scrolled. What a prospect actually wants at that point is the
 * one thing this business has that an agency does not: a named person who will
 * be doing the work.
 *
 * The founder's paragraph is NOT here — it is `site.owner.bio`, because the
 * owner is already a single source of truth for the two other places the site
 * names a person, and a bio in a second file is a bio that gets edited in one
 * of them.
 *
 * Nothing on this page is a claim that needs sourcing. No years in business, no
 * client counts, no "trusted by" line. If one of those becomes true and
 * measurable it can be added; until then the page says what the work is and who
 * does it, which is enough.
 */
export const companyPage = {
  eyebrow: "Company",
  heading: "Built into how you already work.",
  sub: "Most agencies hand you a website and a login. We build the site, the follow-up and the automation as one system — and you deal with the person who built it, not an account manager between you and them.",

  founderEyebrow: "Who you'll be working with",

  principlesEyebrow: "How we work",
  principlesHeading: "Four things that don't change.",
  /*
   * Rendered from `home.whyMe.rows`, not written again here. Those rows are the
   * comparison table on the homepage — the same four commitments, stated as
   * "typical agency vs us". This page shows our side of them as principles.
   */
  principlesNote:
    "These are the parts of the arrangement we will not negotiate, because they are the reasons to hire someone like us instead of an agency.",

  workEyebrow: "Recent work",
  workHeading: "One site, told properly.",
  workBody:
    "Results go up once they have been measured, not before — so there is less here than there could be, and what is here is true.",
  workCta: "See the work",

  closeEyebrow: "Next step",
  closeHeading: "Start with the audit.",
  closeBody:
    "Tell us what's going on. We'll look at your website, your Google listing and your reviews, and send back what we'd fix first — whether or not you hire us.",
} as const;
