"use client";

import { useEffect, useRef, useState } from "react";

import type { Step } from "@/content/home";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Matches Tailwind's `lg` breakpoint, and the `pin-track` media query in CSS. */
const DESKTOP_QUERY = "(min-width: 64rem)";

/**
 * "How it works" as a pinned scroll stepper — the one set piece on the site.
 *
 * ---------------------------------------------------------------------------
 * How it works (the section, and the section about the section)
 *
 * The outer block is 70vh of page per step. Inside it, one viewport-height
 * panel is `position: sticky`, so it stays put while those 280vh scroll past.
 * Four absolutely-positioned sentinels tile that outer block, and an observer
 * with `rootMargin: "-50% 0px -50% 0px"` shrinks its root to a single line
 * across the middle of the viewport — so exactly one sentinel is ever
 * intersecting, and it is the one the middle of the screen is currently in.
 * That is what drives the active step.
 *
 * Sentinels rather than a scroll listener: the browser does the geometry off
 * the main thread and tells us four times in total, instead of us asking for
 * `getBoundingClientRect` sixty times a second.
 *
 * ---------------------------------------------------------------------------
 * What it does NOT do
 *
 * All four steps stay in the DOM, in order, readable. The inactive ones are
 * dimmed, never hidden, never `visibility`, never unmounted — a screen reader
 * or a keyboard user gets the whole section as an ordinary ordered list, and
 * someone who never scrolls past the first step can still read the fourth.
 *
 * The pin is gated on `data-pinned`, which is only set at lg and up and never
 * under `prefers-reduced-motion: reduce`. On a phone, and for anyone who asked
 * for less motion, this is a plain stacked list with no sticky and no extra
 * height. With JavaScript off it is the same, because the attribute comes from
 * a client component — pinning a section with CSS alone would give three
 * screens of scrolling with nothing changing, which is worse than no effect.
 * ---------------------------------------------------------------------------
 */
export function ScrollStepper({ steps }: { steps: readonly Step[] }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const prefersReducedMotion = usePrefersReducedMotion();
  const pinned = isDesktop && !prefersReducedMotion;

  const [activeStep, setActiveStep] = useState<number | null>(null);
  const sentinelRefs = useRef<(HTMLDivElement | null)[]>([]);

  /*
   * `null` until the observer has something to say, and `null` again the moment
   * the section is not pinned. Derived rather than reset, so there is no effect
   * that writes state on a breakpoint change — and so the un-pinned layout can
   * never inherit a stale "step 3 is active" and render three dimmed steps.
   */
  const active = pinned ? activeStep : null;

  useEffect(() => {
    if (!pinned) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.stepIndex);
          if (Number.isNaN(index)) continue;
          setActiveStep(index);
        }
      },
      // Collapses the root to a line across the middle of the viewport.
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    for (const sentinel of sentinelRefs.current) {
      if (sentinel) observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [pinned, steps.length]);

  /*
   * The rail fills to the end of the active step. Un-pinned it is simply full,
   * which is what a static list should look like — an empty progress rail
   * beside four equally-bright steps would read as broken.
   */
  const progress = active === null ? 1 : (active + 1) / steps.length;

  return (
    <div
      data-pinned={pinned ? "" : undefined}
      style={{ "--steps": steps.length } as React.CSSProperties}
      className="pin-track relative mt-14"
    >
      {/* The sentinels tile the tall block. Rendered only when pinned, since
          they measure a height that only exists then. */}
      {pinned &&
        steps.map((step, index) => (
          <div
            key={step.id}
            ref={(node) => {
              sentinelRefs.current[index] = node;
            }}
            aria-hidden="true"
            data-step-index={index}
            className="pointer-events-none absolute inset-x-0"
            style={{
              top: `${(index * 100) / steps.length}%`,
              height: `${100 / steps.length}%`,
            }}
          />
        ))}

      <div className="pin-viewport flex gap-8">
        {/* The progress rail. `scaleY` from a fixed-height bar, never an
            animated height — a height animation runs layout on every frame. */}
        <div
          aria-hidden="true"
          className="relative hidden w-px shrink-0 self-stretch bg-line lg:block"
        >
          <span
            className="absolute inset-0 origin-top bg-signal transition-transform duration-[var(--duration-slow)] ease-precise"
            style={{ transform: `scaleY(${progress})` }}
          />
        </div>

        <ol className="grid flex-1 gap-px overflow-hidden rounded-card bg-line md:grid-cols-2 lg:flex lg:flex-col lg:justify-center lg:gap-6 lg:overflow-visible lg:rounded-none lg:bg-transparent">
          {steps.map((step, index) => {
            const isActive = active === index;

            return (
              <li
                key={step.id}
                data-active={isActive ? "" : undefined}
                className={`flex flex-col bg-void p-7 transition-opacity duration-[var(--duration-slow)] ease-precise lg:flex-row lg:items-baseline lg:gap-6 lg:bg-transparent lg:p-0 ${
                  // Dimming applies only where the stepper is pinned. Below lg
                  // every step is equally bright, because nothing is driving a
                  // selection there.
                  active !== null && !isActive ? "lg:opacity-35" : "lg:opacity-100"
                }`}
              >
                {/* Decorative: the ordered list already conveys sequence to
                    assistive tech, so repeating it as text would make a screen
                    reader say "one" twice. */}
                <span
                  aria-hidden="true"
                  className="font-mono text-eyebrow tabular-nums text-signal lg:w-8 lg:shrink-0"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="lg:flex-1">
                  <h3 className="mt-4 text-h3 text-ink lg:mt-0">{step.name}</h3>

                  <p className="mt-3 flex-1 text-label text-ink-muted lg:max-w-prose-tight">
                    {step.body}
                  </p>

                  {/* Deliverables, as chips. What the step actually hands you —
                      the data lives in content/home.ts. */}
                  <ul className="mt-6 flex flex-wrap gap-2 lg:mt-4">
                    {step.chips.map((chip) => (
                      <li
                        key={chip}
                        className="rounded-field border border-line px-2.5 py-1 font-mono text-eyebrow uppercase text-ink-subtle transition-colors duration-[var(--duration-slow)] ease-precise lg:border-line/60 lg:in-[[data-active]]:border-signal/40 lg:in-[[data-active]]:text-signal"
                      >
                        {chip}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
