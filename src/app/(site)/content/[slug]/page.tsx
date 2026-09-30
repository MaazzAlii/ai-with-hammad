import { ArrowUpRight, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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

const DIFFICULTY_LABEL: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

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
  const allOthers = (await listPublishedContent()).filter((c) => c.id !== item.id);
  const sameCategory = item.category ? allOthers.filter((c) => c.category === item.category) : [];
  const more = (sameCategory.length ? sameCategory : allOthers.filter((c) => c.platform === item.platform)).slice(0, 3);
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
        <p className="eyebrow mb-3">{item.contentType === "article" ? "Tutorial" : PLATFORM_LABELS[item.platform]}{item.category ? ` · ${item.category}` : ""}</p>
        <h1 className="max-w-4xl text-[2.25rem] sm:text-5xl">{item.title}</h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
          {item.publishedDate ? <span>Published <time dateTime={item.publishedDate}>{formatDate(item.publishedDate)}</time></span> : null}
          {item.difficulty ? <span>{DIFFICULTY_LABEL[item.difficulty]}</span> : null}
          {item.durationMinutes ? <span>{item.durationMinutes} min {item.contentType === "article" ? "read" : "watch"}</span> : null}
        </p>
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
            <div className="mt-8 flex flex-wrap gap-2.5">
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary" })}>
                  View on {PLATFORM_LABELS[item.platform]} <ArrowUpRight aria-hidden />
                </a>
              ) : null}
              {item.resource ? (
                <a href={item.resource.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary" })}>
                  <Download aria-hidden /> {item.resourceLabel || "Download resource"}
                </a>
              ) : null}
            </div>
            {item.author ? (
              <Link href={`/team/${item.author.slug}`} className="group mt-10 flex items-center gap-3">
                {item.author.photo ? (
                  <MediaImage media={item.author.photo} alt="" ratio="1/1" rounded={false} className="size-10 shrink-0 rounded-full" sizes="40px" />
                ) : (
                  <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{item.author.name.charAt(0)}</span>
                )}
                <span>
                  <span className="block text-sm font-medium text-fg transition-colors group-hover:text-accent">{item.author.name}</span>
                  {item.author.roleTitle ? <span className="block text-xs text-muted">{item.author.roleTitle}</span> : null}
                </span>
              </Link>
            ) : null}
          </div>
        </div>
        {item.contentType === "article" && item.bodyMd ? (
          <div className="mt-14 max-w-3xl">
            <Markdown source={item.bodyMd} />
          </div>
        ) : null}
      </div>
      {more.length ? (
        <Section aria-labelledby="more-content">
          <SectionHeading id="more-content" eyebrow="More" title={sameCategory.length ? `More on ${item.category}` : `More on ${PLATFORM_LABELS[item.platform]}`} />
          <ul data-reveal="group" className="focus-group grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{more.map((c) => <li key={c.id}><ContentCard item={c} /></li>)}</ul>
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
