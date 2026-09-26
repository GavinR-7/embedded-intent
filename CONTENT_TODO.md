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
  "Free · You leave with a prioritized list either way" — the duration was
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

## Done — Phase 7

- [x] ~~**Interactive hero background, Tier 1 only.**~~ Built 2026-09-23 as
  `components/motion/GridSpotlight.tsx` + the `trace-grid-lit` utility. Every
  constraint recorded here held: no canvas, no WebGL, no animation loop, one
  rAF-throttled `pointermove` writing two custom properties, and the listener is
  never attached under reduced motion or on a coarse pointer. Verified with
  emulated media, not assumed — see the bottom of MOTION.md.

  Tier 2/3 backgrounds remain out of scope. Lighthouse mobile on `/` is 97, so
  the door BUILD_PROMPT.md left open (≥ 95) is technically open — but the
  measured cost of the work already done says the budget is better spent
  elsewhere, and a WebGL hero on a site that sells page speed is the wrong
  advertisement.

- [x] ~~React Bits, hard cap of three.~~ **Zero used.** Reasoning in MOTION.md:
  the H1 text reveal was forbidden by the LCP rule at the time, `CountUp` has no
  number on this site to count, and the Tier 1 background is 60 lines of CSS. No
  `components/reactbits/` directory was created and no dependency was added.

---

## Done — Phase 7b

- [x] ~~**The grey slabs during scroll reveals.**~~ Twelve grids drew their
  rules with `gap-px` on a `bg-line` container, which shows the container's fill
  straight through any cell that has not arrived yet. Containers are now
  transparent with a 1px border and each cell carries its own `hairline` shadow.
  Photographed mid-reveal at 390px to confirm — see the bottom of MOTION.md.

- [x] ~~**The pinned "How it works".**~~ Unpinned. All four steps already fit in
  one viewport, so the pin held the page still for three screens and scrolled
  the section's own heading off the top before the first step lit up. The
  activation, the dimming and the progress rail all stayed.

- [x] ~~React Bits, second look.~~ Still **zero**. `DecryptedText` was
  explicitly allowed for the hero if its dependency weight was light; it is
  hand-written instead, in `components/motion/DecryptWord.tsx`, at about the
  forty lines the alternative was estimated at.

- [x] ~~**Category pages had the same hero as everything else.**~~ Each one now
  has a drawing that demonstrates what it sells. Every label in them is in
  `content/heroVisuals.ts` and every one is marked, in the markup, as an
  illustration — no real business names, no real geography, no ratings printed
  as numbers, no real conversation.

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

## Logged in Phase 7, not built

- [ ] **README.md is still the `create-next-app` boilerplate.** It tells a
  reader to look at `app/page.tsx` and says nothing about the content rule, the
  phases, or the four docs that matter. Worth fifteen minutes before anyone
  else ever sees this repo, but it is documentation, not the site.

- [ ] **The homepage is still long** — nine sections. It got shorter in Phase
  7b: "How it works" was 70vh of scroll per step and is now an ordinary stacked
  list. If it needs to be shorter still, the lever is fewer sections, not
  tighter cards.

- [ ] **Mobile LCP on `/` flips between ~2.0s and ~2.65s**, on the current
  build *and* on the commit before it, with no correlation to Lighthouse's
  `benchmarkIndex`. The gap is about one simulated round trip, so the likely
  cause is a resource that is sometimes on the critical path and sometimes not.
  It predates Phase 7b and is a measurement hazard rather than a defect — but
  it makes every comparison expensive, so it is worth an hour before Phase 8's
  final performance pass. Until then, measure by interleaving against a
  worktree of the previous commit; see the "Interleave, or do not believe it"
  section of MOTION.md.

- [ ] **Category page copy is first-draft.** The symptoms and before/after pairs
  in `content/categories.ts` follow the writing rules and are pitched one level
  above the service pages, but they have not been read back against the service
  pages line by line. Worth one editing pass when the pages are reviewed.

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
