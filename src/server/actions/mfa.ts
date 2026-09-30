"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/url-safety";

import { audit } from "../audit";
import { requestMeta } from "../request-meta";
import { getCurrentStaff, isMfaPending } from "../auth/session";

const codeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });
const verifySchema = codeSchema.extend({ next: z.string().max(300).optional() });

/** Step 1 of enrollment: register a new TOTP factor and return its QR code / secret. */
export async function startMfaEnrollment(): Promise<ActionResult<{ factorId: string; qrCode: string; secret: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return fail("You must be signed in.");
  // Clear out any unverified factor left over from an abandoned attempt first.
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const f of existing?.all ?? []) {
    if (f.factor_type === "totp" && f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
  if (error || !data) return fail(error?.message || "Could not start 2FA setup.");
  return ok({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
}

/** Step 2: confirm the code from the authenticator app to activate the factor. */
export async function confirmMfaEnrollment(factorId: string, _prev: unknown, fd: FormData): Promise<ActionResult> {
  const parsed = codeSchema.safeParse({ code: fd.get("code") });
  if (!parsed.success) return fail("Enter the 6-digit code.", { code: [parsed.error.issues[0]!.message] });
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return fail("You must be signed in.");
  const meta = await requestMeta();
  if (!(await rateLimit(`mfa-enroll:${userData.user.id}`, 8, 600))) return fail("Too many attempts. Please wait a few minutes.");
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge) return fail(challengeError?.message || "Could not verify the code.");
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: parsed.data.code });
  if (error) return fail("That code didn't match. Check the time on your device and try again.", { code: ["Incorrect code"] });
  await audit({ id: userData.user.id, email: userData.user.email ?? "" }, { action: "auth.mfa_enrolled", entityType: "auth", summary: "Enabled two-factor authentication", ipHash: meta.ipHash });
  return ok(undefined, "Two-factor authentication is now on for your account.");
}

export async function unenrollMfaFactor(factorId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return fail("You must be signed in.");
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return fail(error.message || "Could not remove this factor.");
  const meta = await requestMeta();
  await audit({ id: userData.user.id, email: userData.user.email ?? "" }, { action: "auth.mfa_removed", entityType: "auth", summary: "Removed a two-factor authentication method", ipHash: meta.ipHash });
  return ok(undefined, "Removed.");
}

/** The sign-in-time challenge: called from /kasayhobro/verify once the password step is done. */
export async function verifyMfaChallenge(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const parsed = verifySchema.safeParse({ code: fd.get("code"), next: fd.get("next") ?? undefined });
  if (!parsed.success) return fail("Enter the 6-digit code.", { code: [parsed.error.issues[0]!.message] });
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/kasayhobro");
  const meta = await requestMeta();
  if (!(await rateLimit(`mfa-verify:ip:${meta.ipHash}`, 10, 600)) || !(await rateLimit(`mfa-verify:user:${userData.user.id}`, 8, 600))) {
    return fail("Too many attempts. Please wait a few minutes and try again.");
  }
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp.find((f) => f.status === "verified");
  if (!factor) redirect("/admin");
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
  if (challengeError || !challenge) return fail("Could not start the verification. Please try again.");
  const { error } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code: parsed.data.code });
  if (error) {
    await audit({ id: userData.user.id, email: userData.user.email ?? "" }, { action: "auth.mfa_failed", entityType: "auth", summary: "Failed 2FA code", ipHash: meta.ipHash });
    return fail("That code didn't match. Please try again.", { code: ["Incorrect code"] });
  }
  await audit({ id: userData.user.id, email: userData.user.email ?? "" }, { action: "auth.mfa_verified", entityType: "auth", summary: "Completed 2FA sign-in", ipHash: meta.ipHash });
  redirect(safeNextPath(parsed.data.next));
}

export type MfaStatus = { enrolled: boolean; factorId: string | null; pending: boolean };

export async function getMfaStatus(): Promise<MfaStatus> {
  const staff = await getCurrentStaff();
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!staff && !userData.user) return { enrolled: false, factorId: null, pending: false };
  const { data } = await supabase.auth.mfa.listFactors();
  const verified = data?.totp.find((f) => f.status === "verified");
  return { enrolled: Boolean(verified), factorId: verified?.id ?? null, pending: await isMfaPending() };
}
