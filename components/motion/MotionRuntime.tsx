"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * Everything page-wide that needs a pointer or a viewport.
 *
 * Mounted once, in the root layout. Two effects, two listeners for the entire
 * site:
 *
 *   - ONE IntersectionObserver watching every `data-reveal` element. One
 *     observer with N targets, not N observers — an observer per element is
 *     the usual way this is written and it costs one object, one callback
 *     closure and one entry in the browser's intersection bookkeeping per
 *     card on the page.
 *
 *   - ONE delegated `pointermove` on `document` for the cursor-tracked glow on
 *     cards and rows. Delegation is what keeps every card a Server Component:
 *     the alternative is a client wrapper around each grid.
 *
 * It renders nothing.
 */

/** Only elements that have not revealed yet. Re-scanning is therefore cheap. */
const PENDING_SELECTOR = "[data-reveal]:not([data-revealed])";

/** Every reveal target, for working out an element's position in its section. */
const REVEAL_SELECTOR = "[data-reveal]";

/** `Section` puts this on its <section>, and the footer on its <footer>. */
const GROUP_SELECTOR = "[data-reveal-group]";

/**
 * Cards and rows that light up under the cursor.
 *
 * The class, not a data attribute: `spotlight` is a project utility defined in
 * app/globals.css, and it is already on every element that wants the effect, so
 * requiring a second marker beside it would be 31 chances to add one and forget
 * the other. (Which is exactly what happened — this selector read
 * `[data-spotlight]` first, matched nothing, and the tracking silently never
 * ran. The glow still appeared on hover, because that half is pure CSS, so
 * nothing looked broken.) If the utility is ever renamed, rename it here too.
 */
const SPOTLIGHT_SELECTOR = ".spotlight";

/** Wrappers whose animations stop whenever they are not on screen. */
const PAUSE_SELECTOR = "[data-pause-offscreen]";

/**
 * Cap on the stagger index.
 *
 * An eleven-item list at 70ms apart would take 770ms to finish arriving, and
 * the last card would still be fading in well after the reader got to it.
 * After the sixth element everything shares the same delay.
 */
const MAX_STAGGER_INDEX = 6;

/** How long to wait before assuming the observer is never going to work. */
const SAFETY_NET_MS = 3000;

function reveal(node: Element) {
  (node as HTMLElement).dataset.revealed = "";
}

/**
 * Number each section's reveal children in document order.
 *
 * This is the "Section assigns a stagger index automatically" half of the
 * system, and it is done here rather than in the Section component because
 * Section is a Server Component: it would have to walk and clone its children
 * to reach them, which only works for direct children and breaks the moment
 * something is nested one level deeper. A group marker plus a document-order
 * walk at runtime handles any nesting and needs nothing from the author.
 */
function assignStaggerIndices() {
  for (const group of document.querySelectorAll(GROUP_SELECTOR)) {
    const targets = group.querySelectorAll<HTMLElement>(REVEAL_SELECTOR);

    targets.forEach((node, index) => {
      // Already revealed elements keep whatever delay they had; rewriting it
      // would do nothing but dirty their style.
      if (node.dataset.revealed !== undefined) return;
      node.style.setProperty(
        "--reveal-i",
        String(Math.min(index, MAX_STAGGER_INDEX)),
      );
    });
  }
}

