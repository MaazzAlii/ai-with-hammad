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
      className={cn("relative mx-auto w-full overflow-hidden rounded-media bg-black shadow-panel", embed.aspect === "portrait" && "max-w-sm", className)}
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
        <button type="button" onClick={() => setActive(true)} className="group absolute inset-0 size-full" aria-label={`Play video: ${title}`}>
          {poster ? (
            <Image src={poster} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.02]" />
          ) : null}
          <span className="absolute inset-0 bg-linear-to-t from-black/60 via-black/5 to-transparent" />
          <span className="absolute top-1/2 left-1/2 grid size-16 -translate-1/2 place-items-center rounded-full bg-white/25 text-white shadow-float ring-1 ring-white/40 backdrop-blur-xl backdrop-saturate-150 transition-transform duration-(--duration-slow) ease-spring group-hover:scale-110 group-active:scale-95">
            <Play aria-hidden className="ml-1 size-6 fill-current" />
          </span>
          <span className="absolute right-4 bottom-3.5 left-4 truncate text-left text-sm font-medium text-white">{title}</span>
        </button>
      )}
    </div>
  );
}
