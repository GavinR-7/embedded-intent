import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";
import { gridShape } from "@/lib/grid";

const { problem } = home;

// Five scenes today. The shape comes from the count so the fifth is never
// stranded alone on the last row — see lib/grid.ts.
const shape = gridShape(problem.symptoms.length);

export function Problem() {
  return (
    <Section id="problem" tone="surface">
      <SectionHeading
        eyebrow={problem.eyebrow}
        heading={problem.heading}
        body={problem.body}
      />

      {/*
        Scenes, not bullets. No icons and no bullet glyphs — each one is a
        sentence that should be read, and a bullet list invites skimming past
        exactly the line the reader recognizes themselves in.

        The left rule does the grouping work a bullet would, without turning
        five specific stories into a feature list.
      */}
      <ul
        className={`mt-14 grid gap-px overflow-hidden rounded-card border border-line ${shape.columns}`}
      >
        {problem.symptoms.map((symptom, index) => (
          <li
            key={symptom}
            data-reveal=""
            className={`hairline spotlight bg-void p-7 text-lead text-ink-muted ${
              index === problem.symptoms.length - 1 ? shape.lastItem : ""
            }`}
          >
            {symptom}
          </li>
        ))}
      </ul>
    </Section>
  );
}
