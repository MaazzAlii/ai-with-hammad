import "server-only";

import { serverEnv } from "@/lib/env";
import { getAIProvider } from "@/server/ai/provider";

import type { RetrievalOptions, SearchResult } from "./types";
import { getVectorStore } from "./vector-store";

export async function hybridRetrieve(query: string, options: RetrievalOptions = {}): Promise<SearchResult[]> {
  const store = getVectorStore();
  const env = serverEnv();
  const topK = options.topK ?? env.ragTopK ?? 4;
  const threshold = options.threshold ?? env.ragRelevanceThreshold ?? 0.35;

  const candidateMap = new Map<string, { chunk: SearchResult["chunk"]; semanticScore: number; lexicalScore: number }>();

  // 1. Keyword search (always available, fast lexical matching)
  const keywordResults = await store.keywordSearch(query, topK * 3, {
    sourceType: options.sourceType,
    urlFilter: options.urlFilter,
  });

  for (const { chunk, score } of keywordResults) {
    candidateMap.set(chunk.id, {
      chunk,
      semanticScore: 0,
      lexicalScore: score,
    });
  }

  // 2. Semantic vector search (if embedding provider is configured)
  const provider = getAIProvider();
  if (provider.isConfigured()) {
    try {
      const embeddings = await provider.embed([query]);
      if (embeddings.length > 0) {
        const queryEmbedding = embeddings[0];
        const vectorResults = await store.similaritySearch(queryEmbedding, topK * 3, {
          sourceType: options.sourceType,
          urlFilter: options.urlFilter,
        });

        for (const { chunk, score } of vectorResults) {
          const existing = candidateMap.get(chunk.id);
          if (existing) {
            existing.semanticScore = score;
          } else {
            candidateMap.set(chunk.id, {
              chunk,
              semanticScore: score,
              lexicalScore: 0,
            });
          }
        }
      }
    } catch (e) {
      console.warn("[retriever] Semantic embedding search failed, continuing with lexical matches:", e);
    }
  }

  // 3. Score combination & Reranking
  const scored: SearchResult[] = [];
  for (const item of candidateMap.values()) {
    let combined = 0;
    if (item.semanticScore > 0 && item.lexicalScore > 0) {
      combined = (item.semanticScore * 0.7) + (item.lexicalScore * 0.3);
    } else if (item.semanticScore > 0) {
      combined = item.semanticScore;
    } else {
      combined = item.lexicalScore;
    }

    if (combined >= threshold) {
      scored.push({
        chunk: item.chunk,
        score: combined,
        semanticScore: item.semanticScore,
        lexicalScore: item.lexicalScore,
      });
    }
  }

  // Sort descending by combined score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}
