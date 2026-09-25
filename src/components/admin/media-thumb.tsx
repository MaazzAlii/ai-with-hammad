import { FileText, Film, File as FileIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AdminMedia } from "@/server/dal/admin/media";

/** Admin-only thumbnail (plain <img>: admin views don't need the optimizer). */
export function MediaThumb({ media, className }: { media: Pick<AdminMedia, "url" | "kind" | "mimeType" | "altText" | "filename"> | null; className?: string }) {
  const base = cn("relative grid aspect-square place-items-center overflow-hidden rounded-control border border-border bg-surface-2", className);
  if (!media) return <div className={base} />;
  if (media.kind === "image" && media.url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <div className={base}><img src={media.url} alt={media.altText || media.filename} loading="lazy" className="size-full object-cover" /></div>;
  }
  const Icon = media.kind === "video" ? Film : media.kind === "document" ? FileText : FileIcon;
  return (
    <div className={base}>
      <Icon aria-hidden className="size-7 text-muted" />
      <span className="sr-only">{media.filename}</span>
    </div>
  );
}
