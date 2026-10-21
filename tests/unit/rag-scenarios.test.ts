import { describe, expect, it } from "vitest";

import { rewriteQuery } from "@/server/agent/query-rewriter";
import { buildAgentSystemPrompt } from "@/server/agent/system-prompt";
import { hybridRetrieve } from "@/server/knowledge/retriever";
import { getVectorStore } from "@/server/knowledge/vector-store";

describe("RAG Assistant Scenarios & Robustness", () => {
  it("auto-seeds the vector store with foundational agency knowledge", async () => {
    const store = getVectorStore();
    const status = await store.getStatus();
    expect(status.documentCount).toBeGreaterThan(0);
    expect(status.chunkCount).toBeGreaterThan(0);
  });

  it("retrieves leadership chunks when asked about founders or owners", async () => {
    const results = await hybridRetrieve("who is the founder?");
    expect(results.length).toBeGreaterThan(0);
    const topChunk = results[0].chunk;
    const combinedText = `${topChunk.title} ${topChunk.content}`.toLowerCase();
    expect(combinedText).toMatch(/hammadullah|maaz/);
  });

  it("retrieves Maaz Ali profile chunk when asked about Maaz Ali", async () => {
    const results = await hybridRetrieve("can you tell me about Maaz Ali?");
    expect(results.length).toBeGreaterThan(0);
    const topChunk = results[0].chunk;
    const combinedText = `${topChunk.title} ${topChunk.content}`.toLowerCase();
    expect(combinedText).toContain("maaz ali");
  });

  it("retrieves services chunks when asked about services or offerings", async () => {
    const results = await hybridRetrieve("what services do you offer?");
    expect(results.length).toBeGreaterThan(0);
    const topChunk = results[0].chunk;
    const combinedText = `${topChunk.title} ${topChunk.content}`.toLowerCase();
    expect(combinedText).toMatch(/workflow|automation|integrations|agentic/);
  });

  it("retrieves contact info when asked how to get in touch", async () => {
    const results = await hybridRetrieve("how can I contact you via WhatsApp or email?");
    expect(results.length).toBeGreaterThan(0);
    const text = results.map((r) => r.chunk.content).join(" ");
    expect(text).toMatch(/contact|whatsapp|email/i);
  });

  it("system prompt provides clear guidance for polite out-of-scope redirection", async () => {
    const prompt = await buildAgentSystemPrompt();
    expect(prompt).toContain("OUT-OF-SCOPE & UNRELATED TOPIC HANDLING");
    expect(prompt).toContain("Google or Wikipedia");
    expect(prompt).toContain("NEVER be curt, blunt, cold, or robotic");
  });

  it("system prompt provides clear de-escalation for rude or frustrated visitors", async () => {
    const prompt = await buildAgentSystemPrompt();
    expect(prompt).toContain("CUSTOMER SERVICE & CONFLICT DE-ESCALATION");
    expect(prompt).toContain("ALWAYS maintain absolute poise, empathy, and professional courtesy");
    expect(prompt).toContain("Hammadullah and Maaz Ali");
  });

  it("system prompt mandates native multilingual responses", async () => {
    const prompt = await buildAgentSystemPrompt();
    expect(prompt).toContain("MULTILINGUAL SUPPORT");
    expect(prompt).toContain("Always detect and reply in the same language");
  });
});
