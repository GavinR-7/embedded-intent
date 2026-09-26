import { DecryptWord } from "@/components/motion/DecryptWord";
import { TypeOn } from "@/components/motion/TypeOn";
import { IndustryMarquee } from "@/components/sections/IndustryMarquee";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Section } from "@/components/ui/Section";
import { SystemPanel } from "@/components/ui/SystemPanel";
import { TraceGrid } from "@/components/ui/TraceGrid";
import type { HeadingLine } from "@/content/home";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { DECRYPT_MS, heroTimeline } from "@/lib/heroTimeline";

const { hero, leadSystem } = home;

/**
 * The whole intro schedule, derived once at module scope.
 *
 * Both halves of the sequence read from this: the CSS animation delays on the
 * headline lines, and the two `setTimeout`s (the scramble, the panel) in the
 * client islands below. See lib/heroTimeline.ts for why it is derived rather
 * than written down.
 */
const timeline = heroTimeline(hero.eyebrow.length, hero.headingLines.length);

/**
 * Split a line once, around whichever of its two optional substrings it has.
 *
 * Falls back to the plain line if the substring is not in there. That matters:
 * if someone edits a headline and leaves `accent` or `decrypt` pointing at
 * words that are no longer in it, the hero renders the new line in one color
 * rather than rendering nothing, or — worse — rendering the old phrase.
 */
function splitOnce(text: string, needle: string) {
  const at = text.indexOf(needle);
  if (at < 0) return null;
  return {
    before: text.slice(0, at),
    match: needle,
    after: text.slice(at + needle.length),
  };
}

function HeadingLineContent({ line }: { line: HeadingLine }) {
  if (line.decrypt) {
    const parts = splitOnce(line.text, line.decrypt);
    if (parts) {
      return (
        <>
          {parts.before}
          <DecryptWord
            word={parts.match}
            startDelayMs={timeline.decryptStartMs}
            scrambleMs={DECRYPT_MS}
          />
          {parts.after}
        </>
      );
    }
  }

  if (line.accent) {
    const parts = splitOnce(line.text, line.accent);
    if (parts) {
      return (
        <>
          {parts.before}
          <span className="text-signal">{parts.match}</span>
          {parts.after}
        </>
      );
    }
  }

  return <>{line.text}</>;
}

/**
 * Server component, and so is most of it. Three things here are client islands:
 * the system panel (it sequences rows on a timer), the hero grid (it needs a
 * pointer) and the two letters of "AI" (a random glyph is not a thing CSS can
 * pick). The eyebrow's typing, the headline's rise, the ambient glow and the
 * industry strip are all pure CSS.
 *
 * That matters for more than tidiness. Hydrating this hero is the one long task
 * on the page, and Lighthouse's mobile LCP is simulated from the critical path —
 * so work here is charged at the throttled rate whether or not anything is
 * waiting on it.
 *
 * ---------------------------------------------------------------------------
 * WHAT ANIMATES AND WHAT DOES NOT.
 *
 * The LCP element on this page is the **subheading** — measured, not assumed.
 * It, both CTAs, the microcopy and the trust line are painted on the first frame
 * and never animate in. That rule is the single most effective way to stop a
 * fast page scoring like a slow one: the metric measures the paint, and an
 * opacity-0 starting state moves the paint to whenever an observer gets round to
 * it.
 *
 * The h1 *may* animate, because it is not the candidate — and it does: each line
 * rises out of its own mask. That is a transform, which never delays a paint the
 * way an opacity-0 start would, and it was measured before and after.
 * ---------------------------------------------------------------------------
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
          {/* Not the shared `Eyebrow`: this one types itself on, which needs
              three boxes rather than one. Same type treatment. */}
          <p className="text-eyebrow font-mono uppercase text-signal">
            <TypeOn text={hero.eyebrow} />
          </p>

          <h1 className="mt-6 text-h1 text-ink">
            {hero.headingLines.map((line, index) => (
              <span key={line.text} className="line-mask">
                <span
                  className="line-rise"
                  style={
                    {
                      "--line-delay": `${timeline.lineDelayMs(index)}ms`,
                    } as React.CSSProperties
                  }
                >
                  <HeadingLineContent line={line} />
                </span>
              </span>
            ))}
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
          /* The last beat of the intro: the rows start stepping once the
             headline has landed and "AI" has resolved. */
          startDelayMs={timeline.panelStartMs}
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
