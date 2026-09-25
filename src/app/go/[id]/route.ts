import { and, eq, isNull, sql } from "drizzle-orm";
import { after, NextResponse } from "next/server";

import { getDb } from "@/db";
import { bioLinks } from "@/db/schema";
import { publicEnv } from "@/lib/env";
import { resolveBioLink } from "@/server/dal/public/links";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Link-in-bio click-through: counts the click, then redirects to the stored
 * destination. Only live (published, in-schedule) links resolve; the target
 * comes from the database, never from the request, so this is not an open redirect.
 */
export async function GET(_req: Request, ctx: RouteContext<"/go/[id]">) {
  const { id } = await ctx.params;
  const target = UUID.test(id) ? await resolveBioLink(id) : null;
  if (!target) return NextResponse.redirect(new URL("/links", publicEnv.siteUrl), 302);
  after(async () => {
    await getDb()
      .update(bioLinks)
      .set({ clickCount: sql`${bioLinks.clickCount} + 1`, updatedAt: sql`${bioLinks.updatedAt}` })
      .where(and(eq(bioLinks.id, id), isNull(bioLinks.deletedAt)));
  });
  const res = NextResponse.redirect(target, 302);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
