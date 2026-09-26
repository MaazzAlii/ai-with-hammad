import { ChevronDown, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { AdminMedia } from "@/server/dal/admin/media";

import { DeleteEntityButton } from "./delete-button";
import { FlagToggle } from "./flag-toggle";
import { MediaThumb } from "./media-thumb";

/** Edit + delete buttons shown at the end of a list row. */
export function RowActions({ editHref, inlineEdit, entity, id, canDelete, label }: { editHref?: string; inlineEdit?: boolean; entity: string; id: string; canDelete?: boolean; label: string }) {
  if (!editHref && !inlineEdit && !canDelete) return null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      {editHref ? (
        <Link href={editHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          <Pencil aria-hidden /> Edit
        </Link>
      ) : null}
      {inlineEdit ? (
        // Rendered inside a <summary>: clicking it opens the inline editor below the row.
        <span aria-hidden className={buttonVariants({ variant: "secondary", size: "sm", className: "group-open/row:bg-accent-soft group-open/row:text-accent" })}>
          <Pencil /> Edit <ChevronDown className="transition-transform group-open/row:rotate-180" />
        </span>
      ) : null}
      {canDelete && !inlineEdit ? <DeleteEntityButton entity={entity} id={id} label={label} iconOnly /> : null}
    </div>
  );
}

/** Standard list row: thumbnail, title/meta, show/hide toggles, edit and delete actions. */
export function EntityRow({
  href,
  title,
  meta,
  thumb,
  entity,
  id,
  flags,
  canPublish,
  canDelete = false,
  inlineEdit = false,
  label = "item",
}: {
  href?: string;
  title: string;
  meta?: string;
  thumb?: AdminMedia | null | false;
  entity: string;
  id: string;
  flags: { flag: string; value: boolean; label: string; offLabel?: string }[];
  canPublish: boolean;
  /** Show a confirmed Delete button (list pages). Inline-edit rows keep Delete inside the editor. */
  canDelete?: boolean;
  /** The row sits inside a <details><summary>: show an "Edit" affordance that opens the inline form. */
  inlineEdit?: boolean;
  /** Singular noun used in the delete confirmation, e.g. "project". */
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      {thumb !== false ? <MediaThumb media={thumb ?? null} className="hidden size-12 shrink-0 sm:grid" /> : null}
      <div className="min-w-0 flex-1">
        {href ? <Link href={href} className="font-medium hover:text-accent">{title}</Link> : <span className="font-medium">{title}</span>}
        {meta ? <p className="truncate text-xs text-subtle">{meta}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {flags.map((f) => (
          <FlagToggle key={f.flag} entity={entity} id={id} flag={f.flag} value={f.value} label={f.value ? f.label : (f.offLabel ?? f.label)} disabled={!canPublish} />
        ))}
      </div>
      <RowActions editHref={href} inlineEdit={inlineEdit} entity={entity} id={id} canDelete={canDelete} label={label} />
    </div>
  );
}
