import { caretBlinks, TYPE_MS_PER_CHAR } from "@/lib/heroTimeline";

/**
 * A line of monospace text that types itself on, with a block caret.
 *
 * A **Server Component**: there is no JavaScript in this effect at all. The
 * whole line is in the HTML from first paint and a stepped `clip-path` wipe
 * uncovers it one character at a time, so a crawler, a screen reader and a
 * visitor with JavaScript off all get the finished sentence — the animation is
 * the only thing that can fail, and when it does the text is simply there.
 *
 * Three boxes, and each one has a job:
 *
 *   `type-line`   sized to the finished text, and the caret's frame of
 *                 reference: `translateX(100%)` over this box is exactly the
 *                 width of the line, whatever the font does.
 *   `type-text`   the text, under the wipe.
 *   `type-caret`  a block at the left edge of that box, walked across it on the
 *                 same stepped timing so it always sits on the wipe boundary.
 *
 * Why the character count has to be exact: the wipe divides the element's width
 * into N equal steps, and that is only the same thing as N characters because
 * the line is monospace with uniform letter-spacing. Used on anything
 * proportional it would still look like typing, but the steps would not land on
 * the glyphs.
 *
 * Timing comes from lib/heroTimeline.ts so the rest of the intro can be
 * scheduled against it.
 */
export function TypeOn({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const chars = text.length;
  const durationMs = chars * TYPE_MS_PER_CHAR;

  /*
   * Blink for about a second past the last character, then stop.
   *
   * Shared with lib/heroTimeline.ts rather than worked out again here: the
   * first version of this component did its own arithmetic, got the period
   * wrong by a factor of two, and gave the caret one blink for a sentence that
   * takes nearly three seconds to finish typing.
   */
  const blinks = caretBlinks(durationMs);

  return (
    <span
      className={`type-line ${className}`.trim()}
      style={
        {
          "--type-dur": `${durationMs}ms`,
          /*
           * The whole timing function, not just the count.
           *
           * `steps(var(--type-chars), end)` reads better and is a trap: if the
           * substitution is ever invalid the property becomes
           * invalid-at-computed-value-time and silently falls back to `ease`,
           * which turns typing into a smooth wipe with nothing in the console.
           * A custom property holding a complete value always substitutes.
           */
          "--type-steps": `steps(${chars}, end)`,
          "--caret-blinks": blinks,
        } as React.CSSProperties
      }
    >
      <span className="type-text">{text}</span>
      <span aria-hidden="true" className="type-caret" />
    </span>
  );
}
