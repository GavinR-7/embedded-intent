import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow, Section } from "@/components/ui/Section";
import { audit } from "@/content/audit";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { caseStudies, launchedStatusLine } from "@/content/work";

const { close } = home;

/**
 * The closing CTA.
 *
 * Carries the proof with it. A reader who has scrolled this far is deciding
 * now, and sending them back up the page — or off to /work — to check whether
 * the work is real is a decision they mostly will not make. So the most recent
 * build sits next to the button, in its honest "results tracking in progress"
 * state.
 */
export function Close() {
  const mostRecent = caseStudies[0];

  return (
    <Section id="close" tone="surface" size="lg">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow>{close.eyebrow}</Eyebrow>

          <h2 className="mt-5 text-h2 text-ink">{close.heading}</h2>

          <p className="mt-6 max-w-prose-tight text-lead text-ink-muted">{close.body}</p>

          <div className="mt-9">
            <ButtonLink href={site.primaryCta.href}>{site.primaryCta.label}</ButtonLink>
            <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* The anti-sell. Shared with the contact page in Phase 6 via
              content/audit.ts, so the promise cannot drift between them. */}
          <div className="rounded-card border border-line bg-void/40 p-7">
            <h3 className="text-eyebrow font-mono uppercase text-ink-subtle">
              {close.auditIsNotHeading}
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

          {/* Compact proof. Same data as the work section, same honest status. */}
          {mostRecent && (
            <Link
              href={`/work/${mostRecent.slug}`}
              className="group rounded-card border border-line bg-void/40 p-7 transition-colors duration-[var(--duration-base)] ease-precise hover:border-signal"
            >
              <h3 className="text-eyebrow font-mono uppercase text-signal">
                {close.proofHeading}
              </h3>

              <p className="mt-4 text-h3 text-ink">{mostRecent.client}</p>

              <p className="mt-1 text-label text-ink-subtle">{mostRecent.location}</p>

              <p className="mt-4 text-label text-ink-muted">{mostRecent.summary}</p>

              {mostRecent.status === "launched" && (
                <p className="mt-5 border-t border-line pt-4 font-mono text-eyebrow uppercase text-ink-subtle">
                  {launchedStatusLine(mostRecent.launchedAt)}
                </p>
              )}
            </Link>
          )}
        </div>
      </div>
    </Section>
  );
}
