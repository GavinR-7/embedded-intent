/**
 * Free-audit generator. One URL in, a one-page findings email DRAFT out.
 *
 *   node scripts/audit.mjs https://example.com [--name "Pat at Example Plumbing"]
 *        [--out audit-output] [--perf auto|psi|lighthouse|skip]
 *
 * Writes `<out>/<host>.md` (the draft, with a measured-evidence appendix that
 * is NOT part of the email) and `<out>/<host>.json` (every measurement).
 * Nothing is ever sent. The draft is for Gavin to read, edit and send himself.
 *
 * Rules the script enforces:
 *   - Every number and claim in the email comes from a measurement made in this
 *     run, with its source and date. No benchmarks, no "typical" figures.
 *   - One GET of the homepage plus robots.txt, sitemap.xml, an http:// probe and
 *     the www/non-www twin. robots.txt is honored. Identified user agent. No
 *     crawling.
 *   - Performance comes from PageSpeed Insights (mobile). The keyless API shares
 *     a global daily quota that is often exhausted, so set PAGESPEED_API_KEY
 *     (read from the environment only) for reliable runs. If PSI is unavailable
 *     the script falls back to a local Lighthouse mobile run (same engine; lab
 *     data from this machine) and says so in the draft. `--perf skip` omits it.
 *
 * CAN-SPAM: the draft carries an opt-out line and a postal-address placeholder
 * that Gavin must fill with Embedded Intent's real address before sending.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";

const UA = "EmbeddedIntentAudit/0.1 (+https://embeddedintent.com)";
const LIGHTHOUSE = "lighthouse@13.5.0"; // same pin as scripts/verify.mjs
const SERVICE_BASE = "https://embeddedintent.com";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    name: { type: "string", default: "" },
    out: { type: "string", default: "audit-output" },
    perf: { type: "string", default: "auto" },
  },
});
const input = positionals[0];
if (!input) {
  console.error('usage: node scripts/audit.mjs <url> [--name "Pat"] [--out dir] [--perf auto|psi|lighthouse|skip]');
  process.exit(2);
}

const today = new Date();
const dateStr = today.toISOString().slice(0, 10);
const prettyDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

// ---------------------------------------------------------------- fetching --

async function get(url, { redirect = "follow", timeout = 12000 } = {}) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      redirect,
      headers: { "User-Agent": UA, Accept: "text/html,*/*;q=0.8" },
      signal: AbortSignal.timeout(timeout),
    });
    const text = res.headers.get("content-type")?.includes("html") || url.endsWith(".txt") || url.endsWith(".xml")
      ? (await res.text()).slice(0, 600_000)
      : "";
    return { ok: res.ok, status: res.status, url: res.url, headers: res.headers, text, ms: Date.now() - started };
  } catch (e) {
    return { ok: false, status: 0, url, error: e.cause?.code ?? e.name ?? String(e), text: "", ms: Date.now() - started };
  }
}

/** Does robots.txt let this user agent fetch "/"? Minimal parser: * and our UA. */
function robotsAllowsRoot(robots) {
  let applies = false;
  let blocked = false;
  for (const raw of robots.split("\n")) {
    const line = raw.split("#")[0].trim();
    const m = /^([a-z-]+):\s*(.*)$/i.exec(line);
    if (!m) continue;
    const [, key, val] = [null, m[1].toLowerCase(), m[2].trim()];
    if (key === "user-agent") applies = val === "*" || UA.toLowerCase().startsWith(val.toLowerCase());
    else if (applies && key === "disallow" && val === "/") blocked = true;
    else if (applies && key === "allow" && val === "/") blocked = false;
  }
  return !blocked;
}

// ----------------------------------------------------------------- parsing --

const attr = (tag, name) => new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag)?.slice(2).find((x) => x !== undefined);
const decode = (s = "") => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

