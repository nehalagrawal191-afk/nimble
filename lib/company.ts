import OpenAI from "openai";
import {
  assertLiveResearchConfig,
  isDemoMode,
  optionalEnv,
  requiredEnv
} from "@/lib/config";
import { nimbleExtract, nimbleSearch } from "@/lib/nimble";
import { companyProfileSchema, type CompanyProfile } from "@/lib/types";

export async function discoverCompanyProfile(website: string): Promise<CompanyProfile> {
  const normalizedWebsite = normalizeWebsite(website);
  if (isDemoMode()) return demoCompanyProfile(normalizedWebsite);
  assertLiveResearchConfig();

  const host = new URL(normalizedWebsite).hostname.replace(/^www\./, "");
  const excludedDomains = [
    "facebook.com",
    "instagram.com",
    "pinterest.com",
    "tiktok.com",
    "x.com",
    "twitter.com"
  ];
  const [homepage, productResults, alternativeResults, comparisonResults] =
    await Promise.all([
      nimbleExtract(normalizedWebsite),
      nimbleSearch(`${host} products platform customers use cases markets`, 5, {
        focus: "general",
        excludeDomains: excludedDomains
      }),
      nimbleSearch(`${host} competitors alternatives similar products`, 5, {
        focus: "general",
        excludeDomains: excludedDomains
      }),
      nimbleSearch(`${host} versus comparison reviews`, 5, {
        focus: "general",
        excludeDomains: excludedDomains
      })
    ]);
  const searchResults = dedupeByUrl([
    ...productResults,
    ...alternativeResults,
    ...comparisonResults
  ]).slice(0, 12);

  const evidence = [
    `WEBSITE\n${homepage.title}\n${homepage.text.slice(0, 6000)}`,
    ...searchResults.map(
      (result, index) =>
        `SEARCH RESULT ${index + 1}\n${result.title}\n${result.url}\n${result.description}`
    )
  ].join("\n\n");

  const client = new OpenAI({ apiKey: requiredEnv("OPENAI_API_KEY") });
  const response = await client.chat.completions.create({
    model: optionalEnv("OPENAI_MODEL") ?? "gpt-4.1-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a senior competitive intelligence analyst. Build a concise company profile using only the supplied evidence.

For competitors, first determine the company's primary product category, core job-to-be-done, economic buyer, user, and typical buying motion. A company qualifies as a direct competitor only when it:
1. serves substantially the same buyer or user,
2. solves the same primary job-to-be-done,
3. offers a product that could realistically replace the analyzed company in a buying decision, and
4. would plausibly compete for the same budget.

Rank 3-7 direct competitors from strongest to weakest product and buying overlap. Prefer competitors explicitly named in comparison or alternatives evidence. You may include a strongly supported competitor inferred from clearly overlapping product evidence, but never from brand familiarity alone.

Exclude customers, partners, integrations, data sources, parent companies, consultancies, broad cloud providers, generic horizontal tools, and adjacent vendors that solve only one small part of the workflow. Do not include the analyzed company itself. Do not mix adjacent or aspirational competitors into the list. If evidence is limited, return fewer high-confidence names instead of filling the list.

Separate actual products from capabilities. Keep the overview factual. Make ICP and target-market suggestions concrete but editable. Return JSON only.`
      },
      {
        role: "user",
        content: `Company website: ${normalizedWebsite}

Evidence gathered through Nimble:
${evidence}

Before returning JSON, silently apply this competitor test to every candidate:
- Same category?
- Same core use case?
- Same buyer/user?
- Substitutable in a shortlist?
- Supported by the supplied evidence?

Include a candidate only when at least four answers are yes, including "substitutable in a shortlist" and "supported by the supplied evidence." Return official company or product names only, with no explanations inside the competitors array. Order the closest substitutes first.

Return:
{
  "website": "${normalizedWebsite}",
  "companyName": "",
  "overview": "",
  "products": ["", ""],
  "competitors": ["", ""],
  "coverage": "",
  "icp": "",
  "targetMarkets": ""
}`
      }
    ]
  });

  const raw = response.choices[0]?.message.content;
  if (!raw) throw new Error("Company discovery returned an empty response.");
  return companyProfileSchema.parse({
    ...JSON.parse(raw),
    website: normalizedWebsite
  });
}

function dedupeByUrl<T extends { url: string }>(results: T[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.url)) return false;
    seen.add(result.url);
    return true;
  });
}

export function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Enter an HTTP or HTTPS company website.");
  }
  if (!parsed.hostname.includes(".")) throw new Error("Enter a valid company website.");
  if (
    parsed.username ||
    parsed.password ||
    isPrivateHostname(parsed.hostname)
  ) {
    throw new Error("Enter a public company website.");
  }
  return `${parsed.protocol}//${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`;
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (
    normalized === "localhost" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    return true;
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized)) return true;
  return normalized === "::1" || normalized.startsWith("[");
}

function demoCompanyProfile(website: string): CompanyProfile {
  const host = new URL(website).hostname.replace(/^www\./, "");
  const isNimble = host.includes("nimbleway");

  if (!isNimble) {
    throw new Error(
      "Demo mode includes the Nimble fixture only. Set DEMO_MODE=false and configure NIMBLE_API_KEY and OPENAI_API_KEY to research another company."
    );
  }

  return {
    website,
    companyName: "Nimble",
    overview:
      "Nimble provides a live web data layer for AI applications and agents, helping developers search, access, and transform public web information into structured outputs.",
    products: ["Web Search API", "Web Extract API", "Browser and scraping infrastructure"],
    competitors: ["Tavily", "Exa", "Bright Data", "Oxylabs", "Zyte", "Apify", "Firecrawl"],
    coverage:
      "Global public web coverage with search, extraction, and proxy infrastructure for dynamic websites.",
    icp:
      "AI-native startups and enterprise AI teams building production agents, research systems, RAG pipelines, and data-intensive automations.",
    targetMarkets:
      "North America and Europe; AI infrastructure, developer tools, sales intelligence, ecommerce, and market research."
  };
}
