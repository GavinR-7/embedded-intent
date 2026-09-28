/**
 * The two legal pages: /privacy and /terms.
 *
 * ---------------------------------------------------------------------------
 * These are NOT lawyer-reviewed. They are an accurate description of what this
 * site actually does, written by the people who built it, plus the specific
 * disclosures a carrier asks for before it will carry business text messages.
 * That is a different thing from legal advice, and CONTENT_TODO.md tracks it as
 * a launch-adjacent item.
 *
 * Two rules held while writing them, and worth holding while editing them:
 *
 *   1. **Every sentence about behaviour has to be true of the code.** The form
 *      fields listed below are the fields in `lib/auditRequest.ts`; "there is no
 *      database" is true because `app/api/audit/route.ts` sends an email and
 *      stores nothing; "cookieless" is true of the two Vercel beacons in
 *      `components/analytics/VercelBeacons.tsx` and there is no third script on
 *      the site. If any of that changes, this file changes in the same commit.
 *
 *   2. **Nothing is claimed beyond that.** No rights, guarantees, warranties,
 *      limitations or jurisdictions that nobody has decided on. A legal page
 *      that invents a promise is worse than a short one.
 *
 * The SMS blocks exist because A2P 10DLC registration asks a business to publish
 * them before it can send a text from its own number. Two sentences in the
 * privacy document are quoted verbatim from that requirement and must not be
 * reworded — they are marked where they appear.
 * ---------------------------------------------------------------------------
 */

import { site } from "./site";

/** One block of a legal document: a heading, prose, and an optional list. */
export type LegalSection = {
  /** Stable, and used as the `id` so a URL can point at one section. */
  id: string;
  heading: string;
  /** Paragraphs, in order. May contain `{email}` and `{business}`. */
  body: readonly string[];
  /** Rendered as a list under the paragraphs. */
  points?: readonly string[];
};

export type LegalDocument = {
  /** The route, without a leading slash. */
  slug: "privacy" | "terms";
  eyebrow: string;
  heading: string;
  /** The lead paragraph under the H1, and the page's meta description. */
  sub: string;
  /**
   * ISO 8601, and the only place the date is written.
   *
   * Rendered through `Intl` with an explicit UTC time zone — `new Date()` on a
   * date-only string parses as UTC midnight, and formatting that in any zone
   * west of Greenwich prints the day before.
   */
  effective: string;
  sections: readonly LegalSection[];
};

/**
 * Replaces `{email}` and `{business}` in legal copy.
 *
 * The same trick as `fillOwner` in content/site.ts, and for the same reason:
 * the address is written down once, in `site`, and a grep for `{email}` finds
 * every sentence that depends on it.
 *
 * `site.email` is typed `string | null` — the house rule that a missing value
 * cannot ship as a plausible-looking placeholder. The fallback is a sentence
 * that still reads correctly without it rather than an empty space, because a
 * privacy page that does not say how to reach anyone is not a privacy page.
 */
export function fillLegal(text: string): string {
  return text
    .replaceAll("{email}", site.email ?? "the address on our contact page")
    .replaceAll("{business}", site.name);
}

/**
 * The privacy notice.
 *
 * Structure follows what someone actually wants to know, in order: what you
 * typed, where it went, what else is running on the page, what we do with your
 * phone number, what we never do, and how to make it all go away.
 */
