"use client";

import { useEffect, useRef } from "react";

import { useInView } from "@/lib/useInView";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * Points on the sphere.
 *
 * Down from 400. Four hundred dots in a 144px circle cannot each be 2-3px
 * without merging into a field, so they were drawn at 0.5-1.7px — below the
 * size at which a filled arc has a solid centre. The result antialiased into
 * haze. Fewer, larger, crisper is the whole fix.
 */
const POINT_COUNT = 240;

/** The equator, drawn as its own denser ring of points. */
const RING_COUNT = 72;

/** One full turn. Slow: it is a presence, not a spinner. */
const ROTATION_MS = 42000;

/**
 * The axis lean, applied after the spin rather than baked into the points.
 *
 * Order matters and it was wrong before. Tilting the cloud once and then
 * rotating it about the world Y axis makes the lean itself wobble through the
 * turn. Spinning about the sphere's own axis and then tilting the result is a
 * globe: the axis stays put, which is what lets the equator below be a stable
 * ring instead of a shape that flexes.
 */
const TILT = 0.42;

/** Cap on the backing-store scale. A 3x phone would rasterise nine times the
 *  pixels of a 1x screen for a drawing made of 300 small dots. */
const MAX_DPR = 2;

/** How long the core stays bright after a message goes out. */
const FLARE_MS = 900;

/**
 * The thinking ripple: how long the wave takes to cross the whole sphere.
 *
 * It starts at the point facing the viewer and travels to the far side, so it
 * has half a turn of surface to cover. The pulse to the phone is held until this
 * is most of the way across — see AiAutomationVisual — so the sequence reads as
 * "it worked something out, then it sent something".
 */
const RIPPLE_MS = 1100;

/** How far the surface lifts at the crest, as a fraction of the radius. */
const RIPPLE_AMPLITUDE = 0.17;

/** How wide the crest is, in radians of arc. Narrow reads as a wave, wide as a breath. */
const RIPPLE_WIDTH = 0.42;

/** Unit vectors, evenly scattered. Untilted — the tilt is applied per frame. */
function fibonacciSphere(count: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));

  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (index / (count - 1)) * 2;
    const radius = Math.sqrt(Math.max(1 - y * y, 0));
    const theta = golden * index;
    return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius };
  });
}

/**
 * The cloud, and the equator.
 *
 * The equator is a separate, denser ring rather than a stroked ellipse, and that
 * is deliberate: drawn as points it goes through exactly the same rotation,
 * depth and ripple maths as everything else, so it leans with the sphere and
 * lifts with the wave instead of sitting over the top of them like a sticker.
 */
const POINTS = fibonacciSphere(POINT_COUNT);

const RING = Array.from({ length: RING_COUNT }, (_, index) => {
  const theta = (index / RING_COUNT) * Math.PI * 2;
  return { x: Math.cos(theta), y: 0, z: Math.sin(theta) };
});

/**
 * The AI core: a turning sphere of points, that ripples when it is working.
 *
 * ---------------------------------------------------------------------------
 * A 2D canvas, on purpose. No WebGL, no library.
 *
 * Three hundred filled arcs per frame is nothing, and the work is bounded by the
 * number of points rather than by the size of the box — the opposite of the
 * gradient effects elsewhere on this site. WebGL would mean a context, shaders
 * and a fallback for the machines that refuse one, to draw dots.
 *
 * The accent colour is read from the element's own computed `color` rather than
 * written as a hex here. `--color-signal` is authored in OKLCH and the palette
 * is meant to have exactly one definition; canvas takes the computed value as
 * is, so there is no second copy of the brand colour to fall out of step.
 * ---------------------------------------------------------------------------
 *
 * **Crispness is three separate decisions**, and it needed all three. Fewer
 * points so each one can be big enough to have a solid centre. Positions rounded
 * to whole device pixels, because a 2px dot centred on a half pixel is a 3px
 * smudge and 300 of them are a fog. And drawing in device-pixel space rather
 * than scaling the context, so that rounding means what it says.
 *
 * Three things stop it being a permanent tax on the main thread: it does not run
 * off screen, it does not run when the tab is hidden, and under
 * `prefers-reduced-motion: reduce` it draws one frame and stops. The parent also
 * does not mount it until the page has gone idle — see AiAutomationVisual.
 */
