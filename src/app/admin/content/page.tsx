import { Plus } from "lucide-react";
import Link from "next/link";

import { EntityRow } from "@/components/admin/entity-row";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { EmptyState } from "@/components/site/section";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { reorder } from "@/server/actions/cms-common";
import { can, requirePagePermission } from "@/server/auth/session";
import { listContentAdmin } from "@/server/dal/admin/cms";
import { PLATFORM_LABELS } from "@/server/dal/public/content";

export const metadata = { title: "Content" };

export default async function ContentAdminPage() {
  const staff = await requirePagePermission("cms.read");
  const rows = await listContentAdmin();
  const canPublish = can(staff, "content.publish");
  return (
    <>
      <AdminPageHeader title="Content" description="Creator content. Drag to reorder; use highlight flags to feature items on the homepage and sponsorship pages." actions={can(staff, "content.write") ? <Link href="/admin/content/new" className={buttonVariants()}><Plus /> New content</Link> : null} />
      {rows.length ? (
        <SortableList
          disabled={!canPublish}
          onReorder={async (ids) => {
            "use server";
            return reorder("content", ids);
          }}
          items={rows.map((c) => ({
            id: c.id,
            content: (
              <EntityRow
                href={`/admin/content/${c.id}`}
                title={c.title}
                meta={`${PLATFORM_LABELS[c.platform]}${c.publishedDate ? ` · ${formatDate(c.publishedDate)}` : ""}${c.performanceRank ? ` · rank ${c.performanceRank}` : ""}`}
                thumb={false}
                entity="content"
                id={c.id}
                canPublish={canPublish}
                flags={[
                  { flag: "isPublished", value: c.isPublished, label: "Published", offLabel: "Draft" },
                  { flag: "isFeatured", value: c.isFeatured, label: "Featured" },
                  { flag: "isHighPerforming", value: c.isHighPerforming, label: "High performing" },
                  { flag: "isCampaign", value: c.isCampaign, label: "Campaign" },
                  { flag: "isCaseStudy", value: c.isCaseStudy, label: "Case study" },
                ]}
              />
            ),
          }))}
        />
      ) : <EmptyState title="No content yet" />}
    </>
  );
}
