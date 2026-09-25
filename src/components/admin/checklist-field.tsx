"use client";

import { useState } from "react";

/** Multi-select checkboxes serialized as a JSON array (for jsonArray(z.uuid()) fields). */
export function ChecklistField({ name, label, options, defaultValue = [] }: { name: string; label: string; options: { value: string; label: string }[]; defaultValue?: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  if (!options.length) return null;
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <input type="hidden" name={name} value={JSON.stringify(selected)} />
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="inline-flex min-h-10 cursor-pointer items-center gap-2 pressable rounded-full bg-fg/[0.045] px-3.5 text-sm shadow-[inset_0_0_0_1px_var(--glass-line)] hover:bg-fg/[0.07] has-checked:bg-accent-soft has-checked:text-accent has-checked:shadow-[inset_0_0_0_1px_var(--color-accent)]">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={(e) => setSelected((s) => (e.target.checked ? [...s, o.value] : s.filter((v) => v !== o.value)))}
              className="accent-[var(--color-accent)]"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
