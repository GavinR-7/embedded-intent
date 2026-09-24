import { CategoryPage, categoryMetadata } from "@/components/category/CategoryPage";

/*
 * A static route with static content, so `metadata` rather than
 * `generateMetadata`: there is no `params` to await and nothing to fetch, and
 * Next evaluates the object once at build instead of calling a function. The
 * helper is shared by all three category routes so their tags cannot drift.
 */
export const metadata = categoryMetadata("websites");

export default function WebsitesPage() {
  return <CategoryPage slug="websites" />;
}
