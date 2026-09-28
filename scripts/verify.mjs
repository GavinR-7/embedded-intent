/**
 * One command for "is this build ready for someone to look at":
 *
 *   npm run verify
 *
 * Runs, in order, and reports every step even when an earlier one fails:
 *
 *   1. typecheck                    `npm run typecheck`
 *   2. lint                         `npm run lint`
 *   3. build                        `npm run build` (the rest needs it)
 *   4. mobile                       `check:mobile` at 360/390/430, every route
 *   5. screenshots                  every route at 390 and 1440
 *   6. lighthouse                   mobile, every route
 *
 * Output lands in `verify-output/` (gitignored): screenshots, one Lighthouse
 * JSON per route, and `summary.md`, a table that pastes straight into a PR
 * description. Exit code is 0 only if nothing FAILed.
 *
 * ---------------------------------------------------------------------------
 * Knobs, all optional:
 *
 *   CHROME_BIN        chrome-headless-shell (or Chrome) binary. If unset, the
 *                     Playwright install locations are searched.
 *   VERIFY_ROUTES     comma-separated paths, e.g. "/,/contact", to check a
 *                     subset. Default: every route in the sitemap.
 *   VERIFY_LH_RUNS    Lighthouse runs per route; the median is reported.
 *                     Default 1. Mobile LCP here varies by ±0.6s run to run
 *                     (BUILD_NOTES.md, font notes), so use 3 before quoting a
 *                     number anywhere that matters.
 *   VERIFY_PORT       port for the production server. Default 3100, so it does
 *                     not collide with a dev server on 3000.
 *   --skip-lighthouse / --skip-screenshots   for a fast loop while iterating.
 *
 * Thresholds, from the build standards:
 *
 *   performance < 90 FAIL, < 95 WARN · CLS ≥ 0.01 FAIL, > 0 WARN ·
 *   accessibility / best practices < 90 FAIL, < 100 WARN.
 *
 *   SEO is reported but not judged: the root layout sends `noindex` on purpose
 *   until launch (LAUNCH.md), and Lighthouse's SEO score counts that against
 *   every page. Judging it now would make every run red for a known reason.
 * ---------------------------------------------------------------------------
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { sleep } from "./cdp.mjs";
import { offlineFonts } from "./offline-fonts.mjs";
import { routes } from "./routes.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "verify-output");
const PORT = Number(process.env.VERIFY_PORT ?? 3100);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const ONLY = process.env.VERIFY_ROUTES
  ? process.env.VERIFY_ROUTES.split(",").map((r) => r.trim())
  : null;
const LH_RUNS = Math.max(1, Number(process.env.VERIFY_LH_RUNS ?? 1));
const LIGHTHOUSE = "lighthouse@13.5.0";
const SKIP_LH = process.argv.includes("--skip-lighthouse");
const SKIP_SHOTS = process.argv.includes("--skip-screenshots");

/** Every step's outcome, in order, for the summary. */
const steps = [];

// ---------------------------------------------------------------- helpers ---

function run(cmd, args, { env = {}, quiet = false } = {}) {
  return new Promise((res) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let err = "";
    if (quiet) child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => res({ code, err }));
  });
}

async function step(name, cmd, args, env) {
  console.log(`\n── ${name} ${"─".repeat(Math.max(0, 60 - name.length))}`);
  const started = Date.now();
  const { code } = await run(cmd, args, { env });
  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  steps.push({ name, status: code === 0 ? "PASS" : "FAIL", note: `${seconds}s` });
  return code === 0;
}

/**
 * A browser for the CDP checks and Lighthouse. An explicit CHROME_BIN wins;
 * otherwise the headless shell Playwright installs is good enough for both,
 * and it is already on the cloud machines this runs on.
 */
function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    join(process.env.HOME ?? "", ".cache/ms-playwright"),
    "/opt/pw-browsers",
  ].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root).sort().reverse()) {
      if (!dir.startsWith("chromium_headless_shell")) continue;
      const bin = join(root, dir, "chrome-linux", "headless_shell");
      if (existsSync(bin)) return bin;
    }
  }
  return null;
}

