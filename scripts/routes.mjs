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
