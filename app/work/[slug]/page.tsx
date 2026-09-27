import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeviceFrame } from "@/components/work/DeviceFrame";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { HeroTexture } from "@/components/ui/HeroTexture";
import { audit } from "@/content/audit";
import { site } from "@/content/site";
import { caseStudies, getCaseStudy, launchedStatusLine } from "@/content/work";
import { workPage } from "@/content/workPage";
import { pageMetadata } from "@/lib/seo";

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

  return pageMetadata({
    title: study.client,
    description: study.summary,
    path: `/work/${study.slug}`,
    // A case study is a piece of writing about one engagement, not a section of
    // the site — the one route here where `article` is the honest type.
    type: "article",
  });
}

export default async function CaseStudyPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const study = getCaseStudy(slug);

  if (!study) notFound();

  return (
    <>
      <Section tone="void" size="hero" divider={false} bleedTop overlay={<HeroTexture />}>
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

          {/*
            The single most persuasive thing this page has is the site itself,
            working, on the reader's own phone — so it is offered high, before
            any of our description of it, and again at the bottom.

            `rel="noopener"` with `target="_blank"`: without it the opened tab
            gets a `window.opener` handle back to this one and can navigate it.
            `noreferrer` is deliberately NOT set — this is a client we want to
            send identifiable traffic to, and stripping the referrer would hide
            that from their analytics.
          */}
          <p className="mt-9">
            <a
              href={study.liveUrl}
              target="_blank"
              rel="noopener"
              className="cta-sheen lift group inline-flex items-center gap-2 rounded-field border border-signal/40 px-5 py-3 text-label font-medium text-signal transition-colors duration-[var(--duration-fast)] hover:border-signal"
            >
              {workPage.liveLabel}
              <span
                aria-hidden="true"
                className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
              >
                →
              </span>
            </a>
          </p>
          <p className="mt-3 text-label text-ink-subtle">{workPage.liveNote}</p>
        </div>
      </Section>

      {/*
        The captures, high on the page and framed as the devices they were taken
        on: one browser window full width, then the two phones side by side.
        Above the prose, because "mobile-first rebuild" is a thing to be shown.
      */}
      {study.images.length > 0 && (
        <Section tone="void">
          <SectionHeading
            eyebrow={workPage.shotsEyebrow}
            heading={workPage.shotsHeading}
          />

          <div className="mt-12 flex flex-col gap-10">
            {study.images
              .filter((image) => image.frame === "browser")
              .map((image) => (
                <div key={image.src} data-reveal="">
                  <DeviceFrame image={image} priority sizes="(min-width: 1024px) 75rem, 100vw" />
                </div>
              ))}

            {/* Two phones, side by side from `sm`. A phone frame at full width
                on a desktop is a very tall picture of very little. */}
            <div className="grid gap-8 sm:grid-cols-2">
              {study.images
                .filter((image) => image.frame === "phone")
                .map((image) => (
                  <div key={image.src} data-reveal="">
                    <DeviceFrame image={image} sizes="(min-width: 640px) 17rem, 80vw" />
                  </div>
                ))}
            </div>
          </div>
        </Section>
      )}

      <Section tone="surface">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div data-reveal="" className="lg:col-span-3">
            <h2 className="text-eyebrow font-mono uppercase text-signal">
              {workPage.problemHeading}
            </h2>
            <p className="mt-6 text-lead text-ink-muted">{study.problem}</p>
          </div>

          <div data-reveal="" className="lg:col-span-2">
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
        What changed about the SITE. Not what it did for the business.

        The distinction is enforced one level down: `changed` lives on
        CaseStudyBase and is available to every entry, while `results` exists
        only on the `measured` variant. So a case study can describe what was
        built on the day it launches, and still has nothing to say about
        outcomes until somebody has measured them.
      */}
      {study.changed.length > 0 && (
        <Section tone="void">
          <SectionHeading
            eyebrow={workPage.changedEyebrow}
            heading={workPage.changedHeading}
            body={workPage.changedNote}
          />

          <ul className="mt-12 grid gap-px overflow-hidden rounded-card border border-line">
            {study.changed.map((pair) => (
              <li
                key={pair.after}
                data-reveal=""
                className="hairline grid gap-4 bg-void p-6 sm:grid-cols-2 sm:gap-8 sm:p-7"
              >
                <div>
                  <p className="text-eyebrow font-mono uppercase text-ink-subtle">
                    {workPage.changedBeforeLabel}
                  </p>
                  <p className="mt-3 text-label text-ink-muted">{pair.before}</p>
                </div>
                <div>
                  <p className="text-eyebrow font-mono uppercase text-signal">
                    {workPage.changedAfterLabel}
                  </p>
                  <p className="mt-3 text-lead text-ink">{pair.after}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

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
                  data-reveal=""
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

      {/* The live site again, at the bottom, where someone who has read the whole
          page is deciding what to do next. The same link as the hero — not a
          second URL to keep in step, because both read `study.liveUrl`. */}
      <Section tone="void">
        <div className="flex flex-col items-start gap-5 rounded-card border border-line bg-surface/40 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <p className="text-h3 text-ink">{study.client}</p>
            <p className="mt-2 text-label text-ink-subtle">{workPage.liveNote}</p>
          </div>

          <a
            href={study.liveUrl}
            target="_blank"
            rel="noopener"
            className="cta-sheen lift group inline-flex shrink-0 items-center gap-2 rounded-field border border-signal/40 px-5 py-3 text-label font-medium text-signal transition-colors duration-[var(--duration-fast)] hover:border-signal"
          >
            {workPage.liveLabel}
            <span
              aria-hidden="true"
              className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
            >
              →
            </span>
          </a>
        </div>
      </Section>

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
