import { ChevronDown, Plus } from "lucide-react";

import { AdminForm } from "@/components/admin/admin-form";
import { DeleteEntityButton } from "@/components/admin/delete-button";
import { EntityRow } from "@/components/admin/entity-row";
import { SelectField, SwitchField, TextField } from "@/components/admin/fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { buttonVariants } from "@/components/ui/button";
import { reorder } from "@/server/actions/cms-common";
import { saveNavItem } from "@/server/actions/site";
import { requirePagePermission } from "@/server/auth/session";
import { listNavigationAdmin } from "@/server/dal/admin/cms";

export const metadata = { title: "Navigation" };

const LOCATIONS = [
  { value: "header", label: "Header", hint: "The main menu at the top of every page (and the phone menu)." },
  { value: "footer", label: "Footer", hint: "The “Explore” links at the bottom of every page." },
  { value: "legal", label: "Footer legal links", hint: "Small links in the footer’s bottom row." },
] as const;

const LINK_HINT = "An internal page like /projects or /links, or a full https:// address (opens in a new tab).";

/** Collapsible "Add link" form. `location` preselects the menu; the owner can still change it. */
function AddLinkForm({ location, label, id }: { location: string; label: string; id?: string }) {
  return (
    <details id={id} className="group/add">
      <summary className={buttonVariants({ variant: "secondary", size: "sm", className: "cursor-pointer list-none group-open/add:bg-accent-soft group-open/add:text-accent [&::-webkit-details-marker]:hidden" })}>
        <Plus aria-hidden /> {label}
        <ChevronDown aria-hidden className="transition-transform group-open/add:rotate-180" />
      </summary>
      <div className="glass-card mt-3 rounded-card p-5">
        <AdminForm action={saveNavItem.bind(null, null)} submitLabel="Add link" compact>
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField name="location" label="Menu" defaultValue={location} options={LOCATIONS.map(({ value, label }) => ({ value, label }))} />
            <TextField name="label" label="Label" required placeholder="e.g. Case studies" />
            <TextField name="href" label="Link" required placeholder="/projects" hint={LINK_HINT} />
          </div>
          <SwitchField name="isVisible" label="Visible on the site" defaultChecked />
        </AdminForm>
      </div>
    </details>
  );
}

export default async function NavigationPage() {
  await requirePagePermission("navigation.write");
  const items = await listNavigationAdmin();
  return (
    <>
      <AdminPageHeader
        title="Navigation"
        description="Every menu on the site. Add, rename, hide, reorder (drag) or delete links — changes go live immediately."
      />
      <div className="mb-10">
        <AddLinkForm location="header" label="Add link" id="add-link" />
      </div>
      <div className="space-y-12">
        {LOCATIONS.map((loc) => {
          const list = items.filter((i) => i.location === loc.value);
          return (
            <section key={loc.value} aria-labelledby={`nav-${loc.value}`}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id={`nav-${loc.value}`} className="text-lg">{loc.label}</h2>
                  <p className="text-sm text-muted">{loc.hint}</p>
                </div>
                <span className="text-xs text-subtle">{list.length} link{list.length === 1 ? "" : "s"}</span>
              </div>
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
                        <div className="border-t border-(--glass-line) p-4">
                          <AdminForm compact action={saveNavItem.bind(null, i.id)} footer={<DeleteEntityButton entity="navigation" id={i.id} redirectTo="/admin/navigation" label="link" />}>
                            <div className="grid gap-4 sm:grid-cols-3">
                              <SelectField name="location" label="Menu" defaultValue={i.location} options={LOCATIONS.map(({ value, label }) => ({ value, label }))} />
                              <TextField name="label" label="Label" required defaultValue={i.label} />
                              <TextField name="href" label="Link" required defaultValue={i.href} hint={LINK_HINT} />
                            </div>
                            <SwitchField name="isVisible" label="Visible on the site" defaultChecked={i.isVisible} />
                          </AdminForm>
                        </div>
                      </details>
                    ),
                  }))}
                />
              ) : (
                <p className="glass-card rounded-card p-5 text-sm text-muted">No links here yet — the site uses its built-in defaults until you add one.</p>
              )}
              <div className="mt-3">
                <AddLinkForm location={loc.value} label={`Add to ${loc.label}`} />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
