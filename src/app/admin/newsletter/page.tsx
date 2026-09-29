import { Trash2 } from "lucide-react";

import { ActionButton } from "@/components/admin/confirm-action";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/site/section";
import { deleteNewsletterSubscriber } from "@/server/actions/newsletter";
import { requirePagePermission } from "@/server/auth/session";
import { listNewsletterSubscribers } from "@/server/dal/admin/newsletter";

export const metadata = { title: "Newsletter" };

export default async function NewsletterPage() {
  await requirePagePermission("newsletter.manage");
  const rows = await listNewsletterSubscribers();
  return (
    <>
      <AdminPageHeader title="Newsletter" description="Emails collected from the homepage/footer signup form. Export and import into your email tool manually — nothing is sent automatically yet." />
      {rows.length ? (
        <div className="glass-panel overflow-hidden rounded-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Subscribed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-fg">{r.email}</td>
                  <td className="px-4 py-3 text-muted">{r.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <ActionButton
                      variant="ghost"
                      size="icon"
                      className="size-9 text-muted hover:bg-danger-soft hover:text-danger"
                      aria-label={`Remove ${r.email}`}
                      confirm={{ title: "Remove subscriber?", description: `${r.email} will stop being counted as subscribed.`, confirmLabel: "Remove" }}
                      action={async () => {
                        "use server";
                        return deleteNewsletterSubscriber(r.id);
                      }}
                    >
                      <Trash2 />
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No subscribers yet">Once visitors sign up from the homepage footer, they&apos;ll show up here.</EmptyState>
      )}
    </>
  );
}
