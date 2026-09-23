"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { IconTile } from "@/components/ui/icons";
import { serviceCategories, servicesByCategory } from "@/content/services";
import { site } from "@/content/site";
import type { NavMenu } from "@/content/site";

/**
 * How the panel is positioned, and why it is not rendered inside the trigger.
 *
 * The panel used to live inside the trigger's `<li>`, with `absolute
 * inset-x-0`. Its nearest positioned ancestor was the nav `<ul>` — which is
 * `relative` so the active indicator can be placed against it — and that `ul`
 * is only as wide as the links. So the panel inherited a ~350px box, three
 * columns fought over it, and every description wrapped one word per line.
 *
 * The trigger and the panel are therefore separate components. The panel is
 * rendered by the Header as a direct child of `<header>`, which is `sticky`
 * and therefore a positioned, full-width ancestor. It then takes an explicit
 * clamped width of its own.
 *
 * `fixed` would have worked too, but only by accident: `backdrop-filter` on
 * the header creates a containing block for fixed descendants, so a `fixed`
 * panel would resolve against the viewport or the header depending on whether
 * the header happened to be in its solid state. Absolute against a known
 * positioned ancestor has no such ambiguity.
 */
const PANEL_WIDTH = "w-[min(56rem,calc(100vw-2rem))]";

export type DropdownHandlers = {
  openLabel: string | null;
  /** Pointer entered the trigger or the panel — cancel any pending close. */
  onPointerEnter: (label: string) => void;
  /** Pointer left the trigger or the panel — schedule a close. */
  onPointerLeave: () => void;
  /** Click on the trigger. Never closes a panel opened by hover. */
  onTriggerClick: (label: string) => void;
  close: () => void;
};

export function NavTrigger({
  menu,
  isActive,
  panelId,
  handlers,
  triggerRef,
  buttonRef,
}: {
  menu: NavMenu;
  isActive: boolean;
  panelId: string;
  handlers: DropdownHandlers;
  triggerRef: (node: HTMLElement | null) => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
}) {
  const open = handlers.openLabel === menu.label;

  return (
    <button
      ref={(node) => {
        triggerRef(node);
        buttonRef(node);
      }}
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      onPointerEnter={() => handlers.onPointerEnter(menu.label)}
      onPointerLeave={handlers.onPointerLeave}
      onClick={() => handlers.onTriggerClick(menu.label)}
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
  );
}

export function NavPanel({
  menu,
  panelId,
  handlers,
  returnFocusTo,
}: {
  menu: NavMenu;
  panelId: string;
  handlers: DropdownHandlers;
  /** Focused again when Escape closes the panel. */
  returnFocusTo: () => HTMLButtonElement | null;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { close } = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
      returnFocusTo()?.focus();
    };

    // A click outside closes. The trigger is outside the panel, so its own
    // click handler runs too — `onTriggerClick` is what stops those two
    // fighting each other.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (returnFocusTo()?.contains(target)) return;
      close();
    };

    // Tabbing out of the panel closes it.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (returnFocusTo()?.contains(target)) return;
      close();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [close, returnFocusTo]);

  return (
    <div
      id={panelId}
      ref={panelRef}
      onPointerEnter={() => handlers.onPointerEnter(menu.label)}
      onPointerLeave={handlers.onPointerLeave}
      className={`absolute top-[calc(100%+0.5rem)] left-1/2 z-50 -translate-x-1/2 overflow-hidden rounded-card border border-line-interactive bg-surface shadow-2xl shadow-void/80 motion-safe:animate-[menu-in_var(--duration-base)_var(--ease-out-expo)] ${PANEL_WIDTH}`}
    >
      <div className="p-7">
        {menu.kind === "services" ? (
          <>
            <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-3">
              {serviceCategories.map((category) => (
                <div key={category.id}>
                  <h2 className="text-eyebrow font-mono uppercase text-signal">
                    {category.label}
                  </h2>
                  <ul className="mt-3 flex flex-col gap-0.5">
                    {servicesByCategory(category.id).map((service) => (
                      <li key={service.slug}>
                        <Link
                          href={`/services/${service.slug}`}
                          onClick={close}
                          className="lift flex gap-3 rounded-field border border-transparent p-2.5"
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

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-5">
              <span className="text-label text-ink-subtle">
                {site.servicesMenuFooter.prompt}
              </span>
              <Link
                href={site.servicesMenuFooter.href}
                onClick={close}
                className="rounded-sm text-label font-medium text-signal transition-colors duration-[var(--duration-fast)] hover:text-signal-dim"
              >
                {site.servicesMenuFooter.label} →
              </Link>
            </div>
          </>
        ) : (
          <ul className="grid grid-cols-1 gap-1 md:grid-cols-3">
            {menu.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="lift flex h-full gap-3 rounded-field border border-transparent p-2.5"
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
  );
}
