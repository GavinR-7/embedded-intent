import { CategoryPage, categoryMetadata } from "@/components/category/CategoryPage";

export const metadata = categoryMetadata("get-found");

export default function GetFoundPage() {
  return <CategoryPage slug="get-found" />;
}
