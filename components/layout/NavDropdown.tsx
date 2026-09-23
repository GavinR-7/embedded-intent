"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef } from "react";

import { IconTile } from "@/components/ui/icons";
import { serviceCategories, servicesByCategory } from "@/content/services";
import { site } from "@/content/site";
import type { NavMenu } from "@/content/site";

/**
 * Opening is delayed so that brushing past a trigger on the way somewhere else
 * does not flash a menu open. Closing is delayed longer, so travelling
 * diagonally from the trigger down into the panel — which briefly leaves both
 * elements — does not snatch it away mid-movement.
 */
const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 200;

export type DropdownState = {
  openLabel: string | null;
  setOpenLabel: (label: string | null) => void;
};

/**
 * A nav dropdown: a disclosure, not a menubar.
 *
 * The trigger is a real `<button>` with `aria-expanded` and `aria-controls`,
 * and the panel is a plain region of links. That is deliberate — the ARIA
 * `menu`/`menuitem` pattern is for application menus and brings keyboard
 * expectations (arrow-key roving focus, type-ahead) that a list of page links
 * does not need and that hurt when half-implemented. Tab moves through the
 * links, which is what people expect of navigation.
 *
 * Open state is lifted to the Header so that only one panel is open at a time
 * and moving between triggers swaps them.
 */
export function NavDropdown({
  menu,
  isActive,
  state,
  triggerRef,
}: {
  menu: NavMenu;
  /** Whether the current route sits under this menu. */
  isActive: boolean;
  state: DropdownState;
  triggerRef: (node: HTMLButtonElement | null) => void;
}) {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = state.openLabel === menu.label;
  const { setOpenLabel } = state;

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  const scheduleOpen = useCallback(() => {
    clearTimers();
    openTimer.current = setTimeout(() => setOpenLabel(menu.label), OPEN_DELAY_MS);
  }, [clearTimers, menu.label, setOpenLabel]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpenLabel(null), CLOSE_DELAY_MS);
  }, [clearTimers, setOpenLabel]);

  useEffect(() => clearTimers, [clearTimers]);

  // Escape closes and hands focus back to the trigger; a click outside just
  // closes, since the click has already moved focus somewhere deliberate.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpenLabel(null);
      buttonRef.current?.focus();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenLabel(null);
    };

    // Tabbing out of the panel entirely should close it.
    const onFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenLabel(null);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open, setOpenLabel]);

  const closeNow = () => {
    clearTimers();
    setOpenLabel(null);
  };

  return (
    <div
      ref={containerRef}
      className="static"
      onPointerEnter={scheduleOpen}
      onPointerLeave={scheduleClose}
    >
      <button
        ref={(node) => {
          buttonRef.current = node;
          triggerRef(node);
        }}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          clearTimers();
          setOpenLabel(open ? null : menu.label);
        }}
        className={`flex items-center gap-1.5 rounded-sm text-[0.9375rem] font-medium transition-colors duration-[var(--duration-fast)] ${
          isActive || open ? "text-ink" : "text-ink-muted hover:text-ink"
        }`}
      >
        {menu.label}
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

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-20 z-40 border-y border-line bg-void/95 backdrop-blur-md motion-safe:animate-[menu-in_var(--duration-base)_var(--ease-out-expo)]"
        >
          <div className="mx-auto max-w-content px-gutter py-8">
            {menu.kind === "services" ? (
              <>
                <div className="grid gap-x-10 gap-y-8 md:grid-cols-3">
                  {serviceCategories.map((category) => (
                    <div key={category.id}>
                      <h2 className="text-eyebrow font-mono uppercase text-signal">
                        {category.label}
                      </h2>
                      <ul className="mt-4 flex flex-col gap-1">
                        {servicesByCategory(category.id).map((service) => (
                          <li key={service.slug}>
                            <Link
                              href={`/services/${service.slug}`}
                              onClick={closeNow}
                              className="lift flex gap-3 rounded-field border border-transparent p-3"
                            >
                              <IconTile name={service.icon} />
                              <span className="min-w-0">
                                <span className="block text-label font-medium text-ink">
                                  {service.name}
                                </span>
                                <span className="mt-1 block text-label text-ink-subtle">
                                  {service.promise}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-6">
                  <span className="text-label text-ink-subtle">
                    {site.servicesMenuFooter.prompt}
                  </span>
                  <Link
                    href={site.servicesMenuFooter.href}
                    onClick={closeNow}
                    className="rounded-sm text-label font-medium text-signal transition-colors duration-[var(--duration-fast)] hover:text-signal-dim"
                  >
                    {site.servicesMenuFooter.label} →
                  </Link>
                </div>
              </>
            ) : (
              <ul className="grid gap-1 sm:max-w-md">
                {menu.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeNow}
                      className="lift flex gap-3 rounded-field border border-transparent p-3"
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
