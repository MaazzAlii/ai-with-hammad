import { z } from "zod";

import { rateLimit } from "@/lib/rate-limit";
import { runAgent, type AgentStreamResult } from "@/server/agent/agent";
import { getAIProvider } from "@/server/ai/provider";
import { getPublicSettings } from "@/server/dal/public/site";
import { requestMeta } from "@/server/request-meta";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1500) }))
    .min(1)
    .max(20),
});

const json = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

/**
 * Site assistant: Agentic RAG chat completion endpoint with streaming and citations.
 * Visitors are rate-limited per IP; responses are strictly grounded in indexed website knowledge.
 */
export async function POST(req: Request) {
  const provider = getAIProvider();
  if (!provider.isConfigured()) {
    return json(503, "The assistant is not configured yet (missing API key).");
  }

  const { assistant } = await getPublicSettings().catch(() => ({ assistant: { enabled: true } }));
  if (!assistant.enabled) {
    return json(503, "The assistant is turned off.");
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, "Invalid request.");
  if (parsed.data.messages.at(-1)?.role !== "user") return json(400, "Invalid request.");

  const { ipHash } = await requestMeta();
  const [burstOk, dayOk] = await Promise.all([
    rateLimit(`assistant:ip:${ipHash}`, 25, 600),
    rateLimit(`assistant:day:${ipHash}`, 150, 86400),
  ]);
  if (!burstOk || !dayOk) {
    return json(429, "You're sending messages quickly — please wait a few minutes, or use the contact form.");
  }

  try {
    const result = (await runAgent(parsed.data.messages, { stream: true })) as AgentStreamResult;

    const headers: Record<string, string> = {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-citations": encodeURIComponent(JSON.stringify(result.citations)),
    };

    const encoder = new TextEncoder();
    const stream = result.stream.pipeThrough(
      new TransformStream<string, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(encoder.encode(chunk));
        },
      }),
    );

    return new Response(stream, { headers });
  } catch (err) {
    console.error("[assistant] Agent execution failed:", err);
    return json(502, "The assistant is unavailable right now. Please use the contact form or WhatsApp.");
  }
}
