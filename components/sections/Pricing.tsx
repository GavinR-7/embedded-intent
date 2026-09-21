import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";
import { formatBuild, formatMonthly, services } from "@/content/services";
import type { ServicePricing } from "@/content/services";

const { pricing } = home;

function monthlyCell(servicePricing: ServicePricing): string {
  return servicePricing.monthly ? formatMonthly(servicePricing.monthly) : "—";
}

/**
 * One table, all eight services. Not three named tiers — the offering is
 * modular, and a tier list would imply bundles that aren't for sale.
 *
 * Responsive without duplicating the DOM: it is a real `<table>` at md and up,
 * and below that the table elements are switched to `display: block` so each
 * row becomes a card. The column headers are hidden on mobile and each cell
 * carries its own label instead, so nothing is announced twice and no content
 * is rendered in two places to keep in sync.
 */
export function Pricing() {
  return (
    <Section id="pricing">
      <SectionHeading
        eyebrow={pricing.eyebrow}
        heading={pricing.heading}
        body={pricing.body}
      />

      <div className="mt-14">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Published prices for every service, with one-time build cost and
            ongoing monthly cost.
          </caption>

          <thead className="hidden md:table-header-group">
            <tr className="border-b border-line-interactive">
              <th
                scope="col"
                className="pb-4 pr-6 text-eyebrow font-mono uppercase text-ink-subtle"
              >
                {pricing.columns.service}
              </th>
              <th
                scope="col"
                className="pb-4 pr-6 text-eyebrow font-mono uppercase text-ink-subtle"
              >
                {pricing.columns.build}
              </th>
              <th
                scope="col"
                className="pb-4 text-eyebrow font-mono uppercase text-ink-subtle"
              >
                {pricing.columns.monthly}
              </th>
            </tr>
          </thead>

          <tbody className="block md:table-row-group">
            {services.map((service) => (
              <tr
                key={service.slug}
                className="mb-4 block rounded-card border border-line p-6 last:mb-0 md:mb-0 md:table-row md:rounded-none md:border-0 md:border-b md:border-line md:p-0"
              >
                <th
                  scope="row"
                  className="block text-left md:table-cell md:py-6 md:pr-6 md:align-top"
                >
                  <span className="text-h3 text-ink md:text-body md:font-medium">
                    {service.name}
                  </span>

                  {service.pricing.passThrough && (
                    <span className="mt-2 block max-w-md text-label font-normal text-ink-subtle">
                      {service.pricing.passThrough}
                    </span>
                  )}
                </th>

                <td className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-4 md:mt-0 md:table-cell md:border-0 md:py-6 md:pr-6 md:align-top">
                  <span className="text-eyebrow font-mono uppercase text-ink-subtle md:hidden">
                    {pricing.columns.build}
                  </span>
                  <span className="font-mono tabular-nums text-ink">
                    {formatBuild(service.pricing)}
                  </span>
                </td>

                <td className="mt-3 flex items-baseline justify-between gap-4 md:mt-0 md:table-cell md:py-6 md:align-top">
                  <span className="shrink-0 text-eyebrow font-mono uppercase text-ink-subtle md:hidden">
                    {pricing.columns.monthly}
                  </span>
                  <span className="text-right font-mono tabular-nums text-ink md:text-left">
                    {monthlyCell(service.pricing)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="mt-8 flex flex-col gap-2">
          {pricing.notes.map((note) => (
            <li key={note} className="text-label text-ink-subtle">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
