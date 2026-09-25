/** Liveness probe for Docker / uptime monitors (no DB access, never cached). */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
