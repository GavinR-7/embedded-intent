import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow, Section } from "@/components/ui/Section";
import { TraceGrid } from "@/components/ui/TraceGrid";
import { home } from "@/content/home";
import { site } from "@/content/site";

import { SystemPanel } from "@/components/ui/SystemPanel";
import { home as homeContent } from "@/content/home";

const { hero } = home;

/**
 * Server component. Only the system panel inside it is a client component, so
 * the hero's text and CTAs ship as HTML with no JavaScript attached — which is
 * what keeps the largest contentful paint cheap. (The LCP element on this page
 * is the subheading below, measured, not assumed.)
 *
 * The hero fills the viewport and distributes its content rather than stacking
 * it at the top: the main block grows to take the slack, and the trust line is
 * pushed to the bottom edge. Without that, everything bunched under the header
 * and left a dead gap above the next band.
 *
 * `min-h-svh`, not `min-h-screen`: `svh` is the *small* viewport height, the
 * one that excludes mobile browser chrome. `100vh` on a phone is taller than
 * what you can actually see, so a "full height" hero using it is always
 * slightly cut off.
 */
export function Hero() {
  return (
    <Section
      tone="void"
      size="lg"
      divider={false}
      bleedTop
      overlay={<TraceGrid />}
      className="flex min-h-svh flex-col"
      contentClassName="flex flex-1 flex-col"
    >
      <div className="grid flex-1 content-center gap-14 lg:grid-cols-2 lg:items-center lg:gap-16">
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
        </div>

        <SystemPanel
          title={homeContent.leadSystem.title}
          statusLabel={homeContent.leadSystem.statusLabel}
          rows={homeContent.leadSystem.rows}
          footerStat={{
            label: homeContent.leadSystem.footerLabel,
            value: homeContent.leadSystem.footerValue,
          }}
        />
      </div>

      {/* The trust line. A list rather than a sentence with separators, so a
          screen reader announces three claims and not one run-on.
          `mt-auto` pins it to the bottom of the viewport-height hero. */}
      <ul className="mt-auto flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:flex-wrap sm:gap-x-6">
        {site.trustPoints.map((point) => (
          <li key={point} className="text-label text-ink-subtle">
            {point}
          </li>
        ))}
      </ul>
    </Section>
  );
}
