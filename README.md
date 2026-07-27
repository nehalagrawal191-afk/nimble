# Morning Signal: Nimble GTM Intelligence Agent

Morning Signal is a real-time GTM intelligence newsletter agent for Nimble's go-to-market team. It uses Nimble as the live web intelligence layer, then turns fresh market, competitor, and developer ecosystem signals into an action-ready daily brief.

This project is built for Nimble's Principal Developer Advocate take-home assignment, Part 1: build and present an AI agent that uses Nimble's web search capabilities as a core capability.

## What It Does

Given a GTM research objective and a tracked competitor set, the agent:

1. Plans market and competitor search queries.
2. Uses Nimble Search to discover fresh web signals.
3. Uses Nimble Extract to pull source content from key pages.
4. Synthesizes the evidence into a newsletter for Nimble's GTM team.
5. Stores generated briefs in SQLite.
6. Renders the brief in a Next.js interface.
7. Optionally sends the newsletter through Resend.

The newsletter sections are:

- Today's Top GTM Signal
- Industry News In 24 Hours
- What Competitors Are Up To
- Nimble's Take
- Your Moves Today

## Why Nimble Matters Here

Generic LLMs are not enough for GTM intelligence because their knowledge is stale and disconnected from today's market changes. This agent uses Nimble to gather live web data before the LLM writes anything.

Nimble is doing meaningful work in the pipeline:

- `Search API`: discovers fresh competitor, category, and market signals.
- `Extract API`: retrieves structured source content from high-value pages.
- Live source links: make the final brief inspectable and defensible.
- Demo-mode fallback: keeps the conference demo reliable without hiding the live architecture.

## Architecture

```text
User objective
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
LANGSMITH_API_KEY=
RESEND_API_KEY=
NEWSLETTER_TO=
```

For a safe dry run without external API calls:

```bash
DEMO_MODE=true
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Suggested Demo Script

See [`docs/TALK_OUTLINE.md`](docs/TALK_OUTLINE.md) for the full Part 1 talk path.

1. Start with the problem: GTM teams miss important market changes because signals are live, scattered, and buried across the web.
2. Show the objective prompt and competitor set.
3. Generate the brief.
4. Explain the LangGraph workflow: planning, Nimble Search, Nimble Extract, synthesis, storage, delivery.
5. Open LangSmith and show traces for the agent run.
6. Walk through the newsletter:
   - What changed?
   - Why now?
   - What should Nimble's GTM team do today?
7. Close with the DevRel point: the best developer content proves a workflow, not just an API call.

## Safety And Reliability

- API keys live only in `.env`, which is ignored by git.
- `.env.example` documents required configuration without secrets.
- Demo mode keeps the UI and talk reliable if a provider is unavailable.
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
