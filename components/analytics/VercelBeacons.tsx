"use client";

import dynamic from "next/dynamic";

/**
 * Vercel's two beacons, loaded only where they work.
 *
 * ---------------------------------------------------------------------------
 * This file exists because of a measurement, and the measurement was a surprise.
 *
 * The layout used to import `Analytics` and `SpeedInsights` directly and render
 * them behind `process.env.VERCEL`. That gate works — no request to
 * `/_vercel/insights/script.js` is ever made off Vercel, and that was verified.
 * What it does NOT do is keep the code out of the bundle. A static import in a
 * layout puts the module in that layout's client reference manifest, so the
 * chunk was preloaded, parsed and evaluated on **every route**, rendered or not:
 * 50.7 kB raw, 16.7 kB gzipped, on a site whose entire point is that it is fast.
 *
 * It showed up as Total Blocking Time roughly doubling across all five measured
 * routes — 62-66ms in Phase 7b to 128-144ms — including on /contact, which had
 * gained nothing else. Uniform across routes that shared nothing but the layout
 * was the clue.
 *
 * `next/dynamic` moves both into chunks of their own, fetched by the import
 * below only when this component actually renders. `ssr: false` because neither
 * has anything to say on the server, and this file is the client boundary that
 * makes that option legal — it is refused inside a Server Component.
 * ---------------------------------------------------------------------------
 *
 * The layout still decides WHETHER to render this, from `process.env.VERCEL`.
 * Two gates doing different jobs: that one keeps the beacons off hosts where
 * their scripts 404, this one keeps their weight off every page that is not
 * currently reporting.
 */
const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((mod) => mod.Analytics),
  { ssr: false },
);

const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
  { ssr: false },
);

export function VercelBeacons() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
