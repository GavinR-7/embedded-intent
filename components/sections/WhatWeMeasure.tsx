import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";

const { whatWeMeasure } = home;

/**
 * What gets reported every month.
 *
 * Deliberately contains no numbers. These are the things we track, not claims
 * about what they will be — the moment a figure appears here it becomes a
 * performance claim with no client and no source behind it, which is the exact
 * failure mode content/work.ts exists to prevent.
 */
export function WhatWeMeasure() {
  return (
    <Section id="what-we-measure" tone="void">
      <SectionHeading
        eyebrow={whatWeMeasure.eyebrow}
        heading={whatWeMeasure.heading}
        body={whatWeMeasure.body}
      />

      <ul className="mt-12 grid gap-px overflow-hidden rounded-card bg-line sm:grid-cols-2 lg:grid-cols-3">
        {whatWeMeasure.outcomes.map((outcome) => (
          <li key={outcome.name} className="lift bg-void p-7">
            <h3 className="text-h3 text-ink">{outcome.name}</h3>
            <p className="mt-3 text-label text-ink-muted">{outcome.detail}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
