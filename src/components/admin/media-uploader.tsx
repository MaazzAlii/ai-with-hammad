"use client";

import { UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as tus from "tus-js-client";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { publicEnv } from "@/lib/env";
import { BUCKETS, RESUMABLE_THRESHOLD, type BucketId } from "@/lib/media/buckets";
import { kindFromMime, validateUpload } from "@/lib/media/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, formatBytes } from "@/lib/utils";
import { finalizeUpload, prepareUpload } from "@/server/actions/media";
import type { AdminMedia } from "@/server/dal/admin/media";

type Probe = { width: number | null; height: number | null; durationSeconds: number | null };

/** Read dimensions/duration locally (never uploads anything). */
async function probe(file: File): Promise<Probe> {
  const kind = kindFromMime(file.type);
  const url = URL.createObjectURL(file);
  try {
    if (kind === "image" && file.type !== "image/svg+xml") {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { width: img.naturalWidth, height: img.naturalHeight, durationSeconds: null };
    }
    if (kind === "video") {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = url;
      await new Promise<void>((res, rej) => {
        v.onloadedmetadata = () => res();
        v.onerror = () => rej(new Error("Could not read video"));
      });
      return { width: v.videoWidth || null, height: v.videoHeight || null, durationSeconds: Number.isFinite(v.duration) ? Math.round(v.duration * 100) / 100 : null };
    }
  } catch {
    /* fall through: metadata optional */
  } finally {
    URL.revokeObjectURL(url);
  }
  return { width: null, height: null, durationSeconds: null };
}

type Job = { name: string; progress: number; status: "uploading" | "done" | "error"; error?: string; abort?: () => void };

/**
 * Direct browser → Supabase Storage upload (the Next.js server never proxies
 * file bytes). ≤ 6 MB: standard upload; larger: TUS resumable upload.
 * Storage RLS + bucket limits enforce permissions/types server-side; the
 * finalize action re-verifies the stored object before recording metadata.
 */
export function MediaUploader({
  defaultBucket = "media-library",
  buckets,
  accept,
  replaceId,
  onUploaded,
  compact = false,
}: {
  defaultBucket?: BucketId;
  buckets?: BucketId[];
  accept?: string;
  replaceId?: string;
  onUploaded?: (media: AdminMedia) => void;
  compact?: boolean;
}) {
  const [bucket, setBucket] = useState<BucketId>(defaultBucket);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cfg = BUCKETS[bucket];
  const setJob = (name: string, patch: Partial<Job>) => setJobs((js) => js.map((j) => (j.name === name ? { ...j, ...patch } : j)));

  async function uploadOne(file: File) {
    const meta = await probe(file);
    const clientErrors = validateUpload({ bucket, filename: file.name, mimeType: file.type, size: file.size, ...meta }, { canUploadSiteAssets: true });
    if (clientErrors.length) {
      toast.error(`${file.name}: ${clientErrors[0]}`);
      return;
    }
    const prepared = await prepareUpload({ bucket, filename: file.name, mimeType: file.type, size: file.size, ...meta });
    if (!prepared.ok) {
      toast.error(`${file.name}: ${prepared.error}`);
      return;
    }
    const path = prepared.data!.path;
    setJobs((js) => [...js, { name: file.name, progress: 0, status: "uploading" }]);
    const supabase = createSupabaseBrowserClient();
    try {
      if (file.size <= RESUMABLE_THRESHOLD) {
        const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
        if (error) throw new Error(error.message);
        setJob(file.name, { progress: 100 });
      } else {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Session expired — sign in again.");
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: `${publicEnv.supabaseUrl}/storage/v1/upload/resumable`,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: { authorization: `Bearer ${token}`, "x-upsert": "false" },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            chunkSize: 6 * 1024 * 1024, // Supabase requires exactly 6 MB chunks
            metadata: { bucketName: bucket, objectName: path, contentType: file.type, cacheControl: "31536000" },
            onError: (e) => reject(e),
            onProgress: (sent, total) => setJob(file.name, { progress: Math.round((sent / total) * 100) }),
            onSuccess: () => resolve(),
          });
          setJob(file.name, { abort: () => upload.abort(true).then(() => reject(new Error("Cancelled"))) });
          upload.start();
        });
      }
      const result = await finalizeUpload({ bucket, path, originalFilename: file.name, mimeType: file.type, size: file.size, ...meta, replaceId });
      if (!result.ok) throw new Error(result.error);
      setJob(file.name, { status: "done", progress: 100 });
      toast.success(`${file.name} uploaded`);
      onUploaded?.(result.data!.media);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setJob(file.name, { status: "error", error: message });
      toast.error(`${file.name}: ${message}`);
    }
  }

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list).slice(0, replaceId ? 1 : 20);
    for (const f of files) await uploadOne(f);
    if (input.current) input.current.value = "";
  }

  const acceptAttr = accept ?? cfg.mimeTypes.join(",");
  return (
    <div className="space-y-3">
      {!replaceId && (buckets?.length ?? 0) !== 1 ? (
        <div className="flex items-center gap-2">
          <label htmlFor="upload-bucket" className="text-sm text-muted">Upload to</label>
          <NativeSelect id="upload-bucket" value={bucket} onChange={(e) => setBucket(e.target.value as BucketId)} className="w-auto">
            {(buckets ?? (Object.keys(BUCKETS) as BucketId[])).map((b) => (
              <option key={b} value={b}>{BUCKETS[b].label}</option>
            ))}
          </NativeSelect>
        </div>
      ) : null}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn("flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border-strong bg-surface/50 text-center transition-colors", compact ? "p-4" : "p-8", dragging && "border-accent bg-accent-soft")}
      >
        <UploadCloud aria-hidden className="size-7 text-muted" />
        <p className="text-sm text-muted">Drag files here or</p>
        <Button type="button" size="sm" variant="secondary" onClick={() => input.current?.click()}>
          {replaceId ? "Choose replacement file" : "Choose files"}
        </Button>
        <input ref={input} type="file" className="sr-only" accept={acceptAttr} multiple={!replaceId} onChange={(e) => void handleFiles(e.target.files)} aria-label="Choose files to upload" data-testid="media-file-input" />
        <p className="text-xs text-subtle">
          {cfg.mimeTypes.map((m) => m.split("/")[1]).join(", ")} · max {formatBytes(cfg.maxBytes)}
        </p>
      </div>
      {jobs.length ? (
        <ul className="space-y-2" aria-live="polite">
          {jobs.map((j) => (
            <li key={j.name} className="rounded-control border border-border p-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{j.name}</span>
                <span className={cn("shrink-0 text-xs", j.status === "error" ? "text-danger" : j.status === "done" ? "text-success" : "text-muted")}>
                  {j.status === "uploading" ? `${j.progress}%` : j.status === "done" ? "Done" : j.error}
                </span>
                {j.status === "uploading" && j.abort ? (
                  <button type="button" onClick={j.abort} aria-label={`Cancel upload of ${j.name}`} className="text-muted hover:text-fg"><X className="size-4" /></button>
                ) : null}
              </div>
              {j.status === "uploading" ? (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={j.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${j.name}`}>
                  <div className="h-full bg-accent transition-[width]" style={{ width: `${j.progress}%` }} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
