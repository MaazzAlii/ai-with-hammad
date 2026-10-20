import "server-only";

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { publicEnv } from "@/lib/env";

import { normalizeText, sha256 } from "./hasher";
import type { KnowledgeDocument } from "./types";

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".tmp",
  ".agents",
  ".claude",
  "build",
  "dist",
]);

const ALLOWED_DOC_EXTENSIONS = new Set([".md"]);

/**
 * Extracts public documentation and architectural files from the repository
 * so the assistant is aware of technical capabilities, APIs, and features.
 * Strictly excludes any private files, credentials, or binaries.
 */
export async function extractCodebaseDocs(rootDir = process.cwd()): Promise<KnowledgeDocument[]> {
  const docs: KnowledgeDocument[] = [];
  const site = publicEnv.siteUrl.replace(/\/$/, "");
  const now = new Date().toISOString();

  function scanDir(dir: string, depth = 0) {
    if (depth > 4) return;
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith(".") && entry !== ".github") continue;
        if (EXCLUDED_DIRS.has(entry)) continue;

        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath, depth + 1);
        } else if (stat.isFile()) {
          const lower = entry.toLowerCase();
          // Never read any env files, keys, or certs
          if (lower.startsWith(".env") || lower.includes("secret") || lower.includes("key") || lower.endsWith(".pem")) {
            continue;
          }

          const hasAllowedExt = Array.from(ALLOWED_DOC_EXTENSIONS).some((ext) => lower.endsWith(ext));
          if (hasAllowedExt) {
            // Read markdown file
            try {
              const relPath = relative(rootDir, fullPath);
              // Ignore the master prompt itself or temporary logs
              if (relPath.includes("MASTER PROMPT") || relPath.includes(".tmp")) continue;

              const content = readFileSync(fullPath, "utf-8");
              if (content.length > 50 && content.length < 100_000) {
                const titleMatch = content.match(/^#\s+(.+)$/m);
                const title = titleMatch ? titleMatch[1].trim() : relPath;
                const clean = normalizeText(content);

                docs.push({
                  id: `doc-code-${sha256(relPath).slice(0, 16)}`,
                  sourceUrl: `${site}/docs#${relPath.replace(/\.md$/i, "")}`,
                  canonicalUrl: `${site}/`,
                  title: `Docs: ${title}`,
                  description: `Technical documentation and architecture from ${relPath}`,
                  sourceType: "code",
                  contentHash: sha256(clean),
                  content: clean,
                  chunkCount: 0,
                  metadata: {
                    repositoryPath: relPath,
                    isDocumentation: true,
                  },
                  crawledAt: now,
                });
              }
            } catch {
              // Ignore read errors
            }
          }
        }
      }
    } catch {
      // Ignore scan errors
    }
  }

  // Scan root README and docs directory
  const readmePath = join(rootDir, "README.md");
  if (existsSync(readmePath)) {
    try {
      const content = readFileSync(readmePath, "utf-8");
      const clean = normalizeText(content);
      docs.push({
        id: "doc-code-readme",
        sourceUrl: `${site}/#readme`,
        canonicalUrl: `${site}/`,
        title: "Repository Overview (README)",
        description: "High-level overview of the AI With Hamad platform and features.",
        sourceType: "code",
        contentHash: sha256(clean),
        content: clean,
        chunkCount: 0,
        metadata: { repositoryPath: "README.md" },
        crawledAt: now,
      });
    } catch {
      // Ignore
    }
  }

  const docsDir = join(rootDir, "docs");
  if (existsSync(docsDir)) {
    scanDir(docsDir, 0);
  }

  return docs;
}
