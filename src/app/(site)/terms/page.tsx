import { LegalPage, legalMetadata } from "@/components/site/legal-page";

export const revalidate = 3600;

export function generateMetadata() {
  return legalMetadata("terms", "Terms of Service");
}

export default function Page() {
  return <LegalPage slug="terms" />;
}
