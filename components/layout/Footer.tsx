import Link from "next/link";

import { services } from "@/content/services";
import { site } from "@/content/site";

export function Footer() {
  // Evaluated when the page is rendered. These pages are statically generated,
  // so in production this is the build date — it updates on every deploy.
  const year = new Date().getFullYear();

  // Contact channels are nullable in content/site.ts until they are real, so
  // the footer renders whichever of them exist and says nothing about the rest.
  const hasContact = site.email !== null || site.phone !== null;

  return (
    <footer className="border-t border-line bg-void">
      <div className="mx-auto max-w-content px-gutter py-16">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="rounded-sm text-[0.9375rem] font-semibold tracking-tight text-ink">
              {site.name}
            </Link>
            <p className="mt-3 text-label text-ink-muted">{site.tagline}.</p>
            <p className="mt-4 text-eyebrow font-mono uppercase text-ink-subtle">{site.serviceArea}</p>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
            {/* Generated from the catalogue rather than listed in site.ts —
                a second hand-maintained list of services is a second list to
                forget to update. */}
            <nav aria-label={site.footerServicesHeading}>
              <h2 className="text-eyebrow font-mono uppercase text-ink-subtle">
                {site.footerServicesHeading}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {services.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/services/${service.slug}`}
                      className="rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-signal"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {site.footerColumns.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <h2 className="text-eyebrow font-mono uppercase text-ink-subtle">{column.heading}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-signal"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <div>
              <h2 className="text-eyebrow font-mono uppercase text-ink-subtle">Start here</h2>
              <ul className="mt-4 flex flex-col gap-3">
                <li>
                  <Link
                    href={site.primaryCta.href}
                    className="rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-signal"
                  >
                    {site.primaryCta.label}
                  </Link>
                </li>
                {hasContact && (
                  <>
                    {site.email !== null && (
                      <li>
                        <a
                          href={`mailto:${site.email}`}
                          className="rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-signal"
                        >
                          {site.email}
                        </a>
                      </li>
                    )}
                    {site.phone !== null && (
                      <li>
                        <a
                          href={`tel:${site.phone.e164}`}
                          className="rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-signal"
                        >
                          {site.phone.display}
                        </a>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        <ul className="mt-14 flex flex-col gap-2 border-t border-line pt-8 sm:flex-row sm:flex-wrap sm:gap-x-6">
          {site.trustPoints.map((point) => (
            <li key={point} className="text-label text-ink-subtle">
              {point}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-eyebrow font-mono uppercase text-ink-subtle">
            © {year} {site.name}
          </p>

          {site.social.length > 0 && (
            <ul className="flex gap-5">
              {site.social.map((profile) => (
                <li key={profile.href}>
                  <a
                    href={profile.href}
                    rel="me noopener noreferrer"
                    target="_blank"
                    className="rounded-sm text-label text-ink-subtle transition-colors duration-[var(--duration-fast)] hover:text-signal"
                  >
                    {profile.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
