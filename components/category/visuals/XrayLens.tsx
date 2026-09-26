"use client";

import { useEffect, useRef } from "react";

import { heroVisuals } from "@/content/heroVisuals";
import { runMarkController } from "@/lib/markController";
import { useInView } from "@/lib/useInView";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const { mock, blueprint } = heroVisuals.websites;

/** Twelve columns of the blueprint grid, drawn as evenly spaced rules. */
const COLUMNS = Array.from({ length: 12 }, (_, index) => index);

/**
 * The idle path, as numbers rather than as keyframes.
 *
 * These MIRROR `lens-drift-x` / `lens-drift-y` in app/globals.css, and they have
 * to: a coarse pointer drifts the lens with those keyframes and no JavaScript at
 * all, and a fine pointer drifts it with the loop below. Two descriptions of one
 * figure, so if you change the sweep in one place, change it in the other.
 *
 * 17s against 11s is the point. Two periods that do not divide into each other
 * means the lens does not retrace its own path for over three minutes, so it
 * reads as wandering rather than as a loop.
 */
const PATH = {
  x: { center: 50, amp: 26, periodMs: 17000 },
  y: { center: 50, amp: 24, periodMs: 11000 },
};

/** How much of the remaining distance to the cursor the lens closes each frame. */
const LERP = 0.12;

/** How long the lens takes to ease back onto the idle path after the pointer leaves. */
const RETURN_MS = 1000;

/**
 * How fast the lens's own momentum bleeds off during that return.
 *
 * It keeps the velocity it had when the pointer left and coasts, while the blend
 * below pulls it toward the path. Without the decay a fast flick sends it out of
 * the frame before the blend can catch it.
 */
const DRAG = 0.92;

/** How finely the nearest-point search samples the path. See `nearestPhase`. */
const SEARCH_STEP_MS = 200;

/**
 * How long before the two periods line up again and the figure repeats.
 *
 * Computed, not written down. The obvious `x.periodMs * y.periodMs` is the
 * common multiple but not the LOWEST one: for 17s and 11s it gives 187,000
 * seconds instead of 187, which turns the search below from 935 samples into
 * 935,000 — a visible stall on every `pointerleave`.
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

const BEAT_MS =
  (PATH.x.periodMs * PATH.y.periodMs) / gcd(PATH.x.periodMs, PATH.y.periodMs);

/** Position on the idle path at time `t`, as percentages of the frame. */
function pathAt(t: number) {
  return {
    x: PATH.x.center - PATH.x.amp * Math.cos((2 * Math.PI * t) / PATH.x.periodMs),
    y: PATH.y.center - PATH.y.amp * Math.cos((2 * Math.PI * t) / PATH.y.periodMs),
  };
}

/**
 * The phase whose point on the path is nearest to where the lens actually is.
 *
 * This is the difference between "eases back onto the path" and "slides across
 * the frame to wherever the path happened to get to while the pointer was
 * driving". Resuming at the elapsed phase is the obvious implementation and it
 * looks wrong: the lens visibly travels to a point it has no reason to be at.
 *
 * The two periods repeat together only after their lowest common multiple —
 * 17s and 11s, so 187s — and that whole beat has to be searched, because the same
 * (x, y) point occurs at phases spread right across it. 200ms steps is 935
 * samples of two cosines, once, on `pointerleave`.
 */
function nearestPhase(x: number, y: number) {
  let best = 0;
  let bestDistance = Infinity;

  for (let t = 0; t < BEAT_MS; t += SEARCH_STEP_MS) {
    const point = pathAt(t);
    const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = t;
    }
  }
  return best;
}

/** Decelerating blend, so the return settles rather than arriving at speed. */
function easeOut(k: number) {
  return 1 - (1 - k) ** 3;
}

/**
 * Where the fading crosshairs sit in the blueprint layer, as percentages.
 *
 * Hand-placed on the ruling rather than generated: they have to miss the
 * wireframe boxes and the measurement labels, which a formula does not know
 * about. Only ever seen through the lens, which is the whole idea — the layer
 * underneath is not static, it is being surveyed.
 */
