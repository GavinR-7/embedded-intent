"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { IconTile } from "@/components/ui/icons";
import { serviceCategories, servicesByCategory } from "@/content/services";
import { site } from "@/content/site";

import { NavPanel, NavTrigger } from "./NavDropdown";

/**
 * Elements that can receive keyboard focus, for the mobile menu's focus trap.
 * Kept narrow on purpose — the menu only ever contains links and buttons.
 */
const FOCUSABLE_SELECTOR = "a[href], button:not([disabled])";

/** Matches Tailwind's `md` breakpoint (--breakpoint-md: 48rem). */
const DESKTOP_QUERY = "(min-width: 48rem)";

/** Width of the active-nav underline, in px. Constant, so the indicator only
 *  ever animates `transform` — never `width`, which would be layout. */
const INDICATOR_WIDTH = 20;

/**
 * Opening is delayed so brushing past a trigger on the way somewhere else does
 * not flash a menu open. Closing is delayed longer, so travelling diagonally
 * from the trigger down into the panel — which briefly leaves both elements —
 * does not snatch it away mid-movement.
 */
const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 200;

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
      <rect x="5.5" y="5.5" width="13" height="13" rx="1.5" />
      <rect x="10" y="10" width="4" height="4" fill="currentColor" stroke="none" />
      <path d="M9 5.5V2.5M15 5.5V2.5M9 18.5v3M15 18.5v3M5.5 9h-3M5.5 15h-3M18.5 9h3M18.5 15h3" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();

  /*
   * The mobile menu's open state is stored as *the path it was opened on*, and
   * "is it open" is derived from that. A boolean plus an effect that closes it
   * on route change would call setState inside an effect, costing a second
   * render pass on every navigation.
   */
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath !== null && openPath === pathname;

  /*
   * Which desktop dropdown is open, and which mobile accordion group is
   * expanded. Both store the path they were opened on, and both derive "is it
   * open" from it — the same trick as the mobile menu above.
   *
   * The obvious alternative is to reset them when `pathname` changes, but
   * doing that during render mutates a ref mid-render (which React forbids,
   * and `react-hooks/refs` catches), and doing it in an effect costs a second
   * render pass on every navigation. Storing the path makes a route change
   * close them for free.
   */
  const [openMenuState, setOpenMenuState] = useState<{
    label: string;
    path: string;
    /**
     * How the panel came to be open.
     *
     * Without this, hover-open followed by a click toggled the panel shut:
     * the pointer opened it, then the click saw `open === true` and closed it,
     * so clicking the trigger dismissed the menu you were trying to use. A
     * click now only closes a panel that a click opened.
     */
    source: "hover" | "click";
  } | null>(null);

  const openLabel =
    openMenuState !== null && openMenuState.path === pathname
      ? openMenuState.label
      : null;

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const closeDropdown = useCallback(() => {
    clearTimers();
    setOpenMenuState(null);
  }, [clearTimers]);

  /** Pointer entered a trigger or a panel. */
  const onDropdownPointerEnter = useCallback(
    (label: string) => {
      // Cancels any pending close, which is what makes the diagonal trip from
      // trigger to panel survivable.
      clearTimers();
      openTimer.current = setTimeout(
        () =>
          setOpenMenuState((current) => {
            // Already open for this menu: keep the existing source. Otherwise
            // moving the pointer around inside a click-opened panel would
            // quietly downgrade it to hover-opened, and the next click on the
            // trigger would behave differently than the one before it.
            if (current?.label === label && current.path === pathname) return current;
            return { label, path: pathname, source: "hover" };
          }),
        OPEN_DELAY_MS,
      );
    },
    [clearTimers, pathname],
  );

  const onDropdownPointerLeave = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpenMenuState(null), CLOSE_DELAY_MS);
  }, [clearTimers]);

  const onTriggerClick = useCallback(
    (label: string) => {
      clearTimers();
      setOpenMenuState((current) => {
        const showing = current?.label === label && current.path === pathname;
        // A click closes only what a click opened. After a hover-open, the
        // click promotes it to click-opened and the panel stays put.
        if (showing && current?.source === "click") return null;
        return { label, path: pathname, source: "click" };
      });
    },
    [clearTimers, pathname],
  );

  const [openGroupState, setOpenGroupState] = useState<{
    label: string;
    path: string;
  } | null>(null);
  const openGroup =
    openGroupState !== null && openGroupState.path === pathname
      ? openGroupState.label
      : null;

  const setOpenGroup = useCallback(
    (label: string | null) =>
      setOpenGroupState(label === null ? null : { label, path: pathname }),
    [pathname],
  );

  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const navListRef = useRef<HTMLUListElement | null>(null);
  const triggerRefs = useRef<(HTMLElement | null)[]>([]);
  const triggerButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  /**
   * Whether closing should send focus back to the toggle. True when the user
   * dismissed the menu (Escape, tapping the toggle) and false when navigation
   * is taking focus somewhere better on its own.
   */
  const restoreFocusRef = useRef(false);

  const closeMenu = useCallback((restoreFocus = false) => {
    restoreFocusRef.current = restoreFocus;
    setOpenPath(null);
  }, []);

  const openMenu = useCallback(() => setOpenPath(pathname), [pathname]);

  /*
   * Transparent-to-solid on scroll, via IntersectionObserver rather than a
   * scroll listener: the observer fires twice in the life of the page instead
   * of on every scroll frame, and never reads scrollY.
   *
   * The sentinel sits *outside* the sticky <header> deliberately —
   * `position: sticky` establishes a containing block, so a sentinel inside
   * the header would travel with it and never stop intersecting.
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

  // The mobile menu is hidden at md and up. If the viewport widens while it is
  // open, close it — otherwise the body scroll lock survives with no menu.
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMenu(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [closeMenu]);

  /*
   * The active indicator tracks the ROUTE, not scroll position.
   *
   * It used to follow whichever homepage section sat under the header, via an
   * IntersectionObserver over the anchor targets. That observer is gone. With
   * the nav rebuilt around Services and Company, the honest signal is where
   * you are: Services on any /services/* page, Company on /work*, and nothing
   * on the homepage, which belongs to neither.
   */
  const activeIndex = site.navMenus.findIndex((menu) => pathname.startsWith(menu.match));

  /*
   * Move the underline. Written imperatively against a ref rather than through
   * state: the position is derived from layout, and putting a measured pixel
   * value into state would re-render the header to move one 20px bar. Only
   * `transform` and `opacity` are touched, so it never triggers layout.
   */
  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    const trigger = activeIndex >= 0 ? triggerRefs.current[activeIndex] : null;

    if (!trigger) {
      indicator.style.opacity = "0";
      return;
    }

    const place = () => {
      const centre = trigger.offsetLeft + trigger.offsetWidth / 2;
      indicator.style.opacity = "1";
      indicator.style.transform = `translateX(${centre - INDICATOR_WIDTH / 2}px)`;
    };

    place();

    const list = navListRef.current;
    if (!list) return;
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeIndex]);

  // Focus trap, Escape-to-close, and body scroll lock — mobile menu only.
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const toggle = toggleRef.current;

    const getFocusable = (): HTMLElement[] => {
      const inPanel = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
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

  const panelIdBase = useId();
  const openMenuIndex = site.navMenus.findIndex((menu) => menu.label === openLabel);

  const dropdownHandlers = {
    openLabel,
    onPointerEnter: onDropdownPointerEnter,
    onPointerLeave: onDropdownPointerLeave,
    onTriggerClick,
    close: closeDropdown,
  };

  // Solid when scrolled, while the mobile menu is open, or while a dropdown is
  // open — a transparent bar floating over an opaque panel looks broken.
  const solid = scrolled || open || openLabel !== null;

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
            <span className="text-xl font-semibold tracking-tight">{site.name}</span>
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul ref={navListRef} className="relative flex items-center gap-8 pb-1">
              {site.navMenus.map((menu, index) => (
                <li key={menu.label}>
                  <NavTrigger
                    menu={menu}
                    isActive={index === activeIndex}
                    panelId={`${panelIdBase}-${index}`}
                    handlers={dropdownHandlers}
                    triggerRef={(node) => {
                      triggerRefs.current[index] = node;
                    }}
                    buttonRef={(node) => {
                      triggerButtons.current[index] = node;
                    }}
                  />
                </li>
              ))}

              {site.navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`rounded-sm text-[0.9375rem] font-medium transition-colors duration-[var(--duration-fast)] ${
                      pathname === link.href ? "text-ink" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

              <span
                ref={indicatorRef}
                aria-hidden="true"
                style={{ width: INDICATOR_WIDTH, opacity: 0 }}
                className="absolute bottom-0 left-0 h-0.5 rounded-full bg-signal transition-[transform,opacity] duration-[var(--duration-base)] ease-out-expo"
              />
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
          The open dropdown panel, rendered here rather than inside the nav
          list. <header> is `sticky`, so it is a positioned, full-width
          ancestor — which is what lets the panel take a sensible width. Inside
          the list it inherited the ~350px nav <ul> and every column collapsed.
        */}
        {openMenuIndex >= 0 && (
          <NavPanel
            menu={site.navMenus[openMenuIndex]}
            panelId={`${panelIdBase}-${openMenuIndex}`}
            handlers={dropdownHandlers}
            returnFocusTo={() => triggerButtons.current[openMenuIndex] ?? null}
          />
        )}

        {/*
          Rendered only while open, so the menu's links are never in the tab
          order while hidden — the most common keyboard bug in a mobile nav.
        */}
        {open && (
          <div
            id="mobile-menu"
            ref={panelRef}
            className="fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto border-t border-line bg-void md:hidden motion-safe:animate-[menu-in_var(--duration-base)_var(--ease-out-expo)]"
          >
            <nav aria-label="Mobile" className="px-gutter py-8">
              {/* The dropdowns become accordion groups. Same disclosure
                  semantics as the desktop panels — aria-expanded on a button,
                  and the region unmounted while collapsed so its links stay
                  out of the tab order. */}
              <ul className="flex flex-col">
                {site.navMenus.map((menu) => {
                  const expanded = openGroup === menu.label;
                  return (
                    <li key={menu.label} className="border-b border-line">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setOpenGroup(expanded ? null : menu.label)}
                        className="flex w-full items-center justify-between py-4 text-h3 text-ink"
                      >
                        {menu.label}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          aria-hidden="true"
                          className={`h-4 w-4 text-signal transition-transform duration-[var(--duration-fast)] ease-precise ${
                            expanded ? "rotate-180" : ""
                          }`}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>

                      {expanded && (
                        <div className="pb-4">
                          {menu.kind === "services"
                            ? serviceCategories.map((category) => (
                                <div key={category.id} className="mb-5 last:mb-0">
                                  <h2 className="text-eyebrow font-mono uppercase text-signal">
                                    {category.label}
                                  </h2>
                                  <ul className="mt-2 flex flex-col">
                                    {servicesByCategory(category.id).map((service) => (
                                      <li key={service.slug}>
                                        <Link
                                          href={`/services/${service.slug}`}
                                          onClick={() => closeMenu(false)}
                                          className="flex items-center gap-3 py-2.5 text-label text-ink-muted"
                                        >
                                          <IconTile name={service.icon} />
                                          {service.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))
                            : menu.items.map((item) => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => closeMenu(false)}
                                  className="flex items-center gap-3 py-2.5 text-label text-ink-muted"
                                >
                                  <IconTile name={item.icon} />
                                  {item.label}
                                </Link>
                              ))}
                        </div>
                      )}
                    </li>
                  );
                })}

                {site.navLinks.map((link) => (
                  <li key={link.href} className="border-b border-line">
                    <Link
                      href={link.href}
                      onClick={() => closeMenu(false)}
                      className="block py-4 text-h3 text-ink"
                    >
                      {link.label}
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
