# Embedded Intent

The website for [Embedded Intent](https://www.embeddedintent.com), a one-person web development and AI automation business for service businesses on Long Island and in New York.

## The problem

A small service business needs a fast site that says what it does, shows real work, and turns a visit into an enquiry. The agency site has to be an example of that, so it is held to the same bar it sells: fast on a phone, honest about results, and every claim traceable.

## What's here

- Home, three category pages (`/websites`, `/get-found`, `/ai-automation`), 11 service pages, company, FAQ, work (case studies) and contact.
- A free-audit request form: zod validation, a honeypot, and delivery by Resend (`app/api/audit/route.ts`).
- All copy lives in typed modules under `content/`; components hold no business facts.

## Design decisions

- **Results can't be invented.** Case studies are a TypeScript discriminated union on `status` (`content/work.ts`). A `launched` case study has no `results` field at all, so the compiler refuses a number that was never measured. A `measured` one needs a before value, an after value and a stated source per result. `content/work.type-test.ts` fails the build if someone loosens the type.
- **Three literal category routes** instead of one dynamic segment, so unknown URLs still 404 instead of rendering a shell. The reasoning is in [ARCHITECTURE.md](ARCHITECTURE.md).
- **Motion is restrained**: one IntersectionObserver reveal runtime, the LCP element never reveals, only transform and opacity animate, and reduced motion is respected ([MOTION.md](MOTION.md)).
- Decisions and rejected experiments are logged with reasons in [BUILD_NOTES.md](BUILD_NOTES.md).

## Quality bar and how it is checked

`npm run verify` runs, in order: typecheck, lint, build, a mobile-overflow check at 360 / 390 / 430 px on every route, full-page screenshots, and Lighthouse (mobile) on every route. It writes a summary table to `verify-output/summary.md` for pasting into a PR, and exits non-zero if anything fails.

Measured with that command: Lighthouse mobile at 98 or above on the main routes, CLS 0 (source: `npm run verify` output, per the project's business brief). Lighthouse mobile LCP varies by about ±0.6 s run to run here, so use `VERIFY_LH_RUNS=3` before quoting a number elsewhere.

## Stack

Next.js 16 (App Router), React 19, TypeScript (`strict`), Tailwind CSS v4 (CSS-first config), Resend, zod, deployed on Vercel.

## Run it

Requires Node 20+.

```bash
npm install
cp .env.example .env.local   # RESEND_API_KEY, AUDIT_TO_EMAIL, AUDIT_FROM_EMAIL
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Standard Next.js |
| `npm run typecheck` | `next typegen` then `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run check:mobile` | Horizontal-overflow check at 360 / 390 / 430 px |
| `npm run screenshots` | Every route at 390 and 1440 px |
| `npm run verify` | All of the above plus Lighthouse |

`verify` needs a Chrome or chrome-headless-shell binary (`CHROME_BIN`, or a Playwright install). Other knobs are documented at the top of `scripts/verify.mjs`.

## Docs

[ARCHITECTURE.md](ARCHITECTURE.md) · [BUILD_NOTES.md](BUILD_NOTES.md) · [MOTION.md](MOTION.md) · [LAUNCH.md](LAUNCH.md) · [CONTENT_TODO.md](CONTENT_TODO.md)

## Status

Live. Search-engine indexing is intentionally blocked (`robots.ts` and `noindex`) until the contact form has delivered a real test lead; the block is tracked in [LAUNCH.md](LAUNCH.md).
