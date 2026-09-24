# Embedded Intent — Phased Build Prompt

Paste this whole file into Claude Code at the root of the `embedded-intent` repo.

---

## Context for Claude Code

You are building the marketing site for **Embedded Intent** (embeddedintent.com), a
solo web-development and AI-automation practice serving service businesses on Long
Island and across NY. The owner is an ECE student who writes and reads every line —
this is a teaching build as much as a shipping build.

**Stack (already scaffolded, do not change):**
Next.js 16.3.5 App Router · TypeScript strict · Tailwind v4 · deployed on Vercel.

> Corrected during Phase 1: this prompt originally said Next.js 15, but the repo
> is on 16.3.5. The differences that matter to later phases — `params` is a
> Promise, `PageProps`/`LayoutProps` are generated globals, Turbopack is the
> default — are documented in ARCHITECTURE.md under "Next.js 16 specifics".

**Positioning:** AI leads, outcome attached. The website is the entry product; AI
automation is the margin. Never write "AI-powered solutions" or any phrase of that
family. Every AI claim names the concrete thing it does for a business owner.

**Brand story (use it, don't over-explain it):** embedded systems — intelligence
built into how a business already runs, not bolted on beside it.

---

## Rules for this entire build — read before Phase 1

1. **Hard stop after every phase.** When a phase is done, summarise what you wrote,
   name the files, explain anything new, and **wait for explicit confirmation**
   before starting the next phase. Never run two phases in one turn.
2. **Explain what's new, skip what isn't.** The owner knows general programming and
   TypeScript. He is newer to Next.js App Router conventions, Tailwind v4's CSS-first
   config, and web-specific concerns. Teach those; don't explain what a `map` is.
3. **No black boxes.** If a file does something non-obvious, say why in the summary,
   not just in a comment.
4. **Single source of truth.** All copy, service definitions, case studies, and
   contact details live in typed modules under `content/`. No hard-coded strings in
   components. If you find yourself typing a phone number into JSX, stop — it belongs
   in `content/site.ts`.
5. **Mobile-first.** Write the mobile layout first, then widen. Most of the real
   audience is on a phone.
6. **Accessibility floor:** visible keyboard focus states, real alt text, semantic
   headings in order, `prefers-reduced-motion` respected on every animation.
7. **Performance is the product.** This site sells fast websites. Lighthouse mobile
   must stay ≥ 90 throughout. Check it at the end of every phase from Phase 3 on and
   report the score in your summary.
8. **Living docs.** Maintain `ARCHITECTURE.md`, `BUILD_NOTES.md`, and
   `CONTENT_TODO.md` from Phase 1 onward. Update them as part of each phase, not at
   the end of the build.

---

## PHASE 1 — Foundation

**Goal:** design system, layout shell, and the docs scaffold. No page content yet.

1. `app/globals.css` — set up Tailwind v4's CSS-first config with an `@theme` block.
   Define tokens for color, typography scale, and spacing rhythm. **Explain the
   `@theme` block in your summary** — this replaces `tailwind.config.js` from v3 and
   the owner hasn't used it before.

   Direction: dark, technical, precise. Near-black base, one electric accent (cyan or
   amber — pick one and justify it), a restrained neutral ramp. A monospace face for
   eyebrows, labels, and numbers; a clean sans for headings and body. Circuit-trace /
   embedded-systems feel without being literal about it. Every color must clear
   WCAG AA against its background — state the contrast ratios you chose.

2. `content/site.ts` — typed brand config: name, tagline, contact email, phone, nav
   items, footer links, social. Everything downstream imports from here.

3. `app/layout.tsx` — root layout, font loading via `next/font`, header and footer.

4. `components/layout/Header.tsx` and `Footer.tsx` — header with a working mobile
   menu. Keyboard-accessible, closes on Escape, traps focus while open.

5. `app/robots.ts` — **disallow all crawlers.** Add a clear comment saying this is
   deliberate pre-launch and must be reverted before launch. Add it to
   `CONTENT_TODO.md` as a launch-blocking item.

6. Create `ARCHITECTURE.md`, `BUILD_NOTES.md`, `CONTENT_TODO.md`.

**STOP.** Summarise, show the token block, and wait.

---

## PHASE 2 — The content layer

**Goal:** typed content modules. This phase is types and data only — no components.

1. `content/services.ts` — a typed `Service[]`. Each service: slug, name, one-line
   promise, the outcome it produces, who it's for, what's included, price range,
   before/after pair. Seed with: Website Design & Build, AI Lead Response,
   Missed-Call Text-Back, Review Automation, Internal AI Assistant.

2. `content/work.ts` — case studies. **This is the important one.**

   Model `CaseStudy` as a discriminated union on `status`:

   ```ts
   type MeasuredResult = {
     metric: string;      // "Mobile PageSpeed"
     before: string;      // "41"
     after: string;       // "96"
     source: string;      // how it was measured — required, no default
   };

   type CaseStudyBase = {
     slug: string;
     client: string;
     location: string;
     summary: string;
     built: string[];     // what was actually built
     images: { src: string; alt: string }[];
     testimonial?: { quote: string; attribution: string };
   };

   type CaseStudy =
     | (CaseStudyBase & { status: "measured"; results: MeasuredResult[] })
     | (CaseStudyBase & { status: "launched"; launchedAt: string });
   ```

   The `launched` variant has **no** `results` field, so TypeScript refuses to compile
   a results block onto a case study that hasn't been measured. This is deliberate:
   the site must never display a performance number that wasn't actually recorded.
   Do not add an optional `results?` to the base type — that defeats the whole point.

   Seed three entries, all `status: "launched"` for now:
   - John Savoretti Realty — Long Island residential brokerage. Built: custom
     Next.js build, live MLS/IDX listing pipeline, area pages.
   - Above All Tent Rentals — Saint James, NY. Built: custom site, mobile-first
     rebuild, quote request flow.
   - GC Kuts — Smithtown, NY. Built: custom site, Booksy booking integration.

   Leave `images` as empty arrays with a `CONTENT_TODO.md` entry. Do not invent
   testimonial text — omit the field where there isn't one.

3. `content/faq.ts` — typed Q&A. Seed the objections: do I have to buy everything at
   once · I already have a website · how long does it take · who owns the accounts ·
   does it work with my CRM · what does it cost · will AI replace my people · what
   happens when the AI gets something wrong.

**STOP.** Show the `CaseStudy` type, demonstrate that adding `results` to a
`launched` entry fails type-check, and wait.

> **Revised by the owner after Phase 2 (2026-09-21). The seed lists above are
> superseded — `content/` is the source of truth, not this section.**
>
> - **Services:** the five seeded services became **eight**, with confirmed
>   prices. "Review Automation" is now "Get More Google Reviews"; "Internal AI
>   Assistant" was replaced by "Custom AI Automation"; Get Found on Google,
>   Google Ads Management and Social Content Engine were added. One primary
>   service plus seven add-ons, sold modularly — **no bundled tier.**
> - **Case studies:** **one** entry, not three. Above All Tent Rentals is the
>   only live client site (launched 2026-08-20). GC Kuts was built and deployed
>   but never launched by the client; John Savoretti Realty has not launched
>   yet. Neither goes on the site. `CaseStudyBase` gained a required `problem`
>   field so a single case can be told with depth.
> - **The audit is free.** There is no paid entry point anywhere on the site.

---

## PHASE 3 — Homepage

Build in this order, each section a component under `components/sections/`, all copy
imported from `content/`.

1. **Hero** — eyebrow, H1, subhead, two CTAs, trust line.
   H1: "AI that answers your phone at 9pm."
   Sub: most leads arrive when nobody's there to catch them; we build the website
   that brings them in and the AI that answers, qualifies and books them in under a
   minute.
   Trust line: no contracts · you own every account we build · you work directly with
   the person building it.

   **Hero visual: the lead-journey chain.** A horizontal chain of four states —
   `New lead captured` → `AI qualifies & replies` → `Routed & booked` →
   `Review request sent` — that animates through in sequence on a loop, with a
   "Manual steps: 0" counter beside it. Build this by hand with CSS transforms and a
   small amount of state. No WebGL, no canvas. It must degrade to a static rendering
   of all four states under `prefers-reduced-motion`.

2. **Problem** — "You're not losing jobs because you're bad at the work." Five
   symptoms written as scenes, not bullets. A form that comes in Friday at 7pm and
   gets seen Monday. Four hundred jobs and thirty-one Google reviews. Quotes that
   wait on whoever remembers to chase them.

3. **What we build** — heading: "Start with the website. Add the rest when it's
   earning." One primary card (Website Design & Build) plus **seven** add-on
   cards, mapped from `content/services.ts`.

4. **Before / After** — four pairs, two-column on desktop, stacked on mobile.

5. **How it works** — Find → Build → Automate → Measure.

6. **Work** — **one** case study (Above All Tent Rentals), given real space
   rather than a thin card in a three-up grid with two holes in it. Links to
   `/work/[slug]`.

7. **Pricing** — a **single table of all eight services** with build and monthly
   columns, mapped from `content/services.ts`. Not three named tiers, and no
   bundled "full package" — the offering is modular and a fixed bundle would
   misrepresent it. Prices visible on the page, no "contact for pricing".
   State explicitly that Google ad spend is paid directly to Google and never
   marked up, and that Twilio usage is passed through at cost.

8. **Why me** — comparison table, typical agency vs. Embedded Intent. Rows: who does
   the work · who owns the accounts · what reporting means · contract length ·
   who you talk to.

9. **FAQ** — accordion from `content/faq.ts`. Native `<details>`/`<summary>` unless
   there's a concrete reason not to.

10. **Close** — "Let's find the fastest win in your business." Thirty minutes, free,
    you leave with a prioritised list either way.

**STOP after section 4**, then again at the end. Report Lighthouse mobile both times.

---

## PHASE 4 — Service pages

`app/services/[slug]/page.tsx`, generated from `content/services.ts` via
`generateStaticParams`. Each page: hero, the problem in that owner's words, what's
included, before/after, price, FAQ subset, CTA. `generateMetadata` per page.

**STOP.**

---

## PHASE 5 — Work pages

`app/work/page.tsx` (index) and `app/work/[slug]/page.tsx`.

The detail page must branch on `status`. For `measured`, render the results table
with each metric's source shown. For `launched`, render "Launched {date} — results
tracking in progress" and render **no** results section. Do not invent a placeholder
metric, a sample number, or a greyed-out example row.

**STOP.**

---

## PHASE 6 — Contact and the audit offer

1. `app/contact/page.tsx` — the audit request form.

   > **Revised by the owner 2026-09-21. This supersedes the line below.**
   >
   > **The audit is a FORM, not a calendar booking.** No Calendly, no
   > scheduler, no embedded availability widget. The form submits via Resend to
   > the owner, who researches the business and follows up by email. Do not add
   > a booking integration "for convenience" — the research step between
   > submission and reply is the product.
   >
   > **Layout:** form on the left. On the right, two cards:
   > - **"Reach us directly"** — phone, email, hours (all from `content/site.ts`)
   > - **"What the audit is NOT"** — the anti-sell, so nobody arrives expecting
   >   a sales call
   >
   > **Fields** (`*` = required):
   > - Full name\*
   > - Business name
   > - Website
   > - Email\*
   > - Phone
   > - What they're after — **multi-select**: new website or rebuild · getting
   >   found on Google · Google Ads · more Google reviews · more leads ·
   >   AI / automation · not sure yet
   > - Free-text box
   >
   > Stacks to a single column on mobile, form first. The multi-select options
   > belong in `content/` like everything else, and map onto `ServiceSlug`
   > where they correspond to a real service.

   ~~Short form: name, business, email, phone (optional), website (optional),
   what's broken. Framed as booking the free 30-minute audit.~~
2. API route using Resend. Key in `.env.local`, never in the repo. Add
   `.env.example` with the key names and no values.
3. Server-side validation with zod. Honeypot field for spam. Real success and error
   states — no silent failures.

**STOP.**

---

## PHASE 7 — Motion pass

Only now, with content real and complete.

**Hard cap: three React Bits components on the entire site.** Install via
`npx shadcn@latest add @react-bits/<Name>-TS-TW`, source lands in
`components/reactbits/`. Read `INTERACTION_REFERENCE.md` in this repo first.

Budget them:
- One text reveal on the homepage H1 only (`SplitText` or `BlurText`).
- `CountUp` on any numeric proof.
- One more, your choice, argued for in the summary.

Everything else is hand-written CSS transitions. Start the background at Tier 1 (CSS
variable spotlight). Only consider a WebGL background if Lighthouse mobile is ≥ 95
after everything else, and lazy-load it with `next/dynamic` `{ ssr: false }` behind a
static fallback.

Re-theme every vendored component to the Phase 1 tokens. Default React Bits colours
and easing on a client-facing site read as a template.

**STOP.** Report Lighthouse mobile before and after this phase.

> **Built 2026-09-23.** Structure first (three category routes, a five-tab nav,
> count-aware grids), then motion. **Zero React Bits components used**, against
> the cap of three — the reasoning is in `MOTION.md`, along with every effect,
> its tokens, and the rule that keeps reveals away from the LCP element.
> The Tier 1 background is built; Tier 2/3 remain out of scope.

---

## PHASE 8 — SEO, analytics, launch prep

1. `generateMetadata` on every route — title, description, OG image.
2. `app/sitemap.ts`.
3. JSON-LD: `LocalBusiness` and `Service` schema.
4. Vercel Analytics + Speed Insights.
5. Final Lighthouse pass. Mobile **must** be ≥ 90 on every route. If it isn't, fix it
   in this phase — usually images (`next/image`, AVIF/WebP, explicit sizes) or fonts.
6. Update `CONTENT_TODO.md` with everything still outstanding.
7. Print the launch checklist but **do not execute it**:
   - revert `robots.ts` to allow crawling
   - point embeddedintent.com at the Vercel project
   - submit the sitemap to Google Search Console
   - create the Google Business Profile

**STOP.** This is the end of the build.

---

## Things to never do in this build

- Invent a statistic, a result, a percentage, or a testimonial. If a number isn't
  measured and sourced, it does not go on the site.
- Use lorem ipsum. Where real copy is missing, write a clearly-labeled
  `TODO:` placeholder and log it in `CONTENT_TODO.md`.
- Commit a `.env` file or put a key in source.
- Add a dependency without saying in the summary what it's for and what it weighs.
- Run two phases without a stop in between.
