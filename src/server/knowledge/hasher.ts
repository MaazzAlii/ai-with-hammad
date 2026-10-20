import { createHash } from "node:crypto";

/**
 * Computes a SHA-256 hex digest for a given string or object.
 * Used for incremental indexing: if a document's content hash hasn't changed,
 * we skip re-chunking and re-embedding.
 */
export function sha256(content: string | Record<string, unknown>): string {
  const str = typeof content === "string" ? content : JSON.stringify(content);
  return createHash("sha256").update(str, "utf8").digest("hex");
}

/**
 * Normalizes text for consistent hashing and indexing:
 * trims leading/trailing whitespace, collapses redundant blank lines and spaces.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
