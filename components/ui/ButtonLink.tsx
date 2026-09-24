import Link from "next/link";

/**
 * The site's only button. Two variants, no size prop, no icon slot — the
 * moment a button component grows options it starts producing buttons that
 * disagree with each other.
 *
 * Renders a Link, because every call to action on this site is navigation.
 * Real <button> elements appear where something is submitted or toggled.
 *
 * The primary variant carries two hover responses: one pass of light across
 * the face (`cta-sheen`, in app/globals.css) and a 3px nudge on the arrow. Both
 * are transform-only, both are one-shot, and neither loops — a button that
 * pulses or glows on its own is asking for attention it has not earned, and by
 * the second scroll it reads as an advert.
 */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-field px-5 py-3 text-label font-semibold transition-colors duration-[var(--duration-fast)] ease-precise";

  const variants = {
    // void on signal measures 13.14:1.
    primary: "cta-sheen bg-signal text-void hover:bg-signal-dim",
    // line-interactive clears the 3:1 non-text bar for a control boundary.
    secondary:
      "border border-line-interactive text-ink hover:border-signal hover:text-signal",
  } as const;

  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}

      {variant === "primary" && (
        // aria-hidden, so the accessible name stays "Get a free audit" and not
        // "Get a free audit right arrow".
        <span
          aria-hidden="true"
          className="transition-transform duration-[var(--duration-fast)] ease-precise group-hover:translate-x-[3px]"
        >
          →
        </span>
      )}
    </Link>
  );
}
