import { Annotation, StateGraph } from "@langchain/langgraph";
import { assertLiveResearchConfig } from "@/lib/config";
import { nimbleExtract, nimbleSearch } from "@/lib/nimble";
import { synthesizeNewsletter } from "@/lib/llm";
import type { AgentInput, ExtractedPage, NewsletterBrief, SearchResult } from "@/lib/types";

type ResearchTheme = NonNullable<SearchResult["theme"]>;
type PlannedQuery = {
  query: string;
  theme: ResearchTheme;
  timeRange: "day" | "week" | "month";
};

export type AgentProgressEvent =
  | {
      type: "progress";
      phase: "planning" | "searching" | "extracting" | "verifying" | "synthesizing";
      sourceCount: number;
    }
  | {
      type: "complete";
      brief: NewsletterBrief;
      sourceCount: number;
    };

const AgentState = Annotation.Root({
  profile: Annotation<AgentInput["profile"]>(),
  queries: Annotation<PlannedQuery[]>({
    reducer: (_, value) => value,
    default: () => []
  }),
  searchResults: Annotation<SearchResult[]>({
    reducer: (_, value) => value,
    default: () => []
  }),
  extractedPages: Annotation<ExtractedPage[]>({
    reducer: (_, value) => value,
    default: () => []
  }),
  evidence: Annotation<string>({
    reducer: (_, value) => value,
    default: () => ""
  }),
  brief: Annotation<NewsletterBrief | undefined>()
});

async function planQueries(state: typeof AgentState.State) {
  const { profile } = state;
  const productTerms = profile.products.slice(0, 3).join(" ");
  const queries: PlannedQuery[] = [
    {
      query: `${profile.icp} hiring funding expansion new initiative ${productTerms}`,
      theme: "prospect",
      timeRange: "week"
    },
    {
      query: `${profile.targetMarkets} companies hiring partnership funding expansion buyer signal`,
      theme: "prospect",
      timeRange: "week"
    },
    {
      query: `${productTerms} industry product launch regulation funding demand`,
      theme: "industry",
      timeRange: "day"
    },
    {
      query: `${productTerms} AI infrastructure policy investment market news`,
      theme: "industry",
      timeRange: "day"
    },
    ...profile.competitors.slice(0, 5).map((competitor) => ({
      query: `"${competitor}" launch pricing product partnership positioning`,
      theme: "competitor" as const,
      timeRange: "month" as const
    }))
  ];
  return { queries };
}

async function searchWithNimble(state: typeof AgentState.State) {
  const batches = await Promise.all(
    state.queries.map(async ({ query, theme, timeRange }) => {
      const preferredFocus = theme === "prospect" ? "general" : "news";
      const excludeDomains = [
        "facebook.com",
        "instagram.com",
        "perplexity.ai",
        "pinterest.com",
        "tiktok.com",
        "x.com",
        "twitter.com"
      ];
      let results: SearchResult[] = [];
      try {
        results = await nimbleSearch(query, 4, {
          focus: preferredFocus,
          timeRange,
          excludeDomains
        });
      } catch {
        results = [];
      }
      if (results.length === 0 && preferredFocus === "news") {
        try {
          results = await nimbleSearch(query, 4, {
            focus: "general",
            timeRange,
            excludeDomains
          });
        } catch {
          results = [];
        }
      }
      const perQueryLimit = 3;
      return results
        .slice(0, perQueryLimit)
        .map((result) => ({ ...result, theme }));
    })
  );
  const deduped = dedupeByUrl(batches.flat()).filter(isUsableSource).slice(0, 24);
  if (deduped.length === 0) {
    throw new Error(
      "Nimble found no reliable live sources for this company. Try again shortly or broaden the target markets."
    );
  }
  return { searchResults: deduped };
}

async function extractWithNimble(state: typeof AgentState.State) {
  const selectedResults = (["prospect", "industry", "competitor"] as const).flatMap(
    (theme) => state.searchResults.filter((result) => result.theme === theme).slice(0, 4)
  );
  const pages = await Promise.all(
    selectedResults.map(async (result) => {
      try {
        return await nimbleExtract(result.url);
      } catch {
        return {
          url: result.url,
          title: result.title,
          text: result.description
        };
      }
    })
  );
  return { extractedPages: pages };
}

