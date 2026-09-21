/**
 * The audit offer.
 *
 * Its own module because it is used in two places that are not otherwise
 * related: the homepage close (Phase 3) and the contact page (Phase 6). Living
 * here means the promise made on the homepage and the one made on the form
 * cannot drift apart.
 *
 * The audit is free and it is a form, not a calendar booking. There is no
 * scheduler anywhere on this site — the research between the submission and
 * the reply is the product.
 */
export const audit = {
  /**
   * The anti-sell. Naming what this is not buys more credibility than another
   * claim would, and it stops anyone arriving braced for a pitch.
   */
  isNot: [
    "Not a demo of software you've never heard of.",
    "Not a 45-minute discovery script.",
    "Not a proposal you have to sign in the room.",
  ],
} as const;
