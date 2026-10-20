import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { KnowledgeChunk, KnowledgeDocument } from "./types";

export interface IVectorStore {
  saveDocuments(docs: KnowledgeDocument[]): Promise<void>;
  saveChunks(chunks: KnowledgeChunk[]): Promise<void>;
  deleteDocument(documentId: string): Promise<void>;
  clear(): Promise<void>;
  getDocuments(): Promise<KnowledgeDocument[]>;
  getDocument(id: string): Promise<KnowledgeDocument | null>;
  getDocumentByUrl(url: string): Promise<KnowledgeDocument | null>;
  getChunks(): Promise<KnowledgeChunk[]>;
  similaritySearch(
    queryEmbedding: number[],
    topK: number,
    filter?: { sourceType?: string; urlFilter?: string },
  ): Promise<Array<{ chunk: KnowledgeChunk; score: number }>>;
  keywordSearch(
    query: string,
    topK: number,
    filter?: { sourceType?: string; urlFilter?: string },
  ): Promise<Array<{ chunk: KnowledgeChunk; score: number }>>;
  getStatus(): Promise<{ documentCount: number; chunkCount: number; lastIndexedAt?: string }>;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "is", "are", "was", "were", "it", "its", "that", "this", "by", "as", "from",
  "we", "our", "you", "your", "they", "them", "what", "how", "where", "who",
]);

export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export class LocalVectorStore implements IVectorStore {
  private filePath: string;
  private documents = new Map<string, KnowledgeDocument>();
  private chunks = new Map<string, KnowledgeChunk>();
  private loaded = false;

  constructor(filePath?: string) {
    this.filePath = filePath ?? join(process.cwd(), ".tmp", "knowledge", "vector-store.json");
  }

  private load(): void {
    if (this.loaded || this.filePath === ":memory:") return;
    this.loaded = true;
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, "utf-8");
        const data = JSON.parse(raw) as {
          documents: KnowledgeDocument[];
          chunks: KnowledgeChunk[];
        };
        for (const doc of data.documents || []) {
          this.documents.set(doc.id, doc);
        }
        for (const chunk of data.chunks || []) {
          this.chunks.set(chunk.id, chunk);
        }
      }
    } catch (e) {
      console.warn("[vector-store] Could not load persisted vector store, starting fresh:", e);
    }
  }

  private persist(): void {
    if (this.filePath === ":memory:") return;
    try {
      mkdirSync(dirname(this.filePath), { recursive: true });
      const data = {
        documents: Array.from(this.documents.values()),
        chunks: Array.from(this.chunks.values()),
        persistedAt: new Date().toISOString(),
      };
      writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.warn("[vector-store] Could not persist vector store:", e);
    }
  }

  async saveDocuments(docs: KnowledgeDocument[]): Promise<void> {
    this.load();
    for (const doc of docs) {
      this.documents.set(doc.id, doc);
    }
    this.persist();
  }

  async saveChunks(chunks: KnowledgeChunk[]): Promise<void> {
    this.load();
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
    }
    this.persist();
  }

  async deleteDocument(documentId: string): Promise<void> {
    this.load();
    this.documents.delete(documentId);
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(id);
      }
    }
    this.persist();
  }

  async clear(): Promise<void> {
    this.load();
    this.documents.clear();
    this.chunks.clear();
    this.persist();
  }

  async getDocuments(): Promise<KnowledgeDocument[]> {
    this.load();
    return Array.from(this.documents.values());
  }

  async getDocument(id: string): Promise<KnowledgeDocument | null> {
    this.load();
    return this.documents.get(id) ?? null;
  }

  async getDocumentByUrl(url: string): Promise<KnowledgeDocument | null> {
    this.load();
    for (const doc of this.documents.values()) {
      if (doc.sourceUrl === url || doc.canonicalUrl === url) return doc;
    }
    return null;
  }

  async getChunks(): Promise<KnowledgeChunk[]> {
    this.load();
    return Array.from(this.chunks.values());
  }

  async similaritySearch(
    queryEmbedding: number[],
    topK = 5,
    filter?: { sourceType?: string; urlFilter?: string },
  ): Promise<Array<{ chunk: KnowledgeChunk; score: number }>> {
    this.load();
    const results: Array<{ chunk: KnowledgeChunk; score: number }> = [];

    for (const chunk of this.chunks.values()) {
      if (!chunk.embedding || chunk.embedding.length === 0) continue;

      if (filter?.urlFilter && !chunk.sourceUrl.includes(filter.urlFilter)) {
        continue;
      }
      if (filter?.sourceType) {
        const doc = this.documents.get(chunk.documentId);
        if (doc && doc.sourceType !== filter.sourceType) continue;
      }

      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      results.push({ chunk, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async keywordSearch(
    query: string,
    topK = 5,
    filter?: { sourceType?: string; urlFilter?: string },
  ): Promise<Array<{ chunk: KnowledgeChunk; score: number }>> {
    this.load();
    const queryTokens = tokenizeText(query);
    if (queryTokens.length === 0) return [];

    const results: Array<{ chunk: KnowledgeChunk; score: number }> = [];

    for (const chunk of this.chunks.values()) {
      if (filter?.urlFilter && !chunk.sourceUrl.includes(filter.urlFilter)) {
        continue;
      }
      if (filter?.sourceType) {
        const doc = this.documents.get(chunk.documentId);
        if (doc && doc.sourceType !== filter.sourceType) continue;
      }

      const contentTokens = tokenizeText(chunk.content);
      const titleTokens = tokenizeText(chunk.title);
      const headingsTokens = tokenizeText(chunk.headings.join(" "));

      let matches = 0;
      let matchedDistinct = 0;

      for (const qt of queryTokens) {
        let termMatches = 0;

        // Content match (weight 1.0)
        for (const ct of contentTokens) {
          if (ct === qt) termMatches += 1;
          else if (ct.includes(qt) || qt.includes(ct)) termMatches += 0.5;
        }

        // Title match (weight 3.0)
        for (const tt of titleTokens) {
          if (tt === qt) termMatches += 3;
          else if (tt.includes(qt)) termMatches += 1.5;
        }

        // Heading match (weight 2.0)
        for (const ht of headingsTokens) {
          if (ht === qt) termMatches += 2;
          else if (ht.includes(qt)) termMatches += 1;
        }

        if (termMatches > 0) {
          matchedDistinct++;
          matches += termMatches;
        }
      }

      if (matches > 0) {
        // Normalize score between 0 and 1
        const coverageRatio = matchedDistinct / queryTokens.length;
        const rawScore = (coverageRatio * 0.7) + (Math.min(matches / 10, 1) * 0.3);
        results.push({ chunk, score: Math.min(rawScore, 1) });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async getStatus(): Promise<{ documentCount: number; chunkCount: number; lastIndexedAt?: string }> {
    this.load();
    let lastDate: string | undefined;
    for (const doc of this.documents.values()) {
      if (!lastDate || doc.crawledAt > lastDate) {
        lastDate = doc.crawledAt;
      }
    }
    return {
      documentCount: this.documents.size,
      chunkCount: this.chunks.size,
      lastIndexedAt: lastDate,
    };
  }
}

let activeVectorStore: IVectorStore | null = null;

export function getVectorStore(): IVectorStore {
  if (activeVectorStore) return activeVectorStore;
  activeVectorStore = new LocalVectorStore();
  return activeVectorStore;
}

export function resetVectorStore(): void {
  activeVectorStore = null;
}
