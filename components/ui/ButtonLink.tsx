import Link from "next/link";

/**
 * The site's only button. Two variants, no size prop, no icon slot — the
 * moment a button component grows options it starts producing buttons that
 * disagree with each other.
 *
 * Renders a Link, because every call to action on this site is navigation.
 * Real <button> elements appear where something is submitted or toggled.
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
    "inline-flex items-center justify-center rounded-field px-5 py-3 text-label font-semibold transition-colors duration-[var(--duration-fast)] ease-precise";

  const variants = {
    // void on signal measures 13.14:1.
    primary: "bg-signal text-void hover:bg-signal-dim",
    // line-interactive clears the 3:1 non-text bar for a control boundary.
    secondary:
      "border border-line-interactive text-ink hover:border-signal hover:text-signal",
  } as const;

  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
