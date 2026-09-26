/**
 * A controller that lights one inert element at a time, at random.
 *
 * ---------------------------------------------------------------------------
 * Three effects on this site need exactly this shape, and it is worth naming
 * why it is a shape at all rather than three loops.
 *
 *   - the ambient cells on a hero grid          (components/motion/GridSpotlight)
 *   - the signal pulses on /ai-automation       (the same file)
 *   - the crosshairs under the /websites lens   (components/category/visuals/XrayLens)
 *
 * All three want elements that brighten and fade in an order nobody can predict,
 * and all three are forbidden the obvious implementation. A set of CSS loops with
 * staggered delays is what this started as, and it cost 0.6s of simulated mobile
 * LCP: an element with a running compositable animation is promoted to its own
 * layer, the promotion lands inside the window the metric accounts for, and no
 * amount of deferring the start moves it off that path. Four elements cost the
 * same as twelve, so it is not the paint.
 *
 * What measured at baseline was elements with NO animation at first paint. So
 * that is the rule here: the elements are inert, an attribute starts one of them,
 * and this picks which and when.
 * ---------------------------------------------------------------------------
 *
 * Picking from the elements that are currently *unlit* rather than from all of
 * them is what stops one being re-triggered while it is still fading out, which
 * reads as a flicker rather than as a pulse. `offsetParent === null` skips
 * anything `display: none` at this breakpoint, so a hidden element is passed over
 * instead of being chosen and lighting nothing.
 *
 * Returns its own teardown, and that teardown clears the attribute from
 * everything: the timeouts that would have cleared them are about to be
 * irrelevant, and an element frozen at full brightness is the one state these
 * effects must never end in.
 */
export function runMarkController({
  layer,
  selector,
  attribute,
  everyMs,
  holdMs,
  startMs = 0,
}: {
  /** The element to search within. Usually the layer holding the marks. */
  layer: HTMLElement;
  selector: string;
  /** The dataset key, e.g. `lit` for `data-lit`. */
  attribute: string;
  everyMs: number;
  holdMs: number;
  /**
   * How long to wait before the first one.
   *
   * The first transition is the first thing to promote a layer, so it is the one
   * worth keeping out of the way of a page still painting.
   */
  startMs?: number;
}) {
  const tick = () => {
    const idle = Array.from(
      layer.querySelectorAll<HTMLElement>(`${selector}:not([data-${attribute}])`),
    ).filter((node) => node.offsetParent !== null);

    const node = idle[Math.floor(Math.random() * idle.length)];
    if (!node) return;

    node.dataset[attribute] = "";
    window.setTimeout(() => delete node.dataset[attribute], holdMs);
  };

  let interval = 0;
  const start = window.setTimeout(() => {
    tick();
    interval = window.setInterval(tick, everyMs);
  }, startMs);

  return () => {
    window.clearTimeout(start);
    window.clearInterval(interval);
    for (const node of layer.querySelectorAll<HTMLElement>(`[data-${attribute}]`)) {
      delete node.dataset[attribute];
    }
  };
}
