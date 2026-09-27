import { ImageResponse } from "next/og";

import { SocialCard } from "@/components/brand/SocialCard";
import { getCategory } from "@/content/categories";
import { site } from "@/content/site";
import { OG_SIZE } from "@/lib/ogTheme";

/**
 * The social preview for /websites.
 *
 * Shadows the default card at the root for this segment only. Everything it says
 * comes from content/categories.ts, so the card and the page cannot disagree
 * about what this category is called or what it claims.
 */
const category = getCategory("websites");

export const alt = `${category.heading} — ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <SocialCard eyebrow={category.eyebrow} heading={category.heading} />,
    size,
  );
}
