import { FaqList } from "@/components/ui/FaqList";
import { Section, SectionHeading } from "@/components/ui/Section";
import { faqs } from "@/content/faq";
import { home } from "@/content/home";

const { faq } = home;

/** The full question list. Service and category pages render subsets. */
export function Faq() {
  return (
    <Section id="faq" tone="void">
      <SectionHeading eyebrow={faq.eyebrow} heading={faq.heading} />
      <FaqList items={faqs} />
    </Section>
  );
}
