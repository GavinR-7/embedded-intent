/**
 * Every route on the site, as one list.
 *
 * Read from the running server's own sitemap rather than typed out here, so a
 * route that is added to app/sitemap.ts is checked by every script in this
 * directory without anyone remembering to add it twice. A route deliberately
 * left out of the sitemap is deliberately left out of these checks too.
 */
export async function routes(origin = "http://localhost:3000") {
  const xml = await (await fetch(`${origin}/sitemap.xml`)).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname)
    .map((p) => (p.length > 1 ? p.replace(/\/$/, "") : p));
  if (paths.length === 0) throw new Error("sitemap listed no routes");
  return paths;
}

/**
 * The routes a check should run on: every route, or the `VERIFY_ROUTES`
 * subset (comma-separated paths). A requested path the sitemap doesn't list
 * is an error, not a silent skip: a typo would otherwise produce an empty
 * selection and a run that "passes" without checking anything.
 */
export async function selectedRoutes(origin = "http://localhost:3000") {
  const all = await routes(origin);
  const wanted = (process.env.VERIFY_ROUTES ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((p) => (p.length > 1 ? p.replace(/\/$/, "") : p));
  if (wanted.length === 0) return all;
  const missing = wanted.filter((p) => !all.includes(p));
  if (missing.length) {
    throw new Error(
      `VERIFY_ROUTES lists paths the sitemap doesn't: ${missing.join(", ")}`,
    );
  }
  return all.filter((p) => wanted.includes(p));
}
