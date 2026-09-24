"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-card border border-danger/30 bg-danger-soft p-8">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">The error was logged on the server{error.digest ? ` (reference ${error.digest})` : ""}. Try again, or contact an administrator if it persists.</p>
      <Button className="mt-5" onClick={reset}>Try again</Button>
    </div>
  );
}
