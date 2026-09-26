import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BeforeAfterTable } from "@/components/ui/BeforeAfterTable";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { FaqList } from "@/components/ui/FaqList";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { SystemPanel } from "@/components/ui/SystemPanel";
import { TraceGrid } from "@/components/ui/TraceGrid";
import { audit } from "@/content/audit";
import { categoryHref, getCategory } from "@/content/categories";
import { faqsForService } from "@/content/faq";
import {
  formatMonthly,
  formatPriceBand,
  getService,
  services,
} from "@/content/services";
import { servicePage } from "@/content/servicePage";
import { site } from "@/content/site";
import { gridShape, spanLastIfOdd } from "@/lib/grid";

/**
 * One page per service, generated at build time from `content/services.ts`.
 *
 * `generateStaticParams` + `dynamicParams = false` means the eight known slugs
 * are prerendered and anything else 404s at the routing layer rather than
 * being rendered on demand. The catalogue is a fixed list in the repo; there
 * is no runtime source of new slugs, so on-demand rendering would only be a
 * way to serve a page for a slug that does not exist.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

/**
 * `params` is a Promise in Next 16 — the synchronous access that worked in 15
 * is removed. `PageProps<'/services/[slug]'>` is a generated global (no
 * import) and is route-aware: it types `params` as `Promise<{ slug: string }>`
 * straight from the directory structure.
 */
