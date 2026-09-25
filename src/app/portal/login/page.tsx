import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

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
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <div aria-hidden className="bg-grid absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative w-full max-w-sm rounded-card border border-border bg-surface/80 p-6 shadow-card backdrop-blur sm:p-8">
        <Link href="/" className="mb-8 inline-block">
          <Logo name={general.siteName} logo={media.logo} />
        </Link>
        <h1 className="text-2xl font-semibold">Client portal</h1>
        <p className="mt-2 text-sm text-muted">Message the team, follow your conversations and share feedback on our work.</p>
        <div className="mt-8">
          <ClientLoginForm />
        </div>
        <p className="mt-6 text-xs text-subtle">
          Accounts are created by our team for active clients.{" "}
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Need access? Message us on WhatsApp.</a>
          ) : (
            <Link href="/contact" className="text-accent hover:underline">Need access? Contact us.</Link>
          )}
        </p>
      </div>
    </main>
  );
}
