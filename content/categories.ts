/**
 * The three service categories, and the pages behind them.
 *
 * A category is not a label any more. It is a route (`/websites`,
 * `/get-found`, `/ai-automation`), a nav tab, a mega-menu column and a landing
 * page — all driven from the one entry below.
 *
 * `CategorySlug` is defined here rather than in `services.ts` on purpose, and
 * `services.ts` imports it. That is what makes a service's `category` field
 * reference a real category: a typo, or a category that was renamed here and
 * not there, is a compile error instead of a service that silently disappears
 * from both the nav and its own landing page.
 *
 * ---------------------------------------------------------------------------
 * WRITING RULES — the same ones at the top of `content/services.ts`. Read them
 * before editing `symptoms` or `beforeAfter`.
 *
 * The difference is altitude, not voice. A service's symptoms are about that
 * one service ("your booking page"); a category's are about the whole problem
 * area ("being found at all"). If a category symptom could sit unchanged on a
 * single service page, it is pitched too low — that is the test.
 * ---------------------------------------------------------------------------
 */

import type { IconName } from "@/components/ui/icons";
import type { HeroTextureName } from "@/components/ui/HeroTexture";

import type { FaqId } from "./faq";
import type { AtLeastThree, BeforeAfter } from "./primitives";

export type CategorySlug = "websites" | "get-found" | "ai-automation";

export type Category = {
  slug: CategorySlug;
  /** Nav tab and mega-menu heading. Short — it sits in a row of five. */
  label: string;
  /** Eyebrow above the page H1. */
  eyebrow: string;
  /** The page H1. */
  heading: string;
  /** The lead paragraph under the H1. */
  sub: string;
  /**
   * The texture behind this category's hero band, and behind the hero of every
   * service page in it.
   *
   * Here rather than on the route, so a service page cannot pick a different
   * texture from its own category: it reads this field through
   * `getCategory(service.category)`. See components/ui/HeroTexture.tsx for what
   * each name draws. The homepage is not a category and keeps `circuit`.
   */
  texture: HeroTextureName;
  /**
   * The category's icon, from the shared set.
   *
   * On the data rather than chosen at the call site, because more than one place
   * now needs it — the 404 page's three shortcuts today, and anything else that
   * lists categories tomorrow. A component picking an icon from a slug with a
   * ternary is a mapping that exists in one file and has to be repeated in the
   * next.
   */
  icon: IconName;
  /** What is going wrong in his week, at category altitude. Minimum three. */
  symptoms: AtLeastThree<string>;
  /** The same business with this whole area fixed. Minimum three. */
  beforeAfter: AtLeastThree<BeforeAfter>;
  /**
   * Which FAQ entries belong on this page, by id.
   *
   * Curated rather than derived from the service tags. Deriving would put
   * every question tagged to any service in the category on the page, in
   * catalogue order, which is not the same as the three or four questions
   * someone weighing up this *area* of work actually has. `FaqId` is a union
   * of the real ids, so a renamed or deleted question fails the build here
   * instead of quietly rendering nothing.
   */
  faqIds: readonly FaqId[];
};

