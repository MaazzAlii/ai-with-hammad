"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { ActionButton } from "@/components/admin/confirm-action";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { confirmMfaEnrollment, startMfaEnrollment, unenrollMfaFactor } from "@/server/actions/mfa";

type Setup = { factorId: string; qrCode: string; secret: string };

function ConfirmEnrollment({ setup, onDone, onCancel }: { setup: Setup; onDone: () => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState(confirmMfaEnrollment.bind(null, setup.factorId), null);
  useEffect(() => {
    if (state?.ok) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDone is stable enough for this one-shot transition
  }, [state]);
  if (state?.ok) return null;
  return (
    <form action={action} className="mt-5 space-y-4">
      {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}
      <Field id="mfa-code" label="6-digit code" error={state && !state.ok ? state.fieldErrors?.code?.[0] : undefined}>
        <Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus required />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Verifying…" : "Confirm"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function MfaPanel({ enrolled: initialEnrolled, factorId: initialFactorId }: { enrolled: boolean; factorId: string | null }) {
  const [pending, startTransition] = useTransition();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [factorId, setFactorId] = useState(initialFactorId);
  const [justEnrolled, setJustEnrolled] = useState(false);

  const begin = () => {
    setError(null);
    startTransition(async () => {
      const r = await startMfaEnrollment();
      if (r.ok) setSetup(r.data!);
      else setError(r.error);
    });
  };

  if (justEnrolled) {
    return (
      <section className="glass-card rounded-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Two-factor authentication</h2>
        <p className="mt-2 text-sm text-fg">Turned on for your account. You&apos;ll be asked for a code from your app each time you sign in.</p>
      </section>
    );
  }

  if (enrolled && factorId) {
    return (
      <section className="glass-card rounded-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Two-factor authentication</h2>
        <p className="mt-2 text-sm text-muted">On — your account requires a code from your authenticator app to sign in.</p>
        <ActionButton
          variant="secondary"
          className="mt-4"
          confirm={{ title: "Turn off two-factor authentication?", description: "Your account will only need a password to sign in.", confirmLabel: "Turn off" }}
          action={unenrollMfaFactor.bind(null, factorId)}
        >
          Turn off 2FA
        </ActionButton>
      </section>
    );
  }

  if (setup) {
    return (
      <section className="glass-card rounded-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Set up two-factor authentication</h2>
        <p className="mt-2 text-sm text-muted">Scan this with an authenticator app (Google Authenticator, 1Password, Authy…), then enter the 6-digit code it shows.</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- data: URI from Supabase, not an optimizable asset */}
        <img src={setup.qrCode} alt="Scan with your authenticator app" className="mt-4 size-44 rounded-control bg-white p-2" />
        <p className="mt-2 text-xs text-subtle break-all">Can&apos;t scan? Enter this code manually: {setup.secret}</p>
        <ConfirmEnrollment
          setup={setup}
          onCancel={() => setSetup(null)}
          onDone={() => {
            setEnrolled(true);
            setFactorId(setup.factorId);
            setJustEnrolled(true);
          }}
        />
      </section>
    );
  }

  return (
    <section className="glass-card rounded-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">Two-factor authentication</h2>
      <p className="mt-2 text-sm text-muted">Off. Add an authenticator app for a second layer of protection on your account.</p>
      {error ? <Alert tone="danger" className="mt-3">{error}</Alert> : null}
      <Button className="mt-4" onClick={begin} disabled={pending}>{pending ? "Starting…" : "Set up 2FA"}</Button>
    </section>
  );
}
