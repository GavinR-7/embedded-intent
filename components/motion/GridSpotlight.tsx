"use client";

import { useEffect, useRef } from "react";

import { runMarkController } from "@/lib/markController";
import { useInView } from "@/lib/useInView";

import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Fine pointers only: how long after the pointer stops before the ambient
 *  pulses come back. */
const IDLE_MS = 2000;

/** How often a new cell starts lighting up. */
const PULSE_EVERY_MS = 900;

/**
 * How long to leave the page alone before the first cell lights.
 *
 * The first transition is the first thing here that promotes a layer, so it is
 * the one worth keeping out of the way. It also simply reads better: the hero
 * has an intro of its own, and ambient decoration that starts before the
 * headline has finished arriving is competing with it.
 */
const PULSE_START_MS = 2600;

/**
 * How long a cell stays lit before it starts fading back down.
 *
 * With `--dur-cell-fade` at 1300ms either side, one pulse reads as about 2.6s
 * from dark to dark — inside the 2–4s the effect is specified at.
 */
const PULSE_HOLD_MS = 1300;

/** How often a signal pulse sets off, and how long one takes end to end.
 *  The travel time is `--dur-signal-run` in app/globals.css. */
const SIGNAL_EVERY_MS = 1500;
const SIGNAL_RUN_MS = 2600;

/**
 * Where the ambient pulses fire.
 *
 * Integer cell coordinates from the center of the hero — `grid-cell` in
 * app/globals.css turns them into positions snapped to the ruling.
 *
 * Positions only. Which cell lights up and when is the controller's business,
 * and it picks at random at runtime; an earlier version carried a per-cell
 * cycle length and phase so the whole thing could be a CSS loop, and that is
 * what cost 0.6s of mobile LCP. See the comment on `grid-cell`.
 *
 * `wide` cells are outside the middle 320px and would be off the edge of a
 * 390px screen, so they are only rendered from `lg` up. The eight that remain
 * are the ones that matter most, because a coarse pointer has no cursor
 * spotlight and these are all it gets.
 */
type PulseCell = {
  cx: number;
  cy: number;
  wide?: boolean;
};

const PULSE_CELLS: readonly PulseCell[] = [
  { cx: -2, cy: -4 },
  { cx: 1, cy: -3 },
  { cx: -1, cy: -1 },
  { cx: 2, cy: -4 },
  { cx: 0, cy: -2 },
  { cx: -2, cy: -1 },
  { cx: 2, cy: -2 },
  { cx: 1, cy: 0 },
  { cx: -6, cy: -3, wide: true },
  { cx: 5, cy: -4, wide: true },
  { cx: -4, cy: 0, wide: true },
  { cx: 7, cy: -2, wide: true },
];

/**
 * Where the /ai-automation signal pulses run.
 *
 * `cx` / `cy` are the integer cell coordinates of the start, on the same lattice
 * as the ambient cells — so a pulse begins at an intersection of the ruling and
 * travels along one of its lines rather than floating between two. `run` is how
 * far, in rem, and may be negative to send it the other way.
 *
 * Four of them, two per axis, at distances that are not multiples of each other,
 * so two pulses that happen to set off together do not arrive together.
 */
const SIGNALS: readonly { axis: "x" | "y"; cx: number; cy: number; run: number }[] = [
  { axis: "x", cx: -4, cy: -3, run: 20 },
  { axis: "y", cx: 2, cy: -4, run: 12 },
  { axis: "x", cx: 3, cy: -1, run: -16 },
  { axis: "y", cx: -2, cy: -4, run: 16 },
];

/**
 * The hero texture, alive: lit near the cursor, and pulsing on its own otherwise.
 *
 * Three layers, one listener, two timers.
 *
 * **The cursor spotlight** is the Tier 1 interactive background from
 * CONTENT_TODO.md, and the constraints recorded there are the whole design: no
 * canvas, no WebGL, no JavaScript animation loop. The only handler is a
 * rAF-throttled `pointermove` that writes two custom properties; the paint is
 * entirely CSS (`texture-lit` masks a bright copy of the texture to a circle
 * centered on those two values). What that bright copy is made of is the
 * caller's business — a background for the two grid textures, an SVG child for
 * the contour one — which is what lets one component serve all four.
 *
 * **The ambient pulses** are twelve cells that brighten and fade in an order
 * nobody can predict. They are what the effect looks like on a phone, where
 * there is no cursor — and on a desktop they are what it looks like before
 * anyone has moved the mouse, and again two seconds after they stop.
 *
 * They started as twelve CSS loops with no JavaScript at all, which is what the
 * rest of this site would do, and that version cost 0.6s of simulated mobile
 * LCP. The long version of why is on `grid-cell` in app/globals.css; the short
 * version is that a running compositable animation promotes its element to a
 * layer, the promotion lands inside the window the metric is accounting for, and
 * no amount of deferring moves it off that path. So the cells are inert and a
 * `setInterval` lights one at a time through a transition. It is more JavaScript
 * than this site likes and it is the version that measured right.
 *
 * **The signal pulses** are /ai-automation only, and they are the same pattern
 * again: four inert dashes sitting on the ruling, one of which is sent along a
 * line every second and a half. They do not stand down for the pointer, because
 * they are part of that page's texture rather than a stand-in for a cursor.
 *
 * The handoff is the third thing this coordinates: while a fine pointer is moving
 * in the hero, `data-pointer-active` fades the ambient cells out and the spotlight
 * leads. Two seconds of stillness, or the pointer leaving, brings them back. On a
 * coarse pointer no pointer listener is attached at all and they simply run.
 *
 * Under `prefers-reduced-motion: reduce` nothing here does anything: no listener
 * and no timer is ever started — not merely ignored — and the CSS hides both
 * pulse layers outright. Offscreen, the timers stop and everything lit is
 * cleared; the wrapper does not use `data-pause-offscreen` because there is no
 * CSS animation left for it to pause.
 *
 * The listener goes on the `<section>` rather than on either layer, because both
 * are inside a `pointer-events: none` wrapper and never see a pointer. Their
 * boxes are identical — all three resolve to the section's padding box — so the
 * section's rect is the right frame of reference for a position inside them.
 */