const MARKS: readonly { x: number; y: number }[] = [
  { x: 18, y: 14 },
  { x: 45, y: 22 },
  { x: 72, y: 16 },
  { x: 27, y: 38 },
  { x: 63, y: 44 },
  { x: 88, y: 34 },
  { x: 12, y: 58 },
  { x: 52, y: 62 },
  { x: 81, y: 68 },
  { x: 36, y: 78 },
];

/** One crosshair fade, and how often a new one starts. */
const MARK_EVERY_MS = 1400;
const MARK_HOLD_MS = 1600;
const MARK_START_MS = 1200;

/**
 * /websites — the x-ray lens.
 *
 * Two stacked layers of the same page. The blueprint underneath: wireframe
 * boxes, a twelve-column grid and the measurements the layout is made of. The
 * finished page on top, with a circular hole cut in it by a `mask-image`
 * centered on `--lens-x` / `--lens-y`.
 *
 * Moving the lens is therefore two custom properties and nothing else — no
 * layout, no React state, no re-render.
 *
 * ---------------------------------------------------------------------------
 * There are two implementations of the idle drift, and that is deliberate.
 *
 * On a COARSE pointer there is no cursor to hand off to, so the drift is the two
 * typed `@property` declarations in app/globals.css and a pair of keyframes. No
 * JavaScript, no loop, nothing to pause. That is the case a phone gets, and a
 * phone is where this page's LCP is measured.
 *
 * On a FINE pointer the same figure is driven by the loop below, because the
 * handoff needs state the CSS cannot have. The lens used to snap to the cursor
 * the instant it arrived and snap back to wherever the keyframes had got to the
 * instant it left — two jumps, and the second one especially reads as a bug.
 * Now it eases in, and on leaving it keeps its position AND its velocity, coasts,
 * and is pulled back onto the path over a second — onto the nearest point of the
 * path, not the elapsed one. See `nearestPhase`.
 *
 * `data-driven` is what tells the CSS to stand down, and it goes on for the life
 * of the component on a fine pointer rather than only while the pointer is
 * inside: the loop owns the two properties from that point on, and an inline
 * value only beats a running animation once the animation is out of the way.
 * ---------------------------------------------------------------------------
 *
 * Both layers are drawn in the site's own tokens, so the "finished page" is
 * actually made of the same colors and spacing as the page it is sitting on.
 *
 * `default` export: it is loaded through `next/dynamic`, which wants one.
 */
