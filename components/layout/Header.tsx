"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { site } from "@/content/site";

/**
 * Elements that can receive keyboard focus, for the mobile menu's focus trap.
 * Kept narrow on purpose — the menu only ever contains links and buttons.
 */
const FOCUSABLE_SELECTOR = "a[href], button:not([disabled])";

/** Matches Tailwind's `md` breakpoint (--breakpoint-md: 48rem). */
const DESKTOP_QUERY = "(min-width: 48rem)";

function ChipMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      {/* Package outline */}
      <rect x="5.5" y="5.5" width="13" height="13" rx="1.5" />
      {/* The die */}
      <rect
        x="10"
        y="10"
        width="4"
        height="4"
        fill="currentColor"
        stroke="none"
      />
      {/* Pins — the traces leaving the package */}
      <path d="M9 5.5V2.5M15 5.5V2.5M9 18.5v3M15 18.5v3M5.5 9h-3M5.5 15h-3M18.5 9h3M18.5 15h3" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();

  /*
   * The menu's open state is stored as *the path it was opened on*, and
   * "is it open" is derived from that.
   *
   * The obvious alternative — a boolean plus an effect that closes it when
   * `pathname` changes — calls setState inside an effect, which costs a second
   * render pass on every navigation. Deriving it means a route change closes
   * the menu for free, with no effect at all.
   *
   * Anchor links (/#pricing) do not change the pathname, so those links also
   * close the menu in their own onClick.
   */
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath !== null && openPath === pathname;

  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /**
   * True once the page has scrolled past the sentinel, which is what flips the
   * header from transparent to solid.
   */
  const [scrolled, setScrolled] = useState(false);

  /**
   * Whether closing should send focus back to the toggle. True when the user
   * dismissed the menu (Escape, tapping the toggle, tapping the backdrop) and
   * false when navigation is taking focus somewhere better on its own.
   */
  const restoreFocusRef = useRef(false);

  const closeMenu = useCallback((restoreFocus = false) => {
    restoreFocusRef.current = restoreFocus;
    setOpenPath(null);
  }, []);

  const openMenu = useCallback(() => setOpenPath(pathname), [pathname]);

  // The menu is hidden at md and up. If the viewport widens while it is open,
  // close it — otherwise the body scroll lock survives with no visible menu.
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMenu(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [closeMenu]);

  /*
   * Transparent-to-solid on scroll, via IntersectionObserver rather than a
   * scroll listener.
   *
   * A scroll handler fires on every frame of every scroll and has to read
   * scrollY, which forces layout. The observer fires twice in the life of the
   * page — once crossing down, once crossing back — and does its geometry off
   * the main thread. Same result, none of the jank, on a site whose whole
   * pitch is speed.
   *
   * The sentinel is an out-of-flow 80px box pinned to the top of the document.
   * When it stops intersecting the viewport, we are scrolled past it. It sits
   * *outside* the sticky <header> deliberately: `position: sticky` establishes
   * a containing block, so a sentinel inside the header would travel with it
   * and never stop intersecting.
   */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Focus trap, Escape-to-close, and body scroll lock — all only while open.
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    // Captured once, so the cleanup below closes over this element rather than
    // reading toggleRef.current after the effect has been torn down. The button
    // itself is never unmounted, so this stays valid for the life of the menu.
    const toggle = toggleRef.current;

    // The toggle is part of the cycle: it is the visible "close" control, so
    // Shift+Tab off the first link should reach it rather than escape to the
    // page behind the overlay.
    const getFocusable = (): HTMLElement[] => {
      const inPanel = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      return toggle ? [toggle, ...inPanel] : inPanel;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;

      if (restoreFocusRef.current) {
        toggle?.focus();
        restoreFocusRef.current = false;
      }
    };
  }, [open, closeMenu]);

  // Solid whenever the page has scrolled, and also while the mobile menu is
  // open — a transparent bar floating over an opaque menu panel looks broken.
  const solid = scrolled || open;

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-20 w-full"
      />

      <header
        className={`sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-[var(--duration-base)] ease-precise ${
          solid
            ? "border-line bg-void/85 backdrop-blur-md"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-content items-center justify-between gap-4 px-gutter">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-sm text-ink transition-colors duration-[var(--duration-fast)] hover:text-signal"
            onClick={() => closeMenu(false)}
          >
            <ChipMark className="h-9 w-9 text-signal" />
            <span className="text-xl font-semibold tracking-tight">
              {site.name}
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-7">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-sm text-label text-ink-muted transition-colors duration-[var(--duration-fast)] hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link
            href={site.primaryCta.href}
            className="hidden rounded-field bg-signal px-4 py-2 text-label font-semibold text-void transition-colors duration-[var(--duration-fast)] hover:bg-signal-dim md:inline-block"
          >
            {site.primaryCta.label}
          </Link>

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => (open ? closeMenu(true) : openMenu())}
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-field text-ink transition-colors duration-[var(--duration-fast)] hover:bg-surface-raised md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
              className="h-5 w-5"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
              )}
            </svg>
          </button>
        </div>

        {/*
        Rendered only while open, so the menu's links are never in the tab order
        while hidden — the most common keyboard bug in a mobile nav. The
        trade-off is that there is an open animation but no close animation.
      */}
        {open && (
          <div
            id="mobile-menu"
            ref={panelRef}
            className="fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto border-t border-line bg-void md:hidden motion-safe:animate-[menu-in_var(--duration-base)_var(--ease-out-expo)]"
          >
            <nav aria-label="Mobile" className="px-gutter py-8">
              <ul className="flex flex-col gap-1">
                {site.nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => closeMenu(false)}
                      className="block border-b border-line py-4 text-h3 text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href={site.primaryCta.href}
                onClick={() => closeMenu(false)}
                className="mt-8 block rounded-field bg-signal px-5 py-3.5 text-center font-semibold text-void"
              >
                {site.primaryCta.label}
              </Link>

              <ul className="mt-8 flex flex-col gap-2">
                {site.trustPoints.map((point) => (
                  <li key={point} className="text-label text-ink-subtle">
                    {point}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
