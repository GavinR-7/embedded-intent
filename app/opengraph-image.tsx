import { ImageResponse } from "next/og";

import { SocialCard } from "@/components/brand/SocialCard";
import { site } from "@/content/site";
import { OG_SIZE } from "@/lib/ogTheme";

/**
 * The default social preview, for every route without one of its own.
 *
 * File-convention metadata: Next attaches `og:image` and `twitter:image` to this
 * segment and everything under it, so /contact, /work, /work/[slug] and all
 * eleven service pages inherit this card. The three category routes each shadow
 * it with their own. That inheritance is why lib/seo.ts deliberately does not set
 * `openGraph.images` — the files are the single source, and anything written in
 * the metadata object would be a second one to keep in step.
 *
 * Statically generated at build time: nothing in here reads a request.
 */
export const alt = `${site.name} — ${site.tagline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(<SocialCard eyebrow={site.name} heading={site.tagline} />, size);
}
