import postgres from "postgres";

export function testDbUrl() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL not set (global setup did not run)");
  return url;
}

export function connect() {
  return postgres(testDbUrl(), { max: 1, onnotice: () => {} });
}

type Sql = ReturnType<typeof connect>;

/** Run `fn` as a Supabase Data API role with the given JWT subject, then roll back. */
export async function asRole<T>(
  sql: Sql,
  role: "anon" | "authenticated",
  sub: string | null,
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  let result: T | undefined;
  await sql
    .begin(async (tx) => {
      const claims = JSON.stringify(sub ? { sub, role } : { role });
      await tx`select set_config('request.jwt.claims', ${claims}, true)`;
      await tx.unsafe(`set local role ${role}`);
      result = await fn(tx);
      throw new RollbackSignal();
    })
    .catch((e) => {
      if (!(e instanceof RollbackSignal)) throw e;
    });
  return result as T;
}

class RollbackSignal extends Error {}

export async function createStaff(sql: Sql, role: string, active = true) {
  const id = crypto.randomUUID();
  await sql`insert into auth.users (id, email) values (${id}, ${`${role}-${id.slice(0, 8)}@test.local`})`;
  await sql`update public.profiles set role = ${role}::public.app_role, is_active = ${active} where id = ${id}`;
  return id;
}