export async function generateMetadata(
  props: PageProps<"/services/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const service = getService(slug);

  if (!service) return {};

  return {
    title: service.name,
    description: service.promise,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.name} — ${site.name}`,
      description: service.promise,
      url: `/services/${service.slug}`,
      type: "website",
    },
  };
}

export default async function ServicePage(props: PageProps<"/services/[slug]">) {
  const { slug } = await props.params;
  const service = getService(slug);

  // Unreachable with dynamicParams = false, but it is what narrows
  // `Service | undefined` to `Service` for everything below.
  if (!service) notFound();

  const faqs = faqsForService(service.slug);
  const category = getCategory(service.category);
  const symptomGrid = gridShape(service.symptoms.length);

  return (
    <>
      <Section tone="void" size="lg" divider={false} bleedTop overlay={<TraceGrid />}>
        {/* Up one level, to the category this service belongs to — not to the
            homepage catalogue. A reader who came in on a service page and wants
            the alternatives wants the other three things in the same category,
            which is exactly what /websites is. */}
        <Link
          href={categoryHref(service.category)}
          className="rounded-sm text-label text-ink-subtle transition-colors duration-[var(--duration-fast)] hover:text-signal"
        >
          ← {category.label}
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-3">
            <Eyebrow>{servicePage.eyebrow}</Eyebrow>

            <h1 className="mt-6 text-h1 text-ink">{service.name}</h1>

            <p className="mt-7 max-w-prose-tight text-lead text-ink-muted">
              {service.promise}
            </p>

            <div className="mt-9">
              <ButtonLink href={site.primaryCta.href}>
                {site.primaryCta.label}
              </ButtonLink>
              <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
            </div>
          </div>

          {/* The flow panel: the same component as the homepage hero, fed
              this service's own steps. What actually happens, in order. */}
          <div className="lg:col-span-2">
            <SystemPanel
              reveal
              title={service.name}
              statusLabel={servicePage.panelStatusLabel}
              rows={service.flow.map((step, index) => ({
                id: `${service.slug}-${index}`,
                title: step.title,
                detail: step.detail,
                icon: step.icon,
              }))}
              footerChain={service.outcomeChain}
            />

            <dl data-reveal="" className="mt-5 grid gap-px overflow-hidden rounded-card border border-line">
              <div className="hairline bg-void p-6">
                <dt className="text-eyebrow font-mono uppercase text-signal">
                  {servicePage.forWhomHeading}
                </dt>
                <dd className="mt-3 text-label text-ink-muted">{service.forWhom}</dd>
              </div>
              <div className="hairline bg-void p-6">
                <dt className="text-eyebrow font-mono uppercase text-signal">
                  {servicePage.timelineHeading}
                </dt>
                <dd className="mt-3 text-label text-ink-muted">{service.timeline}</dd>
              </div>
              <div className="hairline bg-void p-6">
                <dt className="text-eyebrow font-mono uppercase text-signal">
                  {servicePage.outcomeHeading}
                </dt>
                <dd className="mt-3 text-label text-ink">{service.outcome}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>

      {/* What's happening now. Scenes from the reader's week, not properties
          of his website — the writing rules are at the top of
          content/services.ts and the type enforces at least three. */}
      <Section tone="surface">
        <SectionHeading
          eyebrow={servicePage.symptomsEyebrow}
          heading={servicePage.symptomsHeading}
        />

        <ul
          className={`mt-12 grid gap-px overflow-hidden rounded-card border border-line ${symptomGrid.columns}`}
        >
          {service.symptoms.map((symptom, index) => (
            <li
              key={symptom}
              data-reveal=""
              className={`hairline lift spotlight bg-void p-7 text-lead text-ink-muted ${
                index === service.symptoms.length - 1 ? symptomGrid.lastItem : ""
              }`}
            >
              {symptom}
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="void">
        <SectionHeading
          eyebrow={servicePage.includesEyebrow}
          heading={servicePage.includesHeading}
        />

        {/* Two columns, fixed — nine one-line deliverables read well in two and
            badly in three. An odd count stretches the last line across both, so
            it does not sit alone beside an empty cell. */}
        <ul className="mt-12 grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {service.includes.map((item, index) => (
            <li
              key={item}
              data-reveal=""
              className={`flex gap-3 text-lead text-ink-muted ${
                index === service.includes.length - 1
                  ? spanLastIfOdd(service.includes.length)
                  : ""
              }`}
            >
              <span aria-hidden="true" className="mt-3.5 h-px w-4 shrink-0 bg-signal" />
              {item}
            </li>
          ))}
        </ul>

        {/* Named examples, for a service whose scope is otherwise abstract.
            "Custom automation" means nothing until you can point at the jobs
            it replaces. */}
        {service.examples && (
          <div className="mt-12">
            <h3 data-reveal="" className="text-eyebrow font-mono uppercase text-signal">
              {servicePage.examplesHeading}
            </h3>
            <ul
              className={`mt-5 grid gap-px overflow-hidden rounded-card border border-line ${
                gridShape(service.examples.length).columns
              }`}
            >
              {service.examples.map((example, index) => (
                <li
                  key={example}
                  data-reveal=""
                  className={`hairline lift spotlight bg-void p-6 text-lead text-ink-muted ${
                    index === (service.examples?.length ?? 0) - 1
                      ? gridShape(service.examples?.length ?? 0).lastItem
                      : ""
                  }`}
                >
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        {service.notThis && (
          <div
            data-reveal=""
            className="mt-12 rounded-card border border-line bg-surface/40 p-7"
          >
            <h3 className="text-eyebrow font-mono uppercase text-alert">
              {servicePage.notThisEyebrow}
            </h3>
            <p className="mt-4 max-w-prose-tight text-lead text-ink-muted">
              {service.notThis}
            </p>
          </div>
        )}
      </Section>

      <Section tone="surface">
        <SectionHeading
          eyebrow={servicePage.changeEyebrow}
          heading={servicePage.changeHeading}
        />

        <BeforeAfterTable
          pairs={service.beforeAfter}
          beforeLabel={servicePage.beforeLabel}
          afterLabel={servicePage.afterLabel}
        />
      </Section>

      <Section tone="void">
        <SectionHeading
          eyebrow={servicePage.pricingEyebrow}
          heading={servicePage.pricingHeading}
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-line sm:grid-cols-2">
          <div data-reveal="" className="hairline spotlight bg-void p-7 sm:p-9">
            <p className="text-eyebrow font-mono uppercase text-ink-subtle">
              {servicePage.buildLabel}
            </p>
            <p className="mt-4 font-mono text-h2 tabular-nums text-ink">
              {service.pricing.build
                ? formatPriceBand(service.pricing.build)
                : servicePage.noBuildLabel}
            </p>
            {service.pricing.buildTypical && (
              <p className="mt-3 text-label text-ink-subtle">
                {servicePage.typicalLabel}{" "}
                {formatPriceBand(service.pricing.buildTypical)}
              </p>
            )}
          </div>

          <div data-reveal="" className="hairline spotlight bg-void p-7 sm:p-9">
            <p className="text-eyebrow font-mono uppercase text-ink-subtle">
              {servicePage.monthlyLabel}
            </p>
            <p className="mt-4 font-mono text-h2 tabular-nums text-ink">
              {service.pricing.monthly
                ? formatMonthly(service.pricing.monthly)
                : servicePage.noMonthlyLabel}
            </p>
          </div>
        </div>

        {/* Pass-through costs are data on the service, not a note a component
            might forget to render. Stating them next to the price is the
            whole point of having them. */}
        {service.pricing.passThrough && (
          <p data-reveal="" className="mt-6 max-w-prose-tight text-label text-ink-subtle">
            {service.pricing.passThrough}
          </p>
        )}
      </Section>

      {faqs.length > 0 && (
        <Section tone="surface">
          <SectionHeading
            eyebrow={servicePage.faqEyebrow}
            heading={servicePage.faqHeading}
          />

          <FaqList items={faqs} />
        </Section>
      )}

      <Section tone={faqs.length > 0 ? "void" : "surface"} size="lg">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow reveal>{servicePage.closeEyebrow}</Eyebrow>
            <h2 data-reveal="" className="mt-5 text-h2 text-ink">
              {servicePage.closeHeading}
            </h2>
            <p data-reveal="" className="mt-6 max-w-prose-tight text-lead text-ink-muted">
              {servicePage.closeBody}
            </p>
            <div data-reveal="" className="mt-9">
              <ButtonLink href={site.primaryCta.href}>
                {site.primaryCta.label}
              </ButtonLink>
              <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
            </div>
          </div>

          <div
            data-reveal=""
            className="lift spotlight rounded-card border border-line bg-surface/40 p-7 lg:self-start"
          >
            <h3 className="text-eyebrow font-mono uppercase text-ink-subtle">
              {audit.isNotHeading}
            </h3>
            <ul className="mt-5 flex flex-col gap-3">
              {audit.isNot.map((item) => (
                <li key={item} className="flex gap-3 text-label text-ink-muted">
                  <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-alert" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
