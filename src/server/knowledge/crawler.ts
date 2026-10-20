import "server-only";

import { safeFetch, validateCrawlerUrl } from "./ssrf";
import type { KnowledgeDocument } from "./types";
import { normalizeText, sha256 } from "./hasher";

export type CrawlOptions = {
  maxPages?: number;
  maxDepth?: number;
};

export type ExtractedPage = {
  url: string;
  title: string;
  description: string;
  content: string;
  links: string[];
};

export function cleanHtmlToMarkdown(html: string): { title: string; description: string; content: string; links: string[] } {
  // 1. Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";

  // 2. Extract meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : "";

  // 3. Extract links before stripping tags
  const links: string[] = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();
    if (rawHref && !rawHref.startsWith("#") && !rawHref.startsWith("javascript:") && !rawHref.startsWith("mailto:")) {
      links.push(rawHref);
    }
  }

  // 4. Strip scripts, styles, iframes, svgs, and non-content tags
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "");

  // 5. Convert headings and blocks to Markdown
  cleaned = cleaned.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n");
  cleaned = cleaned.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n");
  cleaned = cleaned.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n");
  cleaned = cleaned.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n\n#### $1\n\n");
  cleaned = cleaned.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n\n##### $1\n\n");
  cleaned = cleaned.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "\n\n###### $1\n\n");
  cleaned = cleaned.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");
  cleaned = cleaned.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1");
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");

  // 6. Strip all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, " ");

  // 7. Decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  return {
    title: title || "Untitled Page",
    description,
    content: normalizeText(cleaned),
    links,
  };
}

export async function crawlWebsite(startUrl: string, options: CrawlOptions = {}): Promise<KnowledgeDocument[]> {
  const maxPages = options.maxPages ?? 30;
  const maxDepth = options.maxDepth ?? 3;

  const check = validateCrawlerUrl(startUrl);
  if (!check.ok || !check.url) {
    throw new Error(`Cannot crawl start URL: ${check.reason}`);
  }

  const baseOrigin = check.url.origin;
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: check.url.href, depth: 0 }];
  const documents: KnowledgeDocument[] = [];

  while (queue.length > 0 && documents.length < maxPages) {
    const item = queue.shift();
    if (!item) break;

    const normalizedUrl = item.url.split("#")[0].replace(/\/$/, "") || item.url;
    if (visited.has(normalizedUrl)) continue;
    visited.add(normalizedUrl);

    try {
      const res = await safeFetch(normalizedUrl);
      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
        continue;
      }

      const html = await res.text();
      const extracted = cleanHtmlToMarkdown(html);

      if (extracted.content.length > 50) {
        const docId = `doc-${sha256(normalizedUrl).slice(0, 16)}`;
        const contentHash = sha256(extracted.content);

        documents.push({
          id: docId,
          sourceUrl: normalizedUrl,
          title: extracted.title,
          description: extracted.description,
          sourceType: "website",
          contentHash,
          content: extracted.content,
          chunkCount: 0,
          metadata: {
            depth: item.depth,
            crawledUrl: normalizedUrl,
          },
          crawledAt: new Date().toISOString(),
        });
      }

      // Discover internal links if not exceeding depth limit
      if (item.depth < maxDepth) {
        for (const link of extracted.links) {
          try {
            const absolute = new URL(link, normalizedUrl);
            if (absolute.origin === baseOrigin) {
              const cleaned = absolute.href.split("#")[0].replace(/\/$/, "") || absolute.href;
              if (!visited.has(cleaned) && !queue.some((q) => q.url === cleaned)) {
                queue.push({ url: cleaned, depth: item.depth + 1 });
              }
            }
          } catch {
            // Ignore malformed hrefs
          }
        }
      }
    } catch (e) {
      console.warn(`[crawler] Failed to crawl ${normalizedUrl}:`, e);
    }
  }

  return documents;
}
