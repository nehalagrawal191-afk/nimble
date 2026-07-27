# Architecture

Morning Signal is intentionally built as a visible agent workflow rather than a hidden prompt chain. That makes it easier to explain in a conference talk and easier to defend in Q&A.

## Core Flow

```text
Company website
  -> Discover company context with Nimble
  -> Review and approve company profile, ICP, and target markets
  -> Plan search topics from approved context
  -> Search with Nimble
  -> Extract with Nimble
  -> Assemble evidence packet
  -> Synthesize newsletter
  -> Store brief in SQLite
  -> Render in Next.js
  -> Optionally send with Resend
```

## Why LangGraph

LangGraph makes each step explicit:

- Planning is separate from retrieval.
- Nimble Search is separate from Nimble Extract.
- Evidence assembly happens before synthesis.
- The final newsletter has a typed schema.

That structure gives the demo a clean technical story: the LLM is not guessing from memory. It is reasoning over live evidence gathered through Nimble.

## Where Nimble Is In The Critical Path

Nimble is used before the LLM writes the newsletter.

- `nimbleSearch()` discovers relevant market and competitor sources.
- `nimbleExtract()` pulls source content from selected pages.
- The evidence packet preserves source titles, URLs, publishers, dates, snippets, and extracted content.

If Nimble fails during a live conference demo, `DEMO_MODE=true` can run the same workflow with deterministic sample evidence. That keeps the presentation reliable while preserving the architecture.

## Data Model

The final newsletter is validated with Zod:

- `topSignal`
- `industryNews`
- `competitorSignals`
- `companyTake`
- `movesToday`
- source citations for every signal

Generated briefs are stored in SQLite at `data/signals.db`, which is ignored by git.

## Observability

Set these environment variables to trace the graph in LangSmith:

```bash
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=nimble-gtm-signal-agent
```

In the live talk, the LangSmith trace is useful proof that the agent is not a black box. It shows query planning, Nimble retrieval, extraction, and synthesis as separate steps.
