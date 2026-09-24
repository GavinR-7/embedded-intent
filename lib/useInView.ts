"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Whether an element is anywhere near the viewport.
 *
 * Exists for one rule: every looping animation on this site pauses when it is
 * offscreen. A CSS keyframe loop or a `setInterval` that keeps running after
 * the reader has scrolled past it is main-thread work with nothing to show for
 * it — and on a long page like the homepage there are four of them.
 *
 * `inView` starts `true`, deliberately. If the observer never runs — no
 * IntersectionObserver, a broken polyfill — the animation plays rather than
 * staying frozen, so the failure mode is "slightly more work than necessary"
 * and not "the panel looks broken".
 *
 * 200px of margin so something starts moving just before it is scrolled into
 * view, rather than visibly kicking off once it is already on screen.
 */
export function useInView<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}
