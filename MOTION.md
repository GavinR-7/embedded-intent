# Motion

Every moving thing on this site, where it lives, and the rules it obeys.

Phase 7 added the motion pass. The reference sites (see `INTERACTION_REFERENCE.md`)
use no GSAP, no smooth-scroll library and no WebGL; their liveliness is scroll
reveals on nearly everything, a few slow ambient loops, one pinned section, and
hover responses. That is exactly what is here.

---

## The four rules

1. **Transform and opacity only.** Those two are the only properties a browser
   can animate on the compositor without laying out or painting the page again.
   Everything else — `height`, `top`, `width`, `background-position`, `filter` —
   costs a layout or a full-area repaint on every frame.
   *One exception, deliberate and documented below: the FAQ.*

2. **Every looping animation pauses when it is offscreen.** Put
   `data-pause-offscreen` on a wrapper; one observer in `MotionRuntime` toggles
   `data-paused` on it, and one rule in `globals.css` stops every animation
   inside. (`SystemPanel` uses `useInView` directly instead, because it has to
   stop two `setInterval`s and CSS cannot reach those.)

3. **Nothing animates against `prefers-reduced-motion: reduce`.** Not "animates
   faster" — does not happen. No translate, no loops, no pin.

4. **Nothing in a hero reveals.** See [The LCP rule](#the-lcp-rule).

---

## Tokens

All of it reads from six values in `app/globals.css`. Change the feel of the
whole site by editing this block, not by hunting transitions.

| Token | Value | What it drives |
| --- | --- | --- |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | every reveal, the nav underline |
| `--ease-precise` | `cubic-bezier(0.4, 0, 0.2, 1)` | hovers, menus, the stepper |
| `--dur-reveal-fade` | `700ms` | a revealing element's opacity |
| `--dur-reveal-move` | `800ms` | a revealing element's travel |
| `--reveal-stagger` | `70ms` | gap between siblings in one section |
| `--reveal-distance` | `18px` | how far a revealing element travels |
| `--duration-menu` | `180ms` | dropdowns, the mobile sheet |

Movement is 100ms slower than the fade on purpose: the element is fully opaque
just before it stops moving, which reads as settling into place rather than
sliding on.

---

## The reveal system

**Files:** `components/motion/MotionRuntime.tsx`, the unlayered block in
`app/globals.css`, the inline script in `app/layout.tsx`.

### Adding a reveal to new content

Put `data-reveal=""` on the element. That is the whole API.

```tsx
<li data-reveal="" className="lift spotlight bg-void p-7">
```

It works because the element is inside a `<Section>`, which renders
`data-reveal-group` on its `<section>`. The runtime numbers every `data-reveal`
element inside each group in document order and writes `--reveal-i`, so an
eyebrow, its heading, its lead and then each card arrive 70ms apart. Nothing has
to know its own index, which is what stops the numbers going wrong the moment
someone reorders two blocks. The index is capped at 6 — an eleven-item list
would otherwise take 770ms to finish arriving.

`SectionHeading` already reveals its three parts. `Eyebrow` takes `reveal` as an
opt-in prop, because it is also used in heroes.

### Three things that will bite you

**Do not put an `opacity-*` utility on a `data-reveal` element.** The reveal
rules are unlayered so they beat Tailwind's utilities layer; an `opacity-40`
would lose, but the two would then be fighting over the same property. Dim
things with color instead. (`translate-*`, `rotate-*` and `scale-*` are safe:
Tailwind v4 compiles those to the separate `translate` / `rotate` / `scale`
properties, which compose with `transform` rather than overwrite it.)

**Do not put `data-reveal` on an ancestor of anything `position: fixed`.** A
`transform` makes an element the containing block for fixed descendants — the
bug that rendered the mobile menu 390×1 in Phase 6, and it applies to
`transform`, `filter` and `backdrop-filter` alike. It is only set while an
element is un-revealed, which is still long enough to break a fixed child.

**Do not reveal anything in a hero.** See below.

### How it fails

The hidden state applies only when `<html>` has `data-reveal-ready`, set by a
four-line inline script in `<head>` that runs during HTML parsing, before first
paint. No JavaScript, a crawler, a Content-Security-Policy that blocks inline
scripts, or a hydration that never finishes all mean the attribute is absent,
the rules never match, and every word is visible. **The failure mode of the
whole system is "no animation", never "no content".**

On top of that: no `IntersectionObserver` reveals everything immediately; an
observer that has not run at all after 3s reveals everything and disconnects;
and an element taller than ~60% of the viewport is revealed on any intersection
rather than at the 0.15 threshold it could never reach.

### The LCP rule

**The hero H1, the hero subheading and the hero CTAs must never carry
`data-reveal`.** They are the largest-contentful-paint candidates, and
`opacity: 0` on the LCP element is the single most effective way to make a fast
page score like a slow one — the metric measures the paint, and the paint would
not happen until an observer fired. `Eyebrow`'s opt-in prop and
`SectionHeading`'s `<h2>` both exist to make the hero the default-safe case.

If Lighthouse's LCP ever jumps, the first thing to check is whether something
near a hero picked up a `data-reveal`.

**The second thing to check is what is being painted behind it.** Phase 7 put
mobile LCP up from 2.01s to 2.67s, and it took a proper bisect to find out why —
three plausible theories were measured and all three were wrong:

| Suspect | Measured median LCP |
| --- | --- |
| baseline, before Phase 7 (5 runs) | **2.11s** |
| everything in Phase 7 | 2.67s |
| …with the reveal system disarmed | 2.66s — *not it* |
| …with the hydration of hidden nav panels deferred | 2.67s — *not it* |
| …with the card spotlight layers not generated | 2.67s — *not it* |
| …with glow + lit grid + marquee removed from the hero | **2.01s** |
| …**ambient glow alone, put back** | **2.64s** |
| …cursor-lit grid alone | 2.02s |
| …industry marquee alone | 2.01s |
| final, glow fading in at 700ms and `md`+ only | **2.01s** |

The whole regression was two `radial-gradient` blobs — the largest painted areas
on the page — being painted during the first paint. Nothing else added in this
phase moved the number at all.

Two things about that worth keeping:

- **Delaying the fade-in only recovered half of it** (2.67s → 2.48s). An element
  with an animation on `opacity` is promoted to its own compositor layer for the
  whole animation *including the delay*, so the browser rasterises it up front
  either way. The rest came from not rendering it below `md` at all.
- **The observed numbers never moved.** Observed LCP is 0.16–0.23s in every run,
  before and after, because the LCP element is the hero subheading and it paints
  with the fallback font at FCP. Lighthouse's mobile figure is *simulated* from
  the critical path, which is why a paint nobody is waiting for can still cost
  0.6s on the report. Both numbers are worth reading; neither on its own.

TBT went down across the phase — **89ms → 64ms** — because everything that loops
now stops when it is offscreen.

### Measure on a quiet machine

Half the "bimodality" in the table above was not the site. The CDP harness used
for the behavioural tests killed only Chrome's parent process, leaving its
zygote and renderer children alive; **31 of them had accumulated by the end of
the session, several holding 20% CPU each**, and every Lighthouse run in that
window inherited the noise. After killing them, the homepage returned 2.01s on
five of six consecutive runs.

So: check `pgrep -c -f chrome-headless-shell` and `/proc/loadavg` before
believing a Lighthouse number, and take the median of at least five runs. The
harness now kills the process group.

### Final, all four routes (Lighthouse mobile, median of 5–6)

| Route | perf | a11y | best practices | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 99 | 100 | 100 | 2.01s | 0 | 64ms |
| `/ai-automation` | 99 | 100 | 100 | 1.86s | 0 | 70ms |
| `/services/get-more-google-reviews` | 98 | 100 | 100 | 1.86s | 0 | 128ms |
| `/contact` | 100 | 100 | 100 | 1.85s | 0 | 64ms |

---

## Catalogue

| Effect | Where | Notes |
| --- | --- | --- |
| Scroll reveals | every route | `MotionRuntime.tsx` — one observer, one-shot |
| Cursor-lit grid | homepage hero | `motion/GridSpotlight.tsx`, `trace-grid-lit` |
| Ambient glow | homepage hero, `md`+ | `ui/AmbientGlow.tsx` — **server**, two blobs, 26s / 34s, fades in at 700ms |
| Industry marquee | homepage hero | `sections/IndustryMarquee.tsx` — **server**, 40s |
| Lead panel sequence | homepage + service heroes | `SystemPanel.tsx` — `setInterval`, paused offscreen |
| Pulsing status dot | same panel | `pulse-dot`, paused offscreen |
| Event ticker | same panel | one line per 3s; full list is `sr-only` |
| Pinned stepper | homepage "How it works" | `ScrollStepper.tsx`, lg+ only |
| Card spotlight | cards and rows everywhere | `spotlight` utility + delegated `pointermove` |
| CTA sheen + arrow nudge | primary buttons | `cta-sheen` utility, one pass per hover |
| Menu enter/exit | nav dropdowns, mobile sheet | `menu-pop` utility |
| FAQ open/close | every FAQ | `faq-item` utility |
| Nav underline | header | imperative `transform` against a ref |

### Notes on the awkward ones

**The pinned stepper** is 70vh of page per step, with a sticky inner panel and
four absolutely-positioned sentinels. An observer with
`rootMargin: "-50% 0px -50% 0px"` collapses its root to a line across the middle
of the viewport, so exactly one sentinel is ever intersecting — the one the
middle of the screen is in. That drives the active step. Sentinels rather than a
scroll listener: the browser does the geometry off the main thread and tells us
four times instead of us asking sixty times a second.

All four steps stay in the DOM, dimmed rather than hidden, so the section is an
ordinary ordered list to a screen reader or a keyboard user.

The pin is gated on `data-pinned`, set by the client component only at lg+ and
never under reduced motion. With JavaScript off there is no attribute, no extra
height and no sticky — pinning in CSS alone would give three screens of scroll
with nothing changing, which is worse than no effect at all.

**The glow and the marquee are Server Components**, which is not where they
started. Both were client components for one reason each: the glow wanted a
boolean for "am I on screen", and the marquee wanted to branch on
`prefers-reduced-motion` in JavaScript. Both jobs moved into CSS — the shared
`data-pause-offscreen` observer, and a `@media (prefers-reduced-motion: reduce)`
block inside the `marquee` utility that hides the duplicate list and lets the
remaining row wrap. That took two client islands, twenty-four list items and
every industry name out of the hydration pass and the JavaScript bundle.

The reason to care is weight, not LCP — the bisect above found the LCP cost was
entirely the glow's paint, not hydration. Keeping two islands out of the bundle
is still worth doing; it just was not what fixed the number.

**The glow does not render below `md`, and fades in at 700ms above it.** Both
are performance decisions with measurements behind them — see the table above
and the comment on `glow-blob` in `app/globals.css`.

**`menu-pop`** exists because a panel React unmounts has nothing left to
animate. The panels stay mounted and `display` does the hiding, which also keeps
their links out of the tab order (verified: 6 links in the DOM, 0 focusable
while closed). Two modern pieces make an animated `display` work —
`transition-behavior: allow-discrete`, which flips `display` at the *end* of the
transition, and `@starting-style`, which supplies the style to animate from on
the first frame an element is displayed. Neither is required; without them the
menu appears and disappears instantly, which is a fine menu.

**The FAQ is the one exception to rule 1.** `::details-content` with
`interpolate-size: allow-keywords` animates `block-size`, which is layout. It is
bounded and worth it: once per click, 400ms, one element — and the alternative
is shipping JavaScript to measure a pixel height and do the same layout work
less reliably. It is wrapped in `@supports selector(::details-content)`, so a
browser without it gets the native instant toggle.

**The headline has no sheen.** A gradient sweeping across "when you can't." can
only be done by animating `background-position`, which rule 1 forbids. The
phrase is picked out in the accent color instead — same job, no motion, and the
headline is painted on the first frame either way. The split is driven by
`hero.headingAccent` in `content/home.ts`, which is found inside `hero.heading`
rather than duplicating it.

---

## React Bits

**Zero components used**, against a budget of three.

Each candidate was a text reveal on the H1 (forbidden by the LCP rule), a
`CountUp` on numeric proof (there is no numeric proof on this site — see
`content/work.ts`), or a background (Tier 1 is 60 lines of CSS and one
`pointermove`). Nothing in the library was better than the hand-written version
for what this site actually needed, so nothing was installed and no dependency
weight was added.

---

## Verifying it

Reduced motion is checked, not assumed. With
`Emulation.setEmulatedMedia` set to `prefers-reduced-motion: reduce`:

- 75 reveal targets, **0 hidden**, **0 with a transform**
- **0** looping animations running anywhere on the page
- marquee replaced by the static wrapped row
- stepper not pinned, no step dimmed
- `scroll-behavior: auto`
- cursor-spotlight listener never attached: no `--spot-x` written, `data-lit`
  never set, layer opacity 0
- card spotlight: no element has tracking variables written

A note on how that was checked, because the first attempt proved nothing:
`chrome-headless-shell` has no pointing device, so it reports `hover: none` and
`pointer: none`, and **every** pointer effect on the site correctly refuses to
run — under reduced motion or not. CDP's `setEmulatedMedia` cannot override
device-capability features, only user preferences. The harness forces them with
`--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4`,
and only then is "the effect is off" a result rather than a tautology.

With hover forced, the positive controls pass too: the cursor-lit grid reports
`data-lit` with a real `--spot-x`, the card glow layer exists on hover and
tracks, and the FAQ was caught mid-animation at `block-size: 61px` with its icon
at 41° on the way to 45°.
