import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Assistant } from "@/components/site/assistant/assistant";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { JsonLd } from "@/components/site/json-ld";
import { NavigationLoader } from "@/components/site/navigation-loader";
import { RevealObserver } from "@/components/site/reveal-observer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { serverEnv } from "@/lib/env";
import { localBusinessLd, organizationLd, websiteLd } from "@/lib/jsonld";
import { whatsappLink } from "@/lib/whatsapp";
import { getNavigation, getPublicSettings, getSiteMedia } from "@/server/dal/public/site";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, nav, media] = await Promise.all([getPublicSettings(), getNavigation(), getSiteMedia()]);
  const { general, social } = settings;
  const wa = whatsappLink(general.whatsapp, general.whatsappMessage);
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader siteName={general.siteName} logo={media.logo} logoDark={media.logoDark} links={nav.header} />
      <main id="main" tabIndex={-1} className="pt-[calc(var(--header-h)+max(0.75rem,env(safe-area-inset-top)))] outline-none">
        {children}
      </main>
      <SiteFooter
        siteName={general.siteName}
        tagline={general.tagline}
        logo={media.logo}
        logoDark={media.logoDark}
        links={nav.footer}
        legal={nav.legal}
        social={social.links}
        email={general.contactEmail}
        phone={general.phone}
        whatsapp={wa}
        location={general.location}
      />
      {wa ? <WhatsAppButton href={wa} /> : null}
      {settings.assistant.enabled && serverEnv().mistralApiKey ? (
        <Assistant greeting={settings.assistant.greeting} siteName={general.siteName} hasWhatsapp={Boolean(wa)} />
      ) : null}
      <RevealObserver />
      <Suspense fallback={null}>
        <NavigationLoader siteName={general.siteName} logoUrl={media.logo?.url ?? null} />
      </Suspense>
      <JsonLd
        data={[
          organizationLd({
            name: general.siteName,
            description: general.description,
            logoUrl: media.logo?.url,
            sameAs: social.links.map((l) => l.url),
            email: general.contactEmail || undefined,
          }),
          websiteLd(general.siteName),
          localBusinessLd({
            name: general.siteName,
            description: general.description,
            logoUrl: media.logo?.url,
            email: general.contactEmail || undefined,
            phone: general.phone || undefined,
            address: general.address || general.location || undefined,
          }),
        ].filter((d): d is NonNullable<typeof d> => d !== null)}
      />
      {/* Vercel serves the analytics scripts; elsewhere they would 404. */}
      {process.env.VERCEL ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}
    </>
  );
}
