"use client";

import { useEffect, useRef } from "react";

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
 * The hero grid, alive: lit near the cursor, and pulsing on its own otherwise.
 *
 * Two layers, one listener.
 *
 * **The cursor spotlight** is the Tier 1 interactive background from
 * CONTENT_TODO.md, and the constraints recorded there are the whole design: no
 * canvas, no WebGL, no JavaScript animation loop. The only handler is a
 * rAF-throttled `pointermove` that writes two custom properties; the paint is
 * entirely CSS (`trace-grid-lit` masks a copy of the grid lines to a circle
 * centered on those two values).
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
 * layer, the promotion lands inside the window the metric accounts for, and no
 * amount of deferring moves it off that path. So the cells are inert and a
 * `setInterval` lights one at a time through a transition. It is more
 * JavaScript than this site likes and it is the version that measured right.
 *
 * Two things this component coordinates, then. The pulse timer, above; and the
 * handoff — while a fine pointer is moving in the hero, `data-pointer-active`
 * fades the pulses out and the spotlight leads. Two seconds of stillness, or
 * the pointer leaving, brings them back. On a coarse pointer no pointer
 * listener is attached at all and the pulses simply run.
 *
 * Under `prefers-reduced-motion: reduce` neither layer does anything: neither
 * the listener nor the timer is ever started — not merely ignored — and the CSS
 * hides the pulse layer outright. Offscreen, the timer stops and every lit cell
 * is cleared; the wrapper does not use `data-pause-offscreen` because there is
 * no CSS animation left for it to pause.
 *
 * The listener goes on the `<section>` rather than on either layer, because both
 * are inside a `pointer-events: none` wrapper and never see a pointer. Their
 * boxes are identical — all three resolve to the section's padding box — so the
 * section's rect is the right frame of reference for a position inside them.
 */
export function GridSpotlight() {
  const litRef = useRef<HTMLDivElement | null>(null);
  const pulseRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref: pulsesInViewRef, inView } = useInView<HTMLDivElement>();

  // ------------------------------------------------------------ the pulses
  useEffect(() => {
    if (prefersReducedMotion || !inView) return;

    const layer = pulseRef.current;
    if (!layer) return;

    /*
     * One cell at a time, chosen at random from the ones that are currently
     * dark. Picking from the dark set rather than from all of them is what
     * stops a cell being re-lit while it is still fading out, which would look
     * like a flicker rather than a pulse.
     */
    const tick = () => {
      const dark = Array.from(
        layer.querySelectorAll<HTMLElement>("[data-cell]:not([data-lit])"),
        // `offsetParent` is null for a `display: none` element, which is how
        // the four `lg`-only cells take themselves out of the running on a
        // phone rather than being picked and then lighting nothing.
      ).filter((cell) => cell.offsetParent !== null);

      const cell = dark[Math.floor(Math.random() * dark.length)];
      if (!cell) return;

      cell.dataset.lit = "";
      window.setTimeout(() => delete cell.dataset.lit, PULSE_HOLD_MS);
    };

    let interval = 0;
    const start = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, PULSE_EVERY_MS);
    }, PULSE_START_MS);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
      // Leave nothing lit behind: the timeouts that would have cleared them
      // are about to be irrelevant, and a cell frozen at full opacity is the
      // one state this effect must never end in.
      for (const cell of layer.querySelectorAll<HTMLElement>("[data-lit]")) {
        delete cell.dataset.lit;
      }
    };
  }, [inView, prefersReducedMotion]);

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
      // Fades the layer in the first time the pointer arrives, so the grid is
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
      <div ref={litRef} className="trace-grid-lit absolute inset-0" />

      {/* Two refs on one node: `pulseRef` for the controller to reach the
          cells, and the in-view ref that stops it when the hero is gone. */}
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
    </>
  );
}
