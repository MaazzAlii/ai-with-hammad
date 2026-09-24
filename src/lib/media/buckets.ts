/**
 * Storage bucket configuration. Mirrors storage.buckets in
 * supabase/AI_WITH_HAMAD_SETUP.sql (server-side enforcement lives there);
 * used here for client-side validation and upload routing.
 */
export const MB = 1024 * 1024;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
export const DOCUMENT_TYPES = ["application/pdf"] as const;

export type BucketConfig = {
  id: string;
  label: string;
  public: boolean;
  maxBytes: number;
  mimeTypes: readonly string[];
  /** Requires settings.write (site-wide assets incl. SVG). */
  restricted?: boolean;
};

export const BUCKETS = {
  "media-library": { id: "media-library", label: "Media library", public: true, maxBytes: 500 * MB, mimeTypes: [...IMAGE_TYPES, ...VIDEO_TYPES, ...DOCUMENT_TYPES] },
  "project-images": { id: "project-images", label: "Project images", public: true, maxBytes: 15 * MB, mimeTypes: IMAGE_TYPES },
  "project-gallery": { id: "project-gallery", label: "Project gallery", public: true, maxBytes: 15 * MB, mimeTypes: IMAGE_TYPES },
  "project-videos": { id: "project-videos", label: "Project videos", public: true, maxBytes: 500 * MB, mimeTypes: VIDEO_TYPES },
  "team-images": { id: "team-images", label: "Team photos", public: true, maxBytes: 10 * MB, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  "content-thumbnails": { id: "content-thumbnails", label: "Content thumbnails", public: true, maxBytes: 10 * MB, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  "content-media": { id: "content-media", label: "Content media", public: true, maxBytes: 500 * MB, mimeTypes: [...IMAGE_TYPES, ...VIDEO_TYPES] },
  "sponsorship-media": { id: "sponsorship-media", label: "Sponsorship media", public: true, maxBytes: 50 * MB, mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
  "site-assets": { id: "site-assets", label: "Site assets", public: true, maxBytes: 10 * MB, mimeTypes: [...IMAGE_TYPES, "image/svg+xml", "image/x-icon"], restricted: true },
  "private-documents": { id: "private-documents", label: "Private documents", public: false, maxBytes: 50 * MB, mimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
} as const satisfies Record<string, BucketConfig>;

export type BucketId = keyof typeof BUCKETS;
export const BUCKET_IDS = Object.keys(BUCKETS) as BucketId[];

export function isBucketId(value: unknown): value is BucketId {
  return typeof value === "string" && value in BUCKETS;
}

/** Extensions allowed per MIME type (extension must agree with the declared type). */
export const MIME_EXTENSIONS: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "image/svg+xml": ["svg"],
  "image/x-icon": ["ico"],
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
  "application/pdf": ["pdf"],
};

/** Standard uploads are recommended up to 6 MB; larger files use TUS resumable uploads. */
export const RESUMABLE_THRESHOLD = 6 * MB;
