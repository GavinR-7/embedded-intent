"use client";

import { useEffect, useState } from "react";

import { DotSphere } from "@/components/category/visuals/DotSphere";
import {
  FINAL_FRAME,
  FRAMES,
  PhoneThread,
} from "@/components/category/visuals/PhoneThread";
import { useInView } from "@/lib/useInView";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** How long a pulse takes to travel from the core to the handset. */
const PULSE_MS = 700;

/**
 * How long to leave the page alone before the sphere mounts, if nothing else
 * wakes it first.
 *
 * `requestIdleCallback` is the real gate; this is the fallback for Safari, which
 * has only recently shipped it, and for a main thread so busy that idle never
 * arrives.
 */
const IDLE_FALLBACK_MS = 2000;

/**
 * Whether the page has finished the work that matters before this can start.
 *
 * The sphere is the one thing on this page with a per-frame loop, and
 * /ai-automation is a page whose mobile score is measured. So it does not exist
 * until the browser says it has nothing better to do — or until the reader
 * touches something, which is a stronger signal than idle that the page is up.
 */
function useIdleMount() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idle = 0;
    let timer = 0;

    const go = () => setReady(true);

    if (typeof window.requestIdleCallback === "function") {
      idle = window.requestIdleCallback(go, { timeout: IDLE_FALLBACK_MS });
    } else {
      timer = window.setTimeout(go, IDLE_FALLBACK_MS);
    }

    window.addEventListener("pointerdown", go, { once: true, passive: true });
    window.addEventListener("keydown", go, { once: true });

    return () => {
      if (idle !== 0) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
    };
  }, []);

  return ready;
}

/**
 * The connector, and the pulse that runs along it.
 *
 * Two paths, one per layout, because the sphere is above the phone on a narrow
 * screen and beside it on a wide one — and a curve that works for one reads as a
 * kink in the other. Only one is ever displayed; the pulse finds whichever that
 * is with `offsetParent`, the same test the mark controller uses.
 *
 * The travelling dot is moved with `getPointAtLength` rather than with
 * `offset-path`: it is a transform on one element for 700ms, it is exact on a
 * curve the browser has already measured, and it does not depend on a property
 * whose animation behaviour varies by engine.
 */
function Connector({ pulseKey, active }: { pulseKey: number; active: boolean }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    // 0 is the initial render; nothing has been sent yet.
    if (!node || !active || pulseKey === 0) return;

    /*
     * Whichever of the two is actually displayed. `offsetParent` is an
     * HTMLElement property and both <svg>s share one wrapper, so neither the
     * paths nor their parents can be told apart that way — a `display: none`
     * box measuring zero can.
     */
    const path = Array.from(node.querySelectorAll<SVGPathElement>("[data-track]")).find(
      (candidate) => (candidate.ownerSVGElement?.getBoundingClientRect().width ?? 0) > 0,
    );
    const dot = path?.ownerSVGElement?.querySelector<SVGCircleElement>("[data-dot]");
    if (!path || !dot) return;

    const length = path.getTotalLength();
    const startedAt = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const k = Math.min((now - startedAt) / PULSE_MS, 1);
      const point = path.getPointAtLength(length * k);

      dot.setAttribute("transform", `translate(${point.x} ${point.y})`);
      // Fades in and out at the ends rather than appearing and vanishing.
      dot.setAttribute("opacity", String(Math.sin(Math.PI * k)));

      if (k < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      dot.setAttribute("opacity", "0");
    };
  }, [active, node, pulseKey]);

  return (
    <div ref={setNode} aria-hidden="true" className="shrink-0">
      {/* Stacked: the pulse drops from the core to the handset. */}
      <svg
        viewBox="0 0 24 40"
        className="h-10 w-6 lg:hidden"
        fill="none"
        stroke="currentColor"
      >
        <path
          data-track=""
          d="M12 0C12 12 4 16 4 22S16 30 16 40"
          className="text-line-strong"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <circle data-dot="" r="2" opacity="0" className="fill-signal" stroke="none" />
      </svg>

      {/* Side by side: it runs across. */}
      <svg
        viewBox="0 0 56 24"
        className="hidden h-6 w-14 lg:block"
        fill="none"
        stroke="currentColor"
      >
        <path
          data-track=""
          d="M0 12C14 12 18 4 28 4S46 20 56 20"
          className="text-line-strong"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <circle data-dot="" r="2" opacity="0" className="fill-signal" stroke="none" />
      </svg>
    </div>
  );
}

/**
 * /ai-automation — the core and the handset.
 *
 * ---------------------------------------------------------------------------
 * The argument the picture makes.
 *
 * The phone thread on its own says "a text got answered". Putting the core beside
 * it and running a pulse down the wire every time a message goes out says who
 * answered it — which is the thing this category actually sells, and the thing a
 * screenshot of a text thread cannot say.
 *
 * So the beat belongs here, at the top, and not in either half: one index
 * advancing on one timeout drives the thread, the flare on the sphere and the
 * pulse on the wire. Two timers would drift, and the picture would stop meaning
 * anything within a minute.
 * ---------------------------------------------------------------------------
 *
 * Stacked on a narrow screen with the sphere smaller, side by side from `lg`.
 *
 * Under `prefers-reduced-motion: reduce` this is one static frame: the whole
 * thread at rest, one drawing of the sphere, no pulse and no timer started.
 * Offscreen, the timer stops and so does the sphere.
 *
 * `default` export: it is loaded through `next/dynamic`, which wants one.
 */
export default function AiAutomationVisual() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const sphereReady = useIdleMount();

  const [frame, setFrame] = useState(0);

  const running = !prefersReducedMotion && inView;
  const current = prefersReducedMotion ? FINAL_FRAME : FRAMES[frame];

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(
      () => setFrame((index) => (index + 1) % FRAMES.length),
      FRAMES[frame].ms,
    );
    return () => clearTimeout(id);
  }, [frame, running]);

  /*
   * A pulse per message, not per frame: the typing-dots frames are the same
   * message still arriving, and a wire that flashes while someone is typing is
   * saying the answer was sent twice.
   */
  const pulseKey = current.typing === null ? current.count : current.count + 1;

  return (
    <div
      ref={ref}
      className="flex h-full w-full flex-col items-center justify-center p-3 lg:flex-row lg:gap-1"
    >
      <div className="aspect-square w-20 shrink-0 sm:w-24 lg:w-36">
        {/* Nothing until the page is idle, and an empty box of the right size
            until then — so the arrival costs no layout shift. */}
        {sphereReady && <DotSphere flareKey={pulseKey} />}
      </div>

      <Connector pulseKey={pulseKey} active={running} />

      <PhoneThread frame={current} paused={!inView} />
    </div>
  );
}
