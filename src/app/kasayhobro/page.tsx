import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/site/auth-shell";
import { Logo } from "@/components/site/logo";
import { Alert } from "@/components/ui/misc";
import { NOINDEX } from "@/lib/seo";
import { safeNextPath } from "@/lib/url-safety";
import { getCurrentStaff } from "@/server/auth/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", ...NOINDEX };

export default async function LoginPage(props: PageProps<"/kasayhobro">) {
  const sp = await props.searchParams;
  const staff = await getCurrentStaff();
  if (staff?.isActive) redirect(safeNextPath(typeof sp.next === "string" ? sp.next : undefined));
  const error = sp.error === "inactive" ? "Your account does not have access to the admin area." : sp.error === "link" ? "That link is invalid or has expired." : null;
  return (
    <AuthShell
      brand={<Logo name="Admin" />}
      title="Staff sign in"
      description={
        <>
          Team access is by invitation only. Clients sign in at the{" "}
          <Link href="/portal/login" className="font-medium text-accent hover:underline">
            client portal
          </Link>
          .
        </>
      }
    >
      {error ? <Alert tone="danger" className="mb-6">{error}</Alert> : null}
      <LoginForm next={typeof sp.next === "string" ? sp.next : ""} />
    </AuthShell>
  );
}
