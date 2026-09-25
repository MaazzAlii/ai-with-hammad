import { Eye, Heart, MessageCircle, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, formatDate } from "@/lib/utils";
import { PLATFORM_LABELS, type ContentCardDTO } from "@/server/dal/public/content";

import { MediaImage } from "./media-image";

export function ContentCard({ item }: { item: ContentCardDTO }) {
  const portrait = item.embed?.aspect === "portrait";
  const ratio = portrait ? "3/4" : "16/9";
  const frame = "relative overflow-hidden rounded-media bg-surface-3 shadow-[inset_0_0_0_1px_var(--glass-line)]";
  return (
    <article className="group relative flex flex-col">
      <div className="relative transition-transform duration-(--duration-slow) ease-spring group-active:scale-[0.985]">
        {item.thumbnail ? (
          <MediaImage
            media={item.thumbnail}
            alt={item.thumbnail.alt || item.title}
            ratio={ratio}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            imgClassName="transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]"
          />
        ) : item.providerThumbnailUrl ? (
          <div className={frame} style={{ aspectRatio: ratio }}>
            <Image src={item.providerThumbnailUrl} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]" />
          </div>
        ) : (
          <div className={`${frame} bg-linear-to-br from-surface-2 to-surface-3`} style={{ aspectRatio: ratio }} />
        )}
        <Badge variant="glass" className="absolute top-3 left-3">{PLATFORM_LABELS[item.platform]}</Badge>
        <span aria-hidden className="glass-float absolute top-1/2 left-1/2 grid size-12 -translate-1/2 place-items-center rounded-full text-fg transition-transform duration-(--duration-slow) ease-spring group-hover:scale-110">
          <Play className="ml-0.5 size-5 fill-current" />
        </span>
      </div>
      <h3 className="mt-3.5 px-0.5 text-base leading-snug font-semibold tracking-tight text-fg">
        <Link href={`/content/${item.slug}`} className="after:absolute after:inset-0 after:rounded-media">
          {item.title}
        </Link>
      </h3>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 px-0.5 text-xs text-subtle tabular-nums">
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
