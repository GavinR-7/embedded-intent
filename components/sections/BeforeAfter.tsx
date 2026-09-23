import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";

const { beforeAfter } = home;

/**
 * Where AI plugs in — four pairs, homepage-specific.
 *
 * These used to be pulled from four services' own pairs. They are written here
 * now because the question this section answers — where does AI touch my
 * business at all — is not one any single service answers. Service pages keep
 * their own service-specific pairs.
 *
 * Both halves are about the reader's own business, not claims about a client.
 * Nothing here is a measured result, so nothing here needs a source.
 */
export function BeforeAfter() {
  return (
    <Section id="what-changes" tone="surface">
      <SectionHeading eyebrow={beforeAfter.eyebrow} heading={beforeAfter.heading} />

      <div className="mt-12 hidden gap-px md:grid md:grid-cols-2">
        <p className="text-eyebrow font-mono uppercase text-ink-subtle">Before</p>
        <p className="text-eyebrow font-mono uppercase text-signal">After</p>
      </div>

      <div className="mt-4 grid gap-px overflow-hidden rounded-card bg-line">
        {beforeAfter.pairs.map((pair) => (
          <div key={pair.before} className="grid gap-px bg-line md:grid-cols-2">
            <div className="lift bg-void p-6 sm:p-7">
              <p className="text-eyebrow font-mono uppercase text-ink-subtle md:hidden">
                Before
              </p>
              <p className="mt-3 text-lead text-ink-muted md:mt-0">{pair.before}</p>
            </div>
            <div className="lift bg-void p-6 sm:p-7">
              <p className="text-eyebrow font-mono uppercase text-signal md:hidden">After</p>
              <p className="mt-3 text-lead text-ink md:mt-0">{pair.after}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
