import { chunkDocument } from "./chunker";
import { normalizeText, sha256 } from "./hasher";
import type { KnowledgeChunk, KnowledgeDocument } from "./types";

export function getPrebuiltDocuments(): KnowledgeDocument[] {
  const now = "2026-10-21T00:00:00.000Z";
  const site = "https://ai-with-hammad2.vercel.app";

  const rawDocs: Array<{
    id: string;
    sourceUrl: string;
    title: string;
    description: string;
    section: string;
    lines: string[];
  }> = [
    {
      id: "doc-company-overview",
      sourceUrl: `${site}/`,
      title: "AI With Hammad — Agency Overview & Founders",
      description: "AI engineering, workflow automation, and agentic systems agency founded by Hammadullah and Maaz Ali.",
      section: "company",
      lines: [
        "# AI With Hammad",
        "AI engineering, automation and agentic systems.",
        "We build scoped engagements — from one automated workflow to agent systems that run part of your operations.",
        "",
        "## Founders & Leadership",
        "- **Hammadullah**: Co-founder · AI Engineer & Creative Director. Leads AI architecture, LLM orchestration, and strategic solutions.",
        "- **Maaz Ali**: Co-founder · AI Engineer. Leads workflow automation, production systems, full-stack architecture, and developer integrations.",
        "",
        "## Contact Information & How to Reach Us",
        `- Official Contact Form: ${site}/contact`,
        "- Email: aiwithhammad2026@gmail.com",
        "- Phone: 03377233444",
        `- WhatsApp: https://wa.me/923377233444 (+92 337 7233444)`,
        "- Location: Islamabad, Pakistan",
        `- Client Portal: ${site}/portal/login`,
        `- Sponsorship & Media Kit: ${site}/sponsorship`,
        "",
        "## Core Philosophy",
        "- Honest engineering: 100% of workflows, code, and documentation are handed over to the client.",
        "- Day-to-day project communication is handled directly via WhatsApp with direct founder access and regular updates.",
      ],
    },
    {
      id: "doc-service-workflow-automation",
      sourceUrl: `${site}/services/workflow-automation`,
      title: "Service: n8n Workflow Automation",
      description: "End-to-end workflow design in n8n — from lead capture and CRM syncs to invoicing and reporting.",
      section: "services",
      lines: [
        "# Service: n8n Workflow Automation",
        "End-to-end workflow design in n8n — from lead capture and CRM syncs to invoicing and reporting.",
        "",
        "## Overview",
        "We design, build, and document n8n workflows that eliminate repetitive manual work. Every workflow includes production-grade error handling, retries, and alerting so it can be trusted in production, and can be self-hosted or run on n8n Cloud.",
        "",
        "## Key Features",
        "- **Process mapping**: We document the current business process and identify high-impact automation opportunities.",
        "- **Production-grade workflows**: Robust error handling, retries, idempotency, and alerting built into every automation.",
        "- **Handover & Training**: Thorough documentation and training sessions so your team can comfortably operate and extend the system.",
        "",
        `Official URL: ${site}/services/workflow-automation`,
      ],
    },
    {
      id: "doc-service-api-integrations",
      sourceUrl: `${site}/services/api-integrations`,
      title: "Service: Custom API Integrations",
      description: "Connecting the tools your business already runs on — CRMs, payment platforms, databases and internal systems.",
      section: "services",
      lines: [
        "# Service: Custom API Integrations",
        "Connecting the tools your business already runs on — CRMs, payment platforms, databases and internal systems.",
        "",
        "## Overview",
        "We connect the systems your business already uses into reliable, observable data pipelines. We implement authenticated API clients, webhooks, data mapping, and automated reconciliation with clear handling of failure scenarios.",
        "",
        "## Key Features",
        "- **API clients & webhooks**: Authenticated, rate-limit-aware integrations with automatic retries.",
        "- **Data mapping**: Clear transformations between disparate systems with strict schema validation.",
        "- **Monitoring**: Comprehensive visibility into pipeline health, failures, and daily reconciliation reports.",
        "",
        `Official URL: ${site}/services/api-integrations`,
      ],
    },
    {
      id: "doc-service-agentic-ai-systems",
      sourceUrl: `${site}/services/agentic-ai-systems`,
      title: "Service: Agentic AI Systems",
      description: "AI agents that research, triage, draft and decide — orchestrated to run real business processes.",
      section: "services",
      lines: [
        "# Service: Agentic AI Systems",
        "AI agents that research, triage, draft and decide — orchestrated to run real business processes.",
        "",
        "## Overview",
        "We build LLM-powered agents with well-defined tools, guardrails, evaluation metrics, and human-in-the-loop review. Integrated directly with your existing workflows so they deliver dependable operational results rather than fragile demos.",
        "",
        "## Key Features",
        "- **Tool-using agents**: Autonomous agents equipped with scoped tools, clear database permissions, and verifiable outputs.",
        "- **Evaluation & Testing**: Rigorous evaluation datasets and benchmark metrics to measure agent accuracy before deployment.",
        "- **Human in the loop**: Seamless review and approval checkpoints where decisions carry financial or operational risk.",
        "",
        `Official URL: ${site}/services/agentic-ai-systems`,
      ],
    },
    {
      id: "doc-team-founders",
      sourceUrl: `${site}/team`,
      title: "Team & Leadership: Hammadullah and Maaz Ali",
      description: "Profiles and backgrounds of AI With Hammad co-founders Hammadullah and Maaz Ali.",
      section: "team",
      lines: [
        "# Leadership & Founders of AI With Hammad",
        "AI With Hammad was founded and is led by **Hammadullah** and **Maaz Ali**.",
        "",
        "## Hammadullah — Co-founder · AI Engineer",
        "- **Role**: Co-founder & AI Engineer / Creative Director",
        "- **Profile URL**: [Hammadullah Profile](/team/hammadullah)",
        "- **Expertise**: Agentic AI architecture, LLM orchestration, intelligent workflow automation, and AI content creation.",
        "- **Focus**: Guiding clients through AI roadmap strategy, designing autonomous agent systems, and technical execution.",
        "",
        "## Maaz Ali — Co-founder · AI Engineer",
        "- **Role**: Co-founder & AI Engineer",
        "- **Profile URL**: [Maaz Ali Profile](/team/maaz-ali)",
        "- **Expertise**: Workflow automation, production AI systems, full-stack Next.js/React engineering, database systems, and developer tooling.",
        "- **Focus**: Engineering resilient production pipelines, API integrations, and scalable software platforms.",
        "",
        `Team Page URL: ${site}/team`,
      ],
    },
    {
      id: "doc-faqs",
      sourceUrl: `${site}/#faq`,
      title: "Frequently Asked Questions (FAQ)",
      description: "Frequently asked questions about working with AI With Hammad, pricing, ownership, and workflows.",
      section: "faq",
      lines: [
        "# Frequently Asked Questions (FAQ)",
        "",
        "### Q: How do we start working together?",
        "A: Send us a message through the [Contact Form](/contact) or via WhatsApp. We will reply promptly to schedule a short discovery call about your process, requirements, and goals.",
        "",
        "### Q: Do you only build with n8n?",
        "A: No. We choose the right tools per project — workflow platforms like n8n, custom code in Python and TypeScript, APIs, and modern LLM providers (Mistral, OpenAI, Anthropic, xAI) — based on reliability and what your team can easily operate.",
        "",
        "### Q: Who owns the work?",
        "A: You do. 100% of workflows, source code, scripts, and documentation are handed over to you at the end of the engagement with no vendor lock-in.",
        "",
        "### Q: How do we communicate during a project?",
        "A: Day-to-day communication happens directly on WhatsApp with the team. Clients also receive access to a private client portal to track milestones, message the team, and share feedback.",
        "",
        `Contact URL: ${site}/contact`,
      ],
    },
  ];

  return rawDocs.map((doc) => {
    const body = normalizeText(doc.lines.join("\n"));
    return {
      id: doc.id,
      sourceUrl: doc.sourceUrl,
      canonicalUrl: doc.sourceUrl,
      title: doc.title,
      description: doc.description,
      sourceType: "website",
      contentHash: sha256(body),
      content: body,
      chunkCount: 0,
      metadata: { section: doc.section },
      crawledAt: now,
    };
  });
}

export function getPrebuiltChunks(): KnowledgeChunk[] {
  const docs = getPrebuiltDocuments();
  const allChunks: KnowledgeChunk[] = [];
  for (const doc of docs) {
    const chunks = chunkDocument(doc);
    doc.chunkCount = chunks.length;
    allChunks.push(...chunks);
  }
  return allChunks;
}
