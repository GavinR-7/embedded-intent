import { ScrollStepper } from "@/components/motion/ScrollStepper";
import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";

const { howItWorks } = home;

/**
 * Server component. The four steps are passed to the client stepper as props
 * rather than imported by it, so the copy ships in the HTML and the RSC payload
 * but never in the JavaScript bundle — importing `content/home` from a client
 * component would put every word of it there.
 */
export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="void">
      <SectionHeading eyebrow={howItWorks.eyebrow} heading={howItWorks.heading} />
      <ScrollStepper steps={howItWorks.steps} />
    </Section>
  );
}
