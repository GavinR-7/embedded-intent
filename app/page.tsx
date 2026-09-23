import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { Close } from "@/components/sections/Close";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Problem } from "@/components/sections/Problem";
import { WhatWeBuild } from "@/components/sections/WhatWeBuild";
import { WhatWeMeasure } from "@/components/sections/WhatWeMeasure";
import { WhyMe } from "@/components/sections/WhyMe";

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
