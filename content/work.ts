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
  summary: string;
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
    slug: "john-savoretti-realty",
    status: "launched",
    client: "John Savoretti Realty",
    location: "Long Island, NY",
    // TODO: confirm launch date. AGENCY_SITE_COPY.md (2026-09-20) lists the
    // Savoretti launch as "targeted this week" — confirm it actually shipped
    // before this entry goes on a public page. See CONTENT_TODO.md.
    launchedAt: "TODO: confirm launch date",
    summary:
      "A residential brokerage site built around live listings rather than a contact form. The MLS/IDX pipeline pulls current inventory straight onto the site, so the listings visitors see are the listings that exist.",
    built: [
      "Custom Next.js build",
      "Live MLS/IDX listing pipeline",
      "Area pages for the towns he sells in",
    ],
    // TODO: real screenshots with real alt text. See CONTENT_TODO.md.
    images: [],
  },
  {
    slug: "above-all-tent-rentals",
    status: "launched",
    client: "Above All Tent Rentals",
    location: "Saint James, NY",
    // TODO: confirm launch date.
    launchedAt: "TODO: confirm launch date",
    summary:
      "A mobile-first rebuild for an event rental company whose customers are almost all on a phone, planning around a date. The quote request flow asks for the date and the site first, so a usable enquiry arrives instead of a name and a number.",
    built: [
      "Custom site",
      "Mobile-first rebuild",
      "Quote request flow",
    ],
    images: [],
  },
  {
    slug: "gc-kuts",
    status: "launched",
    client: "GC Kuts",
    location: "Smithtown, NY",
    // TODO: confirm launch date.
    launchedAt: "TODO: confirm launch date",
    summary:
      "A barbershop site whose job is to get someone into a chair. Booksy booking is integrated directly, so a customer books in place rather than being handed off to a platform and losing interest on the way.",
    built: [
      "Custom site",
      "Booksy booking integration",
    ],
    images: [],
  },
];

/** Lookup by slug. Returns undefined for an unknown slug — callers decide. */
export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}
