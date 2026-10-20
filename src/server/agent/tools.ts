import "server-only";

import { publicEnv } from "@/lib/env";
import { hybridRetrieve } from "@/server/knowledge/retriever";
import type { Citation, SearchResult } from "@/server/knowledge/types";
import { getVectorStore } from "@/server/knowledge/vector-store";

import type { ToolDefinition } from "@/server/ai/types";

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_website_knowledge",
      description: "Search indexed website content, services, case studies, creator content, team, and FAQs.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search keywords or question",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_codebase",
      description: "Search technical architecture, README, schemas, and public codebase documentation.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Technical or architectural question about the platform",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "retrieve_page",
      description: "Retrieve full content of a specific page or section by URL or route slug.",
      parameters: {
        type: "object",
        properties: {
          urlOrSlug: {
            type: "string",
            description: "The route path, slug, or full URL to retrieve (e.g. '/services/ai-engineering' or 'about')",
          },
        },
        required: ["urlOrSlug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "website_navigation",
      description: "Look up navigational routes and page URLs for the website.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic or destination to navigate to (e.g. 'contact', 'services', 'pricing', 'team')",
          },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "knowledge_metadata",
      description: "Check how fresh the website knowledge is, and what sections are indexed.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<{ result: string; citations?: Citation[] }> {
  const store = getVectorStore();
  const site = publicEnv.siteUrl.replace(/\/$/, "");

  switch (toolName) {
    case "search_website_knowledge": {
      const query = String(args.query ?? "");
      const results: SearchResult[] = await hybridRetrieve(query, {
        topK: 4,
        sourceType: "website",
      });

      if (results.length === 0) {
        return { result: "No specific website knowledge found for this query." };
      }

      const citations: Citation[] = [];
      const textBlocks = results.map((r, i) => {
        citations.push({
          title: r.chunk.title,
          url: r.chunk.sourceUrl,
          snippet: r.chunk.content.slice(0, 160),
          chunkId: r.chunk.id,
        });
        return `[Source ${i + 1}: ${r.chunk.title} (${r.chunk.sourceUrl})]\n${r.chunk.content}`;
      });

      return {
        result: textBlocks.join("\n\n---\n\n"),
        citations,
      };
    }

    case "search_codebase": {
      const query = String(args.query ?? "");
      const results = await hybridRetrieve(query, {
        topK: 3,
        sourceType: "code",
      });

      if (results.length === 0) {
        return { result: "No codebase documentation found for this query." };
      }

      const citations: Citation[] = [];
      const textBlocks = results.map((r, i) => {
        citations.push({
          title: r.chunk.title,
          url: r.chunk.sourceUrl,
          snippet: r.chunk.content.slice(0, 160),
          chunkId: r.chunk.id,
        });
        return `[Code Doc ${i + 1}: ${r.chunk.title}]\n${r.chunk.content}`;
      });

      return {
        result: textBlocks.join("\n\n---\n\n"),
        citations,
      };
    }

    case "retrieve_page": {
      const target = String(args.urlOrSlug ?? "").trim();
      const docs = await store.getDocuments();
      const match = docs.find(
        (d) =>
          d.sourceUrl === target ||
          d.canonicalUrl === target ||
          d.sourceUrl.endsWith(`/${target}`) ||
          d.id.includes(target),
      );

      if (!match) {
        return { result: `Page or document "${target}" was not found in indexed knowledge.` };
      }

      return {
        result: `# ${match.title}\nSource: ${match.sourceUrl}\n\n${match.content.slice(0, 2500)}`,
        citations: [
          {
            title: match.title,
            url: match.sourceUrl,
            snippet: match.description || match.content.slice(0, 150),
          },
        ],
      };
    }

    case "website_navigation": {
      const topic = String(args.topic ?? "").toLowerCase();
      const routes: Record<string, { title: string; url: string; description: string }> = {
        home: { title: "Home", url: `${site}/`, description: "Agency homepage, featured work, and overview" },
        services: { title: "Services", url: `${site}/services`, description: "All AI engineering and automation services" },
        projects: { title: "Projects & Case Studies", url: `${site}/projects`, description: "Client case studies and demonstrations" },
        content: { title: "Tutorials & Creator Content", url: `${site}/content`, description: "AI tutorials, videos, and guides" },
        team: { title: "Team", url: `${site}/team`, description: "Meet the founders and engineering leadership" },
        sponsorship: { title: "Sponsorship & Media Kit", url: `${site}/sponsorship`, description: "Brand partnerships and creator sponsorships" },
        contact: { title: "Contact Form", url: `${site}/contact`, description: "Inquiry and project booking form" },
        links: { title: "Bio Links", url: `${site}/links`, description: "Social handles and important links" },
        sitemap: { title: "HTML Sitemap", url: `${site}/sitemap`, description: "Visual directory of all public pages" },
      };

      const found = Object.entries(routes).find(([k]) => topic.includes(k) || k.includes(topic));
      if (found) {
        return {
          result: `Page: ${found[1].title}\nURL: ${found[1].url}\nDescription: ${found[1].description}`,
          citations: [{ title: found[1].title, url: found[1].url }],
        };
      }

      return {
        result: `Available primary routes on the website:\n${Object.values(routes)
          .map((r) => `- [${r.title}](${r.url}): ${r.description}`)
          .join("\n")}`,
      };
    }

    case "knowledge_metadata": {
      const status = await store.getStatus();
      return {
        result: `Knowledge Base Status:\n- Total Documents: ${status.documentCount}\n- Total Chunks: ${status.chunkCount}\n- Last Indexed: ${status.lastIndexedAt ?? "Not yet indexed"}`,
      };
    }

    default:
      return { result: `Unknown tool: ${toolName}` };
  }
}
