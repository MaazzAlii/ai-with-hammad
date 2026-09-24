import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { afterAll, describe, expect, it } from "vitest";

import { publicTables } from "@/db/schema";

import { connect } from "./helpers";

const sql = connect();
afterAll(() => sql.end());

type DbColumn = { table_name: string; column_name: string; is_nullable: "YES" | "NO"; udt_name: string };

/** Map Drizzle column types to Postgres udt names. */
function expectedUdt(col: { getSQLType(): string; enumValues?: string[] }): string {
  const t = col.getSQLType();
  if (t.endsWith("[]")) return `_${expectedUdt({ getSQLType: () => t.slice(0, -2) })}`;
  if (t.startsWith("timestamp")) return "timestamptz";
  if (t.startsWith("numeric")) return "numeric";
  if (t.startsWith("char")) return "bpchar";
  return (
    { integer: "int4", bigint: "int8", boolean: "bool", text: "text", uuid: "uuid", jsonb: "jsonb", date: "date" }[
      t
    ] ?? t
  );
}

describe("Drizzle schema matches the SQL setup", () => {
  it("has the same set of public tables", async () => {
    const rows = await sql<{ tablename: string }[]>`select tablename from pg_tables where schemaname = 'public'`;
    const dbTables = rows.map((r) => r.tablename).sort();
    const drizzleTables = Object.values(publicTables)
      .map((t) => getTableConfig(t as PgTable).name)
      .sort();
    expect(drizzleTables).toEqual(dbTables);
  });

  it("has identical columns, types and nullability for every table", async () => {
    const cols = await sql<DbColumn[]>`
      select table_name, column_name, is_nullable, udt_name
      from information_schema.columns where table_schema = 'public'`;
    const problems: string[] = [];
    for (const table of Object.values(publicTables)) {
      const cfg = getTableConfig(table as PgTable);
      const dbCols = cols.filter((c) => c.table_name === cfg.name);
      const dbNames = dbCols.map((c) => c.column_name).sort();
      const drizzleNames = cfg.columns.map((c) => c.name).sort();
      if (JSON.stringify(dbNames) !== JSON.stringify(drizzleNames)) {
        problems.push(`${cfg.name}: columns differ\n  db:      ${dbNames}\n  drizzle: ${drizzleNames}`);
        continue;
      }
      for (const col of cfg.columns) {
        const db = dbCols.find((c) => c.column_name === col.name)!;
        const nullable = !col.notNull && !col.primary;
        if ((db.is_nullable === "YES") !== nullable)
          problems.push(`${cfg.name}.${col.name}: nullability db=${db.is_nullable} drizzle=${nullable}`);
        const udt = expectedUdt(col as never);
        const enumName = (col as { enum?: { enumName: string } }).enum?.enumName;
        const want = enumName ? (udt.startsWith("_") ? `_${enumName}` : enumName) : udt;
        if (db.udt_name !== want) problems.push(`${cfg.name}.${col.name}: type db=${db.udt_name} drizzle=${want}`);
      }
    }
    expect(problems).toEqual([]);
  });
});
