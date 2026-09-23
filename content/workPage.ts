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
    "Thirty minutes on where your leads are actually leaking, and an honest answer about what to build first.",
} as const;
