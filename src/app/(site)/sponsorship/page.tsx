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
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href="#inquiry" className={buttonVariants({ size: "lg" })}>Start a partnership</a>
          <Link href="/media-kit" className={buttonVariants({ size: "lg", variant: "secondary" })}>View media kit</Link>
        </div>
      </PageHeader>
      <Section aria-label="Who we are">
        <div data-reveal="item" className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow mb-3">Who we are</p>
            <h2 className="text-[1.75rem] sm:text-[2.5rem]">An engineering studio that creates content</h2>
          </div>
          <p className="text-lg leading-relaxed text-muted sm:text-xl lg:pt-9">{general.description}</p>
        </div>
      </Section>
      {hasAudienceData(s, platforms) ? <Section><AudienceBlock s={s} platforms={platforms} /></Section> : null}
      {s.contentCategories.length ? <Section><CategoriesBlock categories={s.contentCategories} /></Section> : null}
      {platforms.length ? <Section><PlatformsBlock platforms={platforms} /></Section> : null}
      {top.length ? <Section><TopContentBlock items={top} title="Top-performing content" /></Section> : null}
      {campaign.length ? <Section><TopContentBlock items={campaign} title="Campaign examples" /></Section> : null}
      {partners.length ? <Section><PartnersBlock partners={partners} /></Section> : null}
      {s.formats.length || packages.length ? <Section><FormatsBlock formats={s.formats} packages={packages} ratesNotice={s.ratesNotice} /></Section> : null}
      {s.whyPartner.length ? <Section><WhyPartnerBlock items={s.whyPartner} /></Section> : null}
      <Section id="inquiry" aria-labelledby="inquiry-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div>
            <p className="eyebrow mb-3">Contact</p>
            <h2 id="inquiry-title" className="text-[1.75rem] sm:text-[2.5rem]">Tell us about your campaign</h2>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">{s.ratesNotice} We reply to every brand inquiry.</p>
          </div>
          <div className="glass-panel rounded-[1.75rem] p-5 sm:p-8">
            <SponsorshipForm packages={packages.map((p) => ({ id: p.id, name: p.name }))} />
          </div>
        </div>
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Sponsorship", path: "/sponsorship" }])} />
    </>
  );
}
