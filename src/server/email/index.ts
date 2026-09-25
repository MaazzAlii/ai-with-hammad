import "server-only";

import { Resend } from "resend";

import { serverEnv } from "@/lib/env";

import type { EmailMessage, EmailProvider, EmailResult } from "./types";

class ResendProvider implements EmailProvider {
  readonly name = "resend";
  private client: Resend;
  constructor(apiKey: string, private from: string) {
    this.client = new Resend(apiKey);
  }
  async send(m: EmailMessage): Promise<EmailResult> {
    const { data, error } = await this.client.emails.send({ from: this.from, to: m.to, subject: m.subject, text: m.text, replyTo: m.replyTo });
    if (error) return { status: "failed", error: error.message };
    return { status: "sent", id: data?.id };
  }
}

/** Used when no provider is configured: logs metadata only (never message bodies). */
class ConsoleProvider implements EmailProvider {
  readonly name = "console";
  async send(m: EmailMessage): Promise<EmailResult> {
    console.info(`[email] provider not configured — skipped "${m.subject}" to ${m.to.length} recipient(s)`);
    return { status: "skipped" };
  }
}

export function getEmailProvider(): EmailProvider {
  const env = serverEnv();
  if (env.resendApiKey && env.emailFrom) return new ResendProvider(env.resendApiKey, env.emailFrom);
  return new ConsoleProvider();
}

/** Send with timeout; never throws. */
export async function sendEmailSafely(message: EmailMessage, provider = getEmailProvider(), timeoutMs = 8000): Promise<EmailResult> {
  if (message.to.length === 0) return { status: "skipped" };
  try {
    return await Promise.race([
      provider.send(message),
      new Promise<EmailResult>((resolve) => setTimeout(() => resolve({ status: "failed", error: "timeout" }), timeoutMs)),
    ]);
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "unknown error" };
  }
}