export default function XrayLens() {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  /*
   * Its own observer, rather than the `data-pause-offscreen` marker the rest of
   * the site uses.
   *
   * That marker is collected once per navigation by the single observer in
   * MotionRuntime, and this component does not exist yet when that scan runs —
   * it arrives later, from `next/dynamic` with `ssr: false`. The marker was
   * here first and did nothing at all: the drift was still running after the
   * hero had scrolled away, which is exactly what the rule exists to stop.
   * Anything that mounts after hydration has to gate itself.
   */
  const { ref: inViewRef, inView } = useInView<HTMLDivElement>();

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || prefersReducedMotion || !inView) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    // From here on the loop owns the two properties, so the CSS drift stands
    // down. It is handed back only by unmounting.
    frame.dataset.driven = "";

    /** "path" drifts, "pointer" chases the cursor, "return" blends back. */
    let mode: "path" | "pointer" | "return" = "path";

    /** Phase along the idle path, in ms. */
    let phase = 0;
    /** Where the lens is, in percentages of the frame — the same units as the path. */
    let position = pathAt(0);
    /** Percent per frame, carried across the handoff. */
    let velocity = { x: 0, y: 0 };
    /** The cursor, in percentages, while it is inside the frame. */
    let target = position;

    /** Set when the pointer leaves: where the blend starts from and aims at. */
    let returnStartedAt = 0;
    let returnPhase = 0;

    let raf = 0;
    let previous = 0;

    const toPercent = (event: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      };
    };

    const step = (now: number) => {
      raf = requestAnimationFrame(step);

      // First frame has no previous timestamp to difference against.
      const dt = previous === 0 ? 16.7 : Math.min(now - previous, 50);
      previous = now;

      const before = position;

      if (mode === "pointer") {
        /*
         * A fixed fraction of the remaining distance each frame. Framerate
         * independence would want an exponential in dt, but this runs at
         * whatever the display does and the difference over 8ms of jitter is
         * invisible — where a wrong exponent is not.
         */
        position = {
          x: position.x + (target.x - position.x) * LERP,
          y: position.y + (target.y - position.y) * LERP,
        };
      } else if (mode === "return") {
        const elapsed = now - returnStartedAt;
        const k = Math.min(elapsed / RETURN_MS, 1);

        // Coast on the momentum it had when the pointer left...
        velocity = { x: velocity.x * DRAG, y: velocity.y * DRAG };
        const coasted = {
          x: position.x + velocity.x,
          y: position.y + velocity.y,
        };

        // ...while the path takes over.
        const onPath = pathAt(returnPhase + elapsed);
        const blend = easeOut(k);
        position = {
          x: coasted.x * (1 - blend) + onPath.x * blend,
          y: coasted.y * (1 - blend) + onPath.y * blend,
        };

        if (k === 1) {
          mode = "path";
          phase = returnPhase + elapsed;
        }
      } else {
        phase += dt;
        position = pathAt(phase);
      }

      velocity =
        mode === "return"
          ? velocity
          : { x: position.x - before.x, y: position.y - before.y };

      frame.style.setProperty("--lens-x", `${position.x}%`);
      frame.style.setProperty("--lens-y", `${position.y}%`);
    };

    const onMove = (event: PointerEvent) => {
      mode = "pointer";
      target = toPercent(event);
    };

    const onLeave = () => {
      if (mode !== "pointer") return;
      mode = "return";
      returnStartedAt = performance.now();
      returnPhase = nearestPhase(position.x, position.y);
    };

    frame.addEventListener("pointermove", onMove, { passive: true });
    frame.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(step);

    return () => {
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      delete frame.dataset.driven;
      frame.style.removeProperty("--lens-x");
      frame.style.removeProperty("--lens-y");
    };
  }, [inView, prefersReducedMotion]);

  // ------------------------------------------------- the surveying crosshairs
  /*
   * Quiet motion under the mock page: one crosshair at a time fades up and back
   * down, in an order nobody can predict. Only ever visible through the lens,
   * which is the point — the layer underneath is being measured, not sitting
   * still waiting to be looked at.
   *
   * The same inert-elements-and-a-timer shape as the ambient hero cells, and for
   * the same measured reason. See lib/markController.ts.
   */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || prefersReducedMotion || !inView) return;

    return runMarkController({
      layer: frame,
      selector: "[data-mark]",
      attribute: "lit",
      everyMs: MARK_EVERY_MS,
      holdMs: MARK_HOLD_MS,
      startMs: MARK_START_MS,
    });
  }, [inView, prefersReducedMotion]);

  return (
    <div
      ref={(node) => {
        frameRef.current = node;
        inViewRef.current = node;
      }}
      data-paused={inView ? undefined : ""}
      style={{ "--lens-r": "5.5rem" } as React.CSSProperties}
      className="xray h-full w-full bg-void"
    >
      {/* ------------------------------------------------ the blueprint layer */}
      {/*
        The two layers share their geometry exactly — the same three rows, the
        same fixed nav and card heights, the same `flex-1` middle, the same
        gaps. That is the whole idea of an x-ray: the wireframe has to be under
        the finished thing, not beside it. If you change a height in one layer,
        change it in the other.
      */}
      <div className="absolute inset-0 p-5">
        {/* A baseline rule every 2rem, and twelve columns. Drawn rather than
            implied, so the lens always has something under it wherever it is. */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,var(--color-signal)_0_1px,transparent_1px_1.5rem)] opacity-[0.12]" />

        <div className="absolute inset-y-0 left-5 right-5 flex justify-between">
          {COLUMNS.map((column) => (
            <span key={column} className="w-px bg-signal/25" />
          ))}
        </div>

        {/* The surveying marks. Two 1px bars rather than a gradient cross: at
            eleven pixels across, a sub-pixel radial gradient is the difference
            between a crosshair and nothing at all, which is a mistake this file's
            sibling texture already made once. */}
        {MARKS.map((mark) => (
          <span
            key={`${mark.x}:${mark.y}`}
            data-mark=""
            className="pulse-mark absolute h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
          >
            <span className="absolute left-0 top-[5px] h-px w-[11px] bg-signal/70" />
            <span className="absolute left-[5px] top-0 h-[11px] w-px bg-signal/70" />
          </span>
        ))}

        <div className="relative flex h-full flex-col gap-3 font-mono text-[0.5rem] uppercase tracking-[0.1em] text-signal/85">
          <div className="flex h-8 shrink-0 items-center justify-between border border-dashed border-signal/55 px-2">
            <span>{blueprint.nav}</span>
            <span>{blueprint.container}</span>
          </div>

          <div className="relative flex flex-1 flex-col justify-center border border-dashed border-signal/55 px-4">
            <span className="absolute left-2 top-1.5">{blueprint.type}</span>

            {/* The same three bars the finished page has, as measured rules. */}
            <div className="h-px w-[16ch] bg-signal/45" />
            <div className="mt-2.5 h-px w-3/5 bg-signal/45" />
            <div className="mt-1.5 h-px w-2/5 bg-signal/45" />

            <span className="absolute bottom-1.5 left-2 flex items-center gap-1.5">
              <span className="h-2 w-px bg-signal/70" />
              {blueprint.gap}
              <span className="h-2 w-px bg-signal/70" />
            </span>
            <span className="absolute bottom-1.5 right-2">{blueprint.grid}</span>
          </div>

          <div className="flex h-14 shrink-0 gap-2">
            {mock.cards.map((card, index) => (
              <div
                key={card}
                className="relative flex-1 border border-dashed border-signal/55"
              >
                {/* The diagonal that says "box here, content later". */}
                <svg
                  viewBox="0 0 40 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full stroke-signal/25"
                  strokeWidth="0.4"
                >
                  <path d="M0 0 L40 20 M40 0 L0 20" />
                </svg>
                {index === 1 && (
                  <span className="absolute inset-x-0 bottom-1 text-center">
                    {blueprint.cards}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------------------- the finished page, cut */}
      <div className="xray-polish absolute inset-0 bg-void p-5">
        <div className="flex h-full flex-col gap-3">
          <div className="flex h-8 shrink-0 items-center justify-between rounded-field bg-surface px-3">
            <span className="text-[0.55rem] font-semibold tracking-tight text-ink">
              {mock.brand}
            </span>
            <span className="flex gap-3 text-[0.5rem] text-ink-subtle">
              {mock.nav.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center rounded-field bg-surface/70 px-4">
            <p className="max-w-[16ch] text-[0.95rem] font-semibold leading-tight tracking-tight text-ink">
              {mock.heading}
            </p>
            <div className="mt-2.5 h-1 w-3/5 rounded-full bg-line-strong" />
            <div className="mt-1.5 h-1 w-2/5 rounded-full bg-line" />
            <span className="mt-3 w-fit rounded-field bg-signal px-2.5 py-1 text-[0.5rem] font-semibold text-void">
              {mock.cta}
            </span>
          </div>

          <div className="flex h-14 shrink-0 gap-2">
            {mock.cards.map((card) => (
              <div key={card} className="flex-1 rounded-field bg-surface px-2 py-3">
                <div className="h-1.5 w-1.5 rounded-full bg-signal" />
                <p className="mt-2 text-[0.5rem] text-ink-muted">{card}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="xray-ring" />
    </div>
  );
}