export const categories: readonly Category[] = [
  {
    slug: "websites",
    label: "Websites",
    eyebrow: "Websites",
    heading: "A website that brings in work, not just one that looks right.",
    sub: "A site is not a brochure. It is the thing standing between someone searching for what you do and someone booked in your calendar. These are the pieces that make it do that job.",
    // A page, drawn before it is built: the dot grid and the crosshairs at the
    // majors are the same lattice the x-ray lens in the hero measures.
    texture: "blueprint",
    icon: "browser",
    symptoms: [
      "Someone asks for your website and you send them your Facebook page instead.",
      "It opens in six seconds on a phone. They're back on Google before it finishes.",
      "You answer the same four questions on every call — hours, area, price, how soon — because the site answers none of them.",
      "It's 9:15pm and someone wants to book you. There is no way to do that except call you tomorrow.",
    ],
    beforeAfter: [
      { before: "The site is a brochure", after: "The site is where the job gets booked" },
      {
        before: "Every price question comes in by phone",
        after: "The range is on the page before they call",
      },
      {
        before: "Booking means catching you between jobs",
        after: "They book at 11pm and you see it with your coffee",
      },
      {
        before: "Changing a price means finding the old developer",
        after: "You text us, or you change it yourself",
      },
    ],
    faqIds: [
      "already-have-a-website",
      "how-long",
      "who-owns-the-accounts",
      "what-does-it-cost",
    ],
  },

  {
    slug: "get-found",
    label: "Get found",
    eyebrow: "Get found",
    heading: "Be the business they find first.",
    sub: "Nobody scrolls. They call one of the first three names they see, and the one they pick is usually the one with the most reviews. This is the work that puts you in that set.",
    // Territory. Contour lines are a map of somewhere without being a map of
    // anywhere — which is the whole problem this category is about.
    texture: "contour",
    icon: "map",
    symptoms: [
      "You've done four hundred jobs and have thirty-one Google reviews. The guy with nine is above you on the map.",
      "You're 12th in the map pack for the thing you do best, in the town you live in.",
      "You spent $600 on ads last month and can't name one job that came from it.",
      "Someone searched your trade and your town at 7am. They called the three names that came up. You weren't one of them.",
    ],
    beforeAfter: [
      {
        before: "You ask for reviews when you remember",
        after: "The ask goes out when the job is marked done",
      },
      { before: "Page two of the map pack", after: "In the three results people call" },
      {
        before: "Ad spend you can't trace to a job",
        after: "Cost per booked job, per campaign, every month",
      },
      {
        before: "Nothing posted since last spring",
        after: "Posts drafted from your own jobs, approved in minutes",
      },
    ],
    faqIds: ["who-owns-the-accounts", "works-with-my-crm", "what-does-it-cost"],
  },

  {
    slug: "ai-automation",
    label: "AI & automation",
    eyebrow: "AI & automation",
    heading: "AI that does the work nobody has time for.",
    sub: "Not a chatbot bolted to your homepage. The specific jobs that go undone because you are on a roof: answering the 8:40pm lead, texting back the call you missed, chasing the quote nobody chased.",
    // The circuit ruling, with pulses running along it: something is happening
    // on this page's behalf while nobody is watching.
    texture: "signal",
    icon: "gears",
    symptoms: [
      "A quote request lands at 8:40pm. You answer it at 6:30am. They already booked someone.",
      "You missed four calls yesterday and you don't know who any of them were.",
      "The estimate you sent eleven days ago is still sitting there, because chasing it is nobody's job.",
      "You are the only person who knows the answer, so every question comes to you.",
    ],
    beforeAfter: [
      {
        before: "Leads wait until somebody is free",
        after: "Answered and qualified in under a minute, at any hour",
      },
      { before: "A missed call is a lost job", after: "A missed call is a text back in seconds" },
      {
        before: "Follow-up depends on who remembers",
        after: "It runs on a schedule, whether or not anyone remembers",
      },
      { before: "The repetitive hour is yours", after: "The repetitive hour is nobody's" },
    ],
    faqIds: [
      "will-ai-replace-my-people",
      "when-the-ai-gets-it-wrong",
      "works-with-my-crm",
      "what-does-it-cost",
    ],
  },
];

/** The category for a slug, or undefined. Used by the three route files. */
export function getCategory(slug: CategorySlug): Category {
  const category = categories.find((entry) => entry.slug === slug);

  // Unreachable: `slug` is a CategorySlug, and every slug in the union has an
  // entry above. The throw is here so the return type is `Category` rather
  // than `Category | undefined`, which would push a null check into all three
  // route files for a case that cannot happen.
  if (!category) throw new Error(`No category for slug "${slug}"`);

  return category;
}

/** Where a category's landing page lives. One place, so no route is typed twice. */
export function categoryHref(slug: CategorySlug): string {
  return `/${slug}`;
}
