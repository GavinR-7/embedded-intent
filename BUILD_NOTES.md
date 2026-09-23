# Build notes

A running log of decisions, with reasons. Read this before undoing something
that looks odd.

---

## Phase 1 — Foundation

### Accent: cyan, not amber

Two reasons, both practical rather than aesthetic.

1. **Amber bright enough to pass AA on near-black drifts yellow and reads as a
   warning.** That collides with the meaning we need a warm colour to carry on
   form validation in Phase 6. Reserving amber/red for genuine error states
   keeps the colour language honest.
2. **Cyan holds saturation at high lightness.** `oklch(0.85 0.13 195)` is
   13.14:1 on the page background, which means the *same* token works as link
   text, as a focus ring, and as a button fill. An amber would have needed a
   separate darker variant for text, so one accent becomes three.

### Colours are authored in OKLCH, and every value was checked for gamut

OKLCH is perceptually uniform — equal steps in `L` look like equal steps of
brightness, which is what makes the neutral ramp read as evenly spaced.

The catch: OKLCH can express colours sRGB cannot. Two of the first-draft accent
values (`signal-dim` at chroma 0.12, `signal-wash` at 0.06) were **outside the
sRGB gamut**. A browser silently clips those, so the colour reasoned about is
not the colour on screen — and any contrast ratio calculated from the spec is
fiction. Both were pulled in to 0.10 and 0.045 respectively.

Contrast was then computed properly: OKLCH → linear sRGB → 8-bit → WCAG
relative luminance. The build output confirms Tailwind emits exactly the hex
values that maths was done on (`--color-void:#060b0f`, `--color-signal:#45e8e8`).

Every text token clears AA (4.5:1) against all three background tokens; most
clear AAA. Full table is in the comment at the top of `app/globals.css`.

> On a wide-gamut display, Tailwind serves a `lab()` value instead of the hex
> fallback, which renders slightly more saturated. The stated ratios are the
> sRGB ones, i.e. the conservative case.

### Type: Geist + Geist Mono

Kept from the scaffold rather than swapped, for reasons worth stating since it
was a real choice:

- Both are **variable** fonts — one file covers the whole weight range, so a
  full type scale costs two requests total.
- They are a designed pair, so mono labels sit next to sans headings without a
  metrics mismatch.
- `next/font` self-hosts them and generates a metric-matched fallback, so there
  is no request to Google at runtime and no layout shift.

The honest caveat: Geist is Vercel's own family and a developer will recognise
it as the Next.js default. The audience here is service-business owners, who
will not. If it ever reads too generic, swapping it is a change to two lines in
`globals.css` and one import in `layout.tsx` — **no component names a typeface**,
they all go through `--font-sans` / `--font-mono`.

### The type scale sets four properties at once

`--text-h1` carries `--text-h1--line-height`, `--text-h1--letter-spacing` and
`--text-h1--font-weight` alongside it. That is Tailwind v4 modifier syntax, and
it means `text-h1` produces a fully-formed heading. A heading cannot end up
half-styled because someone forgot the tracking.

Sizes are `clamp(mobile, preferred, desktop)`. **The first number is the mobile
size**, which is the one that was designed first.

### `--color-*: initial`

This wipes Tailwind's default palette. After it, `bg-zinc-800` is not a class.
It is a deliberate constraint: the tokens become the only way to put colour on
the page, so the system cannot erode one hurried commit at a time. Cost: no
escape hatch. Undo by deleting that single line.

### `SiteConfig` is annotated, not `as const satisfies`

First attempt used `as const satisfies SiteConfig`. That compiles, but `as const`
narrows `phone: null` to the *literal* type `null`, so `site.phone !== null`
narrows the other branch to `never` and the Footer failed to type-check on
`site.phone.e164`. Same for `social: []`, which narrowed to `readonly []`.

`export const site: SiteConfig = {...}` is correct here: the annotation keeps the
declared (wide) types, so `null` is a *current value*, not a permanent fact
about the config. `as const satisfies` is the right tool when you want literal
inference; it is the wrong tool for config whose values are expected to change.

### Mobile menu: disclosure with a focus trap

The panel is rendered **only while open**, so its links are never in the tab
order while hidden — the single most common keyboard bug in a mobile nav. The
trade-off, accepted: there is an open animation but no close animation.

