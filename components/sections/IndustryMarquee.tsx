import { home } from "@/content/home";

const { industries } = home;

/**
 * The industries strip, under the hero trust line.
 *
 * Not a logo wall. These are business types the offering fits, and the label
 * says "Built for" rather than "Trusted by" for exactly that reason — a strip of
 * names under a hero reads as a client list unless it says otherwise, and we
 * have one live client.
 *
 * A Server Component. Every moving part is in the `marquee` utility in
 * app/globals.css: a 40s `translateX` on a track holding the list twice, soft
 * edges, pause on hover, and the static wrapped row under
 * `prefers-reduced-motion: reduce`. This was a client component first, only so
 * it could branch on that media query in JavaScript — doing the branch in CSS
 * took twenty-four list items out of the hydration pass and every industry name
 * out of the JavaScript bundle.
 *
 * `data-pause-offscreen` is the other half: one observer in MotionRuntime stops
 * the animation whenever the hero is not on screen.
 *
 * The second copy is `aria-hidden`, so a screen reader reads twelve industries
 * and not twenty-four, and -50% lands exactly on the start of that copy so the
 * loop has no visible seam.
 */
function Names({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ul
      aria-hidden={duplicate || undefined}
      data-marquee-duplicate={duplicate ? "" : undefined}
      className="flex shrink-0 items-center"
    >
      {industries.items.map((item) => (
        <li
          key={item}
          className="flex items-center gap-4 pr-4 text-label whitespace-nowrap text-ink-subtle"
        >
          {item}
          <span aria-hidden="true" className="text-line-strong">
            ·
          </span>
        </li>
      ))}
    </ul>
  );
}

export function IndustryMarquee() {
  return (
    <div
      data-pause-offscreen=""
      className="mt-6 flex items-center gap-4 border-t border-line pt-6"
    >
      <p className="shrink-0 text-eyebrow font-mono uppercase text-ink-subtle">
        {industries.label}
      </p>

      <div className="marquee relative min-w-0 flex-1">
        <div data-marquee-track className="flex">
          <Names />
          <Names duplicate />
        </div>
      </div>
    </div>
  );
}
