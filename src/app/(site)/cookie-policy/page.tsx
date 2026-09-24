import { LegalPage, legalMetadata } from "@/components/site/legal-page";

export const revalidate = 3600;

export function generateMetadata() {
  return legalMetadata("cookie-policy", "Cookie Policy");
}

export default function Page() {
  return <LegalPage slug="cookie-policy" />;
}
