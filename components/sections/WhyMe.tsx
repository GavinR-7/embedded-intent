import { Eyebrow, Section } from "@/components/ui/Section";
import { home } from "@/content/home";

const { whyMe } = home;

/**
 * The differentiator leads. It is the section's <h2>, not a row buried in a
 * comparison table — everything in the table below is a consequence of it.
 */
export function WhyMe() {
  return (
    <Section id="why-me">
      <div className="max-w-3xl">
        <Eyebrow>{whyMe.eyebrow}</Eyebrow>
        <h2 className="mt-5 text-h2 text-ink">{whyMe.heading}</h2>
        <p className="mt-6 max-w-prose-tight text-lead text-ink-muted">{whyMe.body}</p>
      </div>

      {/* Same responsive technique as the pricing table: a real table at md
          and up, stacked cards below, with per-cell labels on mobile instead
          of a duplicated DOM. */}
      <table className="mt-14 w-full border-collapse text-left">
        <caption className="sr-only">
          A comparison of a typical agency and Embedded Intent across five
          aspects of how the work is done.
        </caption>

        <thead className="hidden md:table-header-group">
          <tr className="border-b border-line-interactive">
            <th scope="col" className="pb-4 pr-6">
              <span className="sr-only">Aspect</span>
            </th>
            <th
              scope="col"
              className="pb-4 pr-6 text-eyebrow font-mono uppercase text-ink-subtle"
            >
              {whyMe.columns.typical}
            </th>
            <th
              scope="col"
              className="pb-4 text-eyebrow font-mono uppercase text-signal"
            >
              {whyMe.columns.ours}
            </th>
          </tr>
        </thead>

        <tbody className="block md:table-row-group">
          {whyMe.rows.map((row) => (
            <tr
              key={row.aspect}
              className="mb-4 block rounded-card border border-line p-6 last:mb-0 md:mb-0 md:table-row md:rounded-none md:border-0 md:border-b md:border-line md:p-0"
            >
              <th
                scope="row"
                className="block text-left text-body font-medium text-ink md:table-cell md:py-6 md:pr-6 md:align-top"
              >
                {row.aspect}
              </th>

              <td className="mt-4 block border-t border-line pt-4 md:mt-0 md:table-cell md:border-0 md:py-6 md:pr-6 md:align-top">
                <span className="mb-1 block text-eyebrow font-mono uppercase text-ink-subtle md:hidden">
                  {whyMe.columns.typical}
                </span>
                <span className="text-label text-ink-subtle">{row.typical}</span>
              </td>

              <td className="mt-4 block md:mt-0 md:table-cell md:py-6 md:align-top">
                <span className="mb-1 block text-eyebrow font-mono uppercase text-signal md:hidden">
                  {whyMe.columns.ours}
                </span>
                <span className="text-label text-ink">{row.ours}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