async function assembleEvidence(state: typeof AgentState.State) {
  const evidence = state.searchResults
    .map((result, index) => {
      const page = state.extractedPages.find((item) => item.url === result.url);
      return [
        `SOURCE ${index + 1}`,
        `Title: ${result.title}`,
        `URL: ${result.url}`,
        `Publisher: ${result.publisher ?? "Unknown"}`,
        `Date: ${result.date ?? "Unknown"}`,
        `Research theme: ${result.theme ?? "unknown"}`,
        `Search snippet: ${result.description}`,
        `Extracted content: ${truncate(page?.text ?? "", 1200)}`
      ].join("\n");
    })
    .join("\n\n");

  return { evidence };
}

async function synthesize(state: typeof AgentState.State) {
  const brief = await synthesizeNewsletter({
    profile: state.profile,
    evidence: state.evidence,
    sources: state.searchResults
  });
  return { brief };
}

const workflow = new StateGraph(AgentState)
  .addNode("plan_queries", planQueries)
  .addNode("nimble_search", searchWithNimble)
  .addNode("nimble_extract", extractWithNimble)
  .addNode("assemble_evidence", assembleEvidence)
  .addNode("synthesize_newsletter", synthesize)
  .addEdge("__start__", "plan_queries")
  .addEdge("plan_queries", "nimble_search")
  .addEdge("nimble_search", "nimble_extract")
  .addEdge("nimble_extract", "assemble_evidence")
  .addEdge("assemble_evidence", "synthesize_newsletter")
  .addEdge("synthesize_newsletter", "__end__")
  .compile();

export async function runGtmSignalAgent(input: AgentInput) {
  assertLiveResearchConfig();
  const result = await workflow.invoke(input, {
    configurable: {
      thread_id: `morning-signal-${Date.now()}`
    }
  });

  if (!result.brief) throw new Error("Agent completed without a newsletter brief.");
  return result.brief;
}

export async function* streamGtmSignalAgent(
  input: AgentInput
): AsyncGenerator<AgentProgressEvent> {
  assertLiveResearchConfig();
  let sourceCount = 0;
  yield { type: "progress", phase: "planning", sourceCount };

  const stream = await workflow.stream(input, {
    streamMode: "updates",
    configurable: {
      thread_id: `morning-signal-stream-${Date.now()}`
    }
  });

  for await (const rawUpdate of stream) {
    const update = rawUpdate as Record<
      string,
      {
        searchResults?: SearchResult[];
        extractedPages?: ExtractedPage[];
        brief?: NewsletterBrief;
      }
    >;

    if (update.plan_queries) {
      yield { type: "progress", phase: "searching", sourceCount };
    }

    if (update.nimble_search) {
      sourceCount = update.nimble_search.searchResults?.length ?? sourceCount;
      yield { type: "progress", phase: "extracting", sourceCount };
    }

    if (update.nimble_extract) {
      sourceCount = update.nimble_extract.extractedPages?.length ?? sourceCount;
      yield { type: "progress", phase: "verifying", sourceCount };
    }

    if (update.assemble_evidence) {
      yield { type: "progress", phase: "synthesizing", sourceCount };
    }

    if (update.synthesize_newsletter?.brief) {
      yield {
        type: "complete",
        brief: update.synthesize_newsletter.brief,
        sourceCount
      };
    }
  }
}

function dedupeByUrl(results: SearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.url)) return false;
    seen.add(result.url);
    return true;
  });
}

function isUsableSource(result: SearchResult) {
  try {
    const hostname = new URL(result.url).hostname.replace(/^www\./, "");
    const blocked = [
      "facebook.com",
      "instagram.com",
      "perplexity.ai",
      "pinterest.com",
      "tiktok.com",
      "x.com",
      "twitter.com"
    ];
    return !blocked.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}
