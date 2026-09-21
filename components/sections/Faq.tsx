import { Section, SectionHeading } from "@/components/ui/Section";
import { faqs } from "@/content/faq";
import { home } from "@/content/home";

const { faq } = home;

/**
 * Native `<details>`/`<summary>`.
 *
 * No JavaScript, no state, no ARIA to get wrong: the browser gives correct
 * expand/collapse semantics, keyboard operation and screen-reader announcement
 * for free, and the answers are findable with the browser's own in-page search
 * even while collapsed. A hand-rolled accordion would ship JS to reimplement
 * all of that, slightly worse.
 *
 * Left deliberately uncontrolled, so more than one can be open at a time —
 * closing someone's answer because they opened another is not a feature.
 */
export function Faq() {
  return (
    <Section id="faq">
      <SectionHeading eyebrow={faq.eyebrow} heading={faq.heading} />

      <div className="mt-14 border-t border-line">
        {faqs.map((item) => (
          <details
            key={item.id}
            id={item.id}
            className="group border-b border-line"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lead text-ink transition-colors duration-[var(--duration-fast)] hover:text-signal [&::-webkit-details-marker]:hidden">
              {item.question}

              {/* A plus that becomes a minus. Rotating one stroke is cheaper
                  than swapping icons and it animates for free. */}
              <span
                aria-hidden="true"
                className="relative h-4 w-4 shrink-0 text-signal"
              >
                <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
                <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 rotate-90 bg-current transition-transform duration-[var(--duration-base)] ease-precise group-open:rotate-0" />
              </span>
            </summary>

            <p className="max-w-prose-tight pb-7 text-body text-ink-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
