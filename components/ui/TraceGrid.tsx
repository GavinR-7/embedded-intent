/**
 * The circuit-board texture.
 *
 * Rendered by the **first band of a page only** — the homepage hero, the
 * service page hero, the work hero. It is a treatment for the top of a page,
 * and repeating it down every void band made it read as wallpaper instead.
 *
 * Passed to `Section` as `overlay` rather than being decided by tone, so that
 * "which band has the texture" is visible at the call site rather than being
 * an emergent property of where a section happens to fall in the alternation.
 *
 * The mask in the `trace-grid` utility fades it out downward, so it never ends
 * on a hard edge.
 */
export function TraceGrid() {
  return (
    <div aria-hidden="true" className="trace-grid pointer-events-none absolute inset-0" />
  );
}
