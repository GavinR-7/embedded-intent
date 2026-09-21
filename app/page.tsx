import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { WhatWeBuild } from "@/components/sections/WhatWeBuild";

/**
 * Homepage.
 *
 * Sections 1–4 of Phase 3. How it works, Work, Pricing, Why me, FAQ and Close
 * follow in the second half of this phase.
 *
 * This is a Server Component, and so is every section except the animated
 * lead-journey chain inside the hero. The page ships as HTML with one small
 * client island attached.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <WhatWeBuild />
      <BeforeAfter />
    </>
  );
}
