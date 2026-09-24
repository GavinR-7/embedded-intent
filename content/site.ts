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

import type { IconName } from "@/components/ui/icons";

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

/**
 * The one hand-written dropdown in the primary nav.
 *
 * The other three tabs are the service categories, and they are generated in
 * `content/nav.ts` from `content/categories.ts` + `content/services.ts` — a
 * second list of services in config would be a second list to forget. Company
 * has no data behind it, so it is written out here.
 */
export type CompanyMenu = {
  label: string;
  /** Where the tab label itself goes. */
  href: string;
  /** Label for the panel's footer link back to `href`. */
  allLabel: string;
  /** Route prefixes the active underline tracks. */
  owns: readonly string[];
  items: readonly { label: string; href: string; description: string; icon: IconName }[];
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
  /** The Company dropdown. The three category tabs are generated — see nav.ts. */
  companyMenu: CompanyMenu;
  /** Direct links sitting beside the dropdowns. */
  navLinks: readonly NavItem[];
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
  /** Business hours, for the contact page's "Reach us directly" card. */
  hours: string;
  /** What we promise about replies. Stated where the form is. */
  responseCommitment: string;
  /**
   * The person behind the practice.
   *
   * The site speaks as "we" — it is a business, and a prospect comparing
   * three quotes is not reassured by a company that cannot say "we". But the
   * whole differentiator is that there is one named human behind it, so the
   * Why section and the contact card name him. Those two places are the
   * exception, not the default.
   */
  owner: { name: string; role: string };
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

  companyMenu: {
    label: "Company",
    href: "/work",
    allLabel: "All our work",
    owns: ["/work"],
    // Deliberately no About, Blog or Guides. An empty page in the nav is
    // worse than an absent one — see CONTENT_TODO.md for About.
    items: [
      {
        label: "How it works",
        href: "/#how-it-works",
        description: "Find, build, automate, measure — and what each step produces",
        icon: "gears",
      },
      {
        label: "Our work",
        href: "/work",
        description: "Live client sites, with results published once measured",
        icon: "browser",
      },
      {
        label: "FAQ",
        href: "/#faq",
        description: "Ownership, timelines, CRMs, and what happens when AI gets it wrong",
        icon: "chat",
      },
    ],
  },

  navLinks: [{ label: "Contact", href: "/contact" }],

  primaryCta: { label: "Get a free audit", href: "/contact" },
  ctaMicrocopy: "Free · A prioritized list, whether or not you hire us",

  footerColumns: [
    {
      heading: "Company",
      links: [
        { label: "How it works", href: "/#how-it-works" },
        { label: "Our work", href: "/work" },
        { label: "FAQ", href: "/#faq" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ],

  // TODO(launch): add profiles once they exist. An empty array renders nothing,
  // which is correct — an icon row linking to dead profiles is worse than none.
  social: [],

  owner: { name: "Gavin", role: "Founder" },

  hours: "Mon–Fri, 9am–6pm ET",
  responseCommitment: "Forms answered within one business day",

  trustPoints: [
    "No contracts",
    "You own every account we build",
    "You work directly with the person building it",
  ],
};

/**
 * Replaces `{owner}` in a copy string with the owner's name.
 *
 * The copy keeps the token rather than the name so `site.owner` stays the one
 * place it is written down — and so the two spots that name a person are
 * findable with a grep for `{owner}` rather than a grep for "Gavin".
 */
export function fillOwner(text: string): string {
  return text.replaceAll("{owner}", site.owner.name);
}
