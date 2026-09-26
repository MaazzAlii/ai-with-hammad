import { AdminForm } from "@/components/admin/admin-form";
import { DeleteEntityButton } from "@/components/admin/delete-button";
import { EntityRow } from "@/components/admin/entity-row";
import { FormSection, SelectField, SwitchField, TextField } from "@/components/admin/fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { reorder } from "@/server/actions/cms-common";
import { saveNavItem } from "@/server/actions/site";
import { requirePagePermission } from "@/server/auth/session";
import { listNavigationAdmin } from "@/server/dal/admin/cms";

export const metadata = { title: "Navigation" };

const LOCATIONS = [
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
  { value: "legal", label: "Footer legal links" },
];

export default async function NavigationPage() {
  await requirePagePermission("navigation.write");
  const items = await listNavigationAdmin();
  return (
    <>
      <AdminPageHeader title="Navigation" description="Links use internal paths (/projects) or https URLs. Drag to reorder within each menu." />
      <div className="space-y-10">
        {LOCATIONS.map((loc) => {
          const list = items.filter((i) => i.location === loc.value);
          return (
            <section key={loc.value}>
              <h2 className="mb-3 font-semibold">{loc.label}</h2>
              {list.length ? (
                <SortableList
                  onReorder={async (ids) => {
                    "use server";
                    return reorder("navigation", ids);
                  }}
                  items={list.map((i) => ({
                    id: i.id,
                    content: (
                      <details className="group/row">
                        <summary className="cursor-pointer list-none">
                          <EntityRow title={i.label} meta={i.href} thumb={false} entity="navigation" id={i.id} canPublish inlineEdit label="menu link" flags={[{ flag: "isVisible", value: i.isVisible, label: "Visible", offLabel: "Hidden" }]} />
                        </summary>
                        <div className="border-t border-border p-4">
                          <AdminForm compact action={saveNavItem.bind(null, i.id)} footer={<DeleteEntityButton entity="navigation" id={i.id} redirectTo="/admin/navigation" label="link" />}>
                            <div className="grid gap-4 sm:grid-cols-3">
                              <SelectField name="location" label="Menu" defaultValue={i.location} options={LOCATIONS} />
                              <TextField name="label" label="Label" required defaultValue={i.label} />
                              <TextField name="href" label="Link" required defaultValue={i.href} />
                            </div>
                            <SwitchField name="isVisible" label="Visible" defaultChecked={i.isVisible} />
                          </AdminForm>
                        </div>
                      </details>
                    ),
                  }))}
                />
              ) : <p className="text-sm text-muted">No links — defaults are used.</p>}
            </section>
          );
        })}
        <AdminForm action={saveNavItem.bind(null, null)} submitLabel="Add link" compact>
          <FormSection title="Add link">
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField name="location" label="Menu" defaultValue="header" options={LOCATIONS} />
              <TextField name="label" label="Label" required />
              <TextField name="href" label="Link" required placeholder="/projects" />
            </div>
            <SwitchField name="isVisible" label="Visible" defaultChecked />
          </FormSection>
        </AdminForm>
      </div>
    </>
  );
}
