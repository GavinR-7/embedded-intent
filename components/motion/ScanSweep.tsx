"use client";

import { useEffect, useRef } from "react";

import { useInView } from "@/lib/useInView";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** How often the reading is taken. */
const SCAN_EVERY_MS = 12000;

/** `--dur-scan` in app/globals.css. One pass down the heading. */
const SCAN_MS = 900;

/**
 * A lit rule that crosses the headline every twelve seconds.
 *
 * ---------------------------------------------------------------------------
 * What this replaced, and why.
 *
 * "AI" used to glitch every eight to ten seconds: a jitter on the word plus two
 * colour-split slices pulled apart. It was the one effect on the site that had
 * been granted an exception to "transform and opacity only", and it is gone — so
 * the exception is gone with it, and there is no `mix-blend-mode` or animated
 * `clip-path` left anywhere.
 *
 * It went for a content reason rather than a performance one. A headline that
 * says the AI picks up when you can't should not look like it is malfunctioning
 * twice a minute. A single line passing down the block reads as an instrument
 * taking a reading, which is the claim the page is actually making.
 *
 * The one-time decrypt on load stayed — see components/motion/DecryptWord.tsx.
 * ---------------------------------------------------------------------------
 *
 * Inert until this component sets `data-scan`: there is no animation on the
 * element at first paint, and the first pass is twelve seconds in, long after
 * anything the LCP measurement accounts for. That is the same rule the ambient
 * grid cells were rewritten to obey.
 *
 * Stops when the hero is offscreen, and never starts at all under
 * `prefers-reduced-motion: reduce` — where the CSS also removes the element, so
 * a failure of this component cannot leave a line sitting across the headline.
 */
export function ScanSweep() {
  const ref = useRef<HTMLSpanElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref: inViewRef, inView } = useInView<HTMLSpanElement>();

  useEffect(() => {
    if (prefersReducedMotion || !inView) return;

    const node = ref.current;
    if (!node) return;

    /*
     * The attribute has to come off between passes. It is what triggers the
     * animation, and re-adding an attribute that is already there does nothing at
     * all — so without the clear, the line would sweep once and never again.
     */
    let clear = 0;
    const interval = window.setInterval(() => {
      node.dataset.scan = "";
      clear = window.setTimeout(() => delete node.dataset.scan, SCAN_MS);
    }, SCAN_EVERY_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(clear);
      delete node.dataset.scan;
    };
  }, [inView, prefersReducedMotion]);

  return (
    <span
      aria-hidden="true"
      ref={(node) => {
        ref.current = node;
        inViewRef.current = node;
      }}
      className="scan-line"
    />
  );
}
