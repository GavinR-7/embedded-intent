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

import type { BeforeAfter } from "./primitives";

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

/**
 * A device-framed capture of the live site.
 *
 * `frame` decides what is drawn around it: `browser` gets the chrome of a
 * desktop window, `phone` gets a handset. Both frames are HTML and CSS in the
 * site's own tokens — see components/work/DeviceFrame.tsx — so what is stored
 * here is the screen content only, with no fake chrome baked into the pixels.
 * That is why the captures are viewport-sized rather than full-page: the frame
 * is a screen, and a screen shows one screenful.
 */
export type CaseStudyImage = {
  src: string;
  alt: string;
  frame: "browser" | "phone";
  /** Intrinsic pixel size of the file, so next/image reserves the right box. */
  width: number;
  height: number;
};

export type CaseStudyBase = {
  slug: string;
  client: string;
  location: string;
  /**
   * The live site.
   *
   * The most persuasive thing a case study has is the thing itself, working, on
   * the reader's own phone. Absolute and external, so the component knows to
   * open it in a new tab with `rel="noopener"`.
   */
  liveUrl: string;
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
  /**
   * What changed about the site, as before and after.
   *
   * ---------------------------------------------------------------------------
   * THESE ARE NOT RESULTS. Every pair describes something that was BUILT — a
   * thing the old site did not do and the new one does. No traffic, no calls, no
   * conversion rate, no "faster" without a measurement behind it.
   *
   * That distinction is the whole reason this field is separate from `results`,
   * which only exists on the `measured` variant of the union. A launched case
   * study can honestly say "the quote form now asks for the event date" on the
   * day it ships. It cannot say anything about what that changed until somebody
   * has measured it.
   * ---------------------------------------------------------------------------
   */
  changed: BeforeAfter[];
  images: CaseStudyImage[];
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
    liveUrl: "https://abovealltents.com",
    /** ISO 8601. Display formatting happens at render, never in the data. */
    launchedAt: "2026-08-20",
    /*
     * "the date and the guest count", not "the date and the site".
     *
     * The earlier wording said the quote flow captured the event LOCATION. It
     * does not — checked against the live form, whose fields are name, phone,
     * email, event date, estimated guests, occasion and what they are interested
     * in. Close enough to true to survive a year unnoticed, which is exactly the
     * kind of claim this repo is built to refuse.
     */
    summary:
      "A mobile-first rebuild for a Long Island event rental company, built around a quote request that asks for the date and the guest count first — so a usable inquiry arrives instead of a name and a number.",
    problem:
      "Tent rental is a deadline purchase, researched on a phone, usually at night. By the time someone is looking they already know their date and roughly how many people they need to cover; what they want is to find out quickly whether you are free and what it will cost. Anything that makes them wait until business hours for that answer is the point where most of them stop looking and start calling somebody else.",
    built: [
      "Custom site, built mobile-first",
      "Rebuilt from the ground up rather than restyled",
      "Quote request flow that captures event date, guest count and occasion up front",
      "Call and Get a quote bar pinned to the bottom of the screen on phones",
    ],
    /*
     * Every pair below is a thing that exists on the live site and can be
     * checked by opening it. Nothing here is an outcome.
     */
    changed: [
      {
        before: "Built for a desktop browser, shrunk down for phones",
        after: "Designed for a phone first, since that is where the research happens",
      },
      {
        before: "A contact form asking for a name and a message",
        after: "A quote request asking for the event date, guest count and occasion",
      },
      {
        before: "What they rent, described in paragraphs",
        after: "Tents, inflatables, tables and chairs pickable as options in the request",
      },
      {
        before: "Calling meant finding the number in the header",
        after: "Call and Get a quote sit in a bar pinned to the bottom of every phone screen",
      },
      {
        before: "Hours and service area buried on a contact page",
        after: "Both stated where someone deciding whether to call will see them",
      },
    ],
    /*
     * Captured from the live site at 1440x900 and 390x844, at the device pixel
     * ratio each size would really have, with the scrollbars hidden — they go
     * inside frames drawn in CSS, and a real scrollbar inside a drawn browser
     * window reads as a mistake. JPEG, because every one of them is mostly a
     * photograph of a lawn.
     *
     * Alt text describes what is actually in each frame. It is read by someone
     * who cannot see the screenshot, so "site screenshot" would tell them
     * nothing, and it is the only part of this that a caption cannot carry.
     */
    images: [
      {
        src: "/work/above-all-tent-rentals/homepage-desktop.jpg",
        alt: "The Above All Tent Rental homepage on a desktop browser: a photograph of a bounce house and a water slide set up on a lawn beside the water, headed \u201cWe\u2019ve Got You Covered!\u201d, with Get a quote and Call 631-265-TENT buttons side by side.",
        frame: "browser",
        width: 1440,
        height: 900,
      },
      {
        src: "/work/above-all-tent-rentals/homepage-phone.jpg",
        alt: "The same homepage on a phone, with the navigation collapsed to a menu button and the quote and call buttons stacked within thumb reach.",
        frame: "phone",
        width: 1170,
        height: 2532,
      },
      {
        src: "/work/above-all-tent-rentals/quote-request-phone.jpg",
        alt: "The quote request form on a phone, asking for phone, email, event date, estimated guests and the occasion, then what they are interested in as pickable options \u2014 tent, inflatables, mechanical bull, tables and chairs, linens, decor and lighting \u2014 with Call and Get a quote pinned to the bottom of the screen.",
        frame: "phone",
        width: 1170,
        height: 2532,
      },
    ],
    // No `testimonial` field: there is no quote yet. Omitted, not invented.
  },
];

/** Lookup by slug. Returns undefined for an unknown slug — callers decide. */
export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}

/**
 * "2026-08-20" -> "August 2026".
 *
 * Parsed by hand rather than with `new Date(iso)`. `new Date("2026-08-20")`
 * is treated as UTC midnight, so formatting it in a timezone behind UTC —
 * which includes every US timezone — renders the *previous* day, and a launch
 * date can silently slide into the wrong month.
 */
export function formatLaunchMonth(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${MONTHS[month - 1]} ${year}`;
}

/**
 * The line shown for a launched case study, in one place because it appears
 * both on the homepage work section and beside the closing CTA.
 *
 * It says results are in progress rather than showing a number, and there is
 * no placeholder metric behind it — the type makes sure of that.
 */
export function launchedStatusLine(launchedAt: string): string {
  return `Launched ${formatLaunchMonth(launchedAt)} — results tracking in progress`;
}
