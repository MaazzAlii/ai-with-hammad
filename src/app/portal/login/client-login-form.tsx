"use client";

import { useActionState, useState } from "react";

import { Captcha } from "@/components/forms/captcha";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { requestPasswordReset } from "@/server/actions/auth";
import { clientSignIn } from "@/server/actions/portal";

export function ClientLoginForm() {
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [state, action, pending] = useActionState(clientSignIn, null);
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, null);
  if (mode === "reset") {
    return (
      <form action={resetAction} className="space-y-5" noValidate>
        {resetState?.ok ? <Alert tone="success">{resetState.message}</Alert> : null}
        {resetState && !resetState.ok ? <Alert tone="danger">{resetState.error}</Alert> : null}
        <Field id="reset-email" label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Captcha idPrefix="client-reset-captcha" resetKey={resetState} error={resetState && !resetState.ok ? resetState.fieldErrors?.captchaAnswer?.[0] : undefined} />
        <Button type="submit" className="w-full" disabled={resetPending}>{resetPending ? "Sending…" : "Send reset link"}</Button>
        <button type="button" onClick={() => setMode("signin")} className="w-full text-sm text-muted hover:text-fg">Back to sign in</button>
      </form>
    );
  }
  return (
    <form action={action} className="space-y-5" noValidate>
      {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}
      <Field id="email" label="Email" error={state && !state.ok ? state.fieldErrors?.email?.[0] : undefined}>
        <Input name="email" type="email" autoComplete="username" required />
      </Field>
      <Field id="password" label="Password" error={state && !state.ok ? state.fieldErrors?.password?.[0] : undefined}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Captcha idPrefix="client-login-captcha" resetKey={state} error={state && !state.ok ? state.fieldErrors?.captchaAnswer?.[0] : undefined} />
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
      <button type="button" onClick={() => setMode("reset")} className="w-full text-sm text-muted hover:text-fg">Forgot password?</button>
    </form>
  );
}
