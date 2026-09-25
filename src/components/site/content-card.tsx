import { Eye, Heart, MessageCircle, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, formatDate } from "@/lib/utils";
import { PLATFORM_LABELS, type ContentCardDTO } from "@/server/dal/public/content";

import { MediaImage } from "./media-image";

export function ContentCard({ item }: { item: ContentCardDTO }) {
  const portrait = item.embed?.aspect === "portrait";
  const ratio = portrait ? "3/4" : "16/9";
  return (
    <article className="group relative flex flex-col">
      <div className="relative">
        {item.thumbnail ? (
          <MediaImage media={item.thumbnail} alt={item.thumbnail.alt || item.title} ratio={ratio} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
        ) : item.providerThumbnailUrl ? (
          <div className="relative overflow-hidden rounded-media border border-border bg-surface-2" style={{ aspectRatio: ratio }}>
            <Image src={item.providerThumbnailUrl} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
          </div>
        ) : (
          <div className="grid place-items-center rounded-media border border-border bg-linear-to-br from-surface-2 to-surface-3" style={{ aspectRatio: ratio }}>
            <PlayCircle aria-hidden className="size-10 text-subtle" />
          </div>
        )}
        <Badge className="absolute top-3 left-3 bg-bg/80 backdrop-blur">{PLATFORM_LABELS[item.platform]}</Badge>
      </div>
      <h3 className="mt-4 text-base font-semibold text-fg">
        <Link href={`/content/${item.slug}`} className="after:absolute after:inset-0 hover:text-accent">
          {item.title}
        </Link>
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
        {item.publishedDate ? <time dateTime={item.publishedDate}>{formatDate(item.publishedDate)}</time> : null}
        {item.metrics?.views != null ? (
          <span className="inline-flex items-center gap-1">
            <Eye aria-hidden className="size-3.5" /> {formatCompactNumber(item.metrics.views)} <span className="sr-only">views</span>
          </span>
        ) : null}
        {item.metrics?.likes != null ? (
          <span className="inline-flex items-center gap-1">
            <Heart aria-hidden className="size-3.5" /> {formatCompactNumber(item.metrics.likes)} <span className="sr-only">likes</span>
          </span>
        ) : null}
        {item.metrics?.comments != null ? (
          <span className="inline-flex items-center gap-1">
            <MessageCircle aria-hidden className="size-3.5" /> {formatCompactNumber(item.metrics.comments)} <span className="sr-only">comments</span>
          </span>
        ) : null}
      </div>
    </article>
  );
}
