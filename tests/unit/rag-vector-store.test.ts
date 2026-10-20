import { describe, expect, it } from "vitest";

import { cosineSimilarity, LocalVectorStore, tokenizeText } from "@/server/knowledge/vector-store";

describe("RAG Vector Store & Cosine Similarity", () => {
  it("calculates exact cosine similarity correctly", () => {
    // Identical vectors = 1.0
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);
    // Orthogonal vectors = 0.0
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0);
    // Opposite vectors = -1.0
    expect(cosineSimilarity([1, 2, 3], [-1, -2, -3])).toBeCloseTo(-1.0);
    // Empty or mismatched vectors = 0.0
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1], [1, 2])).toBe(0);
  });

  it("tokenizes search text removing punctuation and stop words", () => {
    const tokens = tokenizeText("What are the AI services built with Next.js?");
    expect(tokens).toContain("services");
    expect(tokens).toContain("built");
    expect(tokens).not.toContain("what");
    expect(tokens).not.toContain("the");
  });

  it("stores documents and chunks, and performs keyword search with relevance ranking", async () => {
    const store = new LocalVectorStore(":memory:");
    await store.clear();

    const doc = {
      id: "doc-1",
      sourceUrl: "https://example.com/services/workflow-automation",
      title: "Workflow Automation",
      description: "Custom n8n and Python automations",
      sourceType: "website" as const,
      contentHash: "hash1",
      content: "We automate complex business workflows using n8n, Python, and webhook integrations.",
      chunkCount: 1,
      metadata: {},
      crawledAt: new Date().toISOString(),
    };

    const chunk = {
      id: "chunk-1",
      documentId: "doc-1",
      chunkIndex: 0,
      chunkId: "doc-1-chunk-0",
      sourceUrl: "https://example.com/services/workflow-automation",
      title: "Workflow Automation",
      headings: ["Workflow Automation"],
      content: "We automate complex business workflows using n8n, Python, and webhook integrations.",
      tokenCount: 20,
      contentHash: "chash1",
      metadata: {},
    };

    await store.saveDocuments([doc]);
    await store.saveChunks([chunk]);

    const results = await store.keywordSearch("n8n python workflow", 3);
    expect(results.length).toBe(1);
    expect(results[0].chunk.id).toBe("chunk-1");
    expect(results[0].score).toBeGreaterThan(0.5);

    const status = await store.getStatus();
    expect(status.documentCount).toBe(1);
    expect(status.chunkCount).toBe(1);
  });
});
