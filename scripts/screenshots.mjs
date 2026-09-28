/**
 * Full-page screenshots of every route, at a phone width and a desktop width.
 *
 *   npm run build && npm start
 *   CHROME_BIN=/path/to/chrome-headless-shell node scripts/screenshots.mjs
 *
 * Writes `verify-output/screenshots/<width>/<route>.png`. `npm run verify` calls
 * this; running it alone is for when only the pictures are wanted.
 *
 * ---------------------------------------------------------------------------
 * Two things make a full-page capture of this site honest:
 *
 *   - `prefers-reduced-motion: reduce`. Below-the-fold content waits for the
 *     IntersectionObserver reveal, so a capture with motion on shows a page of
 *     empty bands. Under `reduce` every element renders in its final state
 *     (MOTION.md rule 3), which is the state worth reviewing.
 *
 *   - Scrolling the page once before capturing with `captureBeyondViewport`
 *     and a full-height clip. Lazy images only load once they near the
 *     viewport, so the walk loads them. (Growing the viewport to the page's
 *     height instead looks simpler and is wrong: headless Chrome leaves most
 *     tiles of a 13,000px viewport unpainted, and the capture comes back as
 *     the hero over a blank page.)
 * ---------------------------------------------------------------------------
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { connect, sleep } from "./cdp.mjs";
import { routes } from "./routes.mjs";

const ORIGIN = process.env.ORIGIN ?? "http://localhost:3000";
const OUT = process.env.SCREENSHOT_DIR ?? "verify-output/screenshots";
const ONLY = process.env.VERIFY_ROUTES
  ? process.env.VERIFY_ROUTES.split(",").map((r) => r.trim())
  : null;

/** Chrome refuses captures much taller than this; nothing on the site is. */
const MAX_HEIGHT = 16000;

const VIEWS = [
  { width: 390, height: 844, mobile: true, scale: 2, port: 9421 },
  { width: 1440, height: 900, mobile: false, scale: 1, port: 9422 },
];

const slug = (path) =>
  path === "/" ? "home" : path.replace(/^\//, "").replaceAll("/", "--");

const all = await routes(ORIGIN);
const paths = ONLY ? all.filter((p) => ONLY.includes(p)) : all;
let written = 0;

for (const view of VIEWS) {
  const dir = join(OUT, String(view.width));
  await mkdir(dir, { recursive: true });
  const browser = await connect({
    ...view,
    reduced: true,
    profile: `shots-${view.width}`,
  });

  try {
    for (const path of paths) {
      await browser.resize(view.width, view.height);
      // A route whose load event never fires should cost one screenshot, not
      // the whole run. (Seen once: headless Chrome at devicePixelRatio 1 never
      // finished a preloaded next/image on /work/[slug]; real phones are 2–3x,
      // which is why the phone view below uses 2.)
      const loaded = await Promise.race([
        browser.nav(ORIGIN + path, 600).then(() => true),
        sleep(20000).then(() => false),
      ]);
      if (!loaded) console.log(`note  ${view.width}  ${path}  load never fired; capturing anyway`);

      // Walk the page once so lazy images and observers see every section,
      // then return to the top so the header is where a visitor sees it.
      await browser.evalJs(`(async () => {
        const step = innerHeight * 0.8;
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        scrollTo(0, 0);
        // decode() on a lazy image that never started loading waits forever,
        // so each gets a deadline rather than trust.
        const settle = (img) => Promise.race([
          img.decode().catch(() => {}),
          new Promise((r) => setTimeout(r, 3000)),
        ]);
        await Promise.all([...document.images].map(settle));
      })()`);
      await sleep(300);

      const full = await browser.evalJs(
        "Math.ceil(document.documentElement.scrollHeight)",
      );
      const height = Math.min(full, MAX_HEIGHT);
      const { data } = await browser.send(
        "Page.captureScreenshot",
        {
          format: "png",
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: view.width, height, scale: 1 },
        },
        browser.sessionId,
      );
      await writeFile(join(dir, `${slug(path)}.png`), Buffer.from(data, "base64"));
      written++;
      if (full > MAX_HEIGHT) {
        console.log(`note  ${view.width}  ${path}  cut at ${MAX_HEIGHT}px of ${full}px`);
      }
    }
  } finally {
    browser.close();
  }
  console.log(`${view.width}: ${paths.length} screenshots → ${dir}`);
}

console.log(`PASS  ${written} screenshots`);