The focus cycle includes the toggle button, not just the panel. The toggle *is*
the visible close control, so Shift+Tab off the first link should land on it
rather than escape to the page behind the overlay.

Focus is restored to the toggle only when the user **dismissed** the menu —
Escape, or tapping the toggle. When a link was followed, navigation gets to
decide where focus goes, so the menu does not yank it back. That is what the
`restoreFocusRef` flag is for; without it, clicking an anchor link would steal
focus away from the section just navigated to.

A `matchMedia` listener closes the menu if the viewport widens past `md`.
Without it, the body scroll lock would survive with no visible menu to close.

### Open state is derived, not synced

The first version held `open` as a boolean and used an effect to close the menu
when `pathname` changed. ESLint's `react-hooks/set-state-in-effect` flagged it,
correctly: calling `setState` in an effect body costs a second render pass on
every navigation.

It is now stored as `openPath` — *the path the menu was opened on* — with
`open = openPath === pathname`. A route change closes the menu as a consequence
of rendering, with no effect and no extra pass. Worth internalising as a general
move: when state must "reset on X", storing X alongside it is usually cheaper
and less bug-prone than watching X and resetting.

Known limitation: the menu is a disclosure with a trap, not `role="dialog"`.
A screen-reader user in browse mode can still read the page behind it. The
robust fix is `inert` on `<main>`, which needs the header to know about content
it does not own. Revisit if it matters.

### Two separate crawler blocks

`app/robots.ts` stops crawling. The `robots: { index: false }` in
`app/layout.tsx` stops indexing. **These are different things** — a URL
discovered from an external link can be indexed without ever being crawled, and
robots.txt alone will not prevent that. Both are on, and both come off together
at launch.

### Verified, not assumed

- `next build` passes, TypeScript clean, 5 static routes.
- Compiled CSS was inspected to confirm the text modifiers, named spacing keys
  (`px-gutter`, `py-section-lg`), `max-w-content` and the `@utility` blocks all
  generate as intended, and that the stock palette is genuinely absent.
- Generated `/robots.txt` is `User-Agent: *` / `Disallow: /`.
- The menu animation compiles inside `@media (prefers-reduced-motion:no-preference)`.

Lighthouse is not reported this phase — per `BUILD_PROMPT.md` it starts at
Phase 3, and there is no real content to measure yet.

---

## Phase 2 — The content layer

Types and data only, no components. Three modules plus one compile-time test.

### `@ts-expect-error` is an assertion, not a suppression

`content/work.type-test.ts` is the interesting file. It contains four
deliberately-wrong `CaseStudy` values, each preceded by `@ts-expect-error`, plus
one correct value as a positive control. Nothing imports it; it exists purely to
be type-checked.

The point is that `@ts-expect-error` **requires** the next line to fail. If
someone adds an optional `results?` to `CaseStudyBase` — the exact change that
would quietly defeat the union — those lines start compiling, the directives go
unused, and TypeScript raises `TS2578: Unused '@ts-expect-error' directive`.
So the build breaks whether the guarantee is violated *or* removed.

Both directions were verified rather than assumed:

```
# results block on a launched case study
content/work.ts(102,5): error TS2353: Object literal may only specify known
  properties, and 'results' does not exist in type
  'CaseStudyBase & { status: "launched"; launchedAt: string; }'.

# optional results? added to CaseStudyBase
content/work.type-test.ts(29,3): error TS2578: Unused '@ts-expect-error' directive.
```

The positive control matters as much as the failures. Without it, the tests
would still "pass" if the type became impossible to satisfy at all.

### Pricing is structured, not a string

`ServicePricing` is `{ build: PriceBand; monthly?: PriceBand }` with amounts as
numbers, rather than a pre-formatted `"$3,500–9,000"`. Two reasons: the Phase 8
`Service` JSON-LD needs real numbers, and the optional `monthly` models the
actual shape of the offer — a build cost plus a retainer for the automations,
build-only for the website.

`formatPriceBand` / `formatPricing` live in `content/services.ts` rather than in
a component. Still data-only — they are pure functions, no JSX — but it means
Phases 3 and 4 cannot drift into two different ways of writing a price.

### FAQs are tagged by service

