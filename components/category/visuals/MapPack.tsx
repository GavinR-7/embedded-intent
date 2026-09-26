"use client";

import { useEffect, useState } from "react";

import { heroVisuals } from "@/content/heroVisuals";
import { useInView } from "@/lib/useInView";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const { query, heading, youLabel, competitors } = heroVisuals.getFound;

/** Four positions, two seconds each: one loop of the climb is eight seconds. */
const STEP_MS = 2000;
const STEPS = 4;

/**
 * Filled stars for "your business", one entry per step.
 *
 * Shapes, never a number. A printed "4.8" beside a business on a page selling
 * search visibility is a claim; four and a half drawn stars in a picture
 * captioned "illustration" is a drawing. See the header of
 * content/heroVisuals.ts.
 */
const YOUR_STARS = [3, 4, 4, 5] as const;

/** Fixed, so the competitors are not implied to be getting worse. */
const COMPETITOR_STARS = [4, 4, 3] as const;

/** Pin positions on the map, as percentages. Invented; there is no place here. */
const PINS = [
  { x: 33, y: 52 },
  { x: 63, y: 28 },
  { x: 48, y: 72 },
  { x: 79, y: 60 },
] as const;

function Stars({ filled }: { filled: number }) {
  return (
    <span aria-hidden="true" className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <svg
          key={index}
          viewBox="0 0 10 10"
          className={`h-2 w-2 transition-colors duration-[var(--duration-slow)] ease-precise ${
            index < filled ? "fill-signal" : "fill-line-strong"
          }`}
        >
          <path d="M5 0.5 6.3 3.6 9.6 3.9 7.1 6.1 7.9 9.4 5 7.6 2.1 9.4 2.9 6.1 0.4 3.9 3.7 3.6Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * /get-found — the map pack.
 *
 * A stylized map beside a results list. "Your business" starts fourth and
 * climbs to first over four steps as its rating fills in and its pin brightens,
 * then the whole thing resets. Eight seconds a loop.
 *
 * The rows are absolutely positioned and moved with `translateY`, not reordered
 * — reordering is a layout change and cannot be animated, and this is the whole
 * point of the picture. One row height, four multiples of it, one transition.
 *
 * The map is four straight roads and a couple of blocks. There is deliberately
 * no real geography in it, and there are no real business names: see the header
 * of content/heroVisuals.ts for why that matters here more than anywhere else
 * on the site.
 *
 * Under `prefers-reduced-motion: reduce` it renders the finished frame — first
 * place, full rating — and no interval is ever started. Offscreen, the interval
 * stops.
 */
export default function MapPack() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();

  const [step, setStep] = useState(0);

  // Reduced motion gets the end of the story rather than the beginning of it:
  // a static picture of a business sitting fourth is not what this illustrates.
  const shown = prefersReducedMotion ? STEPS - 1 : step;

  useEffect(() => {
    if (prefersReducedMotion || !inView) return;
    const id = setInterval(() => setStep((current) => (current + 1) % STEPS), STEP_MS);
    return () => clearInterval(id);
  }, [inView, prefersReducedMotion]);

  /** Your rank counts down from fourth to first as the step goes up. */
  const yourRank = STEPS - 1 - shown;

  const rows = [
    { key: "you", label: youLabel, stars: YOUR_STARS[shown], rank: yourRank, you: true },
    ...competitors.map((label, index) => ({
      key: label,
      label,
      stars: COMPETITOR_STARS[index],
      // Competitors keep their order and shuffle down around you.
      rank: index < yourRank ? index : index + 1,
      you: false,
    })),
  ];

  return (
    <div ref={ref} className="flex h-full w-full flex-col bg-void">
      {/* The query bar. */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="h-3 w-3 shrink-0 stroke-ink-subtle"
          fill="none"
          strokeWidth="1.5"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" strokeLinecap="round" />
        </svg>
        <span className="truncate font-mono text-[0.55rem] text-ink-subtle">
          {query}
        </span>
      </div>

      {/* The map.
          Invented, and it has to be: a recognizable street layout would be a
          real place, and a real place beside a search result implies a real
          search. Two arterials on the diagonal, three cross streets, a river,
          and a few blocks. `xMidYMid slice` rather than `none` — stretching a
          drawing of roads to fit turns the strokes into a table. */}
      <div className="relative h-[46%] shrink-0 overflow-hidden border-b border-line bg-surface/40">
        <svg
          viewBox="0 0 100 34"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <g fill="var(--color-line)" opacity="0.35">
            <rect x="6" y="3" width="16" height="8" rx="0.5" />
            <rect x="44" y="20" width="20" height="9" rx="0.5" />
            <rect x="76" y="4" width="18" height="7" rx="0.5" />
          </g>

          {/* The river. */}
          <path
            d="M-4 26 C 16 23, 26 31, 46 28 S 82 18, 104 23"
            fill="none"
            stroke="var(--color-signal-wash)"
            strokeWidth="3"
            opacity="0.8"
          />

          <g fill="none" stroke="var(--color-line-strong)" strokeLinecap="round">
            {/* Arterials. */}
            <path d="M-4 9 L 104 19" strokeWidth="1.3" />
            <path d="M26 -4 L 52 38" strokeWidth="1.3" />
            {/* Cross streets. */}
            <path d="M0 16 H100" strokeWidth="0.6" opacity="0.7" />
            <path d="M72 -4 V38" strokeWidth="0.6" opacity="0.7" />
            <path d="M40 -4 L 24 38" strokeWidth="0.6" opacity="0.7" />
          </g>
        </svg>

        {PINS.map((pin, index) => {
          const mine = index === 0;
          return (
            <span
              key={index}
              aria-hidden="true"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full font-mono transition-colors duration-[var(--duration-slow)] ease-precise ${
                mine
                  ? "flex h-[1.1rem] w-[1.1rem] items-center justify-center bg-signal text-[0.5rem] font-semibold text-void ring-4 ring-signal/20"
                  : "block h-2.5 w-2.5 bg-line-strong"
              }`}
            >
              {mine ? yourRank + 1 : ""}
            </span>
          );
        })}
      </div>

      {/* The results list. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center px-3 py-2.5">
        <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink-subtle">
          {heading}
        </p>

        <div
          style={{ "--row-h": "1.75rem" } as React.CSSProperties}
          className="relative mt-2 h-[calc(var(--row-h)*4)]"
        >
          {rows.map((row) => (
            <div
              key={row.key}
              style={{ transform: `translateY(calc(var(--row-h) * ${row.rank}))` }}
              className="absolute inset-x-0 top-0 flex h-[var(--row-h)] items-center gap-2 motion-safe:transition-transform motion-safe:duration-[var(--duration-slow)] motion-safe:ease-out-expo"
            >
              <span
                className={`w-3 shrink-0 font-mono text-[0.55rem] tabular-nums ${
                  row.you ? "text-signal" : "text-ink-subtle"
                }`}
              >
                {row.rank + 1}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-[0.6rem] ${
                  row.you ? "font-medium text-ink" : "text-ink-muted"
                }`}
              >
                {row.label}
              </span>
              <Stars filled={row.stars} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
