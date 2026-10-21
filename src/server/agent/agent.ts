import "server-only";

import { getAIProvider } from "@/server/ai/provider";
import type { ChatCompletionOptions, ChatMessage } from "@/server/ai/types";
import { hybridRetrieve } from "@/server/knowledge/retriever";
import type { Citation, SearchResult } from "@/server/knowledge/types";

import { rewriteQuery } from "./query-rewriter";
import { buildAgentSystemPrompt } from "./system-prompt";

export type AgentResponse = {
  text: string;
  citations: Citation[];
  rewrittenQuery: string;
  provider: string;
  model: string;
};

export type AgentStreamResult = {
  stream: ReadableStream<string>;
  citations: Citation[];
  rewrittenQuery: string;
};

export async function runAgent(
  messages: ChatMessage[],
  options: { stream?: boolean } = {},
): Promise<AgentResponse | AgentStreamResult> {
  const provider = getAIProvider();
  if (!provider.isConfigured()) {
    throw new Error("Site assistant is not configured yet (missing API key)");
  }

  const userMessages = messages.filter((m) => m.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1];
  const originalQuery = lastUserMessage?.content ?? "";

  // 1. Conversational Query Rewriting
  const historyForRewriter = messages.slice(0, -1);
  const rewrittenQuery = rewriteQuery(originalQuery, historyForRewriter);

  // 2. Hybrid Retrieval against Website Knowledge
  const retrievalResults: SearchResult[] = await hybridRetrieve(rewrittenQuery, {
    topK: 4,
  });

  // 3. Extract verified citations
  const citations: Citation[] = [];
  const contextBlocks: string[] = [];

  for (let i = 0; i < retrievalResults.length; i++) {
    const item = retrievalResults[i];
    const chunk = item.chunk;
    citations.push({
      title: chunk.title,
      url: chunk.sourceUrl,
      snippet: chunk.content.slice(0, 160),
      chunkId: chunk.id,
    });
    contextBlocks.push(
      `--- [DOCUMENT ${i + 1}: ${chunk.title} | Source: ${chunk.sourceUrl}] ---\n${chunk.content}`,
    );
  }

  // 4. Assemble system prompt with grounding context
  const baseSystemPrompt = await buildAgentSystemPrompt();
  const contextSection = contextBlocks.length > 0
    ? `\n\n## RETRIEVED WEBSITE EVIDENCE (Relevant indexed sections):\n${contextBlocks.join("\n\n")}`
    : "\n\n## RETRIEVED WEBSITE EVIDENCE:\n(General inquiry. Use the Core Agency Knowledge in your system prompt to answer helpfully and accurately.)";

  const fullSystemMessage: ChatMessage = {
    role: "system",
    content: `${baseSystemPrompt}${contextSection}`,
  };

  // Keep last 10 messages for conversational context, strictly user/assistant with well-formed unicode
  const cleanHistory = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role,
      content: typeof m.content === "string" ? (m.content.toWellFormed?.() ?? m.content).trim() : "",
    }))
    .filter((m) => m.content.length > 0)
    .slice(-10);

  const promptMessages: ChatMessage[] = [fullSystemMessage, ...cleanHistory];

  const completionOptions: ChatCompletionOptions = {
    temperature: 0.2,
    maxTokens: 800,
  };

  // 5. Stream or full completion
  if (options.stream) {
    const textStream = await provider.chatStream(promptMessages, completionOptions);
    return {
      stream: textStream,
      citations,
      rewrittenQuery,
    };
  }

  const completion = await provider.chat(promptMessages, completionOptions);
  return {
    text: completion.text,
    citations,
    rewrittenQuery,
    provider: completion.provider,
    model: completion.model,
  };
}
