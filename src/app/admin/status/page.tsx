import { CheckCircle2, RotateCw, XCircle } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Alert, Table, Td, Th } from "@/components/ui/misc";
import { requirePagePermission } from "@/server/auth/session";
import { runSystemChecks } from "@/server/dal/admin/diagnostics";

export const metadata = { title: "System status" };

export default async function StatusPage() {
  await requirePagePermission("settings.write");
  const checks = await runSystemChecks();
  const failed = checks.filter((c) => !c.ok);
  const groups = [...new Set(checks.map((c) => c.group))];
  return (
    <>
      <AdminPageHeader
        title="System status"
        description="Live checks of configuration, database connection, tables and the queries behind the dashboard and /links."
        actions={
          <Link href="/admin/status" prefetch={false} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <RotateCw aria-hidden /> Run again
          </Link>
        }
      />
      {failed.length ? (
        <Alert tone="danger" className="mb-6">
          {failed.length} check{failed.length === 1 ? "" : "s"} failed. The details column shows the database error — share a screenshot of this page if you need help.
        </Alert>
      ) : (
        <Alert tone="success" className="mb-6">All checks passed.</Alert>
      )}
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g} aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className="label-caps mb-3">{g}</h2>
            <Table>
              <thead>
                <tr>
                  <Th className="w-10"><span className="sr-only">Result</span></Th>
                  <Th>Check</Th>
                  <Th>Details</Th>
                  <Th className="text-right">Time</Th>
                </tr>
              </thead>
              <tbody>
                {checks.filter((c) => c.group === g).map((c) => (
                  <tr key={c.name}>
                    <Td>
                      {c.ok ? <CheckCircle2 aria-label="Passed" className="size-4 text-success" /> : <XCircle aria-label="Failed" className="size-4 text-danger" />}
                    </Td>
                    <Td className="font-medium">{c.name}</Td>
                    <Td className={c.ok ? "text-muted" : "text-danger"}>{c.detail}</Td>
                    <Td className="text-right text-subtle tabular-nums">{c.ms ? `${c.ms} ms` : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>
        ))}
      </div>
    </>
  );
}
