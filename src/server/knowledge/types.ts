export type KnowledgeSourceType = "website" | "route" | "code" | "docs" | "manual";

export type KnowledgeDocument = {
  id: string;
  sourceUrl: string;
  canonicalUrl?: string;
  title: string;
  description: string;
  sourceType: KnowledgeSourceType;
  contentHash: string;
  content: string;
  chunkCount: number;
  metadata: Record<string, unknown>;
  crawledAt: string;
};

export type KnowledgeChunk = {
  id: string;
  documentId: string;
  chunkIndex: number;
  chunkId: string;
  sourceUrl: string;
  title: string;
  headings: string[];
  content: string;
  tokenCount: number;
  contentHash: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
};

export type SearchResult = {
  chunk: KnowledgeChunk;
  score: number;
  semanticScore: number;
  lexicalScore: number;
};

export type RetrievalOptions = {
  topK?: number;
  threshold?: number;
  sourceType?: KnowledgeSourceType;
  urlFilter?: string;
};

export type IngestionJobStatus = "idle" | "running" | "completed" | "failed";

export type IngestionJob = {
  id: string;
  sourceUrl: string;
  status: IngestionJobStatus;
  pagesDiscovered: number;
  pagesIndexed: number;
  chunksCreated: number;
  errorMessage?: string;
  stats?: {
    skippedUnchanged?: number;
    newDocuments?: number;
    updatedDocuments?: number;
    totalTokens?: number;
    durationMs?: number;
  };
  startedAt?: string;
  completedAt?: string;
};

export type Citation = {
  title: string;
  url: string;
  snippet?: string;
  chunkId?: string;
};
