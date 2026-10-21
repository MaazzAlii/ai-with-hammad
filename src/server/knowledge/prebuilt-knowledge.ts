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
      description: "AI engineering, web development, workflow automation, and agentic systems agency founded by Hammadullah and Maaz Ali.",
      section: "company",
      lines: [
        "# AI With Hammad",
        "AI engineering, web development, workflow automation, and agentic systems studio.",
        "We build scoped engagements — from modern websites and portfolio design to automated workflows and autonomous AI agents.",
        "",
        "## Founders & Leadership",
        "- **Hammadullah**: Co-founder · AI Engineer & Creative Director. Leads AI architecture, LLM orchestration, and strategic AI solutions.",
        "- **Maaz Ali**: Co-founder · AI Engineer. Leads workflow automation, production systems, full-stack Next.js/React architecture, and developer integrations.",
        "",
        "## What We Build & Services Offered",
        "- **Website & Portfolio Development**: Modern, high-performance websites for businesses and individuals, portfolio sites, landing pages (without backend) and full-stack web applications (with backend, databases, CMS), complete with embedded AI chatbots.",
        "- **n8n Workflow Automation**: Lead capture, CRM syncs, invoicing, reporting, and alerting.",
        "- **GoHighLevel (GHL) Automation**: CRM setup, automated appointment booking, SMS/email nurture funnels, pipeline automations.",
        "- **Custom API Integrations**: Connecting CRMs, payment gateways, databases, and internal systems.",
        "- **Agentic AI Systems**: LLM-powered autonomous agents with scoped tools and human-in-the-loop review.",
        "",
        "## Flexible Pricing & Student-Friendly Budgets",
        "- We work with clients of all sizes and budgets, from students and aspiring founders to scaling businesses.",
        "- We never turn anyone away for budget reasons: clients are warmly encouraged to share their project vision and budget so we can design a suitable, high-value solution.",
        "",
        "## Contact Information & Official Links",
        `- Official Contact Form: ${site}/contact`,
        "- Email: aiwithhammad2026@gmail.com",
        "- Phone: 03377233444",
        `- WhatsApp: https://wa.me/923377233444 (+92 337 7233444)`,
        "- Location: Islamabad, Pakistan",
        `- Client Portal: ${site}/portal/login`,
        `- Sponsorship & Media Kit: ${site}/sponsorship`,
      ],
    },
    {
      id: "doc-service-web-development",
      sourceUrl: `${site}/services`,
      title: "Service: Website Development, Redesign & Optimization",
      description: "Full-stack website development, portfolio design, redesigns, speed optimization, business landing pages with or without backend, and embedded AI chatbots.",
      section: "services",
      lines: [
        "# Service: Website Development, Redesign & Optimization",
        "We design, build, revamp, and optimize modern, high-converting websites and digital experiences tailored to businesses, professionals, creators, and students.",
        "",
        "## Capabilities",
        "- **Portfolio Websites**: Sleek, personal-brand portfolios for developers, designers, engineers, creators, and students to showcase projects and attract opportunities.",
        "- **Business & Agency Websites**: Professional web presence with modern typography, glassmorphism aesthetics, responsive layouts, and lightning-fast performance.",
        "- **Static / Without Backend**: Clean, lightweight landing pages and marketing sites without database overhead.",
        "- **Full-Stack / With Backend**: Scalable web apps with custom backends, databases (PostgreSQL, Supabase), authentication, CMS admin panels, and payment integrations.",
        "- **Website Redesign & Revamp**: Complete aesthetic makeovers for outdated websites — transforming them into modern, clean, mobile-responsive, and engaging user experiences.",
        "- **Speed & Performance Optimization**: Core Web Vitals optimization, asset compression, code splitting, and database query tuning for lightning-fast loading speeds.",
        "- **Integrated AI Chatbots**: We integrate custom-trained, smart AI assistant chatbots (just like this one!) directly into your website so your visitors get instant 24/7 answers from your business knowledge.",
        "- **100% In-House Engineering**: All websites, backends, and AI systems are engineered in-house by our co-founders (Hammadullah and Maaz Ali). We never outsource to freelance marketplaces like Fiverr or Upwork — you work directly with our engineering team.",
        "",
        "## Budgets & Student Accommodation",
        "- Whether you are a student on a tight budget or a growing business, we accommodate your needs. Message us on WhatsApp or through our contact form with your budget!",
        "",
        `Official Contact: ${site}/contact`,
      ],
    },
    {
      id: "doc-service-ghl-automation",
      sourceUrl: `${site}/services`,
      title: "Service: GoHighLevel (GHL) & AI Automation",
      description: "GoHighLevel CRM setup, appointment scheduling funnels, SMS/email marketing automations, and custom webhook workflows.",
      section: "services",
      lines: [
        "# Service: GoHighLevel (GHL) & AI Automation",
        "Comprehensive GoHighLevel (GHL) automation and setup for marketing agencies, local businesses, and online services.",
        "",
        "## Capabilities",
        "- **Full GHL CRM Setup**: Pipeline configurations, custom fields, contact management, and calendar booking systems.",
        "- **Automated Funnels & Follow-ups**: Automated SMS and email sequences for lead nurturing, appointment reminders, and review requests.",
        "- **AI Integration with GHL**: Connecting AI agents and n8n workflows directly into GHL via webhooks and APIs to automatically triage leads, draft messages, and update customer statuses.",
        "",
        `Official Contact: ${site}/contact`,
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
        "### Q: Do you build websites and portfolios?",
        "A: Yes! We build full custom websites, personal portfolios, landing pages without backend, and full-stack web applications with backend and database. We also integrate custom AI chatbots like this one directly into your website.",
        "",
        "### Q: Do you support GoHighLevel (GHL) and n8n automations?",
        "A: Yes, we provide end-to-end n8n workflow automations and GoHighLevel CRM setup, automated appointment booking funnels, and SMS/email workflows.",
        "",
        "### Q: What if I am a student or have a limited budget?",
        "A: We warmly welcome students, early-stage founders, and clients with custom budgets. Share your requirements and budget with us, and we will tailor a solution that fits your situation.",
        "",
        "### Q: How do we start working together?",
        "A: Send us a message through the [Contact Form](/contact) or via WhatsApp (+92 337 7233444). We will reply promptly to schedule a discovery call about your project goals.",
        "",
        "### Q: Who owns the work?",
        "A: You do. 100% of workflows, source code, scripts, and documentation are handed over to you at the end of the engagement with no vendor lock-in.",
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
