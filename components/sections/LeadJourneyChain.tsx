"use client";

import { useEffect, useState } from "react";

import { home } from "@/content/home";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const { steps, counterLabel, counterValue } = home.leadJourney;

/** Dwell time on each step. Slow enough to read the label before it moves on. */
const STEP_MS = 1500;

/**
 * The lead-journey chain.
 *
 * Four states advance in sequence on a loop, with a beat at the end where all
 * four are lit before it starts over — that pause is what makes it read as a
 * completed journey rather than a spinner.
 *
 * Hand-built: CSS transforms and one piece of state. No WebGL, no canvas, no
 * animation library. It costs a single `setInterval` and a `transform`/`opacity`
 * transition per node, both of which the compositor handles without layout.
 *
 * Under `prefers-reduced-motion: reduce` it renders all four states in their
 * settled form and never starts the interval. That is handled in JS rather than
 * CSS because the sequencing is JS-driven — the global CSS backstop in
 * globals.css cannot reach it.
 */
export function LeadJourneyChain() {
  const prefersReducedMotion = usePrefersReducedMotion();

  // `steps.length` is the extra "all complete" beat before the loop restarts.
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const id = setInterval(
      () => setCursor((current) => (current + 1) % (steps.length + 1)),
      STEP_MS,
    );
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  // With reduced motion, everything is simply done.
  const isComplete = (index: number) => prefersReducedMotion || index < cursor;
  const isActive = (index: number) => !prefersReducedMotion && index === cursor;

  return (
    <div className="rounded-card border border-line bg-surface/60 p-6 sm:p-8">
      <ol className="flex flex-col gap-0 lg:flex-row lg:items-start lg:gap-0">
        {steps.map((step, index) => {
          const complete = isComplete(index);
          const active = isActive(index);
          const lit = complete || active;

          return (
            <li key={step.id} className="flex gap-4 lg:flex-1 lg:flex-col lg:gap-3">
              {/* Rail: vertical on mobile, horizontal from lg. The dot and the
                  connector share it so they stay aligned in both directions. */}
              <div className="flex flex-col items-center lg:w-full lg:flex-row">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 shrink-0 rounded-full border transition-colors duration-[var(--duration-base)] ease-precise ${
                    lit
                      ? "border-signal bg-signal"
                      : "border-line-interactive bg-transparent"
                  }`}
                />

                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="relative w-px flex-1 bg-line lg:h-px lg:w-full lg:flex-1"
                  >
                    {/* The trace filling in. scaleY/scaleX only — no width or
                        height animation, so this never triggers layout. */}
                    <span
                      className={`absolute inset-0 origin-top bg-signal transition-transform duration-[var(--duration-slow)] ease-precise lg:origin-left ${
                        complete ? "scale-y-100 lg:scale-x-100" : "scale-y-0 lg:scale-x-0"
                      }`}
                    />
                  </span>
                )}
              </div>

              <div className="pb-7 lg:pb-0 lg:pr-6">
                <p
                  className={`text-label transition-colors duration-[var(--duration-base)] ease-precise ${
                    lit ? "text-ink" : "text-ink-subtle"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 flex items-baseline gap-3 border-t border-line pt-6">
        <span className="text-eyebrow font-mono uppercase text-ink-subtle">
          {counterLabel}
        </span>
        <span className="font-mono text-h3 tabular-nums text-signal">{counterValue}</span>
      </div>
    </div>
  );
}
