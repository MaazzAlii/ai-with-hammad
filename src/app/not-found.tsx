import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="page-enter grid min-h-dvh place-items-center px-5 py-16">
      <div className="glass-panel w-full max-w-md rounded-[2rem] px-7 py-12 text-center sm:px-10">
        <p className="text-sm font-medium text-subtle tabular-nums">Error 404</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">This page isn&apos;t here</h1>
        <p className="mt-3 text-muted">It may have moved, or it&apos;s no longer published.</p>
        <div className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            <ArrowLeft aria-hidden /> Back to home
          </Link>
          <Link href="/projects" className={buttonVariants({ size: "lg", variant: "secondary" })}>
            See our work
          </Link>
        </div>
        <Link href="/contact" className="mt-6 inline-block text-sm text-muted transition-colors hover:text-fg">
          Or contact us
        </Link>
      </div>
    </main>
  );
}
