import { BUCKETS, MIME_EXTENSIONS, type BucketId } from "./buckets";

export type MediaKind = "image" | "video" | "document" | "other";

export type UploadCandidate = {
  bucket: BucketId;
  filename: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
};

/** Never accepted anywhere, regardless of declared MIME type. */
const BLOCKED_EXTENSIONS = new Set([
  "exe", "msi", "bat", "cmd", "com", "sh", "bash", "ps1", "js", "mjs", "cjs", "ts", "jsx", "tsx",
  "html", "htm", "xhtml", "php", "py", "rb", "pl", "jar", "apk", "dmg", "app", "scr", "vbs", "wsf",
  "dll", "so", "bin", "svgz", "xml", "swf",
]);

export const MAX_IMAGE_DIMENSION = 12000;
export const MAX_VIDEO_SECONDS = 60 * 60 * 2;

export function extensionOf(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

export function kindFromMime(mime: string): MediaKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "document";
  return "other";
}

/** Returns a list of human-readable problems; empty list means valid. */
export function validateUpload(c: UploadCandidate, opts: { canUploadSiteAssets: boolean }): string[] {
  const errors: string[] = [];
  const bucket = BUCKETS[c.bucket];
  if (!bucket) return ["Unknown storage bucket."];
  if ("restricted" in bucket && bucket.restricted && !opts.canUploadSiteAssets) {
    errors.push("You do not have permission to upload site assets.");
  }
  const ext = extensionOf(c.filename);
  if (!ext) errors.push("File must have an extension.");
  if (BLOCKED_EXTENSIONS.has(ext)) errors.push(`.${ext} files are not allowed.`);
  // Double extensions like "photo.php.jpg" are suspicious.
  const parts = (c.filename.split(/[\\/]/).pop() ?? "").toLowerCase().split(".");
  if (parts.slice(1, -1).some((p) => BLOCKED_EXTENSIONS.has(p))) errors.push("File name contains a blocked extension.");
  if (!(bucket.mimeTypes as readonly string[]).includes(c.mimeType)) {
    errors.push(`${c.mimeType || "This file type"} is not allowed in ${bucket.label}.`);
  } else if (!(MIME_EXTENSIONS[c.mimeType] ?? []).includes(ext)) {
    errors.push(`The .${ext} extension does not match the file type ${c.mimeType}.`);
  }
  if (!Number.isFinite(c.size) || c.size <= 0) errors.push("File is empty.");
  if (c.size > bucket.maxBytes) errors.push(`File is larger than the ${Math.round(bucket.maxBytes / 1024 / 1024)} MB limit.`);
  const kind = kindFromMime(c.mimeType);
  if (kind === "image" && c.mimeType !== "image/svg+xml") {
    for (const d of [c.width, c.height]) {
      if (d != null && (!Number.isInteger(d) || d <= 0 || d > MAX_IMAGE_DIMENSION)) {
        errors.push(`Image dimensions must be between 1 and ${MAX_IMAGE_DIMENSION}px.`);
        break;
      }
    }
  }
  if (kind === "video" && c.durationSeconds != null) {
    if (!Number.isFinite(c.durationSeconds) || c.durationSeconds < 0 || c.durationSeconds > MAX_VIDEO_SECONDS) {
      errors.push("Video duration is outside the allowed range (max 2 hours).");
    }
  }
  return errors;
}

/** Storage object key: yyyy/mm/<uuid>-<safe-name>.<ext> (no user-controlled directories). */
export function buildObjectPath(filename: string, uuid: string, now = new Date()): string {
  const ext = extensionOf(filename);
  const stem = (filename.split(/[\\/]/).pop() ?? "file")
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60) || "file";
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}/${m}/${uuid}-${stem}.${ext}`;
}

const PATH_RE = /^\d{4}\/\d{2}\/[0-9a-f-]{36}-[a-z0-9-]{1,60}\.[a-z0-9]{2,5}$/;
export function isValidObjectPath(path: string): boolean {
  return PATH_RE.test(path);
}
