"use client";

import { Bot, CheckCircle, Database, ExternalLink, RefreshCw, Search, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { clearKnowledgeAction, reindexKnowledgeAction, testRetrievalAction } from "@/server/actions/knowledge";
import type { AdminKnowledgeDTO } from "@/server/dal/admin/knowledge";
import type { SearchResult } from "@/server/knowledge/types";

export function KnowledgeManager({ initialData, canWrite }: { initialData: AdminKnowledgeDTO; canWrite: boolean }) {
  const [data, setData] = useState<AdminKnowledgeDTO>(initialData);
  const [isPending, startTransition] = useTransition();
  const [includeCrawler, setIncludeCrawler] = useState(false);
  const [forceReindex, setForceReindex] = useState(false);

  // Playground state
  const [testQuery, setTestQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [isSearching, startSearch] = useTransition();

  // Document filter
  const [docFilter, setDocFilter] = useState("");

  const filteredDocs = data.documents.filter(
    (d) =>
      d.title.toLowerCase().includes(docFilter.toLowerCase()) ||
      d.sourceUrl.toLowerCase().includes(docFilter.toLowerCase()) ||
      d.sourceType.toLowerCase().includes(docFilter.toLowerCase()),
  );

  const handleReindex = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("includeCrawler", includeCrawler ? "true" : "false");
      fd.append("forceReindex", forceReindex ? "true" : "false");

      const res = await reindexKnowledgeAction(null, fd);
      if (res.ok) {
        toast.success(res.message ?? "Website knowledge indexed successfully!");
        // Refresh local status
        const refreshed = await fetch("/api/knowledge/index").then((r) => r.json()).catch(() => null);
        if (refreshed?.knowledge) {
          setData((prev) => ({
            ...prev,
            documentCount: refreshed.knowledge.documentCount,
            chunkCount: refreshed.knowledge.chunkCount,
            lastIndexedAt: refreshed.knowledge.lastIndexedAt,
          }));
        }
      } else {
        toast.error(res.error ?? "Failed to index website knowledge.");
      }
    });
  };

  const handleClear = () => {
    if (!confirm("Are you sure you want to clear the entire knowledge base index?")) return;
    startTransition(async () => {
      const res = await clearKnowledgeAction();
      if (res.ok) {
        toast.success("Knowledge index cleared.");
        setData((prev) => ({
          ...prev,
          documentCount: 0,
          chunkCount: 0,
          documents: [],
        }));
      } else {
        toast.error(res.error ?? "Failed to clear knowledge index.");
      }
    });
  };

  const handleTestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    startSearch(async () => {
      const res = await testRetrievalAction(testQuery);
      if (res.ok && res.data) {
        setSearchResults(res.data);
      } else {
        toast.error(!res.ok ? (res.error ?? "Search failed.") : "Search failed.");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Metrics overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Database className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-subtle">Indexed Documents</p>
              <p className="text-2xl font-bold text-fg">{data.documentCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Bot className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-subtle">Vector Chunks</p>
              <p className="text-2xl font-bold text-fg">{data.chunkCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <CheckCircle className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-subtle">AI Provider</p>
              <p className="text-sm font-semibold text-fg capitalize">
                {data.providerName} {data.isProviderConfigured ? "✓ Active" : "⚠ Not Configured"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <RefreshCw className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-subtle">Last Indexed</p>
              <p className="truncate text-xs font-semibold text-fg">
                {data.lastIndexedAt ? new Date(data.lastIndexedAt).toLocaleString() : "Never"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Indexing controls */}
      {canWrite ? (
        <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
          <h2 className="text-lg font-semibold text-fg">Knowledge Indexing Controls</h2>
          <p className="mt-1 text-xs text-muted">
            The crawler extracts content from published services, case studies, team, FAQs, tutorials, and technical docs.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-xs font-medium text-fg cursor-pointer">
              <input
                type="checkbox"
                checked={includeCrawler}
                onChange={(e) => setIncludeCrawler(e.target.checked)}
                className="size-4 rounded-sm border-border text-accent focus:ring-accent"
              />
              Include HTTP web crawler (discover localhost / live links)
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-fg cursor-pointer">
              <input
                type="checkbox"
                checked={forceReindex}
                onChange={(e) => setForceReindex(e.target.checked)}
                className="size-4 rounded-sm border-border text-accent focus:ring-accent"
              />
              Force complete re-indexing (bypass content hash cache)
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReindex}
              disabled={isPending}
              className="pressable inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-xs font-medium text-accent-fg disabled:opacity-50"
            >
              <RefreshCw className={isPending ? "size-4 animate-spin" : "size-4"} />
              {isPending ? "Indexing website…" : "Index Knowledge Base"}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={isPending || data.documentCount === 0}
              className="pressable inline-flex h-10 items-center gap-2 rounded-full border border-danger/20 bg-danger-soft px-4 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Clear Index
            </button>
          </div>
        </div>
      ) : null}

      {/* Retrieval Playground */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-lg font-semibold text-fg">Retrieval Test Playground</h2>
        <p className="mt-1 text-xs text-muted">
          Test queries against the hybrid retrieval pipeline (vector similarity + keyword matching + score fusion).
        </p>

        <form onSubmit={handleTestSearch} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="e.g. What services do you offer? Or: tell me about Hammad"
              className="h-10 w-full rounded-full border border-border bg-bg pl-10 pr-4 text-xs text-fg focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !testQuery.trim()}
            className="pressable inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-5 text-xs font-medium text-accent-fg disabled:opacity-50"
          >
            {isSearching ? "Searching…" : "Test Search"}
          </button>
        </form>

        {searchResults !== null ? (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold text-subtle">
              Retrieved {searchResults.length} context chunks for &ldquo;{testQuery}&rdquo;:
            </p>
            {searchResults.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
                No matching chunks found above relevance threshold.
              </p>
            ) : (
              searchResults.map((res, i) => (
                <div key={i} className="rounded-xl border border-border/80 bg-bg/50 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-fg truncate">{res.chunk.title}</span>
                    <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-[0.6875rem] font-bold text-accent">
                      Score: {(res.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted whitespace-pre-wrap">{res.chunk.content}</p>
                  <div className="flex items-center justify-between text-[0.6875rem] text-subtle pt-1 border-t border-border/40">
                    <span className="truncate">URL: {res.chunk.sourceUrl}</span>
                    <span className="shrink-0">Tokens: {res.chunk.tokenCount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>

      {/* Indexed Documents Table */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg">Indexed Documents ({data.documents.length})</h2>
            <p className="mt-0.5 text-xs text-muted">All documents currently active in the knowledge base.</p>
          </div>
          <input
            type="text"
            value={docFilter}
            onChange={(e) => setDocFilter(e.target.value)}
            placeholder="Filter documents…"
            className="h-9 w-60 rounded-full border border-border bg-bg px-3.5 text-xs text-fg focus:border-accent focus:outline-none"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-subtle">
              <tr>
                <th className="pb-3 font-semibold">Title</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Chunks</th>
                <th className="pb-3 font-semibold">Source Link</th>
                <th className="pb-3 font-semibold">Indexed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    No documents found. Click &ldquo;Index Knowledge Base&rdquo; above to populate.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-bg/40">
                    <td className="py-3 font-medium text-fg max-w-xs truncate">{doc.title}</td>
                    <td className="py-3">
                      <span className="rounded-md bg-fg/[0.06] px-2 py-0.5 text-[0.6875rem] font-semibold text-subtle uppercase">
                        {doc.sourceType}
                      </span>
                    </td>
                    <td className="py-3 tabular-nums">{doc.chunkCount}</td>
                    <td className="py-3 max-w-sm truncate">
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        <span className="truncate">{doc.sourceUrl}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 text-subtle">{new Date(doc.crawledAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
