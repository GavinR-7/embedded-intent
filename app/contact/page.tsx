import type { Metadata } from "next";

import { AuditForm } from "@/components/contact/AuditForm";
import { Section } from "@/components/ui/Section";
import { TraceGrid } from "@/components/ui/TraceGrid";
import { audit } from "@/content/audit";
import { fillOwner, site } from "@/content/site";

export const metadata: Metadata = {
  title: audit.form.heading,
  description: audit.form.intro,
  alternates: { canonical: "/contact" },
};

/**
 * The audit request page.
 *
 * A form, not a booking widget. There is no scheduler anywhere on this site on
 * purpose: the research done between a submission arriving and the reply going
 * out *is* the product, and a calendar link would skip it.
 *
 * Server Component. Only the form itself is a client island.
 *
 * Layout: form first in the DOM, which is also the mobile order. On desktop
 * the cards sit to its right — form on the left, as specified — and because
 * the form comes first in source, nobody tabs through two cards to reach it.
 */
export default function ContactPage() {
  return (
    <Section tone="void" size="lg" divider={false} bleedTop overlay={<TraceGrid />}>
      <div className="max-w-prose-tight">
        <h1 className="text-h1 text-ink">{audit.form.heading}</h1>
        <p className="mt-6 text-lead text-ink-muted">{audit.form.intro}</p>
        <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-5 lg:gap-16">
        <div data-reveal="" className="lg:col-span-3">
          <AuditForm />
        </div>

        <div className="flex flex-col gap-5 lg:col-span-2">
          <div
            data-reveal=""
            className="lift spotlight rounded-card border border-line bg-surface/40 p-7"
          >
            <h2 className="text-eyebrow font-mono uppercase text-signal">
              {audit.contactHeading}
            </h2>

            {/* The site speaks as "we"; this card and the Why section are the
                two places it names the person, because that is the actual
                differentiator. */}
            <p className="mt-4 text-label text-ink">{fillOwner(audit.contactSub)}</p>

            <dl className="mt-5 flex flex-col gap-4">
              {/* Nullable in content/site.ts, so each channel renders only
                  once it is real — no dead links, no placeholder addresses. */}
              {site.phone && (
                <div>
                  <dt className="text-label text-ink-subtle">Phone</dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${site.phone.e164}`}
                      className="rounded-sm text-label text-ink transition-colors duration-[var(--duration-fast)] hover:text-signal"
                    >
                      {site.phone.display}
                    </a>
                  </dd>
                </div>
              )}

              {site.email && (
                <div>
                  <dt className="text-label text-ink-subtle">Email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${site.email}`}
                      className="rounded-sm text-label text-ink transition-colors duration-[var(--duration-fast)] hover:text-signal"
                    >
                      {site.email}
                    </a>
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-label text-ink-subtle">Hours</dt>
                <dd className="mt-1 text-label text-ink">{site.hours}</dd>
              </div>
            </dl>
          </div>

          {/* The anti-sell, shared with the homepage close and every service
              page via content/audit.ts. Nobody should arrive braced for a
              pitch. */}
          <div
            data-reveal=""
            className="lift spotlight rounded-card border border-line bg-surface/40 p-7"
          >
            <h2 className="text-eyebrow font-mono uppercase text-ink-subtle">
              {audit.isNotHeading}
            </h2>
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
