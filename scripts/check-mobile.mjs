/**
 * The mobile floor. Two checks, every route, three phone widths.
 *
 *   npm run build && npm start
 *   CHROME_BIN=/path/to/chrome-headless-shell node scripts/check-mobile.mjs
 *
 * ---------------------------------------------------------------------------
 * 1. NO HORIZONTAL OVERFLOW.
 *
 *    `document.scrollWidth === document.documentElement.clientWidth` at 360,
 *    390 and 430. This is not a nicety: mobile Safari zooms the whole page out
 *    to fit the widest thing on it, so one element 30px too wide silently
 *    shrinks every word on the page. The homepage was 720px wide on a 390px
 *    phone for a while — a caret animating `translateX(100%)` over a box that
 *    wrapped to two lines — and nothing about the page looked broken in a
 *    desktop browser, at any width.
 *
 *    The failure names the offending elements, because "something is 330px too
 *    wide" is a much longer afternoon than "this span is".
 *
 * 2. NOTHING CLIPPED INSIDE AN ILLUSTRATION.
 *
 *    The category hero illustrations draw into a fixed-aspect box with
 *    `overflow: hidden`. On a narrow screen the box gets short, and the bottom
 *    row of the drawing goes under the edge — invisible, and silent, because
 *    the clip is doing exactly what it was asked to. Every text node inside a
 *    `role="img"` figure must have its bounding box inside the frame's.
 * ---------------------------------------------------------------------------
 */
import { connect } from "./cdp.mjs";
import { routes } from "./routes.mjs";

const ORIGIN = process.env.ORIGIN ?? "http://localhost:3000";
const WIDTHS = [360, 390, 430];

/**
 * Finds what is sticking out, not just that something is.
 *
 * Two things this probe learned the hard way:
 *
 *   - it is `document.documentElement.scrollWidth`. `document.scrollWidth` is
 *     `undefined`, which is not equal to the client width, so a probe reading it
 *     reports every route as broken and none of them for the right reason.
 *
 *   - an element wider than the viewport only widens the PAGE if nothing above
 *     it clips. The marquee track is 2.4k px wide by design, inside a box with
 *     `overflow: hidden`; the hero pulses sit at negative offsets inside their
 *     clipped layer; an SVG path routinely runs past its own viewBox. All of
 *     those are correct, and listing them buries the one line that matters. So
 *     an element is only named if every ancestor up to <body> lets it through.
 */
const OVERFLOW_PROBE = `(() => {
  const limit = document.documentElement.clientWidth;
  const clipped = (node) => {
    for (let p = node.parentElement; p && p !== document.body; p = p.parentElement) {
      const style = getComputedStyle(p);
      if (style.overflowX !== "visible") return true;
    }
    return false;
  };
  const out = [];
  for (const node of document.querySelectorAll("body *")) {
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.right <= limit + 0.5 && rect.left >= -0.5) continue;
    if (clipped(node)) continue;
    out.push({
      tag: node.tagName.toLowerCase(),
      cls: (typeof node.className === "string" ? node.className : "").slice(0, 60),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
    });
  }
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: limit,
    worst: out.sort((a, b) => b.right - a.right).slice(0, 6),
  };
})()`;

const CLIP_PROBE = `(() => {
  const frames = [...document.querySelectorAll('figure [role="img"]')];
  const out = [];
  for (const frame of frames) {
    const box = frame.getBoundingClientRect();
    const walker = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const r = range.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const over = Math.max(r.bottom - box.bottom, r.right - box.right, box.top - r.top, box.left - r.left);
      if (over > 0.5) {
        out.push({ text: n.textContent.trim().slice(0, 28), over: Math.round(over) });
      }
    }
  }
  return { frames: frames.length, clipped: out };
})()`;

const browser = await connect({ port: 9411, profile: "mobile-check" });
const paths = await routes(ORIGIN);
let failures = 0;

for (const width of WIDTHS) {
  await browser.resize(width, 844);
  for (const path of paths) {
    await browser.nav(ORIGIN + path, 500);

    const flow = await browser.evalJs(OVERFLOW_PROBE);
    if (flow.scrollWidth !== flow.clientWidth) {
      failures++;
      console.log(
        `FAIL  ${width}  ${path}  scrollWidth ${flow.scrollWidth} vs ${flow.clientWidth}`,
      );
      for (const node of flow.worst) {
        console.log(`        ${node.tag}.${node.cls}  ${node.left}→${node.right}`);
      }
    }

    const clip = await browser.evalJs(CLIP_PROBE);
    if (clip.clipped.length > 0) {
      failures++;
      console.log(`FAIL  ${width}  ${path}  clipped inside an illustration`);
      for (const node of clip.clipped) {
        console.log(`        "${node.text}" over by ${node.over}px`);
      }
    }
  }
  console.log(`${width}: ${paths.length} routes checked`);
}

browser.close();
console.log(failures === 0 ? "PASS  no overflow, nothing clipped" : `${failures} failures`);
process.exit(failures === 0 ? 0 : 1);
