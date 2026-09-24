import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listLegalAdmin } from "@/server/dal/admin/cms";

export const metadata = { title: "Legal pages" };

export default async function LegalListPage() {
  await requirePagePermission("legal.write");
  const docs = await listLegalAdmin();
  return (
    <>
      <AdminPageHeader title="Legal pages" description="Starter texts are templates — have them reviewed by a qualified lawyer for your jurisdiction." />
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.slug}>
            <Link href={`/admin/legal/${d.slug}`} className="flex items-center justify-between rounded-card border border-border bg-surface p-4 hover:border-accent/40">
              <span className="font-medium">{d.title}</span>
              <span className="text-xs text-subtle">Updated {formatDate(d.updatedAt)}{d.isPublished ? "" : " · hidden"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
