"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";

/** Assign team members (with role on project) — JSON-serialized. */
export function TeamPicker({ name, options, defaultValue = [] }: { name: string; options: { id: string; name: string }[]; defaultValue?: { teamMemberId: string; roleOnProject: string }[] }) {
  const [rows, setRows] = useState(defaultValue);
  if (!options.length) return <p className="text-sm text-muted">Add team members first.</p>;
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(rows.filter((r) => r.teamMemberId))} />
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <div className="grid flex-1 gap-2">
            <NativeSelect aria-label="Team member" value={r.teamMemberId} onChange={(e) => setRows((x) => x.map((y, j) => (j === i ? { ...y, teamMemberId: e.target.value } : y)))}>
              <option value="">Select…</option>
              {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </NativeSelect>
            <Input aria-label="Role on project" placeholder="Role on project" value={r.roleOnProject} onChange={(e) => setRows((x) => x.map((y, j) => (j === i ? { ...y, roleOnProject: e.target.value } : y)))} />
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Remove team member" onClick={() => setRows((x) => x.filter((_, j) => j !== i))}><Trash2 /></Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="secondary" onClick={() => setRows((x) => [...x, { teamMemberId: "", roleOnProject: "" }])}><Plus /> Add member</Button>
    </div>
  );
}