function parseHtml(html) {
  const tags = (name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((m) => m[0]);
  const metas = tags("meta");
  const meta = (key, value) => {
    const t = metas.find((m) => (attr(m, "name") ?? attr(m, "property"))?.toLowerCase() === key && (value === undefined || attr(m, "content")));
    return t ? decode(attr(t, "content") ?? "") : null;
  };
  const jsonld = [];
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => (Array.isArray(n) ? n.flatMap(walk) : n && typeof n === "object" ? [n["@type"], ...walk(n["@graph"] ?? [])] : []);
      jsonld.push(...walk(JSON.parse(m[1])).flat().filter(Boolean));
    } catch {
      jsonld.push("(invalid JSON-LD)");
    }
  }
  const years = [...html.matchAll(/(?:©|&copy;|copyright)[^<]{0,40}?((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}))?/gi)].map((m) => Number(m[2] ?? m[1]));
  const builder = meta("generator");
  return {
    title: decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "") || null,
    description: meta("description"),
    viewport: meta("viewport"),
    canonical: (() => {
      const l = tags("link").find((t) => /canonical/i.test(attr(t, "rel") ?? ""));
      return l ? attr(l, "href") ?? null : null;
    })(),
    ogTitle: meta("og:title"),
    ogDescription: meta("og:description"),
    ogImage: meta("og:image"),
    twitterCard: meta("twitter:card"),
    jsonldTypes: [...new Set(jsonld)],
    h1Count: (html.match(/<h1\b/gi) ?? []).length,
    telLink: /href\s*=\s*["']tel:/i.test(html),
    copyrightYear: years.length ? Math.max(...years) : null,
    generator: builder,
    htmlBytes: html.length,
  };
}

// ------------------------------------------------------------- performance --

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(process.env.HOME ?? "", ".cache/ms-playwright"), "/opt/pw-browsers"].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root).sort().reverse()) {
      if (!dir.startsWith("chromium_headless_shell")) continue;
      for (const rel of ["chrome-headless-shell-linux64/chrome-headless-shell", "chrome-linux/headless_shell"]) {
        if (existsSync(join(root, dir, rel))) return join(root, dir, rel);
      }
    }
  }
  return null;
}

const fromLhr = (lhr) => ({
  score: Math.round((lhr.categories.performance.score ?? 0) * 100),
  lcpSeconds: lhr.audits["largest-contentful-paint"].numericValue / 1000,
  cls: lhr.audits["cumulative-layout-shift"].numericValue,
  tbtMs: lhr.audits["total-blocking-time"].numericValue,
});

