import Link from "next/link";

import { categories, categoryHref } from "@/content/categories";
import { servicesByCategory } from "@/content/services";
import { site } from "@/content/site";

/**
 * The footer, and the second place the whole catalogue is navigable.
 *
 * The services are grouped by category and each heading links to that
 * category's page, which mirrors the nav exactly — and, like the nav, is
 * generated from content/categories.ts and content/services.ts rather than
 * listed here. A second hand-maintained list of services is a second list to
 * forget to update.
 *
 * Its columns stagger as they arrive, like every other band's contents — the
 * runtime works out which elements arrived together rather than being told where
 * the groups are. See components/motion/MotionRuntime.tsx.
 */
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
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-16">
          <div data-reveal="" className="max-w-xs">
            <Link
              href="/"
              className="tap-target rounded-sm text-[0.9375rem] font-semibold tracking-tight text-ink"
            >
              {site.name}
            </Link>
            <p className="mt-3 text-label text-ink-muted">{site.tagline}.</p>
            <p className="mt-4 text-eyebrow font-mono uppercase text-ink-subtle">
              {site.serviceArea}
            </p>
          </div>

          {/* Five columns. Two of the three widths do not divide five, so the
              last one stretches across the remainder rather than sitting alone
              beside an empty cell — the same rule lib/grid.ts applies to card
              grids, written out here because this grid's item count is fixed by
              its markup rather than by a list length. */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-12">
            {categories.map((category) => (
              <nav key={category.slug} data-reveal="" aria-label={category.label}>
                <h2 className="text-eyebrow font-mono uppercase text-ink-subtle">
                  <Link
                    href={categoryHref(category.slug)}
                    className="tap-target rounded-sm transition-colors duration-[var(--duration-fast)] hover:text-signal"
                  >
                    {category.label}
                  </Link>
                </h2>
                <ul className="mt-4 flex flex-col gap-3 max-sm:mt-1 max-sm:gap-0">
                  {servicesByCategory(category.slug).map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={`/services/${service.slug}`}
                        className="tap-target rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-signal"
                      >
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {site.footerColumns.map((column) => (
              <nav key={column.heading} data-reveal="" aria-label={column.heading}>
                <h2 className="text-eyebrow font-mono uppercase text-ink-subtle">
                  {column.heading}
                </h2>
                <ul className="mt-4 flex flex-col gap-3 max-sm:mt-1 max-sm:gap-0">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="tap-target rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-signal"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <div data-reveal="" className="col-span-2 lg:col-span-1">
              <h2 className="text-eyebrow font-mono uppercase text-ink-subtle">
                Start here
              </h2>
              <ul className="mt-4 flex flex-col gap-3 max-sm:mt-1 max-sm:gap-0">
                <li>
                  <Link
                    href={site.primaryCta.href}
                    className="tap-target rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-signal"
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
                          className="tap-target rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-signal"
                        >
                          {site.email}
                        </a>
                      </li>
                    )}
                    {site.phone !== null && (
                      <li>
                        <a
                          href={`tel:${site.phone.e164}`}
                          className="tap-target rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-signal"
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
          {/* Copyright and the small print on one line: the legal pages are
              reference material, so they sit with the year rather than in a
              column of things someone is meant to read. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <p className="text-eyebrow font-mono uppercase text-ink-subtle">
              © {year} {site.name}
            </p>

            <ul className="flex flex-wrap items-center gap-x-6 max-sm:gap-y-0">
              {site.legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="tap-target rounded-sm text-eyebrow font-mono uppercase text-ink-subtle transition-colors duration-[var(--duration-fast)] hover:text-signal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {site.social.length > 0 && (
            <ul className="flex gap-5">
              {site.social.map((profile) => (
                <li key={profile.href}>
                  <a
                    href={profile.href}
                    rel="me noopener noreferrer"
                    target="_blank"
                    className="tap-target rounded-sm text-label text-ink-subtle transition-colors duration-[var(--duration-fast)] hover:text-signal"
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