`FaqItem.services` lists which service pages a question also belongs on, so
Phase 4's "FAQ subset" is a filter rather than a second hand-maintained list.
Empty array means homepage only. `faqsForService(slug)` does the filtering.

Answers deliberately contain **no prices**. The pricing section is the single
place numbers live; repeating them in the FAQ creates a second copy to keep in
sync, and the stale one is always the FAQ.

### What was not invented

- **All three case studies are `status: "launched"`** with `images: []` and no
  testimonial field at all. No placeholder quotes, no sample metrics, no
  greyed-out example rows.
- **`launchedAt` is the literal string `"TODO: confirm launch date"`** for all
  three. I do not know the real dates, and `AGENCY_SITE_COPY.md` lists the
  Savoretti launch as only *targeted* for the week of 2026-09-20 — so it may not
  have shipped at all. A loud placeholder beats a plausible-looking wrong date;
  Phase 5 renders this field, so it cannot hide.
- **Every price is calibrated from the competitor ladder** in
  `AGENCY_SITE_COPY.md`, which makes them proposals, not decisions. Same for the
  "three to six weeks" timeline in the FAQ. Both are the owner's call and both
  are logged in CONTENT_TODO.md as confirm-before-Phase-3.

### Phase 2 revisions (2026-09-21)

Owner corrections after reviewing the content layer. Recorded here because the
*reasons* matter more than the diffs.

**One case study, not three.** Only Above All Tent Rentals is actually live
(2026-08-20). GC Kuts was built and deployed to a Vercel URL but the client
never launched it; John Savoretti Realty has not launched. Neither is live
client work, so neither goes on the site — they are logged in CONTENT_TODO.md,
GC Kuts as a build to reference on a call, Savoretti to re-add the day it ships.

`CaseStudyBase` gained a required `problem` field. With one case carrying the
whole work page, "what was built" alone is a receipt rather than a story. The
constraint on that field is written into its doc comment: the category and the
job to be done are fair game, invented client history is not.

Two knock-on consequences worth noting:

- The PageSpeed 64 problem got *worse*, not better. Above All is now the only
  proof on the site, and it scores 64 mobile on the exact metric this business
  sells. Escalated in CONTENT_TODO.md.
- `launchedAt` is now ISO 8601 (`"2026-08-20"`), not the `08/20/26` it was given
  as. Display formatting belongs at render; ambiguous date strings in data are
  how a site ends up showing August to Americans and nothing to anyone else.

**Eight services, no bundle.** The offering is modular — one primary service
plus seven add-ons bought when they start earning — so a fixed "full package"
tier would misrepresent how it is actually sold. Phase 3 section 7 is therefore
one table of all eight with build and monthly columns, not three named tiers.

`ServicePricing` had to grow to stay honest about real offers:

- `MonthlyPricing` is a union. Most services are `{ kind: "flat" }`, but Google
  Ads is `{ kind: "greater-of", minimum: 500, percent: 15 }`. Forcing that into
  a number would be a lie and forcing it into a string would put an
  unformattable price in the data.
- `buildTypical` narrows the website's `$1,500–5,000` to where most projects
  actually land (`$2,500–4,000`). Publishing the wide band alone is technically
  true and practically useless.
- `passThrough` exists so "ad spend is paid directly to Google and never marked
  up" and "Twilio usage is billed at cost" are *data*, not something a component
  might forget to render. These are trust signals; burying them is the exact
  behaviour the positioning is defined against.
- `notThis` carries the anti-sell — Social Content Engine is explicitly not
  "we run your social media".

**The `ServiceSlug` union earned its keep.** Renaming two services broke
`content/faq.ts` at compile time in four places, naming each stale tag. A
`string` type would have shipped four FAQ entries silently attached to services
that no longer exist.

**The audit is free.** No paid entry point anywhere. One `primaryCta` plus one
`ctaMicrocopy` in `content/site.ts`, so every CTA on the site says the same
words and the micro-copy cannot drift between sections.

---

## Phase 3 — Homepage (sections 1–4)

Hero, Problem, What we build, Before/After. Sections 5–10 follow.

**Lighthouse mobile: performance 98, accessibility 100, best practices 96.**
Measured against `next build` + `next start`, mobile form factor, Lighthouse
13.5. Numbers and caveats in the phase summary.

### Everything is a Server Component except one island

