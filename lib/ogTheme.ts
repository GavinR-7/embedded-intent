/**
 * The palette, as literal sRGB, for the social preview images.
 *
 * ---------------------------------------------------------------------------
 * This is a second copy of colours that are defined in app/globals.css, and it
 * is here because there is no way for it not to be.
 *
 * The OG images are rendered by satori, which lays out JSX with inline styles and
 * has no stylesheet, no cascade and no custom properties. `var(--color-signal)`
 * in one of those files resolves to nothing. The tokens are also authored in
 * OKLCH, which satori does not parse.
 *
 * So the values below were not typed from memory — each one was read back out of
 * a real browser, by setting `color: var(--color-<token>)` on an element,
 * painting the computed value into a 1x1 canvas and reading the pixel. That is
 * the same method that produced `site.themeColor`, which has carried the same
 * caveat since Phase 1 and comes out at the same `#060b0f` this does.
 *
 * IF YOU CHANGE THE PALETTE, re-derive these. Nothing will fail if you do not:
 * the site will simply share a preview card in the old colours.
 * ---------------------------------------------------------------------------
 */
export const OG_COLOR = {
  /** --color-void */
  void: "#060b0f",
  /** --color-surface */
  surface: "#0e1319",
  /** --color-line */
  line: "#262f36",
  /** --color-line-strong */
  lineStrong: "#444e58",
  /** --color-ink */
  ink: "#f3f5f7",
  /** --color-ink-muted */
  inkMuted: "#b1b8bf",
  /** --color-ink-subtle */
  inkSubtle: "#848d95",
  /** --color-signal */
  signal: "#45e8e8",
} as const;

/**
 * 1200x630 — the ratio every large social card is cropped to.
 *
 * Exported here rather than written in four route files, because `size` has to
 * agree with the `width`/`height` passed to `ImageResponse` and with the
 * `twitter.card` type declared in lib/seo.ts.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** The 4rem circuit ruling from the site, at the card's scale. */
export const OG_GRID_STEP = 64;
