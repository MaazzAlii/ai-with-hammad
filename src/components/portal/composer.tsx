"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import type { ActionResult } from "@/lib/action-result";

type Action = (prev: ActionResult<{ id?: string }> | null, fd: FormData) => Promise<ActionResult<{ id?: string }>>;

/** Message composer: Enter+Ctrl/Cmd sends, clears on success, refreshes the thread. */
export function Composer({ action, placeholder = "Write a message…", disabled }: { action: Action; placeholder?: string; disabled?: boolean }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);
  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}
      <Label htmlFor="composer" className="sr-only">Message</Label>
      <Textarea
        id="composer"
        name="body"
        rows={3}
        required
        maxLength={5000}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) formRef.current?.requestSubmit();
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-subtle">Ctrl/⌘ + Enter to send</p>
        <Button type="submit" disabled={pending || disabled}>
          <Send aria-hidden /> {pending ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  );
}
