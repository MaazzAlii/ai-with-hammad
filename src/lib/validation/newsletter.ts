import "@/lib/zod-config";

import { z } from "zod";

export const newsletterSignupSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Please enter a valid email address")),
});

export type NewsletterSignupInput = z.input<typeof newsletterSignupSchema>;
