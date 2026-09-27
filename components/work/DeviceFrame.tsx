import Image from "next/image";

import type { CaseStudyImage } from "@/content/work";

/**
 * A screenshot, shown on the device it was taken on.
 *
 * ---------------------------------------------------------------------------
 * The frames are HTML and CSS in the site's own tokens — a `border`, a
 * `rounded-*`, and a strip of dots for a title bar. Nothing is baked into the
 * image files.
 *
 * That is worth the few extra elements. A cropped screenshot floating in a
 * rounded rectangle does not tell you whether you are looking at a phone or a
 * window, so three of them side by side read as three pictures of nothing in
 * particular. Framed, the same three captures say "this is what it looks like on
 * a laptop, and this is what it looks like in your hand" without a word of
 * caption — which is the entire claim of a mobile-first rebuild.
 *
 * It also keeps the images honest: the frame belongs to us and the pixels belong
 * to the client's site, so nobody can mistake our chrome for theirs.
 * ---------------------------------------------------------------------------
 *
 * `aspect-[...]` on the screen rather than a fixed height, so the frame scales
 * with the column it is in and the image never letterboxes inside it. The
 * captures are viewport-sized, so their own ratios are exactly 1440/900 and
 * 390/844 and `object-cover` has nothing to crop.
 */
export function DeviceFrame({
  image,
  priority = false,
  sizes,
}: {
  image: CaseStudyImage;
  /** The hero capture opts in; the two below the fold do not. */
  priority?: boolean;
  sizes: string;
}) {
  const screen = (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      priority={priority}
      sizes={sizes}
      className="h-full w-full object-cover object-top"
    />
  );

  if (image.frame === "phone") {
    return (
      <div className="mx-auto w-full max-w-[17rem] rounded-[2rem] border border-line-strong bg-void p-2 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]">
        {/* The speaker pill. Enough to read as a handset without drawing a
            specific one — the same restraint as the phone in the
            /ai-automation illustration. */}
        <div className="flex items-center justify-center py-1.5">
          <span aria-hidden="true" className="h-1 w-12 rounded-full bg-line-strong" />
        </div>
        <div className="aspect-[390/844] overflow-hidden rounded-[1.4rem] bg-surface">
          {screen}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-card border border-line-strong bg-void">
      {/* The title bar. Three dots and a stand-in for an address field: the
          least that reads as a browser window. `aria-hidden` throughout —
          it is furniture, and the alt text on the capture is the content. */}
      <div
        aria-hidden="true"
        className="flex items-center gap-2 border-b border-line-strong bg-surface px-4 py-3"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 h-4 flex-1 rounded-full bg-void/70" />
      </div>

      <div className="aspect-[1440/900] overflow-hidden bg-surface">{screen}</div>
    </div>
  );
}
