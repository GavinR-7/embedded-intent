/**
 * Brand + site configuration. Single source of truth.
 *
 * Every component imports from here. If you are about to type a phone number,
 * an email address, a nav label or a URL into JSX, it belongs in this file
 * instead.
 *
 * Contact channels stay typed `string | null` even though both are now filled.
 * That is the house rule, not a leftover: a placeholder string like
 * "hello@example.com" eventually ships, because nothing stops it. `null` cannot
 * ship silently — TypeScript forces every consumer to decide what to render
 * when a value is absent, and the Footer omits the channel entirely rather than
 * printing a dead link. `social` below is the field still exercising it.
 *
 * Note the email is on domain forwarding, so it depends on DNS being live
 * before launch — see CONTENT_TODO.md.
 */

export type NavItem = {
  label: string;
  href: string;
};

export type FooterColumn = {
  heading: string;
  links: readonly NavItem[];
};

export type SocialLink = {
  /** Used as the accessible name of the link. */
  label: string;
  href: string;
};

export type PhoneNumber = {
  /** How it is shown to a human: "(631) 555-0134" */
  display: string;
  /** E.164, for the tel: href: "+16315550134" */
  e164: string;
};

export type SiteConfig = {
  name: string;
  /** Short positioning line. Not a slogan — it says what the business does. */
  tagline: string;
  /** Default meta description. */
  description: string;
  domain: string;
  url: string;
  /** Where the work happens, in the owner's words. */
  serviceArea: string;
  email: string | null;
  phone: PhoneNumber | null;
  /** Mirrors --color-void in app/globals.css, for <meta name="theme-color">. */
  themeColor: string;
  nav: readonly NavItem[];
  /**
   * The one CTA used everywhere on the site. There is no second offer and no
   * paid entry point — the audit is free, full stop.
   */
  primaryCta: NavItem;
  /** Sits directly under the CTA wherever it appears. */
  ctaMicrocopy: string;
  footerColumns: readonly FooterColumn[];
  social: readonly SocialLink[];
  /** The three-part trust line used under the hero and in the footer. */
  trustPoints: readonly string[];
};

export const site: SiteConfig = {
  name: "Embedded Intent",
  tagline: "Websites and AI that answer the phone when you can't",
  description:
    "Embedded Intent builds fast websites for service businesses on Long Island and across New York — and the AI that answers, qualifies and books the leads they bring in.",
  domain: "embeddedintent.com",
  url: "https://embeddedintent.com",
  serviceArea: "Long Island & New York",

  email: "hello@embeddedintent.com",
  phone: { display: "(631) 240-3073", e164: "+16312403073" },

  themeColor: "#060b0f",

  // Anchors (/#id) point at homepage sections built in Phase 3. /work and
  // /contact are real routes arriving in Phases 5 and 6 — they 404 until then.
  nav: [
    { label: "What we build", href: "/#what-we-build" },
    { label: "Work", href: "/work" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ],

  primaryCta: { label: "Get a free audit", href: "/contact" },
  ctaMicrocopy: "Free · 30 minutes · You leave with a prioritised list either way",

  // A Services column, generated from content/services.ts, is added in Phase 4.
  // It is not hard-coded here — that would create a second list of services to
  // keep in sync with the first.
  footerColumns: [
    {
      heading: "Explore",
      links: [
        { label: "What we build", href: "/#what-we-build" },
        { label: "How it works", href: "/#how-it-works" },
        { label: "Work", href: "/work" },
        { label: "Pricing", href: "/#pricing" },
        { label: "FAQ", href: "/#faq" },
      ],
    },
  ],

  // TODO(launch): add profiles once they exist. An empty array renders nothing,
  // which is correct — an icon row linking to dead profiles is worse than none.
  social: [],

  trustPoints: [
    "No contracts",
    "You own every account we build",
    "You work directly with the person building it",
  ],
};
