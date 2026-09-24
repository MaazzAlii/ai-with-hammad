"use client";

import { ImagePlus, Search, X } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import type { BucketId } from "@/lib/media/buckets";
import { cn } from "@/lib/utils";
import { searchMedia } from "@/server/actions/media";
import type { AdminMedia } from "@/server/dal/admin/media";

import { useFieldError } from "./admin-form";
import { MediaThumb } from "./media-thumb";
import { MediaUploader } from "./media-uploader";

type Kind = "image" | "video" | "document";

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  kind,
  uploadBucket = "media-library",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (m: AdminMedia) => void;
  kind?: Kind;
  uploadBucket?: BucketId;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>(kind ?? "");
  const [items, setItems] = useState<AdminMedia[]>([]);
  const [pending, start] = useTransition();
  const load = useCallback(
    () =>
      start(async () => {
        const r = await searchMedia({ q, kind: filter || undefined, pageSize: 36 });
        if (r.ok) setItems(r.data!.items);
      }),
    [q, filter],
  );
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent wide>
        <DialogHeader>
          <DialogTitle>Select media</DialogTitle>
          <DialogDescription>Choose an existing file or upload a new one.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <MediaUploader compact defaultBucket={uploadBucket} onUploaded={(m) => { onSelect(m); onOpenChange(false); }} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Label htmlFor="picker-q" className="sr-only">Search media</Label>
              <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
              <Input id="picker-q" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), load())} placeholder="Search by name or alt text" className="pl-9" />
            </div>
            {!kind ? (
              <NativeSelect aria-label="Filter by type" value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-40">
                <option value="">All types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
              </NativeSelect>
            ) : null}
            <Button type="button" variant="secondary" onClick={load} disabled={pending}>Search</Button>
          </div>
          <ul className={cn("grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6", pending && "opacity-60")}>
            {items.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => { onSelect(m); onOpenChange(false); }} className="group w-full text-left" aria-label={`Select ${m.filename}`}>
                  <MediaThumb media={m} className="transition-[border-color] group-hover:border-accent" />
                  <span className="mt-1 block truncate text-xs text-muted">{m.filename}</span>
                </button>
              </li>
            ))}
          </ul>
          {!items.length && !pending ? <p className="text-center text-sm text-muted">No media found.</p> : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/** Form field storing a media id in a hidden input, with preview + pick/clear. */
export function MediaField({
  name,
  label,
  defaultMedia,
  kind = "image",
  uploadBucket,
  hint,
}: {
  name: string;
  label: string;
  defaultMedia?: AdminMedia | null;
  kind?: Kind;
  uploadBucket?: BucketId;
  hint?: string;
}) {
  const [media, setMedia] = useState<AdminMedia | null>(defaultMedia ?? null);
  const [open, setOpen] = useState(false);
  const error = useFieldError(name);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={media?.id ?? ""} />
      <div className="flex items-center gap-3">
        <MediaThumb media={media} className="size-20 shrink-0" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <ImagePlus /> {media ? "Change" : "Choose"}
          </Button>
          {media ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => setMedia(null)}>
              <X /> Remove
            </Button>
          ) : null}
        </div>
      </div>
      {media ? <p className="truncate text-xs text-subtle">{media.filename}{media.kind === "image" && !media.altText ? " · no alt text set" : ""}</p> : null}
      {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <MediaPickerDialog open={open} onOpenChange={setOpen} onSelect={setMedia} kind={kind} uploadBucket={uploadBucket} />
    </div>
  );
}
