import { cn } from "@/lib/utils";

/** Self-hosted video: nothing is downloaded until the visitor presses play (preload="none"). */
export function VideoPlayer({ src, poster, title, mimeType, className }: { src: string; poster?: string | null; title: string; mimeType: string; className?: string }) {
  return (
    <video
      controls
      preload="none"
      playsInline
      poster={poster ?? undefined}
      aria-label={title}
      className={cn("aspect-video w-full rounded-media border border-border bg-surface-2 object-contain", className)}
    >
      <source src={src} type={mimeType} />
      Your browser does not support embedded video. <a href={src}>Download the video</a>.
    </video>
  );
}
