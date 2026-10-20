import { sha256 } from "./hasher";
import type { KnowledgeChunk } from "./types";

export type ChunkingOptions = {
  targetTokens?: number;
  overlapTokens?: number;
  charsPerToken?: number;
};

const DEFAULT_TARGET_TOKENS = 450;
const DEFAULT_OVERLAP_TOKENS = 60;
const CHARS_PER_TOKEN = 4;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Splits document content semantically based on headings, code blocks, lists,
 * and paragraphs, preserving heading hierarchy and metadata.
 */
export function chunkDocument(
  doc: {
    id: string;
    sourceUrl: string;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  },
  options: ChunkingOptions = {},
): KnowledgeChunk[] {
  const targetTokens = options.targetTokens ?? DEFAULT_TARGET_TOKENS;
  const overlapTokens = options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;
  const targetChars = targetTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;

  const lines = doc.content.replace(/\r\n?/g, "\n").split("\n");
  const chunks: KnowledgeChunk[] = [];

  let currentHeadings: string[] = [];
  let currentBuffer: string[] = [];
  let currentChars = 0;
  let chunkIndex = 0;

  function flushChunk() {
    const text = currentBuffer.join("\n").trim();
    if (!text) return;

    const chunkId = `${doc.id}-chunk-${chunkIndex}`;
    const tokenCount = estimateTokens(text);
    const contentHash = sha256(text);

    chunks.push({
      id: chunkId,
      documentId: doc.id,
      chunkIndex,
      chunkId,
      sourceUrl: doc.sourceUrl,
      title: doc.title,
      headings: [...currentHeadings],
      content: text,
      tokenCount,
      contentHash,
      metadata: {
        ...(doc.metadata ?? {}),
        headings: [...currentHeadings],
      },
    });

    chunkIndex++;

    // Maintain overlap from the end of currentBuffer
    const carryOver: string[] = [];
    let carryChars = 0;
    for (let i = currentBuffer.length - 1; i >= 0; i--) {
      const line = currentBuffer[i];
      if (carryChars + line.length > overlapChars) break;
      carryOver.unshift(line);
      carryChars += line.length;
    }

    currentBuffer = carryOver;
    currentChars = carryChars;
  }

  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
    }

    // Heading detected outside code blocks
    const headingMatch = !inCodeBlock ? line.match(/^(#{1,6})\s+(.+)$/) : null;
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      // Heading hierarchy maintenance: truncate headings deeper or equal to current level
      currentHeadings = currentHeadings.slice(0, Math.max(0, level - 1));
      currentHeadings[level - 1] = headingText;
      currentHeadings = currentHeadings.filter(Boolean);

      // If we already have substantial content, flush before the new major heading
      if (currentChars >= targetChars * 0.6) {
        flushChunk();
      }
    }

    currentBuffer.push(line);
    currentChars += line.length + 1;

    // Check if we reached target size (avoid flushing mid-code block or mid-list if possible)
    if (currentChars >= targetChars && !inCodeBlock) {
      flushChunk();
    }
  }

  if (currentBuffer.length > 0) {
    flushChunk();
  }

  return chunks;
}
