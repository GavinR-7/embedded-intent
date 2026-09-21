import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";
import { getService } from "@/content/services";

const { beforeAfter } = home;

/**
 * Four before/after pairs, pulled from the services themselves rather than
 * retyped here — so a pair on the homepage and the same pair on a service page
 * cannot drift apart.
 *
 * Both halves are scenes about the reader's own business, not claims about a
 * client. Nothing here is a measured result, so nothing here needs a source.
 */
export function BeforeAfter() {
  const pairs = beforeAfter.services
    .map((slug) => getService(slug))
    .filter((service) => service !== undefined);

  return (
    <Section id="what-changes">
      <SectionHeading eyebrow={beforeAfter.eyebrow} heading={beforeAfter.heading} />

      <div className="mt-14 flex flex-col gap-px overflow-hidden rounded-card bg-line">
        {pairs.map((service) => (
          <article key={service.slug} className="bg-void">
            <h3 className="px-7 pt-7 text-eyebrow font-mono uppercase text-ink-subtle">
              {service.name}
            </h3>

            {/* Stacked on mobile, two columns from md. The divider is a
                background gap, so it renders as a hairline in both directions
                without a border that has to change sides at the breakpoint. */}
            <div className="mt-5 grid gap-px bg-line md:grid-cols-2">
              <div className="bg-void p-7">
                <p className="text-eyebrow font-mono uppercase text-ink-subtle">Before</p>
                <p className="mt-4 text-lead text-ink-muted">{service.beforeAfter.before}</p>
              </div>

              <div className="bg-void p-7">
                <p className="text-eyebrow font-mono uppercase text-signal">After</p>
                <p className="mt-4 text-lead text-ink">{service.beforeAfter.after}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