export const privacy: LegalDocument = {
  slug: "privacy",
  eyebrow: "Privacy",
  heading: "What we collect, and what happens to it.",
  sub: "The short version: the only thing we collect is what you type into the audit form, and it becomes an email to us. We don't sell it, we don't share your phone number, and there are no advertising trackers on this site.",
  effective: "2026-09-28",
  sections: [
    {
      id: "what-we-collect",
      heading: "What the audit form collects",
      body: [
        "The form on the contact page asks for these things, and nothing else:",
        "Your name and your email address are the only required fields. Everything else is optional, and a field you leave blank is not sent at all. The form also asks which services you're interested in, as a set of checkboxes — we receive the ones you tick.",
        "We don't ask for payment details anywhere on this site, and there is nothing to log in to, so there is no account and no password.",
      ],
      points: [
        "Your name",
        "Your business name",
        "Your email address",
        "Your phone number",
        "Your website address",
        "A message describing what's going on",
      ],
    },
    {
      id: "what-happens-to-it",
      heading: "What happens to it",
      body: [
        "There is no database. When you submit the form, the fields are checked and sent straight to us as an email, through Resend — the service that delivers mail for this site. It arrives in our inbox and stays there, exactly as it would if you had written to us yourself.",
        "We use it to reply to you and to put together the audit you asked for. That is the whole purpose. We don't add you to a mailing list because you asked for an audit, and we don't pass your request to anyone else.",
      ],
    },
    {
      id: "analytics",
      heading: "Analytics",
      body: [
        "When this site is served from Vercel, two measurements run on it: Vercel Analytics, which counts page views, and Vercel Speed Insights, which records how quickly pages load for real visitors. Both are cookieless. They set no cookies, they do not identify you, and they do not follow you to other websites.",
        "That is all we run. There are no advertising trackers, no marketing pixels and no third-party scripts on this site. Even the fonts are served from our own domain, so opening a page here does not make a request to anyone else's server.",
        "Our host keeps standard server logs of requests, in the way every web host does.",
      ],
    },
    {
      id: "sms",
      heading: "SMS and text messaging",
      body: [
        "If you give us your phone number, we may text you about your request or your project — a reply to what you sent, a question we need answered, or something about scheduling. We text you because you asked us to get in touch, and we do not send marketing or promotional texts.",
        /*
         * ⚠️ THE NEXT PARAGRAPH IS QUOTED VERBATIM AND MUST NOT BE REWORDED.
         * It is the wording carriers require to be published before they will
         * carry business messaging. Changing a word here can fail a 10DLC
         * registration; if it ever needs to change, that is a carrier decision,
         * not an editing one.
         */
        "Mobile information will not be shared with third parties or affiliates for marketing or promotional purposes. Text messaging originator opt-in data and consent will not be shared with any third parties.",
        "Message frequency varies. Message and data rates may apply. Reply STOP to any message to opt out, and HELP for help.",
      ],
    },
    {
      id: "what-we-dont-do",
      heading: "What we don't do",
      body: [],
      points: [
        "We don't sell your information, to anyone, for any amount.",
        "We don't share it with third parties or affiliates for marketing or promotional purposes.",
        "We don't set cookies of our own, and nothing here asks you to accept any.",
        "We don't run advertising or retargeting on this site.",
      ],
    },
    {
      id: "removing-it",
      heading: "Asking us to delete it",
      body: [
        "Write to {email} and tell us what you'd like removed. We'll delete the email thread and any notes we made from it, and tell you when it's done.",
        "If you would rather not send any of this through a form, the contact page lists the other ways to reach us, and they reach the same person.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to this page",
      body: [
        "If any of the above changes, this page changes with it and the effective date at the top moves. There is no separate archive: what you are reading is the current version.",
        "Questions about any of it go to {email}.",
      ],
    },
  ],
};

/**
 * The terms.
 *
 * Deliberately short. It covers the four things this business actually does
 * — a free audit, a written agreement per project, how payment is split, and
 * the text messages — and stops there.
 */
export const terms: LegalDocument = {
  slug: "terms",
  eyebrow: "Terms",
  heading: "How working together works.",
  sub: "The audit is free and commits you to nothing. Everything after it is set out in writing, per project, before any work starts.",
  effective: "2026-09-28",
  sections: [
    {
      id: "the-audit",
      heading: "The free audit",
      body: [
        "The audit costs nothing and carries no obligation. Asking for one does not commit you to hiring us, and it does not commit us to taking the work.",
        "What you get is our read on what we would fix first, in priority order. It is yours to keep whether or not you hire us, and yours to hand to someone else if you would rather they did the work.",
      ],
    },
    {
      id: "scope-and-pricing",
      heading: "Scope and pricing",
      body: [
        "Every project is quoted in writing before it starts. That written agreement is what sets the scope, the price and the timeline for that project, and it is the document that governs the work.",
        "Prices shown on this site are a guide to what work like this usually costs. The figure that applies to your project is the one in your agreement.",
      ],
    },
    {
      id: "payment",
      heading: "Payment",
      body: [
        "Projects are split in two: 50% as a deposit before work begins, and 50% on delivery.",
        "The written agreement for a project says what counts as delivery for that project, so both halves are tied to something specific rather than to a date.",
      ],
    },
    {
      id: "sms",
      heading: "Text messages",
      body: [
        "The messaging program is called {business}.",
        "If you give us your phone number, we may text you about your request or your project: a reply to what you sent, a question we need answered, or something about scheduling. We do not send marketing or promotional texts.",
        "Message frequency varies. Message and data rates may apply. Reply STOP to any message to opt out, and HELP for help.",
        "Carriers are not liable for delayed or undelivered messages.",
        "How we handle the number itself — including that it is never shared for marketing — is in the privacy notice.",
      ],
    },
    {
      id: "contact",
      heading: "Questions",
      body: [
        "Anything on this page that isn't clear: write to {email} and ask. You'll get a straight answer from the person who would do the work.",
      ],
    },
  ],
};

/** Both documents, for the footer, the sitemap and the routes. */
export const legalDocuments = [privacy, terms] as const;
