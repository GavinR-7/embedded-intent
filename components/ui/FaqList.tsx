import type { FaqItem } from "@/content/faq";

/**
 * A list of questions, as native `<details>`/`<summary>`.
 *
 * No JavaScript, no state, no ARIA to get wrong: the browser gives correct
 * expand/collapse semantics, keyboard operation and screen-reader announcement
 * for free, and the answers are findable with the browser's own in-page search
 * even while collapsed. A hand-rolled accordion would ship JS to reimplement
 * all of that, slightly worse.
 *
 * Left deliberately uncontrolled, so more than one can be open at a time —
 * closing someone's answer because they opened another is not a feature.
 *
 * Extracted in Phase 7 because the same markup was in three places (homepage,
 * service pages, category pages) and the open/close animation needed to be
 * added to all of them. Three copies of an accordion is three chances for one
 * of them to snap open while the others glide.
 */
export function FaqList({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="mt-12 border-t border-line">
      {items.map((item) => (
        <details
          key={item.id}
          id={item.id}
          data-reveal=""
          /* `faq-item` animates ::details-content — see app/globals.css. */
          className="faq-item group border-b border-line"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lead text-ink transition-colors duration-[var(--duration-fast)] hover:text-signal [&::-webkit-details-marker]:hidden">
            {item.question}

            {/*
              A plus that becomes a cross. Two strokes at right angles, and the
              wrapper turns 45° — one `rotate` on one element, rather than
              swapping icons or animating a path.
            */}
            <span
              aria-hidden="true"
              className="relative h-4 w-4 shrink-0 text-signal transition-transform duration-[var(--duration-base)] ease-precise group-open:rotate-45"
            >
              <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
              <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 rotate-90 bg-current" />
            </span>
          </summary>

          <p className="max-w-prose-tight pb-7 text-body text-ink-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
