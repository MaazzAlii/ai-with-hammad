import "server-only";

import { serverEnv } from "@/lib/env";

import type { AIProvider, ChatCompletionOptions, ChatCompletionResponse, ChatMessage } from "./types";

export class MistralProvider implements AIProvider {
  readonly name = "mistral";

  isConfigured(): boolean {
    return Boolean(serverEnv().mistralApiKey);
  }

  private getApiKey(): string {
    const key = serverEnv().mistralApiKey;
    if (!key) throw new Error("MISTRAL_API_KEY is not configured");
    return key;
  }

  private formatMessages(messages: ChatMessage[]) {
    return messages.map((m) => {
      const base: Record<string, unknown> = {
        role: m.role,
        content: m.content,
      };
      if (m.name) base.name = m.name;
      if (m.toolCallId) base.tool_call_id = m.toolCallId;
      if (m.toolCalls && m.toolCalls.length > 0) {
        base.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        }));
      }
      return base;
    });
  }

  async chat(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<ChatCompletionResponse> {
    const apiKey = this.getApiKey();
    const env = serverEnv();
    const preferredModel = options.model ?? env.mistralChatModel ?? "mistral-small-latest";
    const candidateModels = Array.from(new Set([preferredModel, "mistral-small-latest", "open-mistral-7b"]));

    let lastError: unknown = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      const payload: Record<string, unknown> = {
        model,
        messages: this.formatMessages(messages),
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1024,
      };

      if (options.tools && options.tools.length > 0) {
        payload.tools = options.tools;
        if (options.toolChoice) payload.tool_choice = options.toolChoice;
      }

      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: options.abortSignal ?? AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        const err = new Error(`Mistral API error (${res.status}): ${errorText.slice(0, 300)}`);
        (err as unknown as { status: number }).status = res.status;
        lastError = err;

        if ((res.status === 400 || res.status === 403 || res.status === 404 || res.status === 422) && i < candidateModels.length - 1) {
          console.warn(`[mistral] Model ${model} returned HTTP ${res.status}, retrying with ${candidateModels[i + 1]}...`);
          continue;
        }

        throw err;
      }

      const data = (await res.json()) as {
        choices: Array<{
          message: {
            content?: string;
            tool_calls?: Array<{
              id: string;
              type: "function";
              function: { name: string; arguments: string };
            }>;
          };
          finish_reason?: string;
        }>;
        usage?: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
      };

      const choice = data.choices?.[0];
      const toolCalls = choice?.message?.tool_calls?.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));

      return {
        text: choice?.message?.content ?? "",
        model,
        provider: this.name,
        toolCalls,
        finishReason: choice?.finish_reason,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    }

    throw lastError ?? new Error("Failed to execute chat with Mistral");
  }

  async chatStream(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<ReadableStream<string>> {
    const apiKey = this.getApiKey();
    const env = serverEnv();
    const preferredModel = options.model ?? env.mistralChatModel ?? "mistral-small-latest";
    const candidateModels = Array.from(new Set([preferredModel, "mistral-small-latest", "open-mistral-7b"]));

    let lastError: unknown = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      const payload: Record<string, unknown> = {
        model,
        messages: this.formatMessages(messages),
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1024,
        stream: true,
      };

      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: options.abortSignal ?? AbortSignal.timeout(60_000),
      });

      if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => "");
        const err = new Error(`Mistral streaming error (${res.status}): ${errorText.slice(0, 300)}`);
        (err as unknown as { status: number }).status = res.status;
        lastError = err;

        if ((res.status === 400 || res.status === 403 || res.status === 404 || res.status === 422) && i < candidateModels.length - 1) {
          console.warn(`[mistral] Streaming model ${model} returned HTTP ${res.status}, retrying with ${candidateModels[i + 1]}...`);
          continue;
        }

        throw err;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      return res.body.pipeThrough(
        new TransformStream<Uint8Array, string>({
          transform(chunk, controller) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;
              const dataStr = trimmed.slice(5).trim();
              if (dataStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) controller.enqueue(delta);
              } catch {
                // Ignore partial JSON chunks
              }
            }
          },
        }),
      );
    }

    throw lastError ?? new Error("Failed to stream chat with Mistral");
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const apiKey = this.getApiKey();
    const env = serverEnv();
    const model = env.mistralEmbeddingModel ?? "mistral-embed";

    // Mistral API accepts up to 128 inputs per batch
    const batches: string[][] = [];
    const BATCH_SIZE = 64;
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      batches.push(texts.slice(i, i + BATCH_SIZE));
    }

    const allEmbeddings: number[][] = [];
    for (const batch of batches) {
      const res = await fetch("https://api.mistral.ai/v1/embeddings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: batch,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        const err = new Error(`Mistral Embeddings API error (${res.status}): ${errorText.slice(0, 300)}`);
        (err as unknown as { status: number }).status = res.status;
        throw err;
      }

      const data = (await res.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
      };

      const sorted = [...data.data].sort((a, b) => a.index - b.index);
      for (const item of sorted) {
        allEmbeddings.push(item.embedding);
      }
    }

    return allEmbeddings;
  }
}
