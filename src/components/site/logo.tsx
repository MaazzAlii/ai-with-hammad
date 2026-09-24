import Image from "next/image";

import type { MediaDTO } from "@/server/dal/public/media";

/** Brand mark: uploaded logo when set in Settings, otherwise the monogram. */
export function Logo({ name, logo }: { name: string; logo?: MediaDTO | null }) {
  return (
    <span className="flex items-center gap-2.5">
      {logo ? (
        <Image src={logo.url} alt="" width={28} height={28} className="size-7 rounded-lg object-contain" unoptimized={logo.mimeType === "image/svg+xml"} />
      ) : (
        <span
          aria-hidden
          className="grid size-7 place-items-center rounded-lg border border-accent/35 bg-accent-soft font-mono text-[0.72rem] font-semibold text-accent shadow-[0_0_14px_rgb(34_211_238/0.18)]"
        >
          {name.replace(/^AI\s+with\s+/i, "").charAt(0).toUpperCase() || "A"}
        </span>
      )}
      <span className="font-display text-[0.95rem] font-semibold tracking-tight text-fg">{name}</span>
    </span>
  );
}
