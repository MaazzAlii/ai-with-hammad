import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NOINDEX } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: "Set password", ...NOINDEX };

export default async function SetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/kasayhobro?error=link");
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Set your password</h1>
        <p className="mt-2 text-sm text-muted">Signed in as {data.user.email}. Choose a password of at least 12 characters.</p>
        <div className="mt-8">
          <SetPasswordForm />
        </div>
      </div>
    </main>
  );
}
