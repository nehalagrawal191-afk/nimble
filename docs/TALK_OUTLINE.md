# Part 1 Talk Outline

## Title

From Search Results To Strategy: Building A GTM Signal Agent With Nimble

## Hook

Most GTM research is stale before it reaches the meeting. Competitor pages change, agent infrastructure vendors reposition, docs launch, pricing shifts, and buyers start asking new questions. A generic LLM can summarize what it already knows, but it cannot know what changed today unless it can reach the live web.

## Problem

GTM teams do not suffer from a lack of information. They suffer from scattered, constantly changing public signals:

- Competitor positioning updates
- Product and docs launches
- Pricing and packaging changes
- Market category shifts
- Developer community narratives
- New comparison content

The operational question is: what changed, why does it matter, and what should we do today?

## What I Built

Morning Signal is a real-time GTM intelligence agent for Nimble's GTM team.

It monitors the live web across AI search APIs, web scraping infrastructure, agent tooling, and web data platforms. Then it produces an action-ready newsletter with:

- Today's Top GTM Signal
- Industry News In 24 Hours
- What Competitors Are Up To
- Nimble's Take
- Your Moves Today

## Architecture

```text
User objective
  -> LangGraph query planner
  -> Nimble Search
  -> Nimble Extract
  -> Evidence packet
  -> OpenAI synthesis
  -> SQLite storage
  -> Next.js newsletter UI
  -> Optional Resend delivery
```

## Why Nimble

Without Nimble, the agent can only produce generic category commentary or rely on stale memory. Nimble gives the agent a live web intelligence layer:

- Search discovers fresh market signals.
- Extract turns source pages into usable evidence.
- Structured source links make the output inspectable.
- The same pattern can become a reusable cookbook for developer-facing examples.

## Demo Beats

1. Enter `nimbleway.com` as the company website.
2. Show the researched company profile, competitor set, ICP, and target markets.
3. Explain why the human approval checkpoint improves relevance and trust.
4. Approve the profile and run the agent.
5. Explain the graph steps while it runs.
6. Walk through the unchanged Morning Signal newsletter structure.
7. Point to sources, Nimble's Take, and recommended moves.
8. Show LangSmith traces and explain how the pattern generalizes.

## Close

This is the DevRel point: the most persuasive developer content does not just explain an API. It proves a workflow. Morning Signal shows how Nimble can move from live web discovery to structured extraction to business action in a way developers can inspect, run, and adapt.
