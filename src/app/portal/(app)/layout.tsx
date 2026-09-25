import { Suspense } from "react";
import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";

import { Logo } from "@/components/site/logo";
import { NavigationLoader } from "@/components/site/navigation-loader";
import { NOINDEX } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";
import { requireClient } from "@/server/auth/client-session";
import { getPublicSettings, getSiteMedia } from "@/server/dal/public/site";

export const metadata: Metadata = { title: { default: "Client portal", template: "%s · Client portal" }, ...NOINDEX };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  const [{ general }, media] = await Promise.all([getPublicSettings(), getSiteMedia()]);
  const wa = whatsappLink(general.whatsapp, general.whatsappMessage);
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/portal" aria-label="Portal home">
            <Logo name={general.siteName} logo={media.logo} />
          </Link>
          <nav aria-label="Portal" className="hidden items-center gap-1 text-sm sm:flex">
            <Link href="/portal" className="rounded-control px-3 py-2 text-muted hover:text-fg">Conversations</Link>
            <Link href="/portal/messages/new" className="rounded-control px-3 py-2 text-muted hover:text-fg">New message</Link>
            <Link href="/portal/feedback" className="rounded-control px-3 py-2 text-muted hover:text-fg">Feedback</Link>
          </nav>
          <div className="flex items-center gap-2">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-button border border-success/40 px-3 py-2 text-xs font-medium text-success hover:bg-success-soft md:inline-flex">
                <MessageCircle aria-hidden className="size-4" /> WhatsApp
              </a>
            ) : null}
            <form action="/auth/signout" method="post">
              <button type="submit" className="rounded-control border border-border px-3 py-2 text-xs text-muted hover:text-fg">Sign out</button>
            </form>
          </div>
        </div>
        <nav aria-label="Portal (mobile)" className="container-page flex gap-1 pb-2 text-sm sm:hidden">
          <Link href="/portal" className="rounded-control px-3 py-2 text-muted hover:text-fg">Conversations</Link>
          <Link href="/portal/messages/new" className="rounded-control px-3 py-2 text-muted hover:text-fg">New</Link>
          <Link href="/portal/feedback" className="rounded-control px-3 py-2 text-muted hover:text-fg">Feedback</Link>
        </nav>
      </header>
      <main id="main" className="container-page py-10">
        <p className="mb-6 text-sm text-subtle">
          Signed in as <span className="text-muted">{user.fullName || user.email}</span> · {user.companyName}
        </p>
        {children}
      </main>
      <Suspense fallback={null}>
        <NavigationLoader siteName={general.siteName} logoUrl={media.logo?.url ?? null} />
      </Suspense>
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </div>
  );
}
