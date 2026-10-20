import { describe, expect, it } from "vitest";

import { rewriteQuery } from "@/server/agent/query-rewriter";
import { buildAgentSystemPrompt } from "@/server/agent/system-prompt";
import { executeTool } from "@/server/agent/tools";

describe("RAG Agent Core", () => {
  it("rewrites ambiguous pronouns based on previous conversation turn", () => {
    const history = [
      { role: "user" as const, content: "Tell me about AI Engineering" },
      { role: "assistant" as const, content: "We offer **AI Engineering** for LLM apps." },
    ];

    const rewritten = rewriteQuery("How much does it cost?", history);
    expect(rewritten.toLowerCase()).toContain("ai engineering");
  });

  it("leaves self-contained queries unmodified", () => {
    const history = [
      { role: "user" as const, content: "Hello" },
      { role: "assistant" as const, content: "Hi! How can I help you explore AI With Hamad?" },
    ];

    const query = "What services do you offer for ecommerce?";
    const rewritten = rewriteQuery(query, history);
    expect(rewritten).toBe(query);
  });

  it("builds a system prompt strictly containing grounding rules and prompt injection defense", async () => {
    const prompt = await buildAgentSystemPrompt();
    expect(prompt).toContain("GROUNDING & HONESTY RULES");
    expect(prompt).toContain("NEVER fabricate");
    expect(prompt).toContain("PROMPT INJECTION DEFENSE");
    expect(prompt).toContain("UNTRUSTED DATA");
  });

  it("executes website_navigation tool deterministically", async () => {
    const res = await executeTool("website_navigation", { topic: "contact" });
    expect(res.result).toContain("/contact");
    expect(res.citations?.[0].url).toContain("/contact");
  });
});
