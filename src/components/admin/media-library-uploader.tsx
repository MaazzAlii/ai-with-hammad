"use client";

import { useRouter } from "next/navigation";

import type { BucketId } from "@/lib/media/buckets";

import { MediaUploader } from "./media-uploader";

export function MediaLibraryUploader({ buckets, replaceId, defaultBucket }: { buckets?: BucketId[]; replaceId?: string; defaultBucket?: BucketId }) {
  const router = useRouter();
  return <MediaUploader buckets={buckets} replaceId={replaceId} defaultBucket={defaultBucket} onUploaded={() => router.refresh()} />;
}