The only `"use client"` on the page is `LeadJourneyChain`. The hero's heading,
subheading, CTAs and trust line are server-rendered HTML with no JavaScript
attached, which is what keeps LCP at 1.6s — the largest element paints without
waiting on hydration.

### The chain is four states and one interval

`setInterval` advancing a single `cursor`, with `% (steps.length + 1)` so there
is an extra beat where all four are lit before the loop restarts. That pause is
what makes it read as a completed journey rather than a spinner.

Only `transform` and `opacity`/colour animate. The connector fills with
`scaleX`/`scaleY` from a `transform-origin`, never by animating width or
height — a width animation would run layout on every frame of every cycle, for
the entire time the page is open.

### Reduced motion is handled in JS, because CSS cannot reach it

The global `prefers-reduced-motion: reduce` backstop in `globals.css` kills CSS
transitions and animations. It cannot stop a `setInterval` from advancing React
state, so the chain checks the preference itself and renders all four steps in
their settled state without ever starting the timer.

`lib/usePrefersReducedMotion.ts` uses `useSyncExternalStore` rather than
`useState` + an effect. Subscribing to a browser API is what it is for, it
avoids the extra render pass that `set-state-in-effect` flags, and it keeps
following the setting if the visitor changes it with the page open.

Verified both ways rather than assumed, by sampling the DOM under
`--force-prefers-reduced-motion`:

```
motion allowed, t=500ms  -> dots lit: 1/4
motion allowed, t=2000ms -> dots lit: 2/4
motion allowed, t=3500ms -> dots lit: 3/4

reduced motion,  t=500ms  -> dots lit: 4/4
reduced motion,  t=2000ms -> dots lit: 4/4
reduced motion,  t=3500ms -> dots lit: 4/4
```

All four labels are in the server HTML regardless, so the no-JavaScript case
also shows the whole chain.

### Before/After reads from the services, not from home.ts

`content/home.ts` lists four `ServiceSlug`s; the copy comes from
`content/services.ts`. The same pair therefore cannot say one thing on the
homepage and another on the service page. `home.ts` also references
`site.primaryCta`, `site.ctaMicrocopy` and `site.trustPoints` instead of
restating them.

### Running Lighthouse here took some setup

Worth recording so the next person does not repeat it. This WSL box has no
Chrome, no `unzip`, and no passwordless sudo, so:

1. `@puppeteer/browsers` and `npm i puppeteer` both fail — no zip archiver.
2. Chrome for Testing's `chrome-headless-shell` zip extracts fine with
   Python's `zipfile` (restore the exec bit afterwards, `zipfile` drops it).
3. It then fails on missing `libnspr4`/`libnss3`. Those come from `.deb`s
   fetched with `apt-get download --print-uris`, unpacked with `dpkg-deb -x`
   into a local directory, and pointed at with `LD_LIBRARY_PATH`. No root.

Chrome lives in the scratchpad, not the repo, and nothing was added to
`package.json`.

One WSL trap: Lighthouse reads `LOCALAPPDATA` for its temporary Chrome
profile, and under WSL interop that variable holds a *Windows* path. Lighthouse
takes it literally and creates a directory in the current working directory
named `C:\Users\...\lighthouse.12345678`, backslashes and all. Three of them
landed in the repo root and had to be deleted before committing. Run Lighthouse
with `LOCALAPPDATA` and `TMPDIR` pointed somewhere outside the repo, or check
`git status` afterwards.

### Phase 3 design fixes (2026-09-21)

**The background seam.** The `trace-grid` texture lived inside the hero, so it
started *below* the 80px header and drew a hard horizontal line across the top
of the page. It now lives in `app/layout.tsx` as an out-of-flow element pinned
to `top-0` with a negative z-index, so it runs continuously from y=0 behind the
transparent header — and it covers every route, not just the homepage.

**The hero panel is now a vertical system readout.** The horizontal dot row
read as decoration. As a bordered panel with a header, four rows (icon tile,
title, detail line, status chip) and a footer counting manual steps, it reads
as a screenshot of working software, which is the actual claim.

Everything from the old implementation carried over: one client island, one
`setInterval`, transform-and-colour only, the extra beat where all four are lit
before the loop restarts, all labels in the server HTML, and reduced motion
rendering every row lit and static. Re-verified after the rebuild:

