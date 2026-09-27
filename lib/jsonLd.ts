import type { FaqItem } from "@/content/faq";
import type { Service } from "@/content/services";
import { site } from "@/content/site";

/**
 * Structured data, built from the same content modules the pages render.
 *
 * ---------------------------------------------------------------------------
 * THE RULE HERE IS THE SAME RULE AS EVERYWHERE ELSE: nothing goes in that is not
 * true and sourced.
 *
 * Schema.org invites exactly the fabrication this site has spent eight phases
 * refusing. `aggregateRatings` with a made-up 4.9, a `reviewCount`, a
 * `priceRange` of "$$", a `foundingDate`, an `address` invented so the
 * LocalBusiness validator goes quiet — every one of those is a lie that happens
 * to be machine-readable, which makes it worse than one in prose, not better.
 *
 * So: no ratings, no review counts, no price range, no street address, no
 * opening-hours specification beyond the one that is actually written on the
 * contact page. If Google's rich-results test warns that `address` is
 * recommended, the warning is correct and the answer is that this business does
 * not publish one, not that we should choose one.
 * ---------------------------------------------------------------------------
 */

/**
 * The business, on the homepage.
 *
 * `ProfessionalService` rather than plain `LocalBusiness`: it is the subtype for
 * a service business, it inherits everything LocalBusiness defines, and it does
 * not carry the retail-shaped expectations (a storefront, opening hours, a
 * price range) that a bare LocalBusiness does.
 *
 * `areaServed` is two entries rather than one string, because "Long Island" and
 * "New York" are different kinds of place and a consumer that understands
 * administrative areas should be able to tell them apart.
 */
export function businessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${site.url}/#business`,
    name: site.name,
    description: site.description,
    url: site.url,
    // Null-guarded in content/site.ts for the same reason the Footer guards
    // them: a placeholder contact detail that ships is worse than an absent one,
    // and in structured data nobody would ever see it to notice.
    ...(site.phone ? { telephone: site.phone.e164 } : {}),
    ...(site.email ? { email: site.email } : {}),
    areaServed: [
      { "@type": "Place", name: "Long Island" },
      { "@type": "AdministrativeArea", name: "New York" },
    ],
    knowsAbout: [
      "Website design and development",
      "Local search visibility",
      "AI lead response and automation",
    ],
  };
}

/**
 * One service, on its own page.
 *
 * `provider` points at the homepage's `@id`, so a crawler reads eleven services
 * belonging to one business rather than eleven unrelated businesses.
 *
 * No `offers`. The site publishes price bands in prose, and a band is a range
 * with conditions attached — flattening it into an `Offer` with a single number
 * would be stating a price we have not agreed to.
 */
export function serviceJsonLd(service: Service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.promise,
    url: `${site.url}/services/${service.slug}`,
    serviceType: service.name,
    provider: { "@id": `${site.url}/#business` },
    areaServed: [
      { "@type": "Place", name: "Long Island" },
      { "@type": "AdministrativeArea", name: "New York" },
    ],
  };
}

/**
 * The FAQ page's questions and answers.
 *
 * Built from the same `faqs` array the page renders, so the answer a crawler is
 * given is character-for-character the answer a reader is given. That is not
 * only tidiness: an FAQPage whose structured data says something the visible
 * page does not is a manual-action risk, and the usual way it happens is a
 * second copy of the answers written for the markup.
 *
 * `acceptedAnswer.text` takes plain text — the answers in content/faq.ts are
 * plain text, and the type there says so.
 */
export function faqPageJsonLd(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${site.url}/faq#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
