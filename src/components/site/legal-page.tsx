import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { getLegalDocument } from "@/server/dal/public/site";

import { JsonLd } from "./json-ld";
import { Markdown } from "./markdown";
import { PageHeader, Section } from "./section";
import { breadcrumbLd } from "@/lib/jsonld";

export async function legalMetadata(slug: string, fallbackTitle: string): Promise<Metadata> {
  const doc = await getLegalDocument(slug);
  return buildMetadata({ title: doc?.title ?? fallbackTitle, description: `${doc?.title ?? fallbackTitle} for this website.`, path: `/${slug}` });
}

export async function LegalPage({ slug }: { slug: string }) {
  const doc = await getLegalDocument(slug);
  if (!doc) notFound();
  const updated = doc.effectiveOn ?? doc.updatedAt.toISOString();
  return (
    <>
      <PageHeader eyebrow="Legal" title={doc.title} description={`Last updated ${formatDate(updated)}`} />
      <Section>
        <Markdown source={doc.body} />
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: doc.title, path: `/${slug}` }])} />
    </>
  );
}
