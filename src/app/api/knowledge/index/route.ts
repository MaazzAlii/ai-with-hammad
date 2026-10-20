import { serverEnv } from "@/lib/env";
import { getAIProvider } from "@/server/ai/provider";
import { getCurrentStaff } from "@/server/auth/session";
import { getIngestionStatus, indexWebsiteKnowledge } from "@/server/knowledge/indexer";
import { getVectorStore } from "@/server/knowledge/vector-store";

export const dynamic = "force-dynamic";

const json = (status: number, data: unknown) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

async function isAuthorized(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const staff = await getCurrentStaff();
  return Boolean(staff && staff.isActive);
}

/**
 * GET /api/knowledge/index
 * Returns knowledge base status, document count, chunk count, and last indexed date.
 */
export async function GET() {
  const store = getVectorStore();
  const status = await store.getStatus();
  const job = getIngestionStatus();
  const provider = getAIProvider();

  return json(200, {
    status: "ok",
    knowledge: status,
    currentJob: job,
    provider: {
      active: provider.name,
      configured: provider.isConfigured(),
    },
    env: {
      knowledgeSourceUrl: serverEnv().knowledgeSourceUrl,
      aiProvider: serverEnv().aiProvider,
      vectorDbType: serverEnv().vectorDbType,
    },
  });
}

/**
 * POST /api/knowledge/index
 * Triggers website knowledge indexing.
 */
export async function POST(req: Request) {
  if (!(await isAuthorized())) {
    return json(403, { error: "Unauthorized. Staff login required." });
  }

  const body = (await req.json().catch(() => ({}))) as {
    includeCrawler?: boolean;
    includeCodeDocs?: boolean;
    forceReindex?: boolean;
  };

  const job = await indexWebsiteKnowledge({
    includeCrawler: body.includeCrawler ?? false,
    includeCodeDocs: body.includeCodeDocs ?? true,
    forceReindex: body.forceReindex ?? false,
  });

  return json(200, { status: "ok", job });
}

/**
 * DELETE /api/knowledge/index
 * Clears the knowledge base index.
 */
export async function DELETE() {
  if (!(await isAuthorized())) {
    return json(403, { error: "Unauthorized. Staff login required." });
  }

  const store = getVectorStore();
  await store.clear();

  return json(200, { status: "ok", message: "Knowledge base index cleared." });
}
