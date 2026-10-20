import { describe, expect, it } from "vitest";

import { FailoverAIProvider } from "@/server/ai/provider";
import type { AIProvider, ChatCompletionOptions, ChatCompletionResponse, ChatMessage } from "@/server/ai/types";

class MockProvider implements AIProvider {
  name: string;
  failWith: Error | null = null;
  callCount = 0;

  constructor(name: string, failWith: Error | null = null) {
    this.name = name;
    this.failWith = failWith;
  }

  isConfigured(): boolean {
    return true;
  }

  async chat(_messages: ChatMessage[], _options?: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    this.callCount++;
    if (this.failWith) {
      throw this.failWith;
    }
    return {
      text: `Response from ${this.name}`,
      model: "mock-model",
      provider: this.name,
    };
  }

  async chatStream(_messages: ChatMessage[], _options?: ChatCompletionOptions): Promise<ReadableStream<string>> {
    this.callCount++;
    if (this.failWith) {
      throw this.failWith;
    }
    const providerName = this.name;
    return new ReadableStream<string>({
      start(controller) {
        controller.enqueue(`Stream from ${providerName}`);
        controller.close();
      },
    });
  }

  async embed(_texts: string[]): Promise<number[][]> {
    return [[0.1, 0.2, 0.3]];
  }
}

describe("RAG AI Provider Failover Strategy", () => {
  it("uses primary provider when primary succeeds", async () => {
    const primary = new MockProvider("mistral");
    const fallback = new MockProvider("xai");
    const failover = new FailoverAIProvider(primary, fallback);

    const res = await failover.chat([{ role: "user", content: "Hello" }]);
    expect(res.provider).toBe("mistral");
    expect(primary.callCount).toBe(1);
    expect(fallback.callCount).toBe(0);
  });

  it("fails over to xAI/Grok when Mistral hits rate limit (429)", async () => {
    const rateLimitError = new Error("Rate limit exceeded");
    (rateLimitError as unknown as { status: number }).status = 429;

    const primary = new MockProvider("mistral", rateLimitError);
    const fallback = new MockProvider("xai");
    const failover = new FailoverAIProvider(primary, fallback);

    const res = await failover.chat([{ role: "user", content: "Hello" }]);
    expect(res.provider).toBe("xai");
    expect(primary.callCount).toBe(1);
    expect(fallback.callCount).toBe(1);
  });

  it("fails over when primary hits temporary server error (503)", async () => {
    const serverError = new Error("Service unavailable");
    (serverError as unknown as { status: number }).status = 503;

    const primary = new MockProvider("mistral", serverError);
    const fallback = new MockProvider("xai");
    const failover = new FailoverAIProvider(primary, fallback);

    const res = await failover.chat([{ role: "user", content: "Hello" }]);
    expect(res.provider).toBe("xai");
    expect(fallback.callCount).toBe(1);
  });

  it("does not fail over blindly on client errors (400 Bad Request)", async () => {
    const badRequest = new Error("Bad request: invalid schema");
    (badRequest as unknown as { status: number }).status = 400;

    const primary = new MockProvider("mistral", badRequest);
    const fallback = new MockProvider("xai");
    const failover = new FailoverAIProvider(primary, fallback);

    await expect(failover.chat([{ role: "user", content: "Bad" }])).rejects.toThrow("Bad request");
    expect(fallback.callCount).toBe(0);
  });
});
