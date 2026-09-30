import { AdminPageHeader } from "@/components/admin/page-header";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { saveManualTestimonial } from "@/server/actions/testimonials";
import { requirePagePermission } from "@/server/auth/session";
import { projectOptions, sponsorshipPartnerOptions } from "@/server/dal/admin/cms";
import { clientOptions } from "@/server/dal/portal";

export const metadata = { title: "Add testimonial" };

export default async function NewTestimonialPage() {
  await requirePagePermission("testimonials.moderate");
  const [clients, projects, partners] = await Promise.all([clientOptions(), projectOptions(), sponsorshipPartnerOptions()]);
  return (
    <>
      <AdminPageHeader title="Add testimonial" breadcrumbs={[{ href: "/admin/testimonials", label: "Testimonials" }]} />
      <div className="max-w-3xl">
        <TestimonialForm action={saveManualTestimonial.bind(null, null)} clientOptions={clients} projectOptions={projects} partnerOptions={partners} />
      </div>
    </>
  );
}
