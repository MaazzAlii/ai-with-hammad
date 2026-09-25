import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/site/auth-shell";
import { NOINDEX } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: "Set password", ...NOINDEX };

export default async function SetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/kasayhobro?error=link");
  return (
    <AuthShell title="Set your password" description={`Signed in as ${data.user.email}. Choose a password of at least 12 characters.`}>
      <SetPasswordForm />
    </AuthShell>
  );
}
