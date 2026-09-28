import type { MetadataRoute } from "next";

import { categories, categoryHref } from "@/content/categories";
import { legalDocuments } from "@/content/legal";
import { services } from "@/content/services";
import { site } from "@/content/site";
import { caseStudies } from "@/content/work";

/**
 * Every page on the site, generated from the same content modules the pages are.
 *
 * ---------------------------------------------------------------------------
 * Nothing here is a hand-written list of URLs, and that is the point. A service
 * added to content/services.ts gets a page, a nav entry, a category listing and a
 * sitemap entry, and nobody has to remember the fourth one. The alternative —
 * a literal array of paths — is a list that is correct on the day it is written
 * and wrong by the third service.
 *
 * The one thing to know: `/robots.txt` currently disallows everything and the
 * root layout sends `noindex`. This file is correct and complete; it simply is
 * not being read yet. Both come off at launch, together, and LAUNCH.md is the
 * checklist. Submitting the sitemap in Search Console is the step AFTER that, not
 * before — a sitemap full of URLs that robots.txt forbids is a pile of warnings.
 * ---------------------------------------------------------------------------
 *
 * `lastModified` is the build time. Real per-page dates would have to come from
 * git or from a field in the content modules, and a date invented per route is
 * worse than an honest "this is when the site was last deployed".
 *
 * Priorities say what this business thinks matters: the homepage, then the three
 * category pages someone actually lands on, then the services, then /company and
 * /faq — both of which are pages someone reads before deciding — then the rest,
 * with the two legal pages last.
 * They are a hint and search engines are free to ignore them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${site.url}${path === "/" ? "" : path}`;
  const lastModified = new Date();

  return [
    { url: url("/"), lastModified, changeFrequency: "monthly", priority: 1 },

    ...categories.map((category) => ({
      url: url(categoryHref(category.slug)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),

    ...services.map((service) => ({
      url: url(`/services/${service.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    { url: url("/company"), lastModified, changeFrequency: "yearly", priority: 0.7 },
    { url: url("/faq"), lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/contact"), lastModified, changeFrequency: "yearly", priority: 0.7 },
    { url: url("/work"), lastModified, changeFrequency: "monthly", priority: 0.6 },

    ...caseStudies.map((study) => ({
      url: url(`/work/${study.slug}`),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),

    // Last, and lowest: nobody searches for these, and they should never
    // outrank a service page. They are in the sitemap because a legal notice
    // that cannot be found is not a notice — and because a carrier reviewing an
    // SMS registration has to be able to reach both of them.
    ...legalDocuments.map((doc) => ({
      url: url(`/${doc.slug}`),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
