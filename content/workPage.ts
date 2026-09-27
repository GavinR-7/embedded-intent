/**
 * Static labels for /work and /work/[slug].
 *
 * The per-case content comes from `content/work.ts` — this is the furniture
 * around it.
 *
 * Note what is *not* here: there is no "results coming soon", no placeholder
 * metric label, no empty results table heading. A case study with no measured
 * results renders no results section at all, and the union in
 * `content/work.ts` is what guarantees there is nothing to render.
 */
export const workPage = {
  /*
   * Evergreen: no counts anywhere. "One site" and "three case studies" both
   * go stale the moment the list changes, and a count in copy is the kind of
   * thing nobody remembers to update.
   */
  indexEyebrow: "Our work",
  indexHeading: "Built, launched, and still running.",
  indexBody:
    "Every site here is live and used by a real business. Results are published once they've been measured, not before.",

  backLabel: "All work",
  detailEyebrow: "Case study",

  problemHeading: "The problem",
  builtHeading: "What was built",

  /** The live site. Stated as an invitation, not a nav label. */
  liveLabel: "Visit the live site",
  liveNote: "Opens the real thing, in a new tab. Try it on your phone.",

  /*
   * Deliberately NOT "What improved" or "The results". Every pair under this
   * heading is a thing that was built — see the `changed` field in
   * content/work.ts for why that distinction is enforced by the type and not
   * just by the copy.
   */
  changedEyebrow: "What changed",
  changedHeading: "The old site, and what replaced it.",
  changedNote:
    "Changes to the site itself, not outcomes. What these did to the business is being measured now, and goes up when it exists.",
  changedBeforeLabel: "Before",
  changedAfterLabel: "After",

  shotsEyebrow: "The site",
  shotsHeading: "On a laptop, and in a hand.",

  resultsEyebrow: "Measured",
  resultsHeading: "What changed, and how we know.",
  metricLabel: "Metric",
  beforeLabel: "Before",
  afterLabel: "After",
  /** Every measured number states how it was measured. No exceptions. */
  sourceLabel: "How it was measured",

  testimonialEyebrow: "In their words",

  closeEyebrow: "Next step",
  closeHeading: "Want to know what yours would take?",
  closeBody:
    "Tell us about your business. We'll look at how leads reach you and what happens to the ones that arrive after hours, then email you what to fix first and what it costs.",
} as const;
