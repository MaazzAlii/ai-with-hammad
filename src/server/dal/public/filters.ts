import "server-only";

import { and, eq, isNull, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/** Standard "visible to the public" predicate for content tables. */
export function isPublic(t: { isPublished: PgColumn; deletedAt: PgColumn }, ...extra: (SQL | undefined)[]) {
  return and(eq(t.isPublished, true), isNull(t.deletedAt), ...extra);
}
