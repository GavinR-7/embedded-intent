import Image from "next/image";
import Link from "next/link";

import { HowItWorks } from "@/components/sections/HowItWorks";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { HeroTexture } from "@/components/ui/HeroTexture";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { audit } from "@/content/audit";
import { companyPage } from "@/content/companyPage";
import { home } from "@/content/home";
import { fillOwner, site } from "@/content/site";
import { caseStudies, launchedStatusLine } from "@/content/work";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description: site.owner.bio,
  path: "/company",
});

/**
 * /company — who builds this, and how the work runs.
 *
 * ---------------------------------------------------------------------------
 * This page exists because the Company tab pointed at `/#how-it-works`. Every
 * route into "who are these people" landed back on the homepage and scrolled,
 * which is a dead end dressed as a destination, and it meant the one genuinely
 * differentiating fact about this business — that there is one named person
 * behind it — had nowhere to live.
 *
 * The order is the argument: what we do, who does it, how it runs, what we will
 * not negotiate, proof, and then the ask. The work block sits low and small on
 * purpose. There is one case study; leading with it would make a thin list the
 * first thing a prospect sees, and the founder is the stronger opening anyway.
 * ---------------------------------------------------------------------------
 *
 * `HowItWorks` is the homepage's own component, imported, not forked. It brings
 * its `id="how-it-works"` with it, which is what `/company#how-it-works` in the
 * nav lands on. The homepage keeps its copy of the section; both render the same
 * four steps from `content/home.ts`, so there is no second list to drift.
 */
export default function CompanyPage() {
  const { whyMe } = home;
  const study = caseStudies[0];

  return (
    <>
      <Section
        tone="void"
        size="hero"
        divider={false}
        bleedTop
        overlay={<HeroTexture />}
      >
        <div className="max-w-prose-tight">
          <Eyebrow>{companyPage.eyebrow}</Eyebrow>
          <h1 className="mt-6 text-h1 text-ink">{companyPage.heading}</h1>
          <p className="mt-7 text-lead text-ink-muted">{companyPage.sub}</p>
        </div>
      </Section>

      {/* ------------------------------------------------------ the founder */}
      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-5 lg:items-start lg:gap-16">
          {/*
            The photograph slot. `site.owner.photo` is null until there is a real
            one, and null renders NOTHING — no grey silhouette, no initials
            circle. The text column then simply takes the full width, which looks
            deliberate rather than broken. Same rule as the nullable contact
            channels in the footer.
          */}
          {site.owner.photo && (
            <div data-reveal="" className="lg:col-span-2">
              <Image
                src={site.owner.photo.src}
                alt={site.owner.photo.alt}
                width={site.owner.photo.width}
                height={site.owner.photo.height}
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="w-full rounded-card border border-line object-cover"
              />
            </div>
          )}

          <div className={site.owner.photo ? "lg:col-span-3" : "lg:col-span-5"}>
            <Eyebrow reveal>{companyPage.founderEyebrow}</Eyebrow>

            <h2 data-reveal="" className="mt-5 text-h2 text-ink">
              {whyMe.heading}
            </h2>

            {/* The bio. Note it is `site.owner.bio` and not page copy — the
                owner is one record, and the two other places that name a person
                read from the same one. */}
            <p data-reveal="" className="mt-6 max-w-prose-tight text-lead text-ink-muted">
              {site.owner.bio}
            </p>

            <p data-reveal="" className="mt-6 max-w-prose-tight text-lead text-ink-muted">
              {fillOwner(whyMe.body)}
            </p>

            <p data-reveal="" className="mt-7 text-label text-ink-subtle">
              {site.owner.name} · {site.owner.role}
            </p>
          </div>
        </div>
      </Section>

      {/* The full four-step section, id and all. Not a fork. */}
      <HowItWorks />

      {/* -------------------------------------------------- how we work */}
      <Section tone="surface">
        <SectionHeading
          eyebrow={companyPage.principlesEyebrow}
          heading={companyPage.principlesHeading}
          body={companyPage.principlesNote}
        />

        {/*
          Our side of the homepage comparison table, as principles.

          Same `whyMe.rows` data, read differently: the homepage shows both
          columns because there it is making a comparison, and here it states the
          commitment on its own because the reader has already chosen to look us
          up. One list, two views — writing these out again as four principles
          would be four sentences that quietly stop matching the table.

          `slice(1)` drops "Who does the work", because the section above this
          one is entirely about that and repeating it as a bullet reads as
          padding.
        */}
        <ul className="mt-12 grid gap-px overflow-hidden rounded-card border border-line sm:grid-cols-2">
          {whyMe.rows.slice(1).map((row) => (
            <li
              key={row.aspect}
              data-reveal=""
              className="hairline lift spotlight bg-void p-7"
            >
              <h3 className="text-eyebrow font-mono uppercase text-signal">
                {row.aspect}
              </h3>
              <p className="mt-4 text-lead text-ink">{fillOwner(row.ours)}</p>
              <p className="mt-3 text-label text-ink-subtle">
                {whyMe.columns.typical}: {row.typical}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------------------------------------------------- recent work */}
      {/* Low on the page and one row tall. There is a single case study, and a
          full grid of one card at the top of the page would draw attention to
          exactly that. */}
      <Section tone="void">
        <div className="grid gap-10 lg:grid-cols-5 lg:items-center lg:gap-16">
          <div className="lg:col-span-2">
            <Eyebrow reveal>{companyPage.workEyebrow}</Eyebrow>
            <h2 data-reveal="" className="mt-5 text-h2 text-ink">
              {companyPage.workHeading}
            </h2>
            <p data-reveal="" className="mt-6 text-label text-ink-muted">
              {companyPage.workBody}
            </p>
          </div>

          <div data-reveal="" className="lg:col-span-3">
            <Link
              href={`/work/${study.slug}`}
              className="lift spotlight group flex h-full flex-col justify-between gap-6 rounded-card border border-line bg-surface/40 p-7"
            >
              <div>
                <p className="text-eyebrow font-mono uppercase text-ink-subtle">
                  {study.location}
                </p>
                <p className="mt-3 text-h3 text-ink">{study.client}</p>
                <p className="mt-4 max-w-prose-tight text-label text-ink-muted">
                  {study.summary}
                </p>
              </div>

              <p className="border-t border-line pt-5 font-mono text-eyebrow uppercase text-ink-subtle">
                {study.status === "launched"
                  ? launchedStatusLine(study.launchedAt)
                  : `${study.results.length} measured results`}
              </p>
            </Link>

            <p className="mt-6">
              <Link
                href="/work"
                className="rounded-sm text-label text-signal transition-colors duration-[var(--duration-fast)] hover:text-signal-dim"
              >
                {companyPage.workCta} →
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------------- the ask */}
      <Section tone="surface" size="lg">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow reveal>{companyPage.closeEyebrow}</Eyebrow>
            <h2 data-reveal="" className="mt-5 text-h2 text-ink">
              {companyPage.closeHeading}
            </h2>
            <p data-reveal="" className="mt-6 max-w-prose-tight text-lead text-ink-muted">
              {companyPage.closeBody}
            </p>
            <div data-reveal="" className="mt-9">
              <ButtonLink href={site.primaryCta.href}>
                {site.primaryCta.label}
              </ButtonLink>
              <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
            </div>
          </div>

          <div
            data-reveal=""
            className="lift spotlight rounded-card border border-line bg-void/40 p-7 lg:self-start"
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
      </Section>
    </>
  );
}
