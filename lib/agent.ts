import { Annotation, StateGraph } from "@langchain/langgraph";
import { nimbleExtract, nimbleSearch } from "@/lib/nimble";
import { synthesizeNewsletter } from "@/lib/llm";
import type { AgentInput, ExtractedPage, NewsletterBrief, SearchResult } from "@/lib/types";

const AgentState = Annotation.Root({
  prompt: Annotation<string>(),
  competitors: Annotation<string[]>(),
  queries: Annotation<string[]>({
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
  const competitorTerms = state.competitors.slice(0, 8);
  const queries = [
    "AI search API production agents web data latest",
    "web scraping API AI agents structured extraction latest",
    "Nimbleway competitors AI web search agent infrastructure",
    ...competitorTerms.map((competitor) => `${competitor} AI search API agents extraction latest`)
  ];
  return { queries };
}

async function searchWithNimble(state: typeof AgentState.State) {
  const batches = await Promise.all(state.queries.map((query) => nimbleSearch(query, 4)));
  const deduped = dedupeByUrl(batches.flat()).slice(0, 12);
  return { searchResults: deduped };
}

async function extractWithNimble(state: typeof AgentState.State) {
  const pages = await Promise.all(
    state.searchResults.slice(0, 7).map(async (result) => {
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
        `Search snippet: ${result.description}`,
        `Extracted content: ${truncate(page?.text ?? "", 1200)}`
      ].join("\n");
    })
    .join("\n\n");

  return { evidence };
}

async function synthesize(state: typeof AgentState.State) {
  const brief = await synthesizeNewsletter({
    prompt: state.prompt,
    competitors: state.competitors,
    evidence: state.evidence
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
  const result = await workflow.invoke(input, {
    configurable: {
      thread_id: `morning-signal-${Date.now()}`
    }
  });

  if (!result.brief) throw new Error("Agent completed without a newsletter brief.");
  return result.brief;
}

function dedupeByUrl(results: SearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.url)) return false;
    seen.add(result.url);
    return true;
  });
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}
