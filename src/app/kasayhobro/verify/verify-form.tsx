"use client";

import { useActionState } from "react";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { verifyMfaChallenge } from "@/server/actions/mfa";

export function VerifyForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(verifyMfaChallenge, null);
  return (
    <>
      <form action={action} className="space-y-5" noValidate>
        {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}
        <input type="hidden" name="next" value={next} />
        <Field id="code" label="6-digit code" error={state && !state.ok ? state.fieldErrors?.code?.[0] : undefined}>
          <Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus required />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Verifying…" : "Verify"}</Button>
      </form>
      <form action="/auth/signout" method="post">
        <button type="submit" className="mt-2 w-full rounded-full py-2 text-sm text-muted transition-colors hover:text-fg">Use a different account</button>
      </form>
    </>
  );
}
