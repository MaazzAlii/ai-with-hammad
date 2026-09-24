export type EmailMessage = {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
};

export type EmailResult = { status: "sent" | "skipped" | "failed"; id?: string; error?: string };

/** Provider-agnostic email interface (Resend today; any SMTP/API provider later). */
export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailResult>;
}
