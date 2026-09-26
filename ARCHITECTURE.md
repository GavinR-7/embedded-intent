# Architecture

How this site is put together and where things belong. Updated every phase.

## Stack

| Piece      | Version | Note                                                     |
| ---------- | ------- | -------------------------------------------------------- |
| Next.js    | 16.3.5  | App Router, Turbopack by default (no `--turbopack` flag)  |
| React      | 19.2.8  | Server Components by default                              |
| TypeScript | 5.x     | `strict: true`                                            |
| Tailwind   | 4.3.3   | CSS-first config — **there is no `tailwind.config.js`**   |
| Hosting    | Vercel  |                                                           |

> `BUILD_PROMPT.md` originally said Next 15. Both documents now say 16.3.5.
> The differences that bite are listed under "Next.js 16 specifics" below —
> **read that section before starting Phase 4.**

## Directory layout

```
app/                    Routes. Every file here is a URL or a route convention.
  layout.tsx            Root layout: fonts, <html>/<body>, Header, Footer, skip link.
  page.tsx              / — the homepage, composed from components/sections/.
  services/[slug]/      One page per service, prerendered from content/services.ts.
  websites/             Category landing page. Four lines: metadata + <CategoryPage>.
  get-found/            ditto.
  ai-automation/        ditto. Three literal routes, not one [category] segment —
                        a dynamic segment at the root would try to match every
                        unknown path on the site and render a shell instead of 404.
  contact/              The audit request form.
  api/audit/route.ts    POST endpoint: zod validation, honeypot, Resend.
  work/                 Case study index.
  work/[slug]/          Case study detail. Branches on the CaseStudy union.
  globals.css           The design system. Tokens, base layer, project utilities.
  robots.ts             Generates /robots.txt. Currently blocks everything.
components/
  layout/               Shell chrome used on every page (Header, Footer).
  sections/             Homepage sections. One per section, in page order.
  category/             The shared body of all three category pages, plus the
                        per-category hero illustration. `visuals/` holds the
                        three drawings, loaded with `ssr: false` so they are
                        never on a category page's critical path.
  contact/              The audit form.
  motion/               Client islands that move things. See MOTION.md.
  ui/                   Shared primitives: Section, SectionHeading, Eyebrow,
                        ButtonLink, FaqList, BeforeAfterTable, SystemPanel.
                        Small and deliberately option-poor.
lib/                    Framework-agnostic helpers (hooks, utilities).
  auditRequest.ts       Zod schema + email formatting. Server-only by design.
  grid.ts               Column shapes chosen from an item count, so no grid
                        leaves its last card alone on a row — or an empty cell
                        beside it, which is now visible since grids draw their
                        rules with per-cell shadows.
  heroTimeline.ts       The homepage intro schedule. Two beats are CSS and two
                        are JavaScript, so every start time is derived in one
                        place rather than written down in four.
  useMediaQuery.ts      A media query as state, via useSyncExternalStore.
  useInView.ts          Whether an element is near the viewport. Used to pause
                        every looping animation while it is offscreen.
content/                Typed content modules. The single source of truth.
  site.ts               Brand, contact, the Company menu, footer, trust line.
  primitives.ts         Types shared by more than one content module
                        (AtLeastThree, BeforeAfter), so neither has to import
                        the other.
  categories.ts         The three service categories: slug, nav label, page copy,
                        symptoms, before/after, FAQ ids. CategorySlug is defined
                        here and imported by services.ts, which is what makes a
                        service's `category` a checked reference.
  categoryPage.ts       Static labels shared by all three category pages.
  nav.ts                The primary nav, resolved: five tabs, their panels, and
                        the route prefixes each one owns. Generated from
                        categories.ts + services.ts, not listed anywhere.
  services.ts           The service catalogue + price formatting helpers.
  work.ts               Case studies. Discriminated union on `status`.
  work.type-test.ts     Compile-time guard for that union. Imported by nothing.
  faq.ts                Objections, tagged by service for per-page subsets.
  home.ts               Homepage section copy. The headline is written as
                        lines, because each one rises out of its own mask.
  heroVisuals.ts        Copy for the three category illustrations. Read the
                        header before adding to it: nothing in these drawings
                        may be, or look like, a real business, a real search or
                        a real conversation.
  servicePage.ts        Static labels shared by all nine service pages.
  workPage.ts           Static labels for /work and /work/[slug].
  audit.ts              The audit offer. Shared by the homepage close, the
                        service pages and the Phase 6 contact page.
public/                 Static assets served at the root.
```

## The content rule

**No hard-coded strings in components.** Copy, service definitions, case
studies, prices and contact details live in typed modules under `content/` and
are imported. A component's job is layout and behavior; it is not where the
business's phone number lives.

This is not tidiness for its own sake. It means the copy can be rewritten by
someone who does not read JSX, a service can be renamed in one place, and the
type checker can enforce rules about the content itself — see the `CaseStudy`
discriminated union arriving in Phase 2, which makes it a compile error to show
a performance number for a client we have not measured.

### Types that enforce honesty

