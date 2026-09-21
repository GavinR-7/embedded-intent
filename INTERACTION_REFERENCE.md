# Interaction & Motion Reference

A working reference for high-craft interactive websites. Drop this in a repo root
and point Claude Code at it when building a site that needs real motion design.

Assembled from analysis of nine reference sites, 2026-09-09.
React Bits section added 2026-09-20.

---

## Reference sites

| Site | Platform | Why it's here |
|---|---|---|
| [alexbeigeweb.dev](https://www.alexbeigeweb.dev/) | Webflow | Draggable SVG scenery, layered depth collage, marquees, card→detail expansion, budget-qualifier form |
| [cadence.care](https://www.cadence.care/) | Webflow | Fabricated product UI as hero, animated feature tabs, count-up stats, cited endnotes |
| [sabrinatian.com](https://sabrinatian.com/) | Hand-coded static HTML | Filter chips + live count, two-tier work display, theme toggle |
| [biocreativeindex.com](https://www.biocreativeindex.com/) | Webflow + Finsweet | Filter/sort/paginate directory, random-sort fairness, letter-by-letter SVG wordmark |
| [couple3films.com](https://www.couple3films.com/) | Webflow | Vimeo `?background=1` video-as-thumbnail grid, tabbed work section |
| [coffeehousepress.org](https://coffeehousepress.org/) | Shopify | Per-region native-language CTAs, real alt text, quiz as engagement mechanic |
| [studiolanzy.com](https://www.studiolanzy.com/) | Photofolio | Flat image-first nav, on-demand PDF portfolio generation |
| [georginajoyce.com](https://georginajoyce.com/) | WordPress (Salient) | Masonry lightbox gallery. Least technically interesting of the set. |

---

## The stack for this kind of work (Next.js)

```
lenis                    smooth/inertia scroll — biggest single "feel" upgrade
gsap + ScrollTrigger     scroll-scrubbed timelines, pinning
framer-motion            layout animations, layoutId (free FLIP), useScroll
split-type               split text into lines/words/chars for staggered reveals
@react-three/fiber       only when you actually need WebGL
matter-js                2D physics playground (draggable objects)
```

Rule of thumb: Framer Motion covers 80% of what you need in React. Reach for GSAP
when you need scroll-scrubbed timelines or pinning, which Framer does badly.

---

## Technique catalog

### 1. Inertia scroll (Lenis)
The single change that most makes a site feel "designed." Scroll gets weight and
glides to a stop instead of snapping.

```tsx
"use client";
import Lenis from "lenis";
import { useEffect } from "react";

export function SmoothScroll({ children }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1 });
    let raf: number;
    const tick = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);
  return <>{children}</>;
}
```

Caveats: breaks native anchor scrolling (use `lenis.scrollTo`), can fight with
`position: sticky`, and must be disabled for reduced-motion users.

### 2. Mouse parallax (lerped)
Layers translate by mouse offset scaled by depth. The lerp is the effect —
without smoothing it looks cheap.

```tsx
"use client";
import { useEffect, useRef } from "react";

export function ParallaxLayer({ depth = 0.02, children }) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: PointerEvent) => {
      target.current = {
        x: (e.clientX - innerWidth / 2) * depth,
        y: (e.clientY - innerHeight / 2) * depth,
      };
    };

    let raf: number;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      if (ref.current) {
        ref.current.style.transform =
          `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [depth]);

  return <div ref={ref}>{children}</div>;
}
```

Use 3-5 layers with depths from ~0.01 (far) to ~0.06 (near). Animate `transform`
only — never `left`/`top`, which trigger layout on every frame.

### 3. Interactive background — three tiers

**Tier 1 — CSS variable spotlight.** Write pointer position to CSS custom
properties, use them in a radial gradient. Near-zero cost.

**Tier 2 — 2D canvas particle field.** Array of points, distance check against
cursor, push away, spring back with a stiffness constant. ~100 lines, no
dependencies, runs on any device. Most "wow" backgrounds are actually this.

**Tier 3 — WebGL fragment shader.** react-three-fiber, full-screen quad, `uMouse`
and `uTime` uniforms. Noise fields, fluid distortion, displacement. Highest
ceiling, highest cost. Do this once, on a site you own.

Always gate tiers 2 and 3 behind `prefers-reduced-motion` and skip them on mobile.

### 4. Infinite marquee
Duplicate the content enough times to overfill the viewport, translate the track,
reset on loop. Confirmed in the raw HTML of both alexbeigeweb.dev (20 copies) and
cadence.care (3 copies) — there's no trick beyond duplication.

Advanced version: multiply speed by scroll velocity so it accelerates and skews
when the user scrolls fast.

### 5. Text reveal by line / word / char
`split-type` wraps each unit in a span; animate with a stagger. Wrap lines in an
overflow-hidden parent so they slide up from behind a mask rather than fading.

### 6. Card → detail expansion (FLIP)
Framer Motion gives this free: put the same `layoutId` on the collapsed card and
the expanded panel. It measures both, inverts the delta, and plays the transform.

### 7. Custom cursor / magnetic buttons
Cursor: a fixed element lerping toward pointer position. Magnetic: on
`pointermove` within a button's bounding box, translate the button toward the
cursor by a fraction of the offset; reset on leave.

Always keep the real cursor visible or provide an obvious alternative — hiding it
breaks accessibility and mobile has no cursor at all.

### 8. Count-up stats
IntersectionObserver fires once when the element enters view, then rAF
interpolates from 0 to the target over ~1.5s with an ease-out curve.

### 9. Video as thumbnail
`player.vimeo.com/video/ID?background=1` — strips controls, autoplays, loops,
mutes. Turns a grid of stills into a living page for near-zero build cost.
Self-hosted equivalent: `<video muted loop playsinline autoplay preload="metadata">`.

### 10. Filter / sort / paginate collection
The directory pattern. Components: multi-select tag chips, sort control, live
result count, clear button, empty state, pagination. Random sort as a default is
a fairness mechanism for directories and listing sites.

Same component shape as MLS property listings.

---

## React Bits (reactbits.dev)

Open-source library of ~200 animated React components. Not an npm dependency —
a registry. The CLI copies the component's **source file into your repo**, and
from that moment it's your code: no `react-bits` package in `package.json`,
nothing to break when they publish a new version, nothing to remove if the site
disappears.

Works with Vite, Next.js, Astro, Remix. Maintained by David Haz.

### Installing

Every component page shows a copy-ready command. Two registries work:

```bash
# shadcn registry — use this one if the project already has shadcn
npx shadcn@latest add @react-bits/SplitText-TS-TW

# jsrepo — works anywhere
npx jsrepo add https://reactbits.dev/ts/tailwind/TextAnimations/SplitText
```

Four variants of every component, pick at the top of the code tab:
**JS-CSS, JS-TW, TS-CSS, TS-TW.** For our stack always take **TS-TW**
(TypeScript + Tailwind).

You can also just click the Code tab and paste manually. Same result.

### Dependencies

There is no shared runtime. Each component pulls what it needs directly:

| Dependency | Used by | Weight |
|---|---|---|
| `gsap` + `@gsap/react` | most text animations | moderate, tree-shakes |
| `ogl` | most WebGL backgrounds | ~50kb, plus shader compile + a live rAF loop |
| `motion` / framer-motion | some Components | moderate |
| none | a fair number of Components and Micro | free |

The dependency list is printed at the bottom of each component page. Check it
**before** installing, not after.

### The four free categories

- **Text Animations** (~30) — Split Text, Blur Text, Text Type, Count Up,
  Scroll Reveal, Gradient Text, Shiny Text, Decrypted Text, Rotating Text
- **Animations** (~35) — cursor effects, Electric Border, Logo Loop, Click Spark,
  Magnet, Pixel Transition, Glare Hover, Gradual Blur
- **Components** (~45) — Card Nav, Pill Nav, Dock, Stepper, Carousel, Masonry,
  Spotlight Card, Tilted Card, Profile Card, Scroll Stack, Magic Bento, Stack
- **Micro** (~32) — small interaction primitives: Flip Card, Swipe Row,
  Hold Button, Spring Check, Status Mark, Voice Pill
- **Backgrounds** (~55) — Aurora, Silk, Particles, Beams, Dot Grid, Plasma,
  Galaxy, Liquid Chrome, Hyperspeed, Threads, Iridescence. Mostly WebGL.

Pro tier ($) adds page Blocks, App UI, full templates and agent skills. The
component library above is the free part and is enough.

### Using it with Claude

Each component page has a **"Copy for AI"** button that yields a
model-readable description of the component, its props and its dependencies.
There is also an **MCP server** (docs at `reactbits.dev/get-started/mcp`) that
exposes the whole registry to an agent.

Workflow that works:

1. Browse reactbits.dev, pick the specific component by name.
2. Run its CLI command yourself so the source lands in `components/` — don't
   ask an AI to reproduce it from memory, it will hallucinate the props.
3. Paste the "Copy for AI" output into Claude Code and say what you want
   changed — colors to the brand, speed, trigger, removing a prop.

Naming the component is the whole trick. "Use React Bits `CardNav` and
`SplitText`" is a precise instruction; "make it animated" is not.

### Where these actually belong

**Portfolio / agency site — yes.** This is a site whose product is taste. A
WebGL background, one orchestrated text reveal, and a distinctive nav are doing
real sales work there.

**Client service-business sites — one accent, maybe.** Count Up on a stats row,
Logo Loop for a partner strip, a Spotlight Card on a services grid. That is the
ceiling. Re-read "When NOT to use any of this" below before adding a second one.

**Never on a client site:** WebGL backgrounds, custom cursors, page-wide
scroll-jacking. They cost LCP, they cost mobile battery, and the customer is a
homeowner on a three-year-old Android trying to find a phone number.

### Component-by-component notes

- `SplitText`, `BlurText`, `ScrollReveal` — the safe ones. GSAP-based,
  self-contained, respect an intersection threshold.
- `CountUp` — worth taking even on a lead-gen site. "1,200 jobs completed" is
  proof, and the animation makes the eye stop on it.
- `LogoLoop` — replaces the hand-rolled marquee in §4 above.
- `CardNav`, `PillNav`, `StaggeredMenu`, `Dock` — nav components. Test keyboard
  focus before shipping; several of these are mouse-first.
- WebGL backgrounds (`Aurora`, `Silk`, `Particles`, `LiquidEther`, `Galaxy`) —
  budget ~50kb + a permanent rAF loop. Lazy-load with `next/dynamic`
  `{ ssr: false }`, and render a static gradient fallback under
  `prefers-reduced-motion` and at mobile widths.
- `MagicBento`, `SpotlightCard`, `ChromaGrid` — good for a services or work grid.
  `SpotlightCard` is Tier-1 cheap (CSS variables), the other two are heavier.

### Rules for this repo

1. TS-TW variant, always.
2. Component source goes in `components/reactbits/` so it's obvious what was
   vendored and what was written.
3. Read every file before committing. It's our code now, which means we own the
   bugs — and we can't claim to understand a site we pasted.
4. Check the dependency list first. If a single hover effect wants `ogl`, write
   it by hand instead.
5. Re-theme it. Default props are React Bits' brand colors and easing. A
   component shipped at defaults reads as a template on someone else's site.
6. Verify the license in the repo before using a component on a paid client
   build.

---

## Structural ideas worth stealing

**Two-tier work display** (sabrinatian.com) — 4 selected projects with full
treatment, then an "Archive — 16 more" numbered text list with title, location,
tags only. Handles a large body of work without padding the top or hiding things.

**Fabricated product UI as hero** (cadence.care) — instead of a screenshot,
float realistic UI fragments in space. Shows the product working, no demo needed.

**Animated proof per feature** (cadence.care) — each feature tab has its own
small animated demonstration rather than an icon. Motion that explains rather
than decorates.

**Cited claims** (cadence.care) — every stat carries a numbered endnote to a
source. Animation everywhere, every number defensible.

**Role credits on portfolio items** (alexbeigeweb.dev) — "creative direction by
X, design by Y, development by me." Builds trust and lets you show collaborative
work honestly.

**Native-language CTAs per region** (coffeehousepress.org) — costs nothing, reads
as deeply considered.

**Quiz as engagement mechanic** (coffeehousepress.org) — a book-matching quiz as
a lead device. Directly transferable: "which treatment is right for you" for a
med spa, and an obvious hook for a chatbot upsell.

**On-demand PDF export** (studiolanzy.com) — generate a portfolio PDF from live
content.

**Live pipeline diagram as hero** (cantandodigital.com, 23creativestudio.io) —
both render the lead's journey as an animated chain (lead captured → AI
qualifies → routed → review request) with a "0 manual steps" counter. Sells a
system rather than a service, and the animation is doing the explaining.

**Before/after pairs instead of a feature list** (cantandodigital.com) — "a lead
comes in at 8:40pm, someone sees it at 9:15 the next morning" / "an AI assistant
replies in under a minute." Concrete scenarios beat capability bullets.

**Pricing published on the page** (both) — cantandoDigital lists build ranges in
its FAQ; 23creativeStudio has three named tiers with dollar figures and calls it
out explicitly as a differentiator: no discovery call needed to find out if you
can afford it. Filters tire-kickers before they reach a call.

---

## The restraint rule

These sites do NOT fade-and-slide-up every section. Each picks one or two
orchestrated moments and keeps everything else quiet and disciplined. Motion on
every card, every section, every hover is the single clearest tell of a
generated or templated page.

Spend boldness in one place.

---

## When NOT to use any of this

Every reference site above is a portfolio or brand site for a business that sells
taste. None is a lead-gen site for a local service business.

For a contractor, dentist, or HVAC company: fast load, phone number above the
fold, local SEO. Lenis + GSAP + WebGL hurts all three. Heavy motion belongs on
personal sites, agency sites, and clients whose product is aesthetics.

---

## Quality floor (non-negotiable on any build)

- `prefers-reduced-motion: reduce` respected on every animation
- Animate `transform` and `opacity` only; never `left`, `top`, `width`, `height`
- Visible keyboard focus states, never removed
- Real cursor stays usable
- Test on a mid-range Android over throttled network, not just a laptop
- Check Lighthouse LCP and CLS after adding motion, not before