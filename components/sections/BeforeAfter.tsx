import { BeforeAfterTable } from "@/components/ui/BeforeAfterTable";
import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";

const { beforeAfter } = home;

/**
 * Where AI plugs in — four pairs, homepage-specific.
 *
 * These used to be pulled from four services' own pairs. They are written in
 * content/home.ts now because the question this section answers — where does AI
 * touch my business at all — is not one any single service answers. Service and
 * category pages keep their own pairs.
 *
 * Both halves are about the reader's own business, not claims about a client.
 * Nothing here is a measured result, so nothing here needs a source.
 */
export function BeforeAfter() {
  return (
    <Section id="what-changes" tone="surface">
      <SectionHeading eyebrow={beforeAfter.eyebrow} heading={beforeAfter.heading} />

      <BeforeAfterTable pairs={beforeAfter.pairs} beforeLabel="Before" afterLabel="After" />
    </Section>
  );
}
