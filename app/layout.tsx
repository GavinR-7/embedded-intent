import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { VercelBeacons } from "@/components/analytics/VercelBeacons";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import { site } from "@/content/site";
import "./globals.css";

/*
 * next/font downloads these at build time and serves them from our own origin,
 * so there is no request to Google at runtime and no layout shift: it also
 * generates a fallback face with matching metrics. Each `variable` lands as a
 * CSS custom property on <html>, which app/globals.css maps onto --font-sans
 * and --font-mono.
 *
 * Both are variable fonts — one file covers every weight, which is why we get
 * a full weight range for the cost of two requests.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/*
 * `preload: false` is deliberate, and measured.
 *
 * The LCP element on the homepage is the hero subheading, which is set in
 * Geist Sans. Preloading the mono face put a second font in the highest
 * priority band, competing for bandwidth with the one face LCP actually waits
 * on. Mono is only used for eyebrows, labels, status chips and figures —
 * small text, never the largest paint — so it can load at normal priority and
 * swap in a moment later.
 *
 * `display: "swap"` on both means no invisible text either way.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  // Lets every other route write relative OG/canonical URLs.
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,

  /*
   * Declared here rather than left to the app-directory file conventions.
   *
   * `app/icon.*` and `app/apple-icon.*` are served at hashed URLs, which is
   * right for cache-busting and wrong for a manifest that has to name the same
   * files by a stable path. These four live in public/, so app/manifest.ts and
   * these tags point at exactly the same bytes. app/favicon.ico stays where it
   * is for the browsers that still ask for /favicon.ico by name.
   */
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",

  // ⚠️ PRE-LAUNCH ONLY — REMOVE BEFORE LAUNCH.
  // app/robots.ts asks crawlers not to *crawl* the site. This asks them not to
  // *index* it, which is a different thing: a URL discovered from an external
  // link can be indexed without ever being crawled. Belt and braces until the
  // content is real. Tracked in CONTENT_TODO.md as launch-blocking.
  robots: { index: false, follow: false },
};

/*
 * Arms the reveal system, before the browser paints anything.
 *
 * The CSS that hides a `data-reveal` element is gated on this attribute (see
 * app/globals.css), so the order matters: the attribute has to be set during
 * HTML parsing, or there is a flash of laid-out content that then hides itself
 * and animates back in. An inline `<script>` in <head> runs synchronously at
 * exactly that moment — `useEffect` runs after the first paint and
 * `useLayoutEffect` after hydration, and both are too late.
 *
 * Everything about this fails in the safe direction. The attribute is never
 * set for a crawler, for a visitor with JavaScript off, or under a
 * Content-Security-Policy that blocks inline scripts — and in all three cases
 * the hiding rules simply never match and the whole page is visible.
 */
const ARM_REVEALS = `(function(){try{document.documentElement.setAttribute("data-reveal-ready","")}catch(e){}})()`;

/**
 * Whether this build is being served by Vercel.
 *
 * ---------------------------------------------------------------------------
 * The two beacons below are mounted only when it is, and the reason is not
 * taste. Both scripts are served from first-party paths that only exist on
 * Vercel's edge — `/_vercel/insights/script.js` and
 * `/_vercel/speed-insights/script.js`. Anywhere else, including `next start` on
 * this machine, those are 404s: a failed request in every trace, a console error
 * against Best Practices, and a number in the Lighthouse runs below that is not
 * the number the site actually gets.
 *
 * `VERCEL` is set by the platform during build and at runtime. Read in a Server
 * Component, so it is resolved when the page is rendered and no part of it
 * reaches the client bundle on any other host.
 *
 * What they cost where they do run: 16.7 kB gzipped of chunk, plus the two
 * scripts, both fetched after the page is interactive. That number is the
 * shipped chunk, not the 2.1 kB each the packages' own `dist/*.mjs` files
 * measure — see components/analytics/VercelBeacons.tsx, which is where the
 * difference between the two turned out to matter.
 * ---------------------------------------------------------------------------
 */
const ON_VERCEL = Boolean(process.env.VERCEL);

export const viewport: Viewport = {
  themeColor: site.themeColor,
  // Tells the browser to render form controls, scrollbars and the like dark.
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The inline script below adds an attribute to this element before React
      // hydrates. Without this, React treats the extra attribute as a mismatch.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ARM_REVEALS }} />
      </head>
      <body className="flex min-h-full flex-col bg-void font-sans text-body text-ink">
        {/* First thing in the tab order: lets keyboard and screen-reader users
            jump the nav instead of tabbing through it on every page. */}
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />

        {/* One client island for every scroll reveal and cursor effect on the
            site. Renders nothing; see components/motion/MotionRuntime.tsx. */}
        <MotionRuntime />

        {/* Page views, and the field Core Web Vitals of real visitors — which
            is the number that matters and the one a lab run on a developer's
            laptop cannot tell you. See ON_VERCEL above for why they are gated. */}
        {ON_VERCEL && <VercelBeacons />}
      </body>
    </html>
  );
}
