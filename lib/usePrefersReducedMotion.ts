"use client";

import { useMediaQuery } from "./useMediaQuery";

/**
 * Reads `prefers-reduced-motion` as reactive state, and keeps following it if
 * the visitor changes the setting with the page open.
 *
 * CSS animations do not need this — app/globals.css has a global
 * `prefers-reduced-motion: reduce` backstop. It is for animation driven from
 * JavaScript, which that backstop cannot reach: a `setInterval`, an
 * IntersectionObserver that would otherwise pin a section, a `pointermove`
 * listener that should never have been attached.
 *
 * The server snapshot is `false` — the server cannot know the preference, so
 * the real value arrives on hydration, before any animation has started. Every
 * animation here is kicked off from an effect, never during render, so there is
 * nothing to interrupt.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
