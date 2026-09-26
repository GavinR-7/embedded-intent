/**
 * The hero intro schedule, in one place.
 *
 * ---------------------------------------------------------------------------
 * There are four beats and they have to agree with each other:
 *
 *   1. the eyebrow types on            (CSS animation, duration from the text)
 *   2. the headline lines rise         (CSS animations, one delay per line)
 *   3. "AI" resolves out of noise      (JavaScript, a setTimeout)
 *   4. the lead panel starts stepping  (JavaScript, a setTimeout)
 *
 * Two of those are CSS and two are JavaScript, which is exactly the situation
 * where a sequence drifts: someone adds a word to the eyebrow, the typing gets
 * 100ms longer, and the scramble now starts while the headline is still moving.
 * So nothing hard-codes a start time. Every beat is derived here from the
 * durations in app/globals.css and from the content itself, and both the CSS
 * call sites and the JavaScript ones read the same answer.
 *
 * The durations are duplicated as numbers here because CSS cannot export them.
 * They are the four tokens in the "hero intro" block of app/globals.css, and
 * that block says so.
 * ---------------------------------------------------------------------------
 */

/** `--dur-type-char`. */
export const TYPE_MS_PER_CHAR = 25;

/**
 * `--dur-caret-blink` — one whole blink, on and off.
 *
 * The animation is a two-step square wave over this duration, so one iteration
 * is 400ms lit and 400ms dark, and the iteration count below is a count of
 * blinks rather than of half-blinks.
 */
export const CARET_BLINK_MS = 800;

/** `--dur-line-rise`. */
export const LINE_RISE_MS = 700;

/** `--line-stagger`. */
export const LINE_STAGGER_MS = 120;

/** How long the two glyphs cycle before they resolve. */
export const DECRYPT_MS = 600;

/**
 * How far into the typing the headline starts rising.
 *
 * Not after it. The eyebrow is 46 characters, which is 1.15s of typing, and a
 * headline that is still under its mask a second and a bit into the page is a
 * page that looks broken rather than a page that looks composed. Starting the
 * rise at 60% means the headline is landing as the last few characters of the
 * eyebrow arrive, which reads as one movement instead of two.
 */
const LINES_START_FRACTION = 0.6;

/** The caret keeps blinking this long after the last character lands. */
const CARET_LINGER_MS = 1000;

/**
 * Whole blinks the caret gets: enough to cover the typing plus the linger.
 *
 * `ceil`, not `round` — rounding down would stop the caret *before* the text
 * finished, which is a caret that gives up halfway through its own sentence.
 * The animation is `forwards` on a finite count, so whatever the number it ends
 * hidden rather than pulsing at the reader for the rest of the session.
 */
export function caretBlinks(typeMs: number): number {
  return Math.ceil((typeMs + CARET_LINGER_MS) / CARET_BLINK_MS);
}

/** A beat between the word resolving and the panel taking over. */
const PANEL_GAP_MS = 60;

export type HeroTimeline = {
  /** Total typing time for the eyebrow. */
  typeMs: number;
  /** Whole blinks the caret gets before it goes away. */
  caretBlinks: number;
  /** Delay before line `index` starts rising. */
  lineDelayMs: (index: number) => number;
  /** When the last line has finished moving, and so when the scramble starts. */
  decryptStartMs: number;
  /** When the panel's row sequence begins. */
  panelStartMs: number;
};

export function heroTimeline(eyebrowChars: number, lineCount: number): HeroTimeline {
  const typeMs = eyebrowChars * TYPE_MS_PER_CHAR;
  const linesStartMs = Math.round(typeMs * LINES_START_FRACTION);

  const lineDelayMs = (index: number) => linesStartMs + index * LINE_STAGGER_MS;

  // The last line's delay plus its own duration.
  const decryptStartMs = lineDelayMs(Math.max(lineCount - 1, 0)) + LINE_RISE_MS;

  return {
    typeMs,
    caretBlinks: caretBlinks(typeMs),
    lineDelayMs,
    decryptStartMs,
    panelStartMs: decryptStartMs + DECRYPT_MS + PANEL_GAP_MS,
  };
}
