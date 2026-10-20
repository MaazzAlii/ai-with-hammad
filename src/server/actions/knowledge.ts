"use server";

import { ok, type ActionResult } from "@/lib/action-result";
import { audit } from "@/server/audit";
import { authorize } from "@/server/auth/session";
import { indexWebsiteKnowledge } from "@/server/knowledge/indexer";
import { hybridRetrieve } from "@/server/knowledge/retriever";
import type { IngestionJob, SearchResult } from "@/server/knowledge/types";
import { getVectorStore } from "@/server/knowledge/vector-store";
import { runAction } from "@/server/run-action";

export async function reindexKnowledgeAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<IngestionJob>> {
  return runAction(async () => {
    const staff = await authorize("settings.write");
    const includeCrawler = formData.get("includeCrawler") === "true";
    const forceReindex = formData.get("forceReindex") === "true";

    const job = await indexWebsiteKnowledge({
      includeCrawler,
      includeCodeDocs: true,
      forceReindex,
    });

    await audit(staff, {
      action: "knowledge.reindex",
      entityType: "knowledge_base",
      summary: `Triggered knowledge base indexing (${job.pagesIndexed} pages, ${job.chunksCreated} chunks)`,
    });

    return ok(job, "Website knowledge successfully indexed.");
  });
}

export async function clearKnowledgeAction(): Promise<ActionResult<{ cleared: boolean }>> {
  return runAction(async () => {
    const staff = await authorize("settings.write");
    const store = getVectorStore();
    await store.clear();

    await audit(staff, {
      action: "knowledge.clear",
      entityType: "knowledge_base",
      summary: "Cleared website knowledge base index",
    });

    return ok({ cleared: true }, "Knowledge base index cleared.");
  });
}

export async function testRetrievalAction(
  query: string,
): Promise<ActionResult<SearchResult[]>> {
  return runAction(async () => {
    await authorize("cms.read");
    const results = await hybridRetrieve(query, { topK: 5, threshold: 0.1 });
    return ok(results);
  });
}
