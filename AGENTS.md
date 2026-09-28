<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Review guidelines

Used by automated PR reviews (Codex) and by anyone reviewing a change here. Flag
a violation as a blocking issue unless it says otherwise.

## Content and honesty
- All user-facing copy lives in `content/*.ts`. A string literal of visible copy
  in a component (`components/`, `app/`) is a bug. Labels passed as props from
  a content module are fine.
- No invented stats, results, testimonials, client names or logos. A number on
  the site needs a source. Case studies use the `CaseStudy` union in
  `content/work.ts`: `measured` (with a source) or `launched` (no numbers). Do
  not widen that type to get around it.
- Placeholders are visibly labeled and listed in `CONTENT_TODO.md`. No lorem ipsum.
- Prices appear only on service pages, never on cards, category pages or the
  homepage.

## Mobile and performance
- Mobile-first. No horizontal overflow at 360, 390 or 430 px
  (`npm run check:mobile`).
- Lighthouse mobile ≥ 90 on every route (target 95+), CLS 0.
- The LCP element never animates in (no `data-reveal` on it or its ancestors).
- Tap targets ≥ 44px on phones, except links inside running text.
- New dependencies need a reason in the PR description. Anything client-side
  must justify its bundle cost; prefer Server Components and one small
  `"use client"` island.

## Motion (MOTION.md)
- Animate only `transform` and `opacity`. Never width, height, top/left or
  anything that runs layout.
- Everything respects `prefers-reduced-motion: reduce`: content is visible with
  no JavaScript help, loops stop.
- Reveals go through the one runtime in `components/motion/MotionRuntime.tsx`,
  not a new observer per component.

## Code
- TypeScript strict; no `any`, no `@ts-ignore` without a comment saying why.
- Secrets only in environment variables. Nothing that looks like a key, token
  or password in code, docs or tests. New env vars are added by name (no value)
  to `.env.example`.
- The contact/audit form keeps zod validation on the server; never trust the
  client.
- Accessibility: headings in order, real alt text, visible focus, labels on
  every input.
- `robots.ts` and the root layout's `noindex` stay as they are until LAUNCH.md
  says otherwise. A PR that removes the crawler block is blocking unless its
  description says Gavin approved launch.

## Process
- `npm run verify` passes (or, until it exists on `main`: `npm run typecheck`,
  `npm run lint`, `npm run build`, `npm run check:mobile`). Paste
  `verify-output/summary.md` into the PR description.
- Anything new or non-obvious gets a `BUILD_NOTES.md` entry explaining why it
  is done that way.
- Never push to `main`. One topic per PR.
