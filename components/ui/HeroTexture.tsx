import { GridSpotlight } from "@/components/motion/GridSpotlight";

/**
 * The texture at the top of a page.
 *
 * ---------------------------------------------------------------------------
 * There are four, and which one a page gets is data, not a decision made here.
 *
 *   circuit    the homepage, /work, /contact — the 4rem circuit ruling
 *   blueprint  /websites — a fine dot grid with crosshairs at the majors
 *   contour    /get-found — topographic lines
 *   signal     /ai-automation — the ruling, with pulses travelling along it
 *
 * The last three come from `texture` on content/categories.ts, which is why a
 * service page cannot end up with a different texture from the category it
 * belongs to: it reads its own category's field. There is no per-route string to
 * get wrong.
 *
 * Rendered by the FIRST BAND OF A PAGE ONLY. It is a treatment for the top of a
 * page, and repeating it down every void band made it read as wallpaper.
 * ---------------------------------------------------------------------------
 *
 * Every texture is drawn twice: once dim across the whole band, and once in the
 * accent colour masked to a circle under the cursor. The dim copy is a Server
 * Component with no JavaScript; the bright copy belongs to `GridSpotlight`,
 * which owns the pointer, the idle handoff and the ambient cells.
 *
 * The two SVG textures colour themselves with `currentColor`, so exactly the
 * same markup serves as both copies — `text-line` for the dim one, `text-signal`
 * for the lit one.
 */

export type HeroTextureName = "circuit" | "blueprint" | "contour" | "signal";

/* ------------------------------------------------------------------ contour */

/**
 * One contour line, as a sine wave in four cubic segments.
 *
 * Sampling a sine into a polyline would be twenty points per line and nine lines
 * of it in the HTML of every /get-found page. A cubic bezier approximates a half
 * period to well under a pixel at this scale with two control points, so the
 * whole family is about a tenth of the markup.
 *
 * The control-point offset is a sixth of the period, which is the standard
 * approximation: any further and the curve overshoots its own peak.
 */
function ridge(y: number, amp: number, phase: number): string {
  const WIDTH = 1200;
  const HALVES = 4;
  const half = WIDTH / HALVES;
  const k = half / 3;

  // Starts left of the viewBox and ends right of it, so no line has a visible
  // end inside the band.
  let d = `M-60 ${y + amp * Math.sin(phase)}`;
  for (let i = 0; i < HALVES + 1; i += 1) {
    const x0 = -60 + i * half;
    const x1 = x0 + half;
    const y0 = y + amp * Math.sin(phase + i * Math.PI);
    const y1 = y + amp * Math.sin(phase + (i + 1) * Math.PI);
    d += ` C${x0 + k} ${y0} ${x1 - k} ${y1} ${x1} ${y1}`;
  }
  return d;
}

/**
 * Nine near-parallel lines and a three-ring summit.
 *
 * Parallel wavy lines are what a topographic map of a slope looks like; the
 * closed rings are what makes it read as topography rather than as decoration.
 * Amplitudes grow downward so the family opens out instead of marching.
 *
 * Nothing here is a real place. It is drawn from two numbers per line.
 */
const RIDGES: readonly { y: number; amp: number; phase: number }[] = [
  { y: 26, amp: 14, phase: 0.0 },
  { y: 62, amp: 17, phase: 0.18 },
  { y: 100, amp: 20, phase: 0.34 },
  { y: 142, amp: 23, phase: 0.5 },
  { y: 188, amp: 26, phase: 0.66 },
  { y: 238, amp: 29, phase: 0.82 },
  { y: 292, amp: 32, phase: 0.98 },
  { y: 350, amp: 35, phase: 1.14 },
  { y: 412, amp: 38, phase: 1.3 },
];

/** The summit: three nested rings, hand-placed. */
const SUMMIT: readonly string[] = [
  "M902 196c34 0 62 18 62 40s-28 40-62 40-62-18-62-40 28-40 62-40z",
  "M902 212c22 0 40 11 40 24s-18 24-40 24-40-11-40-24 18-24 40-24z",
  "M902 228c11 0 20 5 20 12s-9 12-20 12-20-5-20-12 9-12 20-12z",
];

function ContourLines({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 1200 480"
      /* Stretched to the band rather than letterboxed — it is a texture, and a
         contour map has no correct aspect ratio. `vectorEffect` is what keeps the
         stroke 1px after that stretch; without it a wide hero draws hairlines
         four times thicker horizontally than vertically. */
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className={className}
    >
      {RIDGES.map((line) => (
        <path key={line.y} d={ridge(line.y, line.amp, line.phase)} vectorEffect="non-scaling-stroke" />
      ))}
      {SUMMIT.map((d) => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ the map */

/**
 * Per texture: the dim layer, and what the lit layer is made of.
 *
 * `litClassName` is stacked onto the element `GridSpotlight` holds the pointer
 * position on, so the bright copy is either a background (the two grid textures)
 * or an ink colour for an SVG child (contour). Written out as complete class
 * strings — Tailwind scans source text and never sees a name assembled at
 * runtime.
 */
const TEXTURES: Record<
  HeroTextureName,
  { base: React.ReactNode; litClassName: string; lit?: React.ReactNode }
> = {
  circuit: {
    base: <div className="trace-grid absolute inset-0" />,
    litClassName: "trace-grid-lit",
  },
  /* The ruling, plus four pulses travelling along it. The pulses are rendered by
     GridSpotlight, with the ambient cells — they are timer-driven and share its
     in-view gate. */
  signal: {
    base: <div className="trace-grid absolute inset-0" />,
    litClassName: "trace-grid-lit",
  },
  blueprint: {
    base: <div className="blueprint-grid hero-texture absolute inset-0" />,
    litClassName: "blueprint-grid-lit",
  },
  contour: {
    base: (
      <ContourLines className="hero-texture absolute inset-0 h-full w-full text-line" />
    ),
    litClassName: "text-signal",
    lit: <ContourLines className="absolute inset-0 h-full w-full text-signal" />,
  },
};

export function HeroTexture({
  texture = "circuit",
  spotlight = false,
}: {
  texture?: HeroTextureName;
  /**
   * Opt into the cursor spotlight and the ambient idle pulses.
   *
   * On for the homepage and for every category and service hero, which is where
   * the texture is saying something about the page. Off for /work, /work/[slug]
   * and /contact, where it is only the top of a page.
   */
  spotlight?: boolean;
}) {
  const { base, litClassName, lit } = TEXTURES[texture];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {base}

      {spotlight && (
        <GridSpotlight
          litClassName={litClassName}
          signals={texture === "signal"}
        >
          {lit}
        </GridSpotlight>
      )}
    </div>
  );
}
