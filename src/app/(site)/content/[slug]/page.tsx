import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentCard } from "@/components/site/content-card";
import { JsonLd } from "@/components/site/json-ld";
import { Markdown } from "@/components/site/markdown";
import { MediaImage } from "@/components/site/media-image";
import { Breadcrumb, Section, SectionHeading } from "@/components/site/section";
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
      <div className="container-page pt-12 pb-14 sm:pt-20 sm:pb-20">
        <Breadcrumb href="/content" label="Content" current={item.title} />
        <p className="eyebrow mb-3">{PLATFORM_LABELS[item.platform]}{item.category ? ` · ${item.category}` : ""}</p>
        <h1 className="max-w-4xl text-[2.25rem] sm:text-5xl">{item.title}</h1>
        {item.publishedDate ? <p className="mt-4 text-sm text-subtle">Published <time dateTime={item.publishedDate}>{formatDate(item.publishedDate)}</time></p> : null}
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            {item.embed ? (
              <VideoEmbed embed={item.embed} title={item.title} posterUrl={item.thumbnail?.url} />
            ) : item.thumbnail ? (
              <MediaImage media={item.thumbnail} priority className="shadow-panel" />
            ) : null}
          </div>
          <div>
            {stats.length ? (
              <div className="mb-8">
                <dl className="glass-panel grid grid-cols-2 gap-px overflow-hidden rounded-card bg-(--glass-line)">
                  {stats.map(([label, v]) => (
                    <div key={label} className="flex flex-col-reverse bg-surface/70 px-5 py-4 dark:bg-bg/40">
                      <dt className="mt-1 text-xs text-muted">{label}</dt>
                      <dd className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{formatCompactNumber(v)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2.5 px-1 text-xs text-subtle">Metrics as of {formatDate(m!.capturedAt)}</p>
              </div>
            ) : null}
            <Markdown source={item.description} />
            <a href={item.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", className: "mt-8" })}>
              View on {PLATFORM_LABELS[item.platform]} <ArrowUpRight aria-hidden />
            </a>
          </div>
        </div>
      </div>
      {more.length ? (
        <Section aria-labelledby="more-content">
          <SectionHeading id="more-content" eyebrow="More" title={`More on ${PLATFORM_LABELS[item.platform]}`} />
          <ul data-reveal="group" className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{more.map((c) => <li key={c.id}><ContentCard item={c} /></li>)}</ul>
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
