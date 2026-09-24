import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow, Section } from "@/components/ui/Section";
import { audit } from "@/content/audit";
import { home } from "@/content/home";
import { site } from "@/content/site";

const { close } = home;

/**
 * The closing CTA.
 *
 * The case study that used to sit beside this CTA has been removed along with
 * the homepage work section: case studies live on /work, reached through
 * Company. One live client is not a proof strip, and a strip of one reads as
 * two missing. See CONTENT_TODO.md for when it comes back.
 */
export function Close() {
  return (
    <Section id="close" tone="surface" size="lg">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow reveal>{close.eyebrow}</Eyebrow>

          <h2 data-reveal="" className="mt-5 text-h2 text-ink">
            {close.heading}
          </h2>

          <p data-reveal="" className="mt-6 max-w-prose-tight text-lead text-ink-muted">
            {close.body}
          </p>

          <div data-reveal="" className="mt-9">
            <ButtonLink href={site.primaryCta.href}>{site.primaryCta.label}</ButtonLink>
            <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* The anti-sell. Shared with the contact page in Phase 6 via
              content/audit.ts, so the promise cannot drift between them. */}
          <div
            data-reveal=""
            className="lift spotlight rounded-card border border-line bg-void/40 p-7"
          >
            <h3 className="text-eyebrow font-mono uppercase text-ink-subtle">
              {audit.isNotHeading}
            </h3>

            <ul className="mt-5 flex flex-col gap-3">
              {audit.isNot.map((item) => (
                <li key={item} className="flex gap-3 text-label text-ink-muted">
                  <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-alert" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </Section>
  );
}
