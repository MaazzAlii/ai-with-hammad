"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { publicEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/url-safety";

import { audit } from "../audit";
import { CAPTCHA_ERROR, verifyCaptcha } from "../captcha";
import { clientIp, requestMeta } from "../request-meta";

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password").max(200),
  next: z.string().max(300).optional(),
});

const GENERIC = "Incorrect email or password.";

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password"), next: formData.get("next") ?? undefined });
  if (!parsed.success) return fail("Please check the form.", z.flattenError(parsed.error).fieldErrors);
  const { email, password, next } = parsed.data;
  if (!(await verifyCaptcha(Object.fromEntries(formData), await clientIp()))) return fail(CAPTCHA_ERROR, { captchaAnswer: [CAPTCHA_ERROR] });
  const meta = await requestMeta();
  if (!(await rateLimit(`login:ip:${meta.ipHash}`, 10, 600)) || !(await rateLimit(`login:email:${email}`, 8, 900))) {
    return fail("Too many sign-in attempts. Please wait a few minutes and try again.");
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    await audit(null, { action: "auth.login_failed", entityType: "auth", summary: "Failed sign-in", metadata: { email }, ipHash: meta.ipHash });
    return fail(GENERIC);
  }
  const db = getDb();
  const [profile] = await db.select({ id: profiles.id, isActive: profiles.isActive }).from(profiles).where(eq(profiles.id, data.user.id));
  if (!profile?.isActive) {
    await supabase.auth.signOut();
    await audit({ id: data.user.id, email }, { action: "auth.login_blocked", entityType: "auth", summary: "Inactive account attempted sign-in", ipHash: meta.ipHash });
    return fail("Your account is not active. Ask an administrator for access.");
  }
  await db.update(profiles).set({ lastSignInAt: new Date() }).where(eq(profiles.id, profile.id));
  await audit({ id: data.user.id, email }, { action: "auth.login", entityType: "auth", summary: "Signed in", ipHash: meta.ipHash });
  redirect(safeNextPath(next));
}

const resetSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")) });

/** Always reports success so the form can't be used to discover which emails have accounts. */
export async function requestPasswordReset(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return fail("Enter a valid email.", z.flattenError(parsed.error).fieldErrors);
  if (!(await verifyCaptcha(Object.fromEntries(formData), await clientIp()))) return fail(CAPTCHA_ERROR, { captchaAnswer: [CAPTCHA_ERROR] });
  const meta = await requestMeta();
  if (await rateLimit(`reset:ip:${meta.ipHash}`, 5, 900)) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${publicEnv.siteUrl}/auth/confirm?next=/auth/set-password`,
    });
  }
  return ok(undefined, "If an account exists for that email, a reset link is on its way.");
}

const passwordSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords do not match", path: ["confirm"] });

export async function setPassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return fail("Please check the form.", z.flattenError(parsed.error).fieldErrors);
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return fail("Your link has expired. Request a new one.");
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(error.message.includes("different") ? "Choose a password different from your current one." : "Could not update your password.");
  await audit({ id: userData.user.id, email: userData.user.email ?? "" }, { action: "auth.password_set", entityType: "auth", summary: "Password set" });
  redirect("/admin");
}
