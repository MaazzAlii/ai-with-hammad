import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/site/logo";
import { Alert } from "@/components/ui/misc";
import { NOINDEX } from "@/lib/seo";
import { safeNextPath } from "@/lib/url-safety";
import { getCurrentStaff } from "@/server/auth/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", ...NOINDEX };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const staff = await getCurrentStaff();
  if (staff?.isActive) redirect(safeNextPath(typeof sp.next === "string" ? sp.next : undefined));
  const error = sp.error === "inactive" ? "Your account does not have access to the admin area." : sp.error === "link" ? "That link is invalid or has expired." : null;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 inline-block">
          <Logo name="Admin" />
        </Link>
        <h1 className="text-2xl font-semibold">Staff sign in</h1>
        <p className="mt-2 text-sm text-muted">Access is by invitation only.</p>
        {error ? <Alert tone="danger" className="mt-6">{error}</Alert> : null}
        <div className="mt-8">
          <LoginForm next={typeof sp.next === "string" ? sp.next : ""} />
        </div>
      </div>
    </main>
  );
}