`content/work.ts` models `CaseStudy` as a discriminated union on `status`. The
`launched` variant has **no** `results` field, so a performance number cannot be
attached to a client that has not been measured — it is a compile error, not a
code review comment.

```ts
type CaseStudy =
  | (CaseStudyBase & { status: "measured"; results: MeasuredResult[] })
  | (CaseStudyBase & { status: "launched"; launchedAt: string })
```

`MeasuredResult.source` is required and has no default, so a number cannot be
published without stating how it was measured.

Do **not** add an optional `results?` to `CaseStudyBase`. That would make the
compiler stop caring, which is the one job it has here.
`content/work.type-test.ts` fails the build if anyone tries — see BUILD_NOTES.md
for how that guard works.

### Adding a case study

Two steps, and genuinely nothing else:

1. **Add one object to `content/work.ts`.** Pick `status: "launched"` with a
   `launchedAt` date, or `status: "measured"` with `results` — each result
   needing a real before, a real after, and a stated `source`.
2. **Drop its images in `public/work/<slug>/`** and reference them from the
   object's `images` array as `/work/<slug>/<file>`, each with real alt text.

Everything downstream follows from the data: the route is prerendered by
`generateStaticParams`, the `/work` index picks it up and switches from a
single full-width card to a grid at two or more, the homepage work section and
the closing proof card both read the same array, and the detail page renders a
results table or a launch line depending on the status.

This was verified rather than assumed — a second entry was added with no other
file touched, and the new route, the index grid and the homepage all updated on
the next build.

### Nullable over placeholder

`content/site.ts` types contact channels as `string | null`, not as a
placeholder string. A placeholder ships, because nothing stops it. `null` forces
every consumer to handle absence, and the Footer renders a channel only once it
is real. Same principle, applied to contact info instead of results.

## Styling

Tailwind v4 is configured **in CSS**, in the `@theme` block at the top of
`app/globals.css`. Each custom property in that block becomes both a real CSS
variable and a utility class, with the namespace deciding which family:

| Declaration          | Generates                                |
| -------------------- | ---------------------------------------- |
| `--color-signal`     | `bg-signal` `text-signal` `border-signal` |
| `--text-h1`          | `text-h1` (size + leading + tracking + weight) |
| `--spacing-section`  | `py-section` `mt-section` `gap-section`   |
| `--container-content`| `max-w-content`                           |
| `--ease-precise`     | `ease-precise`                            |

Notable decisions:

- **`--color-*: initial` wipes Tailwind's stock palette.** `bg-zinc-800` and
  friends do not exist. The tokens are the only colors, so a sixth grey cannot
  quietly appear. Delete that one line to restore the defaults.
- **Fonts use `@theme inline`** so the generated utility points straight at the
  variable `next/font` defines on `<html>`, rather than one hop away through
  `--font-sans`.
- **Durations live outside `@theme`** (plain `:root`) because they are consumed
  by hand-written CSS transitions and do not need to generate classes.
- Anything that carries meaning uses `--color-line-interactive` (3.1:1+) for its
  boundary. `--color-line` is decorative hairline only and is deliberately below
  the 3:1 bar.

Component-specific CSS that cannot be expressed in utilities goes in a
`*.module.css` beside the component — not in `globals.css`, which is reserved
for the system itself.

**Two Tailwind rules that fail silently**, both learned the hard way:

- **Class names must appear in the source as complete literals.** Tailwind
  scans text, it does not run the code, so a class built from template
  variables is never generated and the element silently gets no style. Use
  lookup tables of whole class names for variants — see
  `components/ui/Section.tsx`.
- **`calc()` needs whitespace around `+` and `-`.** Inside a Tailwind arbitrary
  value that means underscores: `pt-[calc(var(--spacing-section)_+_5rem)]`.
  Without them the declaration is invalid and the browser drops it.

### Band rhythm

`components/ui/Section.tsx` owns every section's background, boundary, texture
and vertical rhythm. Sections alternate `void` and `surface` with a hairline
top border at each transition, and the circuit-trace texture renders on `void`
bands only. Never set a band background on an individual section.

### Motion

**`MOTION.md` is the reference.** Every effect, where it lives, its tokens, how
to add `data-reveal` to new content, and the rule about the hero and LCP.

Three things worth knowing before touching a component:

- **`data-reveal=""` is the whole API.** It works because the element is inside a
  `<Section>`, which renders `data-reveal-group`; one runtime numbers the
  targets in each group and a single IntersectionObserver reveals them.
- **Never put `data-reveal` on an ancestor of anything `position: fixed`.** The
  hidden state is a `transform`, and a transform makes an element the containing
  block for fixed descendants — the bug that rendered the mobile menu 390×1 in
  Phase 6. The same applies to `filter` and `backdrop-filter`.
- **Never put an `opacity-*` utility on a `data-reveal` element.** The reveal
  rules are unlayered so they beat the utilities layer; the two would fight over
  the same property. Dim with color instead.
- **Never rule a grid with `gap-px` on a `bg-line` container.** It looks right
  only while every cell is fully opaque; mid-reveal the container's fill shows
  straight through and the grid is a grey slab. Transparent container with a
  1px border, and `hairline` on each cell.

