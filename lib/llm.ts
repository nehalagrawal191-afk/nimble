import OpenAI from "openai";
import { isDemoMode, optionalEnv, requiredEnv } from "@/lib/config";
import {
  newsletterBriefSchema,
  type CompanyProfile,
  type CompetitorSignal,
  type NewsletterBrief,
  type Prospect,
  type SearchResult,
  type Signal,
  type Source
} from "@/lib/types";

export async function synthesizeNewsletter(input: {
  profile: CompanyProfile;
  evidence: string;
  sources: SearchResult[];
}): Promise<NewsletterBrief> {
  if (isDemoMode()) return demoBrief(input.profile);

  const currentTimestamp = new Date().toISOString();
  const cleanEvidence = sanitizeEvidence(input.evidence);
  const client = new OpenAI({
    apiKey: requiredEnv("OPENAI_API_KEY"),
    timeout: 120_000,
    maxRetries: 2
  });
  const model = optionalEnv("OPENAI_MODEL") ?? "gpt-4.1-mini";
  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are the editor of Nimble's Takes, a daily GTM intelligence brief for ${input.profile.companyName}. This is an action brief, not a general news digest.

Use only supplied evidence. Cite exact URLs from the matching research theme. Never invent a company, event, date, job posting, URL, or competitor activity. Keep every item specific: name the actor, what changed, and the commercial implication.

TODAY'S TOP PROSPECT
Choose one real potential customer, never ${input.profile.companyName}, one of its listed competitors, or any company selling a substantially similar product. A same-category vendor is not a prospect even if it raised funding or is hiring. The prospect must be an end user or buyer of ${input.profile.companyName}'s product, fit the approved ICP, and show a concrete, recent buying trigger such as a relevant job posting, funding tied to a new initiative, expansion, partnership, procurement signal, regulatory pressure, or product launch. The evidence must support both the trigger and a credible need; funding alone is insufficient. Explain why the trigger creates that need and give one specific outreach move.

INDUSTRY NEWS IN 24 HOURS
Return exactly three distinct developments from industry-themed sources surfaced by Nimble's 24-hour search. Each development must describe a concrete event that materially affects demand, regulation, buying behavior, technology, or distribution for ${input.profile.companyName}. Job listings belong only in prospect research and can never be industry news. Reject evergreen trends, generic blogs, market-size pages, listicles, consultancy promotion, undated reports, and SEO summaries. Each item needs a short "Nimble's Take" advising ${input.profile.companyName} based on its products, ICP, coverage, and target markets.

WHAT COMPETITORS ARE UP TO
Return exactly three distinct, concrete developments involving only these approved competitors: ${input.profile.competitors.join(", ")}. Focus on launches, pricing changes, positioning changes, partnerships, documentation releases, strategic hiring, campaigns, or strategic changes. The named competitor must be the actor in the cited source, not merely a similar word in the page. Reject generic comparison listicles and unchanged product descriptions. Do not substitute an unapproved company.

NIMBLE'S TAKE
Synthesize the competitive pattern across those three items, then explain how ${input.profile.companyName} should respond or differentiate. Nimble is the editorial voice; the advice is for ${input.profile.companyName}.

YOUR MOVES TODAY
Return exactly three prioritized actions that can be started today. Tie them directly to the prospect, industry events, and competitor activity.

Return valid JSON only.`
      },
      {
        role: "user",
        content: `Current timestamp: ${currentTimestamp}

Approved company profile:
${JSON.stringify(input.profile, null, 2)}

Fresh evidence gathered through Nimble:
${cleanEvidence}

Allowed prospect source URLs:
${sourceUrlsForTheme(input.sources, "prospect")}

Allowed 24-hour industry source URLs:
${sourceUrlsForTheme(input.sources, "industry")}

Allowed competitor source URLs:
${sourceUrlsForTheme(input.sources, "competitor")}

Return JSON with this shape:
{
  "id": "slug-or-uuid",
  "companyName": "${input.profile.companyName}",
  "title": "Morning Signal",
  "subtitle": "Your daily shot of market intelligence and action-ready GTM moves.",
  "generatedAt": "human-readable version of ${currentTimestamp}",
  "intro": "1-2 sentence opening naming the most important pattern",
  "topProspect": {
    "companyName": "",
    "trigger": "specific observed buying signal",
    "fit": "why this company matches the ICP and needs ${input.profile.companyName}",
    "whyNow": "",
    "recommendedAction": "",
    "sources": [{ "title": "", "url": "", "publisher": "", "date": "" }]
  },
  "industryNews": [{
    "title": "",
    "summary": "",
    "whyItMatters": "",
    "nimbleTake": "specific advice for ${input.profile.companyName}",
    "sources": [{ "title": "", "url": "", "publisher": "", "date": "" }]
  }],
  "competitorSignals": [{
    "companyName": "exact name from the approved competitors list",
    "title": "",
    "summary": "",
    "whyItMatters": "",
    "sources": [{ "title": "", "url": "", "publisher": "", "date": "" }]
  }],
  "competitorTake": "Nimble's synthesis of the competitive pattern and how ${input.profile.companyName} should differentiate",
  "movesToday": [{ "title": "", "action": "" }]
}

The industryNews, competitorSignals, and movesToday arrays must each contain exactly three items.`
      }
    ]
  });

  const raw = response.choices[0]?.message.content;
  if (!raw) throw new Error("OpenAI returned an empty newsletter response.");
  const parsed = newsletterBriefSchema.parse(JSON.parse(raw));
  return groundBrief(parsed, input.profile, input.sources);
}

function groundBrief(
  brief: NewsletterBrief,
  profile: CompanyProfile,
  searchResults: SearchResult[]
): NewsletterBrief {
  const prospectSources = sourceMap(searchResults, "prospect");
  const industrySources = sourceMap(searchResults, "industry");
  const competitorSources = sourceMap(searchResults, "competitor");
  const topProspect = groundProspect(brief.topProspect, prospectSources);
  const industryNews = brief.industryNews
    .map((signal) => groundSignal(signal, industrySources))
    .filter((signal): signal is Signal => signal !== null);
  const competitorSignals = brief.competitorSignals
    .map((signal) => groundCompetitorSignal(signal, competitorSources, profile))
    .filter((signal): signal is CompetitorSignal => signal !== null);

  if (!topProspect || isExcludedProspect(topProspect.companyName, profile)) {
    throw new Error(
      "Nimble could not verify a qualified, source-backed prospect. No newsletter was published."
    );
  }
  if (industryNews.length !== 3 || competitorSignals.length !== 3) {
    throw new Error(
      `Nimble verified ${industryNews.length}/3 industry updates and ${competitorSignals.length}/3 competitor updates. No newsletter was published with filler.`
    );
  }

  return {
    ...brief,
    companyName: profile.companyName,
    title: "Morning Signal",
    subtitle: "Your daily shot of market intelligence and action-ready GTM moves.",
    generatedAt: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date()),
    topProspect,
    industryNews,
    competitorSignals
  };
}

function groundProspect(
  prospect: Prospect,
  allowedSources: Map<string, SearchResult>
): Prospect | null {
  const sources = groundSources(prospect.sources, allowedSources);
  return sources.length ? { ...prospect, sources } : null;
}

function groundSignal(
  signal: Signal,
  allowedSources: Map<string, SearchResult>
): Signal | null {
  const sources = groundSources(signal.sources, allowedSources);
  return sources.length ? { ...signal, sources } : null;
}

function groundCompetitorSignal(
  signal: CompetitorSignal,
  allowedSources: Map<string, SearchResult>,
  profile: CompanyProfile
): CompetitorSignal | null {
  const approvedName = profile.competitors.find(
    (competitor) => {
      const approved = normalizeName(competitor);
      const reported = normalizeName(signal.companyName);
      return approved === reported || approved.includes(reported) || reported.includes(approved);
    }
  );
  if (!approvedName) return null;
  const sources = groundSources(signal.sources, allowedSources);
  return sources.length
    ? { ...signal, companyName: approvedName, sources }
    : null;
}

function groundSources(
  requestedSources: Source[],
  allowedSources: Map<string, SearchResult>
) {
  const seen = new Set<string>();
  return requestedSources.flatMap((source) => {
    const key = normalizeUrl(source.url);
    const matched = allowedSources.get(key);
    if (!matched || seen.has(key)) return [];
    seen.add(key);
    return [canonicalSource(matched)];
  });
}

function sourceMap(
  results: SearchResult[],
  theme: NonNullable<SearchResult["theme"]>
) {
  return new Map(
    results
      .filter((source) => source.theme === theme)
      .map((source) => [normalizeUrl(source.url), source])
  );
}

function sourceUrlsForTheme(
  sources: SearchResult[],
  theme: NonNullable<SearchResult["theme"]>
) {
  return sources
    .filter((source) => source.theme === theme)
    .map((source) => source.url)
    .join("\n");
}

function isExcludedProspect(name: string, profile: CompanyProfile) {
  const candidate = normalizeName(name);
  return [profile.companyName, ...profile.competitors]
    .map(normalizeName)
    .some((excluded) => candidate === excluded || candidate.includes(excluded));
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function canonicalSource(result: SearchResult): Source {
  return {
    title: result.title,
    url: result.url,
    publisher: result.publisher,
    date: result.date
  };
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.searchParams.sort();
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.replace(/\/$/, "");
  }
}

function sanitizeEvidence(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[\uD800-\uDFFF]/g, "");
}

function demoBrief(profile: CompanyProfile): NewsletterBrief {
  const generatedAt = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
  const competitors = [...profile.competitors, "Tavily", "Exa", "Firecrawl"].slice(0, 3);

  return {
    id: `demo-${Date.now()}`,
    companyName: profile.companyName,
    title: "Morning Signal",
    subtitle: "Your daily shot of market intelligence and action-ready GTM moves.",
    generatedAt,
    intro:
      `Fresh buyer intent and category movement point to one priority: turn live market change into a conversation ${profile.companyName} can start today.`,
    topProspect: {
      companyName: "Acme AI Labs",
      trigger: "The company opened roles for engineers building real-time research agents.",
      fit: `Its team matches ${profile.icp} and needs live, structured web context for production workflows.`,
      whyNow:
        "The hiring signal suggests active budget and implementation planning.",
      recommendedAction:
        `Send the engineering leader a focused demo showing ${profile.companyName} powering the research workflow described in the role.`,
      sources: [
        { title: "Acme AI Labs careers", url: "https://example.com/careers", publisher: "Acme AI Labs", date: "Today" }
      ]
    },
    industryNews: [
      {
        title: "Enterprise AI teams are asking for fresher external context",
        summary:
          "The agent infrastructure conversation is increasingly about keeping models grounded in current external truth, especially for research, sales, and competitive workflows.",
        whyItMatters:
          "Static training data is visibly insufficient for operational GTM decisions that change daily.",
        nimbleTake:
          `Anchor ${profile.companyName}'s developer content around a clear production-agent category claim and prove it with working repos.`,
        sources: [{ title: profile.companyName, url: profile.website, publisher: profile.companyName }]
      },
      {
        title: "Structured outputs are becoming the trust surface",
        summary:
          "Builders do not just want links. They want reliable structured data, citations, confidence, and repeatable flows that can be inspected.",
        whyItMatters:
          "Agent demos are moving from novelty to production evaluation, making observability and output contracts more important.",
        nimbleTake:
          "Ship examples that include schemas, source citations, and LangSmith traces.",
        sources: [{ title: "LangSmith", url: "https://docs.langchain.com/langsmith/observability-quickstart", publisher: "LangChain" }]
      },
      {
        title: "Developer tools are competing on time-to-first-proof",
        summary:
          "The winning onboarding path is no longer an API reference alone. It is a runnable demo that reaches a credible business outcome fast.",
        whyItMatters:
          "AI engineers are overloaded with similar-sounding agent tools and need proof before commitment.",
        nimbleTake:
          `Turn this agent into a reusable GTM intelligence cookbook example for ${profile.companyName}.`,
        sources: [{ title: `${profile.companyName} website`, url: profile.website, publisher: profile.companyName }]
      }
    ],
    competitorSignals: competitors.map((competitor) => ({
      companyName: competitor,
      title: `${competitor} is competing for the agent search narrative`,
      summary: `${competitor} is part of the competitor set buyers will compare when evaluating web search and extraction for AI agents.`,
      whyItMatters:
        "Messaging convergence makes differentiated proof more valuable than broad category language.",
      sources: [{ title: competitor, url: `https://www.google.com/search?q=${encodeURIComponent(competitor)}`, publisher: competitor }]
    })),
    competitorTake:
      `Competitors are converging on broad agent-search language. ${profile.companyName} should differentiate with observable workflows, source quality, and concrete outcomes for ${profile.targetMarkets}.`,
    movesToday: [
      {
        title: "Package this as a flagship DevRel demo",
        action:
          "Turn Morning Signal into a polished repo and talk track that shows why live web data changes agent quality."
      },
      {
        title: "Create a comparison content lane",
        action:
          "Publish careful, technical explainers for AI search APIs, web scraping APIs, and agent data infrastructure."
      },
      {
        title: "Add proof to the onboarding path",
        action:
          "Include traces, source links, schemas, and a demo-mode fallback so developers can understand the pipeline before spending credits."
      }
    ]
  };
}
