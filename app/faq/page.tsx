import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { FaqList } from "@/components/ui/FaqList";
import { HeroTexture } from "@/components/ui/HeroTexture";
import { Eyebrow, Section } from "@/components/ui/Section";
import { faqs, faqGroups } from "@/content/faq";
import { faqPage } from "@/content/faqPage";
import { site } from "@/content/site";
import { faqPageJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ",
  description: faqPage.sub,
  path: "/faq",
});

/**
 * /faq — every question, grouped.
 *
 * The homepage keeps its own FAQ section and renders the same list ungrouped;
 * category and service pages render subsets. All four read `content/faq.ts`, so
 * there is exactly one copy of every answer on this site.
 *
 * The grouping is derived from the `services` tags that were already on each
 * question rather than from a hand-written map — see `faqGroups` there for why,
 * and for the one consequence worth knowing (retagging a question can move it).
 *
 * The structured data is built from `faqs`, the same array, which is the point:
 * an FAQPage whose markup answers differently from the page is the usual way a
 * site earns a manual action, and the usual cause is a second copy written for
 * the crawler.
 */
export default function FaqPage() {
  const groups = faqGroups();

  return (
    <>
      <JsonLd data={faqPageJsonLd(faqs)} />

      <Section
        tone="void"
        size="hero"
        divider={false}
        bleedTop
        overlay={<HeroTexture />}
      >
        <div className="max-w-prose-tight">
          <Eyebrow>{faqPage.eyebrow}</Eyebrow>
          <h1 className="mt-6 text-h1 text-ink">{faqPage.heading}</h1>
          <p className="mt-7 text-lead text-ink-muted">{faqPage.sub}</p>
        </div>

        {/*
          Jump links. Rendered only when there is more than one group, because a
          "jump to" row with a single destination is furniture, not navigation.
          Real anchors to real ids, so they work with JavaScript off and can be
          copied out of the address bar.
        */}
        {groups.length > 1 && (
          <nav aria-label={faqPage.jumpLabel} className="mt-12">
            <p className="text-eyebrow font-mono uppercase text-ink-subtle">
              {faqPage.jumpLabel}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {groups.map((group) => (
                <li key={group.id}>
                  <a
                    href={`#${group.id}`}
                    className="lift block rounded-field border border-line px-3.5 py-2 text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-ink"
                  >
                    {group.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </Section>

      {groups.map((group, index) => (
        <Section
          key={group.id}
          id={group.id}
          /* Alternating bands, so consecutive groups read as separate blocks
             rather than one very long list. */
          tone={index % 2 === 0 ? "surface" : "void"}
        >
          <h2 data-reveal="" className="text-h2 text-ink">
            {group.heading}
          </h2>
          <FaqList items={group.items} />
        </Section>
      ))}

      <Section tone="surface" size="lg">
        <div className="max-w-prose-tight">
          <Eyebrow reveal>{faqPage.closeEyebrow}</Eyebrow>
          <h2 data-reveal="" className="mt-5 text-h2 text-ink">
            {faqPage.closeHeading}
          </h2>
          <p data-reveal="" className="mt-6 text-lead text-ink-muted">
            {faqPage.closeBody}
          </p>
          <div data-reveal="" className="mt-9">
            <ButtonLink href={site.primaryCta.href}>
              {site.primaryCta.label}
            </ButtonLink>
            <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
