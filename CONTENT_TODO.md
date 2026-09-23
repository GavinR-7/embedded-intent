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
- [x] ~~Real business phone number.~~ `(631) 240-3073` (Google Voice) — set 2026-09-21.

- [ ] **Verify `hello@embeddedintent.com` actually receives mail.** It is on
  domain forwarding that was still being set up when it was added, so it
  depends on DNS. Send a real test message before launch — a contact address
  printed in the footer that silently drops mail is worse than none.

- [ ] **Decide whether (631) 240-3073 is the missed-call text-back line.**
  It is a Google Voice number. If Missed-Call Text-Back is being sold, the
  number in the footer should be the one wired into it, or the demo
  contradicts the pitch — and Google Voice may not support the integration.

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

- [ ] **The case study image gallery has never rendered.** `/work/[slug]`
  renders a `next/image` grid when `images` is non-empty, and `images` is
  empty, so that code path has never executed. Check it the moment the first
  screenshot lands — it uses `fill` inside an aspect-ratio box, which needs the
  container to stay positioned.

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
  2026-09-21 and set in `content/services.ts`. Now **eleven** services: Website
  Refresh ($800–2,000 + $150/mo) added 2026-09-22, then Online Booking Setup
  ($600–1,200, no monthly from us) and Quote & Price Calculator ($900–2,000,
  covered by existing site care) on 2026-09-23. One primary plus ten add-ons,
  sold modularly, with no bundled tier.

- [x] ~~Confirm the delivery timeline in the FAQ.~~ Confirmed 2026-09-21:
  two to four weeks for a site, one to two for a single automation, with the
  exact date committed on the call rather than estimated as a range.

- [x] ~~The audit price.~~ The audit is **free**. There is no paid entry point
  anywhere on the site; every CTA is "Get a free audit".

- [x] ~~Header CTA may be too wide on desktop.~~ Resolved 2026-09-21: the CTA
  is "Get a free audit" everywhere. Microcopy is now
  "Free · You leave with a prioritised list either way" — the duration was
  dropped 2026-09-22, since the audit page states it.

- [x] ~~Source the "0.4s" on the hero panel, or cut it.~~ Cut 2026-09-21. It
  now reads `AUTO` like the other three rows. No unsourced numbers anywhere on
  the site.

- [ ] **About page — needs a photo and a bio.** Deliberately absent from the
  Company menu rather than stubbed: an empty page in the nav is worse than a
  missing one. For a solo practice whose main differentiator is "you work
  directly with the person building it", a real face and a short honest bio is
  probably the highest-value page still missing. Needs a photo and a few
  paragraphs from the owner before it can exist.

- [ ] **Re-add a "Latest work" strip to the homepage once there are 3+ live
  case studies.** Removed 2026-09-23 along with the compact proof block beside
  the closing CTA. One live client is not a proof strip, and a strip of one
  reads as two missing. Case studies live on `/work`, reached through Company.

- [ ] **Founder photo for the Why section and the contact card.** The site
  speaks as "we", with two deliberate exceptions that name the person — the Why
  section and the "Reach us directly" card. Both would carry a real face. For a
  practice whose whole differentiator is "you work directly with the person
  building it", a stock photo would be worse than none. Needs a real headshot.

- [ ] **Rate-limit `/api/audit` at the edge before launch.** Add a Vercel
  Firewall rule on that path. The honeypot and the three-second time trap stop
  naive bots, but neither stops a determined script from posting a thousand
  valid-looking submissions — and every one of those is an email and a Resend
  send. This belongs at the edge, not in the handler, so the requests never
  reach a function at all.

---

## Logged, not built

Deliberately not built yet, and not stubbed. A placeholder for a feature that
does not exist is worse than its absence — it promises something on a sales
site that cannot be delivered when someone taps it.

- [ ] **"Try it live" homepage section.** A missed-call text-back demo number,
  a chatbot demo, and later an AI phone agent demo — the single most
  convincing thing this site could carry, since the product demonstrates
  itself.
  **Blocked on:** a Twilio number and A2P 10DLC registration, which takes real
  time to approve. Do not build placeholder demo UI in the meantime.

- [ ] **"Always working" wording.** Replace the published business hours with
  an always-on claim — but *only once* missed-call text-back or AI answering is
  actually live on our own line. Claiming to answer around the clock while the
  contact card says Mon–Fri 9–6 is the exact contradiction this site is
  positioned against, and a prospect who tests it at 9pm finds out.
  Depends on the Twilio work above.

---

## Decided — for Phase 7

- **Interactive hero background, Tier 1 only.** Pointer position written to CSS
  custom properties on the hero element, consumed by a `radial-gradient` that
  lights the circuit-trace grid near the cursor.

  Hard constraints, so this does not quietly become a WebGL background:
  - No canvas. No WebGL.
  - No JavaScript animation loop. The only handler is a **throttled
    `pointermove`** that writes two custom properties; the paint is entirely
    CSS.
  - **Inert under `prefers-reduced-motion: reduce`** — do not attach the
    listener at all. `lib/usePrefersReducedMotion.ts` already reads that.
  - **Inert on touch devices**, where there is no cursor to follow and the
    listener is pure cost. Gate on a coarse-pointer media query.

  Tier 2/3 backgrounds stay out of scope unless Lighthouse mobile is ≥ 95
  after everything else, per the Phase 7 rules in BUILD_PROMPT.md.

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

- [x] ~~Business hours.~~ Set 2026-09-22: `Mon–Fri, 9am–6pm ET`, alongside
  `responseCommitment` ("Forms answered within one business day") in
  `content/site.ts`. Both are commitments — change them in one place if they
  change.

- [ ] **🚨 Resend is not configured.** `/contact` renders and validates, but no
  email can be sent until `RESEND_API_KEY`, `AUDIT_TO_EMAIL` and
  `AUDIT_FROM_EMAIL` exist in `.env.local` *and* in the Vercel project. The
  endpoint fails loudly (500) rather than pretending to succeed, so an
  unconfigured deploy is visible — but it is still a form that cannot receive
  anything. Verify with a real submission before launch.

- [ ] **Verify the From: domain in Resend.** `AUDIT_FROM_EMAIL` has to be on a
  domain verified in Resend or every send is rejected. This is the same DNS
  work as getting `hello@embeddedintent.com` receiving.

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
