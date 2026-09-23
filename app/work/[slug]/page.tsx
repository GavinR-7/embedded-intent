import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { TraceGrid } from "@/components/ui/TraceGrid";
import { audit } from "@/content/audit";
import { site } from "@/content/site";
import { caseStudies, getCaseStudy, launchedStatusLine } from "@/content/work";
import { workPage } from "@/content/workPage";

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata(
  props: PageProps<"/work/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const study = getCaseStudy(slug);

  if (!study) return {};

  return {
    title: study.client,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
    openGraph: {
      title: `${study.client} — ${site.name}`,
      description: study.summary,
      url: `/work/${study.slug}`,
      type: "article",
    },
  };
}

export default async function CaseStudyPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const study = getCaseStudy(slug);

  if (!study) notFound();

  return (
    <>
      <Section tone="void" size="lg" divider={false} bleedTop overlay={<TraceGrid />}>
        <Link
          href="/work"
          className="rounded-sm text-label text-ink-subtle transition-colors duration-[var(--duration-fast)] hover:text-signal"
        >
          ← {workPage.backLabel}
        </Link>

        <div className="mt-8">
          <Eyebrow>{workPage.detailEyebrow}</Eyebrow>
          <h1 className="mt-6 text-h1 text-ink">{study.client}</h1>
          <p className="mt-4 text-label text-ink-subtle">{study.location}</p>
          <p className="mt-7 max-w-prose-tight text-lead text-ink-muted">
            {study.summary}
          </p>
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-3">
            <h2 className="text-eyebrow font-mono uppercase text-signal">
              {workPage.problemHeading}
            </h2>
            <p className="mt-6 text-lead text-ink-muted">{study.problem}</p>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-eyebrow font-mono uppercase text-signal">
              {workPage.builtHeading}
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {study.built.map((item) => (
                <li key={item} className="flex gap-3 text-label text-ink-muted">
                  <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-signal" />
                  {item}
                </li>
              ))}
            </ul>

            {/*
              The status line. For a `launched` entry this is the whole of what
              we say about outcomes — see the results section below for why
              there is nothing more.
            */}
            {study.status === "launched" && (
              <p className="mt-8 border-t border-line pt-5 font-mono text-eyebrow uppercase text-ink-subtle">
                {launchedStatusLine(study.launchedAt)}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/*
        ============================================================
        THE BRANCH THIS TYPE EXISTS FOR.

        `measured` renders the results table, with every metric's source shown
        beside it. `launched` renders NOTHING here — no placeholder metric, no
        sample number, no greyed-out example row, no "results coming soon"
        panel.

        This is not restraint on the part of whoever wrote this component. The
        `launched` variant of CaseStudy has no `results` field at all, so there
        is no number in scope to render. `study.results` below only compiles
        because the check above narrowed the union.
        ============================================================
      */}
      {study.status === "measured" && (
        <Section tone="void">
          <SectionHeading
            eyebrow={workPage.resultsEyebrow}
            heading={workPage.resultsHeading}
          />

          <table className="mt-12 w-full border-collapse text-left">
            <thead className="hidden md:table-header-group">
              <tr className="border-b border-line-interactive">
                <th
                  scope="col"
                  className="pb-4 pr-6 text-eyebrow font-mono uppercase text-ink-subtle"
                >
                  {workPage.metricLabel}
                </th>
                <th
                  scope="col"
                  className="pb-4 pr-6 text-eyebrow font-mono uppercase text-ink-subtle"
                >
                  {workPage.beforeLabel}
                </th>
                <th
                  scope="col"
                  className="pb-4 text-eyebrow font-mono uppercase text-signal"
                >
                  {workPage.afterLabel}
                </th>
              </tr>
            </thead>

            <tbody className="block md:table-row-group">
              {study.results.map((result) => (
                <tr
                  key={result.metric}
                  className="lift mb-4 block rounded-card border border-line p-6 last:mb-0 md:mb-0 md:table-row md:rounded-none md:border-0 md:border-b md:border-line md:p-0"
                >
                  <th
                    scope="row"
                    className="block text-left md:table-cell md:py-6 md:pr-6 md:align-top"
                  >
                    <span className="text-h3 text-ink md:text-body md:font-medium">
                      {result.metric}
                    </span>
                    {/* The source is not fine print. A number without it is
                        exactly what this whole design prevents. */}
                    <span className="mt-2 block max-w-md text-label font-normal text-ink-subtle">
                      {workPage.sourceLabel}: {result.source}
                    </span>
                  </th>

                  <td className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-4 md:mt-0 md:table-cell md:border-0 md:py-6 md:pr-6 md:align-top">
                    <span className="text-eyebrow font-mono uppercase text-ink-subtle md:hidden">
                      {workPage.beforeLabel}
                    </span>
                    <span className="font-mono text-h3 tabular-nums text-ink-muted">
                      {result.before}
                    </span>
                  </td>

                  <td className="mt-3 flex items-baseline justify-between gap-4 md:mt-0 md:table-cell md:py-6 md:align-top">
                    <span className="text-eyebrow font-mono uppercase text-signal md:hidden">
                      {workPage.afterLabel}
                    </span>
                    <span className="font-mono text-h3 tabular-nums text-signal">
                      {result.after}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Screenshots. Renders nothing while `images` is empty, which is the
          current state — see CONTENT_TODO.md. Real alt text comes from the
          data, never generated here. */}
      {study.images.length > 0 && (
        <Section tone="void">
          <ul className="grid gap-6 sm:grid-cols-2">
            {study.images.map((image) => (
              <li
                key={image.src}
                className="relative aspect-[4/3] overflow-hidden rounded-card border border-line"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Optional in the type, so a case study without one is not broken —
          and nobody is tempted to write a quote on the client's behalf. */}
      {study.testimonial && (
        <Section tone="surface">
          <figure className="max-w-3xl">
            <p className="text-eyebrow font-mono uppercase text-signal">
              {workPage.testimonialEyebrow}
            </p>
            <blockquote className="mt-6 text-h3 text-ink">
              “{study.testimonial.quote}”
            </blockquote>
            <figcaption className="mt-5 text-label text-ink-subtle">
              {study.testimonial.attribution}
            </figcaption>
          </figure>
        </Section>
      )}

      <Section tone="surface" size="lg">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>{workPage.closeEyebrow}</Eyebrow>
            <h2 className="mt-5 text-h2 text-ink">{workPage.closeHeading}</h2>
            <p className="mt-6 max-w-prose-tight text-lead text-ink-muted">
              {workPage.closeBody}
            </p>
            <div className="mt-9">
              <ButtonLink href={site.primaryCta.href}>{site.primaryCta.label}</ButtonLink>
              <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
            </div>
          </div>

          <div className="lift rounded-card border border-line bg-void/40 p-7 lg:self-start">
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
