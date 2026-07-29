# Part 1 Talk Outline

## Title

Morning espresso with Nimble

## Thesis

Nimble turns live web chaos into structured, source-grounded, agent-ready intelligence — before the LLM reasons.

## Deck

Premium keynote deck (rebuilt from first principles):

- **Present:** open [`/presentation/index.html`](../public/presentation/index.html) or run the app and visit `http://localhost:3001/presentation/`
- **Speaker notes:** [`presentation/SPEAKER_NOTES.md`](./presentation/SPEAKER_NOTES.md)
- **Controls:** arrow keys, on-screen buttons, `F` for fullscreen
- **Demo video:** place the 4-minute recording at `public/presentation/demo.mp4`

## Runtime (20 minutes)

| Minutes | Beat |
| --- | --- |
| 0–4 | Title + embedded Morning Signal demo |
| 4–7 | What you saw + live-web problem |
| 7–10 | Agent architecture + Nimble in the critical path |
| 10–14 | Search, Extract, Agents, Crawl/Map, Drivers |
| 14–17 | 2×2 positioning + why Nimble wins this use case |
| 17–20 | Build path, generalization, close |

## Hook

Most GTM research is stale before it reaches the meeting. Competitor pages change, docs launch, pricing shifts, and buyers start asking new questions. A generic LLM can summarize what it already knows — it cannot know what changed today unless it can reach the live web through a structured intelligence layer.

## Problem

GTM teams do not suffer from a lack of information. They suffer from scattered, constantly changing public signals:

- Competitor launches
- Pricing changes
- Docs updates
- Community threads
- Job postings
- Analyst / market reports

CRM, battlecards, and LLM memory do not know what changed today.

## What I Built

Morning Signal is a real-time GTM intelligence agent.

Flow:

```text
Company URL
  → company profile
  → approved GTM context
  → LangGraph planner
  → Nimble Search
  → Nimble Extract
  → evidence packet
  → OpenAI synthesis
  → Morning Signal brief
```

The LLM is only one node. The agent is the workflow around the model.

## Why Nimble

Before synthesis:

1. Search discovers fresh sources
2. Extract turns pages into usable evidence
3. Metadata and source links make output auditable
4. Structured evidence prevents generic filler

Nimble’s wedge vs. retrieval-only search, crawl-to-markdown tools, automation marketplaces, and heavy web infra: **agent-ready structured web intelligence** — live search + extraction + agents + crawl/map + pricing/control.

## Demo Beats

1. Enter `nimbleway.com`
2. Show researched profile, competitors, ICP, markets
3. Human approval checkpoint
4. Live agent-work map: Plan → Search → Extract → Verify → Synthesize
5. Newsletter: what changed, why now, moves today
6. Point at sources and LangSmith traces

## Close

The most persuasive developer content does not just explain an API. It proves a workflow. Morning Signal shows live web discovery → structured extraction → grounded business action — a pattern developers can inspect, run, and adapt.