export function MotionRuntime() {
  /*
   * A soft navigation replaces the page under this component without
   * remounting it, so the observer has to be rebuilt for the new DOM.
   * `usePathname` subscribes to the router, so this component re-renders on
   * every navigation and the effect below re-runs with the new tree already
   * committed.
   */
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();

  // ---------------------------------------------------------------- reveals
  useEffect(() => {
    // Under reduced motion the CSS never hides anything, so there is nothing
    // to reveal and no reason to watch the viewport.
    if (prefersReducedMotion) return;

    const pending = Array.from(document.querySelectorAll<HTMLElement>(PENDING_SELECTOR));
    if (pending.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      pending.forEach(reveal);
      return;
    }

    let observerRan = false;

    const observer = new IntersectionObserver(
      (entries) => {
        observerRan = true;

        for (const entry of entries) {
          /*
           * Either 15% of the element is showing, or the element is so tall
           * that 15% of it never can be.
           *
           * The second half matters: with a single 0.15 threshold, an element
           * taller than about 6.6 viewports can never reach the ratio, so it
           * would never intersect and never reveal — and because the observer
           * did fire, the safety net below would not catch it either. That is
           * a content-is-invisible bug waiting for the first very long card.
           */
          const root = entry.rootBounds;
          const tallerThanRoot =
            root !== null && entry.boundingClientRect.height > root.height * 0.6;
          const arrived =
            entry.intersectionRatio >= 0.15 ||
            (tallerThanRoot && entry.intersectionRect.height > 0);

          if (!arrived) continue;

          reveal(entry.target);
          // One-shot. Nothing re-hides on the way back up, so there is no
          // reason to keep watching it.
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: [0, 0.15],
        // Reveal 10% into the viewport rather than exactly at the edge, so an
        // element is already settled by the time it is properly in view.
        rootMargin: "0px 0px -10% 0px",
      },
    );

    /*
     * Set up after the next frame, not during this effect.
     *
     * `useEffect` runs after React commits but can still run before the browser
     * has painted, and this does enough work — a stagger index written to every
     * target, then 75 `observe` calls — to land inside the largest-contentful-
     * paint window on a throttled phone. One `requestAnimationFrame` puts all
     * of it after the paint the metric is measuring, and costs nothing visible:
     * an element already on screen still reveals on the frame after that.
     */
    let frame = requestAnimationFrame(() => {
      frame = 0;
      assignStaggerIndices();
      for (const node of pending) observer.observe(node);
    });

    /*
     * Safety net. If the observer has not run at all after three seconds,
     * something is wrong with it and the page is full of invisible text — so
     * show everything and stop.
     */
    const net = setTimeout(() => {
      if (observerRan) return;
      pending.forEach(reveal);
      observer.disconnect();
    }, SAFETY_NET_MS);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      clearTimeout(net);
      observer.disconnect();
    };
  }, [pathname, prefersReducedMotion]);

  // -------------------------------------------------------------- spotlight
  useEffect(() => {
    if (prefersReducedMotion) return;

    // No cursor to follow on a touch screen, and `:hover` sticks after a tap
    // there anyway — so the listener would be pure cost.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let latest: { x: number; y: number; target: HTMLElement } | null = null;

    const write = () => {
      frame = 0;
      const next = latest;
      latest = null;
      if (!next) return;

      // Read layout once per frame at most, and only while the pointer is
      // actually over a card.
      const rect = next.target.getBoundingClientRect();
      next.target.style.setProperty("--spot-x", `${next.x - rect.left}px`);
      next.target.style.setProperty("--spot-y", `${next.y - rect.top}px`);
    };

    const onPointerMove = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        SPOTLIGHT_SELECTOR,
      );
      if (!target) return;

      latest = { x: event.clientX, y: event.clientY, target };
      // Coalesce to one write per frame. Without this, a fast pointer produces
      // several style writes and several forced layouts inside one frame.
      if (frame === 0) frame = requestAnimationFrame(write);
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion]);

  // ----------------------------------------------------------- offscreen pause
  /*
   * "Every looping animation pauses when it is offscreen" is a rule, so it is
   * enforced in one place rather than trusted to each component.
   *
   * A wrapper marks itself `data-pause-offscreen` and this observer toggles
   * `data-paused` on it; one rule in app/globals.css stops every animation
   * inside. That is what lets the hero glow and the industry strip be Server
   * Components — before this they each opened a client island for nothing but a
   * boolean. (`SystemPanel` still uses `useInView` directly, because it has to
   * stop two `setInterval`s, which CSS cannot reach.)
   *
   * Not gated on reduced motion: under `reduce` there is nothing animating to
   * pause, and the attribute is harmless.
   */
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(PAUSE_SELECTOR);
    if (targets.length === 0 || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const node = entry.target as HTMLElement;
          if (entry.isIntersecting) delete node.dataset.paused;
          else node.dataset.paused = "";
        }
      },
      // Start just before it scrolls into view, rather than visibly kicking off
      // once it is already there.
      { rootMargin: "200px" },
    );

    for (const node of targets) observer.observe(node);
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
