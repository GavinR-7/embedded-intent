import { LegalPage } from "@/components/legal/LegalPage";
import { terms } from "@/content/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms",
  description: terms.sub,
  path: "/terms",
});

/**
 * /terms — the audit, the written agreement, the payment split, the texts.
 *
 * Same shape as /privacy: copy in content/legal.ts, layout in
 * components/legal/LegalPage.tsx.
 */
export default function TermsPage() {
  return <LegalPage doc={terms} />;
}