async function startServer() {
  const next = join(ROOT, "node_modules", ".bin", "next");
  const server = spawn(next, ["start", "-p", String(PORT), "-H", "127.0.0.1"], {
    cwd: ROOT,
    stdio: "ignore",
    detached: true,
  });
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${ORIGIN}/sitemap.xml`);
      if (r.ok) return server;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  stopServer(server);
  throw new Error(`next start never answered on ${ORIGIN}`);
}

function stopServer(server) {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    /* already gone */
  }
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const slug = (path) =>
  path === "/" ? "home" : path.replace(/^\//, "").replaceAll("/", "--");

/**
 * One Lighthouse run, pinned to one version through npx so it adds nothing to
 * package.json (and nothing to every Vercel install). Its temp Chrome profile goes to the OS temp dir with
 * LOCALAPPDATA pointed there too: under WSL, LOCALAPPDATA is a Windows path and
 * Lighthouse would otherwise create `C:\Users\...` directories in the repo
 * (BUILD_NOTES.md, "Running Lighthouse here took some setup").
 */
async function lighthouse(chrome, path, file) {
  const scratch = join(tmpdir(), "verify-lighthouse");
  await mkdir(scratch, { recursive: true });
  const { code, err } = await run(
    "npx",
    [
      "--yes",
      LIGHTHOUSE,
      ORIGIN + path,
      "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      `--output-path=${file}`,
      "--quiet",
    ],
    // chrome-launcher reads CHROME_PATH; Lighthouse 13 ignores --chrome-path.
    { env: { CHROME_PATH: chrome, TMPDIR: scratch, LOCALAPPDATA: scratch }, quiet: true },
  );
  if (code !== 0) {
    const reason = err.split("\n").find((l) => l.trim() && !/^\s*at /.test(l));
    throw new Error(reason?.trim() ?? `exit ${code}`);
  }
  const report = JSON.parse(await readFile(file, "utf8"));
  const score = (id) => Math.round((report.categories[id]?.score ?? 0) * 100);
  return {
    perf: score("performance"),
    a11y: score("accessibility"),
    bp: score("best-practices"),
    seo: score("seo"),
    lcp: report.audits["largest-contentful-paint"].numericValue / 1000,
    cls: report.audits["cumulative-layout-shift"].numericValue,
    tbt: report.audits["total-blocking-time"].numericValue,
  };
}

function judge(r) {
  const fails = [];
  const warns = [];
  if (r.perf < 90) fails.push(`perf ${r.perf}`);
  else if (r.perf < 95) warns.push(`perf ${r.perf}`);
  if (r.cls >= 0.01) fails.push(`CLS ${r.cls.toFixed(3)}`);
  else if (r.cls > 0) warns.push(`CLS ${r.cls.toFixed(4)}`);
  for (const [key, label] of [
    ["a11y", "a11y"],
    ["bp", "best practices"],
  ]) {
    if (r[key] < 90) fails.push(`${label} ${r[key]}`);
    else if (r[key] < 100) warns.push(`${label} ${r[key]}`);
  }
  return { status: fails.length ? "FAIL" : warns.length ? "WARN" : "PASS", fails, warns };
}

// ------------------------------------------------------------------- main ---

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const chrome = findChrome();
const started = new Date();

await step("typecheck", "npm", ["run", "typecheck"]);
await step("lint", "npm", ["run", "lint"]);
const fonts = await offlineFonts();
const built = await step("build", "npm", ["run", "build"], fonts.env);
fonts.close();

const lhRows = [];
let paths = [];

if (!built) {
  steps.push({ name: "runtime checks", status: "SKIP", note: "build failed" });
} else if (!chrome) {
  steps.push({
    name: "runtime checks",
    status: "FAIL",
    note: "no browser: set CHROME_BIN to a chrome-headless-shell binary",
  });
} else {
  const server = await startServer();
  const env = { ORIGIN, CHROME_BIN: chrome, VERIFY_ROUTES: ONLY?.join(",") ?? "" };
  try {
    const all = await routes(ORIGIN);
    paths = ONLY ? all.filter((p) => ONLY.includes(p)) : all;

    await step("mobile (360/390/430)", "node", ["scripts/check-mobile.mjs"], env);

    if (!SKIP_SHOTS) {
      await step("screenshots (390/1440)", "node", ["scripts/screenshots.mjs"], {
        ...env,
        SCREENSHOT_DIR: join(OUT, "screenshots"),
      });
    }

    if (!SKIP_LH) {
      console.log(`\n── lighthouse (mobile, ${LH_RUNS} run(s) per route) ${"─".repeat(20)}`);
      const dir = join(OUT, "lighthouse");
      await mkdir(dir, { recursive: true });
      for (const path of paths) {
        try {
          const runs = [];
          for (let i = 0; i < LH_RUNS; i++) {
            const file = join(dir, `${slug(path)}${LH_RUNS > 1 ? `.${i + 1}` : ""}.json`);
            runs.push(await lighthouse(chrome, path, file));
          }
          const r = Object.fromEntries(
            Object.keys(runs[0]).map((k) => [k, median(runs.map((x) => x[k]))]),
          );
          const verdict = judge(r);
          lhRows.push({ path, ...r, ...verdict });
          console.log(
            `${verdict.status.padEnd(4)}  ${path.padEnd(40)} perf ${r.perf}  a11y ${r.a11y}  bp ${r.bp}  LCP ${r.lcp.toFixed(2)}s  CLS ${r.cls.toFixed(3)}`,
          );
        } catch (error) {
          lhRows.push({ path, status: "FAIL", fails: [`lighthouse error: ${error.message}`], warns: [] });
          console.log(`FAIL  ${path}  ${error.message}`);
        }
      }
      const worst = lhRows.some((r) => r.status === "FAIL")
        ? "FAIL"
        : lhRows.some((r) => r.status === "WARN")
          ? "WARN"
          : "PASS";
      steps.push({ name: "lighthouse (mobile)", status: worst, note: `${lhRows.length} routes` });
    }
  } finally {
    stopServer(server);
  }
}

// ---------------------------------------------------------------- summary ---

const fmt = (n, d = 0) => (typeof n === "number" ? n.toFixed(d) : "—");
const lines = [
  `## Verify — ${started.toISOString().replace("T", " ").slice(0, 16)} UTC`,
  "",
  "| Step | Result | |",
  "| --- | --- | --- |",
  ...steps.map((s) => `| ${s.name} | **${s.status}** | ${s.note ?? ""} |`),
];
if (lhRows.length) {
  lines.push(
    "",
    `### Lighthouse mobile${LH_RUNS > 1 ? ` (median of ${LH_RUNS})` : ""}`,
    "",
    "| Route | Perf | A11y | BP | SEO* | LCP | CLS | TBT | |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...lhRows.map(
      (r) =>
        `| \`${r.path}\` | ${fmt(r.perf)} | ${fmt(r.a11y)} | ${fmt(r.bp)} | ${fmt(r.seo)} | ${fmt(r.lcp, 2)}s | ${fmt(r.cls, 3)} | ${fmt(r.tbt)}ms | ${r.status}${[...r.fails, ...r.warns].length ? `: ${[...r.fails, ...r.warns].join(", ")}` : ""} |`,
    ),
    "",
    "\\*SEO is not judged while the pre-launch `noindex` is on.",
  );
}
if (!SKIP_SHOTS && paths.length) {
  lines.push("", `Screenshots: \`verify-output/screenshots/{390,1440}/\` (${paths.length} routes each).`);
}
const failed = steps.some((s) => s.status === "FAIL");
lines.push("", failed ? "**Result: FAIL**" : "**Result: PASS**", "");

const summary = lines.join("\n");
await writeFile(join(OUT, "summary.md"), summary);
await writeFile(join(OUT, "summary.json"), JSON.stringify({ steps, lighthouse: lhRows }, null, 2));
console.log(`\n${summary}`);
process.exit(failed ? 1 : 0);
