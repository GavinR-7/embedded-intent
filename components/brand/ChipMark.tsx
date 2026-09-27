/**
 * The logo mark: a chip with pins.
 *
 * ---------------------------------------------------------------------------
 * One definition, five consumers.
 *
 *   the header wordmark          components/layout/Header.tsx
 *   the browser tab icon         app/icon.svg
 *   the iOS home-screen icon     app/apple-icon.tsx
 *   the installed-app icons      public/icon-192.png, public/icon-512.png
 *   the social preview images    app/**\/opengraph-image.tsx
 *
 * It lived inside Header.tsx until the launch assets needed it, and a mark
 * redrawn in five places is a mark that ends up with five slightly different
 * pin lengths. The two PNGs are the exceptions and they are generated from
 * app/icon.svg rather than redrawn — see LAUNCH.md.
 *
 * No `"use client"`: it is markup and nothing else, so it renders inside the
 * client header, inside a Server Component, and inside satori (which is what
 * turns the OG routes' JSX into a PNG) without three versions of it.
 * ---------------------------------------------------------------------------
 *
 * `currentColor` throughout: the colour is the caller's decision, and the inner
 * square is filled rather than stroked so the mark still reads at 16px.
 */
export function ChipMark({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      /* Satori has no stylesheet, so the OG routes cannot size this with a
         class and an <svg> with only a viewBox comes out tiny. In the browser
         the class still wins over these attributes. */
      {...(size === undefined ? {} : { width: size, height: size })}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="5.5" y="5.5" width="13" height="13" rx="1.5" />
      <rect x="10" y="10" width="4" height="4" fill="currentColor" stroke="none" />
      <path d="M9 5.5V2.5M15 5.5V2.5M9 18.5v3M15 18.5v3M5.5 9h-3M5.5 15h-3M18.5 9h3M18.5 15h3" />
    </svg>
  );
}
