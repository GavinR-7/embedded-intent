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

- [ ] **Above All Tent Rentals is at PageSpeed 64 mobile / 84 desktop.**
  Flagged in `AGENCY_SITE_COPY.md`. We cannot sell speed while the flagship
  portfolio piece scores 64. Fix before it is featured on the work page.

---

## Needed to finish the current build

- [ ] **🚨 Launch dates for all three case studies.** `content/work.ts` has
  `launchedAt: "TODO: confirm launch date"` on every entry — a deliberately
  loud placeholder, because Phase 5 renders this field and a plausible-looking
  wrong date would never be caught.
  - **John Savoretti Realty — confirm it actually launched.**
    `AGENCY_SITE_COPY.md` (2026-09-20) lists it as "targeted this week". If it
    has not shipped, it should not be on the work page at all yet.
  - Above All Tent Rentals — date needed.
  - GC Kuts — date needed.

- [ ] **Case study images.** `content/work.ts` seeds `images: []` for all three
  entries (Phase 2). Needs real screenshots — before/after where they exist —
  each with real alt text describing the actual image. No stock photography,
  no borrowed screenshots.

- [ ] **Testimonials.** Omitted entirely rather than placeholdered. Add only in
  the client's own words, with permission. The field is optional in the type,
  so no entry is broken by its absence.

- [ ] **Measured results.** All three case studies ship as `status: "launched"`.
  A case study can only move to `status: "measured"` when there is a real
  before/after number *and* a stated source for how it was measured. The type
  will not let a results block exist otherwise — this is the point.

- [ ] **Social profiles.** `content/site.ts` → `social` is `[]`, which renders
  nothing. Add once the profiles exist; an icon row of dead links is worse than
  no icon row.

- [ ] **🚨 Confirm every price before Phase 3.** Each `pricing` block in
  `content/services.ts` is calibrated against the competitor ladder in
  `AGENCY_SITE_COPY.md` — a starting point for a decision, not a decision.
  These go on a public page in Phase 3 section 7.

  | Service | Build | Monthly |
  | --- | --- | --- |
  | Website Design & Build | $3,500–9,000 | — |
  | AI Lead Response | $2,000–4,000 | $300–600 |
  | Missed-Call Text-Back | $750–1,500 | $150–300 |
  | Review Automation | $1,000–2,000 | $150–250 |
  | Internal AI Assistant | $2,500–6,000 | $250–500 |

  Plus the audit entry point (`$300–500`, credited toward any build) and the
  three homepage tiers, both still from the positioning doc's suggestion.

- [ ] **Confirm the delivery timeline in the FAQ.** `content/faq.ts` →
  `how-long` currently promises "three to six weeks" for a website and "one to
  two weeks" for a single automation. That is a commitment you have to keep, so
  it should be your number, not mine.

---

## Decisions still open

- [ ] **Privacy policy / terms.** Not written, not linked. A contact form
  collecting name, email and phone (Phase 6) usually wants a privacy policy.
  Decide whether to publish one, then add the footer column.

- [ ] **Homepage anchor IDs.** `content/site.ts` nav points at `/#what-we-build`,
  `/#how-it-works`, `/#pricing` and `/#faq`. Phase 3 must give the sections
  exactly those `id`s or the nav silently does nothing.

- [ ] **Google Business Profile.** Does not exist yet. Needed for local SEO and
  for the review automation service to have somewhere to send people.

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
