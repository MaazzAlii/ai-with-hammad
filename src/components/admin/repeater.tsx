"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

import { useFieldError } from "./admin-form";

export type RepeaterColumn = { key: string; label: string; type?: "text" | "textarea" | "url"; placeholder?: string; width?: string };

/**
 * Edits a list of small objects (features, metrics, links…) and submits it as
 * JSON in a hidden input. Validated server-side with zod (jsonArray()).
 */
export function RepeaterField({
  name,
  label,
  columns,
  defaultValue = [],
  addLabel = "Add item",
  max = 20,
}: {
  name: string;
  label: string;
  columns: RepeaterColumn[];
  defaultValue?: Record<string, string>[];
  addLabel?: string;
  max?: number;
}) {
  const [rows, setRows] = useState<Record<string, string>[]>(defaultValue);
  const error = useFieldError(name);
  const empty = () => Object.fromEntries(columns.map((c) => [c.key, ""]));
  const update = (i: number, key: string, value: string) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: value } : row)));
  const move = (i: number, d: number) =>
    setRows((r) => {
      const next = [...r];
      const [item] = next.splice(i, 1);
      next.splice(i + d, 0, item!);
      return next;
    });
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      <input type="hidden" name={name} value={JSON.stringify(rows.filter((r) => Object.values(r).some((v) => v.trim())))} />
      {rows.map((row, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-control border border-border bg-surface-2/50 p-3 sm:flex-row sm:items-start">
          <div className="grid flex-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
            {columns.map((c) => (
              <div key={c.key} className="flex flex-col gap-1">
                <Label htmlFor={`${name}-${i}-${c.key}`} className="text-xs text-muted">{c.label}</Label>
                {c.type === "textarea" ? (
                  <Textarea id={`${name}-${i}-${c.key}`} rows={2} className="min-h-16" value={row[c.key] ?? ""} placeholder={c.placeholder} onChange={(e) => update(i, c.key, e.target.value)} />
                ) : (
                  <Input id={`${name}-${i}-${c.key}`} type={c.type === "url" ? "url" : "text"} value={row[c.key] ?? ""} placeholder={c.placeholder} onChange={(e) => update(i, c.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-1 sm:flex-col">
            <Button type="button" variant="ghost" size="icon" aria-label={`Move item ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label={`Move item ${i + 1} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove item ${i + 1}`} onClick={() => setRows((r) => r.filter((_, j) => j !== i))}><Trash2 /></Button>
          </div>
        </div>
      ))}
      {rows.length < max ? (
        <Button type="button" variant="secondary" size="sm" onClick={() => setRows((r) => [...r, empty()])}>
          <Plus /> {addLabel}
        </Button>
      ) : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </fieldset>
  );
}
