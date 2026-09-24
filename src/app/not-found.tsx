import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { fontBody } from "./fonts";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className={`${fontBody.className} grid min-h-dvh place-items-center px-4`}>
      <div className="max-w-md text-center">
        <p className="font-mono text-sm text-accent">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or is no longer published.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonVariants()}>Go home</Link>
          <Link href="/projects" className={buttonVariants({ variant: "secondary" })}>See our work</Link>
          <Link href="/contact" className={buttonVariants({ variant: "ghost" })}>Contact us</Link>
        </div>
      </div>
    </main>
  );
}
