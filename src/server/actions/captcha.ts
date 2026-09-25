"use server";

import { rateLimit } from "@/lib/rate-limit";

import { createChallenge } from "../captcha";
import { requestMeta } from "../request-meta";

/** Issue a new arithmetic challenge (rate-limited per visitor). */
export async function getCaptchaChallenge(): Promise<{ question: string; token: string } | null> {
  const { ipHash } = await requestMeta();
  if (!(await rateLimit(`captcha-issue:${ipHash}`, 60, 600))) return null;
  return createChallenge();
}
