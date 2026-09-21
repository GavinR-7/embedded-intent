import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow } from "@/components/ui/Section";
import { home } from "@/content/home";
import { site } from "@/content/site";

import { LeadSystemPanel } from "./LeadSystemPanel";

const { hero } = home;

/**
 * Server component. Only the animated chain inside it is a client component,
 * so the hero's text and CTAs ship as HTML with no JavaScript attached — which
 * is what keeps the largest contentful paint cheap.
 */
export function Hero() {
  return (
    <section className="pt-16 pb-section sm:pt-24">
      <div className="mx-auto max-w-content px-gutter">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <Eyebrow>{hero.eyebrow}</Eyebrow>

            <h1 className="mt-6 text-h1 text-ink">{hero.heading}</h1>

            <p className="mt-7 max-w-prose-tight text-lead text-ink-muted">
              {hero.subheading}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={site.primaryCta.href}>{site.primaryCta.label}</ButtonLink>
              <ButtonLink href={hero.secondaryCta.href} variant="secondary">
                {hero.secondaryCta.label}
              </ButtonLink>
            </div>

            <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>

            {/* The trust line. A list rather than a sentence with separators,
                so a screen reader announces three claims and not one run-on. */}
            <ul className="mt-10 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {site.trustPoints.map((point) => (
                <li key={point} className="text-label text-ink-subtle">
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <LeadSystemPanel />
        </div>
      </div>
    </section>
  );
}
