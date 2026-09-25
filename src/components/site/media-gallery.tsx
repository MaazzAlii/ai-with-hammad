"use client";

import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type GalleryImage = { url: string; alt: string; caption: string; title: string; width: number | null; height: number | null; unoptimized?: boolean };

const control =
  "glass-float pressable grid size-10 place-items-center rounded-full text-fg hover:scale-105 disabled:opacity-40";

/** Responsive image grid with an accessible lightbox (keyboard arrows, Escape, focus trap). */
export function MediaGallery({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const go = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (images.length === 0) return null;
  const current = index !== null ? images[index] : null;

  return (
    <>
      <ul data-reveal="group" className="grid gap-4 sm:grid-cols-2">
        {images.map((img, i) => (
          <li key={img.url} className={images.length % 2 === 1 && i === 0 ? "sm:col-span-2" : undefined}>
            <figure>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className="group relative block w-full overflow-hidden rounded-media bg-surface-3 shadow-card transition-transform duration-(--duration-slow) ease-spring after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_var(--glass-line)] active:scale-[0.985]"
                style={{ aspectRatio: "16/10" }}
                aria-label={`Open image ${i + 1} of ${images.length}${img.alt ? `: ${img.alt}` : ""}`}
              >
                <Image src={img.url} alt={img.alt} fill sizes="(min-width: 640px) 50vw, 100vw" unoptimized={img.unoptimized} className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.02]" />
                <span className="glass-float absolute right-3 bottom-3 z-10 grid size-9 place-items-center rounded-full text-fg opacity-0 transition-opacity duration-(--duration-base) group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Maximize2 aria-hidden className="size-4" />
                </span>
              </button>
              {img.caption || img.title ? <figcaption className="mt-2.5 text-sm text-muted">{img.caption || img.title}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={(o) => !o && setIndex(null)}>
        <DialogContent wide>
          {current ? (
            <div className="flex flex-col">
              <DialogTitle className="sr-only">{current.title || current.alt || "Image"}</DialogTitle>
              <DialogDescription className="sr-only">
                Image {index! + 1} of {images.length}. Use the arrow keys to navigate.
              </DialogDescription>
              <div className="relative h-[62dvh] w-full sm:h-[72dvh]">
                <Image key={current.url} src={current.url} alt={current.alt} fill sizes="100vw" unoptimized={current.unoptimized} className="object-contain motion-safe:animate-[fade-in_240ms_var(--ease-out-soft)]" />
              </div>
              <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
                <button type="button" onClick={() => go(-1)} className={control} aria-label="Previous image" disabled={images.length < 2}>
                  <ChevronLeft aria-hidden className="size-5" />
                </button>
                <p className="min-w-0 flex-1 truncate text-center text-sm text-muted tabular-nums">{current.caption || current.title || `${index! + 1} / ${images.length}`}</p>
                <button type="button" onClick={() => go(1)} className={control} aria-label="Next image" disabled={images.length < 2}>
                  <ChevronRight aria-hidden className="size-5" />
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
