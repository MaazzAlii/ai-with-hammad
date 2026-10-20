import "server-only";

import { getAIProvider } from "@/server/ai/provider";
import { getIngestionStatus } from "@/server/knowledge/indexer";
import { getVectorStore } from "@/server/knowledge/vector-store";

export type AdminKnowledgeDTO = {
  documentCount: number;
  chunkCount: number;
  lastIndexedAt?: string;
  jobStatus: ReturnType<typeof getIngestionStatus>;
  providerName: string;
  isProviderConfigured: boolean;
  documents: Array<{
    id: string;
    title: string;
    sourceUrl: string;
    sourceType: string;
    chunkCount: number;
    crawledAt: string;
  }>;
};

export async function getAdminKnowledgeData(): Promise<AdminKnowledgeDTO> {
  const store = getVectorStore();
  const status = await store.getStatus();
  const docs = await store.getDocuments();
  const provider = getAIProvider();

  return {
    documentCount: status.documentCount,
    chunkCount: status.chunkCount,
    lastIndexedAt: status.lastIndexedAt,
    jobStatus: getIngestionStatus(),
    providerName: provider.name,
    isProviderConfigured: provider.isConfigured(),
    documents: docs.map((d) => ({
      id: d.id,
      title: d.title,
      sourceUrl: d.sourceUrl,
      sourceType: d.sourceType,
      chunkCount: d.chunkCount,
      crawledAt: d.crawledAt,
    })),
  };
}
