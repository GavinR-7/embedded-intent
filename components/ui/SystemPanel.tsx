"use client";

import { useEffect, useState } from "react";

import { IconTile } from "@/components/ui/icons";
import type { IconName } from "@/components/ui/icons";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Dwell time per row. Slow enough to read the detail line before it moves on. */
const STEP_MS = 1500;

export type PanelRow = {
  id: string;
  title: string;
  detail: string;
  icon: IconName;
  /** Right-aligned chip. The homepage panel uses it; flow panels don't. */
  status?: string;
};

/**
 * The vertical system readout.
 *
 * Used twice: the homepage hero ("this is what the system does") and every
 * service page hero ("this is what *this* service does"). It takes its rows as
 * props rather than reading a content module, because the two callers pass
 * different data — that generalisation is the only reason it lives in ui/
 * rather than sections/.
 *
 * Rows illuminate top-down in sequence, with an extra beat where all of them
 * are lit before the loop restarts — that pause is what makes it read as a
 * completed cycle rather than a spinner.
 *
 * Hand-built: CSS transforms and one piece of state. No WebGL, no canvas, no
 * animation library. The connector between rows fills with `scaleY` from
 * `transform-origin: top`, never by animating height — a height animation
 * would run layout on every frame, for as long as the page is open.
 *
 * Under `prefers-reduced-motion: reduce` every row renders lit and the interval
 * never starts. Handled here in JS rather than CSS because the sequencing is
 * JS-driven, and the global CSS backstop cannot reach a setInterval.
 *
 * Every label is in the server HTML, so the panel is complete and readable
 * with no JavaScript at all.
 */
export function SystemPanel({
  title,
  statusLabel,
  rows,
  footerStat,
  footerChain,
}: {
  title: string;
  statusLabel: string;
  rows: readonly PanelRow[];
  /** "Manual steps required ....... 0" */
  footerStat?: { label: string; value: string };
  /** The compounding outcome, as a chain of short phrases. */
  footerChain?: readonly string[];
})  {
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
  }, [prefersReducedMotion, rows.length]);

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
                <IconTile name={row.icon} lit={lit} />

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

                  {row.status && (
                    <span
                      className={`shrink-0 rounded-field border px-2 py-0.5 font-mono text-eyebrow tabular-nums transition-colors duration-[var(--duration-base)] ease-precise ${
                        lit ? "border-signal/40 text-signal" : "border-line text-ink-subtle"
                      }`}
                    >
                      {row.status}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-eyebrow text-ink-subtle normal-case tracking-normal">
                  {row.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {footerStat && (
        <div className="flex items-baseline gap-3 border-t border-line px-5 py-4">
          <span className="text-eyebrow font-mono uppercase text-ink-subtle">
            {footerStat.label}
          </span>
          <span aria-hidden="true" className="flex-1 border-b border-dotted border-line" />
          <span className="font-mono text-h3 tabular-nums text-signal">
            {footerStat.value}
          </span>
        </div>
      )}

      {/* The outcome chain. Directions of travel, not measurements — there are
          deliberately no numbers in it. */}
      {footerChain && footerChain.length > 0 && (
        <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line px-5 py-4">
          {footerChain.map((item, index) => (
            <li key={item} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-ink-subtle">
                  →
                </span>
              )}
              <span className="text-eyebrow font-mono uppercase text-signal">{item}</span>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
