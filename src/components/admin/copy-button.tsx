"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyButton({ value, label = "Copy URL" }: { value: string; label?: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        toast.success("Copied");
      }}
    >
      <Copy /> {label}
    </Button>
  );
}
