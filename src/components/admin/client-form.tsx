import type { clients } from "@/db/schema";

import { AdminForm, type FormAction } from "./admin-form";
import { FormSection, SwitchField, TextAreaField, TextField } from "./fields";

export function ClientForm({ action, client, canWrite }: { action: FormAction; client?: typeof clients.$inferSelect | null; canWrite: boolean }) {
  return (
    <AdminForm action={action} disabled={!canWrite} submitLabel={client ? "Save client" : "Create client"} compact={Boolean(client)}>
      <FormSection title="Client">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="companyName" label="Company / client name" required defaultValue={client?.companyName} />
          <TextField name="contactName" label="Main contact" defaultValue={client?.contactName} />
          <TextField name="email" label="Email" type="email" defaultValue={client?.email} />
          <TextField name="phone" label="Phone" type="tel" defaultValue={client?.phone} />
          <TextField name="whatsapp" label="WhatsApp" defaultValue={client?.whatsapp} placeholder="+923001234567" />
        </div>
        <TextAreaField name="notes" label="Internal notes (never visible to the client)" rows={4} defaultValue={client?.notes} />
        <SwitchField name="isActive" label="Active (portal access enabled)" defaultChecked={client?.isActive ?? true} />
      </FormSection>
    </AdminForm>
  );
}
