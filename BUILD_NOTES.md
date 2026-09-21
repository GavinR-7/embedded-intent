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
