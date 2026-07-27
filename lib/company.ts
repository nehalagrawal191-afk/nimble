import OpenAI from "openai";
import { isDemoMode, optionalEnv, requiredEnv } from "@/lib/config";
import { nimbleExtract, nimbleSearch } from "@/lib/nimble";
import { companyProfileSchema, type CompanyProfile } from "@/lib/types";

export async function discoverCompanyProfile(website: string): Promise<CompanyProfile> {
  const normalizedWebsite = normalizeWebsite(website);
  if (isDemoMode()) return demoCompanyProfile(normalizedWebsite);

  const host = new URL(normalizedWebsite).hostname.replace(/^www\./, "");
  const [homepage, searchResults] = await Promise.all([
    nimbleExtract(normalizedWebsite),
    nimbleSearch(`${host} company products competitors markets coverage`, 6)
  ]);

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
        content:
          "You are a careful company research analyst. Build a concise company profile from supplied evidence. Separate products from capabilities, infer competitors conservatively, and make ICP and target market suggestions editable. Return JSON only."
      },
      {
        role: "user",
        content: `Company website: ${normalizedWebsite}

Evidence gathered through Nimble:
${evidence}

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
  return companyProfileSchema.parse(JSON.parse(raw));
}

export function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (!parsed.hostname.includes(".")) throw new Error("Enter a valid company website.");
  return `${parsed.protocol}//${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`;
}

function demoCompanyProfile(website: string): CompanyProfile {
  const host = new URL(website).hostname.replace(/^www\./, "");
  const isNimble = host.includes("nimbleway");

  if (!isNimble) {
    const companyName = host.split(".")[0].replace(/(^\w|-\w)/g, (value) =>
      value.replace("-", " ").toUpperCase()
    );
    return {
      website,
      companyName,
      overview: `${companyName} is the company associated with ${host}. This demo profile is ready for review before research begins.`,
      products: ["Primary platform", "Developer API"],
      competitors: ["Competitor One", "Competitor Two", "Competitor Three"],
      coverage: "Global digital market coverage",
      icp: "Mid-market and enterprise technology teams evaluating developer infrastructure",
      targetMarkets: "North America and Europe; AI-native and developer-tool companies"
    };
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
