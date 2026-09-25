import { LegalPage, legalMetadata } from "@/components/site/legal-page";

export const revalidate = 3600;

export function generateMetadata() {
  return legalMetadata("privacy-policy", "Privacy Policy");
}

export default function Page() {
  return <LegalPage slug="privacy-policy" />;
}
