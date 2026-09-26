import { asc, isNull } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { AdminForm } from "@/components/admin/admin-form";
import { DeleteEntityButton } from "@/components/admin/delete-button";
import { EntityRow } from "@/components/admin/entity-row";
import { FormSection, SelectField, SwitchField, TextField } from "@/components/admin/fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { getDb } from "@/db";
import { bioLinks, teamMembers, type bioLinkKinds } from "@/db/schema";
import { BIO_LINK_ICONS } from "@/lib/validation/admin";
import { reorder } from "@/server/actions/cms-common";
import { saveBioLink } from "@/server/actions/links";
import { isMissingTable, whyNotLive } from "@/server/dal/public/links";
import { can, requirePagePermission } from "@/server/auth/session";

export const metadata = { title: "Link in bio" };

const KINDS: { value: (typeof bioLinkKinds)[number]; label: string }[] = [
  { value: "link", label: "Link" },
  { value: "social", label: "Social profile (icon)" },
  { value: "affiliate", label: "Affiliate (labelled)" },
  { value: "sponsor", label: "Sponsored (labelled)" },
];
const ICONS = BIO_LINK_ICONS.map((i) => ({ value: i, label: i ? i[0]!.toUpperCase() + i.slice(1) : "Automatic" }));

/** datetime-local value in UTC (the form states that times are UTC). */
const dt = (d: Date | null) => (d ? d.toISOString().slice(0, 16) : "");

type Row = typeof bioLinks.$inferSelect;

function LinkFields({ link, people }: { link?: Row; people: { value: string; label: string }[] }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="title" label="Title" required maxLength={80} defaultValue={link?.title} placeholder="e.g. Watch the latest video" />
        <TextField name="url" label="URL" required defaultValue={link?.url} placeholder="https://… or mailto:…" />
      </div>
      <TextField name="description" label="Subtitle (optional)" maxLength={160} defaultValue={link?.description} />
      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField name="kind" label="Type" defaultValue={link?.kind ?? "link"} options={KINDS} />
        <SelectField name="icon" label="Icon" defaultValue={link?.icon ?? ""} options={ICONS} />
        <SelectField name="teamMemberId" label="Belongs to" defaultValue={link?.teamMemberId ?? ""} options={[{ value: "", label: "Brand (main list)" }, ...people]} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="startsAt" type="datetime-local" label="Show from (UTC, optional)" defaultValue={dt(link?.startsAt ?? null)} />
        <TextField name="endsAt" type="datetime-local" label="Hide after (UTC, optional)" defaultValue={dt(link?.endsAt ?? null)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchField name="isFeatured" label="Featured (large, at the top)" defaultChecked={link?.isFeatured ?? false} />
        <SwitchField name="isPublished" label="Published" defaultChecked={link?.isPublished ?? true} />
      </div>
    </>
  );
}

export default async function LinksAdminPage() {
  const staff = await requirePagePermission("cms.read");
  const db = getDb();
  const [linkRows, team] = await Promise.all([
    db
      .select()
      .from(bioLinks)
      .where(isNull(bioLinks.deletedAt))
      .orderBy(asc(bioLinks.sortOrder), asc(bioLinks.createdAt))
      .catch((e: unknown) => {
        if (!isMissingTable(e)) throw e;
        return null;
      }),
    db.select({ id: teamMembers.id, name: teamMembers.name }).from(teamMembers).where(isNull(teamMembers.deletedAt)).orderBy(asc(teamMembers.sortOrder)),
  ]);
  // null = the bio_links migration hasn't been run on this database yet.
  const migrationMissing = linkRows === null;
  const rows = linkRows ?? [];
  const people = team.map((t) => ({ value: t.id, label: t.name }));
  const nameOf = new Map(team.map((t) => [t.id, t.name]));
  const canWrite = can(staff, "links.write");
  const totalClicks = rows.reduce((n, r) => n + r.clickCount, 0);
  return (
    <>
      <AdminPageHeader
        title="Link in bio"
        description={`Your public link page for TikTok, Instagram and YouTube bios. ${totalClicks.toLocaleString()} tracked clicks so far. Drag to reorder.`}
        actions={
          <Link href="/links" target="_blank" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Open /links <ExternalLink aria-hidden />
          </Link>
        }
      />
      {migrationMissing ? (
        <Alert tone="warning" className="mb-6">
          The link-in-bio table doesn&apos;t exist in this database yet. Run <code>supabase/migrations/20260926_bio_links.sql</code> once in the Supabase SQL editor, then reload.
        </Alert>
      ) : null}
      {rows.length ? (
        <SortableList
          disabled={!canWrite}
          onReorder={async (ids) => {
            "use server";
            return reorder("links", ids);
          }}
          items={rows.map((l) => ({
            id: l.id,
            content: (
              <details className="group/row">
                <summary className="cursor-pointer list-none">
                  <EntityRow
                    title={l.title}
                    meta={[whyNotLive(l) ? `⚠ Not on /links: ${whyNotLive(l)}` : "Live on /links", l.kind, l.teamMemberId ? nameOf.get(l.teamMemberId) : null, `${l.clickCount} clicks`, l.url].filter(Boolean).join(" · ")}
                    thumb={false}
                    entity="links"
                    id={l.id}
                    canPublish={canWrite}
                    inlineEdit
                    label="link"
                    flags={[
                      { flag: "isPublished", value: l.isPublished, label: "Published", offLabel: "Hidden" },
                      { flag: "isFeatured", value: l.isFeatured, label: "Featured", offLabel: "Not featured" },
                    ]}
                  />
                </summary>
                <div className="border-t border-(--glass-line) p-4">
                  <AdminForm
                    action={saveBioLink.bind(null, l.id)}
                    disabled={!canWrite}
                    compact
                    footer={canWrite ? <DeleteEntityButton entity="links" id={l.id} redirectTo="/admin/links" label="link" /> : null}
                  >
                    <div className="grid gap-5">
                      <LinkFields link={l} people={people} />
                    </div>
                  </AdminForm>
                </div>
              </details>
            ),
          }))}
        />
      ) : (
        <p className="glass-card rounded-card p-6 text-sm text-muted">No links yet. Add your first one below — it appears on /links immediately.</p>
      )}
      {canWrite && !migrationMissing ? (
        <div className="mt-8 max-w-3xl">
          <AdminForm action={saveBioLink.bind(null, null)} submitLabel="Add link" compact>
            <FormSection
              title="Add link"
              description="Brand links go in the main list. To add Hammadullah's or Maaz's profiles, pick Type “Social profile” and Belongs to that person — only links you add here are shown, and switching Published off hides one. Affiliate and sponsored links are labelled for visitors."
            >
              <LinkFields people={people} />
            </FormSection>
          </AdminForm>
        </div>
      ) : null}
    </>
  );
}