```
motion allowed, t=500ms  -> rows lit: 1/4     reduced -> 4/4 at every sample
motion allowed, t=2000ms -> rows lit: 2/4
motion allowed, t=3500ms -> rows lit: 3/4
```

**The active-nav indicator is imperative on purpose.** A 20px underline that
moves with `translateX`. Its position is measured from layout, so it is written
straight to the element through a ref rather than held in state — putting a
measured pixel value into state would re-render the whole header every time the
reader scrolls past a section heading, to move one small bar. Width is constant
so only `transform` and `opacity` ever animate.

Which item is active comes from an IntersectionObserver with
`rootMargin: "-80px 0px -75% 0px"`, which shrinks the viewport to a band just
below the header. Whatever section sits in that band is the active one, so at
most one matches at a time and there is no scroll arithmetic anywhere. A real
route match (`/work`) beats an anchor match, so it stays underlined regardless
of scroll position.

**Prices came off the service cards.** Cards sell the outcome; the price is
disclosed in the pricing section and on each service page. To keep that as
sequencing rather than concealment, the section says plainly that every price
is published further down, and links to it.

### Two tables, one DOM

The pricing and comparison tables are real `<table>` elements at `md` and up.
Below that, the table elements are switched to `display: block` so each row
becomes a card, the column headers are hidden, and each cell carries its own
label instead.

The alternative — a card list for mobile and a table for desktop — means the
same content in the DOM twice, which doubles the maintenance and gives screen
readers two copies of it. One DOM, two layouts.

### The FAQ ships no JavaScript

Native `<details>`/`<summary>`. Correct expand/collapse semantics, keyboard
operation and screen-reader announcement for free, and the browser's own
in-page search finds answers inside collapsed sections. Left uncontrolled, so
more than one can be open — closing someone's answer because they opened
another is not a feature.

### Proof sits next to the CTA

The case study also appears beside the closing button, in its honest
"results tracking in progress" state. Someone deciding at the bottom of the
page will not scroll back up to check whether the work is real.

### Lighthouse mobile, full page

Performance **96**, accessibility **100**, best practices 96. LCP moved 1.6s to
2.6s when the page went from four sections to ten; total transfer is 233 KiB,
of which 52 KiB is the two webfonts. Still clear of the ≥90 floor, with less
headroom than before — worth remembering when Phase 7 adds motion.

A `.gitignore` entry now covers chrome-launcher's `C:\Users\...` temp profiles,
since setting `LOCALAPPDATA` alone did not stop them appearing in the repo.

---

## Phase 3 fixes — rhythm, banding, fonts (2026-09-21)

### The section gap was 2x the token, and the token was not the problem

Measured before touching anything, via CDP against a production build:

```
1440px   token 128px   actual gap between adjacent sections  256px
390px    token  64px   actual gap between adjacent sections  128px
```

Every adjacent pair applies both sections' padding, so the gap a reader sees is
always the sum. Tightening the token alone would have kept the doubling and
just made every band cramped.

After tightening to `clamp(3.5rem, 7vw, 6rem)` / `clamp(5rem, 10vw, 8rem)` and
banding the page:

```
1440px   192px standard, 224px at the two act breaks   (mean 199px)
390px    112px standard, 136px at the two act breaks   (mean 117px)
```

The doubling is still there and is now correct: the padding is a band's
internal breathing room, and the boundary is the hairline border, not the empty
space. `--spacing-section-lg` is reserved for the hero and the close.

### One Section component owns the band rhythm

`tone` ("void" | "surface"), `size` ("default" | "lg"), `divider`, `bleedTop`.
Every homepage section routes through it. Band backgrounds as per-section
classes would be ten files' worth of alternation state that nothing enforces —
the same argument as the content layer, applied to layout.

The texture renders on void bands only. That is what makes the alternation read
as a change of material rather than a slight change of grey.

### Two Tailwind traps, both of which fail silently

Both cost real time, and both produce *no error at all* — just a missing style.

1. **A class assembled at runtime is never generated.** Tailwind finds classes
   by scanning source text; it does not execute the code. `` `pt-[calc(${spacing}+5rem)]` ``
   never appears in the file as a complete string, so the utility is never
   emitted and the element simply gets no padding. Variants now come from
   lookup tables of whole class names.

