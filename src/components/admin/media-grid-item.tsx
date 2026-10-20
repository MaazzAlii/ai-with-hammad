"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { formatBytes } from "@/lib/utils";
import { deleteMedia } from "@/server/actions/media";
import type { AdminMedia } from "@/server/dal/admin/media";

import { MediaThumb } from "./media-thumb";

export function MediaGridItem({ media, canDelete }: { media: AdminMedia; canDelete: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Permanently delete "${media.filename}" from storage and library?`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await deleteMedia(media.id);
      if (res.ok) {
        toast.success(`Deleted ${media.filename}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete file");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative block">
      <Link href={`/admin/media/${media.id}`} className="block">
        <MediaThumb media={media} className="transition-[border-color] group-hover:border-accent" />
        <span className="mt-1.5 block truncate text-sm group-hover:text-fg">{media.filename}</span>
        <span className="block text-xs text-subtle">
          {formatBytes(media.sizeBytes)}
          {media.width ? ` · ${media.width}×${media.height}` : ""}
          {media.kind === "image" && !media.altText ? " · no alt" : ""}
        </span>
      </Link>
      {canDelete ? (
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          title="Delete from library"
          aria-label={`Delete ${media.filename} from library`}
          className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-md bg-bg/90 text-subtle shadow-xs opacity-0 transition-all hover:bg-danger hover:text-white group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
