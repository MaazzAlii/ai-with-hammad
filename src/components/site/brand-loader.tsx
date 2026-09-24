import Image from "next/image";

import { getPublicSettings, getSiteMedia } from "@/server/dal/public/site";

/**
 * Branded loading screen shown while a route streams in. Logo and agency name
 * come from Admin → Settings → General, so they update without code changes.
 */
export default async function BrandLoader() {
  const [{ general }, media] = await Promise.all([getPublicSettings(), getSiteMedia()]);
  const initial = general.siteName.replace(/^AI\s+with\s+/i, "").charAt(0).toUpperCase() || "A";
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[60] grid place-items-center bg-bg/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5">
        <div className="relative grid size-20 place-items-center">
          <span aria-hidden className="absolute inset-0 rounded-3xl border border-accent/30 motion-safe:animate-ping [animation-duration:1.8s]" />
          <span aria-hidden className="absolute inset-0 rounded-3xl bg-linear-to-br from-accent/25 to-accent-2/10 blur-xl" />
          {media.logo ? (
            <Image src={media.logo.url} alt="" width={64} height={64} priority unoptimized={media.logo.mimeType === "image/svg+xml"} className="relative size-16 rounded-2xl object-contain" />
          ) : (
            <span className="relative grid size-16 place-items-center rounded-2xl border border-accent/40 bg-accent-soft font-mono text-2xl font-semibold text-accent shadow-glow">{initial}</span>
          )}
        </div>
        <p className="font-display text-lg font-semibold tracking-tight text-fg">{general.siteName}</p>
        <div aria-hidden className="h-1 w-40 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-1/3 rounded-full bg-linear-to-r from-accent to-accent-2 motion-safe:animate-[loader_1.1s_ease-in-out_infinite]" />
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
