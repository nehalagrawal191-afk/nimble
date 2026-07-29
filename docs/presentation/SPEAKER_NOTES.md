# Speaker Notes — Morning espresso with Nimble

**Total runtime:** 20 minutes  
**Deck:** `/presentation/index.html` (or `http://localhost:3001/presentation/` with the app running)  
**Navigation:** `→` / `←`, swipe, or on-screen controls · `F` fullscreen

---

## Timing map

| Block | Minutes | Slides |
| --- | --- | --- |
| Opening + demo | 0:00–4:00 | 1–2 |
| What you saw + problem | 4:00–7:00 | 3–5 |
| Agent + Nimble role | 7:00–10:00 | 6–7 |
| Feature breakdown | 10:00–14:00 | 8–12 |
| Differentiation + win | 14:00–17:00 | 13–14 |
| Build path + generalization + close | 17:00–20:00 | 15–17 |

---

## Slide 1 — Title (30–45s)

**Say:**  
“Morning espresso with Nimble. The thesis is not ‘AI for GTM.’ It is this: **Nimble turns live web chaos into structured, source-grounded, agent-ready intelligence — before the LLM reasons.**”

**So what:** Plant the differentiation before the demo so the video is evidence, not entertainment.

---

## Slide 2 — Demo video (4:00)

**Do:** Play the Morning Signal recording without narrating over every click.

**Teach through the demo:**
1. Company URL in → profile researched with Nimble  
2. Human approval of ICP / markets / competitors  
3. Live map: Plan → Search → Extract → Verify → Synthesize  
4. Newsletter with sources, Nimble’s Take, and moves today  

**Say after video (10s):** “You did not watch a chatbot. You watched a workflow with Nimble in the critical path.”

---

## Slide 3 — What you just saw (60–75s)

Walk the five boxes left to right. Pause on the two yellow/green Nimble steps.

**Say:** “Context and planning are necessary. Synthesis is necessary. But without Search and Extract, the model is writing fiction with confidence.”

---

## Slides 4–5 — Problem (2:00)

**Slide 4:** Point at the constellation — launches, pricing, docs, community, jobs, analyst notes.

**Say:** “GTM does not have an information shortage. It has a freshness and assembly problem.”

**Slide 5:** Hit CRM, battlecards, LLM memory as three blind spots.

**Say:** “None of these know what changed on the public web this morning. That is the gap Nimble fills.”

---

## Slide 6 — Architecture (90s)

Trace Context → Plan → Critical path → Output.

**Emphasize:** “The LLM is the dashed node at the end. LangGraph makes each step explicit. Nimble Search and Extract are highlighted because that is where live truth enters the system.”

**Optional:** Mention LangSmith traces as proof the graph is real.

---

## Slide 7 — Nimble in the critical path (75s)

Four blocks: discover → structure → audit → ground. Then the “Only then → synthesis” bar.

**Say:** “If you remember one diagram, remember this: synthesis is not allowed to run until evidence exists.”

---

## Slides 8–12 — Features (~4:00, ~45s each)

Keep visible text minimal; speak the “why.”

| Slide | Punch line |
| --- | --- |
| Search | Finds fresh signals with controls developers actually use |
| Extract | Pages become citable evidence, not pasted HTML |
| Agents | Encode research playbooks; run them like infrastructure |
| Crawl / Map | Same pattern, site-scale when Morning Signal graduates from demo |
| Drivers | Standard / render JS / stealth = cost–control tradeoff |

**Bridge:** “Morning Signal uses Search + Extract today. Agents, Crawl, Map, and drivers are how you productionize the same pattern.”

---

## Slide 13 — 2×2 (90s)

Point to Exa/Tavily (retrieval), Firecrawl (extract/crawl), Apify (marketplace), Bright Data (heavy infra), then Nimble in the top-right.

**Say:** “The wedge is not ‘we also scrape.’ It is live search + structured extract + agents + crawl/map + pricing controls as one agent-ready platform.”

---

## Slide 14 — Why Nimble wins (90s)

Scan the yellow column. Do not read every cell.

**Say:** “For this use case — source-grounded GTM intelligence — freshness, structure, inspectability, and agent fit have to land together. That is why Nimble wins Morning Signal.”

---

## Slide 15 — Build path (60s)

Read the six steps as a recipe: key → env → Search → Extract → LangGraph → synthesize with sources.

**Say:** “This is the DevRel standard: leave the room with a path they can run tonight.”

---

## Slide 16 — Generalization (60s)

Pattern: Live web signal → structured evidence → grounded synthesis → business action.

Gesture across use cases: GTM, recruiting, market research, financial monitoring, product/competitive.

**Say:** “Morning Signal is one instance of a reusable cookbook pattern.”

---

## Slide 17 — Close (45s)

Restate thesis. Offer Q&A on architecture, LangSmith, and the build path.

**Say:** “Prove the workflow. Don’t pitch the API. Thank you — questions.”

---

## Contingencies

- **Video missing:** Narrate a live run of the app (`npm run dev -- -p 3001`) for up to 4 minutes; keep DEMO_MODE ready.  
- **API flake:** DEMO_MODE preserves architecture story; say so explicitly.  
- **Time cut:** Drop feature slides 10–12 first; keep Search, Extract, 2×2, and close.
