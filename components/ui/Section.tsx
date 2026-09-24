/**
 * The page's band rhythm, in one place.
 *
 * Every homepage section routes through this. Background, boundary, texture
 * and vertical rhythm are decided here and nowhere else — the same
 * single-source-of-truth rule the content layer follows, applied to layout.
 * If band backgrounds were per-section classes, the alternation would be ten
 * files' worth of state that nothing enforces.
 *
 * The rhythm:
 *
 *   tone="void"     page background
 *   tone="surface"  one step lighter
 *
 * Alternating those two with a hairline top border at each transition makes a
 * boundary read as a crisp edge rather than as dead space.
 *
 * Section knows nothing about the circuit-trace texture. It used to render it
 * on every void band, which meant the texture appeared five or six times down
 * a page and stopped reading as a treatment for the top of the page. It is now
 * passed in as `overlay`, by the one band per route that wants it — see
 * `components/ui/TraceGrid.tsx`.
 *
 * `size="lg"` is reserved for genuine act breaks: the hero and the close.
 * Everything between them uses the default.
 *
 * Note that padding is per-section, so the gap a reader sees between two bands
 * is the sum of both sections' padding. That is intended here: the padding is
 * a band's internal breathing room, and the border is the boundary.
 */

type Tone = "void" | "surface";
type Size = "default" | "lg";

/*
 * Class names are written out in full, as literals.
 *
 * Tailwind finds classes by scanning source text — it does not evaluate the
 * code. A class assembled at runtime, like `pt-[calc(${spacing}+5rem)]`, never
 * appears in the file as a complete string, so the utility is never generated
 * and the element silently gets no padding at all. Lookup tables of whole
 * class names are the way to keep variants dynamic without losing them.
 *
 * The underscores inside `calc()` become spaces in the generated CSS. They are
 * required: CSS `calc` needs whitespace around `+`, and without it the
 * declaration is invalid and the browser drops it — the same silent zero.
 *
 * `5rem` is the header height. It cannot be a variable here for the reason
 * above, so it is stated in the comment instead: if the header height changes,
 * these two values change with it.
 */
const PADDING_TOP = {
  default: "pt-section",
  lg: "pt-section-lg",
} as const;

const PADDING_TOP_BLEED = {
  default: "-mt-20 pt-[calc(var(--spacing-section)_+_5rem)]",
  lg: "-mt-20 pt-[calc(var(--spacing-section-lg)_+_5rem)]",
} as const;

const PADDING_BOTTOM = {
  default: "pb-section",
  lg: "pb-section-lg",
} as const;

export function Section({
  id,
  tone = "void",
  size = "default",
  divider = true,
  bleedTop = false,
  overlay,
  className = "",
  contentClassName = "",
  children,
}: {
  id?: string;
  tone?: Tone;
  size?: Size;
  /** Hairline top border marking the transition. Off for the first band. */
  divider?: boolean;
  /**
   * Pulls the section up under the sticky header so its background and texture
   * start at y=0 rather than below the header — otherwise the first band draws
   * a hard horizontal seam across the top of the page. The top padding grows
   * by the header height to put the content back where it belongs.
   */
  bleedTop?: boolean;
  /**
   * Full-bleed decoration rendered behind the content. Used by the first band
   * of a page for the circuit-trace texture; every other band leaves it unset
   * and renders flat.
   */
  overlay?: React.ReactNode;
  className?: string;
  /**
   * Applied to the inner max-width wrapper. Only needed when a section has to
   * distribute its children vertically — the hero stretching to fill the
   * viewport — since the wrapper has to grow for that to be possible.
   */
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const paddingTop = bleedTop ? PADDING_TOP_BLEED[size] : PADDING_TOP[size];

  const paddingBottom = PADDING_BOTTOM[size];

  return (
    <section
      id={id}
      /*
        Marks this band as a stagger group.

        The runtime numbers every `data-reveal` element inside it in document
        order and writes `--reveal-i`, so the eyebrow, the heading and then each
        card arrive 70ms apart. Nothing in a section has to know its own index,
        which is what stops the numbers going wrong the moment someone reorders
        two blocks. See components/motion/MotionRuntime.tsx.
      */
      data-reveal-group=""
      className={[
        "relative",
        // Clears the sticky 80px header when an anchor is followed, so the
        // heading does not land underneath it.
        "scroll-mt-20",
        tone === "surface" ? "bg-surface" : "bg-void",
        divider ? "border-t border-line" : "",
        paddingTop,
        paddingBottom,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {overlay}

      <div
        className={`relative mx-auto w-full max-w-content px-gutter ${contentClassName}`.trim()}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Mono, uppercase, letterspaced. The label layer of the type system.
 *
 * `reveal` is opt-in rather than on by default because this component is used
 * inside page heroes, and nothing in a hero reveals: the H1 and the subheading
 * are the largest-contentful-paint candidates, and an eyebrow fading in above
 * a headline that was there from the first frame looks like a mistake rather
 * than an effect.
 */
export function Eyebrow({
  children,
  reveal = false,
}: {
  children: React.ReactNode;
  reveal?: boolean;
}) {
  return (
    <p
      data-reveal={reveal ? "" : undefined}
      className="text-eyebrow font-mono uppercase text-signal"
    >
      {children}
    </p>
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
    /*
      All three parts reveal, as three separate targets rather than one wrapper,
      so the eyebrow, the heading and the lead arrive one after another instead
      of as a single block. That is the whole difference between a page that
      breathes and a page that slides.

      Safe to do unconditionally: SectionHeading renders an <h2>, so it is never
      the H1 a hero is built around, and no page hero uses it.
    */
    <div className="max-w-prose-tight">
      <Eyebrow reveal>{eyebrow}</Eyebrow>
      <h2 data-reveal="" className="mt-5 text-h2 text-ink">
        {heading}
      </h2>
      {body && (
        <p data-reveal="" className="mt-6 text-lead text-ink-muted">
          {body}
        </p>
      )}
    </div>
  );
}
