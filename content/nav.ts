/**
 * The primary nav, resolved.
 *
 * The nav is five tabs: one per service category, then Company, then Contact.
 * Three of those are generated from `content/categories.ts` and
 * `content/services.ts` rather than listed anywhere, so a new service appears
 * in the right dropdown, the right category page and the footer at once, and a
 * renamed category is renamed in the nav by the same edit.
 *
 * Everything the Header needs is precomputed here as plain data — labels,
 * hrefs, panel items, and the route prefixes each tab owns. The Header then
 * contains interaction only. Two reasons that split is worth a file:
 *
 *   - "which tab is underlined on this URL" is a content question (which
 *     services belong to which category), not a pointer-and-focus question,
 *     and it was the part most likely to silently go wrong.
 *   - `owns` is a list of strings rather than a predicate function, so the
 *     whole nav model can be read, logged and eyeballed without running it.
 */

import type { IconName } from "@/components/ui/icons";

import { categories, categoryHref } from "./categories";
import { servicesByCategory } from "./services";
import { site } from "./site";

export type NavPanelItem = {
  label: string;
  href: string;
  /** The line under the label in the dropdown. */
  description: string;
  icon: IconName;
};

export type ResolvedMenu = {
  label: string;
  /**
   * Where the tab's label goes when clicked.
   *
   * Every tab is two controls: the label is a link to a real page, and a
   * separate chevron button opens the dropdown. A tab that is only a
   * disclosure makes the category itself unreachable, which is the thing that
   * was wrong with the single Services tab this replaced.
   */
  href: string;
  items: readonly NavPanelItem[];
  /** The row under the panel items. */
  footer: { allLabel: string; allHref: string };
  /**
   * Route prefixes this tab owns, for the active underline.
   *
   * A category owns its own page *and* every service page inside it — being on
   * /services/online-booking-setup should underline Websites, which no prefix
   * of the URL can tell you. So the service routes are listed explicitly,
   * generated from the catalogue.
   */
  owns: readonly string[];
};

const categoryMenus: readonly ResolvedMenu[] = categories.map((category) => {
  const categoryServices = servicesByCategory(category.slug);

  return {
    label: category.label,
    href: categoryHref(category.slug),
    items: categoryServices.map((service) => ({
      label: service.name,
      href: `/services/${service.slug}`,
      description: service.promise,
      icon: service.icon,
    })),
    footer: {
      allLabel: `All ${category.label} services`,
      allHref: categoryHref(category.slug),
    },
    owns: [
      categoryHref(category.slug),
      ...categoryServices.map((service) => `/services/${service.slug}`),
    ],
  };
});

const companyMenu: ResolvedMenu = {
  label: site.companyMenu.label,
  href: site.companyMenu.href,
  items: site.companyMenu.items,
  footer: {
    allLabel: site.companyMenu.allLabel,
    allHref: site.companyMenu.href,
  },
  owns: site.companyMenu.owns,
};

export const navMenus: readonly ResolvedMenu[] = [...categoryMenus, companyMenu];

/**
 * Which tab owns this URL, or -1.
 *
 * `startsWith` rather than equality so /work/above-all-tent-rentals underlines
 * Company. The homepage matches nothing, which is correct — it belongs to no
 * tab.
 */
export function activeMenuIndex(pathname: string): number {
  return navMenus.findIndex((menu) =>
    menu.owns.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
}
