import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";
import { gridShape } from "@/lib/grid";

const { whatWeMeasure } = home;

const shape = gridShape(whatWeMeasure.outcomes.length);

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

      <ul
        className={`mt-12 grid gap-px overflow-hidden rounded-card bg-line ${shape.columns}`}
      >
        {whatWeMeasure.outcomes.map((outcome, index) => (
          <li
            key={outcome.name}
            data-reveal=""
            className={`lift spotlight bg-void p-7 ${
              index === whatWeMeasure.outcomes.length - 1 ? shape.lastItem : ""
            }`}
          >
            <h3 className="text-h3 text-ink">{outcome.name}</h3>
            <p className="mt-3 text-label text-ink-muted">{outcome.detail}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