async function psi(url) {
  const key = process.env.PAGESPEED_API_KEY;
  const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&url=${encodeURIComponent(url)}${key ? `&key=${key}` : ""}`;
  const res = await fetch(api, { signal: AbortSignal.timeout(120_000) });
  const body = await res.json();
  if (!res.ok) throw new Error(`PageSpeed API ${res.status}: ${body.error?.message?.slice(0, 90) ?? "error"}`);
  return { source: "Google PageSpeed Insights API (mobile)", ...fromLhr(body.lighthouseResult) };
}

async function localLighthouse(url) {
  const chrome = findChrome();
  if (!chrome) throw new Error("no Chrome found (set CHROME_BIN)");
  const scratch = join(tmpdir(), "audit-lighthouse");
  await mkdir(scratch, { recursive: true });
  const file = join(scratch, `${Date.now()}.json`);
  await new Promise((resolve, reject) => {
    const p = spawn(
      "npx",
      ["--yes", LIGHTHOUSE, url, "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage", "--only-categories=performance", "--output=json", `--output-path=${file}`, "--quiet"],
      { env: { ...process.env, CHROME_PATH: chrome, TMPDIR: scratch, LOCALAPPDATA: scratch }, stdio: "ignore" },
    );
    p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(`lighthouse exit ${c}`))));
    p.on("error", reject);
  });
  return { source: `Lighthouse ${LIGHTHOUSE.split("@")[1]}, mobile emulation, run locally`, ...fromLhr(JSON.parse(await readFile(file, "utf8"))) };
}

async function measurePerf(url) {
  const mode = values.perf;
  if (mode === "skip") return { skipped: true };
  const errors = [];
  if (mode === "auto" || mode === "psi") {
    try {
      return await psi(url);
    } catch (e) {
      errors.push(e.message);
      if (mode === "psi") return { failed: errors };
    }
  }
  try {
    return { ...(await localLighthouse(url)), fellBackFrom: errors[0] };
  } catch (e) {
    return { failed: [...errors, e.message] };
  }
}

// ------------------------------------------------------------------- audit --

const start = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
const host = start.hostname.replace(/^www\./, "");
const R = { input, host, auditedAt: today.toISOString(), checks: {} };

// Robots first: if the site asks us not to fetch "/", measure nothing.
const robotsRes = await get(`${start.protocol}//${start.host}/robots.txt`);
if (robotsRes.ok && !robotsAllowsRoot(robotsRes.text)) {
  console.error(`robots.txt on ${start.host} disallows us; not auditing.`);
  process.exit(3);
}

const home = await get(start.href);
R.checks.home = { status: home.status, finalUrl: home.url, error: home.error ?? null, ms: home.ms };
const finalUrl = new URL(home.url);
R.checks.https = { finalIsHttps: finalUrl.protocol === "https:" };

if (home.ok) {
  R.page = parseHtml(home.text);
  // http:// probe: does it redirect to https?
  const httpProbe = await get(`http://${finalUrl.host}/`, { redirect: "manual" });
  const loc = httpProbe.headers?.get("location") ?? "";
  R.checks.https.httpRedirectsToHttps = httpProbe.status >= 300 && httpProbe.status < 400 && loc.startsWith("https://");
  R.checks.https.httpProbeStatus = httpProbe.status;
  // www / non-www: both should end on one host.
  const bare = finalUrl.host.replace(/^www\./, "");
  const twinHost = finalUrl.host.startsWith("www.") ? bare : `www.${bare}`;
  const twin = await get(`${finalUrl.protocol}//${twinHost}/`);
  R.checks.canonicalHost = {
    twinHost,
    twinStatus: twin.status,
    twinError: twin.error ?? null,
    twinFinalHost: twin.ok ? new URL(twin.url).host : null,
    consistent: !twin.ok ? null : new URL(twin.url).host === finalUrl.host,
  };
  const base = `${finalUrl.protocol}//${finalUrl.host}`;
  const robots2 = await get(`${base}/robots.txt`);
  const sitemap = await get(`${base}/sitemap.xml`);
  const robotsSitemap = /^\s*sitemap:\s*(\S+)/im.exec(robots2.ok ? robots2.text : "")?.[1] ?? null;
  const sitemapOk = sitemap.ok && /<urlset|<sitemapindex/i.test(sitemap.text);
  R.checks.robots = { present: robots2.ok && !/<html/i.test(robots2.text), sitemapLine: robotsSitemap };
  R.checks.sitemap = { present: sitemapOk || Boolean(robotsSitemap), at: sitemapOk ? `${base}/sitemap.xml` : robotsSitemap };
  R.perf = await measurePerf(finalUrl.href);
}

// --------------------------------------------------------------- findings --
// Each finding: weight (how much it matters), what we measured (plain English,
// with the number), and the fix. The email shows the heaviest three.

const F = [];
const add = (id, weight, found, fix, evidence) => F.push({ id, weight, found, fix, evidence });
const p = R.page;
const perf = R.perf;

if (!home.ok) {
  add("unreachable", 100,
    home.status ? `Your website returned an error (HTTP ${home.status}) when I tried to open it on ${prettyDate}.` : `Your website would not open when I tried it on ${prettyDate} (${home.error}).`,
    "Get the site loading reliably again before anything else; nobody can hire you from a page that won't open.",
    `GET ${start.href} -> ${home.status || home.error}`);
} else {
  if (!R.checks.https.finalIsHttps) {
    add("no-https", 90, "Your site loads without HTTPS, so Chrome labels it \"Not secure\" for every visitor.", "Install a free security certificate and send all traffic to the https:// address.", `final URL ${home.url}`);
  } else if (!R.checks.https.httpRedirectsToHttps) {
    add("no-http-redirect", 50, "Typing your address without \"https\" doesn't send people to the secure version of the site.", "Add one redirect from http:// to https:// so every visitor and every Google result lands on the secure page.", `http probe status ${R.checks.https.httpProbeStatus}`);
  }
  if (perf?.score !== undefined) {
    const lcp = perf.lcpSeconds.toFixed(1);
    const bad = perf.score < 50 ? 85 : perf.score < 70 ? 60 : perf.score < 90 ? 30 : 0;
    if (bad) {
      add("slow", bad,
        `Your homepage scored ${perf.score}/100 on the ${perf.source.startsWith("Google") ? "Google PageSpeed test" : "Lighthouse speed test"} for phones on ${prettyDate}, and the main content took ${lcp} seconds to appear.`,
        "Compress the images and trim what loads first so the page shows up quickly on a phone.",
        `${perf.source}: score ${perf.score}, LCP ${lcp}s, CLS ${perf.cls.toFixed(3)}, TBT ${Math.round(perf.tbtMs)}ms`);
    }
  }
  if (!p.viewport) add("no-viewport", 80, "Your site doesn't tell phones how to size the page (no mobile viewport setting), so it can show up shrunken or hard to read.", "Add the mobile viewport setting and make the layout fit a phone screen.", "no <meta name=viewport>");
  if (!p.title) add("no-title", 70, "Your homepage has no page title, which is the headline Google shows in search results.", "Write a clear title with what you do and the towns you serve.", "no <title>");
  else if (p.title.length < 15) add("short-title", 30, `Your homepage title is just "${p.title}" (${p.title.length} characters), which tells Google very little.`, "Rewrite the title to say what you do and where.", `<title> ${p.title.length} chars`);
  if (!p.description) add("no-description", 55, "Your homepage has no search description, so Google makes one up from whatever text it finds.", "Write a short description that gives people a reason to click.", "no meta description");
  if (!p.ogImage || !p.ogTitle) add("no-og", 35, "When your site is shared on Facebook or in a text message it has no preview picture or headline.", "Add a share image and headline so links to your site look professional.", `og:title ${p.ogTitle ? "present" : "missing"}, og:image ${p.ogImage ? "present" : "missing"}`);
  if (!p.jsonldTypes.length) add("no-jsonld", 40, "Your site has no structured business data, the behind-the-scenes markup that tells Google your name, address, hours and service area.", "Add LocalBusiness markup so Google can show your details correctly.", "no JSON-LD blocks");
  if (!R.checks.sitemap.present) add("no-sitemap", 35, "I couldn't find a sitemap on your site, the file that lists your pages for Google.", "Publish a sitemap and submit it in Google Search Console.", `no /sitemap.xml and no Sitemap line in robots.txt`);
  if (!R.checks.robots.present) add("no-robots", 15, "Your site has no robots.txt file.", "Add a simple robots.txt that points to the sitemap.", "/robots.txt not found");
  if (!p.telLink) add("no-tel", 30, "I couldn't find a tap-to-call link on your homepage, so someone on a phone has to copy your number to call you.", "Make the phone number a tap-to-call button, ideally pinned to the top or bottom of the screen on phones.", "no tel: link in homepage HTML");
  if (p.h1Count !== 1) add("h1", 15, p.h1Count === 0 ? "Your homepage has no main headline tag for Google to read." : `Your homepage has ${p.h1Count} main-headline tags where Google expects one.`, "Use one main headline that says what you do.", `${p.h1Count} <h1>`);
  if (R.checks.canonicalHost.consistent === false) add("www-split", 30, `Both ${finalUrl.host} and ${R.checks.canonicalHost.twinHost} open your site as separate addresses, which can split your Google ranking in two.`, "Pick one address and redirect the other to it.", `${R.checks.canonicalHost.twinHost} -> ${R.checks.canonicalHost.twinFinalHost}`);
  if (p.copyrightYear && today.getUTCFullYear() - p.copyrightYear >= 3) add("old-copyright", 20, `The footer of your site says © ${p.copyrightYear}, which makes the site look abandoned.`, "Update the footer and refresh the content so the site looks current.", `copyright ${p.copyrightYear}`);
}
F.sort((a, b) => b.weight - a.weight);
R.findings = F;

// ------------------------------------------------------------------- offer --
// Service mapping follows LEAD_FINDER_SPEC "Service match": measured signals only.
function offer() {
  const slow = perf?.score !== undefined && perf.score < 40;
  if (!home.ok || slow) return { slug: "website-design-build", name: "Website Design & Build", why: "a new, fast site is usually cheaper than patching one this far behind" };
  const refresh = F.some((f) => ["no-https", "no-viewport", "slow", "no-http-redirect"].includes(f.id));
  if (refresh) return { slug: "website-refresh", name: "Website Refresh", why: "the fixes above are a refresh of the site you already have, not a rebuild" };
  if (F.length) return { slug: "get-found-on-google", name: "Get Found on Google", why: "the gaps above are mostly about how Google sees your site" };
  return null;
}
R.offer = offer();

// ------------------------------------------------------------------- draft --

const top = F.slice(0, 3);
const fixes = top.map((f) => f.fix);
const greet = values.name ? `Hi ${values.name.split(" ")[0]},` : "Hi [first name],";
const lines = [];
lines.push(`# DRAFT: free site audit for ${host}`, "");
lines.push(`> **Not sent.** Generated ${dateStr} by \`scripts/audit.mjs\`. Everything below the "Evidence" line is for Gavin, not for the email. Fill every [bracket] before sending. Find a real contact; Google Places returns no email addresses.`, "");
lines.push(`**To:** [owner or manager of ${host}: real, verified address]`);
lines.push(`**From:** Gavin Reis <hello@embeddedintent.com>`);
lines.push(`**Subject:** ${top.length ? `A few things I found on ${host}` : `Quick note on ${host}`}`, "", "---", "");
if (!F.length) {
  lines.push(`${greet}`, "", `I ran a free check on ${host} on ${prettyDate} and found nothing worth flagging in speed, search setup or mobile. **No audit email is warranted; do not send.**`, "");
} else {
  lines.push(greet, "");
  lines.push(`I'm Gavin, a web developer on Long Island. I ran a free check on ${host} on ${prettyDate}, and ${top.length === 1 ? "there is one thing" : `there are ${top.length} things`} I'd fix first:`, "");
  top.forEach((f, i) => lines.push(`${i + 1}. ${f.found}`));
  lines.push("", "Here's what I'd do about it:", "");
  fixes.forEach((f) => lines.push(`- ${f}`));
  lines.push("");
  if (R.offer) {
    lines.push(`That is the kind of work I do at Embedded Intent. ${R.offer.name} would cover it, because ${R.offer.why}: ${SERVICE_BASE}/services/${R.offer.slug}`, "");
  }
  lines.push(`I have the full list of what I checked and can send it over, no cost and no obligation. If you'd like it, just reply "yes". If you'd rather a quick call, tell me a time that works.`, "");
}
lines.push("Gavin Reis", "Embedded Intent · embeddedintent.com · (631) 240-3073", "[Embedded Intent postal address: Gavin to fill; CAN-SPAM requires a real one]", "",
  `If you'd rather not hear from me, reply "no thanks" and I won't email you again.`, "");
lines.push("---", "", "## Evidence (for Gavin; not part of the email)", "");
lines.push(`Audited ${R.auditedAt} · user agent \`${UA}\` · input \`${input}\``, "");
lines.push("| Check | Result |", "|---|---|");
const row = (k, v) => lines.push(`| ${k} | ${v} |`);
row("Homepage", home.ok ? `HTTP ${home.status} in ${home.ms} ms, final URL ${home.url}` : `FAILED: ${home.status || home.error}`);
if (home.ok) {
  row("HTTPS", `${R.checks.https.finalIsHttps ? "yes" : "NO"}; http:// ${R.checks.https.httpRedirectsToHttps ? "redirects to https" : `does not redirect (status ${R.checks.https.httpProbeStatus})`}`);
  row("www / non-www", R.checks.canonicalHost.consistent === null ? `${R.checks.canonicalHost.twinHost}: ${R.checks.canonicalHost.twinError ?? `HTTP ${R.checks.canonicalHost.twinStatus}`}` : R.checks.canonicalHost.consistent ? "both resolve to one host" : `split: ${R.checks.canonicalHost.twinHost} -> ${R.checks.canonicalHost.twinFinalHost}`);
  row("Mobile performance", perf.skipped ? "skipped" : perf.failed ? `NOT MEASURED (${perf.failed.join("; ")})` : `${perf.score}/100, LCP ${perf.lcpSeconds.toFixed(1)}s, CLS ${perf.cls.toFixed(3)}, TBT ${Math.round(perf.tbtMs)}ms · source: ${perf.source}${perf.fellBackFrom ? ` (PageSpeed API unavailable: ${perf.fellBackFrom})` : ""}`);
  row("Title", p.title ? `"${p.title}" (${p.title.length} chars)` : "missing");
  row("Meta description", p.description ? `${p.description.length} chars` : "missing");
  row("Viewport", p.viewport ?? "missing");
  row("Canonical", p.canonical ?? "missing");
  row("Open Graph", `title ${p.ogTitle ? "yes" : "no"} · description ${p.ogDescription ? "yes" : "no"} · image ${p.ogImage ? "yes" : "no"} · twitter:card ${p.twitterCard ?? "no"}`);
  row("JSON-LD types", p.jsonldTypes.length ? p.jsonldTypes.join(", ") : "none");
  row("h1 count", String(p.h1Count));
  row("tel: link", p.telLink ? "yes" : "no");
  row("Copyright year in HTML", p.copyrightYear ?? "not found");
  row("Site builder (generator meta)", p.generator ?? "not declared");
  row("robots.txt", R.checks.robots.present ? `present${R.checks.robots.sitemapLine ? `, Sitemap: ${R.checks.robots.sitemapLine}` : ", no Sitemap line"}` : "missing");
  row("sitemap", R.checks.sitemap.present ? `found at ${R.checks.sitemap.at}` : "not found");
}
lines.push("", "Findings, heaviest first (the email uses the top three):", "");
F.forEach((f) => lines.push(`- (${f.weight}) ${f.id}: ${f.evidence}`));
lines.push("", "Limits of this audit: one page (the homepage), one run, lab data. Performance varies run to run; rerun before quoting a number anywhere that matters. The structured-data check reads the JSON-LD in the served HTML only. Tools with a rendered DOM may see more.");

await mkdir(values.out, { recursive: true });
await writeFile(join(values.out, `${host}.md`), lines.join("\n") + "\n");
await writeFile(join(values.out, `${host}.json`), JSON.stringify(R, null, 2) + "\n");
console.log(`${host}: ${F.length} findings${perf?.score !== undefined ? `, mobile ${perf.score}` : ""} -> ${join(values.out, host + ".md")}`);