2. **`calc()` requires whitespace around `+`.** In a Tailwind arbitrary value
   that means underscores: `pt-[calc(var(--spacing-section-lg)_+_5rem)]`.
   Written without them the declaration is invalid CSS and the browser drops
   it — the same silent zero.

The hero's top padding was 0px from both bugs at once, which is only visible if
you measure. It is 208px at 1440px now (128px band + 80px header).

### Fonts: measured, and the answer was not the one expected

The LCP element is the **hero subheading paragraph**, set in Geist Sans —
identified with a CDP probe rather than guessed. Geist Mono is not the LCP face;
it was only competing for bandwidth.

Findings:

- Both faces already use `font-display: swap`; Lighthouse's `font-display`
  audit passes and fonts are not render-blocking.
- Geist Sans is a **single variable file spanning `font-weight: 100 900`**.
  We render 400, 500 and 600 out of that one file, so there are no unused
  static weights to remove — the axis is inherent to the file.
- next/font generates `@font-face` rules for cyrillic, greek, vietnamese and
  latin-ext too, but `unicode-range` means they are never fetched for this
  content. They cost disk, not bandwidth.
- **Both faces were preloaded**, putting a non-LCP face in the highest priority
  band alongside the one face LCP waits on.

Lighthouse mobile LCP, repeated runs because single runs vary by ±0.6s:

```
baseline (both preloaded)  2.50 2.45 2.47                    median 2.47s
mono preload: false        2.48 1.89 1.89 2.43 1.88 2.52     median 2.16s
mono removed entirely      2.35 1.71 2.37                    median 2.35s  (n=3)
```

Shipped `preload: false` on Geist Mono. It is free, keeps the designed face,
and improves the median by ~0.3s. Note the distribution is **bimodal** — runs
land near either 1.89s or 2.45s, which looks like a race between the mono
request and the sans finishing. It does not reliably break 2s.

Hard character-subsetting was attempted and measured rather than assumed:
subsetting Geist Mono's latin file to 107 characters gives **22.57 KiB →
14.26 KiB, 36.8%**. Only 8.3 KiB, because a variable font's axis data and
hinting dominate, not glyph count. That is not worth committing a font binary,
an OFL notice and a missing-glyph hazard for, so it was not shipped — the
numbers are recorded here so the decision can be revisited.

(`pyftsubset` is unavailable here — no pip, no venv, no root. The measurement
used the `subset-font` npm package in the scratchpad, which is harfbuzz/WASM
and needs no system libraries.)

### No unsourced numbers anywhere

The hero panel's "0.4s" is now `AUTO`, matching the other three rows. A panel
styled as live instrumentation is the context most likely to make a number read
as a real reading, which is exactly why one should not sit there unsourced.

---

## Phase 4 — Service pages

`app/services/[slug]/page.tsx`, eight pages prerendered from
`content/services.ts`. Lighthouse mobile on `/services/website-design-build`:
performance **98**, accessibility **100**, best practices 96.

### Next 16 async params, for real this time

```tsx
export default async function ServicePage(props: PageProps<"/services/[slug]">) {
  const { slug } = await props.params;
```

Three things worth internalising:

- **`params` is a Promise.** The synchronous destructure that worked in Next 15
  is removed in 16, not deprecated. `generateMetadata` gets the same Promise
  and must await it too.
- **`PageProps` is a generated global — never import it.** It is emitted into
  `.next/types` by `next build`/`next dev`. It is also route-aware: the string
  literal is checked against the real directory, so a typo in
  `PageProps<'/services/[slgu]'>` fails to compile, and `params` is typed
  `Promise<{ slug: string }>` without anyone writing that type out.
- **`generateStaticParams` is the exception** — it *returns* plain objects and
  is not async-params-based.

### `dynamicParams = false`

The catalogue is a fixed list in the repo; there is no runtime source of new
slugs. Without this, an unknown slug would be rendered on demand, which is only
ever a way to serve a page for a service that does not exist. With it, the
router 404s before any of our code runs.

`notFound()` is still called after the lookup, because that is what narrows
`Service | undefined` to `Service` for the rest of the component. Verified:
`/services/does-not-exist` returns 404, the eight real slugs return 200.

### The pricing model paid off here

Every awkward case renders from the same three fields, with no special-casing
in the page:

