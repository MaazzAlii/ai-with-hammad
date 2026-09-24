"use client";

import * as React from "react";

import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { useFieldError, useFieldId } from "./admin-form";

type Base = { name: string; label: string; hint?: React.ReactNode; required?: boolean; className?: string };

function Wrap({ name, label, hint, required, className, children }: Base & { children: React.ReactElement<Record<string, unknown>> }) {
  const error = useFieldError(name);
  const id = useFieldId(name);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-err` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className={required ? "after:ml-0.5 after:text-accent after:content-['*']" : undefined}>
        {label}
        
      </Label>
      {React.cloneElement(children, { id, name, "aria-invalid": Boolean(error) || undefined, "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined })}
      {hint ? <p id={hintId} className="text-xs text-subtle">{hint}</p> : null}
      {error ? <p id={errorId} className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

export function TextField({ defaultValue, type = "text", placeholder, maxLength, ...b }: Base & { defaultValue?: string | number | null; type?: string; placeholder?: string; maxLength?: number }) {
  return (
    <Wrap {...b}>
      <Input type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} maxLength={maxLength} required={b.required} />
    </Wrap>
  );
}

export function TextAreaField({ defaultValue, rows = 5, placeholder, ...b }: Base & { defaultValue?: string | null; rows?: number; placeholder?: string }) {
  return (
    <Wrap {...b}>
      <Textarea defaultValue={defaultValue ?? ""} rows={rows} placeholder={placeholder} />
    </Wrap>
  );
}

export function SelectField({ defaultValue, options, ...b }: Base & { defaultValue?: string | null; options: { value: string; label: string }[] }) {
  return (
    <Wrap {...b}>
      <NativeSelect defaultValue={defaultValue ?? ""}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </NativeSelect>
    </Wrap>
  );
}

/** Switch that submits "on" when checked (hidden input mirrors state for native forms). */
export function SwitchField({ name, label, defaultChecked, hint, disabled }: { name: string; label: string; defaultChecked?: boolean; hint?: string; disabled?: boolean }) {
  const [checked, setChecked] = React.useState(Boolean(defaultChecked));
  const id = useFieldId(name);
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={setChecked} disabled={disabled} />
      {checked ? <input type="hidden" name={name} value="on" /> : null}
    </div>
  );
}

export function FormSection({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card border border-border bg-surface/60 p-5 sm:p-6", className)}>
      <h2 className="font-display text-base font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}
