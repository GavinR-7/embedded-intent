import type { MetadataRoute } from "next";

/**
 * ⚠️ PRE-LAUNCH: THIS BLOCKS THE ENTIRE SITE FROM SEARCH ENGINES. ⚠️
 *
 * This is deliberate, not a mistake. The site is being built in public on a
 * Vercel URL with placeholder copy in it, and a half-written page indexed under
 * the brand name is worse than no page at all.
 *
 * MUST BE REVERTED BEFORE LAUNCH. The launch version is:
 *
 *   rules: { userAgent: "*", allow: "/" },
 *   sitemap: `${site.url}/sitemap.xml`,
 *
 * The matching `robots: { index: false, follow: false }` in app/layout.tsx has
 * to come out at the same time — robots.txt stops crawling, the meta tag stops
 * indexing, and both are on right now. Tracked in CONTENT_TODO.md.
 *
 * This file generates /robots.txt at build time.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