## Environment variables

`.env.example` lists the names with no values and **is committed**; `.gitignore`
needs the `!.env.example` exception or the `.env*` rule swallows it. Real values
go in `.env.local` (git-ignored) and in the Vercel project settings.

| Variable | Used by |
| --- | --- |
| `RESEND_API_KEY` | `app/api/audit/route.ts` |
| `AUDIT_TO_EMAIL` | where audit requests are delivered |
| `AUDIT_FROM_EMAIL` | sender identity; must be on a Resend-verified domain |

If any is missing the endpoint returns **500 and sends nothing**. It does not
log a warning and return success — a misconfigured deploy that silently eats
every lead while showing a thank-you page is the worst outcome this form has.

## Server and client components

Everything is a Server Component unless it needs state, effects or browser APIs.
The ones that opt out:

- `components/layout/Header.tsx` and `NavDropdown.tsx` — menu state, the focus
  trap, Escape handling, the scroll-state observer, and the active underline.
- `components/ui/SystemPanel.tsx` — the panel's step cursor and event ticker.
- `components/contact/AuditForm.tsx` — submission state and the time-trap stamp.
- `components/motion/*` — one runtime for every scroll reveal and cursor effect
  on the site, plus the hero grid, the scroll stepper and the two letters of
  "AI" that resolve out of noise. `TypeOn` lives here and is *not* a client
  component: the eyebrow types itself on in pure CSS.
- `components/category/visuals/*` — the three category illustrations, each
  loaded with `ssr: false`.

Keep that list short, and keep the copy out of it. `ScrollStepper` takes its four
steps as **props from a Server Component** rather than importing
`content/home.ts`: a client component that imports a content module puts every
word of that module in the JavaScript bundle. Passed as props, the copy ships in
the HTML and the RSC payload only.

Two habits worth keeping, both cheap:

- **Hidden DOM still hydrates.** The nav dropdown panels are about a hundred
  nodes that are `display: none` until a menu opens. They now mount on the first
  pointer or focus anywhere in the header and never unmount after that, so a
  page load does not pay for them.
- **`useEffect` can still run before the first paint.** The reveal system's
  setup — a stagger index written to every target, then ~75 `observe` calls — is
  scheduled inside one `requestAnimationFrame` so it lands after the paint LCP
  measures.

Neither of those was what cost mobile LCP in Phase 7, though it took measuring
to find that out. The answer was a paint, not a script: two large gradient blobs
behind the hero. `MOTION.md` has the bisect table.

## Next.js 16 specifics

Things that differ from Next 15 and from most training data:

- **Turbopack is the default** for `next dev` and `next build`. No flag needed.

- **`params` and `searchParams` are Promises. This is not optional.** The
  Next 15 synchronous-access compatibility period is over — in 16 it is
  removed. The same applies to `cookies()`, `headers()` and `draftMode()`.
  This lands in **Phase 4** (`/services/[slug]`) and **Phase 5**
  (`/work/[slug]`), so write it right the first time:

  ```tsx
  // ✅ Next 16
  export default async function Page(props: PageProps<'/work/[slug]'>) {
    const { slug } = await props.params
  }

  // ❌ Next 15 and earlier — throws in 16
  export default function Page({ params }: { params: { slug: string } }) {
    const { slug } = params
  }
  ```

  `generateMetadata` receives the same Promise and must await it too.
  `generateStaticParams` is the exception: it *returns* plain objects and is
  not async-params-based.

- **`PageProps`, `LayoutProps` and `RouteContext` are generated globals — do
  not import them.** There is no `import type { PageProps } from "next"`; that
  is a type error. They are emitted by `next dev` / `next build` (or
  `npx next typegen`) into `.next/types` and are ambiently available. They are
  also *route-aware*: the string literal is checked against the real directory
  structure, so `PageProps<'/work/[slug]'>` types `params` as
  `Promise<{ slug: string }>` automatically and `PageProps<'/work/[slgu]'>`
  fails to compile. Prefer them over hand-written prop types — they cannot
  drift from the routes.

  Already in use: `app/layout.tsx` takes `LayoutProps<'/'>`.
- `middleware` is now `proxy`. Not used here yet.
- `next/image` defaults changed: `qualities` is `[75]` only, `minimumCacheTTL`
  is 4 hours, and `16` is gone from `imageSizes`. Relevant when case study
  images land.

## Accessibility floor

Enforced from Phase 1, not retrofitted:

- Visible `:focus-visible` ring on everything focusable, set globally.
- Skip link as the first element in the tab order.
- Semantic headings in document order; one `<h1>` per page.
- `prefers-reduced-motion: reduce` honoured by a global backstop in
  `globals.css`, plus per-component static alternatives where the animation
  carries meaning.
- The mobile menu traps focus, closes on Escape and returns focus to its toggle.

## Pre-launch state

The site is **blocked from search engines in two places** and both must be
reverted together at launch — `app/robots.ts` and the `robots` key in
`app/layout.tsx`'s metadata. See CONTENT_TODO.md.
