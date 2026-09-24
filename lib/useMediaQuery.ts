"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A media query as reactive state, that keeps following the query.
 *
 * `useSyncExternalStore` rather than `useState` + an effect. Subscribing to a
 * browser API is exactly what it is for, and it avoids calling setState
 * synchronously inside an effect — which costs an extra render pass on every
 * mount and is what `react-hooks/set-state-in-effect` exists to catch.
 *
 * The server snapshot is always `false`. The server cannot know the viewport
 * or the visitor's settings, so the HTML is built for the negative case and the
 * real answer arrives on hydration. That is also why it is the safe default
 * here: "not a desktop" and "motion is fine" are both the conservative
 * assumption for the thing being decided.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
