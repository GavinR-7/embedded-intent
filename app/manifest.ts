import type { MetadataRoute } from "next";

import { site } from "@/content/site";

/**
 * The web app manifest, at /manifest.webmanifest.
 *
 * This site is not an app and does not want to be one — there is no service
 * worker and no offline mode, and `display: "browser"` says so rather than
 * pretending otherwise. What the manifest is actually for here is the case where
 * someone adds the site to a phone's home screen: without it they get a
 * screenshot of the page and the URL as a label.
 *
 * Icons come from `public/`, generated from public/icon.svg — see the note in
 * that file. Two purposes are declared because they are genuinely different
 * pictures: `any` is the mark with its own dark rounded background, `maskable`
 * is the one Android will crop to whatever shape the launcher uses, which is
 * safe here because the mark sits well inside the 80% safe zone.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "browser",
    background_color: site.themeColor,
    theme_color: site.themeColor,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
