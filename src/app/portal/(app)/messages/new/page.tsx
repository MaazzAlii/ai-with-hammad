import { AdminForm } from "@/components/admin/admin-form";
import { TextAreaField, TextField } from "@/components/admin/fields";
import { createClientThread } from "@/server/actions/portal";
import { requireClient } from "@/server/auth/client-session";

export const metadata = { title: "New message" };

export default async function NewThreadPage() {
  await requireClient();
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-[1.75rem] sm:text-[2rem]">New message</h1>
      <AdminForm action={createClientThread} submitLabel="Send message" compact>
        <div className="glass-panel grid gap-5 rounded-[1.5rem] p-5 sm:p-7">
          <TextField name="subject" label="Subject" required maxLength={200} placeholder="e.g. Question about the CRM integration" />
          <TextAreaField name="body" label="Message" rows={8} required />
        </div>
      </AdminForm>
    </div>
  );
}
