"use client";

import { useEffect, useState } from "react";

import { IconTile } from "@/components/ui/icons";
import type { IconName } from "@/components/ui/icons";
import { useInView } from "@/lib/useInView";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Dwell time per row. Slow enough to read the detail line before it moves on. */
const STEP_MS = 1500;

/** Dwell time per ticker line. Long enough to read six words. */
const TICKER_MS = 3000;

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
 * different data — that generalization is the only reason it lives in ui/
 * rather than sections/.
 *
 * Rows illuminate top-down in sequence, with an extra beat where all of them
 * are lit before the loop restarts — that pause is what makes it read as a
 * completed cycle rather than a spinner.
 *
 * Hand-built: CSS transforms and two pieces of state. No WebGL, no canvas, no
 * animation library. The connector between rows fills with `scaleY` from
 * `transform-origin: top`, never by animating height — a height animation
 * would run layout on every frame, for as long as the page is open.
 *
 * Two things stop it being a permanent tax on the main thread:
 *
 *   - Under `prefers-reduced-motion: reduce` every row renders lit, the ticker
 *     shows one line, and neither interval ever starts. Handled here in JS
 *     rather than CSS because the sequencing is JS-driven, and the global CSS
 *     backstop cannot reach a `setInterval`.
 *   - Offscreen, both intervals stop. On the homepage this panel is above the
 *     fold of a 13,000px page, so for almost all of a reader's time on it there
 *     is nothing to animate.
 *
 * Every label is in the server HTML, so the panel is complete and readable with
 * no JavaScript at all.
 */
export function SystemPanel({
  title,
  statusLabel,
  rows,
  footerStat,
  footerChain,
  footerTicker,
  reveal = false,
}: {
  title: string;
  statusLabel: string;
  rows: readonly PanelRow[];
  /** "Manual steps required ....... 0" */
  footerStat?: { label: string; value: string };
  /** The compounding outcome, as a chain of short phrases. */
  footerChain?: readonly string[];
  /**
   * Example events, cycled one at a time in the footer.
   *
   * Illustrations, not activity: no client names, no counts, no timestamps.
   * A panel styled as live instrumentation is the last place to put something
   * a reader could mistake for a real reading.
   */
  footerTicker?: readonly string[];
  /** Opt into the scroll reveal. Off in the homepage hero, on below the fold. */
  reveal?: boolean;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();

  const animating = !prefersReducedMotion && inView;

  // rows.length is the extra "all complete" beat before the loop restarts.
  const [cursor, setCursor] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!animating) return;

    const id = setInterval(
      () => setCursor((current) => (current + 1) % (rows.length + 1)),
      STEP_MS,
    );
    return () => clearInterval(id);
  }, [animating, rows.length]);

  const tickerLength = footerTicker?.length ?? 0;

  useEffect(() => {
    if (!animating || tickerLength === 0) return;

    const id = setInterval(
      () => setTick((current) => (current + 1) % tickerLength),
      TICKER_MS,
    );
    return () => clearInterval(id);
  }, [animating, tickerLength]);

  // With reduced motion, everything is simply done.
  const isComplete = (index: number) => prefersReducedMotion || index < cursor;
  const isLit = (index: number) => prefersReducedMotion || index <= cursor;

  return (
    <div
      ref={ref}
      data-reveal={reveal ? "" : undefined}
      /* Stops the pulsing status dot as well as the two intervals. The dot is a
         CSS keyframe loop, so gating the intervals in JS was not enough — it
         kept repainting for the whole 13,000px of page below it. */
      data-paused={inView ? undefined : ""}
      className="overflow-hidden rounded-card border border-line bg-surface/60"
    >
      {/* Panel header */}
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
        <span className="text-eyebrow font-mono uppercase text-ink-subtle">{title}</span>

        <span className="ml-auto flex items-center gap-2">
          {/* The dot sits with the status word it qualifies. Opacity and
              transform only — animating a box-shadow would repaint a blurred
              area every frame, forever. */}
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-signal motion-safe:animate-[pulse-dot_2s_var(--ease-precise)_infinite]"
          />
          <span className="text-eyebrow font-mono uppercase text-signal">
            {statusLabel}
          </span>
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

      {footerTicker && footerTicker.length > 0 && (
        <div className="border-t border-line px-5 py-3">
          {/*
            The visible line is aria-hidden and the full list is offscreen text
            instead. A region whose contents change every three seconds is
            either announced over and over or ignored, and neither is useful —
            so assistive tech gets all four examples at once, statically, and
            the animation is decoration on top of that.
          */}
          <ul className="sr-only">
            {footerTicker.map((event) => (
              <li key={event}>{event}</li>
            ))}
          </ul>

          <p
            aria-hidden="true"
            /* `key` is the point: changing it remounts the element, which
               replays the entrance animation. A transition cannot do this,
               because the text and the animation change at the same instant. */
            key={footerTicker[tick]}
            className="truncate font-mono text-eyebrow text-ink-subtle normal-case tracking-normal motion-safe:animate-[ticker-in_var(--duration-slow)_var(--ease-out-expo)]"
          >
            {footerTicker[tick]}
          </p>
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
