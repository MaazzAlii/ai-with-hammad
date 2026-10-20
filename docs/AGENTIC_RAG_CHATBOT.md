# Production-Grade Agentic RAG Chatbot for AI With Hamad

This document outlines the architecture, setup, configuration, and verification of the production-grade Agentic Retrieval-Augmented Generation (RAG) chatbot integrated into the AI With Hamad platform.

---

## 1. Architecture Overview

The system architecture follows a production-grade multi-stage pipeline:

```
[User Message / Voice]
         │
         ▼
[Conversational Query Rewriter] ─── (Resolves pronouns & multi-turn entity context)
         │
         ▼
[Agent / Tool Router]
         ├─────────────────────────────┬─────────────────────────────┐
         ▼                             ▼                             ▼
[Hybrid Knowledge Retriever]   [Page Extractor]             [Website Navigator]
 (Vector + Lexical Search)      (Full Route Context)         (Direct Page URLs)
         │
         ▼
[Relevance Filter & Reranker] ── (Filters candidates below threshold, deduplicates)
         │
         ▼
[Strict Grounding Prompt Assembly] ── (Treats knowledge as untrusted evidence)
         │
         ▼
[AI Provider Abstraction]
 ├── Primary: Mistral AI (mistral-large-latest, mistral-embed)
 └── Fallback: xAI / Grok (grok-2-latest, automatic failover on 429/503/timeout)
         │
         ▼
[Server-Sent Stream / Text Stream]
 (Emits text deltas + x-citations metadata header)
         │
         ▼
[Native "Liquid Glass" Chat UI]
 (Markdown rendering, citation pills, lead form integration, dark/light sync)
```

---

## 2. Detected Stack

