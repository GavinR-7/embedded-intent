import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { audit } from "@/content/audit";
import { site } from "@/content/site";
import { caseStudies, launchedStatusLine } from "@/content/work";
import { workPage } from "@/content/workPage";

export const metadata: Metadata = {
  title: "Work",
  description: workPage.indexBody,
  alternates: { canonical: "/work" },
};

/**
 * The work index.
 *
 * One card today. The layout is a list rather than a grid on purpose — a
 * three-up grid holding one item reads as two things missing, and there is no
 * honest way to fill those slots yet.
 */
export default function WorkIndexPage() {
  return (
    <>
      <Section tone="void" size="lg" divider={false} bleedTop>
        <SectionHeading
          eyebrow={workPage.indexEyebrow}
          heading={workPage.indexHeading}
          body={workPage.indexBody}
        />
      </Section>

      <Section tone="surface">
        <ul className="flex flex-col gap-6">
          {caseStudies.map((study) => (
            <li key={study.slug}>
              <Link
                href={`/work/${study.slug}`}
                className="lift block rounded-card border border-line bg-void/40 p-7 sm:p-9"
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

          <div className="lift rounded-card border border-line bg-surface/40 p-7 lg:self-start">
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
