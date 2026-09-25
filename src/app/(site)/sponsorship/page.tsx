import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { PageHeader, Section } from "@/components/site/section";
import { AudienceBlock, hasAudienceData, CategoriesBlock, FormatsBlock, PartnersBlock, PlatformsBlock, TopContentBlock, WhyPartnerBlock } from "@/components/site/sponsorship-sections";
import { SponsorshipForm } from "@/components/site/sponsorship-form";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { groupContent, listActivePlatforms, listPublishedContent } from "@/server/dal/public/content";
import { getPublicSettings } from "@/server/dal/public/site";
import { listPublishedPackages, listPublishedPartners } from "@/server/dal/public/sponsorship";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getPublicSettings();
  return buildMetadata({
    title: "Sponsorship & partnerships",
    description: `Partner with ${general.siteName}: audience, platforms, content formats and previous partnerships. Rates available on request.`,
    path: "/sponsorship",
  });
}

export default async function SponsorshipPage() {
  const [{ sponsorship: s, general }, platforms, content, packages, partners] = await Promise.all([
    getPublicSettings(),
    listActivePlatforms(),
    listPublishedContent(),
    listPublishedPackages(),
    listPublishedPartners(),
  ]);
  const top = groupContent(content, "high-performing", 3);
  const campaign = groupContent(content, "campaign", 3);
  return (
    <>
      <PageHeader eyebrow="Partnerships" title={`Partner with ${general.siteName}`} description={s.intro}>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#inquiry" className={buttonVariants({ size: "lg" })}>Start a partnership</a>
          <Link href="/media-kit" className={buttonVariants({ size: "lg", variant: "secondary" })}>View media kit</Link>
        </div>
      </PageHeader>
      <Section aria-label="Who we are">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow mb-3">Who we are</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">An engineering studio that creates content</h2>
          </div>
          <p className="text-lg text-muted">{general.description}</p>
        </div>
      </Section>
      {hasAudienceData(s, platforms) ? <Section className="border-t border-border"><AudienceBlock s={s} platforms={platforms} /></Section> : null}
      {s.contentCategories.length ? <Section className="border-t border-border"><CategoriesBlock categories={s.contentCategories} /></Section> : null}
      {platforms.length ? <Section className="border-t border-border"><PlatformsBlock platforms={platforms} /></Section> : null}
      {top.length ? <Section className="border-t border-border"><TopContentBlock items={top} title="Top-performing content" /></Section> : null}
      {campaign.length ? <Section className="border-t border-border"><TopContentBlock items={campaign} title="Campaign examples" /></Section> : null}
      {partners.length ? <Section className="border-t border-border"><PartnersBlock partners={partners} /></Section> : null}
      {s.formats.length || packages.length ? <Section className="border-t border-border"><FormatsBlock formats={s.formats} packages={packages} ratesNotice={s.ratesNotice} /></Section> : null}
      {s.whyPartner.length ? <Section className="border-t border-border"><WhyPartnerBlock items={s.whyPartner} /></Section> : null}
      <Section className="border-t border-border" id="inquiry" aria-labelledby="inquiry-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="eyebrow mb-3">Contact</p>
            <h2 id="inquiry-title" className="text-2xl font-semibold sm:text-3xl">Tell us about your campaign</h2>
            <p className="mt-3 text-muted">{s.ratesNotice} We reply to every brand inquiry.</p>
          </div>
          <div className="rounded-card border border-border bg-surface/60 p-5 sm:p-8">
            <SponsorshipForm packages={packages.map((p) => ({ id: p.id, name: p.name }))} />
          </div>
        </div>
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Sponsorship", path: "/sponsorship" }])} />
    </>
  );
}
