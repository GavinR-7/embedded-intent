import Link from "next/link";

import { IconTile } from "@/components/ui/icons";
import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";
import { primaryService, serviceCategories, servicesByCategory } from "@/content/services";
import type { Service } from "@/content/services";

const { whatWeBuild } = home;

function serviceHref(service: Service) {
  return `/services/${service.slug}`;
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-ink-subtle transition-colors duration-[var(--duration-fast)] group-hover:text-signal sm:hidden"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/**
 * The catalogue, grouped by the same `category` field the nav mega menu reads.
 *
 * A flat grid of ten add-ons left the last card alone on its own row and gave
 * a reader no way to tell which ones solve the same problem. Grouping is not
 * decoration here — "I need to be found" and "I need to answer faster" are
 * different problems, and the labels are how someone finds their own.
 *
 * One markup, two shapes: compact rows on mobile (icon, name, tagline,
 * chevron) and cards from `sm` up. The card treatment on a phone is what made
 * this page run to nearly 14,000px.
 */
function ServiceItem({ service }: { service: Service }) {
  return (
    <Link
      href={serviceHref(service)}
      className="lift group flex items-center gap-4 rounded-card border border-line bg-surface/50 p-4 sm:h-full sm:flex-col sm:items-stretch sm:p-6"
    >
      <IconTile name={service.icon} />

      <span className="min-w-0 flex-1 sm:mt-4 sm:flex sm:flex-1 sm:flex-col">
        <span className="block text-label font-medium text-ink sm:text-h3 sm:font-semibold">
          {service.name}
        </span>
        <span className="mt-1 block text-label text-ink-subtle sm:flex-1 sm:text-ink-muted">
          {service.promise}
        </span>

        {/* The divider and CTA are desktop-only; on a phone the whole row is
            the target and a chevron says so in a fraction of the height. */}
        <span className="mt-6 hidden border-t border-line pt-4 text-label text-ink-subtle transition-colors duration-[var(--duration-base)] group-hover:text-signal sm:block">
          {whatWeBuild.addOnCardCta} →
        </span>
      </span>

      <Chevron />
    </Link>
  );
}

export function WhatWeBuild() {
  return (
    <Section id="what-we-build" tone="void">
      <SectionHeading
        eyebrow={whatWeBuild.eyebrow}
        heading={whatWeBuild.heading}
        body={whatWeBuild.body}
      />

      <p className="mt-6 text-label text-ink-subtle">{whatWeBuild.pricingNote}</p>

      {/* The entry product keeps the width and the deliverable list. The
          hierarchy is the argument: start here, add the rest later. */}
      <Link
        href={serviceHref(primaryService)}
        className="lift group mt-12 block rounded-card border border-line bg-surface p-7 sm:p-9"
      >
        <p className="text-eyebrow font-mono uppercase text-signal">Start here</p>

        <h3 className="mt-4 text-h3 text-ink">{primaryService.name}</h3>

        <p className="mt-3 max-w-prose-tight text-lead text-ink-muted">
          {primaryService.promise}
        </p>

        <ul className="mt-7 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {primaryService.includes.slice(0, 6).map((item) => (
            <li key={item} className="flex gap-2.5 text-label text-ink-muted">
              <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-signal" />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-7 border-t border-line pt-5 text-label text-signal">
          {whatWeBuild.primaryCardCta} →
        </p>
      </Link>

      <div className="mt-12 flex flex-col gap-10">
        {serviceCategories.map((category) => {
          // The primary service already has its own card above; listing it
          // again in its own category would read as two different products.
          const items = servicesByCategory(category.id).filter(
            (service) => service.slug !== primaryService.slug,
          );
          if (items.length === 0) return null;

          return (
            <div key={category.id}>
              <h3 className="text-eyebrow font-mono uppercase text-signal">
                {category.label}
              </h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {items.map((service) => (
                  <li key={service.slug}>
                    <ServiceItem service={service} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
