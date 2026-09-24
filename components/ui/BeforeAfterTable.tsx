import type { BeforeAfter } from "@/content/primitives";

/**
 * The two-column before/after comparison.
 *
 * Column labels once at the top rather than repeated on every row — on mobile
 * the halves stack, so each one carries its own label there and the header row
 * is hidden.
 *
 * Extracted in Phase 7: the homepage, every service page and now every category
 * page render the same thing from different data, and three copies meant three
 * places to add the reveal to.
 */
export function BeforeAfterTable({
  pairs,
  beforeLabel,
  afterLabel,
}: {
  pairs: readonly BeforeAfter[];
  beforeLabel: string;
  afterLabel: string;
}) {
  return (
    <>
      <div className="mt-12 hidden gap-px md:grid md:grid-cols-2">
        <p data-reveal="" className="text-eyebrow font-mono uppercase text-ink-subtle">
          {beforeLabel}
        </p>
        <p data-reveal="" className="text-eyebrow font-mono uppercase text-signal">
          {afterLabel}
        </p>
      </div>

      <div className="mt-4 grid gap-px overflow-hidden rounded-card bg-line">
        {pairs.map((pair) => (
          <div key={pair.before} data-reveal="" className="grid gap-px bg-line md:grid-cols-2">
            <div className="lift spotlight bg-void p-6 sm:p-7">
              <p className="text-eyebrow font-mono uppercase text-ink-subtle md:hidden">
                {beforeLabel}
              </p>
              <p className="mt-3 text-lead text-ink-muted md:mt-0">{pair.before}</p>
            </div>
            <div className="lift spotlight bg-void p-6 sm:p-7">
              <p className="text-eyebrow font-mono uppercase text-signal md:hidden">
                {afterLabel}
              </p>
              <p className="mt-3 text-lead text-ink md:mt-0">{pair.after}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
