import "server-only";

import { serverEnv } from "@/lib/env";

import { MistralProvider } from "./mistral";
import type { AIProvider, ChatCompletionOptions, ChatCompletionResponse, ChatMessage } from "./types";
import { XAIProvider } from "./xai";

export class FailoverAIProvider implements AIProvider {
  readonly name = "failover";
  private primary: AIProvider;
  private fallback: AIProvider | null;

  constructor(primary: AIProvider, fallback: AIProvider | null = null) {
    this.primary = primary;
    this.fallback = fallback;
  }

  isConfigured(): boolean {
    return this.primary.isConfigured() || (this.fallback?.isConfigured() ?? false);
  }

  private isRecoverableError(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const status = (err as { status?: number }).status;
    const message = ((err as { message?: string }).message ?? "").toLowerCase();

    // Rate limits, quota, overload, service downtime, timeouts
    if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
      return true;
    }
    if (
      message.includes("rate limit") ||
      message.includes("quota") ||
      message.includes("overloaded") ||
      message.includes("timeout") ||
      message.includes("unavailable") ||
      message.includes("econnreset")
    ) {
      return true;
    }
    return false;
  }

  async chat(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<ChatCompletionResponse> {
    const hasPrimary = this.primary.isConfigured();
    const hasFallback = this.fallback?.isConfigured() ?? false;

    if (!hasPrimary && !hasFallback) {
      throw new Error("No AI provider is configured (set MISTRAL_API_KEY or XAI_API_KEY)");
    }

    // If primary not configured but fallback is, use fallback
    if (!hasPrimary && hasFallback && this.fallback) {
      return this.fallback.chat(messages, options);
    }

    try {
      return await this.primary.chat(messages, options);
    } catch (err) {
      if (this.fallback && hasFallback && this.isRecoverableError(err)) {
        console.warn(`[ai-provider] Primary provider (${this.primary.name}) failed with recoverable error, failing over to ${this.fallback.name}.`);
        return await this.fallback.chat(messages, options);
      }
      throw err;
    }
  }

  async chatStream(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<ReadableStream<string>> {
    const hasPrimary = this.primary.isConfigured();
    const hasFallback = this.fallback?.isConfigured() ?? false;

    if (!hasPrimary && !hasFallback) {
      throw new Error("No AI provider is configured (set MISTRAL_API_KEY or XAI_API_KEY)");
    }

    if (!hasPrimary && hasFallback && this.fallback) {
      return this.fallback.chatStream(messages, options);
    }

    try {
      return await this.primary.chatStream(messages, options);
    } catch (err) {
      if (this.fallback && hasFallback && this.isRecoverableError(err)) {
        console.warn(`[ai-provider] Primary provider (${this.primary.name}) failed with recoverable error, failing over to ${this.fallback.name}.`);
        return await this.fallback.chatStream(messages, options);
      }
      throw err;
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Mistral is the primary embedding provider
    if (this.primary.name === "mistral" && this.primary.isConfigured()) {
      return this.primary.embed(texts);
    }
    if (this.fallback && this.fallback.name === "mistral" && this.fallback.isConfigured()) {
      return this.fallback.embed(texts);
    }
    const mistral = new MistralProvider();
    if (mistral.isConfigured()) {
      return mistral.embed(texts);
    }
    throw new Error("Embedding requires MISTRAL_API_KEY to be configured.");
  }
}

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const env = serverEnv();
  const mistral = new MistralProvider();
  const xai = new XAIProvider();

  const priority = env.aiProviderPriority;
  const primaryName = priority[0] === "xai" ? "xai" : "mistral";
  const fallbackName = primaryName === "mistral" ? "xai" : "mistral";

  const primary = primaryName === "mistral" ? mistral : xai;
  const fallback = fallbackName === "mistral" ? mistral : xai;

  cachedProvider = new FailoverAIProvider(primary, fallback);
  return cachedProvider;
}

export function resetAIProvider(): void {
  cachedProvider = null;
}
