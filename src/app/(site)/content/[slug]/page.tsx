import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentCard } from "@/components/site/content-card";
import { JsonLd } from "@/components/site/json-ld";
import { Markdown } from "@/components/site/markdown";
import { MediaImage } from "@/components/site/media-image";
import { Section, SectionHeading } from "@/components/site/section";
import { VideoEmbed } from "@/components/site/video-embed";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd, creativeWorkLd, videoObjectLd } from "@/lib/jsonld";
import { markdownToText } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo";
import { formatCompactNumber, formatDate } from "@/lib/utils";
import { getPublishedContentItem, listPublishedContent, PLATFORM_LABELS } from "@/server/dal/public/content";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listPublishedContent()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/content/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = await getPublishedContentItem(slug);
  if (!c) return {};
  return buildMetadata({
    title: c.title,
    description: markdownToText(c.description) || `${c.title} on ${PLATFORM_LABELS[c.platform]}`,
    path: `/content/${c.slug}`,
    image: c.thumbnail ?? (c.providerThumbnailUrl ? { url: c.providerThumbnailUrl } : null),
    type: "article",
  });
}

export default async function ContentItemPage(props: PageProps<"/content/[slug]">) {
  const { slug } = await props.params;
  const item = await getPublishedContentItem(slug);
  if (!item) notFound();
  const more = (await listPublishedContent()).filter((c) => c.id !== item.id && c.platform === item.platform).slice(0, 3);
  const thumb = item.thumbnail?.url ?? item.providerThumbnailUrl;
  const isVideo = item.embed && ["youtube", "vimeo", "tiktok"].includes(item.embed.provider);
  const m = item.metrics;
  const stats = m
    ? ([["Views", m.views], ["Likes", m.likes], ["Comments", m.comments], ["Shares", m.shares]] as const).filter(([, v]) => v != null)
    : [];
  const description = markdownToText(item.description) || item.title;
  return (
    <article>
      <div className="container-page py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-subtle">
          <Link href="/content" className="hover:text-fg">Content</Link> <span aria-hidden>/</span> <span className="text-muted">{item.title}</span>
        </nav>
        <p className="eyebrow mb-3">{PLATFORM_LABELS[item.platform]}{item.category ? ` · ${item.category}` : ""}</p>
        <h1 className="max-w-4xl text-3xl font-semibold sm:text-4xl">{item.title}</h1>
        {item.publishedDate ? <p className="mt-3 text-sm text-subtle">Published <time dateTime={item.publishedDate}>{formatDate(item.publishedDate)}</time></p> : null}
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            {item.embed ? (
              <VideoEmbed embed={item.embed} title={item.title} posterUrl={item.thumbnail?.url} />
            ) : item.thumbnail ? (
              <MediaImage media={item.thumbnail} priority />
            ) : null}
          </div>
          <div>
            {stats.length ? (
              <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border">
                {stats.map(([label, v]) => (
                  <div key={label} className="bg-surface p-4">
                    <dd className="font-mono text-2xl text-accent">{formatCompactNumber(v)}</dd>
                    <dt className="text-xs text-muted">{label}</dt>
                  </div>
                ))}
                <p className="col-span-2 bg-surface px-4 py-2 text-xs text-subtle">Metrics as of {formatDate(m!.capturedAt)}</p>
              </dl>
            ) : null}
            <Markdown source={item.description} />
            <a href={item.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", className: "mt-6" })}>
              View on {PLATFORM_LABELS[item.platform]} <ExternalLink aria-hidden />
            </a>
          </div>
        </div>
      </div>
      {more.length ? (
        <Section className="border-t border-border" aria-labelledby="more-content">
          <SectionHeading id="more-content" eyebrow="More" title={`More on ${PLATFORM_LABELS[item.platform]}`} />
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{more.map((c) => <li key={c.id}><ContentCard item={c} /></li>)}</ul>
        </Section>
      ) : null}
      <JsonLd
        data={[
          isVideo && thumb && item.embed
            ? videoObjectLd({ name: item.title, description, thumbnailUrl: thumb, embedUrl: item.embed.embedUrl, uploadDate: item.publishedDate ?? item.updatedAt.toISOString() })
            : creativeWorkLd({ name: item.title, description, path: `/content/${item.slug}`, imageUrl: thumb, datePublished: item.publishedDate }),
          breadcrumbLd([{ name: "Home", path: "/" }, { name: "Content", path: "/content" }, { name: item.title, path: `/content/${item.slug}` }]),
        ]}
      />
    </article>
  );
}
