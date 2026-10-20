import { describe, expect, it } from "vitest";

import { chunkDocument } from "@/server/knowledge/chunker";
import { sha256 } from "@/server/knowledge/hasher";

describe("RAG Semantic Chunker", () => {
  it("chunks a structured markdown document preserving headings and metadata", () => {
    const doc = {
      id: "doc-test-1",
      sourceUrl: "https://example.com/services/ai-engineering",
      title: "AI Engineering & Agents",
      content: [
        "# AI Engineering & Agents",
        "We build autonomous multi-agent systems and custom LLM workflows for production.",
        "",
        "## Key Capabilities",
        "- Tool-use and function calling architectures",
        "- Retrieval-augmented generation with hybrid vector search",
        "- Streaming responses with real-time token feedback",
        "",
        "## Technical Stack",
        "TypeScript, Next.js 16, Python, Mistral AI, Supabase, PostgreSQL.",
      ].join("\n"),
    };

    const chunks = chunkDocument(doc, { targetTokens: 40 });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].documentId).toBe("doc-test-1");
    expect(chunks[0].sourceUrl).toBe("https://example.com/services/ai-engineering");
    expect(chunks[0].title).toBe("AI Engineering & Agents");
    expect(chunks[0].contentHash).toBe(sha256(chunks[0].content));
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
  });

  it("handles empty or whitespace documents gracefully", () => {
    const chunks = chunkDocument({
      id: "doc-empty",
      sourceUrl: "https://example.com/empty",
      title: "Empty",
      content: "   \n\n   ",
    });
    expect(chunks).toEqual([]);
  });

  it("preserves heading hierarchy across sections", () => {
    const doc = {
      id: "doc-headings",
      sourceUrl: "https://example.com/team",
      title: "Our Team",
      content: [
        "# Leadership",
        "Leadership team bios and background.",
        "## Founders",
        "Hammadullah and Maaz Ali are the founding partners.",
      ].join("\n"),
    };

    const chunks = chunkDocument(doc, { targetTokens: 30 });
    expect(chunks.some((c) => c.headings.includes("Leadership") || c.headings.includes("Founders"))).toBe(true);
  });
});
