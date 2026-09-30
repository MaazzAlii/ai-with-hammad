import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/site/auth-shell";
import { Logo } from "@/components/site/logo";
import { NOINDEX } from "@/lib/seo";
import { safeNextPath } from "@/lib/url-safety";
import { getCurrentStaff, isMfaPending } from "@/server/auth/session";

import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify it's you", ...NOINDEX };

export default async function VerifyPage(props: PageProps<"/kasayhobro/verify">) {
  const sp = await props.searchParams;
  const staff = await getCurrentStaff();
  if (staff?.isActive) redirect(safeNextPath(typeof sp.next === "string" ? sp.next : undefined));
  if (!(await isMfaPending())) redirect("/kasayhobro");
  return (
    <AuthShell brand={<Logo name="Admin" />} title="Verify it's you" description="Enter the 6-digit code from your authenticator app.">
      <VerifyForm next={typeof sp.next === "string" ? sp.next : ""} />
    </AuthShell>
  );
}
