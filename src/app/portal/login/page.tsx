import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/site/auth-shell";
import { Logo } from "@/components/site/logo";
import { NOINDEX } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";
import { getCurrentClientUser } from "@/server/auth/client-session";
import { getPublicSettings, getSiteMedia } from "@/server/dal/public/site";

import { ClientLoginForm } from "./client-login-form";

export const metadata: Metadata = { title: "Client portal sign in", ...NOINDEX };

export default async function ClientLoginPage() {
  if (await getCurrentClientUser()) redirect("/portal");
  const [{ general }, media] = await Promise.all([getPublicSettings(), getSiteMedia()]);
  const wa = whatsappLink(general.whatsapp, general.whatsappMessage);
  return (
    <AuthShell
      brand={<Logo name={general.siteName} logo={media.logo} />}
      title="Client portal"
      description="Message the team, follow your conversations and share feedback on our work."
      footer={
        <>
          Accounts are created by our team for active clients.{" "}
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
              Need access? Message us on WhatsApp.
            </a>
          ) : (
            <Link href="/contact" className="font-medium text-accent hover:underline">
              Need access? Contact us.
            </Link>
          )}
        </>
      }
    >
      <ClientLoginForm />
    </AuthShell>
  );
}
