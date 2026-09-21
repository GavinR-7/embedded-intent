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
