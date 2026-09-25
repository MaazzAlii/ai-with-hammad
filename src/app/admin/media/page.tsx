import Link from "next/link";

import { MediaLibraryUploader } from "@/components/admin/media-library-uploader";
import { MediaThumb } from "@/components/admin/media-thumb";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { BUCKET_IDS, BUCKETS, type BucketId } from "@/lib/media/buckets";
import { formatBytes } from "@/lib/utils";
import { can, requirePagePermission } from "@/server/auth/session";
import { listMedia } from "@/server/dal/admin/media";

export const metadata = { title: "Media library" };

export default async function MediaLibraryPage(props: PageProps<"/admin/media">) {
  const staff = await requirePagePermission("cms.read");
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const kind = typeof sp.kind === "string" ? sp.kind : undefined;
  const bucket = typeof sp.bucket === "string" && BUCKET_IDS.includes(sp.bucket as BucketId) ? sp.bucket : undefined;
  const sort = (["newest", "oldest", "name", "size"] as const).find((s) => s === sp.sort) ?? "newest";
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total, pageSize } = await listMedia({ q, kind, bucket, sort, page });
  const uploadBuckets = BUCKET_IDS.filter((b) => b !== "site-assets" || can(staff, "settings.write"));
  const qs = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (kind) s.set("kind", kind);
    if (bucket) s.set("bucket", bucket);
    if (sort !== "newest") s.set("sort", sort);
    s.set("page", String(p));
    return `/admin/media?${s}`;
  };
  return (
    <>
      <AdminPageHeader title="Media library" description={`${total} file${total === 1 ? "" : "s"} in Supabase Storage. PostgreSQL stores only metadata.`} />
      {can(staff, "media.upload") ? (
        <div className="mb-8">
          <MediaLibraryUploader buckets={uploadBuckets} />
        </div>
      ) : null}
      <form className="mb-6 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <Input name="q" defaultValue={q} placeholder="Search name or alt text" aria-label="Search media" />
        <NativeSelect name="kind" defaultValue={kind ?? ""} aria-label="Type">
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </NativeSelect>
        <NativeSelect name="bucket" defaultValue={bucket ?? ""} aria-label="Bucket">
          <option value="">All buckets</option>
          {BUCKET_IDS.map((b) => <option key={b} value={b}>{BUCKETS[b].label}</option>)}
        </NativeSelect>
        <NativeSelect name="sort" defaultValue={sort} aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
          <option value="size">Largest</option>
        </NativeSelect>
        <Button type="submit" variant="secondary">Apply</Button>
      </form>
      {items.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/media/${m.id}`} className="group block">
                <MediaThumb media={m} className="transition-[border-color] group-hover:border-accent" />
                <span className="mt-1.5 block truncate text-sm">{m.filename}</span>
                <span className="block text-xs text-subtle">{formatBytes(m.sizeBytes)}{m.width ? ` · ${m.width}×${m.height}` : ""}{m.kind === "image" && !m.altText ? " · no alt" : ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="No media found" />}
      <div className="mt-6 flex justify-between text-sm">
        {page > 1 ? <Link href={qs(page - 1)} className="text-accent">← Previous</Link> : <span />}
        {page * pageSize < total ? <Link href={qs(page + 1)} className="text-accent">Next →</Link> : null}
      </div>
    </>
  );
}
