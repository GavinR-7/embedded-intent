/**
 * TODO(phase-3): replace with the real homepage.
 *
 * Placeholder only — the Phase 1 deliverable is the design system and the
 * layout shell, not page content. This exists so the shell can be viewed and
 * so the tokens are exercised by something. It contains no marketing claims on
 * purpose: there is nothing here yet that has been written or verified.
 */
export default function Home() {
  return (
    <div className="relative">
      <div aria-hidden="true" className="trace-grid absolute inset-0 -z-10" />

      <div className="mx-auto max-w-content px-gutter py-section-lg">
        <p className="text-eyebrow font-mono uppercase text-signal">Phase 1 — foundation</p>
        <h1 className="mt-6 max-w-prose-tight text-h1 text-ink">
          Design system and layout shell are in place.
        </h1>
        <p className="mt-6 max-w-prose-tight text-lead text-ink-muted">
          Tokens, fonts, header, footer and the docs scaffold are done. The homepage itself is
          built in Phase 3, on top of the content layer from Phase 2.
        </p>
      </div>
    </div>
  );
}
