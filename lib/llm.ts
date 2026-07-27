import OpenAI from "openai";
import { isDemoMode, optionalEnv, requiredEnv } from "@/lib/config";
import {
  newsletterBriefSchema,
  type CompanyProfile,
  type NewsletterBrief
} from "@/lib/types";

export async function synthesizeNewsletter(input: {
  profile: CompanyProfile;
  evidence: string;
}): Promise<NewsletterBrief> {
  if (isDemoMode()) return demoBrief(input.profile);

  const client = new OpenAI({ apiKey: requiredEnv("OPENAI_API_KEY") });
  const model = optionalEnv("OPENAI_MODEL") ?? "gpt-4.1-mini";
  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a senior GTM intelligence analyst for ${input.profile.companyName}. Produce concise, evidence-grounded, action-ready Morning Signal newsletters. Prioritize findings by the approved ICP and target markets. Use only supplied evidence for factual claims. Return valid JSON matching the requested schema.`
      },
      {
        role: "user",
        content: `Approved company profile:
${JSON.stringify(input.profile, null, 2)}

Fresh evidence gathered through Nimble:
${input.evidence}

Return JSON with this shape:
{
  "id": "slug-or-uuid",
  "companyName": "${input.profile.companyName}",
  "title": "Morning Signal",
  "subtitle": "Your daily shot of market intelligence and action-ready GTM moves.",
  "generatedAt": "human-readable current date/time",
  "intro": "2-3 sentence opening",
  "topSignal": {
    "title": "",
    "category": "",
    "urgency": "High|Medium|Low",
    "timeframe": "",
    "summary": "",
    "whyNow": "",
    "recommendedAction": "",
    "sources": [{ "title": "", "url": "", "publisher": "", "date": "" }]
  },
  "industryNews": [same signal shape, exactly 3],
  "competitorSignals": [same signal shape, exactly 3],
  "companyTake": "one sharp, differentiated point of view ${input.profile.companyName} can credibly own",
  "movesToday": [{ "title": "", "action": "" }, exactly 3]
}`
      }
    ]
  });

  const raw = response.choices[0]?.message.content;
  if (!raw) throw new Error("OpenAI returned an empty newsletter response.");
  return newsletterBriefSchema.parse(JSON.parse(raw));
}

function demoBrief(profile: CompanyProfile): NewsletterBrief {
  const generatedAt = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());

  return {
    id: `demo-${Date.now()}`,
    companyName: profile.companyName,
    title: "Morning Signal",
    subtitle: "Your daily shot of market intelligence and action-ready GTM moves.",
    generatedAt,
    intro:
      `I tracked fresh competitor updates, buyer demand signals, and market shifts relevant to ${profile.companyName}. The important pattern: the category is converging around agentic search, but the proof layer is still thin.`,
    topSignal: {
      title: "AI search competitors are moving from retrieval claims to agent workflow claims",
      category: "Positioning",
      urgency: "High",
      timeframe: "Today",
      summary:
        `Multiple competitors now frame search and extraction as infrastructure for production agents, not just developer APIs. This overlaps directly with ${profile.companyName}'s strongest current narrative.`,
      whyNow:
        "The market is shifting language quickly, which means generic 'AI search API' messaging will become harder to defend without concrete agent demos.",
      recommendedAction:
        `Publish a flagship GTM intelligence agent demo showing ${profile.companyName} turning live web signals into structured actions for ${profile.icp}.`,
      sources: [
        { title: "Tavily", url: "https://www.tavily.com/", publisher: "Tavily", date: "Today" },
        { title: "Exa", url: "https://exa.ai/", publisher: "Exa", date: "Today" }
      ]
    },
    industryNews: [
      {
        title: "Enterprise AI teams are asking for fresher external context",
        category: "Market demand",
        urgency: "High",
        timeframe: "This week",
        summary:
          "The agent infrastructure conversation is increasingly about keeping models grounded in current external truth, especially for research, sales, and competitive workflows.",
        whyNow:
          "Static training data is visibly insufficient for operational GTM decisions that change daily.",
        recommendedAction:
          `Anchor ${profile.companyName}'s developer content around a clear production-agent category claim and prove it with working repos.`,
        sources: [{ title: profile.companyName, url: profile.website, publisher: profile.companyName }]
      },
      {
        title: "Structured outputs are becoming the trust surface",
        category: "Developer experience",
        urgency: "Medium",
        timeframe: "This week",
        summary:
          "Builders do not just want links. They want reliable structured data, citations, confidence, and repeatable flows that can be inspected.",
        whyNow:
          "Agent demos are moving from novelty to production evaluation, making observability and output contracts more important.",
        recommendedAction:
          "Ship examples that include schemas, source citations, and LangSmith traces.",
        sources: [{ title: "LangSmith", url: "https://docs.langchain.com/langsmith/observability-quickstart", publisher: "LangChain" }]
      },
      {
        title: "Developer tools are competing on time-to-first-proof",
        category: "DevRel",
        urgency: "Medium",
        timeframe: "This week",
        summary:
          "The winning onboarding path is no longer an API reference alone. It is a runnable demo that reaches a credible business outcome fast.",
        whyNow:
          "AI engineers are overloaded with similar-sounding agent tools and need proof before commitment.",
        recommendedAction:
          `Turn this agent into a reusable GTM intelligence cookbook example for ${profile.companyName}.`,
        sources: [{ title: `${profile.companyName} website`, url: profile.website, publisher: profile.companyName }]
      }
    ],
    competitorSignals: profile.competitors.slice(0, 3).map((competitor, index) => ({
      title: `${competitor} is competing for the agent search narrative`,
      category: "Competitive",
      urgency: index === 0 ? "High" : "Medium",
      timeframe: "This week",
      summary: `${competitor} is part of the competitor set buyers will compare when evaluating web search and extraction for AI agents.`,
      whyNow:
        "Messaging convergence makes differentiated proof more valuable than broad category language.",
      recommendedAction:
        `Create one comparison-safe technical asset that emphasizes ${profile.companyName}'s product and workflow fit without overclaiming.`,
      sources: [{ title: competitor, url: `https://www.google.com/search?q=${encodeURIComponent(competitor)}`, publisher: competitor }]
    })),
    companyTake:
      `${profile.companyName} has a strong opening: the market wants agents that can reason over what is happening now, not what was true at training time. The GTM opportunity is to show this with concrete, observable workflows that discover, extract, structure, and turn live web signals into decisions for ${profile.targetMarkets}.`,
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
