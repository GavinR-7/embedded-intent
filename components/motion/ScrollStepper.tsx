"use client";

import { useEffect, useRef, useState } from "react";

import type { Step } from "@/content/home";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * "How it works" — four steps that light up one at a time as the page scrolls.
 *
 * ---------------------------------------------------------------------------
 * This was a pinned set piece and is not any more.
 *
 * The pinned version made the section 280vh tall and stuck one viewport-height
 * panel to the top of it. Two things were wrong with that, both visible in a
 * recorded scroll-through. All four steps already fit in one viewport at 1440,
 * so the pin was not buying room for anything — it was holding the page still
 * for three screens of scrolling while the reader tried to leave. And because
 * the sticky panel started below the header, the section's own heading was
 * scrolled off the top before the first step activated, so the set piece was a
 * list of four things with no title.
 *
 * What is left is the part that was actually working: the page scrolls
 * normally, and whichever step the middle of the screen is currently in is the
 * live one. Same behavior at every width — there is no breakpoint in here any
 * more, because there is no longer anything that only works on a big screen.
 * ---------------------------------------------------------------------------
 *
 * The active step comes from one IntersectionObserver over the four steps with
 * `rootMargin: "-50% 0px -50% 0px"`, which collapses the root to a single line
 * across the middle of the viewport. At most one step can intersect a line, so
 * there is no "which of these three is most visible" arithmetic to get wrong,
 * and the browser does the geometry off the main thread instead of us calling
 * `getBoundingClientRect` sixty times a second. When the line falls in the gap
 * between two steps nothing intersects, and the last answer stands — which is
 * why the state is only ever written, never cleared.
 *
 * All four steps stay in the DOM, in order, readable. The inactive ones are
 * dimmed, never hidden, never unmounted: a screen reader or a keyboard user
 * gets an ordinary ordered list, and someone who never scrolls can still read
 * the fourth step.
 *
 * ---------------------------------------------------------------------------
 * The dim is COLOR, not opacity, and that is an accessibility fix.
 *
 * `opacity: 0.35` over the page background drops the chips to 1.68:1 and the
 * body line to 2.12:1 — well under the 4.5:1 floor — and Lighthouse's
 * accessibility score fell from 100 to 96 the moment the dim stopped being
 * `lg:`-only and started applying at the width the audit runs at. Stepping each
 * element one notch down the ink ramp instead (ink -> ink-muted -> ink-subtle)
 * reads as the same dim, and the weakest thing on the screen is still 5.86:1.
 *
 * Same rule MOTION.md gives for reveal targets, for a different reason: dim
 * with color, not with opacity.
 * ---------------------------------------------------------------------------
 *
 * Under `prefers-reduced-motion: reduce` there is no selection at all. Every
 * step renders at full brightness and the rail is simply full, which is what a
 * static list should look like — a quarter-filled progress rail beside four
 * equally-bright steps would read as broken.
 */
export function ScrollStepper({ steps }: { steps: readonly Step[] }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const [activeStep, setActiveStep] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  /*
   * Derived, not reset. `null` means "nothing is selected", which is the
   * reduced-motion state, and deriving it means there is no effect writing
   * state on a preference change and no way for the static layout to inherit a
   * stale "step 3 is active".
   */
  const active = prefersReducedMotion ? null : activeStep;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.stepIndex);
          if (Number.isNaN(index)) continue;
          setActiveStep(index);
        }
      },
      // A line across the middle of the viewport, not a band: a band can have
      // two steps in it at once, and then the callback order decides the
      // answer.
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    for (const node of itemRefs.current) {
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [prefersReducedMotion, steps.length]);

  /** The rail fills to the end of the active step. */
  const progress = active === null ? 1 : (active + 1) / steps.length;

  return (
    <div className="mt-14 flex gap-5 sm:gap-8">
      {/* The progress rail. `scaleY` from a fixed-height bar, never an animated
          height — a height animation runs layout on every frame. */}
      <div
        aria-hidden="true"
        className="relative w-px shrink-0 self-stretch bg-line"
      >
        <span
          className="absolute inset-0 origin-top bg-signal motion-safe:transition-transform motion-safe:duration-[var(--duration-slow)] motion-safe:ease-precise"
          style={{ transform: `scaleY(${progress})` }}
        />
      </div>

      <ol className="flex flex-1 flex-col gap-12 sm:gap-14">
        {steps.map((step, index) => {
          const isActive = active === index;
          const dim = active !== null && !isActive;

          return (
            <li
              key={step.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              data-step-index={index}
              data-active={isActive ? "" : undefined}
              className="sm:flex sm:items-baseline sm:gap-6"
            >
              {/* Decorative: the ordered list already conveys sequence to
                  assistive tech, so repeating it as text would make a screen
                  reader say "one" twice. */}
              <span
                aria-hidden="true"
                className={`font-mono text-eyebrow tabular-nums transition-colors duration-[var(--duration-slow)] ease-precise sm:w-8 sm:shrink-0 ${
                  dim ? "text-ink-subtle" : "text-signal"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="sm:flex-1">
                <h3
                  className={`mt-3 text-h3 transition-colors duration-[var(--duration-slow)] ease-precise sm:mt-0 ${
                    dim ? "text-ink-muted" : "text-ink"
                  }`}
                >
                  {step.name}
                </h3>

                <p
                  className={`mt-3 max-w-prose-tight text-label transition-colors duration-[var(--duration-slow)] ease-precise ${
                    dim ? "text-ink-subtle" : "text-ink-muted"
                  }`}
                >
                  {step.body}
                </p>

                {/* Deliverables, as chips. What the step actually hands you —
                    the data lives in content/home.ts. */}
                <ul className="mt-4 flex flex-wrap gap-2">
                  {step.chips.map((chip) => (
                    <li
                      key={chip}
                      className={`rounded-field border px-2.5 py-1 font-mono text-eyebrow uppercase transition-colors duration-[var(--duration-slow)] ease-precise ${
                        isActive
                          ? "border-signal/40 text-signal"
                          : "border-line/60 text-ink-subtle"
                      }`}
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
  );
}
