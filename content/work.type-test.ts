/**
 * Compile-time tests for the CaseStudy union. No runtime code, nothing
 * imports this — it exists so `next build` fails if the guarantee in
 * content/work.ts is ever weakened.
 *
 * How the guard works: each `@ts-expect-error` below asserts that the line
 * after it DOES fail to compile. If someone "helpfully" adds an optional
 * `results?` to CaseStudyBase, these lines start compiling cleanly, the
 * expectation goes unused, and TypeScript raises
 * "Unused '@ts-expect-error' directive" — so the build breaks either way.
 *
 * That is the trick worth remembering: @ts-expect-error is not a suppression,
 * it is an assertion that an error exists.
 */

import type { CaseStudy } from "./work";

// A results block on a case study that has not been measured. This is the one
// that matters: it is how a fabricated performance number would reach the site.
const resultsOnLaunched: CaseStudy = {
  slug: "type-test",
  status: "launched",
  client: "Type Test",
  location: "Nowhere",
  summary: "Adding results to a launched case study must not compile.",
  problem: "Type-test fixture.",
  built: [],
  images: [],
  launchedAt: "2026-01-01",
  // @ts-expect-error — `launched` has no `results` field, by design.
  results: [{ metric: "Leads", before: "2", after: "10", source: "invented" }],
};

// The mirror image: a launch date on a measured entry.
const launchedAtOnMeasured: CaseStudy = {
  slug: "type-test",
  status: "measured",
  client: "Type Test",
  location: "Nowhere",
  summary: "Measured entries carry results, not a launch date.",
  problem: "Type-test fixture.",
  built: [],
  images: [],
  results: [
    {
      metric: "Mobile PageSpeed",
      before: "41",
      after: "96",
      source: "PageSpeed Insights, mobile",
    },
  ],
  // @ts-expect-error — `measured` has no `launchedAt` field.
  launchedAt: "2026-01-01",
};

// A result without a source. `source` is required precisely so that a number
// cannot be published without saying where it came from.
const resultWithoutSource: CaseStudy = {
  slug: "type-test",
  status: "measured",
  client: "Type Test",
  location: "Nowhere",
  summary: "Every measured result must state how it was measured.",
  problem: "Type-test fixture.",
  built: [],
  images: [],
  // @ts-expect-error — missing required `source`.
  results: [{ metric: "Mobile PageSpeed", before: "41", after: "96" }],
};

// Positive control: a correct measured entry must still compile. Without this,
// the tests above would pass even if the type became impossible to satisfy.
const validMeasured: CaseStudy = {
  slug: "type-test",
  status: "measured",
  client: "Type Test",
  location: "Nowhere",
  summary: "This shape is legal and must stay legal.",
  problem: "Type-test fixture.",
  built: ["A thing that was built"],
  images: [],
  results: [
    {
      metric: "Mobile PageSpeed",
      before: "41",
      after: "96",
      source: "PageSpeed Insights, mobile, 2026-09-21",
    },
  ],
};

// Reference them so `noUnusedLocals` stays satisfied if it is ever enabled.
export const __typeTests = [
  resultsOnLaunched,
  launchedAtOnMeasured,
  resultWithoutSource,
  validMeasured,
];
