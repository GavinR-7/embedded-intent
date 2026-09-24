import { CategoryPage, categoryMetadata } from "@/components/category/CategoryPage";

export const metadata = categoryMetadata("ai-automation");

export default function AiAutomationPage() {
  return <CategoryPage slug="ai-automation" />;
}
