"use client";

import { useRouter } from "next/navigation";
import { createContext, useActionState, useContext, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import type { ActionResult, FieldErrors } from "@/lib/action-result";

const ErrorsContext = createContext<FieldErrors>({});
export const useFieldError = (name: string) => useContext(ErrorsContext)[name]?.[0];

type FormAction = (prev: ActionResult<{ id?: string; redirectTo?: string }> | null, fd: FormData) => Promise<ActionResult<{ id?: string; redirectTo?: string }>>;

/**
 * Admin form shell: progressive-enhancement <form action>, server-side zod
 * validation, field errors via context, toast on success, optional redirect.
 */
export function AdminForm({
  action,
  children,
  submitLabel = "Save",
  className,
  footer,
  disabled = false,
}: {
  action: FormAction;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  footer?: React.ReactNode;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved");
      if (state.data?.redirectTo) router.push(state.data.redirectTo);
      else router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router]);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <ErrorsContext.Provider value={errors}>
      <form action={formAction} className={className} noValidate>
        {state && !state.ok ? (
          <Alert tone="danger" className="mb-6">
            {state.error}
            {Object.keys(errors).length ? (
              <ul className="mt-1 list-disc pl-5 text-xs">
                {Object.entries(errors).map(([k, v]) => (v?.[0] ? <li key={k}><span className="font-mono">{k}</span>: {v[0]}</li> : null))}
              </ul>
            ) : null}
          </Alert>
        ) : null}
        <fieldset disabled={disabled || pending} className="contents">
          {children}
        </fieldset>
        <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-bg/90 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-card sm:border sm:px-5">
          {footer}
          {!disabled ? (
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          ) : (
            <p className="text-sm text-muted">Read-only — you don&apos;t have permission to edit.</p>
          )}
        </div>
      </form>
    </ErrorsContext.Provider>
  );
}