export function GridSpotlight({
  litClassName = "",
  signals = false,
  children,
}: {
  /** Classes that draw the bright copy of this page's texture. */
  litClassName?: string;
  /** Render the four travelling pulses. /ai-automation only. */
  signals?: boolean;
  /** The bright copy, where it is markup rather than a background. */
  children?: React.ReactNode;
}) {
  const litRef = useRef<HTMLDivElement | null>(null);
  const pulseRef = useRef<HTMLDivElement | null>(null);
  const signalRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref: pulsesInViewRef, inView } = useInView<HTMLDivElement>();

  // ------------------------------------------------------------ the pulses
  useEffect(() => {
    if (prefersReducedMotion || !inView) return;

    const layer = pulseRef.current;
    if (!layer) return;

    return runMarkController({
      layer,
      selector: "[data-cell]",
      attribute: "lit",
      everyMs: PULSE_EVERY_MS,
      holdMs: PULSE_HOLD_MS,
      startMs: PULSE_START_MS,
    });
  }, [inView, prefersReducedMotion]);

  // ----------------------------------------------------------- the signals
  useEffect(() => {
    if (prefersReducedMotion || !inView || !signals) return;

    const layer = signalRef.current;
    if (!layer) return;

    return runMarkController({
      layer,
      selector: "[data-signal]",
      attribute: "run",
      everyMs: SIGNAL_EVERY_MS,
      // Cleared as the travel animation ends, so the next pick can use it again.
      holdMs: SIGNAL_RUN_MS,
      startMs: PULSE_START_MS,
    });
  }, [inView, prefersReducedMotion, signals]);

  // ---------------------------------------------------------- the spotlight
  useEffect(() => {
    const layer = litRef.current;
    if (!layer || prefersReducedMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const host = layer.closest("section");
    if (!host) return;

    let frame = 0;
    let idle = 0;
    let x = 0;
    let y = 0;

    const standDown = () => {
      const pulses = pulseRef.current;
      if (pulses) delete pulses.dataset.pointerActive;
    };

    const write = () => {
      frame = 0;
      layer.style.setProperty("--spot-x", `${x}px`);
      layer.style.setProperty("--spot-y", `${y}px`);
      // Fades the layer in the first time the pointer arrives, so the texture is
      // plain until it is actually being pointed at.
      layer.dataset.lit = "";
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
      // One write per frame at most. A fast pointer fires dozens of events per
      // frame and each one would otherwise be a separate style mutation.
      if (frame === 0) frame = requestAnimationFrame(write);

      const pulses = pulseRef.current;
      if (pulses) pulses.dataset.pointerActive = "";
      window.clearTimeout(idle);
      idle = window.setTimeout(standDown, IDLE_MS);
    };

    const onPointerLeave = () => {
      delete layer.dataset.lit;
      window.clearTimeout(idle);
      standDown();
    };

    host.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave);

    return () => {
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      window.clearTimeout(idle);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion]);

  return (
    <>
      <div
        ref={litRef}
        className={`texture-lit absolute inset-0 ${litClassName}`.trim()}
      >
        {children}
      </div>

      {/* Two refs on one node: `pulseRef` for the controller to reach the
          cells, and the in-view ref that stops both timers when the hero is
          gone. */}
      <div
        ref={(node) => {
          pulseRef.current = node;
          pulsesInViewRef.current = node;
        }}
        className="grid-pulses absolute inset-0"
      >
        {PULSE_CELLS.map((cell) => (
          <span
            key={`${cell.cx}:${cell.cy}`}
            data-cell=""
            className={`grid-cell ${cell.wide ? "hidden lg:block" : ""}`.trim()}
            style={{ "--cx": cell.cx, "--cy": cell.cy } as React.CSSProperties}
          />
        ))}
      </div>

      {signals && (
        <div ref={signalRef} className="signal-layer absolute inset-0">
          {SIGNALS.map((pulse) => (
            <span
              key={`${pulse.axis}${pulse.cx}:${pulse.cy}`}
              data-signal=""
              className={`signal-pulse ${
                pulse.axis === "x" ? "signal-pulse-x" : "signal-pulse-y"
              }`}
              style={
                {
                  "--cx": pulse.cx,
                  "--cy": pulse.cy,
                  "--run": `${pulse.run}rem`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
