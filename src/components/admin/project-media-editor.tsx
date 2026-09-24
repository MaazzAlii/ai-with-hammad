"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { parseVideoEmbed } from "@/lib/embeds";
import type { AdminMedia } from "@/server/dal/admin/media";

import { useFieldError } from "./admin-form";
import { MediaPickerDialog } from "./media-picker";
import { MediaThumb } from "./media-thumb";

type MediaType = "image" | "screenshot" | "diagram" | "video_upload" | "youtube" | "vimeo" | "external" | "document";
export type EditorItem = {
  key: string;
  type: MediaType;
  mediaAssetId: string | null;
  externalUrl: string;
  posterMediaId: string | null;
  title: string;
  caption: string;
  altText: string;
};

const TYPE_LABELS: Record<MediaType, string> = {
  image: "Gallery image",
  screenshot: "Screenshot",
  diagram: "Architecture diagram",
  video_upload: "Uploaded video",
  youtube: "YouTube video",
  vimeo: "Vimeo video",
  external: "External link",
  document: "Document (PDF)",
};
const needsAsset = (t: MediaType) => !["youtube", "vimeo", "external"].includes(t);
const kindFor = (t: MediaType) => (t === "video_upload" ? "video" : t === "document" ? "document" : "image") as "image" | "video" | "document";
const bucketFor = (t: MediaType) => (t === "video_upload" ? "project-videos" : t === "document" ? "media-library" : t === "image" ? "project-gallery" : "project-images");

function Row({ item, media, onChange, onRemove, onPick }: { item: EditorItem; media: Map<string, AdminMedia>; onChange: (p: Partial<EditorItem>) => void; onRemove: () => void; onPick: (field: "mediaAssetId" | "posterMediaId") => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.key });
  const asset = item.mediaAssetId ? (media.get(item.mediaAssetId) ?? null) : null;
  const poster = item.posterMediaId ? (media.get(item.posterMediaId) ?? null) : null;
  const embedOk = item.type === "youtube" || item.type === "vimeo" ? Boolean(parseVideoEmbed(item.externalUrl)) : true;
  const id = (f: string) => `pm-${item.key}-${f}`;
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex gap-2 rounded-card border border-border bg-surface p-3">
      <button type="button" className="cursor-grab self-start rounded p-1 text-subtle hover:text-fg" aria-label="Drag to reorder" {...attributes} {...listeners}>
        <GripVertical className="size-4" />
      </button>
      <div className="grid flex-1 gap-3 sm:grid-cols-[6rem_1fr]">
        <div className="space-y-2">
          {needsAsset(item.type) ? (
            <button type="button" onClick={() => onPick("mediaAssetId")} className="block w-full" aria-label="Choose file">
              <MediaThumb media={asset} className="w-24" />
            </button>
          ) : (
            <MediaThumb media={poster} className="w-24" />
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={id("type")} className="text-xs text-muted">Type</Label>
            <NativeSelect id={id("type")} value={item.type} onChange={(e) => onChange({ type: e.target.value as MediaType })}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </NativeSelect>
          </div>
          {needsAsset(item.type) ? (
            <div className="flex flex-col justify-end gap-1">
              <Button type="button" size="sm" variant="secondary" onClick={() => onPick("mediaAssetId")}>{asset ? "Change file" : "Choose file"}</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Label htmlFor={id("url")} className="text-xs text-muted">URL</Label>
              <Input id={id("url")} value={item.externalUrl} onChange={(e) => onChange({ externalUrl: e.target.value })} placeholder="https://" aria-invalid={!embedOk || undefined} />
              {!embedOk ? <span className="text-xs text-danger">Not a recognised {TYPE_LABELS[item.type]} URL</span> : null}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label htmlFor={id("title")} className="text-xs text-muted">Title</Label>
            <Input id={id("title")} value={item.title} onChange={(e) => onChange({ title: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={id("caption")} className="text-xs text-muted">Caption</Label>
            <Input id={id("caption")} value={item.caption} onChange={(e) => onChange({ caption: e.target.value })} />
          </div>
          {kindFor(item.type) === "image" && needsAsset(item.type) ? (
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Label htmlFor={id("alt")} className="text-xs text-muted">Alt text (describe the image)</Label>
              <Input id={id("alt")} value={item.altText} onChange={(e) => onChange({ altText: e.target.value })} placeholder={asset?.altText || ""} />
            </div>
          ) : null}
          {item.type === "video_upload" || item.type === "youtube" || item.type === "vimeo" ? (
            <div className="flex items-center gap-2 sm:col-span-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => onPick("posterMediaId")}>{poster ? "Change poster image" : "Add poster image"}</Button>
              {poster ? <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ posterMediaId: null })}>Remove poster</Button> : null}
            </div>
          ) : null}
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove media item"><Trash2 /></Button>
    </li>
  );
}

/** Ordered project media (gallery, screenshots, diagrams, videos, embeds, documents). */
export function ProjectMediaEditor({ name, defaultItems, defaultMedia }: { name: string; defaultItems: Omit<EditorItem, "key">[]; defaultMedia: AdminMedia[] }) {
  const [items, setItems] = useState<EditorItem[]>(defaultItems.map((i) => ({ ...i, key: crypto.randomUUID() })));
  const [media, setMedia] = useState(new Map(defaultMedia.map((m) => [m.id, m])));
  const [picking, setPicking] = useState<{ key: string; field: "mediaAssetId" | "posterMediaId" } | null>(null);
  const error = useFieldError(name);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const update = (key: string, patch: Partial<EditorItem>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setItems((list) => arrayMove(list, list.findIndex((i) => i.key === e.active.id), list.findIndex((i) => i.key === e.over!.id)));
  };
  const pickingItem = picking ? items.find((i) => i.key === picking.key) : null;
  const serialized = items.map(({ key: _k, ...i }) => ({ ...i, externalUrl: i.externalUrl || null }));
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(serialized)} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((item) => (
              <Row key={item.key} item={item} media={media} onChange={(p) => update(item.key, p)} onRemove={() => setItems((l) => l.filter((i) => i.key !== item.key))} onPick={(field) => setPicking({ key: item.key, field })} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <div className="flex flex-wrap gap-2">
        {(["image", "screenshot", "diagram", "video_upload", "youtube", "vimeo", "document", "external"] as MediaType[]).map((t) => (
          <Button key={t} type="button" size="sm" variant="secondary" onClick={() => setItems((l) => [...l, { key: crypto.randomUUID(), type: t, mediaAssetId: null, externalUrl: "", posterMediaId: null, title: "", caption: "", altText: "" }])}>
            <Plus /> {TYPE_LABELS[t]}
          </Button>
        ))}
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <MediaPickerDialog
        open={Boolean(picking)}
        onOpenChange={(o) => !o && setPicking(null)}
        kind={picking?.field === "posterMediaId" ? "image" : pickingItem ? kindFor(pickingItem.type) : "image"}
        uploadBucket={picking?.field === "posterMediaId" ? "project-images" : pickingItem ? bucketFor(pickingItem.type) : "project-gallery"}
        onSelect={(m) => {
          if (!picking) return;
          setMedia((map) => new Map(map).set(m.id, m));
          update(picking.key, { [picking.field]: m.id });
        }}
      />
    </div>
  );
}
