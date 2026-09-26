import { Suspense } from "react";
import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PortalNav } from "@/components/portal/portal-nav";
import { LogoMark } from "@/components/site/logo";
import { NavigationLoader } from "@/components/site/navigation-loader";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AppToaster } from "@/components/ui/app-toaster";
import { NOINDEX } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";
import { requireClient } from "@/server/auth/client-session";
import { getPublicSettings, getSiteMedia } from "@/server/dal/public/site";

export const metadata: Metadata = { title: { default: "Client portal", template: "%s · Client portal" }, ...NOINDEX };

/** Signed-in, per-user screens: never prerender or cache (always fresh data, never a baked-in redirect). */
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  const [{ general }, media] = await Promise.all([getPublicSettings(), getSiteMedia()]);
  const wa = whatsappLink(general.whatsapp, general.whatsappMessage);
  return (
    <div className="min-h-dvh">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="container-page">
          <div className="glass-chrome pointer-events-auto mx-auto flex h-(--header-h) max-w-5xl items-center justify-between gap-3 rounded-full px-2">
            <Link href="/portal" aria-label="Portal home" className="pressable flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1">
              <LogoMark name={general.siteName} logo={media.logo} />
              <span className="hidden text-[0.9375rem] font-semibold tracking-tight md:inline">Client portal</span>
            </Link>
            <PortalNav className="hidden sm:block" />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden md:inline-flex" })}>
                  <MessageCircle aria-hidden /> WhatsApp
                </a>
              ) : null}
              <form action="/auth/signout" method="post">
                <button type="submit" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <PortalNav label="Portal (mobile)" className="glass-chrome pointer-events-auto mx-auto mt-2 max-w-md sm:hidden" />
        </div>
      </header>
      <main id="main" className="container-page pt-[calc(var(--header-h)+max(0.75rem,env(safe-area-inset-top))+5.5rem)] pb-16 sm:pt-[calc(var(--header-h)+max(0.75rem,env(safe-area-inset-top))+2.5rem)]">
        <p className="mb-8 text-sm text-subtle">
          Signed in as <span className="font-medium text-muted">{user.fullName || user.email}</span> · {user.companyName}
        </p>
        {children}
      </main>
      <Suspense fallback={null}>
        <NavigationLoader siteName={general.siteName} logoUrl={media.logo?.url ?? null} />
      </Suspense>
      <AppToaster />
    </div>
  );
}
