import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { HeroTexture } from "@/components/ui/HeroTexture";
import { IconTile } from "@/components/ui/icons";
import { Eyebrow, Section } from "@/components/ui/Section";
import { categories, categoryHref } from "@/content/categories";
import { notFoundPage } from "@/content/notFound";
import { site } from "@/content/site";

/**
 * The 404 page.
 *
 * Rendered inside the root layout, so it keeps the header, the nav and the
 * footer — which means someone who lands here already has every route on the
 * site one click away. The three category links below are the shortcut, not the
 * only way out.
 *
 * Built from the same Section, Eyebrow and ButtonLink as every other page, and
 * it takes the circuit texture the rest of the site's non-category heroes use.
 * A 404 styled differently from the site it belongs to reads like a server
 * error page from a different company.
 *
 * The three links come from content/categories.ts, so a fourth category would
 * appear here without anyone remembering this file exists.
 */
export default function NotFound() {
  return (
    <Section
      tone="void"
      size="hero"
      divider={false}
      bleedTop
      overlay={<HeroTexture />}
    >
      <div className="max-w-prose-tight">
        <Eyebrow>{notFoundPage.eyebrow}</Eyebrow>
        <h1 className="mt-6 text-h1 text-ink">{notFoundPage.heading}</h1>
        <p className="mt-7 text-lead text-ink-muted">{notFoundPage.body}</p>
      </div>

      <h2 className="mt-14 text-eyebrow font-mono uppercase text-ink-subtle">
        {notFoundPage.routesHeading}
      </h2>

      <ul className="mt-6 grid gap-px overflow-hidden rounded-card border border-line sm:grid-cols-3">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={categoryHref(category.slug)}
              className="hairline lift spotlight group flex h-full flex-col gap-4 bg-void p-7"
            >
              <IconTile name={category.icon} />
              <span className="block text-h3 text-ink">{category.label}</span>
              <span className="block text-label text-ink-muted">{category.sub}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <ButtonLink href="/">{notFoundPage.homeLabel}</ButtonLink>
        <ButtonLink href={site.primaryCta.href} variant="secondary">
          {site.primaryCta.label}
        </ButtonLink>
      </div>
    </Section>
  );
}
