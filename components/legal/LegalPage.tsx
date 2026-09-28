import { HeroTexture } from "@/components/ui/HeroTexture";
import { Eyebrow, Section } from "@/components/ui/Section";
import { fillLegal, type LegalDocument } from "@/content/legal";

/**
 * The body of /privacy and /terms. A Server Component, like both routes.
 *
 * One component for both documents, because they are the same object shape and
 * the same page — a hero, an effective date, and a run of headed sections. The
 * routes are four lines each, exactly as the three category pages are.
 *
 * ---------------------------------------------------------------------------
 * NOTHING ON THIS PAGE REVEALS, and that is two decisions in one.
 *
 * The first is feel: a legal notice that fades in a paragraph at a time reads as
 * a landing page wearing a legal notice's clothes. Someone reading this wants to
 * find one sentence and leave.
 *
 * The second is the largest-contentful-paint rule (MOTION.md). These heroes are
 * short — an eyebrow, one line of heading, a lead and a date — so on a 390×844
 * phone the first section's text is still inside the first viewport and is a
 * candidate for the measurement. That is exactly what cost /company 0.6s of LCP
 * until it was found. Not revealing anything makes the question moot.
 * ---------------------------------------------------------------------------
 *
 * The date is formatted here rather than stored formatted, so `effective` stays
 * one value in one place — see the note on that field for the UTC trap.
 */
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  // A date-only string parses as UTC midnight. Formatted in New York, that
  // prints the day before — an effective date that is wrong by one day on the
  // one page where dates are the point.
  timeZone: "UTC",
});

export function LegalPage({ doc }: { doc: LegalDocument }) {
  const effective = new Date(doc.effective);

  return (
    <>
      <Section tone="void" size="hero" divider={false} bleedTop overlay={<HeroTexture />}>
        <div className="max-w-prose-tight">
          <Eyebrow>{doc.eyebrow}</Eyebrow>
          <h1 className="mt-6 text-h1 text-ink">{doc.heading}</h1>
          <p className="mt-7 text-lead text-ink-muted">{doc.sub}</p>

          {/*
            A real <time>, so the date is machine-readable as well as legible —
            this is the one page where which day it took effect matters.

            SET IN SANS, not the mono eyebrow treatment the rest of the site's
            small print uses, and that is a measurement rather than a taste.
            Geist Mono is deliberately not preloaded (app/layout.tsx explains
            why), so it swaps in after first paint; with this line in mono, the
            swap repainted its glyphs a few pixels along and Lighthouse recorded
            CLS 0.000075 on both pages — against a flat 0 everywhere else on the
            site — in every run. Three markup variants later the score had not
            moved by a digit: the box never changes size, it is the text inside
            the element that moves, and an element is what `datetime` needs.
            Geist Sans is preloaded and has a metrics-matched fallback, so it is
            already in its real face when this paints. Same treatment as the
            location line under a case study's H1.
          */}
          <p className="mt-6 text-label text-ink-subtle">
            Effective{" "}
            <time dateTime={doc.effective}>{DATE_FORMAT.format(effective)}</time>
          </p>
        </div>
      </Section>

      <Section tone="surface">
        {/*
          One column at reading measure, and one <section> per block with a real
          `id` — so /privacy#sms is a link someone can send, and a screen reader
          gets a landmark per heading rather than one wall of text.
        */}
        <div className="max-w-prose-tight">
          {doc.sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={index === 0 ? "scroll-mt-28" : "mt-14 scroll-mt-28"}
            >
              <h2 className="text-h3 text-ink">{section.heading}</h2>

              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-5 text-body text-ink-muted">
                  {fillLegal(paragraph)}
                </p>
              ))}

              {section.points && (
                <ul className="mt-5 flex flex-col gap-2.5">
                  {section.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-3 text-body text-ink-muted"
                    >
                      {/* A marker we draw, rather than a list-style bullet: the
                          same dash the rest of the site uses for a list, and it
                          keeps the text block aligned when a line wraps. */}
                      <span aria-hidden="true" className="text-signal">
                        —
                      </span>
                      <span>{fillLegal(point)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
