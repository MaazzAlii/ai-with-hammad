import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { PrintButton } from "@/components/site/print-button";
import { Section } from "@/components/site/section";
import { AudienceBlock, hasAudienceData, CategoriesBlock, FormatsBlock, PartnersBlock, PlatformsBlock, TopContentBlock } from "@/components/site/sponsorship-sections";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { groupContent, listActivePlatforms, listPublishedContent } from "@/server/dal/public/content";
import { getPublicSettings, getSiteMedia } from "@/server/dal/public/site";
import { listPublishedPackages, listPublishedPartners } from "@/server/dal/public/sponsorship";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getPublicSettings();
  return buildMetadata({ title: "Media kit", description: `${general.siteName} media kit: brand, audience, platforms, top content, partnerships and collaboration types.`, path: "/media-kit" });
}

/**
 * Media kit is a sequence of self-contained, printable sections (print.css
 * rules in globals.css) so a PDF can be produced from this page later.
 */
export default async function MediaKitPage() {
  const [{ sponsorship: s, general }, media, platforms, content, packages, partners] = await Promise.all([
    getPublicSettings(),
    getSiteMedia(),
    listActivePlatforms(),
    listPublishedContent(),
    listPublishedPackages(),
    listPublishedPartners(),
  ]);
  const top = groupContent(content, "high-performing", 6).length ? groupContent(content, "high-performing", 6) : groupContent(content, "featured", 6);
  return (
    <div className="print-plain">
      <header>
        <div className="container-page flex flex-col gap-6 pt-12 pb-4 sm:flex-row sm:items-end sm:justify-between sm:pt-20 sm:pb-8">
          <div>
            <p className="eyebrow mb-3">Media kit · {new Date().getUTCFullYear()}</p>
            <h1 className="text-[2.5rem] sm:text-6xl">{general.siteName}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{general.tagline}</p>
          </div>
          <PrintButton />
        </div>
      </header>
      <Section aria-labelledby="mk-about">
        <div data-reveal="item" className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <p className="eyebrow mb-3">About</p>
            <h2 id="mk-about" className="text-[1.75rem] sm:text-[2.25rem]">Brand</h2>
            {media.logo ? <p className="mt-2 text-sm text-subtle">Logo available on request.</p> : null}
          </div>
          <div className="space-y-4 leading-relaxed text-muted md:pt-9">
            <p className="text-lg sm:text-xl">{general.description}</p>
            {s.intro ? <p>{s.intro}</p> : null}
          </div>
        </div>
      </Section>
      {hasAudienceData(s, platforms) ? <Section><AudienceBlock s={s} platforms={platforms} /></Section> : null}
      {platforms.length ? <Section className="print-break"><PlatformsBlock platforms={platforms} /></Section> : null}
      {s.contentCategories.length ? <Section><CategoriesBlock categories={s.contentCategories} /></Section> : null}
      {top.length ? <Section><TopContentBlock items={top} title="Top-performing content" /></Section> : null}
      {partners.length ? <Section className="print-break"><PartnersBlock partners={partners} /></Section> : null}
      {s.formats.length || packages.length ? <Section><FormatsBlock formats={s.formats} packages={packages} ratesNotice={s.ratesNotice} /></Section> : null}
      <Section aria-labelledby="mk-contact">
        <div className="glass-panel rounded-[2rem] p-8 sm:p-10">
          <h2 id="mk-contact" className="text-2xl sm:text-[2rem]">Contact</h2>
          <p className="mt-2 text-muted">{s.ratesNotice}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href="/sponsorship#inquiry" className={buttonVariants({ size: "lg", className: "no-print" })}>Send a partnership inquiry</Link>
            {general.contactEmail ? <a href={`mailto:${general.contactEmail}`} className="font-medium text-accent hover:underline">{general.contactEmail}</a> : null}
          </div>
        </div>
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Media kit", path: "/media-kit" }])} />
    </div>
  );
}
