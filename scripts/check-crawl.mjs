/**
 * What a search engine sees, checked against the running server.
 *
 *   npm run build && npm start
 *   node scripts/check-crawl.mjs            (ORIGIN defaults to localhost:3000)
 *
 * ---------------------------------------------------------------------------
 * Always checked (fails):
 *   - the sitemap is empty, has duplicates, mixes hosts, or lists a URL whose
 *     page doesn't return 200 here;
 *   - a listed page has a canonical that isn't the URL the sitemap lists;
 *   - GOOGLE_SITE_VERIFICATION is set but the homepage doesn't carry it.
 *
 * The crawler block (robots.txt `Disallow: /`, a `noindex` meta tag, no
 * sitemap line) is on until launch (LAUNCH.md step 7). Before launch it is
 * reported, not failed. With EXPECT_CRAWLABLE=1 (set it in the launch PR) it
 * fails, so either half of the block creeping back is caught: neither shows in
 * a browser.
 *
 * Sitemap URLs carry the production host (site.url); they are fetched here by
 * path, against ORIGIN.
 * ---------------------------------------------------------------------------
 */
const ORIGIN = (process.env.ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
const EXPECT_CRAWLABLE = process.env.EXPECT_CRAWLABLE === "1";
const failures = [];
const blocks = [];
const fail = (message) => failures.push(message);
const block = (message) => (EXPECT_CRAWLABLE ? fail(message) : blocks.push(message));

const get = async (path) => {
  const res = await fetch(ORIGIN + path, { redirect: "manual" });
  return { status: res.status, text: await res.text() };
};

const robots = await get("/robots.txt");
const robotLines = robots.text.split("\n").map((l) => l.trim());
if (robots.status !== 200) fail(`/robots.txt returned ${robots.status}`);
if (robotLines.some((l) => /^disallow:\s*\/\s*$/i.test(l))) block("/robots.txt says Disallow: /");
const sitemapLine = robotLines.find((l) => /^sitemap:/i.test(l));
if (!sitemapLine) block("/robots.txt names no sitemap");

const sitemap = await get("/sitemap.xml");
const locs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
if (sitemap.status !== 200) fail(`/sitemap.xml returned ${sitemap.status}`);
if (locs.length === 0) fail("sitemap lists no URLs");

const hosts = new Set(locs.map((u) => new URL(u).origin));
if (hosts.size > 1) fail(`sitemap mixes hosts: ${[...hosts].join(", ")}`);
const [host] = hosts;
if (host && sitemapLine) {
  const named = sitemapLine.replace(/^sitemap:\s*/i, "");
  if (named !== `${host}/sitemap.xml`) fail(`robots.txt names ${named}, expected ${host}/sitemap.xml`);
}
const dupes = locs.filter((u, i) => locs.indexOf(u) !== i);
if (dupes.length) fail(`sitemap duplicates: ${[...new Set(dupes)].join(", ")}`);

const noindex = [];
const attr = (tag, name) => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];
for (const loc of locs) {
  const path = new URL(loc).pathname;
  const page = await get(path);
  if (page.status !== 200) {
    fail(`${path} returned ${page.status}`);
    continue;
  }
  for (const tag of page.text.match(/<meta name="robots"[^>]*>/g) ?? []) {
    if (/noindex/i.test(attr(tag, "content") ?? "")) noindex.push(path);
  }
  const canonical = page.text.match(/<link rel="canonical"[^>]*>/)?.[0];
  const href = canonical && attr(canonical, "href");
  // Compare without a trailing slash: "https://x.com" and "https://x.com/" are the same page.
  if (href && href.replace(/\/$/, "") !== loc.replace(/\/$/, "")) {
    fail(`${path} canonical is ${href}, sitemap says ${loc}`);
  }
}

if (noindex.length) block(`noindex meta on ${noindex.length} of ${locs.length} pages`);

const token = process.env.GOOGLE_SITE_VERIFICATION?.trim();
if (token) {
  const home = await get("/");
  const tag = home.text.match(/<meta name="google-site-verification"[^>]*>/)?.[0];
  if (!tag || attr(tag, "content") !== token) fail("homepage lacks the google-site-verification tag");
}

console.log(`robots.txt: ${sitemapLine ?? "no sitemap line"}`);
console.log(`sitemap: ${locs.length} URLs on ${host ?? "?"}, each fetched by path`);
if (token) console.log("search console: verification tag present");
for (const b of blocks) console.log(`BLOCKED (pre-launch)  ${b}`);
if (failures.length) {
  for (const f of failures) console.log(`FAIL  ${f}`);
  process.exit(1);
}
console.log(
  blocks.length
    ? "PASS  sitemap consistent; crawler block on (pre-launch, expected)"
    : "PASS  crawlable, indexable, sitemap consistent",
);
