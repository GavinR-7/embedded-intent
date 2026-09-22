import Link from "next/link";

import { Section, SectionHeading } from "@/components/ui/Section";
import { home } from "@/content/home";
import { addOnServices, primaryService } from "@/content/services";
import type { Service } from "@/content/services";

const { whatWeBuild } = home;

/**
 * Cards link to /services/[slug], which Phase 4 generates from the same
 * `services` array. Those routes 404 until then — expected, and logged in
 * CONTENT_TODO.md.
 */
function serviceHref(service: Service) {
  return `/services/${service.slug}`;
}

export function WhatWeBuild() {
  return (
    <Section id="what-we-build" tone="void">
      <SectionHeading
        eyebrow={whatWeBuild.eyebrow}
        heading={whatWeBuild.heading}
        body={whatWeBuild.body}
      />

      {/* Cards sell the outcome. Price is disclosed in the pricing section
          below and on each service page — deliberate sequencing, so this says
          plainly where the numbers are rather than leaving a reader hunting. */}
      <p className="mt-6 text-label text-ink-subtle">
        <a href="#pricing" className="text-signal underline underline-offset-4">
          {whatWeBuild.pricingNote}
        </a>
      </p>

      {/* The primary card gets the width and the deliverable list. The
          hierarchy is the argument: start here, add the rest later. */}
      <Link
        href={serviceHref(primaryService)}
        className="group mt-14 block rounded-card border border-line bg-surface p-7 transition-colors duration-[var(--duration-base)] ease-precise hover:border-signal sm:p-9"
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

      <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {addOnServices.map((service) => (
          <li key={service.slug}>
            <Link
              href={serviceHref(service)}
              className="group flex h-full flex-col rounded-card border border-line bg-surface/50 p-6 transition-colors duration-[var(--duration-base)] ease-precise hover:border-signal"
            >
              <h3 className="text-h3 text-ink">{service.name}</h3>

              <p className="mt-3 flex-1 text-label text-ink-muted">{service.promise}</p>

              <p className="mt-6 border-t border-line pt-4 text-label text-ink-subtle transition-colors duration-[var(--duration-base)] group-hover:text-signal">
                {whatWeBuild.addOnCardCta} →
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
