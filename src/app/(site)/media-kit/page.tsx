import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { PrintButton } from "@/components/site/print-button";
import { Section } from "@/components/site/section";
import { AudienceBlock, CategoriesBlock, FormatsBlock, PartnersBlock, PlatformsBlock, TopContentBlock } from "@/components/site/sponsorship-sections";
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
      <header className="border-b border-border">
        <div className="container-page flex flex-col gap-6 py-14 sm:flex-row sm:items-end sm:justify-between sm:py-20">
          <div>
            <p className="eyebrow mb-3">Media kit · {new Date().getUTCFullYear()}</p>
            <h1 className="text-4xl font-semibold sm:text-5xl">{general.siteName}</h1>
            <p className="mt-3 max-w-2xl text-lg text-muted">{general.tagline}</p>
          </div>
          <PrintButton />
        </div>
      </header>
      <Section aria-labelledby="mk-about">
        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow mb-3">About</p>
            <h2 id="mk-about" className="text-2xl font-semibold">Brand</h2>
            {media.logo ? <p className="mt-2 text-sm text-subtle">Logo available on request.</p> : null}
          </div>
          <div className="space-y-4 text-muted">
            <p className="text-lg">{general.description}</p>
            {s.intro ? <p>{s.intro}</p> : null}
          </div>
        </div>
      </Section>
      <Section className="border-t border-border"><AudienceBlock s={s} platforms={platforms} /></Section>
      {platforms.length ? <Section className="border-t border-border print-break"><PlatformsBlock platforms={platforms} /></Section> : null}
      {s.contentCategories.length ? <Section className="border-t border-border"><CategoriesBlock categories={s.contentCategories} /></Section> : null}
      {top.length ? <Section className="border-t border-border"><TopContentBlock items={top} title="Top-performing content" /></Section> : null}
      {partners.length ? <Section className="border-t border-border print-break"><PartnersBlock partners={partners} /></Section> : null}
      <Section className="border-t border-border"><FormatsBlock formats={s.formats} packages={packages} ratesNotice={s.ratesNotice} /></Section>
      <Section className="border-t border-border" aria-labelledby="mk-contact">
        <div className="rounded-card border border-border bg-surface p-8">
          <h2 id="mk-contact" className="text-2xl font-semibold">Contact</h2>
          <p className="mt-2 text-muted">{s.ratesNotice}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/sponsorship#inquiry" className={buttonVariants({ size: "lg", className: "no-print" })}>Send a partnership inquiry</Link>
            {general.contactEmail ? <a href={`mailto:${general.contactEmail}`} className="text-accent">{general.contactEmail}</a> : null}
          </div>
        </div>
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Media kit", path: "/media-kit" }])} />
    </div>
  );
}
