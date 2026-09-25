import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { DeleteEntityButton } from "@/components/admin/delete-button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { getDb } from "@/db";
import { testimonials } from "@/db/schema";
import { saveManualTestimonial } from "@/server/actions/testimonials";
import { requirePagePermission } from "@/server/auth/session";
import { getMediaMany } from "@/server/dal/admin/media";
import { clientOptions } from "@/server/dal/portal";

export const metadata = { title: "Edit testimonial" };

export default async function EditTestimonialPage(props: PageProps<"/admin/testimonials/[id]">) {
  const { id } = await props.params;
  await requirePagePermission("testimonials.moderate");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [t] = await getDb().select().from(testimonials).where(eq(testimonials.id, id));
  if (!t || t.deletedAt || t.source !== "manual") notFound();
  const media = await getMediaMany([t.photoMediaId]);
  return (
    <>
      <AdminPageHeader
        title={`Testimonial from ${t.authorName}`}
        breadcrumbs={[{ href: "/admin/testimonials", label: "Testimonials" }]}
        actions={<DeleteEntityButton entity="testimonials" id={id} redirectTo="/admin/testimonials" label="testimonial" />}
      />
      <div className="max-w-3xl">
        <TestimonialForm action={saveManualTestimonial.bind(null, id)} t={t} photo={t.photoMediaId ? media.get(t.photoMediaId) : null} clientOptions={await clientOptions()} />
      </div>
    </>
  );
}
