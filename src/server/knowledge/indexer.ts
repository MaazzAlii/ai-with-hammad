import "server-only";

import { serverEnv } from "@/lib/env";
import { getAIProvider } from "@/server/ai/provider";

import { chunkDocument } from "./chunker";
import { extractCodebaseDocs } from "./code-extractor";
import { crawlWebsite } from "./crawler";
import { extractPublishedSiteKnowledge } from "./site-extractor";
import type { IngestionJob, KnowledgeChunk, KnowledgeDocument } from "./types";
import { getVectorStore } from "./vector-store";

let currentJob: IngestionJob = {
  id: "job-initial",
  sourceUrl: "",
  status: "idle",
  pagesDiscovered: 0,
  pagesIndexed: 0,
  chunksCreated: 0,
};

export function getIngestionStatus(): IngestionJob {
  return currentJob;
}

export type IndexOptions = {
  includeCrawler?: boolean;
  includeCodeDocs?: boolean;
  forceReindex?: boolean;
};

export async function indexWebsiteKnowledge(options: IndexOptions = {}): Promise<IngestionJob> {
  const env = serverEnv();
  const sourceUrl = env.knowledgeSourceUrl;
  const store = getVectorStore();
  const startTime = Date.now();

  currentJob = {
    id: `job-${Date.now()}`,
    sourceUrl,
    status: "running",
    pagesDiscovered: 0,
    pagesIndexed: 0,
    chunksCreated: 0,
    startedAt: new Date().toISOString(),
  };

  try {
    const discoveredDocs: KnowledgeDocument[] = [];

    // 1. Direct published CMS/DAL knowledge
    const siteDocs = await extractPublishedSiteKnowledge().catch((e) => {
      console.warn("[indexer] Error extracting CMS site knowledge:", e);
      return [];
    });
    discoveredDocs.push(...siteDocs);

    // 2. Codebase architecture & docs (if requested, default true)
    if (options.includeCodeDocs !== false) {
      const codeDocs = await extractCodebaseDocs().catch((e) => {
        console.warn("[indexer] Error extracting codebase docs:", e);
        return [];
      });
      discoveredDocs.push(...codeDocs);
    }

    // 3. Optional crawler for live URL (if requested)
    if (options.includeCrawler && sourceUrl) {
      const crawledDocs = await crawlWebsite(sourceUrl, { maxPages: 25, maxDepth: 2 }).catch((e) => {
        console.warn("[indexer] Error during web crawl:", e);
        return [];
      });
      discoveredDocs.push(...crawledDocs);
    }

    currentJob.pagesDiscovered = discoveredDocs.length;

    // Load existing documents for incremental comparison
    const existingDocs = await store.getDocuments();
    const existingDocMap = new Map<string, KnowledgeDocument>(existingDocs.map((d) => [d.id, d]));
    const existingChunks = await store.getChunks();
    const existingChunkMap = new Map<string, KnowledgeChunk>(existingChunks.map((c) => [c.id, c]));

    let skippedUnchanged = 0;
    let newOrUpdatedCount = 0;
    const finalDocsToSave: KnowledgeDocument[] = [];
    const chunksNeedingEmbed: KnowledgeChunk[] = [];
    const allFinalChunks: KnowledgeChunk[] = [];

    for (const doc of discoveredDocs) {
      const existing = existingDocMap.get(doc.id);

      // Incremental indexing: skip if unchanged and not forcing reindex
      if (!options.forceReindex && existing && existing.contentHash === doc.contentHash) {
        skippedUnchanged++;
        finalDocsToSave.push(existing);
        // Retain existing chunks
        const docChunks = existingChunks.filter((c) => c.documentId === doc.id);
        allFinalChunks.push(...docChunks);
        continue;
      }

      // New or modified document: chunk it
      newOrUpdatedCount++;
      const chunks = chunkDocument(doc);
      doc.chunkCount = chunks.length;
      finalDocsToSave.push(doc);

      for (const chunk of chunks) {
        // Check if individual chunk content is identical to an existing chunk with embedding
        const prev = existingChunkMap.get(chunk.id);
        if (!options.forceReindex && prev && prev.contentHash === chunk.contentHash && prev.embedding) {
          chunk.embedding = prev.embedding;
          allFinalChunks.push(chunk);
        } else {
          chunksNeedingEmbed.push(chunk);
          allFinalChunks.push(chunk);
        }
      }
    }

    // 4. Generate embeddings for chunks that need it (if AI provider is configured)
    const provider = getAIProvider();
    if (provider.isConfigured() && chunksNeedingEmbed.length > 0) {
      try {
        const textsToEmbed = chunksNeedingEmbed.map((c) => `${c.title}\n${c.content}`);
        const embeddings = await provider.embed(textsToEmbed);
        for (let i = 0; i < chunksNeedingEmbed.length; i++) {
          if (embeddings[i]) {
            chunksNeedingEmbed[i].embedding = embeddings[i];
          }
        }
      } catch (e) {
        console.warn("[indexer] Embedding generation failed (continuing with lexical chunks):", e);
      }
    }

    // 5. Save all updated documents & chunks to vector store
    if (options.forceReindex) {
      await store.clear();
    }
    await store.saveDocuments(finalDocsToSave);
    await store.saveChunks(allFinalChunks);

    const durationMs = Date.now() - startTime;
    currentJob = {
      ...currentJob,
      status: "completed",
      pagesIndexed: finalDocsToSave.length,
      chunksCreated: allFinalChunks.length,
      completedAt: new Date().toISOString(),
      stats: {
        skippedUnchanged,
        newDocuments: newOrUpdatedCount,
        durationMs,
      },
    };

    return currentJob;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[indexer] Indexing failed:", err);
    currentJob = {
      ...currentJob,
      status: "failed",
      errorMessage: errorMsg,
      completedAt: new Date().toISOString(),
    };
    return currentJob;
  }
}
