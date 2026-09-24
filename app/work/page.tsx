import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow, Section } from "@/components/ui/Section";
import { TraceGrid } from "@/components/ui/TraceGrid";
import { audit } from "@/content/audit";
import { site } from "@/content/site";
import { caseStudies, launchedStatusLine } from "@/content/work";
import { workPage } from "@/content/workPage";
import { gridShape } from "@/lib/grid";

export const metadata: Metadata = {
  title: "Work",
  description: workPage.indexBody,
  alternates: { canonical: "/work" },
};

/**
 * The work index.
 *
 * Scales from one entry to many without anyone editing this file.
 *
 * A single entry renders full-width; two or more flow into a responsive grid.
 * That is one `grid-cols` decision driven by `caseStudies.length`, not a
 * special case — and crucially there are no placeholder or "coming soon"
 * slots, so a short list looks deliberate rather than unfinished.
 */
export default function WorkIndexPage() {
  const shape = gridShape(caseStudies.length);

  return (
    <>
      {/*
        Written out rather than using SectionHeading, which renders an <h2>.
        This is the top of a page, so its heading is the page's <h1> — the work
        index had no h1 at all until Phase 7, which is a heading-order defect
        as well as an SEO one. Nothing here reveals: it is the hero, and the h1
        is the largest paint on the page.
      */}
      <Section tone="void" size="lg" divider={false} bleedTop overlay={<TraceGrid />}>
        <div className="max-w-prose-tight">
          <Eyebrow>{workPage.indexEyebrow}</Eyebrow>
          <h1 className="mt-5 text-h1 text-ink">{workPage.indexHeading}</h1>
          <p className="mt-6 text-lead text-ink-muted">{workPage.indexBody}</p>
        </div>
      </Section>

      <Section tone="surface">
        {/*
          One entry renders full-width; two or more flow into a shape chosen
          from the count, so the last card is never stranded alone on its own
          row. No placeholder or "coming soon" slots either way — a short list
          should look deliberate, not unfinished.
        */}
        <ul className={`grid gap-6 ${shape.columns}`}>
          {caseStudies.map((study, index) => (
            <li
              key={study.slug}
              data-reveal=""
              className={index === caseStudies.length - 1 ? shape.lastItem : ""}
            >
              <Link
                href={`/work/${study.slug}`}
                className="lift spotlight block h-full rounded-card border border-line bg-void/40 p-7 sm:p-9"
              >
                <p className="text-eyebrow font-mono uppercase text-ink-subtle">
                  {study.location}
                </p>

                <h2 className="mt-4 text-h2 text-ink">{study.client}</h2>

                <p className="mt-5 max-w-prose-tight text-lead text-ink-muted">
                  {study.summary}
                </p>

                {/*
                  Branching on status is the whole point of the union. A
                  `launched` entry has no `results` field to read, so there is
                  no placeholder number available to render even by accident.
                */}
                <p className="mt-7 border-t border-line pt-5 font-mono text-eyebrow uppercase text-ink-subtle">
                  {study.status === "launched"
                    ? launchedStatusLine(study.launchedAt)
                    : `${study.results.length} measured ${
                        study.results.length === 1 ? "result" : "results"
                      }`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="void" size="lg">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow reveal>{workPage.closeEyebrow}</Eyebrow>
            <h2 data-reveal="" className="mt-5 text-h2 text-ink">
              {workPage.closeHeading}
            </h2>
            <p data-reveal="" className="mt-6 max-w-prose-tight text-lead text-ink-muted">
              {workPage.closeBody}
            </p>
            <div data-reveal="" className="mt-9">
              <ButtonLink href={site.primaryCta.href}>{site.primaryCta.label}</ButtonLink>
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
