import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Lets every other route write relative OG/canonical URLs.
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,

  // ⚠️ PRE-LAUNCH ONLY — REMOVE BEFORE LAUNCH.
  // app/robots.ts asks crawlers not to *crawl* the site. This asks them not to
  // *index* it, which is a different thing: a URL discovered from an external
  // link can be indexed without ever being crawled. Belt and braces until the
  // content is real. Tracked in CONTENT_TODO.md as launch-blocking.
  robots: { index: false, follow: false },
};

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
    >
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
      </body>
    </html>
  );
}
