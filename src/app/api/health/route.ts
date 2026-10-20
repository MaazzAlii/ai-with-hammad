import { getAIProvider } from "@/server/ai/provider";
import { getVectorStore } from "@/server/knowledge/vector-store";

/** Liveness and readiness probe for Docker / uptime monitors (never cached, no secrets). */
export const dynamic = "force-dynamic";

export async function GET() {
  const provider = getAIProvider();
  const store = getVectorStore();
  const status = await store.getStatus().catch(() => ({ documentCount: 0 }));

  return Response.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      components: {
        aiProvider: provider.isConfigured() ? "ready" : "unconfigured",
        knowledgeBase: status.documentCount > 0 ? "ready" : "unindexed",
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
