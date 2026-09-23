import Link from "next/link";

import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";
import { caseStudies, launchedStatusLine } from "@/content/work";

const { work } = home;

/**
 * One case study, given the space a single case needs to actually land.
 *
 * The `launched` branch renders the status line and no results section. There
 * is no placeholder metric and no greyed-out example row — the type makes the
 * alternative impossible, and this is what that guarantee looks like on the
 * page.
 */
export function Work() {
  return (
    <Section id="work" tone="surface">
      <SectionHeading
        eyebrow={work.eyebrow}
        heading={work.heading}
        body={work.body}
      />

      <div className="mt-14 flex flex-col gap-8">
        {caseStudies.map((study) => (
          <article
            key={study.slug}
            className="lift overflow-hidden rounded-card border border-line bg-void/40"
          >
            <div className="grid gap-px bg-line lg:grid-cols-5">
              <div className="bg-void p-7 sm:p-9 lg:col-span-3">
                <p className="text-eyebrow font-mono uppercase text-ink-subtle">
                  {study.location}
                </p>

                <h3 className="mt-4 text-h2 text-ink">{study.client}</h3>

                <p className="mt-6 text-lead text-ink-muted">{study.problem}</p>

                <p className="mt-6 text-lead text-ink">{study.summary}</p>

                <Link
                  href={`/work/${study.slug}`}
                  className="mt-8 inline-block rounded-sm text-label font-medium text-signal underline underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:text-signal-dim"
                >
                  {work.viewAllLabel} →
                </Link>
              </div>

              <div className="bg-void p-7 sm:p-9 lg:col-span-2">
                <h4 className="text-eyebrow font-mono uppercase text-signal">
                  What was built
                </h4>

                <ul className="mt-5 flex flex-col gap-3">
                  {study.built.map((item) => (
                    <li key={item} className="flex gap-2.5 text-label text-ink-muted">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-px w-3 shrink-0 bg-signal"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                {study.status === "launched" && (
                  <p className="mt-8 border-t border-line pt-5 font-mono text-eyebrow uppercase text-ink-subtle">
                    {launchedStatusLine(study.launchedAt)}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
