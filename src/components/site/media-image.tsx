import Image from "next/image";

import { cn } from "@/lib/utils";
import type { MediaDTO } from "@/server/dal/public/media";

type Ratio = "16/9" | "4/3" | "1/1" | "3/4" | "9/16" | "auto";

/**
 * Rounded, aspect-ratio-locked media container around next/image
 * (prevents layout shift; consistent radius-media across the site).
 */
export function MediaImage({
  media,
  alt,
  ratio = "16/9",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  className,
  imgClassName,
  rounded = true,
}: {
  media: Pick<MediaDTO, "url" | "alt" | "width" | "height" | "mimeType">;
  alt?: string;
  ratio?: Ratio;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  rounded?: boolean;
}) {
  const altText = alt ?? media.alt ?? "";
  const unoptimized = media.mimeType === "image/svg+xml" || media.mimeType === "image/gif";
  if (ratio === "auto" && media.width && media.height) {
    return (
      <div className={cn("overflow-hidden border border-border bg-surface-2", rounded && "rounded-media", className)}>
        <Image src={media.url} alt={altText} width={media.width} height={media.height} sizes={sizes} priority={priority} unoptimized={unoptimized} className={cn("h-auto w-full", imgClassName)} />
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden border border-border bg-surface-2", rounded && "rounded-media", className)} style={{ aspectRatio: ratio === "auto" ? "16/9" : ratio }}>
      <Image src={media.url} alt={altText} fill sizes={sizes} priority={priority} unoptimized={unoptimized} className={cn("object-cover", imgClassName)} />
    </div>
  );
}
