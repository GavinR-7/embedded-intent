"use client";

import dynamic from "next/dynamic";

import type { CategorySlug } from "@/content/categories";

/**
 * The three category hero illustrations, loaded on the client only.
 *
 * ---------------------------------------------------------------------------
 * `ssr: false` is the point of this file, and it is why the file exists at all:
 * `next/dynamic` refuses `ssr: false` inside a Server Component, so the option
 * has to be used from inside a client boundary. This is that boundary, and it
 * is four lines of it.
 *
 * Skipping the server render is what keeps these off the critical path
 * entirely. There is no illustration in the HTML, so there is nothing for the
 * first paint to wait on and nothing for the largest-contentful-paint
 * measurement to look at — the h1 and the subheading beside them are still the
 * only text in the hero. The chunk arrives afterwards and fills a box that was
 * already the right size, so it costs no layout shift either.
 *
 * The caption and the description live in the server component that renders
 * this one, for the same reason: they are content, they should be in the HTML,
 * and they should be there whether or not this chunk ever loads.
 * ---------------------------------------------------------------------------
 */
const VISUALS = {
  websites: dynamic(() => import("./XrayLens"), { ssr: false }),
  "get-found": dynamic(() => import("./MapPack"), { ssr: false }),
  "ai-automation": dynamic(() => import("./PhoneThread"), { ssr: false }),
} as const satisfies Record<CategorySlug, unknown>;

export function CategoryVisualIsland({ slug }: { slug: CategorySlug }) {
  const Visual = VISUALS[slug];
  return <Visual />;
}
