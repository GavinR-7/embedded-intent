import { IndustryMarquee } from "@/components/sections/IndustryMarquee";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow, Section } from "@/components/ui/Section";
import { SystemPanel } from "@/components/ui/SystemPanel";
import { TraceGrid } from "@/components/ui/TraceGrid";
import { home } from "@/content/home";
import { site } from "@/content/site";

const { hero, leadSystem } = home;

/*
 * Split the headline around its accented tail.
 *
 * `lastIndexOf` rather than `endsWith`, and a fallback to the whole string if
 * the accent is not in there: if someone edits `heading` and forgets
 * `headingAccent`, the hero renders the new headline in one color rather than
 * rendering nothing or, worse, rendering the old phrase.
 */
const accentAt = hero.heading.lastIndexOf(hero.headingAccent);
const headingLead = accentAt >= 0 ? hero.heading.slice(0, accentAt) : hero.heading;
const headingAccent = accentAt >= 0 ? hero.headingAccent : "";

/**
 * Server component, and so is almost everything in it. Only two things here are
 * client islands: the system panel (it sequences rows on a timer) and the
 * cursor-lit grid (it needs a pointer). The ambient glow and the industry strip
 * were client components at first and are not any more — everything they did in
 * JavaScript is done in CSS, and the "stop when offscreen" boolean they each
 * opened an island for is now one shared observer in MotionRuntime.
 *
 * That matters for more than tidiness. Hydrating this hero is the one long task
 * on the page, and Lighthouse's mobile LCP is simulated from the critical path —
 * so work here is charged at the throttled rate whether or not anything is
 * waiting on it.
 *
 * NOTHING IN THE HERO REVEALS. The eyebrow, the H1, the subheading and both
 * CTAs are painted on the first frame and never animate in. The H1 and the
 * subheading are the LCP candidates, and an opacity-0 starting state is the
 * single most effective way to make a fast page score like a slow one — the
 * paint is what the metric measures, and it would not happen until the
 * observer fired. The panel beside them does reveal, because it is not a text
 * candidate and is not what the metric is looking at.
 *
 * The hero fills the viewport and distributes its content rather than stacking
 * it at the top: the main block grows to take the slack, and the trust line and
 * industry strip are pushed to the bottom edge.
 *
 * `min-h-svh`, not `min-h-screen`: `svh` is the *small* viewport height, the
 * one that excludes mobile browser chrome. `100vh` on a phone is taller than
 * what you can actually see, so a "full height" hero using it is always
 * slightly cut off.
 */
export function Hero() {
  return (
    <Section
      tone="void"
      size="lg"
      divider={false}
      bleedTop
      overlay={
        <>
          <AmbientGlow />
          <TraceGrid spotlight />
        </>
      }
      className="flex min-h-svh flex-col"
      contentClassName="flex flex-1 flex-col"
    >
      <div className="grid flex-1 content-center gap-14 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <Eyebrow>{hero.eyebrow}</Eyebrow>

          <h1 className="mt-6 text-h1 text-ink">
            {headingLead}
            <span className="text-signal">{headingAccent}</span>
          </h1>

          <p className="mt-7 max-w-prose-tight text-lead text-ink-muted">
            {hero.subheading}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href={site.primaryCta.href}>{site.primaryCta.label}</ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>

          <p className="mt-4 text-label text-ink-subtle">{site.ctaMicrocopy}</p>
        </div>

        <SystemPanel
          reveal
          title={leadSystem.title}
          statusLabel={leadSystem.statusLabel}
          rows={leadSystem.rows}
          footerStat={{
            label: leadSystem.footerLabel,
            value: leadSystem.footerValue,
          }}
          footerTicker={leadSystem.ticker}
        />
      </div>

      {/* The trust line. A list rather than a sentence with separators, so a
          screen reader announces three claims and not one run-on.
          `mt-auto` pins this block to the bottom of the viewport-height hero. */}
      <div className="mt-auto">
        <ul className="flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:flex-wrap sm:gap-x-6">
          {site.trustPoints.map((point) => (
            <li key={point} className="text-label text-ink-subtle">
              {point}
            </li>
          ))}
        </ul>

        <IndustryMarquee />
      </div>
    </Section>
  );
}
