import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";
import { getService } from "@/content/services";

const { beforeAfter } = home;

/**
 * Four before/after pairs, pulled from the services themselves rather than
 * retyped here — so a pair on the homepage and the same pair on a service page
 * cannot drift apart.
 *
 * Each service carries three or four pairs; the homepage shows the first of
 * each, so four services give the four pairs this section wants. The full set
 * lives on the service page, which is where someone reading closely goes.
 *
 * Both halves are about the reader's own business, not claims about a client.
 * Nothing here is a measured result, so nothing here needs a source.
 */
export function BeforeAfter() {
  const pairs = beforeAfter.services
    .map((slug) => getService(slug))
    .filter((service) => service !== undefined);

  return (
    <Section id="what-changes" tone="surface">
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
                <p className="mt-4 text-lead text-ink-muted">
                  {service.beforeAfter[0].before}
                </p>
              </div>

              <div className="bg-void p-7">
                <p className="text-eyebrow font-mono uppercase text-signal">After</p>
                <p className="mt-4 text-lead text-ink">{service.beforeAfter[0].after}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
