import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";

const { howItWorks } = home;

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="void">
      <SectionHeading eyebrow={howItWorks.eyebrow} heading={howItWorks.heading} />

      <ol className="mt-14 grid gap-px overflow-hidden rounded-card bg-line md:grid-cols-2 lg:grid-cols-4">
        {howItWorks.steps.map((step, index) => (
          <li key={step.id} className="flex flex-col bg-void p-7">
            {/* The number is decorative — the ordered list already conveys
                sequence to assistive tech, so repeating it as text would just
                make a screen reader say "one" twice. */}
            <span
              aria-hidden="true"
              className="font-mono text-eyebrow tabular-nums text-signal"
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            <h3 className="mt-4 text-h3 text-ink">{step.name}</h3>

            <p className="mt-3 text-label text-ink-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
