import Image from "next/image";

import { cn } from "@/lib/utils";
import type { MediaDTO } from "@/server/dal/public/media";

export function monogram(name: string) {
  return name.replace(/^AI\s+with\s+/i, "").charAt(0).toUpperCase() || "A";
}

/** App-icon style brand mark: the uploaded logo when set in Settings, otherwise the monogram. */
export function LogoMark({ name, logo, className }: { name: string; logo?: MediaDTO | null; className?: string }) {
  if (logo) {
    return (
      <Image src={logo.url} alt="" width={32} height={32} className={cn("size-8 rounded-[0.55rem] object-contain", className)} unoptimized={logo.mimeType === "image/svg+xml"} />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 place-items-center rounded-[0.55rem] bg-accent text-[0.8125rem] font-semibold text-accent-fg",
        "bg-[linear-gradient(160deg,rgb(255_255_255/0.28),transparent_60%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_2px_rgb(0_0_0/0.12)]",
        className,
      )}
    >
      {monogram(name)}
    </span>
  );
}

export function Logo({ name, logo }: { name: string; logo?: MediaDTO | null }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <LogoMark name={name} logo={logo} className="shrink-0" />
      <span className="truncate text-[0.9375rem] font-semibold tracking-[-0.015em] whitespace-nowrap text-fg">{name}</span>
    </span>
  );
}
