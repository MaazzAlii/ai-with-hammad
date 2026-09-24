import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { DeleteEntityButton } from "@/components/admin/delete-button";
import { AdminPageHeader, StatusBadges } from "@/components/admin/page-header";
import { PackageForm, RatesForm } from "@/components/admin/sponsorship-forms";
import { getDb } from "@/db";
import { sponsorshipPackages } from "@/db/schema";
import { saveRates, savePackage } from "@/server/actions/sponsorship";
import { can, requirePagePermission } from "@/server/auth/session";
import { getPackageRates } from "@/server/dal/admin/cms";

export const metadata = { title: "Edit package" };

export default async function EditPackagePage(props: PageProps<"/admin/sponsorship/packages/[id]">) {
  const { id } = await props.params;
  const staff = await requirePagePermission("cms.read");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [pkg] = await getDb().select().from(sponsorshipPackages).where(eq(sponsorshipPackages.id, id));
  if (!pkg || pkg.deletedAt) notFound();
  // Rates are only loaded for users allowed to see them.
  const canSeeRates = can(staff, "sponsorship.rates");
  const rates = canSeeRates ? await getPackageRates(id) : null;
  return (
    <>
      <AdminPageHeader
        title={pkg.name}
        breadcrumbs={[{ href: "/admin/sponsorship", label: "Sponsorship" }]}
        actions={<><StatusBadges isPublished={pkg.isPublished} />{can(staff, "sponsorship.delete") ? <DeleteEntityButton entity="packages" id={id} redirectTo="/admin/sponsorship" label="package" /> : null}</>}
      />
      <div className="space-y-8">
        <PackageForm action={savePackage.bind(null, id)} pkg={pkg} canWrite={can(staff, "sponsorship.write")} canPublish={can(staff, "sponsorship.publish")} />
        {canSeeRates ? <RatesForm action={saveRates.bind(null, id)} rates={rates} /> : null}
      </div>
    </>
  );
}
