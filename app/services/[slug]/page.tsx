import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { SystemPanel } from "@/components/ui/SystemPanel";
import { TraceGrid } from "@/components/ui/TraceGrid";
import { audit } from "@/content/audit";
import { faqsForService } from "@/content/faq";
import {
  formatMonthly,
  formatPriceBand,
  getService,
  services,
} from "@/content/services";
import { servicePage } from "@/content/servicePage";
import { site } from "@/content/site";

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

  return (
    <>
      <Section tone="void" size="lg" divider={false} bleedTop overlay={<TraceGrid />}>
        <Link
          href="/#what-we-build"
          className="rounded-sm text-label text-ink-subtle transition-colors duration-[var(--duration-fast)] hover:text-signal"
        >
          ← {servicePage.backLabel}
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

            <dl className="mt-5 grid gap-px overflow-hidden rounded-card bg-line">
              <div className="bg-void p-6">
                <dt className="text-eyebrow font-mono uppercase text-signal">
                  {servicePage.forWhomHeading}
                </dt>
                <dd className="mt-3 text-label text-ink-muted">{service.forWhom}</dd>
              </div>
              <div className="bg-void p-6">
                <dt className="text-eyebrow font-mono uppercase text-signal">
                  {servicePage.timelineHeading}
                </dt>
                <dd className="mt-3 text-label text-ink-muted">{service.timeline}</dd>
              </div>
              <div className="bg-void p-6">
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

        <ul className="mt-12 grid gap-px overflow-hidden rounded-card bg-line sm:grid-cols-2">
          {service.symptoms.map((symptom) => (
            <li key={symptom} className="lift bg-void p-7 text-lead text-ink-muted">
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

        <ul className="mt-12 grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {service.includes.map((item) => (
            <li key={item} className="flex gap-3 text-lead text-ink-muted">
              <span aria-hidden="true" className="mt-3.5 h-px w-4 shrink-0 bg-signal" />
              {item}
            </li>
          ))}
        </ul>

        {service.notThis && (
          <div className="mt-12 rounded-card border border-line bg-surface/40 p-7">
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

        {/* Column labels once at the top rather than repeated on every row —
            on mobile the rows stack, so each half carries its own label there
            and the header row is hidden. */}
        <div className="mt-12 hidden gap-px md:grid md:grid-cols-2">
          <p className="text-eyebrow font-mono uppercase text-ink-subtle">
            {servicePage.beforeLabel}
          </p>
          <p className="text-eyebrow font-mono uppercase text-signal">
            {servicePage.afterLabel}
          </p>
        </div>

        <div className="mt-4 grid gap-px overflow-hidden rounded-card bg-line">
          {service.beforeAfter.map((pair) => (
            <div key={pair.before} className="grid gap-px bg-line md:grid-cols-2">
              <div className="lift bg-void p-6 sm:p-7">
                <p className="text-eyebrow font-mono uppercase text-ink-subtle md:hidden">
                  {servicePage.beforeLabel}
                </p>
                <p className="mt-3 text-lead text-ink-muted md:mt-0">{pair.before}</p>
              </div>
              <div className="lift bg-void p-6 sm:p-7">
                <p className="text-eyebrow font-mono uppercase text-signal md:hidden">
                  {servicePage.afterLabel}
                </p>
                <p className="mt-3 text-lead text-ink md:mt-0">{pair.after}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="void">
        <SectionHeading
          eyebrow={servicePage.pricingEyebrow}
          heading={servicePage.pricingHeading}
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-card bg-line sm:grid-cols-2">
          <div className="bg-void p-7 sm:p-9">
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

          <div className="bg-void p-7 sm:p-9">
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
          <p className="mt-6 max-w-prose-tight text-label text-ink-subtle">
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

          <div className="mt-12 border-t border-line">
            {faqs.map((item) => (
              <details key={item.id} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lead text-ink transition-colors duration-[var(--duration-fast)] hover:text-signal [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span aria-hidden="true" className="relative h-4 w-4 shrink-0 text-signal">
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
      )}

      <Section tone={faqs.length > 0 ? "void" : "surface"} size="lg">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>{servicePage.closeEyebrow}</Eyebrow>
            <h2 className="mt-5 text-h2 text-ink">{servicePage.closeHeading}</h2>
            <p className="mt-6 max-w-prose-tight text-lead text-ink-muted">
              {servicePage.closeBody}
            </p>
            <div className="mt-9">
              <ButtonLink href={site.primaryCta.href}>
                {site.primaryCta.label}
              </ButtonLink>
              <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
            </div>
          </div>

          <div className="rounded-card border border-line bg-surface/40 p-7 lg:self-start">
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
