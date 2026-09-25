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

export default async function LoginPage(props: PageProps<"/kasayhobro">) {
  const sp = await props.searchParams;
  const staff = await getCurrentStaff();
  if (staff?.isActive) redirect(safeNextPath(typeof sp.next === "string" ? sp.next : undefined));
  const error = sp.error === "inactive" ? "Your account does not have access to the admin area." : sp.error === "link" ? "That link is invalid or has expired." : null;
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <div aria-hidden className="bg-grid absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative w-full max-w-sm rounded-card border border-border bg-surface/80 p-6 shadow-card backdrop-blur sm:p-8">
        <Link href="/" className="mb-8 inline-block">
          <Logo name="Admin" />
        </Link>
        <h1 className="text-2xl font-semibold">Staff sign in</h1>
        <p className="mt-2 text-sm text-muted">Team access is by invitation only. Clients sign in at the <Link href="/portal/login" className="text-accent hover:underline">client portal</Link>.</p>
        {error ? <Alert tone="danger" className="mt-6">{error}</Alert> : null}
        <div className="mt-8">
          <LoginForm next={typeof sp.next === "string" ? sp.next : ""} />
        </div>
      </div>
    </main>
  );
}
