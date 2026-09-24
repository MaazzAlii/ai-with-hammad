import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { JsonLd } from "@/components/site/json-ld";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { organizationLd, websiteLd } from "@/lib/jsonld";
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
        className="sr-only z-50 rounded-control bg-accent px-4 py-2 font-semibold text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader siteName={general.siteName} logo={media.logo} links={nav.header} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter
        siteName={general.siteName}
        tagline={general.tagline}
        logo={media.logo}
        links={nav.footer}
        legal={nav.legal}
        social={social.links}
        email={general.contactEmail}
        phone={general.phone}
        whatsapp={wa}
        location={general.location}
      />
      {wa ? <WhatsAppButton href={wa} /> : null}
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
        ]}
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