```
website-design-build   $1,500–5,000   $150/mo    + "Most projects land $2,500–4,000"
google-ads-management  No setup fee   $500/mo or 15% of ad spend, whichever is greater
custom-ai-automation   from $1,500    No monthly
```

`passThrough` renders directly beneath the price, which is the point of it
being data rather than a note someone remembers to add.

### FAQ coverage was a real gap

`faqsForService` returned nothing for Get Found on Google, Google Ads
Management and Social Content Engine — three pages that would have shipped with
no objection handling. Fixed by tagging existing questions where they genuinely
apply rather than writing filler: account ownership is the sharpest question
for a Google Business Profile and an ad account, both of which agencies
routinely hold hostage. Every service now has at least one.

The section is still conditional, so a service with no tagged questions omits
it rather than rendering an empty heading, and the closing band flips tone to
keep the alternation correct either way.

### Footer services column

Generated from `content/services.ts` in the Footer; only its heading lives in
`content/site.ts`. Listing the eight services again in config would have been a
second list to forget to update — the comment in `site.ts` that promised this
for Phase 4 is now fulfilled rather than left as a lie.

---

## Copy and hero pass (2026-09-22)

### The type now enforces "enough copy"

Each service carried one problem sentence and one before/after pair, which is
not enough to sell anything. `symptoms` and `beforeAfter` are now required and
typed `AtLeastThree<T> = readonly [T, T, T, ...T[]]`, so a thin service is a
build error rather than something noticed on the live page:

```
content/services.ts(343,5): error TS2322:
  Type '[string, string]' is not assignable to type 'AtLeastThree<string>'.
  Source has 2 element(s) but target requires 3.
```

Changing `beforeAfter` from one object to a list broke both consumers at
compile time, which is the point of putting it in the type rather than in a
convention.

### The writing rules live in the file

`content/services.ts` opens with the rules the copy has to meet — contractor in
a truck cab, scenes from his day rather than properties of his website, real
numbers and times, second person, and a banned-words list. They are in the
module because that is where someone editing the copy will be, not in a doc
they would have to know exists.

### The swap test caught two real problems

The brief's test: read any two services' symptoms back to back, and if they
could be swapped without anyone noticing, rewrite. Running it found two things
that would have shipped:

- **"Four hundred" was doing duty on two services** — four hundred finished
  jobs (Reviews) and four hundred photos (Social). A reader who visits both
  notices the echo, and a repeated number starts to read as invented. Social is
  now two thousand photos.
- **Website Refresh's slowness symptom duplicated Website Design & Build's.**
  Both said the site is slow on a phone. Refresh now names the cause —
  four-megabyte photos straight off a camera — which is the thing that makes it
  a refresh rather than a rebuild.

Worth keeping as a habit: the test only works if you actually run it on the
finished copy, and it found problems that reading each page alone did not.

### Nine services

Website Refresh added ($800–2,000 build, $150/mo care, one to two weeks). The
AI chatbot was folded into AI Lead Response rather than listed separately —
two similar AI products side by side makes a buyer freeze, so that service now
covers answering questions as well as qualifying and booking. Seasonal content
refresh became an included benefit of the $150/mo site care rather than a line
item.

### The hero fills the viewport

`min-h-svh`, not `min-h-screen`. `svh` is the *small* viewport height, which
excludes mobile browser chrome — `100vh` on a phone is taller than what you can
see, so a "full height" hero built on it is always slightly cut off.

Content is distributed rather than stacked: the main grid takes the slack with
`flex-1`, and the trust line is pushed to the bottom edge with `mt-auto`.
Measured at 1440×900 the hero is exactly 900px with the trust line ending at
773px, so the only space below it is the band's own bottom padding. That
required a `contentClassName` prop on `Section`, since the inner wrapper has to
grow for anything inside it to be distributed.

### One hover treatment, not ten

`@utility lift` in globals.css: border to `--color-line-interactive`,
background to `--color-surface-raised`, 150ms. Applied to service cards, work
cards, pricing rows, comparison rows and the hero panel's rows.

It is one utility for the same reason band tones live in `Section` — a hover
written out per component drifts, and half the page ends up feeling inert while
the other half responds. `--surface-raised` reads as one step up from both band
tones, so a single definition works on cards sitting on either.

The global reduced-motion backstop collapses the duration, so the hover still
works for those users and simply arrives instantly.
