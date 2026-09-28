import { CategoryVisualIsland } from "@/components/category/visuals";
import type { CategorySlug } from "@/content/categories";
import { heroVisuals } from "@/content/heroVisuals";

/**
 * The signature hero visual for one category page.
 *
 * Each category page gets a drawing that demonstrates what the category does,
 * instead of the generic circuit-trace texture every other hero on the site
 * uses: a lens that x-rays a finished page, a map pack a business climbs, a
 * phone thread that books a job on its own.
 *
 * ---------------------------------------------------------------------------
 * This component is a Server Component, and everything that matters is in it.
 *
 * The frame, its aspect ratio, the caption and the description are all rendered
 * on the server and are in the HTML. Only the moving parts are lazy — see
 * components/category/visuals/index.tsx.
 *
 * Two consequences, both deliberate:
 *
 *   - the box is the right size before the chunk arrives, so there is no layout
 *     shift when it does. The aspect ratio is declared here, per category,
 *     because a phone is portrait and the other two are not.
 *   - the illustration is described and captioned even if the chunk never
 *     arrives at all. A reader with JavaScript off gets an empty frame with a
 *     sentence under it saying what it would have shown, which is a great deal
 *     better than an empty frame.
 *
 * `role="img"` with an `aria-label` on the frame, plus a visible `figcaption`:
 * assistive tech gets a description of the drawing AND the note that it is an
 * illustration, which are two different pieces of information. The drawing
 * itself is built from divs and has no accessible content of its own.
 * ---------------------------------------------------------------------------
 */

/**
 * Per category, because a phone is portrait and a web page is not.
 *
 * /ai-automation changes shape at `lg`: the core sits above the handset on a
 * narrow screen and beside it on a wide one, so the box it needs is tall in one
 * layout and wide in the other.
 *
 * /get-found has NO fixed ratio below `sm`, and that is a fix rather than a
 * preference. Its drawing is a map above a four-row list, and a 4:3 box 350px
 * wide is 262px tall — enough for the map and three of the rows. The fourth row
 * was drawn 37px below the bottom of a box with `overflow: hidden` on it, so on
 * every phone the illustration of a business climbing to first place was missing
 * the position it climbed from, and nothing about that looked like a bug: the
 * clip was doing exactly what it was told. Off a fixed ratio the box is as tall
 * as the drawing needs, and scripts/check-mobile.mjs now fails if any text inside
 * one of these frames lands outside it.
 *
 * WHICH IS WHY THE MIN-HEIGHT IS THERE. Dropping the ratio also dropped the
 * reserved space, and the box is empty until the client chunk arrives: the first
 * measurement after that change had /get-found at CLS 0.086 in all five runs,
 * from a frame that grew by 347px under the caption. 21.75rem is 348px, and 347
 * is what the drawing measures at every width below `sm` — every part of it (the
 * query bar, the 10rem map, the heading, four 1.75rem rows) is a fixed size, so
 * the number does not move with the viewport. A MINIMUM rather than a height, so
 * that if the drawing ever does grow it costs a layout shift instead of a clip:
 * one of those is caught by Lighthouse and the other was invisible for a month.
 */
const ASPECT: Record<CategorySlug, string> = {
  websites: "aspect-[4/3]",
  "get-found": "aspect-auto max-sm:min-h-[21.75rem] sm:aspect-[4/3]",
  "ai-automation": "aspect-[5/7] lg:aspect-[4/3]",
};

/**
 * How wide the figure is allowed to get.
 *
 * The phone is portrait, so at the full width of a hero column it ends up
 * taller than the copy beside it and pushes its own caption off the screen.
 * Capping its width on a narrow screen is what keeps all three roughly the same
 * visual weight. From `lg` the core sits beside it and the figure wants the whole
 * column.
 */
const MAX_WIDTH: Record<CategorySlug, string> = {
  websites: "max-w-md lg:max-w-none",
  "get-found": "max-w-md lg:max-w-none",
  "ai-automation": "max-w-[19rem] lg:max-w-none",
};

const COPY: Record<CategorySlug, { caption: string; alt: string }> = {
  websites: heroVisuals.websites,
  "get-found": heroVisuals.getFound,
  "ai-automation": heroVisuals.aiAutomation,
};

export function CategoryVisual({ slug }: { slug: CategorySlug }) {
  const { caption, alt } = COPY[slug];

  return (
    <figure className={`mx-auto w-full ${MAX_WIDTH[slug]}`}>
      <div
        role="img"
        aria-label={alt}
        className={`w-full overflow-hidden rounded-card border border-line bg-void/60 ${ASPECT[slug]}`}
      >
        <CategoryVisualIsland slug={slug} />
      </div>

      {/* Sentence case and a readable size. The first version of this was the
          site's mono eyebrow treatment — uppercase at 11px with 0.16em of
          tracking — which is a label style, and this is a sentence someone has
          to actually read in order for the figure to be honest. */}
      <figcaption className="mt-3 text-label text-ink-subtle">{caption}</figcaption>
    </figure>
  );
}
