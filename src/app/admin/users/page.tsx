import { asc } from "drizzle-orm";

import { AdminForm } from "@/components/admin/admin-form";
import { FormSection, SelectField, SwitchField, TextField } from "@/components/admin/fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { canManageRole, ROLES } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { inviteUser, updateUser } from "@/server/actions/users";
import { can, requirePagePermission } from "@/server/auth/session";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const staff = await requirePagePermission("users.read");
  const users = await getDb().select().from(profiles).orderBy(asc(profiles.email));
  const canManage = can(staff, "users.manage");
  const roleOptions = ROLES.filter((r) => canManageRole(staff.role, "viewer", r)).map((r) => ({ value: r, label: r[0]!.toUpperCase() + r.slice(1) }));
  return (
    <>
      <AdminPageHeader title="Users" description="Staff access is invite-only. New accounts from any other source get no access until activated here." />
      <ul className="space-y-2">
        {users.map((u) => {
          const editable = canManage && u.id !== staff.id && canManageRole(staff.role, u.role, u.role);
          return (
            <li key={u.id} className="rounded-card border border-border bg-surface">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{u.fullName || u.email}{u.id === staff.id ? " (you)" : ""}</span>
                    <span className="block truncate text-xs text-subtle">{u.email} · last sign-in {u.lastSignInAt ? formatDate(u.lastSignInAt) : "never"}</span>
                  </span>
                  <span className="flex gap-2 text-xs">
                    <span className="rounded-full border border-border-strong px-2 py-0.5 capitalize">{u.role}</span>
                    <span className={u.isActive ? "rounded-full border border-success/30 px-2 py-0.5 text-success" : "rounded-full border border-danger/30 px-2 py-0.5 text-danger"}>{u.isActive ? "Active" : "Inactive"}</span>
                  </span>
                </summary>
                {editable ? (
                  <div className="border-t border-border p-4">
                    <AdminForm action={updateUser.bind(null, u.id)} compact>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextField name="fullName" label="Name" defaultValue={u.fullName} />
                        <SelectField name="role" label="Role" defaultValue={u.role} options={roleOptions} />
                      </div>
                      <SwitchField name="isActive" label="Active" defaultChecked={u.isActive} hint="Inactive users are signed out and cannot access the CMS." />
                    </AdminForm>
                  </div>
                ) : null}
              </details>
            </li>
          );
        })}
      </ul>
      {canManage ? (
        <div className="mt-8 max-w-2xl">
          <AdminForm action={inviteUser} submitLabel="Send invitation" compact>
            <FormSection title="Invite a user" description="They receive an email link to set a password.">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="email" label="Email" type="email" required />
                <TextField name="fullName" label="Name" />
              </div>
              <SelectField name="role" label="Role" defaultValue="editor" options={roleOptions} />
            </FormSection>
          </AdminForm>
        </div>
      ) : null}
    </>
  );
}
