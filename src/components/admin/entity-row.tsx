import Link from "next/link";

import type { AdminMedia } from "@/server/dal/admin/media";

import { FlagToggle } from "./flag-toggle";
import { MediaThumb } from "./media-thumb";

/** Standard list row: thumbnail, title/meta link, flag toggles. */
export function EntityRow({
  href,
  title,
  meta,
  thumb,
  entity,
  id,
  flags,
  canPublish,
}: {
  href: string;
  title: string;
  meta?: string;
  thumb?: AdminMedia | null | false;
  entity: string;
  id: string;
  flags: { flag: string; value: boolean; label: string; offLabel?: string }[];
  canPublish: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      {thumb !== false ? <MediaThumb media={thumb ?? null} className="hidden size-12 shrink-0 sm:grid" /> : null}
      <div className="min-w-0 flex-1">
        <Link href={href} className="font-medium hover:text-accent">{title}</Link>
        {meta ? <p className="truncate text-xs text-subtle">{meta}</p> : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {flags.map((f) => (
          <FlagToggle key={f.flag} entity={entity} id={id} flag={f.flag} value={f.value} label={f.value ? f.label : (f.offLabel ?? f.label)} disabled={!canPublish} />
        ))}
      </div>
    </div>
  );
}
