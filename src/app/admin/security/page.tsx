import { AdminPageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils";
import { requireStaff } from "@/server/auth/session";
import { listMyLoginHistory } from "@/server/dal/admin/security";
import { getMfaStatus } from "@/server/actions/mfa";

import { MfaPanel } from "./mfa-panel";

export const metadata = { title: "Security" };

const ACTION_LABEL: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign-in attempt",
  "auth.login_blocked": "Blocked sign-in (inactive account)",
  "auth.mfa_verified": "Completed 2FA sign-in",
  "auth.mfa_failed": "Failed 2FA code",
  "auth.mfa_enrolled": "Enabled 2FA",
  "auth.mfa_removed": "Removed 2FA",
  "auth.logout": "Signed out",
};

export default async function SecurityPage() {
  const staff = await requireStaff();
  const [status, history] = await Promise.all([getMfaStatus(), listMyLoginHistory(staff.id, staff.email)]);
  return (
    <>
      <AdminPageHeader title="Security" description="Manage two-factor authentication and review recent sign-in activity for your own account." />
      <div className="max-w-2xl space-y-8">
        <MfaPanel enrolled={status.enrolled} factorId={status.factorId} />
        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Recent activity</h2>
          {history.length ? (
            <ul className="glass-card divide-y divide-(--glass-line) overflow-hidden rounded-card text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <span className="text-fg">{ACTION_LABEL[h.action] ?? h.action}</span>
                  <span className="shrink-0 text-muted">{formatDate(h.createdAt, { hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No activity recorded yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
