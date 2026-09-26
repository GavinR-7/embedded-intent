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

/** Per category, because a phone is portrait and a web page is not. */
const ASPECT: Record<CategorySlug, string> = {
  websites: "aspect-[4/3]",
  "get-found": "aspect-[4/3]",
  "ai-automation": "aspect-[4/5]",
};

/**
 * How wide the figure is allowed to get.
 *
 * The phone is portrait, so at the full width of a hero column it ends up
 * taller than the copy beside it and pushes its own caption off the screen.
 * Capping its width is what keeps all three roughly the same visual weight.
 */
const MAX_WIDTH: Record<CategorySlug, string> = {
  websites: "max-w-md lg:max-w-none",
  "get-found": "max-w-md lg:max-w-none",
  "ai-automation": "max-w-[19rem] lg:max-w-sm",
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
