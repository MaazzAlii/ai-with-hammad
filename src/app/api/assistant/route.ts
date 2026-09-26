import { z } from "zod";

import { serverEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { buildAssistantPrompt } from "@/server/assistant/knowledge";
import { getPublicSettings } from "@/server/dal/public/site";
import { requestMeta } from "@/server/request-meta";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1500) }))
    .min(1)
    .max(16),
});

const json = (status: number, error: string) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

/**
 * Site assistant: streams a Mistral chat completion as plain text.
 * The API key never leaves the server; visitors are rate-limited per IP; only the last
 * few turns are sent; the prompt is built from published CMS content only.
 */
export async function POST(req: Request) {
  const env = serverEnv();
  if (!env.mistralApiKey) return json(503, "The assistant is not configured yet.");
  const { assistant } = await getPublicSettings();
  if (!assistant.enabled) return json(503, "The assistant is turned off.");

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, "Invalid request.");
  if (parsed.data.messages.at(-1)?.role !== "user") return json(400, "Invalid request.");

  const { ipHash } = await requestMeta();
  const [burstOk, dayOk] = await Promise.all([
    rateLimit(`assistant:ip:${ipHash}`, 20, 600),
    rateLimit(`assistant:day:${ipHash}`, 120, 86400),
  ]);
  if (!burstOk || !dayOk) return json(429, "You're sending messages quickly — please wait a few minutes, or use the contact form.");

  const system = await buildAssistantPrompt();
  const upstream = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.mistralApiKey}` },
    body: JSON.stringify({
      model: env.mistralModel,
      stream: true,
      temperature: 0.3,
      max_tokens: 400,
      messages: [{ role: "system", content: system }, ...parsed.data.messages.slice(-10)],
    }),
    signal: AbortSignal.timeout(45_000),
  }).catch((e: unknown) => {
    console.error("[assistant] upstream request failed", e);
    return null;
  });
  if (!upstream?.ok || !upstream.body) {
    if (upstream) console.error("[assistant] upstream error", upstream.status, (await upstream.text().catch(() => "")).slice(0, 300));
    return json(502, "The assistant is unavailable right now. Please use the contact form or WhatsApp.");
  }

  // Server-sent events from Mistral → plain text deltas for the browser.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const data = line.startsWith("data:") ? line.slice(5).trim() : "";
          if (!data || data === "[DONE]") continue;
          try {
            const delta = (JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // Partial or non-JSON line: ignore.
          }
        }
      },
    }),
  );
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
