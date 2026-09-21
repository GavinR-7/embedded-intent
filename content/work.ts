/**
 * Case studies.
 *
 * The important file. Read the type before adding an entry.
 *
 * `CaseStudy` is a discriminated union on `status`. The `launched` variant has
 * no `results` field at all, so TypeScript refuses to compile a results block
 * onto a case study that has not been measured. That is the entire point:
 * the site cannot display a performance number that was never recorded, even
 * by accident, even at 1am before a launch.
 *
 * DO NOT "fix" this by adding an optional `results?` to CaseStudyBase. That
 * makes the compiler stop caring, which is the one thing it is here to do.
 * content/work.type-test.ts fails the build if anyone tries.
 *
 * Moving an entry from `launched` to `measured` requires, per result: a real
 * before number, a real after number, and a stated source describing how it
 * was measured. `source` has no default for the same reason.
 *
 * There is exactly one entry, and that is correct — it is the one site that is
 * actually live. A single case told properly beats three thin ones, and two of
 * those three would not have been true. CONTENT_TODO.md tracks the two builds
 * waiting to be added if and when they genuinely launch.
 */

export type MeasuredResult = {
  /** What was measured: "Mobile PageSpeed" */
  metric: string;
  /** The number before the work: "41" */
  before: string;
  /** The number after: "96" */
  after: string;
  /**
   * How it was measured, specifically enough that someone could repeat it.
   * Required, no default. "PageSpeed Insights, mobile, 2026-09-14" — not
   * "internal tracking".
   */
  source: string;
};

export type CaseStudyBase = {
  slug: string;
  client: string;
  location: string;
  /** One or two sentences. Used on cards and in metadata. */
  summary: string;
  /**
   * The situation the work was built to address, written as a scene. This is
   * what gives a case study depth — a list of deliverables is a receipt, not a
   * story. Keep it to what is genuinely known: the category and the job to be
   * done are fair game, invented client history is not.
   */
  problem: string;
  /** What was actually built. Deliverables, not adjectives. */
  built: string[];
  images: { src: string; alt: string }[];
  /** Omit entirely where there isn't one. Never write it on a client's behalf. */
  testimonial?: { quote: string; attribution: string };
};

export type CaseStudy =
  | (CaseStudyBase & { status: "measured"; results: MeasuredResult[] })
  | (CaseStudyBase & { status: "launched"; launchedAt: string });

export const caseStudies: CaseStudy[] = [
  {
    slug: "above-all-tent-rentals",
    status: "launched",
    client: "Above All Tent Rentals",
    location: "Saint James, NY",
    /** ISO 8601. Display formatting happens at render, never in the data. */
    launchedAt: "2026-08-20",
    summary:
      "A mobile-first rebuild for a Long Island event rental company, built around a quote request that asks for the date and the site first — so a usable enquiry arrives instead of a name and a number.",
    problem:
      "Tent rental is a deadline purchase, researched on a phone, usually at night. By the time someone is looking they already know their date and roughly how many people they need to cover; what they want is to find out quickly whether you are free and what it will cost. Anything that makes them wait until business hours for that answer is the point where most of them stop looking and start calling somebody else.",
    built: [
      "Custom site, built mobile-first",
      "Rebuilt from the ground up rather than restyled",
      "Quote request flow that captures event date, location and guest count up front",
    ],
    // TODO: real screenshots with real alt text — see CONTENT_TODO.md.
    images: [],
    // No `testimonial` field: there is no quote yet. Omitted, not invented.
  },
];

/** Lookup by slug. Returns undefined for an unknown slug — callers decide. */
export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}
