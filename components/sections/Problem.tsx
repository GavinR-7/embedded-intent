import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";

const { problem } = home;

export function Problem() {
  return (
    <Section id="problem">
      <SectionHeading
        eyebrow={problem.eyebrow}
        heading={problem.heading}
        body={problem.body}
      />

      {/*
        Scenes, not bullets. No icons and no bullet glyphs — each one is a
        sentence that should be read, and a bullet list invites skimming past
        exactly the line the reader recognises themselves in.

        The left rule does the grouping work a bullet would, without turning
        five specific stories into a feature list.
      */}
      <ul className="mt-14 grid gap-px overflow-hidden rounded-card bg-line sm:grid-cols-2">
        {problem.symptoms.map((symptom) => (
          <li
            key={symptom}
            className="bg-void p-7 text-lead text-ink-muted last:sm:col-span-2"
          >
            {symptom}
          </li>
        ))}
      </ul>
    </Section>
  );
}
