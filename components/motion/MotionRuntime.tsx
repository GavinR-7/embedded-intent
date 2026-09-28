"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * Everything page-wide that needs a pointer or a viewport.
 *
 * Mounted once, in the root layout. A handful of effects, and one listener each
 * for the entire site:
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
 *   - ONE delegated `click` on `document`, so that following a link to the page
 *     you are already on goes back to the top of it.
 *
 * It renders nothing.
 */

/** Only elements that have not revealed yet. Re-scanning is therefore cheap. */
const PENDING_SELECTOR = "[data-reveal]:not([data-revealed])";

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
 * Eleven cards at 60ms apart would take 660ms to finish arriving, and the last
 * one would still be fading in well after the reader reached it. From the fifth
 * element on, everything in one batch shares a delay.
 */
const MAX_STAGGER_INDEX = 4;

/**
 * How fast counts as flying past, in viewport heights per second.
 *
 * Above this there is nothing to see: an element's 600ms fade would finish
 * several screens after the reader has gone by, so the animation is only ever
 * witnessed in arrears, as a screen of half-faded cards catching up. It reveals
 * instantly instead.
 */
const FAST_SCROLL_VIEWPORTS = 2;

/**
 * A scroll sample older than this says nothing about how fast the page is
 * moving NOW. Without it, the reveal that lands just after a fling ends would
 * be judged by the fling's speed.
 */
const VELOCITY_STALE_MS = 100;

/**
 * A jump is not a scroll.
 *
 * `window.scrollTo`, a route change returning to the top, and following an
 * anchor all move the page by thousands of pixels between one frame and the
 * next, which as a velocity is six figures — and would class every element on
 * the destination screen as flown past.
 *
 * That is not theoretical: it made every navigation from low on a page deliver
 * its next screen with no animation at all, because Next scrolls the new route
 * to the top and the listener below saw a 12,035px move.
 *
 * The test is the DISTANCE BETWEEN TWO CONSECUTIVE SAMPLES, with no reference to
 * how long they were apart — which is the version that works. Scrolling cannot
 * cover a viewport height between two scroll events, because the browser fires
 * one per frame for as long as the page is moving; a hard fling on a phone
 * manages a tenth of that per frame. So the only way to see a whole screen of
 * travel in one sample is for the page to have been put there.
 *
 * (The first attempt at this also required the two samples to be within one
 * frame of each other, which sounds stricter and is simply wrong: the effect
 * takes its first sample when it runs, the router scrolls a few milliseconds
 * later, and 12,035px over 50ms is not one frame — so the rule never fired and
 * every route change still arrived unanimated.)
 */
const TELEPORT_VIEWPORTS = 1;

/**
 * How far below the fold still counts as arriving, in viewport heights.
 *
 * Slightly looser than the observer's own `rootMargin` of 8%, and the slack is
 * the point: the observer decides when this callback runs and the live rect read
 * inside it decides what to do, so the second test has to be the more generous
 * of the two. An element the observer reports as arriving and the callback
 * decides is not yet arriving will never be reported again.
 */
const ARRIVAL_FOLD = 1.1;

/** How long to wait before assuming the observer is never going to work. */
const SAFETY_NET_MS = 3000;

function reveal(node: Element) {
  (node as HTMLElement).dataset.revealed = "";
}

/**
 * Revealed with no animation at all. One rule in app/globals.css keys off the
 * value; the end state is the same as an ordinary reveal.
 */
