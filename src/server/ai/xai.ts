import "server-only";

import { serverEnv } from "@/lib/env";

import type { AIProvider, ChatCompletionOptions, ChatCompletionResponse, ChatMessage } from "./types";

export class XAIProvider implements AIProvider {
  readonly name = "xai";

  isConfigured(): boolean {
    return Boolean(serverEnv().xaiApiKey);
  }

  private getApiKey(): string {
    const raw = serverEnv().xaiApiKey;
    if (!raw) throw new Error("XAI_API_KEY is not configured");
    const cleaned = raw.trim().replace(/[\r\n\t]/g, " ");
    const key = cleaned.split(/\s+/).filter(Boolean)[0];
    if (!key) throw new Error("XAI_API_KEY is empty");
    return key;
  }

  private formatMessages(messages: ChatMessage[]) {
    const sanitized: Array<Record<string, unknown>> = [];

    for (const m of messages) {
      const content = (m.content || "").trim();
      if (!content && (!m.toolCalls || m.toolCalls.length === 0)) continue;

      const base: Record<string, unknown> = {
        role: m.role,
        content: content || " ",
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

      const last = sanitized[sanitized.length - 1];
      if (last && last.role === base.role && !last.tool_calls && !base.tool_calls) {
        last.content = `${last.content}\n\n${base.content}`;
      } else {
        sanitized.push(base);
      }
    }

    while (sanitized.length > 0 && sanitized[sanitized.length - 1].role === "assistant") {
      sanitized.pop();
    }

    return sanitized;
  }

  async chat(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<ChatCompletionResponse> {
    const apiKey = this.getApiKey();
    const env = serverEnv();
    const model = options.model ?? env.xaiChatModel ?? "grok-2-latest";

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

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
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
      const err = new Error(`xAI (Grok) API error (${res.status}): ${errorText.slice(0, 300)}`);
      (err as unknown as { status: number }).status = res.status;
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

  async chatStream(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<ReadableStream<string>> {
    const apiKey = this.getApiKey();
    const env = serverEnv();
    const model = options.model ?? env.xaiChatModel ?? "grok-2-latest";

    const payload: Record<string, unknown> = {
      model,
      messages: this.formatMessages(messages),
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1024,
      stream: true,
    };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
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
      const err = new Error(`xAI (Grok) streaming error (${res.status}): ${errorText.slice(0, 300)}`);
      (err as unknown as { status: number }).status = res.status;
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

  async embed(_texts: string[]): Promise<number[][]> {
    throw new Error("xAI Grok does not provide an embedding API; use Mistral for embeddings.");
  }
}
