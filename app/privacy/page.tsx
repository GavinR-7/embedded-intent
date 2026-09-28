import { LegalPage } from "@/components/legal/LegalPage";
import { privacy } from "@/content/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy",
  description: privacy.sub,
  path: "/privacy",
});

/**
 * /privacy — what the form collects and what happens to it.
 *
 * Four lines, like the category routes: the copy is content/legal.ts and the
 * layout is components/legal/LegalPage.tsx, which /terms uses as well. The
 * header of the content module is the one worth reading before editing either.
 */
export default function PrivacyPage() {
  return <LegalPage doc={privacy} />;
}
