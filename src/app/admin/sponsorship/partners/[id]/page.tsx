import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { DeleteEntityButton } from "@/components/admin/delete-button";
import { AdminPageHeader, StatusBadges } from "@/components/admin/page-header";
import { PartnerForm } from "@/components/admin/sponsorship-forms";
import { getDb } from "@/db";
import { sponsorshipPartners } from "@/db/schema";
import { savePartner } from "@/server/actions/sponsorship";
import { can, requirePagePermission } from "@/server/auth/session";
import { getMediaMany } from "@/server/dal/admin/media";

export const metadata = { title: "Edit partner" };

export default async function EditPartnerPage(props: PageProps<"/admin/sponsorship/partners/[id]">) {
  const { id } = await props.params;
  const staff = await requirePagePermission("cms.read");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [partner] = await getDb().select().from(sponsorshipPartners).where(eq(sponsorshipPartners.id, id));
  if (!partner || partner.deletedAt) notFound();
  const media = await getMediaMany([partner.logoMediaId]);
  return (
    <>
      <AdminPageHeader
        title={partner.name}
        breadcrumbs={[{ href: "/admin/sponsorship", label: "Sponsorship" }]}
        actions={<><StatusBadges isPublished={partner.isPublished} />{can(staff, "sponsorship.delete") ? <DeleteEntityButton entity="partners" id={id} redirectTo="/admin/sponsorship" label="partner" /> : null}</>}
      />
      <PartnerForm action={savePartner.bind(null, id)} partner={partner} logo={partner.logoMediaId ? media.get(partner.logoMediaId) : null} canWrite={can(staff, "sponsorship.write")} canPublish={can(staff, "sponsorship.publish")} />
    </>
  );
}
