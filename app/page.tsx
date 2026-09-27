import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { Close } from "@/components/sections/Close";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Problem } from "@/components/sections/Problem";
import { WhatWeBuild } from "@/components/sections/WhatWeBuild";
import { WhatWeMeasure } from "@/components/sections/WhatWeMeasure";
import { WhyMe } from "@/components/sections/WhyMe";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/content/site";
import { businessJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/seo";

/*
 * `title: null` takes the root layout's default rather than running it through
 * the "%s · Embedded Intent" template, which would render the site name twice.
 */
export const metadata = pageMetadata({
  title: null,
  description: site.description,
  path: "/",
});

/**
 * Homepage.
 *
 * Every section is a Server Component. The only client island on the page is
 * the lead system panel inside the hero, and the header's menu and scroll
 * state — so the page ships as HTML with a small amount of JavaScript attached
 * to two specific places.
 *
 * Section order is the argument the page makes: the problem, what we build,
 * what changes, how it works, proof, price, why me, objections, close.
 */
export default function Home() {
  return (
    <>
      {/* The business itself, once, on the page that is the business. Every
          service page points back at this node's @id. */}
      <JsonLd data={businessJsonLd()} />

      <Hero />
      <Problem />
      <WhatWeBuild />
      <BeforeAfter />
      <HowItWorks />
      <WhatWeMeasure />
      <WhyMe />
      <Faq />
      <Close />
    </>
  );
}
