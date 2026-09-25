import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AdminForm } from "@/components/admin/admin-form";
import { FormSection, SwitchField, TextAreaField, TextField } from "@/components/admin/fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getDb } from "@/db";
import { legalDocuments } from "@/db/schema";
import { saveLegal } from "@/server/actions/site";
import { requirePagePermission } from "@/server/auth/session";

export const metadata = { title: "Edit legal page" };

export default async function EditLegalPage(props: PageProps<"/admin/legal/[slug]">) {
  const { slug } = await props.params;
  await requirePagePermission("legal.write");
  if (!["privacy-policy", "terms", "cookie-policy"].includes(slug)) notFound();
  const [doc] = await getDb().select().from(legalDocuments).where(eq(legalDocuments.slug, slug));
  return (
    <>
      <AdminPageHeader title={doc?.title ?? slug} breadcrumbs={[{ href: "/admin/legal", label: "Legal pages" }]} />
      <AdminForm action={saveLegal.bind(null, slug)}>
        <FormSection title="Document" description="Markdown supported. Do not claim compliance you have not verified.">
          <TextField name="title" label="Title" required defaultValue={doc?.title} />
          <TextField name="effectiveOn" label="Effective / last updated" type="date" defaultValue={doc?.effectiveOn} />
          <TextAreaField name="body" label="Body" rows={24} defaultValue={doc?.body} />
          <SwitchField name="isPublished" label="Published" defaultChecked={doc?.isPublished ?? true} />
        </FormSection>
      </AdminForm>
    </>
  );
}
