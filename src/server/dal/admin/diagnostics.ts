import "server-only";

import { sql, TransactionRollbackError } from "drizzle-orm";

import { getDb } from "@/db";
import { publicEnv, serverEnv } from "@/lib/env";

import { bioLinks } from "@/db/schema";

import { listLiveBioLinks, whyNotLive } from "../public/links";
import { dashboardStats, pendingTestimonialCount, recentActivity, recentInquiries } from "./dashboard";
import { unreadThreadCount } from "../portal";

export type Check = { group: string; name: string; ok: boolean; ms: number; detail: string };

async function timed(group: string, name: string, fn: () => Promise<string>, ms = 8000): Promise<Check> {
  const start = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const detail = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${ms / 1000}s`)), ms);
      }),
    ]);
    return { group, name, ok: true, ms: Date.now() - start, detail };
  } catch (e) {
    const err = e as { message?: string; code?: string; cause?: { message?: string; code?: string } };
    const code = err.code ?? err.cause?.code;
    const message = err.cause?.message ?? err.message ?? String(e);
    console.error(`[status] ${group} / ${name}`, e);
    return { group, name, ok: false, ms: Date.now() - start, detail: `${code ? `[${code}] ` : ""}${message}` };
  } finally {
    clearTimeout(timer);
  }
}

/** Describe the database connection without revealing credentials. */
function describeDatabaseUrl(url: string | undefined): string {
  if (!url) return "not set";
  try {
    const u = new URL(url);
    const pooler = u.hostname.includes("pooler.supabase.com");
    const mode = u.port === "6543" ? "transaction pooler (6543)" : u.port === "5432" ? (pooler ? "session pooler (5432)" : "direct connection (5432)") : `port ${u.port || "default"}`;
    return `${pooler ? "Supabase pooler" : u.hostname.endsWith("supabase.co") ? "Supabase direct host" : "custom host"} · ${mode}`;
  } catch {
    return "set, but not a valid URL";
  }
}

const count = (table: string) => async () => {
  const [row] = await getDb().execute<{ n: number }>(sql.raw(`select count(*)::int as n from public.${table}`));
  return `${row?.n ?? 0} rows`;
};

/**
 * Step-by-step health check for the admin "System status" page. Every check has its own
 * timer, runs one group at a time, and reports the Postgres error code/message on failure.
 */
export async function runSystemChecks(): Promise<Check[]> {
  const env = serverEnv();
  const checks: Check[] = [
    { group: "Configuration", name: "Database connection", ok: Boolean(env.databaseUrl), ms: 0, detail: describeDatabaseUrl(env.databaseUrl) },
    { group: "Configuration", name: "Supabase URL + key", ok: Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey), ms: 0, detail: publicEnv.supabaseUrl ? new URL(publicEnv.supabaseUrl).hostname : "not set" },
    { group: "Configuration", name: "Supabase secret key (uploads, invites)", ok: Boolean(env.supabaseSecretKey), ms: 0, detail: env.supabaseSecretKey ? "set" : "not set" },
    { group: "Configuration", name: "Site URL", ok: true, ms: 0, detail: publicEnv.siteUrl },
    { group: "Configuration", name: "Runtime", ok: true, ms: 0, detail: `${process.env.VERCEL_ENV ?? "local"} · region ${process.env.VERCEL_REGION ?? "n/a"}` },
  ];
  if (!env.databaseUrl) return checks;

  checks.push(await timed("Database", "Ping (select 1)", async () => {
    await getDb().execute(sql`select 1`);
    return "connected";
  }));
  checks.push(await timed("Database", "Transaction (save test)", async () => {
    // Same path every admin save uses; rolled back, so nothing is written.
    await getDb()
      .transaction(async (tx) => {
        await tx.execute(sql`select 1`);
        tx.rollback();
      })
      .catch((e: unknown) => {
        if (!(e instanceof TransactionRollbackError)) throw e;
      });
    return "begin → query → rollback OK";
  }));
  checks.push(await timed("Database", "10 queries in parallel", async () => {
    await Promise.all(Array.from({ length: 10 }, () => getDb().execute(sql`select 1`)));
    return "all returned";
  }));

  for (const t of ["bio_links", "navigation_items", "projects", "services", "team_members", "content_items", "testimonials", "faqs", "contact_inquiries", "sponsorship_inquiries", "media_assets", "audit_logs"]) {
    checks.push(await timed("Tables", t, count(t)));
  }

  checks.push(await timed("Link in bio", "Live links (what /links shows)", async () => `${(await listLiveBioLinks()).length} live link(s)`));
  // One row per saved link, with the exact reason when it is not showing.
  const links = await getDb()
    .select({ title: bioLinks.title, url: bioLinks.url, isPublished: bioLinks.isPublished, deletedAt: bioLinks.deletedAt, startsAt: bioLinks.startsAt, endsAt: bioLinks.endsAt })
    .from(bioLinks)
    .catch(() => []);
  const [{ now }] = await getDb().execute<{ now: string }>(sql`select now()::text as now`).catch(() => [{ now: "unknown" }]);
  checks.push({ group: "Link in bio", name: "Database clock", ok: true, ms: 0, detail: `${now} (server: ${new Date().toISOString()})` });
  for (const l of links) {
    const reason = whyNotLive(l);
    checks.push({
      group: "Link in bio",
      name: `“${l.title}”`,
      ok: !reason,
      ms: 0,
      detail: reason ?? `live · ${l.url}${l.startsAt ? ` · from ${l.startsAt.toISOString()}` : ""}${l.endsAt ? ` · until ${l.endsAt.toISOString()}` : ""}`,
    });
  }

  const dashboard = await Promise.all([
    timed("Dashboard widgets", "Content & media counts", async () => {
      const s = await dashboardStats();
      return `${s.content.projects.published} projects, ${s.content.services.published} services, ${s.media.length} media kinds`;
    }),
    timed("Dashboard widgets", "Latest inquiries", async () => `${(await recentInquiries()).length} rows`),
    timed("Dashboard widgets", "Recent activity", async () => `${(await recentActivity()).length} rows`),
    timed("Dashboard widgets", "Unread client messages", async () => `${await unreadThreadCount()}`),
    timed("Dashboard widgets", "Testimonials to review", async () => `${await pendingTestimonialCount()}`),
  ]);
  checks.push(...dashboard);
  return checks;
}
