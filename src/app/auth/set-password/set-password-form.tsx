"use client";

import { useActionState } from "react";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { setPassword } from "@/server/actions/auth";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState(setPassword, null);
  const err = state && !state.ok ? state : null;
  return (
    <form action={action} className="space-y-5" noValidate>
      {err ? <Alert tone="danger">{err.error}</Alert> : null}
      <Field id="password" label="New password" error={err?.fieldErrors?.password?.[0]}>
        <Input name="password" type="password" autoComplete="new-password" minLength={12} required />
      </Field>
      <Field id="confirm" label="Confirm password" error={err?.fieldErrors?.confirm?.[0]}>
        <Input name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Saving…" : "Save password"}</Button>
    </form>
  );
}
