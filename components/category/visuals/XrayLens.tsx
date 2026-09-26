"use client";

import { useEffect, useRef } from "react";

import { heroVisuals } from "@/content/heroVisuals";
import { useInView } from "@/lib/useInView";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const { mock, blueprint } = heroVisuals.websites;

/** Twelve columns of the blueprint grid, drawn as evenly spaced rules. */
const COLUMNS = Array.from({ length: 12 }, (_, index) => index);

/**
 * /websites — the x-ray lens.
 *
 * Two stacked layers of the same page. The blueprint underneath: wireframe
 * boxes, a twelve-column grid and the measurements the layout is made of. The
 * finished page on top, with a circular hole cut in it by a `mask-image`
 * centered on `--lens-x` / `--lens-y`.
 *
 * Moving the lens is therefore two custom properties and nothing else — no
 * layout, no React state, no re-render. On a fine pointer a rAF-throttled
 * `pointermove` writes them; otherwise (a phone, or a cursor that is not here)
 * the two typed `@property` declarations in app/globals.css let CSS drift them
 * along a Lissajous path with no JavaScript at all. See `xray` there.
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
    if (!frame || prefersReducedMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let raf = 0;
    let x = 0;
    let y = 0;

    const write = () => {
      raf = 0;
      frame.style.setProperty("--lens-x", `${x}px`);
      frame.style.setProperty("--lens-y", `${y}px`);
    };

    const onMove = (event: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
      frame.dataset.tracking = "";
      if (raf === 0) raf = requestAnimationFrame(write);
    };

    const onLeave = () => {
      // Hand it back to the drift. The inline values have to go, or they would
      // keep beating the animation they are handing back to.
      delete frame.dataset.tracking;
      frame.style.removeProperty("--lens-x");
      frame.style.removeProperty("--lens-y");
    };

    frame.addEventListener("pointermove", onMove, { passive: true });
    frame.addEventListener("pointerleave", onLeave);

    return () => {
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
      if (raf !== 0) cancelAnimationFrame(raf);
    };
  }, [prefersReducedMotion]);

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
