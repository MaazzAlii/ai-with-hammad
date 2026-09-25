"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page grid min-h-[60dvh] place-items-center py-20">
      <div className="glass-panel w-full max-w-md rounded-[2rem] px-7 py-12 text-center sm:px-10">
        <h1 className="text-2xl sm:text-3xl">Something went wrong</h1>
        <p className="mt-3 text-muted">Please try again. If the problem continues, contact us.</p>
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset}>
            <RotateCw aria-hidden /> Try again
          </Button>
          <Link href="/" className={buttonVariants({ size: "lg", variant: "secondary" })}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
