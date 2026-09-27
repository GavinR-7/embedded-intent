import type { Metadata } from "next";

import { site } from "@/content/site";
import { OG_SIZE } from "@/lib/ogTheme";

/**
 * Every route's tags, built in one place.
 *
 * ---------------------------------------------------------------------------
 * Why a helper and not eight hand-written objects.
 *
 * `openGraph` does NOT merge with the parent layout's — a child that sets it
 * replaces the whole object. So a route that writes `openGraph: { title,
 * description }` silently drops `siteName`, `locale` and `type` from the root,
 * and a route that forgets `openGraph` entirely inherits the homepage's title on
 * every share. Both had already happened here: the three category routes and the
 * two dynamic ones each wrote their own partial object, and /contact and /work
 * wrote none at all.
 *
 * The same goes for `twitter`. There is no route on this site that wants a
 * different card type, so it is decided once, here.
 *
 * `canonical` is relative and resolves against `metadataBase` in app/layout.tsx,
 * which is `site.url`. That is deliberate: the canonical host is written down
 * exactly once, in content/site.ts.
 * ---------------------------------------------------------------------------
 *
 * `image` is passed explicitly, and it was not at first. The reasoning was that
 * Next's `opengraph-image.tsx` file convention would attach the right card per
 * segment and that naming it here would be a second thing to keep in step. That
 * is wrong, and it is the same merge trap as above wearing a different hat: a
 * page that declares its own `openGraph` object suppresses the image the root
 * segment's file would have contributed. The four routes with a card in their own
 * segment kept theirs; /contact, /work, /work/[slug] and all eleven service pages
 * silently lost `og:image` and `twitter:image` entirely.
 *
 * So the card is named. The default is the root one, which is the right answer
 * for every route that has no card of its own.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  image = "/opengraph-image",
}: {
  /**
   * The page title, WITHOUT the site name — the template in app/layout.tsx adds
   * it. The one exception is the homepage, which passes `null` and takes the
   * default title.
   */
  title: string | null;
  description: string;
  /** Route path, with a leading slash. `/` for the homepage. */
  path: string;
  /** `article` for a case study, `website` for everything else. */
  type?: "website" | "article";
  /**
   * The social card for this route.
   *
   * A path to one of the `opengraph-image.tsx` routes. The default is the card
   * at the root; the three category pages pass their own.
   */
  image?: string;
}): Metadata {
  // The homepage has no title of its own; `title.default` in the root layout is
  // already "Embedded Intent — <tagline>", and a template would double the name.
  const shared = title === null ? `${site.name} — ${site.tagline}` : `${title} · ${site.name}`;

  return {
    ...(title === null ? {} : { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      title: shared,
      description,
      url: path,
      siteName: site.name,
      locale: "en_US",
      type,
      images: [{ url: image, width: OG_SIZE.width, height: OG_SIZE.height }],
    },
    twitter: {
      // The site's OG images are 1200x630, which is the large-card ratio.
      card: "summary_large_image",
      title: shared,
      description,
      images: [image],
    },
  };
}