- **Framework**: Next.js 16 (App Router, Turbopack, `proxy.ts`, Server Components + React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4, custom "Liquid Glass" design system tokens
- **Components**: Radix UI primitives, Lucide React icons
- **Database & Storage**: PostgreSQL / Supabase, Drizzle ORM
- **Testing**: Vitest (unit & DB projects), Playwright (E2E)

---

## 3. Environment Variables

Configure the following variables in `.env.local` (or production environment settings):

```bash
# ---------------------------------------------------------------------------
# AI Providers (Mistral Large primary + xAI Grok fallback)
# ---------------------------------------------------------------------------
# Primary Provider: Mistral AI (https://console.mistral.ai)
MISTRAL_API_KEY=your_mistral_api_key_here
# Chat model: defaults to mistral-large-latest
MISTRAL_CHAT_MODEL=mistral-large-latest
# Embedding model: defaults to mistral-embed
MISTRAL_EMBEDDING_MODEL=mistral-embed

# Fallback Provider: xAI / Grok (https://console.x.ai)
XAI_API_KEY=your_xai_api_key_here
# Grok model: defaults to grok-2-latest
XAI_CHAT_MODEL=grok-2-latest

# Provider Selection & Failover Strategy
AI_PROVIDER=mistral
AI_FALLBACK_PROVIDER=xai
AI_PROVIDER_PRIORITY=mistral,xai

# ---------------------------------------------------------------------------
# RAG Knowledge Ingestion & Retrieval Configuration
# ---------------------------------------------------------------------------
# Source URL to index (defaults to NEXT_PUBLIC_SITE_URL or http://localhost:3000)
KNOWLEDGE_SOURCE_URL=http://localhost:3000

# Vector store: "auto", "pgvector", "file", or "memory"
VECTOR_DB_TYPE=auto

# Maximum top chunks retrieved for context window (default: 4)
RAG_TOP_K=4

# Minimum relevance score threshold (0.0 to 1.0, default: 0.35)
RAG_RELEVANCE_THRESHOLD=0.35

# Visitor rate limit (requests per 10 minutes, default: 20)
CHAT_RATE_LIMIT=20
```

---

## 4. Ingestion & Indexing Pipeline

Knowledge ingestion extracts facts directly from three primary sources:

1. **Published CMS Content**:
   - Agency Overview & Contact information (`src/server/dal/public/site.ts`)
   - Services with technical architectures, process notes, and key features (`src/server/dal/public/services.ts`)
   - Case Studies and projects with categories, summaries, and tech tags (`src/server/dal/public/projects.ts`)
   - Team Leadership profiles, bios, and skills (`src/server/dal/public/team.ts`)
   - Creator Content & Tutorials with full tutorial notes (`src/server/dal/public/content.ts`)
   - Frequently Asked Questions (`src/server/dal/public/testimonials.ts`)
2. **Codebase Architecture & Docs**:
   - `README.md`, `CLAUDE.md`, and technical architectural files in `docs/`
3. **Optional HTTP Web Crawler**:
   - Crawls target URLs with SSRF protection, discovering internal pages, headings, and metadata.

### Incremental Indexing:
- Every document is hashed with SHA-256 (`contentHash`).
- If content has not changed, re-chunking and re-embedding are completely skipped, avoiding unnecessary API calls and compute.

---

## 5. How to Index & Manage Knowledge

### Via Admin UI:
1. Log in to the Admin Panel as staff (`/admin`).
2. Navigate to **Site → AI Knowledge** (`/admin/knowledge`).
3. View current metrics: Indexed Documents, Vector Chunks, Active AI Provider, Last Indexed date.
4. Click **"Index Knowledge Base"** to trigger ingestion, or **"Clear Index"** to reset.
5. Use the **Retrieval Test Playground** to test queries and inspect match scores in real time.

### Via API:
- `GET /api/knowledge/index`: Returns current knowledge base status, document count, and job status.
- `POST /api/knowledge/index`: Triggers re-indexing (`{ "includeCrawler": false, "forceReindex": false }`).
- `DELETE /api/knowledge/index`: Clears the knowledge base index.

---

## 6. Hybrid Retrieval & Relevance Scoring

The hybrid retriever (`src/server/knowledge/retriever.ts`) combines:
1. **Semantic Vector Search**: Generates query embeddings with `mistral-embed` and computes cosine similarity against stored chunk embeddings.
2. **Lexical Keyword Search**: Tokenizes queries, filters stop words, and scores term frequencies across chunk titles (3x boost), headings (2x boost), and content.
3. **Score Fusion**: `combinedScore = (0.7 * semanticScore) + (0.3 * lexicalScore)` (or pure semantic/lexical if either is unavailable).
4. **Relevance Thresholding**: Chunks below `RAG_RELEVANCE_THRESHOLD` (default 0.35) are filtered out, preventing hallucinations from irrelevant context.

---

## 7. Agentic Behavior & Tools

The agent (`src/server/agent/agent.ts`) executes dynamic tools when answering complex questions:
- `search_website_knowledge`: Searches indexed services, projects, team, and FAQs.
- `search_codebase`: Searches architecture, technical documentation, and schemas.
- `retrieve_page`: Retrieves full route content by URL or slug.
- `website_navigation`: Looks up exact site URLs and navigation targets.
- `knowledge_metadata`: Inspects knowledge freshness and indexed sections.

### Strict Grounding & Honesty:
- Never invents prices, clients, statistics, or capabilities.
- When evidence is insufficient, explicitly states the website does not provide that information and suggests contacting the team.
- Appends `[[LEAD_FORM]]` when a user wants to hire the studio or request a quote, launching the interactive inquiry form.

---

## 8. Security & Guardrails

- **SSRF Protection (`src/server/knowledge/ssrf.ts`)**:
  - Blocks private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - Blocks cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
  - Restricts protocols to HTTP/HTTPS.
- **Prompt Injection Defense**:
  - Retrieved documents and user inputs are strictly classified as untrusted data.
  - Instructions inside retrieved documents are never executed.
  - Secrets and system prompts are never revealed.
- **Rate Limiting**:
  - IP-based rate limiting on `/api/assistant` protects against burst and daily abuse.
- **Credential Safety**:
  - API keys are server-only and never bundled into client code.

---

## 9. Testing & Quality Checks

Run the test suite:

```bash
# Run all unit tests (including RAG tests)
npm run test:unit

# Type check
npm run typecheck

# Lint
npm run lint

# Production build check
npm run build
```
