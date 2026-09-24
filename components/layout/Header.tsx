"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { IconTile } from "@/components/ui/icons";
import { activeMenuIndex, navMenus } from "@/content/nav";
import { site } from "@/content/site";

import { NavTab } from "./NavDropdown";

/**
 * Elements that can receive keyboard focus, for the mobile menu's focus trap.
 * Kept narrow on purpose — the menu only ever contains links and buttons.
 */
const FOCUSABLE_SELECTOR = "a[href], button:not([disabled])";

/**
 * Matches Tailwind's `lg` breakpoint (--breakpoint-lg: 64rem).
 *
 * `md` until Phase 7. Five tabs plus a CTA do not fit in 768px — they either
 * wrap onto a second line or push the CTA off the end, and both look broken.
 * The number is here and in the `lg:` prefixes on the nav, the CTA and the
 * toggle; all four have to agree, or the menu button disappears while the nav
 * is still hidden.
 */
const DESKTOP_QUERY = "(min-width: 64rem)";

/** Width of the active-nav underline, in px. Constant, so the indicator only
 *  ever animates `transform` — never `width`, which would be layout. */
const INDICATOR_WIDTH = 20;

/**
 * Opening is delayed so brushing past a tab on the way somewhere else does not
 * flash a menu open. Closing is delayed longer, so crossing the 12px gap from
 * the tab down into the panel — which briefly leaves both — does not snatch it
 * away mid-movement.
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
  /*
   * Whether the dropdown panels and the mobile sheet exist in the document yet.
   *
   * They are mounted on the first pointer or focus anywhere in the header, and
   * never unmounted after that. Four panels plus the sheet is roughly a hundred
   * DOM nodes — links, descriptions, icon SVGs — that are invisible until
   * someone opens a menu, and hydrating them on every page load cost 0.6s of
   * simulated LCP on mobile. Priming on `pointerenter`/`focusin` rather than on
   * a click means they are always there before anyone can operate a control:
   * a pointer has to arrive before it can click, and a keyboard has to focus
   * before it can press Enter.
   */
  const [navPrimed, setNavPrimed] = useState(false);
  const prime = useCallback(() => setNavPrimed(true), []);

  const [openMenuState, setOpenMenuState] = useState<{
    label: string;
    path: string;
    /**
     * How the panel came to be open.
     *
     * Without this, hover-open followed by a click toggled the panel shut:
     * the pointer opened it, then the click saw `open === true` and closed it,
     * so clicking the chevron dismissed the menu you were trying to use. A
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

  /** Pointer entered a tab or its panel. */
  const onDropdownPointerEnter = useCallback(
    (label: string) => {
      prime();
      // Cancels any pending close, which is what makes the trip from tab to
      // panel across the gap survivable.
      clearTimers();
      openTimer.current = setTimeout(
        () =>
          setOpenMenuState((current) => {
            // Already open for this menu: keep the existing source. Otherwise
            // moving the pointer around inside a click-opened panel would
            // quietly downgrade it to hover-opened, and the next click on the
            // chevron would behave differently than the one before it.
            if (current?.label === label && current.path === pathname) return current;
            return { label, path: pathname, source: "hover" };
          }),
        OPEN_DELAY_MS,
      );
    },
    [clearTimers, pathname, prime],
  );

  const onDropdownPointerLeave = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpenMenuState(null), CLOSE_DELAY_MS);
  }, [clearTimers]);

  const onTriggerClick = useCallback(
    (label: string) => {
      prime();
      clearTimers();
      setOpenMenuState((current) => {
        const showing = current?.label === label && current.path === pathname;
        // A click closes only what a click opened. After a hover-open, the
        // click promotes it to click-opened and the panel stays put.
        if (showing && current?.source === "click") return null;
        return { label, path: pathname, source: "click" };
      });
    },
    [clearTimers, pathname, prime],
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
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const navListRef = useRef<HTMLUListElement | null>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const chevronRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
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

  // The mobile menu is hidden at lg and up. If the viewport widens while it is
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
   * Which tab owns which route is a content question — a category owns its own
   * page and every service page inside it — so it is answered in
   * content/nav.ts and read here.
   */
  const activeIndex = activeMenuIndex(pathname);

  /*
   * Move the underline. Written imperatively against a ref rather than through
   * state: the position is derived from layout, and putting a measured pixel
   * value into state would re-render the header to move one 20px bar. Only
   * `transform` and `opacity` are touched, so it never triggers layout.
   */
  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    const tab = activeIndex >= 0 ? tabRefs.current[activeIndex] : null;

    if (!tab) {
      indicator.style.opacity = "0";
      return;
    }

    const place = () => {
      const center = tab.offsetLeft + tab.offsetWidth / 2;
      indicator.style.opacity = "1";
      indicator.style.transform = `translateX(${center - INDICATOR_WIDTH / 2}px)`;
    };

    place();

    const list = navListRef.current;
    if (!list) return;
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeIndex]);

  const openMenuIndex = navMenus.findIndex((menu) => menu.label === openLabel);

  /*
   * Escape, click-outside and focus-out for the open dropdown.
   *
   * One effect in the Header rather than one per panel: every panel is now
   * mounted all the time (so it can animate out), and four panels each adding
   * three document listeners would mean twelve listeners for one open menu.
   */
  useEffect(() => {
    if (openMenuIndex < 0) return;

    const panel = panelRefs.current[openMenuIndex];
    const chevron = chevronRefs.current[openMenuIndex];

    const isInside = (target: Node) =>
      Boolean(panel?.contains(target)) || Boolean(chevron?.contains(target));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDropdown();
      chevron?.focus();
    };

    // A click outside closes. The chevron is outside the panel, so its own
    // click handler runs too — `onTriggerClick` is what stops those two
    // fighting each other.
    const onPointerDown = (event: PointerEvent) => {
      if (isInside(event.target as Node)) return;
      closeDropdown();
    };

    // Tabbing out of the panel closes it.
    const onFocusIn = (event: FocusEvent) => {
      if (isInside(event.target as Node)) return;
      closeDropdown();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [openMenuIndex, closeDropdown]);

  // Focus trap, Escape-to-close, and body scroll lock — mobile menu only.
  useEffect(() => {
    if (!open) return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    const toggle = toggleRef.current;

    const getFocusable = (): HTMLElement[] => {
      const inSheet = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      return toggle ? [toggle, ...inSheet] : inSheet;
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

      {/*
        The header carries NO backdrop-filter, background or border of its own.

        `backdrop-filter` (like `transform` and `filter`) makes an element the
        containing block for `position: fixed` descendants. The mobile sheet
        below is fixed with `top-20 bottom-0`; with the blur on <header> those
        offsets resolved against the 81px header instead of the viewport, so
        the sheet rendered 390x1 and mobile visitors could not navigate at all.
        `position: sticky` alone does not cause this — only the blur did.

        So the chrome lives on an absolutely-positioned sibling layer instead.
        The fixed sheet is not a descendant of that layer, so nothing traps it,
        while each dropdown panel's `absolute` positioning still resolves
        against its own tab as before.
      */}
      <header
        /*
          One pair of handlers for the whole bar, rather than per control. Any
          pointer entering the header, or any focus landing in it, is enough
          warning that a menu might be wanted.
        */
        onPointerEnter={prime}
        onFocus={prime}
        className="sticky top-0 z-50"
      >
        <div
          aria-hidden="true"
          className={`absolute inset-0 -z-10 border-b transition-[background-color,border-color,backdrop-filter] duration-[var(--duration-base)] ease-precise ${
            solid
              ? "border-line bg-void/85 backdrop-blur-md"
              : "border-transparent bg-transparent"
          }`}
        />

        <div className="mx-auto flex h-20 max-w-content items-center justify-between gap-4 px-gutter">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-sm text-ink transition-colors duration-[var(--duration-fast)] hover:text-signal"
            onClick={() => closeMenu(false)}
          >
            <ChipMark className="h-9 w-9 text-signal" />
            <span className="text-xl font-semibold tracking-tight">{site.name}</span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul ref={navListRef} className="relative flex items-center gap-5 pb-1 xl:gap-8">
              {navMenus.map((menu, index) => (
                <li key={menu.label}>
                  <NavTab
                    menu={menu}
                    isActive={index === activeIndex}
                    panelId={`${panelIdBase}-${index}`}
                    primed={navPrimed}
                    handlers={dropdownHandlers}
                    tabRef={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    buttonRef={(node) => {
                      chevronRefs.current[index] = node;
                    }}
                    panelRef={(node) => {
                      panelRefs.current[index] = node;
                    }}
                  />
                </li>
              ))}

              {site.navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`rounded-sm text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-[var(--duration-fast)] ${
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
            className="cta-sheen group hidden items-center gap-2 rounded-field bg-signal px-4 py-2 text-label font-semibold whitespace-nowrap text-void transition-colors duration-[var(--duration-fast)] hover:bg-signal-dim lg:inline-flex"
          >
            {site.primaryCta.label}
            <span aria-hidden="true" className="cta-arrow">
              →
            </span>
          </Link>

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={navPrimed ? "mobile-menu" : undefined}
            aria-label={open ? "Close menu" : "Open menu"}
            onPointerDown={prime}
            onClick={() => (open ? closeMenu(true) : openMenu())}
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-field text-ink transition-colors duration-[var(--duration-fast)] hover:bg-surface-raised lg:hidden"
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
          The `lg:hidden` lives on this wrapper, not on the sheet.

          `menu-pop` sets `display: block` from an attribute selector, which is
          more specific than `.lg\:hidden` and would win at desktop widths no
          matter what order the rules are in. Hiding an ancestor sidesteps the
          specificity fight entirely, and a plain <div> between the header and
          a `fixed` child changes nothing about how the child is positioned.
        */}
        <div className="lg:hidden">
          {navPrimed && (
          <div
            id="mobile-menu"
            ref={sheetRef}
            data-open={open ? "" : undefined}
            className="menu-pop fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto border-t border-line bg-void"
          >
            <nav aria-label="Mobile" className="px-gutter py-8">
              {/* The dropdowns become accordion groups. Same disclosure
                  semantics as the desktop panels — aria-expanded on a button,
                  and the region unmounted while collapsed so its links stay
                  out of the tab order. */}
              <ul className="flex flex-col">
                {navMenus.map((menu) => {
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
                        <ul className="flex flex-col pb-4">
                          {/* The category page itself comes first. Without it
                              the only way to reach /websites on a phone is to
                              guess the URL — the tab that links to it on
                              desktop is a plain accordion button here. */}
                          <li>
                            <Link
                              href={menu.footer.allHref}
                              onClick={() => closeMenu(false)}
                              className="block py-2.5 text-label font-medium text-signal"
                            >
                              {menu.footer.allLabel} →
                            </Link>
                          </li>

                          {menu.items.map((item) => (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => closeMenu(false)}
                                className="flex items-center gap-3 py-2.5 text-label text-ink-muted"
                              >
                                <IconTile name={item.icon} />
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
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
        </div>
      </header>
    </>
  );
}
