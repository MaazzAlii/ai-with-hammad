import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

/** Renders CMS long-form text through the escaping Markdown renderer. */
export function Markdown({ source, className }: { source: string; className?: string }) {
  if (!source.trim()) return null;
  // Safe: renderMarkdown HTML-escapes all input and only emits a fixed tag allow-list.
  return <div className={cn("prose-site", className)} dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />;
}
