"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  // The server cannot know the preference. Assume motion is fine; the real
  // value arrives on hydration, before any animation has been started — every
  // animation here is kicked off from an effect, never during render.
  return false;
}

/**
 * Reads `prefers-reduced-motion` as reactive state, and keeps following it if
 * the visitor changes the setting with the page open.
 *
 * `useSyncExternalStore` rather than `useState` + an effect: subscribing to a
 * browser API is exactly what it is for, and it avoids calling setState
 * synchronously inside an effect, which costs an extra render pass on every
 * mount and is flagged by react-hooks/set-state-in-effect.
 *
 * CSS animations do not need this — app/globals.css has a global
 * `prefers-reduced-motion: reduce` backstop. It is for animation driven from
 * JavaScript, which that backstop cannot reach.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
