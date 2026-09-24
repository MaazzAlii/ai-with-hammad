/**
 * Minimal, safe Markdown → HTML renderer for CMS long-form fields.
 * Supports: ## / ### headings, paragraphs, - / 1. lists, **bold**, *italic*,
 * `code`, [links](https://…). ALL input is HTML-escaped first; only the tags
 * produced here can appear in the output. Links are restricted to http(s),
 * mailto and internal paths.
 */
import { safeHttpUrl, safeInternalPath } from "./url-safety";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeLink(href: string): string | null {
  const unescaped = href.replace(/&amp;/g, "&");
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(unescaped)) return unescaped;
  return safeInternalPath(unescaped) ?? safeHttpUrl(unescaped);
}

function inline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const safe = safeLink(href);
    if (!safe) return label;
    const external = /^https?:/i.test(safe);
    return `<a href="${escapeHtml(safe)}"${external ? ' rel="noopener noreferrer" target="_blank"' : ""}>${label}</a>`;
  });
  return out;
}

export function renderMarkdown(src: string | null | undefined): string {
  if (!src) return "";
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) html.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.type}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    const ul = line.match(/^\s*[-*]\s+(.+)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      const level = heading[1]!.length;
      html.push(`<h${level}>${inline(heading[2]!)}</h${level}>`);
    } else if (ul || ol) {
      flushPara();
      const type = ul ? "ul" : "ol";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((ul ?? ol)![1]!);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return html.join("\n");
}

/** Plain-text excerpt (for meta descriptions). */
export function markdownToText(src: string | null | undefined): string {
  if (!src) return "";
  return src
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*`>_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
