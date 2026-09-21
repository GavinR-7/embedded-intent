# Content TODO

Everything the site still needs from the real world. Nothing here may be
invented — a missing item stays missing until someone supplies the real value.

---

## 🚨 Launch-blocking

These must be resolved before the domain is pointed at the site.

- [ ] **Revert the crawler block — two places, same commit.**
  - `app/robots.ts` → `rules: { userAgent: "*", allow: "/" }` plus the sitemap URL
  - `app/layout.tsx` → delete `robots: { index: false, follow: false }` from `metadata`
  - Both are currently on deliberately. robots.txt blocks *crawling*; the meta
    tag blocks *indexing*. Removing only one leaves the site half-hidden.

- [x] ~~Real contact email.~~ `hello@embeddedintent.com` — set 2026-09-21.
- [x] ~~Real business phone number.~~ `(631) 942-1211` — set 2026-09-21.

- [ ] **Verify `hello@embeddedintent.com` actually receives mail.** It is on
  domain forwarding that was still being set up when it was added, so it
  depends on DNS. Send a real test message before launch — a contact address
  printed in the footer that silently drops mail is worse than none.

- [ ] **Decide whether (631) 942-1211 is the missed-call text-back line.**
  If that service is being sold, the number in the footer should be the one
  wired into it, or the demo contradicts the pitch.

- [ ] **Favicon and app icons.** `app/favicon.ico` is still the Next.js default.

- [ ] **Default OG image.** Nothing set; links shared to SMS or Facebook
  currently preview as bare text. (Wired up properly in Phase 8.)

- [ ] **🚨 Above All Tent Rentals is at PageSpeed 64 mobile / 84 desktop.**
  Flagged in `AGENCY_SITE_COPY.md`. This got sharper, not softer: it is now the
  *only* case study on the site, so the one piece of proof we show scores 64 on
  the metric we sell. Fix it before launch — almost always images
  (`next/image`, AVIF/WebP, correct sizing) or a heavy hero. Until then, do not
  write speed claims around this client.

---

## Needed to finish the current build

- [x] ~~Launch dates for all three case studies.~~ Resolved 2026-09-21 by
  cutting the list to the one site that is actually live: Above All Tent
  Rentals, launched 2026-08-20.

- [ ] **GC Kuts — built and deployed, never launched by the client.**
  Not live client work, so it is not in `content/work.ts` and does not go on
  the site. It still exists as a real build and can be referenced on a call or
  screen-shared in an audit. Add it only if the client ever puts it live.

- [ ] **John Savoretti Realty — re-add the day it goes live.**
  Custom Next.js build, live MLS/IDX listing pipeline, area pages. Removed
  from `content/work.ts` because it has not launched. The moment it does, add
  it back as `status: "launched"` with the real date.

- [ ] **🚨 Above All Tent Rentals screenshots.** `content/work.ts` has
  `images: []`. With one case study carrying the whole work page, this is now
  the difference between a case study and a paragraph. Needs real screenshots
  — mobile and desktop, plus the quote flow — each with real alt text
  describing the actual image. No stock photography, no borrowed screenshots.

- [ ] **Testimonials.** Omitted entirely rather than placeholdered. Add only in
  the client's own words, with permission. The field is optional in the type,
  so no entry is broken by its absence.

- [ ] **Measured results for Above All.** It ships as `status: "launched"`,
  which renders "results tracking in progress" and no results section. It can
  only move to `status: "measured"` when there is a real before/after number
  *and* a stated source for how it was measured. The type will not let a
  results block exist otherwise — this is the point.

- [ ] **Social profiles.** `content/site.ts` → `social` is `[]`, which renders
  nothing. Add once the profiles exist; an icon row of dead links is worse than
  no icon row.

- [x] ~~Confirm every price before Phase 3.~~ Confirmed by the owner
  2026-09-21 and set in `content/services.ts`. Eight services, one primary plus
  seven add-ons, sold modularly — there is deliberately no bundled tier.

- [x] ~~Confirm the delivery timeline in the FAQ.~~ Confirmed 2026-09-21:
  two to four weeks for a site, one to two for a single automation, with the
  exact date committed on the call rather than estimated as a range.

- [x] ~~The audit price.~~ The audit is **free**. There is no paid entry point
  anywhere on the site; every CTA is "Get a free 30-minute audit".

- [x] ~~Header CTA may be too wide on desktop.~~ Resolved 2026-09-21: the CTA
  is now "Get a free audit" everywhere, with "Free · 30 minutes · …" carried by
  `ctaMicrocopy` underneath. Shorter button, same offer.

- [ ] **🚨 Source the "0.4s" on the hero panel, or cut it.** `content/home.ts`
  → `leadSystem.rows[0].status`. It is the only number on the homepage that is
  not a published price, and it currently has nothing behind it. Either it is a
  real measured response time with a stated source, or it should become `AUTO`
  like the other three rows. Same rule as case study results: a number with no
  source does not go on the site.

---

## Decided — for Phase 6

- **The audit is a form, not a calendar booking.** No Calendly, no scheduler,
  no availability widget. The form submits via Resend to the owner, who
  researches the business and follows up by email. The research step between
  submission and reply *is* the product — a booking widget would skip it.

- **Contact page layout.** Form on the left. On the right, two cards:
  - "Reach us directly" — phone, email, hours, from `content/site.ts`
  - "What the audit is NOT" — the anti-sell, so nobody turns up braced for a
    sales call

  Stacks to one column on mobile, form first.

- **Form fields** (`*` required): full name\*, business name, website, email\*,
  phone, a multi-select of what they're after, and a free-text box.
  Multi-select options: new website or rebuild · getting found on Google ·
  Google Ads · more Google reviews · more leads · AI / automation · not sure yet.

- [ ] **Business hours** are not recorded anywhere yet. The "Reach us directly"
  card needs them, so they will have to go in `content/site.ts` before Phase 6.

---

## Decisions still open

- [ ] **Privacy policy / terms.** Not written, not linked. A contact form
  collecting name, email and phone (Phase 6) usually wants a privacy policy.
  Decide whether to publish one, then add the footer column.

- [ ] **Homepage anchor IDs.** `content/site.ts` nav points at `/#what-we-build`,
  `/#how-it-works`, `/#pricing` and `/#faq`. Phase 3 must give the sections
  exactly those `id`s or the nav silently does nothing.

- [ ] **Google Business Profile.** Does not exist yet. Needed for the Get Found
  on Google service, and for Get More Google Reviews to have somewhere to send
  people.

---

## Housekeeping

- [ ] **Remove scaffold assets.** `public/next.svg`, `vercel.svg`, `globe.svg`,
  `window.svg`, `file.svg` are create-next-app leftovers and unused.

- [ ] **Replace the placeholder homepage.** `app/page.tsx` is a Phase 1 stub.
  It carries no marketing claims on purpose. Phase 3 replaces it entirely.

- [ ] **`/work` and `/contact` 404 until Phases 5 and 6.** The header CTA and
  nav already link to them. Expected, not a bug.

---

## Launch checklist (Phase 8 prints this — do not execute early)

1. Revert `robots.ts` and the layout `robots` metadata
2. Point embeddedintent.com at the Vercel project
3. Submit the sitemap to Google Search Console
4. Create the Google Business Profile
