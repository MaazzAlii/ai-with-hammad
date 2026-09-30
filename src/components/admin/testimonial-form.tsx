import type { testimonials } from "@/db/schema";
import type { AdminMedia } from "@/server/dal/admin/media";

import { AdminForm, type FormAction } from "./admin-form";
import { FormSection, SelectField, SwitchField, TextAreaField, TextField } from "./fields";
import { MediaField } from "./media-picker";
import { StarRatingInput } from "../portal/star-rating";

export function TestimonialForm({
  action,
  t,
  photo,
  clientOptions,
  projectOptions,
  partnerOptions,
}: {
  action: FormAction;
  t?: typeof testimonials.$inferSelect | null;
  photo?: AdminMedia | null;
  clientOptions: { id: string; name: string }[];
  projectOptions: { id: string; title: string }[];
  partnerOptions: { id: string; name: string }[];
}) {
  return (
    <AdminForm action={action} submitLabel={t ? "Save testimonial" : "Add testimonial"}>
      <FormSection title="Testimonial" description="Add only real testimonials you received (e.g. on WhatsApp or email) and have permission to publish.">
        <StarRatingInput defaultValue={t?.rating ?? 0} />
        <TextAreaField name="quote" label="Quote" rows={5} required defaultValue={t?.quote} />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField name="authorName" label="Author name" required defaultValue={t?.authorName} />
          <TextField name="authorTitle" label="Role / title" defaultValue={t?.authorTitle} />
          <TextField name="company" label="Company" defaultValue={t?.company} />
        </div>
        <SelectField name="clientId" label="Client (optional)" defaultValue={t?.clientId ?? ""} options={[{ value: "", label: "—" }, ...clientOptions.map((c) => ({ value: c.id, label: c.name }))]} />
        <SelectField name="projectId" label="About this project (optional)" defaultValue={t?.projectId ?? ""} options={[{ value: "", label: "—" }, ...projectOptions.map((p) => ({ value: p.id, label: p.title }))]} hint="Shows this testimonial on the project's case study page." />
        <SelectField name="sponsorshipPartnerId" label="From this brand/sponsor (optional)" defaultValue={t?.sponsorshipPartnerId ?? ""} options={[{ value: "", label: "—" }, ...partnerOptions.map((p) => ({ value: p.id, label: p.name }))]} hint="Shows this testimonial on the Sponsorship page." />
        <MediaField name="photoMediaId" label="Author photo (optional)" defaultMedia={photo} uploadBucket="media-library" />
        <SwitchField name="consentToPublish" label="The author agreed to publication" defaultChecked={t?.consentToPublish ?? false} />
      </FormSection>
    </AdminForm>
  );
}
