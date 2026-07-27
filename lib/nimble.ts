import { isDemoMode, requiredEnv } from "@/lib/config";
import type { ExtractedPage, SearchResult } from "@/lib/types";

const NIMBLE_BASE_URL = "https://sdk.nimbleway.com/v2";

type NimbleSearchResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }>;
};

type NimbleExtractResponse = {
  title?: string;
  text?: string;
  markdown?: string;
  html?: string;
  content?: string;
  data?: {
    title?: string;
    text?: string;
    markdown?: string;
    content?: string;
  };
};

export async function nimbleSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  if (isDemoMode()) return demoSearch(query, maxResults);

  const response = await fetch(`${NIMBLE_BASE_URL}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredEnv("NIMBLE_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      max_results: maxResults
    })
  });

  if (!response.ok) {
    throw new Error(`Nimble Search failed (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as NimbleSearchResponse;
  return (payload.results ?? [])
    .filter((item) => item.url)
    .map((item) => ({
      title: item.title ?? item.url ?? "Untitled source",
      url: item.url ?? "",
      description: item.description ?? "",
      publisher: stringFromMetadata(item.metadata, "publisher"),
      date: stringFromMetadata(item.metadata, "date")
    }));
}

export async function nimbleExtract(url: string): Promise<ExtractedPage> {
  if (isDemoMode()) return demoExtract(url);

  const response = await fetch(`${NIMBLE_BASE_URL}/extract`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredEnv("NIMBLE_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url,
      render: true
    })
  });

  if (!response.ok) {
    throw new Error(`Nimble Extract failed (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as NimbleExtractResponse;
  const data = payload.data ?? {};
  return {
    url,
    title: payload.title ?? data.title ?? url,
    text:
      payload.markdown ??
      payload.text ??
      payload.content ??
      data.markdown ??
      data.text ??
      data.content ??
      ""
  };
}

function stringFromMetadata(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function demoSearch(query: string, maxResults: number): SearchResult[] {
  const catalog: SearchResult[] = [
    {
      title: "Tavily launches agentic search workflows for AI apps",
      url: "https://www.tavily.com/",
      description:
        "Tavily emphasizes search, extraction, crawl, and map primitives for production AI agent workflows.",
      publisher: "Tavily",
      date: "Today"
    },
    {
      title: "Exa positions Deep Search for AI research agents",
      url: "https://exa.ai/",
      description:
        "Exa frames neural search and deep research as infrastructure for agents that need high quality web context.",
      publisher: "Exa",
      date: "Today"
    },
    {
      title: "Bright Data expands AI-ready web data products",
      url: "https://brightdata.com/",
      description:
        "Bright Data continues to package large-scale web data collection for enterprise AI and analytics teams.",
      publisher: "Bright Data",
      date: "This week"
    },
    {
      title: "Firecrawl highlights markdown extraction for LLM workflows",
      url: "https://www.firecrawl.dev/",
      description:
        "Firecrawl messaging centers on turning websites into LLM-ready markdown and structured outputs.",
      publisher: "Firecrawl",
      date: "This week"
    },
    {
      title: "Apify showcases actor marketplace for scraping automation",
      url: "https://apify.com/",
      description:
        "Apify leans into reusable scraping actors and marketplace distribution for developer automation.",
      publisher: "Apify",
      date: "This week"
    }
  ];

  const lower = query.toLowerCase();
  const relevant = catalog.filter((item) => lower.includes(item.publisher?.toLowerCase() ?? ""));
  return (relevant.length ? relevant : catalog).slice(0, maxResults);
}

function demoExtract(url: string): ExtractedPage {
  const host = new URL(url).hostname.replace("www.", "");
  return {
    url,
    title: `Demo extraction from ${host}`,
    text: `${host} is positioning around AI agents, structured web context, and developer-friendly search/extraction workflows. The page emphasizes speed, freshness, integrations, and production readiness. For Nimble's GTM team, this creates an opportunity to publish concrete proof that Nimble can move from discovery to extraction to action-ready GTM recommendations in one workflow.`
  };
}
