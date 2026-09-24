import type { Metadata } from "next";
import Link from "next/link";

import { BeforeAfterTable } from "@/components/ui/BeforeAfterTable";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { FaqList } from "@/components/ui/FaqList";
import { IconTile } from "@/components/ui/icons";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { TraceGrid } from "@/components/ui/TraceGrid";
import { audit } from "@/content/audit";
import type { CategorySlug } from "@/content/categories";
import { categoryHref, getCategory } from "@/content/categories";
import { categoryPage } from "@/content/categoryPage";
import { faqsByIds } from "@/content/faq";
import { servicesByCategory } from "@/content/services";
import { site } from "@/content/site";
import { gridShape } from "@/lib/grid";

/**
 * One landing page per service category, at /websites, /get-found and
 * /ai-automation.
 *
 * All three routes render this. Each route file is four lines: a metadata
 * export and a call with its slug. Three literal route directories rather than
 * one `[category]` segment at the root, on purpose — a dynamic segment there
 * would sit alongside /work and /contact and try to match every unknown path
 * on the site, so a typo would render a category page shell instead of a 404.
 */

/** Shared by all three route files, so the tags cannot drift between them. */
export function categoryMetadata(slug: CategorySlug): Metadata {
  const category = getCategory(slug);

  return {
    title: category.label,
    description: category.sub,
    alternates: { canonical: categoryHref(slug) },
    openGraph: {
      title: `${category.heading} — ${site.name}`,
      description: category.sub,
      url: categoryHref(slug),
      type: "website",
    },
  };
}

export function CategoryPage({ slug }: { slug: CategorySlug }) {
  const category = getCategory(slug);
  const items = servicesByCategory(slug);
  const faqs = faqsByIds(category.faqIds);
  const symptomGrid = gridShape(category.symptoms.length);

  return (
    <>
      {/* Nothing in the hero reveals: the H1 is the largest paint on the page
          and has to be there on the first frame. */}
      <Section tone="void" size="lg" divider={false} bleedTop overlay={<TraceGrid />}>
        <div className="max-w-prose-tight">
          <Eyebrow>{category.eyebrow}</Eyebrow>

          <h1 className="mt-6 text-h1 text-ink">{category.heading}</h1>

          <p className="mt-7 text-lead text-ink-muted">{category.sub}</p>

          <div className="mt-9">
            <ButtonLink href={site.primaryCta.href}>{site.primaryCta.label}</ButtonLink>
            <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading
          eyebrow={categoryPage.symptomsEyebrow}
          heading={categoryPage.symptomsHeading}
        />

        <ul
          className={`mt-12 grid gap-px overflow-hidden rounded-card bg-line ${symptomGrid.columns}`}
        >
          {category.symptoms.map((symptom, index) => (
            <li
              key={symptom}
              data-reveal=""
              className={`lift spotlight bg-void p-7 text-lead text-ink-muted ${
                index === category.symptoms.length - 1 ? symptomGrid.lastItem : ""
              }`}
            >
              {symptom}
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="void">
        <SectionHeading
          eyebrow={categoryPage.servicesEyebrow}
          heading={categoryPage.servicesHeading}
          body={categoryPage.servicesNote}
        />

        {/* Rows, not cards. A category has three or four services and they are
            being compared against each other, which a vertical list does and a
            grid does not — and a single column cannot orphan its last item. */}
        <ul className="mt-12 grid gap-px overflow-hidden rounded-card bg-line">
          {items.map((service) => (
            <li key={service.slug} data-reveal="">
              <Link
                href={`/services/${service.slug}`}
                className="lift spotlight group flex items-center gap-5 bg-void p-6 sm:gap-6 sm:p-7"
              >
                <IconTile name={service.icon} />

                <span className="min-w-0 flex-1">
                  <span className="block text-h3 text-ink">{service.name}</span>
                  <span className="mt-2 block text-label text-ink-muted">
                    {service.promise}
                  </span>
                </span>

                <span className="hidden shrink-0 text-label text-ink-subtle transition-colors duration-[var(--duration-base)] group-hover:text-signal sm:block">
                  {categoryPage.serviceRowCta} →
                </span>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-ink-subtle transition-colors duration-[var(--duration-fast)] group-hover:text-signal sm:hidden"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="surface">
        <SectionHeading
          eyebrow={categoryPage.changeEyebrow}
          heading={categoryPage.changeHeading}
        />

        <BeforeAfterTable
          pairs={category.beforeAfter}
          beforeLabel={categoryPage.beforeLabel}
          afterLabel={categoryPage.afterLabel}
        />
      </Section>

      <Section tone="void">
        <SectionHeading
          eyebrow={categoryPage.faqEyebrow}
          heading={categoryPage.faqHeading}
        />

        <FaqList items={faqs} />
      </Section>

      <Section tone="surface" size="lg">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow reveal>{categoryPage.closeEyebrow}</Eyebrow>
            <h2 data-reveal="" className="mt-5 text-h2 text-ink">
              {categoryPage.closeHeading}
            </h2>
            <p data-reveal="" className="mt-6 max-w-prose-tight text-lead text-ink-muted">
              {categoryPage.closeBody}
            </p>
            <div data-reveal="" className="mt-9">
              <ButtonLink href={site.primaryCta.href}>{site.primaryCta.label}</ButtonLink>
              <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
            </div>
          </div>

          {/* The anti-sell, shared with the homepage close, every service page
              and the contact page via content/audit.ts. */}
          <div
            data-reveal=""
            className="lift spotlight rounded-card border border-line bg-void/40 p-7 lg:self-start"
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
