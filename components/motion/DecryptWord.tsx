"use client";

import { useEffect, useRef, useState } from "react";

import { useInView } from "@/lib/useInView";
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

/** The glitch window, and the range it waits between glitches. */
const GLITCH_MS = 150;
const GLITCH_MIN_GAP_MS = 8000;
const GLITCH_MAX_GAP_MS = 10000;

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

/**
 * Two letters that resolve out of noise, and glitch now and then afterwards.
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
 * Afterwards it glitches for 150ms every 8–10 seconds, at a fresh random
 * interval each time so it never settles into a rhythm. `data-glitch` is what
 * the CSS in app/globals.css hangs the effect off; it is an attribute rather
 * than a class because adding and removing it is what re-triggers the
 * animation. The loop stops the moment the hero leaves the viewport, and never
 * starts at all under `prefers-reduced-motion: reduce`.
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
  const { ref, inView } = useInView<HTMLSpanElement>();

  const [display, setDisplay] = useState(word);
  const [glitching, setGlitching] = useState(false);

  /*
   * Set once the scramble has finished, so the glitch loop below knows it may
   * start — and so a reader who scrolls the hero away and back does not get the
   * whole resolve again.
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

  // ---------------------------------------------------------------- the glitch
  /*
   * `useRef` for the pending timer rather than state: the schedule is not
   * something the render depends on, and putting it in state would re-render the
   * headline every time the next glitch is booked.
   */
  const timerRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion || !resolved || !inView) return;

    const schedule = () => {
      const gap =
        GLITCH_MIN_GAP_MS +
        Math.random() * (GLITCH_MAX_GAP_MS - GLITCH_MIN_GAP_MS);

      timerRef.current = window.setTimeout(() => {
        setGlitching(true);
        timerRef.current = window.setTimeout(() => {
          setGlitching(false);
          schedule();
        }, GLITCH_MS);
      }, gap);
    };

    schedule();

    return () => {
      window.clearTimeout(timerRef.current);
      setGlitching(false);
    };
  }, [inView, prefersReducedMotion, resolved]);

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
    <span ref={ref} className="relative inline-block whitespace-nowrap">
      {/* Reserves exactly the finished word's width. `invisible` is
          `visibility: hidden`, which keeps it out of the accessibility tree —
          the readable copy is the third span. */}
      <span aria-hidden="true" className="invisible">
        {word}
      </span>

      {/* Absolute on the wrapper rather than on `.glitch` itself: the utility
          declares `position: relative` for its own pseudo-elements, and two
          position utilities on one element is a fight over which layer wins. */}
      <span aria-hidden="true" className="absolute left-0 top-0">
        <span
          /* The pseudo-elements that draw the two offset slices take their text
             from here — `content: attr(data-word)`. The resolved word, always,
             because the glitch only ever runs after the scramble. */
          data-word={word}
          data-glitch={glitching ? "" : undefined}
          className="glitch"
        >
          {display}
        </span>
      </span>

      {/* The word itself, for anything that reads rather than looks. */}
      <span className="sr-only">{word}</span>
    </span>
  );
}
