# Motion

Every moving thing on this site, where it lives, and the rules it obeys.

Phase 7 added the motion pass. The reference sites (see `INTERACTION_REFERENCE.md`)
use no GSAP, no smooth-scroll library and no WebGL; their liveliness is scroll
reveals on nearly everything, a few slow ambient loops and hover responses. That
is exactly what is here.

Phase 7b added the hero intro and the three category illustrations, took the pin
off "How it works", and stopped the marquee pausing on hover.

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

   **That observer scans once per navigation.** Anything that mounts later — a
   `next/dynamic` chunk with `ssr: false`, a panel opened on click — is never
   collected, and its marker sits there doing nothing, which looks exactly like
   it is working. Late-mounting islands use `useInView` and set `data-paused`
   themselves. Both category visuals that needed this had the marker first and
   kept running after their hero scrolled away; it was caught by measuring.

3. **Nothing animates against `prefers-reduced-motion: reduce`.** Not "animates
   faster" — does not happen. No translate, no loops, no pin.

4. **Nothing that the LCP measurement is looking at animates in.** On the
   homepage the LCP element is the hero *subheading*, so that, both CTAs, the
   microcopy and the trust line are painted on the first frame and never move.
   The h1 is not the candidate, so the h1 may animate — and does. See
   [The LCP rule](#the-lcp-rule).

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
| `--dur-type-char` | `25ms` | one character of the hero eyebrow |
| `--dur-caret-blink` | `800ms` | one whole blink of the typing caret |
| `--dur-line-rise` | `700ms` | one headline line out of its mask |
| `--line-stagger` | `120ms` | gap between headline lines |
| `--line-mask-pad` | `0.12em` | descender room inside a line mask |
| `--dur-glitch` | `150ms` | one glitch on the two resolved glyphs |
| `--dur-cell-fade` | `1300ms` | half an ambient grid pulse, up or down |

The five intro values are consumed by CSS *and* by JavaScript, which cannot read
them. `lib/heroTimeline.ts` restates them as numbers and derives every start
time in the sequence from them — so nothing hard-codes "start the scramble at
1525ms", and adding a word to the eyebrow moves the whole schedule correctly.
The duplication is one-directional and both ends say so.

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

### Four things that will bite you

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

**Do not draw a grid's borders with the container.** `gap-px` on a `bg-line`
container is the neat way to rule a grid: fill the container with the line
color, let the opaque cells cover all of it except the 1px gaps. It reads as a
bordered table only while every cell is fully opaque — and a revealing cell is
not. Twelve grids on this site turned into solid grey slabs on the way in, and
on a phone those slabs filled most of the screen while scrolling.

Containers are now transparent with a 1px outer border, and each cell carries
`hairline` (a 1px spread `box-shadow`). Two neighbouring shadows land in exactly
the same 1px strip so they read as one rule, and being part of the cell's own
paint they fade in *with* it. Behind an invisible cell there is now nothing but
the section background. `overflow: hidden` on the container is load-bearing: it
clips the shadows at the outer edges, so the frame is the border and never a
doubled 2px line.

A shadow rather than a border on each cell, because a border would take 1px out
of every cell's content box and shift 200-odd cells' padding by a pixel.

**Do not reveal anything the LCP measurement is looking at.** See below.

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

**Nothing in a hero carries `data-reveal`.** `opacity: 0` on the element the
metric is measuring is the single most effective way to make a fast page score
like a slow one — the metric measures the paint, and the paint would not happen
until an observer fired. `Eyebrow`'s opt-in prop and `SectionHeading`'s `<h2>`
both exist to make the hero the default-safe case.

The LCP element on the homepage is the hero **subheading**, measured. So the
subheading, both CTAs, the microcopy and the trust line are painted on the first
frame and never move. The h1 is *not* the candidate, which is why Phase 7b was
able to give it the masked line rise: that is a transform, and it was measured
before and after (see the Phase 7b row in the table below). If the h1 ever
becomes the largest paint — a much shorter subheading would do it — the rise has
to come off.

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
  whole animation *including the delay*, so the browser rasterizes it up front
  either way. The rest came from not rendering it below `md` at all.
- **The observed numbers never moved.** Observed LCP is 0.16–0.23s in every run,
  before and after, because the LCP element is the hero subheading and it paints
  with the fallback font at FCP. Lighthouse's mobile figure is *simulated* from
  the critical path, which is why a paint nobody is waiting for can still cost
  0.6s on the report. Both numbers are worth reading; neither on its own.

TBT went down across the phase — **89ms → 64ms** — because everything that loops
now stops when it is offscreen.

**Phase 7b hit the same wall from a different direction**, and the finding is
worth more than the fix. The ambient grid pulses started as twelve CSS loops on
`opacity`. They cost about 0.6s, intermittently — and the cost **did not scale
with the count**:

| Suspect | Measured median LCP |
| --- | --- |
| baseline (a532e5a), interleaved, 8 runs | **2.02s**, fast on 8 of 8 |
| Phase 7b with twelve CSS `opacity` loops | 2.62s, fast on 3 of 8 |
| …four cells instead of twelve | 2.70s — *the count is not the variable* |
| …mask removed from the pulse wrapper | 2.48s — *not it* |
| …cells mounted at `requestIdleCallback` | 2.62s, fast on 2 of 5 — *not it* |
| …mounted after `load`, then idle | 2.59s, fast on 1 of 5 — *not it* |
| …`background-color` instead of `opacity` | 2.64s over 12 runs — *not it* |
| …**twelve cells in the DOM, no animation at all** | **2.02s** |
| final: inert cells + a transition + a timer | **2.01s**, fast on 6 of 8 |

Four 63px squares cost what twelve do, so it is not paint. It is that an element
with a running compositable animation is promoted to its own layer, and the
promotion lands inside the window the metric is accounting for. Deferring does
not help, for the same reason the glow's delayed fade-in did not: Lighthouse's
mobile figure is simulated from the trace's critical path, and moving work later
in wall-clock time does not take it off that path. **The only thing that worked
was not having an animation.**

So the pulses are the one effect on this site that is not a CSS loop: inert
cells with a transition, and a `setInterval` that lights one at a time. That is
a deliberate departure from the brief's "pure CSS loops", made because the CSS
version was measured and the JavaScript version is what fits the budget.

### Interleave, or do not believe it

Phase 7b's numbers went bimodal: the same build returned 2.01s on some runs and
2.65s on others, with no pattern in `benchmarkIndex` and nothing obvious on the
machine. Several bisects were run against that and two of the conclusions drawn
from them were wrong.

What settled it was running **baseline and candidate alternately**, one pair at
a time, on the same machine in the same minutes:

```
pair   baseline   candidate
  1      2.04       2.66
  2      2.02       2.63
  3      2.01       2.01
  ...
        8/8 fast   3/8 fast
```

The baseline never flipped. The bimodality was in the build, not the machine —
the opposite of what a single-arm A-then-B comparison had suggested, because the
machine's load had drifted between the two halves of it.

Two rules follow, and they are cheap:

- **Never compare a number taken now against a number taken an hour ago.** Keep
  a worktree of the last commit built and served on another port, and alternate.
  `git worktree add --detach ../base <sha>` plus `cp -al node_modules` is under
  a minute. (Put it outside `/tmp`: Turbopack refuses a `node_modules` symlink
  that points out of the filesystem root.)
- **Count the fast runs, not just the median.** An effect that costs 0.6s on
  five runs in eight has a median of 2.6s and a best case of 2.0s, and the
  median alone hides which one you are looking at.

### Measure on a quiet machine

Half the "bimodality" in the table above was not the site. The CDP harness used
for the behavioral tests killed only Chrome's parent process, leaving its
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
| Scroll stepper | homepage "How it works" | `ScrollStepper.tsx` — no pin, every width |
| Card spotlight | cards and rows everywhere | `spotlight` utility + delegated `pointermove` |
| CTA sheen + arrow nudge | primary buttons | `cta-sheen` utility, one pass per hover |
| Menu enter/exit | nav dropdowns, mobile sheet | `menu-pop` utility |
| FAQ open/close | every FAQ | `faq-item` utility |
| Nav underline | header | imperative `transform` against a ref |
| Eyebrow types on | homepage hero | `motion/TypeOn.tsx` + `type-*` utilities — **server**, no JS |
| Headline lines rise | homepage hero | `line-mask` / `line-rise`, 120ms apart |
| "AI" decrypt + glitch | homepage hero | `motion/DecryptWord.tsx` + `glitch` utility |
| Ambient grid pulses | homepage hero | `GridSpotlight.tsx`, `grid-pulses` / `grid-cell` |
| X-ray lens | `/websites` | `category/visuals/XrayLens.tsx`, `@property` drift |
| Map pack climb | `/get-found` | `category/visuals/MapPack.tsx`, `translateY` rows |
| Phone thread | `/ai-automation` | `category/visuals/PhoneThread.tsx`, frame schedule |

### Notes on the awkward ones

**The stepper is not pinned any more, and that is the Phase 7b change.** It was
280vh of page with a sticky inner panel. Two things were wrong with that, both
visible in a recorded scroll-through: all four steps already fit in one viewport
at 1440, so the pin bought room for nothing and simply held the page still for
three screens; and because the sticky panel started below the header, the
section's own heading scrolled off the top before the first step lit up.

What is left is the part that was working. The page scrolls normally, and one
observer over the four steps with `rootMargin: "-50% 0px -50% 0px"` collapses
its root to a line across the middle of the viewport — so at most one step can
intersect, and it is the one the middle of the screen is in. No "which of these
is most visible" arithmetic, and the browser does the geometry off the main
thread. When the line falls in the gap between two steps nothing intersects and
the last answer stands, which is why the state is only ever written, never
cleared. There is no breakpoint in the component any more.

All four steps stay in the DOM, dimmed to 35% rather than hidden, so the section
is an ordinary ordered list to a screen reader or a keyboard user. Under reduced
motion there is no selection at all: every step is full brightness and the rail
is simply full, because a quarter-filled progress rail beside four equally
bright steps reads as broken.

**The marquee does not pause on hover.** It used to. The strip is ambient, and a
band of text that halts whenever the cursor crosses it draws attention to itself
rather than to the page. It still stops offscreen, and it is still a static
wrapped row under reduced motion.

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

**The headline still has no sheen, and now it rises instead.** A gradient
sweeping across "when you can't." can only be done by animating
`background-position`, which rule 1 forbids; the phrase is picked out in the
accent color instead. What the headline *does* do is rise: each line is wrapped
in its own `overflow: hidden` mask and comes up from `translateY(100%)`, 120ms
apart. Transform only.

The lines are written as lines in `content/home.ts` (`hero.headingLines`) rather
than as one sentence, because a mask has to be a real element and where the
browser happens to wrap a string is not something markup can put a box around.
A line long enough to wrap inside its own mask still works — the mask grows to
two line boxes and both rise together.

`--line-mask-pad` is there because the h1 line-height is 1.05, which is tighter
than the font's ascent plus descent, so a bare `overflow: hidden` shaves the
tail off the "p" in "picks up". The mask is padded by 0.12em and pulled back by
the same amount with a negative margin, and the rise starts 0.12em lower as
well — otherwise the top of a glyph shows in that padding before its turn.

---

## The hero intro

Four beats, scheduled from `lib/heroTimeline.ts`. Two of them are CSS and two
are JavaScript, which is exactly the situation where a sequence drifts, so
nothing writes down a start time: every beat is derived from the durations and
from the content itself.

| # | Beat | How | Starts |
| --- | --- | --- | --- |
| 1 | eyebrow types on | CSS, stepped `clip-path` | 0 |
| 2 | headline lines rise | CSS, `translateY` in masks | 60% through the typing |
| 3 | "AI" resolves out of noise | JS, one interval | when the last line lands |
| 4 | lead panel starts stepping | JS, `startDelayMs` | 60ms after that |

Beat 2 deliberately overlaps beat 1. The eyebrow is 47 characters, which is
1.175s of typing, and a headline still under its mask a second into the page
looks broken rather than composed — starting the rise at 60% means the headline
lands as the last few characters arrive, and it reads as one movement.

**The typing is a Server Component with no JavaScript in it at all.** The full
line is in the HTML from first paint and a stepped `clip-path` wipe uncovers it;
a crawler, a screen reader and a visitor with JavaScript off all get the whole
sentence, and the only thing that can fail is the animation. `clip-path` rather
than the classic animated `width`, which is a layout pass per character.

The caret rides along without either half knowing how wide a character is: the
caret layer is stretched over the text with `inset: 0`, so `translateX(100%)` is
exactly the text's width, and the same stepped timing function puts it on the
wipe boundary every step. It blinks a whole number of times covering the typing
plus about a second, then stops — `forwards` on a finite count, so it ends
hidden rather than pulsing at the reader for the rest of the session.

The step count is the character count, which only works because the line is
monospace with uniform letter-spacing: N equal fractions of the element's width
are N characters. `--type-steps` holds the **whole** timing function
(`steps(47, end)`), not just the number. `steps(var(--n), end)` reads better and
is a trap — if the substitution is ever invalid the property becomes
invalid-at-computed-value-time and silently falls back to `ease`, turning typing
into a smooth wipe with nothing in the console to say so.

**The decrypt is the one place JavaScript is unavoidable** — there is no CSS
that picks a random glyph. The scrambling characters are `aria-hidden` and the
real word sits beside them in a visually-hidden span for the whole life of the
component, so the h1's accessible name is "AI that picks up when you can't."
from first paint to last frame. Verified against the accessibility tree, not
assumed. The first render — the one in the HTML — shows the real word too, so a
failed hydration leaves the correct headline on the page.

Afterwards it glitches for 150ms every 8–10 seconds, at a fresh random interval
each time. The jitter and the two offset slices are transforms; the slices'
`clip-path` and `mix-blend-mode` are static, not animated. **That is the scoped
exception to rule 1**, and it is worth stating how small it is: two
pseudo-elements, two characters wide, for a sixth of a second, once every eight
to ten seconds, and only while the hero is on screen.

**The ambient grid pulses** are twelve cells snapped to the ruling. The
arithmetic is the trick: `trace-grid` draws a 4rem tile at
`background-position: center`, so its lines land at `50% - 2rem + n * 4rem` in
both axes — a cell placed at that offset, a pixel in and a pixel narrower, sits
exactly inside one square at any container size, with no measuring and no
JavaScript. Eight of the twelve are inside the middle 320px so they are on
screen at 390px; the other four are `lg`-only.

They are what the effect is on a phone, where there is no cursor, and what it is
on a desktop before anyone has moved the mouse. While a fine pointer is moving
in the hero the cursor spotlight leads and the pulses fade out; two seconds of
stillness, or the pointer leaving, brings them back. The handoff is a fade on
the container, not a pause on the cells, because pausing mid-pulse leaves a cell
frozen half-lit.

**They are the one effect here that is not a CSS loop, and that is a
measurement, not a preference.** Twelve cells with `animation: … infinite` cost
0.6s of simulated mobile LCP on five runs in eight. The cost did not scale with
the count — four cells cost the same as twelve — because it is not paint. These
are 63px squares. It is that an element with a running compositable animation is
promoted to its own layer, and the promotion lands inside the window the metric
accounts for. So the cells are inert, with a transition and no animation, and a
`setInterval` lights one at a time. Twelve inert cells measured exactly at
baseline. The full bisect is under [The LCP rule](#the-lcp-rule).

---

## The category illustrations

One per category page, replacing the generic circuit texture on those three
heroes only. All three are `next/dynamic` with `ssr: false`, which is why
`components/category/visuals/index.tsx` exists at all — that option is refused
inside a Server Component, so it has to be used from inside a client boundary.

Skipping the server render keeps them off the critical path completely: there is
no illustration in the HTML, so nothing for the first paint to wait on and
nothing for the LCP measurement to look at. The frame, its aspect ratio, the
caption and the `aria-label` are all server-rendered, so the box is the right
size before the chunk arrives (no layout shift) and the figure is described and
captioned even if the chunk never arrives at all.

| Route | Effect | Budget |
| --- | --- | --- |
| `/websites` | a lens that x-rays a finished page | one `mask-image` repaint per frame over ~536×402, paused offscreen |
| `/get-found` | a business climbing the map pack | four `translateY` transitions every 2s, 8s a loop |
| `/ai-automation` | a text thread booking a job | opacity + 6px per message, one `setTimeout` chain |

**The lens** is two stacked layers of the same page with identical geometry —
same three rows, same fixed nav and card heights, same `flex-1` middle, same
gaps. That is the whole idea: the wireframe has to be *under* the finished
thing, not beside it. The finished layer has a hole cut in it by a
`mask-image` centered on `--lens-x` / `--lens-y`, so moving the lens is two
custom properties and nothing else — no layout, no React state, no re-render.

Those two are declared with `@property`, which is what makes them animatable: a
plain custom property is a token stream and the browser has nothing to
interpolate. That is what lets the idle drift be a CSS keyframe (a Lissajous
figure on 17s against 11s, so it does not retrace its own path for over three
minutes) rather than a rAF loop writing two numbers sixty times a second. On a
fine pointer the handler writes them inline and `[data-tracking]` kills the
animation, because an animation beats an inline style.

This is the one effect on the site with a real per-frame paint: a mask repaint
over the figure's box while it is drifting. It is bounded by the box size and
stops the moment the hero leaves the viewport.

**The map pack** moves its rows with `translateY` on absolutely-positioned rows
rather than reordering them, because reordering is a layout change and cannot be
animated — and the climb is the entire point of the picture.

**Nothing in any of the three is data.** No real business names, no real
geography, no counts or ratings printed as numbers (the stars are drawn shapes
for exactly that reason), no real conversation. Every one carries a visible
caption saying so, in the markup rather than in a comment. The reasoning is in
the header of `content/heroVisuals.ts`; it is the rule `content/work.ts`
enforces for results, applied to pictures.

---

## React Bits

**Zero components used**, against a budget of three.

Phase 7's candidates were a text reveal on the H1 (forbidden by the LCP rule at
the time), a `CountUp` on numeric proof (there is no numeric proof on this site
— see `content/work.ts`), and a background (Tier 1 is 60 lines of CSS and one
`pointermove`).

Phase 7b explicitly allowed `DecryptedText` "if its dependency weight is light;
otherwise hand-write it (~40 lines)". It is hand-written, in
`components/motion/DecryptWord.tsx`, and came out at about that. The library
version would have brought a runtime animation library with it (React Bits
builds that component on `motion`), which is a dependency this site does not
otherwise have, for an effect on two characters. The weight was not measured,
because the decision did not turn on it: forty lines of `setInterval` and
`Math.random()` do the job, and the rule is to say what a dependency is for and
what it weighs before adding one. Nothing else in the library was better
than the hand-written version for what this site needed, so nothing was
installed and no dependency weight was added.

---

## Verifying it

Reduced motion is checked, not assumed. With `Emulation.setEmulatedMedia` set to
`prefers-reduced-motion: reduce`, on the homepage:

- **0** running animations anywhere on the page
- **0** elements with a transform
- marquee: `animation: none`, `flex-wrap: wrap`, duplicate list `display: none`
- stepper: no step marked active, every step at full contrast, rail full
- **0** sticky elements outside the header — there is no pin to disable
- ambient grid pulses: `display: none`
- eyebrow: `clip-path: none`; caret: `display: none`
- pointer effects inert: no `--spot-x` written, `data-lit` never set,
  `data-pointer-active` never set

…and on the three category pages:

- `/websites`: lens animation `none`, `--lens-x` static at its initial 50%
- `/get-found`: the finished frame — first place, full rating, rows in order
- `/ai-automation`: all six messages shown at once, no typing dots

A note on how that was checked, because the first attempt (in Phase 7) proved
nothing: `chrome-headless-shell` has no pointing device, so it reports
`hover: none` and `pointer: none`, and **every** pointer effect on the site
correctly refuses to run — under reduced motion or not. CDP's
`setEmulatedMedia` cannot override device-capability features, only user
preferences. The harness forces them with
`--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4`,
and only then is "the effect is off" a result rather than a tautology.

### Positive controls

A clean check is only good news if it was capable of failing. With motion
allowed:

- cursor-lit grid reports `data-lit` with a real `--spot-x` (520px), and the
  ambient pulses stand down with `data-pointer-active`
- marquee track `playState: "running"` **while the pointer is over it** — the
  hover pause is gone
- stepper, at 1440 and at 390: centering each step in the viewport in turn gives
  `active = 0, 1, 2, 3`, the other three at opacity 0.35, and the rail at
  `scaleY` 0.25 → 0.49 → 0.74 → 0.99
- the glitch, caught mid-flight: `content: "AI"`, the two slices in cyan and red
  and clipped to complementary halves, transformed −5.96px and +5.28px in
  opposite directions, with the word itself jittering −1.33px
- the decrypt, sampled every 120ms: `"<X"`, `"50"`, `"AB"` — noise resolving
  left to right, the "A" locked before the "I"
- the reveal, photographed at 0.1× playback rate on a 390px screen: the six
  cells at opacity 0.92 / 0.83 / 0.65 / 0.29 / 0.29 / 0.29, container background
  `rgba(0, 0, 0, 0)`, and **no grey slab anywhere in the frame**
- FAQ caught mid-animation at `block-size: 61px` with its icon at 41° on the way
  to 45°
- offscreen: every `data-pause-offscreen` wrapper reports `data-paused`, all
  three category figures report zero running animations once scrolled past, and
  the grid pulses report zero lit cells
- the ambient pulses, sampled through a whole cycle on a fine pointer: nothing
  lit before the 2.6s start delay, then one cell lit and two or three mid-fade;
  the layer fades to `opacity: 0` while the pointer moves and is back at `1`
  2.6s after it stops, and again the moment it leaves the hero

### Accessibility, measured against the tree

Not inferred from the markup. `Accessibility.getFullAXTree`:

- the homepage `<h1>`'s accessible name is exactly
  `"AI that picks up when you can't."` — the scrambling glyphs are
  `aria-hidden`, the visually-hidden real word is not double-announced, and no
  ignored node leaks an "AI" into the tree
- each category figure exposes `role: image` with its full description, inside a
  `figure` carrying the visible "Illustration — …" caption

### No empty grid slots

Eleven routes × four widths (390 / 768 / 1024 / 1440), every CSS grid on the
page with two or more visible children: **zero** grids whose last row fails to
reach the container's width. The detector buckets rows by vertical overlap
rather than by an identical top edge (otherwise every `items-center` two-column
layout reads as a defect) and counts the column gaps as part of a row's width
(otherwise every complete row looks short by exactly one gap).

It also has a positive control that injects a 3-column grid with 5 children and
asserts the detector finds it. The first version of this sweep, without those
two corrections, reported 40 false positives and would have hidden a real one.
