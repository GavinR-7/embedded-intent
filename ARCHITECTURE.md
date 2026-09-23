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
  work/                 Case study index.
  work/[slug]/          Case study detail. Branches on the CaseStudy union.
  globals.css           The design system. Tokens, base layer, project utilities.
  robots.ts             Generates /robots.txt. Currently blocks everything.
components/
  layout/               Shell chrome used on every page (Header, Footer).
  sections/             Homepage sections. One per section, in page order.
  ui/                   Shared primitives: Section, SectionHeading, Eyebrow,
                        ButtonLink. Small and deliberately option-poor.
  reactbits/            Vendored React Bits components — Phase 7, hard cap of 3.
lib/                    Framework-agnostic helpers (hooks, utilities).
content/                Typed content modules. The single source of truth.
  site.ts               Brand, contact, nav, footer, trust line.
  services.ts           The service catalogue + price formatting helpers.
  work.ts               Case studies. Discriminated union on `status`.
  work.type-test.ts     Compile-time guard for that union. Imported by nothing.
  faq.ts                Objections, tagged by service for per-page subsets.
  home.ts               Homepage section copy.
  servicePage.ts        Static labels shared by all nine service pages.
  workPage.ts           Static labels for /work and /work/[slug].
  audit.ts              The audit offer. Shared by the homepage close, the
                        service pages and the Phase 6 contact page.
public/                 Static assets served at the root.
```

## The content rule

**No hard-coded strings in components.** Copy, service definitions, case
studies, prices and contact details live in typed modules under `content/` and
are imported. A component's job is layout and behaviour; it is not where the
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
  friends do not exist. The tokens are the only colours, so a sixth grey cannot
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

## Server and client components

Everything is a Server Component unless it needs state, effects or browser APIs.
Today exactly one component opts out:

- `components/layout/Header.tsx` — `"use client"` for the mobile menu's open
  state, focus trap, Escape handling and the scroll-state observer.
- `components/sections/LeadSystemPanel.tsx` — `"use client"` for the hero
  panel's step cursor.

Keep that list short. The `Footer` reads the same config and stays on the
server, and so does every homepage section — the hero's text and CTAs ship as
HTML with the animated chain as the only client island inside it.

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
