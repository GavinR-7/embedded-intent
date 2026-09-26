"use client";

import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * Glyphs the word cycles through on its way to resolving.
 *
 * Letters and digits because they are the right width in a proportional face,
 * and the four block/bracket characters because without them it reads as a slot
 * machine rather than as noise.
 */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789▓▒░<>#";

/**
 * How often a still-unresolved character is re-rolled.
 *
 * 55ms, not 45: this runs during the window Lighthouse's LCP simulation is
 * accounting for, and every tick is a style recalculation on an h1. It is still
 * eleven frames of noise over a 600ms scramble, which is more than enough to
 * read as noise.
 */
const ROLL_MS = 55;

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

/**
 * Two letters that resolve out of noise, once, on load.
 *
 * ---------------------------------------------------------------------------
 * The accessible word never changes.
 *
 * The scrambling glyphs are `aria-hidden`, and the real word sits beside them in
 * a visually-hidden span for the whole life of the component. So the h1's
 * accessible name is "AI that picks up when you can't." from first paint to last
 * frame — a screen reader never hears "▓#", and neither does a crawler.
 *
 * The first render — the one that ships in the HTML — shows the real word too.
 * Scrambling only starts after mount, which means no JavaScript, a failed
 * hydration or a blocked bundle all leave the correct headline on the page.
 * ---------------------------------------------------------------------------
 *
 * The scramble resolves left to right: with a two-character word, the first
 * letter locks halfway through the window and the second at the end. One
 * interval, not one per character.
 *
 * And then it is done — this component has no loop. It used to glitch for 150ms
 * every 8–10 seconds afterwards, which read as a fault rather than as
 * instrumentation on a headline claiming the AI works. The recurring beat is now
 * a line sweeping down the whole heading instead; see
 * components/motion/ScanSweep.tsx. What is left here is one timer that runs once.
 */
export function DecryptWord({
  word,
  startDelayMs,
  scrambleMs,
}: {
  word: string;
  /** When to start, measured from mount. See lib/heroTimeline.ts. */
  startDelayMs: number;
  scrambleMs: number;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const [display, setDisplay] = useState(word);

  /*
   * Set once the scramble has finished, so the effect below cannot start a second
   * one — a prop change, or a remount from a soft navigation back to the
   * homepage, would otherwise re-scramble a headline that has already resolved.
   */
  const [resolved, setResolved] = useState(false);

  // --------------------------------------------------------------- the resolve
  useEffect(() => {
    if (prefersReducedMotion || resolved) return;

    let roll = 0;

    const start = window.setTimeout(() => {
      const startedAt = performance.now();
      const chars = Array.from(word);

      const tick = () => {
        const elapsed = performance.now() - startedAt;

        if (elapsed >= scrambleMs) {
          window.clearInterval(roll);
          setDisplay(word);
          setResolved(true);
          return;
        }

        // Character i is locked once the window is (i + 1) / n of the way
        // through, so they resolve in reading order rather than all at once.
        setDisplay(
          chars
            .map((char, index) =>
              elapsed >= ((index + 1) / chars.length) * scrambleMs
                ? char
                : randomGlyph(),
            )
            .join(""),
        );
      };

      tick();
      roll = window.setInterval(tick, ROLL_MS);
    }, startDelayMs);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(roll);
    };
  }, [prefersReducedMotion, resolved, scrambleMs, startDelayMs, word]);

  return (
    /*
     * -----------------------------------------------------------------------
     * Three spans, and the layout is pinned by the first one.
     *
     * The scrambling glyphs are not in the flow. "▓#" is not the same width as
     * "AI" in a proportional face, so a glyph swap every 45ms was relaying out
     * the whole headline — eight measurable layout shifts and a CLS of 0.0055
     * on a page whose budget is zero, plus a relayout of an h1 twenty times a
     * second during the window the LCP measurement cares about.
     *
     * So: an invisible copy of the real word reserves the box, the scrambling
     * copy is positioned on top of it, and nothing the scramble does can move
     * anything. A wider glyph overflows its box by a pixel or two instead of
     * pushing the rest of the line.
     * -----------------------------------------------------------------------
     */
    <span className="relative inline-block whitespace-nowrap">
      {/* Reserves exactly the finished word's width. `invisible` is
          `visibility: hidden`, which keeps it out of the accessibility tree —
          the readable copy is the third span. */}
      <span aria-hidden="true" className="invisible">
        {word}
      </span>

      {/* The noise, laid over the box the span above reserved. */}
      <span aria-hidden="true" className="absolute left-0 top-0">
        {display}
      </span>

      {/* The word itself, for anything that reads rather than looks. */}
      <span className="sr-only">{word}</span>
    </span>
  );
}
