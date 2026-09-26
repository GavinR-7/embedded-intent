"use client";

import Link from "next/link";

import { IconTile } from "@/components/ui/icons";
import type { ResolvedMenu } from "@/content/nav";

/**
 * One nav tab: a link, a chevron button, and the panel they open.
 *
 * ---------------------------------------------------------------------------
 * Why a tab is two controls
 *
 * The label is a `<Link>` and the chevron is a `<button>`. One control cannot
 * be both: a link that also opens a menu is a link you cannot follow, and a
 * button that navigates is a button screen readers announce wrong. Split, the
 * label goes to /websites and the chevron discloses what is inside it, and
 * each control says what it is.
 *
 * The pointer handlers sit on the wrapper rather than on either control, so
 * hovering anywhere on the tab opens the panel even though only the chevron
 * toggles on click. `pointerleave` does not fire when the pointer moves into a
 * descendant, so traveling from the tab into the panel — which is a DOM
 * child, however far away it is painted — never closes it. Only the 12px gap
 * between them leaves the wrapper, and the close delay in Header covers that.
 * ---------------------------------------------------------------------------
 *
 * Why the panel is sized by a constant
 *
 * It is absolute inside the tab, so it follows the tab horizontally, but its
 * width is stated here. An earlier version used `inset-x-0`, inherited the
 * ~350px nav `<ul>`, and wrapped every description one word per line. Position
 * from the tab, size from a constant.
 *
 * `translate` (what `-translate-x-1/2` sets in Tailwind v4) and `transform`
 * (what the open/close transition sets) are separate CSS properties, so the
 * centering and the 6px entrance compose instead of overwriting each other.
 */
const PANEL_WIDTH = "w-[min(24rem,calc(100vw-2rem))]";

export type DropdownHandlers = {
  openLabel: string | null;
  /** Pointer entered the tab or its panel — cancel any pending close. */
  onPointerEnter: (label: string) => void;
  /** Pointer left the tab and its panel — schedule a close. */
  onPointerLeave: () => void;
  /** Click on the chevron. Never closes a panel that hover opened. */
  onTriggerClick: (label: string) => void;
  /** Followed a link inside a panel. */
  close: () => void;
};

export function NavTab({
  menu,
  isActive,
  panelId,
  primed,
  handlers,
  tabRef,
  buttonRef,
  panelRef,
}: {
  menu: ResolvedMenu;
  isActive: boolean;
  panelId: string;
  /**
   * Whether the panel exists yet.
   *
   * False until the visitor first reaches for the nav — see `navPrimed` in
   * Header. Four panels' worth of links and icons is about a hundred DOM nodes
   * that hydrate on every page load and are invisible until someone opens a
   * menu; keeping them out until then cost 0.6s of simulated LCP on mobile.
   */
  primed: boolean;
  handlers: DropdownHandlers;
  /** The whole tab — what the active underline is centered on. */
  tabRef: (node: HTMLElement | null) => void;
  /** The chevron, for returning focus when Escape closes the panel. */
  buttonRef: (node: HTMLButtonElement | null) => void;
  /** The panel, for the outside-click and outside-focus checks. */
  panelRef: (node: HTMLDivElement | null) => void;
}) {
  const open = handlers.openLabel === menu.label;
  const tint = isActive || open ? "text-ink" : "text-ink-muted hover:text-ink";

  return (
    /*
      `relative` positions the panel. It does not affect where the active
      underline thinks this tab is: an element's own `offsetLeft` is measured
      from its `offsetParent`, which is the nearest *ancestor* with a position
      — the nav `<ul>` — and is unchanged by positioning the element itself.
    */
    <div
      ref={tabRef}
      onPointerEnter={() => handlers.onPointerEnter(menu.label)}
      onPointerLeave={handlers.onPointerLeave}
      className="relative flex items-center gap-1"
    >
      <Link
        href={menu.href}
        className={`rounded-sm text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-[var(--duration-fast)] ${tint}`}
      >
        {menu.label}
      </Link>

      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        /* Only while the panel is really in the document. `aria-controls`
           pointing at an id that does not exist is a broken relationship, and
           priming happens on the first pointer or focus anywhere in the header —
           so by the time anyone can operate this button, it is correct. */
        aria-controls={primed ? panelId : undefined}
        /* The link beside it is already called "Websites", so this button's
           accessible name has to say what *it* does — otherwise a screen
           reader announces two controls with the same name. */
        aria-label={`${menu.label} submenu`}
        onClick={() => handlers.onTriggerClick(menu.label)}
        className={`flex h-6 w-5 items-center justify-center rounded-sm transition-colors duration-[var(--duration-fast)] ${tint}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className={`h-3 w-3 transition-transform duration-[var(--duration-fast)] ease-precise ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/*
        Mounted from the first contact with the nav, and then never unmounted.

        Both halves matter. Not unmounting is what gives an exit animation at
        all: a panel React has removed has nothing left to animate, so
        `display` does the hiding instead — the `menu-pop` utility transitions
        it with `allow-discrete`, and `display: none` keeps every link out of
        the tab order while closed, which is the one thing a hidden menu has to
        get right. Not mounting until needed is what keeps a hundred hidden DOM
        nodes out of the page load.
      */}
      {primed && (
        <div
          id={panelId}
          ref={panelRef}
          data-open={open ? "" : undefined}
          className={`menu-pop absolute top-[calc(100%+0.75rem)] left-1/2 z-50 -translate-x-1/2 overflow-hidden rounded-card border border-line-interactive bg-surface shadow-2xl shadow-void/80 ${PANEL_WIDTH}`}
        >
          <ul className="flex flex-col gap-0.5 p-3">
            {menu.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handlers.close}
                  className="lift spotlight flex gap-3 rounded-field border border-transparent p-2.5"
                >
                  <IconTile name={item.icon} />
                  <span className="min-w-0">
                    <span className="block text-label font-medium text-ink">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-label text-ink-subtle">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-5 py-3.5">
            <Link
              href={menu.footer.allHref}
              onClick={handlers.close}
              className="rounded-sm text-label font-medium text-signal transition-colors duration-[var(--duration-fast)] hover:text-signal-dim"
            >
              {menu.footer.allLabel} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
