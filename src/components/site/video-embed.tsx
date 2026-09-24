"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { Embed } from "@/lib/embeds";
import { cn } from "@/lib/utils";

/**
 * Click-to-load facade: renders a poster + play button; the third-party iframe
 * (and its scripts/cookies) is only created after the visitor asks for it.
 */
export function VideoEmbed({ embed, title, posterUrl, className }: { embed: Embed; title: string; posterUrl?: string | null; className?: string }) {
  const [active, setActive] = useState(false);
  const aspect = embed.aspect === "portrait" ? "9/16" : embed.aspect === "square" ? "1/1" : "16/9";
  const poster = posterUrl ?? embed.thumbnailUrl;
  const src = `${embed.embedUrl}${embed.embedUrl.includes("?") ? "&" : "?"}autoplay=1`;
  return (
    <div
      className={cn("relative mx-auto w-full overflow-hidden rounded-media border border-border bg-surface-2", embed.aspect === "portrait" && "max-w-sm", className)}
      style={{ aspectRatio: aspect }}
    >
      {active ? (
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      ) : (
        <button type="button" onClick={() => setActive(true)} className="group absolute inset-0 size-full cursor-pointer" aria-label={`Play video: ${title}`}>
          {poster ? <Image src={poster} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover opacity-80 transition-opacity group-hover:opacity-100" /> : null}
          <span className="absolute inset-0 bg-linear-to-t from-bg/70 to-transparent" />
          <span className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-accent-fg shadow-glow transition-transform group-hover:scale-110">
            <Play aria-hidden className="ml-1 size-7 fill-current" />
          </span>
          <span className="absolute bottom-3 left-4 right-4 truncate text-left text-sm font-medium text-fg">{title}</span>
        </button>
      )}
    </div>
  );
}
