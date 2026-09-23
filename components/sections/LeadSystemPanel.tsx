"use client";

import { useEffect, useState } from "react";

import { home } from "@/content/home";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const { title, statusLabel, rows, footerLabel, footerValue } = home.leadSystem;

/** Dwell time per row. Slow enough to read the detail line before it moves on. */
const STEP_MS = 1500;

/* Row icons. Decorative — the title next to them carries the meaning, so they
   are aria-hidden and never the only way to tell rows apart. */
const ICONS: Record<string, React.ReactNode> = {
  // Inbound: something arriving in a tray.
  captured: <path d="M12 3v8m0 0 3-3m-3 3-3-3M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4h-5l-1 2h-4l-1-2H4Z" />,
  // A reply.
  qualified: <path d="M4 5h16v10H9l-5 4V5Zm4 4h8m-8 3h5" />,
  // A calendar hold.
  booked: <path d="M4 6h16v14H4V6Zm0 4h16M9 3v4m6-4v4m-4 8 2 2 3-3" />,
  // The review.
  review: <path d="m12 4 2.3 4.9 5.2.7-3.8 3.8.9 5.4-4.6-2.5-4.6 2.5.9-5.4L4.5 9.6l5.2-.7L12 4Z" />,
};

function RowIcon({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4.5 w-4.5"
    >
      {ICONS[id]}
    </svg>
  );
}

/**
 * The hero visual: the lead system as a panel of working software.
 *
 * Rows illuminate top-down in sequence, with an extra beat where all four are
 * lit before the loop restarts — that pause is what makes it read as a
 * completed cycle rather than a spinner.
 *
 * Hand-built: CSS transforms and one piece of state. No WebGL, no canvas, no
 * animation library. The connector between rows fills with `scaleY` from
 * `transform-origin: top`, never by animating height — a height animation
 * would run layout on every frame, for as long as the page is open.
 *
 * Under `prefers-reduced-motion: reduce` every row renders lit and the interval
 * never starts. That is handled here in JS rather than in CSS because the
 * sequencing is JS-driven, and the global CSS backstop in globals.css cannot
 * reach a setInterval.
 *
 * This is the page's only client component. Every label is in the server HTML,
 * so the panel is complete and readable with no JavaScript at all.
 */
export function LeadSystemPanel() {
  const prefersReducedMotion = usePrefersReducedMotion();

  // rows.length is the extra "all complete" beat before the loop restarts.
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const id = setInterval(
      () => setCursor((current) => (current + 1) % (rows.length + 1)),
      STEP_MS,
    );
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  // With reduced motion, everything is simply done.
  const isComplete = (index: number) => prefersReducedMotion || index < cursor;
  const isLit = (index: number) =>
    prefersReducedMotion || index <= cursor;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface/60">
      {/* Panel header */}
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-signal motion-safe:animate-[pulse-dot_2s_var(--ease-precise)_infinite]"
        />
        <span className="text-eyebrow font-mono uppercase text-ink-subtle">{title}</span>
        <span className="ml-auto text-eyebrow font-mono uppercase text-signal">
          {statusLabel}
        </span>
      </div>

      <ol className="px-5 py-5">
        {rows.map((row, index) => {
          const lit = isLit(index);
          const complete = isComplete(index);
          const isLast = index === rows.length - 1;

          return (
            <li key={row.id} className="lift -mx-2 flex gap-4 rounded-field px-2">
              {/* Left rail: icon tile, then the connector filling the gap down
                  to the next row. The rail stretches to the row's height, so
                  the connector's flex-1 covers exactly the space between. */}
              <div className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-field border transition-colors duration-[var(--duration-base)] ease-precise ${
                    lit
                      ? "border-signal/40 bg-signal-wash text-signal"
                      : "border-line bg-transparent text-ink-subtle"
                  }`}
                >
                  <RowIcon id={row.id} />
                </span>

                {!isLast && (
                  <span aria-hidden="true" className="relative my-1.5 w-px flex-1 bg-line">
                    <span
                      className={`absolute inset-0 origin-top bg-signal transition-transform duration-[var(--duration-slow)] ease-precise ${
                        complete ? "scale-y-100" : "scale-y-0"
                      }`}
                    />
                  </span>
                )}
              </div>

              {/* Row content */}
              <div className={isLast ? "flex-1" : "flex-1 pb-6"}>
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={`text-label font-medium transition-colors duration-[var(--duration-base)] ease-precise ${
                      lit ? "text-ink" : "text-ink-subtle"
                    }`}
                  >
                    {row.title}
                  </p>

                  <span
                    className={`shrink-0 rounded-field border px-2 py-0.5 font-mono text-eyebrow tabular-nums transition-colors duration-[var(--duration-base)] ease-precise ${
                      lit
                        ? "border-signal/40 text-signal"
                        : "border-line text-ink-subtle"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>

                <p className="mt-1 text-eyebrow text-ink-subtle normal-case tracking-normal">
                  {row.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Panel footer — the actual claim. */}
      <div className="flex items-baseline gap-3 border-t border-line px-5 py-4">
        <span className="text-eyebrow font-mono uppercase text-ink-subtle">
          {footerLabel}
        </span>
        <span aria-hidden="true" className="flex-1 border-b border-dotted border-line" />
        <span className="font-mono text-h3 tabular-nums text-signal">{footerValue}</span>
      </div>
    </div>
  );
}
