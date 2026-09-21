/**
 * Standard section shell: the vertical rhythm and the content measure, in one
 * place. Every homepage section uses it, so nothing drifts to 78px of padding
 * here and 96px there.
 *
 * `id` matters — content/site.ts links to /#what-we-build, /#how-it-works,
 * /#pricing and /#faq, and those anchors only work if the sections carry
 * exactly those ids.
 */
export function Section({
  id,
  children,
  className = "",
  bleed = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  /** Skip the inner max-width wrapper, for sections that manage their own. */
  bleed?: boolean;
}) {
  return (
    <section
      id={id}
      // scroll-mt clears the sticky 80px header when an anchor is followed,
      // otherwise the heading lands underneath it.
      className={`scroll-mt-20 py-section ${className}`}
    >
      {bleed ? children : <div className="mx-auto max-w-content px-gutter">{children}</div>}
    </section>
  );
}

/** Mono, uppercase, letterspaced. The label layer of the type system. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-eyebrow font-mono uppercase text-signal">{children}</p>
  );
}

/**
 * Section heading block. Renders an <h2> — the page's single <h1> belongs to
 * the hero, and keeping that rule here means heading order cannot be broken
 * by adding a section.
 */
export function SectionHeading({
  eyebrow,
  heading,
  body,
}: {
  eyebrow: string;
  heading: string;
  body?: string;
}) {
  return (
    <div className="max-w-prose-tight">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 text-h2 text-ink">{heading}</h2>
      {body && <p className="mt-6 text-lead text-ink-muted">{body}</p>}
    </div>
  );
}