export function DotSphere({ flareKey }: { flareKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref: inViewRef, inView } = useInView<HTMLCanvasElement>();

  /*
   * Refs, not state. Both change every frame while they decay, and none of that
   * is anything React needs to know about.
   */
  const flareAt = useRef(0);
  const rippleAt = useRef(0);

  useEffect(() => {
    // 0 is the initial render, which is not a message going out.
    if (flareKey > 0) {
      const now = performance.now();
      flareAt.current = now;
      rippleAt.current = now;
    }
  }, [flareKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const color = getComputedStyle(canvas).color;

    /* Device pixels, not CSS pixels. See the note on crispness above. */
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.round(rect.width * dpr);
      height = Math.round(rect.height * dpr);
      canvas.width = width;
      canvas.height = height;
      // No `setTransform`: the drawing below is already in device pixels, which
      // is what makes rounding a position land on a real pixel boundary.
      context.setTransform(1, 0, 0, 1, 0, 0);
    };

    const draw = (angle: number, flare: number, ripple: number) => {
      if (width === 0 || height === 0) return;

      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      // Nothing here is blurred. Stated rather than assumed: a stray
      // `shadowBlur` is the usual way a canvas of small dots turns to soup.
      context.shadowBlur = 0;

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) / 2 - 4 * dpr;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cosT = Math.cos(TILT);
      const sinT = Math.sin(TILT);

      // Where the crest is, as an angle from the point facing the viewer.
      const crest = ripple > 0 ? ripple * (Math.PI + 0.5) - 0.25 : -1;
      // The wave loses height as it crosses, so it settles rather than stopping.
      const amplitude = RIPPLE_AMPLITUDE * (1 - ripple * 0.45);

      const plot = (
        point: { x: number; y: number; z: number },
        minSize: number,
        sizeRange: number,
        minAlpha: number,
        alphaRange: number,
      ) => {
        // Spin about the sphere's own axis...
        const x1 = point.x * cosA - point.z * sinA;
        const z1 = point.x * sinA + point.z * cosA;
        // ...then lean the whole thing toward the viewer.
        const y2 = point.y * cosT - z1 * sinT;
        const z2 = point.y * sinT + z1 * cosT;

        /*
         * The ripple, as a radial displacement.
         *
         * `z2` is the cosine of the angle between this point and the viewer,
         * because both are unit vectors and the viewer is (0, 0, 1) — so the
         * arc distance from where the wave started is just `acos(z2)`, with no
         * dot product to compute. The crest is a gaussian over that distance,
         * and every point is pushed straight out from the centre by it.
         */
        let scale = 1;
        if (crest >= 0) {
          const arc = Math.acos(Math.max(-1, Math.min(1, z2)));
          const offset = (arc - crest) / RIPPLE_WIDTH;
          scale = 1 + amplitude * Math.exp(-offset * offset);
        }

        // 0 at the back of the sphere, 1 at the front. Everything else is this.
        const depth = (z2 + 1) / 2;

        /*
         * Rounded to whole device pixels. This is the difference between a dot
         * and a smudge: an arc centred on a half pixel is spread across two, and
         * three hundred of those read as haze rather than as points.
         */
        const px = Math.round(cx + x1 * radius * scale);
        const py = Math.round(cy + y2 * radius * scale);

        // Squared, so the back hemisphere falls away fast instead of fogging
        // the front. Brightened while the core is flaring.
        const alpha = Math.min((minAlpha + depth * depth * alphaRange) * (1 + flare * 0.8), 1);
        const size = minSize + depth * sizeRange;

        context.globalAlpha = alpha;
        context.beginPath();
        context.arc(px, py, size * dpr, 0, Math.PI * 2);
        context.fill();
      };

      // The surface. 1.4px at the back, 2.8px at the front.
      for (const point of POINTS) plot(point, 1.4, 1.4, 0.06, 0.74);

      // The equator, a shade smaller and brighter, so it reads as a line
      // through the cloud rather than as more cloud.
      for (const point of RING) plot(point, 1.1, 0.9, 0.05, 0.6);

      context.globalAlpha = 1;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // One frame, and nothing else. `reduce` asked for a picture, not a loop.
    if (prefersReducedMotion) {
      draw(0, 0, 0);
      return () => observer.disconnect();
    }

    let raf = 0;

    const step = (now: number) => {
      raf = requestAnimationFrame(step);

      const sinceFlare = now - flareAt.current;
      const flare =
        flareAt.current === 0 || sinceFlare > FLARE_MS ? 0 : 1 - sinceFlare / FLARE_MS;

      const sinceRipple = now - rippleAt.current;
      const ripple =
        rippleAt.current === 0 || sinceRipple > RIPPLE_MS ? 0 : sinceRipple / RIPPLE_MS;

      draw((now % ROTATION_MS) * ((2 * Math.PI) / ROTATION_MS), flare, ripple);
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
