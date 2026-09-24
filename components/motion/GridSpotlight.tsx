"use client";

import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * The circuit grid, lit near the cursor.
 *
 * The Tier 1 interactive background from CONTENT_TODO.md, and the only tier that
 * was ever in scope. The constraints recorded there are the whole design:
 *
 *   - No canvas. No WebGL.
 *   - No JavaScript animation loop. The only handler is a rAF-throttled
 *     `pointermove` that writes two custom properties; the paint is entirely
 *     CSS (`trace-grid-lit` in app/globals.css masks a copy of the grid lines
 *     to a circle centered on those two values).
 *   - Inert under `prefers-reduced-motion: reduce` — the listener is never
 *     attached, not merely ignored.
 *   - Inert on coarse pointers, where there is no cursor to follow and the
 *     listener would be pure cost on the device with the least to spare.
 *
 * The listener goes on the `<section>` rather than on this layer, because this
 * layer is inside a `pointer-events: none` wrapper and never sees a pointer.
 * Their boxes are identical — both resolve to the section's padding box — so the
 * section's rect is the right frame of reference for a position inside this one.
 */
export function GridSpotlight() {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || prefersReducedMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const host = layer.closest("section");
    if (!host) return;

    let frame = 0;
    let x = 0;
    let y = 0;

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
    };

    const onPointerLeave = () => {
      delete layer.dataset.lit;
    };

    host.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave);

    return () => {
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion]);

  return <div ref={layerRef} className="trace-grid-lit absolute inset-0" />;
}
