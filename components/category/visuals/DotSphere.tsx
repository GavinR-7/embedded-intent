"use client";

import { useEffect, useRef } from "react";

import { useInView } from "@/lib/useInView";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Points on the sphere. Enough to read as a surface, few enough to draw cheaply. */
const POINT_COUNT = 400;

/** One full turn. Slow: it is a presence, not a spinner. */
const ROTATION_MS = 42000;

/**
 * A fixed lean, applied once at module scope.
 *
 * Without it every point of a Y-rotated sphere travels a horizontal circle and
 * the whole thing reads as a cylinder seen end-on. Tilting the point cloud once
 * — rather than tilting per frame — costs nothing and is what makes the poles
 * visible.
 */
const TILT = 0.38;

/**
 * Cap on the backing-store scale.
 *
 * A 3x phone would otherwise rasterise nine times the pixels of a 1x screen for
 * a drawing made of four hundred two-pixel dots, where the difference is not
 * visible. Capping at 2 is the difference between this being free and this being
 * the most expensive thing on the page.
 */
const MAX_DPR = 2;

/** How long the core stays bright after a message goes out. */
const FLARE_MS = 900;

/**
 * The Fibonacci sphere: the standard way to scatter N points evenly on a sphere.
 *
 * Latitude bands crowd at the poles and look like a wireframe globe. Stepping the
 * height linearly and the angle by the golden angle gives a spiral with no
 * visible seam and no clumping — which is what makes four hundred points read as
 * a surface rather than as a pattern.
 */
const POINTS = (() => {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const cos = Math.cos(TILT);
  const sin = Math.sin(TILT);

  return Array.from({ length: POINT_COUNT }, (_, index) => {
    const y = 1 - (index / (POINT_COUNT - 1)) * 2;
    const radius = Math.sqrt(Math.max(1 - y * y, 0));
    const theta = golden * index;

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    // Lean it, once.
    return { x, y: y * cos - z * sin, z: y * sin + z * cos };
  });
})();

/**
 * The AI core: four hundred points on a slowly turning sphere.
 *
 * ---------------------------------------------------------------------------
 * A 2D canvas, on purpose. No WebGL, no library.
 *
 * Four hundred filled arcs per frame is nothing — the work is bounded by the
 * number of points and not by the size of the box, which is the opposite of the
 * gradient effects elsewhere on this site. WebGL would mean a context, shaders
 * and a fallback path for the machines that refuse one, to draw dots.
 *
 * The accent colour is read from the element's own computed `color` rather than
 * written as a hex here. `--color-signal` is authored in OKLCH and the palette is
 * meant to have exactly one definition; canvas takes the computed value as-is, so
 * there is no second copy of the brand colour to fall out of step.
 * ---------------------------------------------------------------------------
 *
 * Three things stop it being a permanent tax on the main thread: it does not run
 * when it is off screen, it does not run when the tab is hidden, and under
 * `prefers-reduced-motion: reduce` it draws one frame and stops. The parent also
 * does not mount it until the page has gone idle — see AiAutomationVisual.
 */
export function DotSphere({ flareKey }: { flareKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref: inViewRef, inView } = useInView<HTMLCanvasElement>();

  /*
   * The flare is a ref, not state. It changes sixty times a second while it
   * decays, and none of that is anything React needs to know about.
   */
  const flareAt = useRef(0);

  useEffect(() => {
    // 0 is the initial render, which is not a message going out.
    if (flareKey > 0) flareAt.current = performance.now();
  }, [flareKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const color = getComputedStyle(canvas).color;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // Reset rather than accumulate: setting `canvas.width` clears the
      // transform, but a resize that does not change the integer size does not.
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (angle: number, flare: number) => {
      if (width === 0 || height === 0) return;

      context.clearRect(0, 0, width, height);
      context.fillStyle = color;

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) / 2 - 3;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      for (const point of POINTS) {
        const x = point.x * cos - point.z * sin;
        const z = point.x * sin + point.z * cos;

        // 0 at the back of the sphere, 1 at the front. Everything else is this.
        const depth = (z + 1) / 2;

        context.globalAlpha = Math.min((0.07 + depth * 0.6) * (1 + flare * 0.9), 1);
        context.beginPath();
        context.arc(cx + x * radius, cy + point.y * radius, 0.5 + depth * 1.2, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // One frame, and nothing else. `reduce` asked for a picture, not a loop.
    if (prefersReducedMotion) {
      draw(0, 0);
      return () => observer.disconnect();
    }

    let raf = 0;

    const step = (now: number) => {
      raf = requestAnimationFrame(step);

      const since = now - flareAt.current;
      const flare = flareAt.current === 0 || since > FLARE_MS ? 0 : 1 - since / FLARE_MS;

      draw((now % ROTATION_MS) * ((2 * Math.PI) / ROTATION_MS), flare);
    };

    /*
     * Offscreen or hidden, nothing runs. `visibilitychange` matters beyond
     * tidiness: a backgrounded tab throttles rAF rather than stopping it, so
     * without this the sphere keeps redrawing at a second a frame forever.
     */
    const running = () => inView && !document.hidden;

    const sync = () => {
      if (running() && raf === 0) {
        raf = requestAnimationFrame(step);
      } else if (!running() && raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    sync();
    document.addEventListener("visibilitychange", sync);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      observer.disconnect();
      if (raf !== 0) cancelAnimationFrame(raf);
    };
  }, [inView, prefersReducedMotion]);

  return (
    <canvas
      aria-hidden="true"
      ref={(node) => {
        canvasRef.current = node;
        inViewRef.current = node;
      }}
      /* `text-signal` is what the drawing reads its colour from. */
      className="h-full w-full text-signal"
    />
  );
}