function revealInstantly(node: Element) {
  (node as HTMLElement).dataset.revealed = "instant";
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

    /*
     * Scroll speed, in px/s, sampled from the scroll event rather than measured
     * inside the observer callback.
     *
     * One listener, two numbers, no layout read: `scrollY` is already available
     * to the event. The observer cannot work this out for itself — it is handed
     * rectangles, not a velocity — and asking for `scrollY` inside its callback
     * would be a fresh read on a frame that is already committing style.
     */
    let lastY = window.scrollY;
    let lastAt = performance.now();
    let pxPerSecond = 0;

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const elapsed = now - lastAt;
      // Under a millisecond apart, the division is mostly noise.
      if (elapsed < 1) return;

      const distance = Math.abs(y - lastY);

      // A teleport, not a fling. See TELEPORT_VIEWPORTS.
      pxPerSecond =
        distance > TELEPORT_VIEWPORTS * window.innerHeight
          ? 0
          : (distance / elapsed) * 1000;

      lastY = y;
      lastAt = now;
    };

    const flyingPast = () =>
      performance.now() - lastAt < VELOCITY_STALE_MS &&
      pxPerSecond > FAST_SCROLL_VIEWPORTS * window.innerHeight;

    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        observerRan = true;

        /*
         * -------------------------------------------------------------------
         * The stagger is by ARRIVAL, not by position in the section.
         *
         * Numbering a section's children in document order — which is what this
         * used to do — gives every element a fixed delay whether or not anything
         * else arrives with it. Scroll slowly and each card waits out the delay
         * of the cards above it for nothing. Scroll quickly and a whole
         * section's worth of delays fire at once, which is the burst.
         *
         * An IntersectionObserver callback is already the right batch: it holds
         * exactly the elements that crossed the line in the same frame. Sorting
         * those top to bottom (then left to right, for a row of cards, which
         * share a top) and numbering them is a stagger of precisely the elements
         * the reader is about to look at, and nothing else.
         * -------------------------------------------------------------------
         */
        /*
         * -------------------------------------------------------------------
         * THE RECTANGLES ARE READ LIVE, NOT TAKEN FROM THE ENTRY.
         *
         * `entry.boundingClientRect` is a snapshot from when the browser
         * computed the intersection, and the callback runs later. Usually the
         * difference is nothing. On a soft navigation it is everything: React
         * commits the new page, this effect observes its elements, and only
         * THEN does the router scroll the new route to the top — so the
         * snapshot describes the new page's first screen as seen from 12,000px
         * down, every element in it reporting a `bottom` far above the viewport.
         * Classified from the snapshot, every navigation from low on a page
         * delivered its next screen already revealed, with no animation at all.
         *
         * So the observer is treated as what it reliably is — a signal that
         * something may have changed — and the positions are read for real. All
         * the reads happen in this loop, before any write below, so it is one
         * layout flush per callback and not one per element.
         * -------------------------------------------------------------------
         */
        const arriving: { node: HTMLElement; rect: DOMRect }[] = [];
        const passed: HTMLElement[] = [];
        const fold = window.innerHeight * ARRIVAL_FOLD;

        for (const entry of entries) {
          const node = entry.target as HTMLElement;
          const rect = node.getBoundingClientRect();

          /*
           * Already above the viewport. The reader has passed it — they scrolled
           * through it faster than the observer reported, or the page was opened
           * part-way down at an anchor. There is nothing to animate into view.
           */
          if (rect.bottom <= 0) {
            passed.push(node);
            continue;
          }

          /*
           * Still below the fold: wait for it. `isIntersecting` is taken as a
           * yes even when the live rect disagrees, because an observer that has
           * reported an element will not report it again until its state
           * changes — dropping one here on a stricter test of our own is how an
           * element ends up hidden for good.
           */
          if (!entry.isIntersecting && rect.top >= fold) continue;

          arriving.push({ node, rect });
        }

        for (const node of passed) {
          revealInstantly(node);
          observer.unobserve(node);
        }

        if (arriving.length === 0) return;

        if (flyingPast()) {
          for (const { node } of arriving) {
            revealInstantly(node);
            observer.unobserve(node);
          }
          return;
        }

        arriving.sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);

        arriving.forEach(({ node }, index) => {
          node.style.setProperty("--reveal-i", String(Math.min(index, MAX_STAGGER_INDEX)));
          reveal(node);
          // One-shot. Nothing re-hides on the way back up, so there is no
          // reason to keep watching it.
          observer.unobserve(node);
        });
      },
      {
        threshold: 0,
        /*
         * A POSITIVE bottom margin, which grows the root box downwards: an
         * element intersects while it is still 8% of a viewport BELOW the fold.
         * The 600ms fade therefore plays as the element comes onto the screen
         * and is finished by the time it is properly in view.
         *
         * The old value was `-10%`, which shrank the box and meant nothing began
         * moving until the element was a tenth of a screen inside it — late,
         * and then trying to catch up in front of the reader.
         */
        rootMargin: "0px 0px 8% 0px",
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
      window.removeEventListener("scroll", onScroll);
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

  // ------------------------------------------------- a link to the current page
  /*
   * Clicking a link to the page you are already on takes you to the top of it.
   *
   * A router that does nothing is the correct behaviour for a navigation to the
   * same URL, and it is the wrong behaviour for the thing people are actually
   * doing when they click the logo: they are asking to start again. Nothing at
   * all happens today — no scroll, no feedback — which reads as a broken link.
   *
   * ---------------------------------------------------------------------------
   * Delegated on `document`, rather than a handler on each link.
   *
   * The site has the logo, five nav tabs' worth of dropdown items, a mobile
   * sheet and four columns of footer links, spread over a client Header and a
   * server Footer. Adding an `onClick` to each one means either repeating the
   * same nine lines a dozen times or turning the footer into a client component
   * to hold them. One listener covers every link on every page, including ones
   * added later, and keeps the footer on the server.
   *
   * WHY THERE IS NO `defaultPrevented` GUARD: `next/link` calls
   * `preventDefault()` in its own click handler, and React's delegated listener
   * is attached to the document at hydration — before this one — so by the time
   * we run, every internal link has already been prevented. Bailing on that flag
   * would mean bailing on every link we care about. `preventDefault` here is
   * therefore belt and braces for the no-JS-router case; the scroll is ours
   * either way. Other handlers on the link still run, which is exactly how the
   * mobile sheet closes itself when you tap the logo inside it.
   * ---------------------------------------------------------------------------
   */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Let the browser have anything that is not a plain left click: a new
      // tab, a new window, a download, a context menu.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const link = (event.target as Element | null)?.closest("a[href]");
      if (!link) return;
      if (link.hasAttribute("download")) return;

      const target = link.getAttribute("target");
      if (target !== null && target !== "_self") return;

      let url: URL;
      try {
        url = new URL((link as HTMLAnchorElement).href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      /*
       * An in-page anchor is a link to the current page with somewhere specific
       * to go, and it already works. `/#how-it-works` on the homepage is the one
       * the site actually uses.
       */
      if (url.hash !== "") return;

      if (
        url.pathname + url.search !==
        window.location.pathname + window.location.search
      ) {
        return;
      }

      event.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "instant" : "smooth",
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
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
   *
   * -------------------------------------------------------------------------
   * THE TRAP: this scans ONCE per navigation.
   *
   * Anything in the DOM by then is watched for the life of the page. Anything
   * that mounts later — a `next/dynamic` chunk with `ssr: false`, a panel
   * opened on click — is not, and its `data-pause-offscreen` marker sits there
   * doing nothing, which looks exactly like it is working.
   *
   * That happened. The /websites lens carried the marker and kept drifting
   * after the hero had scrolled away; it was caught by measuring, not by
   * reading. Late-mounting islands gate themselves with `useInView` and set
   * `data-paused` directly. A MutationObserver over the document would close
   * the hole generically, and would cost more on every page of the site than
   * the two components that actually need it.
   * -------------------------------------------------------------------------
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
