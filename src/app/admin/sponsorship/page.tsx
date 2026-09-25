import { Lock, Plus } from "lucide-react";
import Link from "next/link";

import { EntityRow } from "@/components/admin/entity-row";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { buttonVariants } from "@/components/ui/button";
import { reorder } from "@/server/actions/cms-common";
import { can, requirePagePermission } from "@/server/auth/session";
import { listPackagesAdmin, listPartnersAdmin } from "@/server/dal/admin/cms";

export const metadata = { title: "Sponsorship" };

export default async function SponsorshipAdminPage() {
  const staff = await requirePagePermission("cms.read");
  const [packages, partners] = await Promise.all([listPackagesAdmin(), listPartnersAdmin()]);
  const canWrite = can(staff, "sponsorship.write");
  const canPublish = can(staff, "sponsorship.publish");
  return (
    <>
      <AdminPageHeader title="Sponsorship" description="Public partnership formats and previous partners. Audience data and page copy live in Settings → Sponsorship." />
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Packages</h2>
          {canWrite ? <Link href="/admin/sponsorship/packages/new" className={buttonVariants({ size: "sm" })}><Plus /> New package</Link> : null}
        </div>
        {can(staff, "sponsorship.rates") ? <p className="mb-3 flex items-center gap-1.5 text-xs text-subtle"><Lock className="size-3.5" /> Internal rates are edited on each package page.</p> : null}
        {packages.length ? (
          <SortableList
            disabled={!canPublish}
            onReorder={async (ids) => {
              "use server";
              return reorder("packages", ids);
            }}
            items={packages.map((p) => ({ id: p.id, content: <EntityRow href={`/admin/sponsorship/packages/${p.id}`} title={p.name} meta={p.summary} thumb={false} entity="packages" id={p.id} canPublish={canPublish} flags={[{ flag: "isPublished", value: p.isPublished, label: "Published", offLabel: "Draft" }]} /> }))}
          />
        ) : <p className="text-sm text-muted">No packages. The sponsorship page falls back to the formats in Settings.</p>}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Previous partners</h2>
          {canWrite ? <Link href="/admin/sponsorship/partners/new" className={buttonVariants({ size: "sm" })}><Plus /> New partner</Link> : null}
        </div>
        {partners.length ? (
          <SortableList
            disabled={!canPublish}
            onReorder={async (ids) => {
              "use server";
              return reorder("partners", ids);
            }}
            items={partners.map((p) => ({ id: p.id, content: <EntityRow href={`/admin/sponsorship/partners/${p.id}`} title={p.name} meta={p.campaignSummary} thumb={false} entity="partners" id={p.id} canPublish={canPublish} flags={[{ flag: "isPublished", value: p.isPublished, label: "Published", offLabel: "Draft" }]} /> }))}
          />
        ) : <p className="text-sm text-muted">No partners yet.</p>}
      </section>
    </>
  );
}
