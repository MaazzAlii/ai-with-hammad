import { and, desc, ilike, sql, type SQL } from "drizzle-orm";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/misc";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";

export const metadata = { title: "Audit log" };

const PAGE = 50;

export default async function AuditPage(props: PageProps<"/admin/audit">) {
  await requirePagePermission("audit.read");
  const sp = await props.searchParams;
  const action = typeof sp.action === "string" ? sp.action.slice(0, 60) : "";
  const actor = typeof sp.actor === "string" ? sp.actor.slice(0, 120) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const conds: SQL[] = [];
  if (action) conds.push(ilike(auditLogs.action, `${action.replace(/[%_\\]/g, "")}%`));
  if (actor) conds.push(ilike(auditLogs.actorEmail, `%${actor.replace(/[%_\\]/g, "")}%`));
  const rows = await getDb()
    .select()
    .from(auditLogs)
    .where(conds.length ? and(...conds) : sql`true`)
    .orderBy(desc(auditLogs.createdAt))
    .limit(PAGE + 1)
    .offset((page - 1) * PAGE);
  const qs = (p: number) => `/admin/audit?${new URLSearchParams({ ...(action ? { action } : {}), ...(actor ? { actor } : {}), page: String(p) })}`;
  return (
    <>
      <AdminPageHeader title="Audit log" description="Append-only record of sign-ins, content changes, publishing, media, settings and role changes. Secrets are never recorded." />
      <form className="mb-6 flex flex-col gap-2 sm:flex-row" role="search">
        <Input name="action" defaultValue={action} placeholder="Action prefix, e.g. project. or auth." aria-label="Action" className="sm:max-w-xs" />
        <Input name="actor" defaultValue={actor} placeholder="Actor email" aria-label="Actor" className="sm:max-w-xs" />
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      <Table>
        <thead><tr><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Summary</Th><Th>Entity</Th></tr></thead>
        <tbody>
          {rows.slice(0, PAGE).map((r) => (
            <tr key={r.id}>
              <Td className="whitespace-nowrap text-muted">{formatDate(r.createdAt, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</Td>
              <Td className="max-w-48 truncate">{r.actorEmail || <span className="text-subtle">system / visitor</span>}</Td>
              <Td><code className="font-mono text-xs">{r.action}</code></Td>
              <Td className="max-w-80">{r.summary}</Td>
              <Td className="text-xs text-subtle">{r.entityType}{r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ""}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="mt-4 flex justify-between text-sm">
        {page > 1 ? <Link href={qs(page - 1)} className="text-accent">← Newer</Link> : <span />}
        {rows.length > PAGE ? <Link href={qs(page + 1)} className="text-accent">Older →</Link> : null}
      </div>
    </>
  );
}
