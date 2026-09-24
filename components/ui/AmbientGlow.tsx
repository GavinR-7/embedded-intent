/**
 * Two slow blobs of light behind the hero.
 *
 * The whole point is that you should not be able to say what is moving — the
 * page is simply not completely still. Two different periods (26s and 34s) on
 * two different tracks, so they drift apart instead of moving as one shape, and
 * `alternate` so neither ever jumps back to its start position.
 *
 * `transform` only, on `radial-gradient` backgrounds rather than blurred solids:
 * a blur is a per-frame GPU pass over a large area and by far the most expensive
 * way to get a soft edge on a phone.
 *
 * ---------------------------------------------------------------------------
 * Two decisions here are performance, not taste, and both were measured.
 *
 * **They fade in at 700ms** rather than being painted with the page. These are
 * the largest painted areas on the site, and having them in the first paint
 * cost 0.63s of simulated mobile LCP — 2.01s to 2.64s, established by removing
 * them and putting them back. Nothing else added in Phase 7 moved the number:
 * the reveal system, the cursor-lit grid and the industry strip were each
 * measured alone and came in at 2.01–2.02s.
 *
 * **They do not render below `md`.** The delay alone only recovered half of it
 * (2.48s), because an element with an opacity animation is promoted to its own
 * compositor layer for the whole animation *including the delay* — so the
 * browser rasterises two viewport-sized gradients up front either way. Rather
 * than shrink them until the number behaved, the honest call: this is an
 * effect that reads on a large screen and barely registers on a 390px phone,
 * and it costs the most on the device with the least to spare. Phones get the
 * cursor-lit grid and the trace texture; they do not get this.
 * ---------------------------------------------------------------------------
 *
 * A Server Component with no JavaScript of its own. Under
 * `prefers-reduced-motion: reduce` there is no entrance and no drift, just two
 * faint static washes. `data-pause-offscreen` hands the "stop when it is not on
 * screen" job to the one observer in MotionRuntime rather than opening a client
 * island for it.
 */
export function AmbientGlow() {
  return (
    <div
      aria-hidden="true"
      data-pause-offscreen=""
      className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
    >
      <div className="glow-blob glow-blob-a absolute -top-[15%] -left-[12%] h-[55vh] w-[55vh]" />
      <div className="glow-blob glow-blob-b absolute top-[12%] -right-[16%] h-[45vh] w-[45vh]" />
    </div>
  );
}
