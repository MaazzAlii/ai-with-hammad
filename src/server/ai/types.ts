export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ChatMessage = {
  role: ChatRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
};

export type ToolProperty = {
  type: string;
  description?: string;
  enum?: string[];
  items?: { type: string };
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, ToolProperty>;
      required?: string[];
    };
  };
};

export type ChatCompletionOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: ToolDefinition[];
  toolChoice?: "auto" | "none" | "required" | { type: "function"; function: { name: string } };
  abortSignal?: AbortSignal;
};

export type ChatCompletionResponse = {
  text: string;
  model: string;
  provider: string;
  toolCalls?: ToolCall[];
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  chat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatCompletionResponse>;
  chatStream(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ReadableStream<string>>;
  embed(texts: string[]): Promise<number[][]>;
}
