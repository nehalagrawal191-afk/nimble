# Morning Signal: Nimble GTM Intelligence Agent

Morning Signal is a real-time GTM intelligence newsletter agent. A user enters a company website, approves an AI-researched company and GTM profile, and receives an action-ready daily brief grounded in fresh web evidence.

This project is built for Nimble's Principal Developer Advocate take-home assignment, Part 1: build and present an AI agent that uses Nimble's web search capabilities as a core capability.

## What It Does

The product follows a four-screen workflow:

1. Accepts a company website URL.
2. Uses Nimble to research and pre-fill the company overview, products, competitors, coverage, ICP, and target markets.
3. Pauses for human review and approval.
4. Streams live LangGraph progress into a visual map of Nimble agents and web sources.
5. Plans market and competitor queries from the approved profile.
6. Uses Nimble Search and Extract to gather fresh evidence.
7. Synthesizes, stores, and renders the Morning Signal newsletter.
8. Optionally sends the newsletter through Resend.

The newsletter sections are:

- Today's Top Prospect, backed by a current buying signal
- Industry News In 24 Hours, exactly three items with a tailored Nimble's Take
- What Competitors Are Up To, exactly three verified updates
- Nimble's Take on the competitive pattern and differentiation opportunity
- Your Moves Today, exactly three prioritized actions

## Why Nimble Matters Here

Generic LLMs are not enough for GTM intelligence because their knowledge is stale and disconnected from today's market changes. This agent uses Nimble to gather live web data before the LLM writes anything.

Nimble is doing meaningful work in the pipeline:

- `Search API`: discovers fresh competitor, category, and market signals.
- `Extract API`: retrieves structured source content from high-value pages.
- Themed evidence lanes: keep prospect, 24-hour industry, and competitor sources separate.
- Live source links: make the final brief inspectable and defensible.
- Source grounding: prevents unsupported URLs, unapproved competitors, and generic filler from being published.
- Demo-mode fallback: keeps the conference demo reliable without hiding the live architecture.

## Architecture

```text
Company website
  -> Nimble Search + Extract: discover company context
  -> Human approval: company, ICP, and target markets
  -> LangGraph: plan queries
  -> Nimble Search: discover fresh signals
  -> Nimble Extract: collect source content
  -> Evidence assembly
  -> OpenAI: synthesize structured GTM brief
  -> SQLite: store generated brief
  -> Next.js: render newsletter
  -> Resend: optional email delivery
```

## Technology Stack

- Nimble Search and Extract APIs
- LangGraph for agent orchestration
- LangSmith for tracing and observability
- OpenAI API for synthesis
- SQLite for local brief storage
- Next.js for the demo interface
- Resend for optional newsletter delivery

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Fill in:

```bash
NIMBLE_API_KEY=
OPENAI_API_KEY=
DEMO_MODE=false
LANGSMITH_API_KEY=
RESEND_API_KEY=
NEWSLETTER_TO=
NEWSLETTER_ALLOWED_RECIPIENTS=
```

## Email Delivery

Create a [Resend API key](https://resend.com/api-keys), then add these values to
`.env`:

```bash
RESEND_API_KEY=re_your_actual_key
NEWSLETTER_TO=your-resend-account-email@example.com
NEWSLETTER_FROM="Nimble's Takes <onboarding@resend.dev>"
```

`NEWSLETTER_TO` is also the delivery allowlist for the first recipient. To enable
more recipients, add them as a comma-separated list:

```bash
NEWSLETTER_ALLOWED_RECIPIENTS=person1@example.com,person2@example.com
```

On the report screen, enter an allowed email address and click **Create daily
newsletter**. The app sends the complete Morning Signal through Resend and
reports the real delivery result.

The default `onboarding@resend.dev` sender can send only to the email associated
with your Resend account. To send to other addresses, [verify a domain in
Resend](https://resend.com/docs/dashboard/domains/introduction) and replace
`NEWSLETTER_FROM` with an address on that domain.

Restart the development server after changing `.env`. With live mode enabled,
any valid public company URL follows the same discovery, approval, research, and
newsletter flow.

For a safe dry run without external API calls, use the built-in Nimble fixture:

```bash
DEMO_MODE=true
```

Demo mode intentionally rejects other domains instead of generating fabricated
company research.

Run the app:

```bash
npm run dev -- -p 3001
```

Open:

```text
http://localhost:3001
```

## Suggested Demo Script

See [`docs/TALK_OUTLINE.md`](docs/TALK_OUTLINE.md) for the full Part 1 talk path.

1. Start with the problem: GTM teams miss important market changes because signals are live, scattered, and buried across the web.
2. Enter `nimbleway.com` and show the researched profile.
3. Explain the human approval checkpoint; refine the ICP and target markets.
4. Approve the profile and show the live agent-work map.
5. Explain the streamed LangGraph stages: planning, Nimble Search, Nimble Extract, verification, and synthesis.
6. Open LangSmith and show traces for the agent run.
7. Walk through the newsletter:
   - What changed?
   - Why now?
   - What should Nimble's GTM team do today?
8. Close with the DevRel point: the best developer content proves a workflow, not just an API call.

## Safety And Reliability

- API keys live only in `.env`, which is ignored by git.
- `.env.example` documents required configuration without secrets.
- Live configuration is validated before paid retrieval begins.
- Company discovery accepts public HTTP/HTTPS websites and rejects private hosts.
- Each report run is capped at eight searches and six page extractions, plus the
  initial company discovery search and extraction.
- Demo mode keeps the Nimble talk path reliable if a provider is unavailable.
- Source links are preserved in the generated brief.
- Resend delivery is optional; the app renders the newsletter even without email configuration.
- `npm audit --omit=dev` passes with zero production vulnerabilities.

## Useful Commands

```bash
npm run typecheck
npm run build
npm audit --omit=dev
npm run dev
```

## Assignment Fit

This agent is designed to score well against the Part 1 criteria:

- Technical execution: working agent pipeline with Nimble in the critical path.
- Narrative clarity: live web data turns stale GTM research into action-ready intelligence.
- Use case judgment: the demo connects AI agents, developer infrastructure, and GTM impact.
- Demo quality: the output is concrete, readable, and easy to present live.
