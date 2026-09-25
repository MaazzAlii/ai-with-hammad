import Image from "next/image";

import { cn } from "@/lib/utils";
import type { MediaDTO } from "@/server/dal/public/media";

type Ratio = "16/9" | "4/3" | "1/1" | "3/4" | "9/16" | "auto";

/**
 * Rounded, aspect-ratio-locked media container around next/image
 * (prevents layout shift; consistent radius-media across the site).
 * The inset hairline sits above the image so edges stay crisp on any photo.
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
  const frame = cn(
    "relative isolate overflow-hidden bg-surface-3 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_var(--glass-line)]",
    rounded && "rounded-media",
    className,
  );
  if (ratio === "auto" && media.width && media.height) {
    return (
      <div className={frame}>
        <Image src={media.url} alt={altText} width={media.width} height={media.height} sizes={sizes} priority={priority} unoptimized={unoptimized} className={cn("h-auto w-full", imgClassName)} />
      </div>
    );
  }
  return (
    <div className={frame} style={{ aspectRatio: ratio === "auto" ? "16/9" : ratio }}>
      <Image src={media.url} alt={altText} fill sizes={sizes} priority={priority} unoptimized={unoptimized} className={cn("object-cover", imgClassName)} />
    </div>
  );
}

/** Placeholder frame for records without an image: soft gradient + monogram, same geometry as MediaImage. */
export function MediaPlaceholder({ label, ratio = "16/9", className }: { label: string; ratio?: Exclude<Ratio, "auto">; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-media bg-[radial-gradient(120%_90%_at_20%_0%,var(--color-accent-soft),transparent_60%),linear-gradient(160deg,var(--color-surface-2),var(--color-surface-3))] shadow-[inset_0_0_0_1px_var(--glass-line)]",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      <span className="text-3xl font-semibold tracking-tight text-fg/25">{label}</span>
    </div>
  );
}
