"use client";

import { FormEvent, useState } from "react";
import { Mail, Play, RotateCcw, Send } from "lucide-react";
import type { NewsletterBrief } from "@/lib/types";

const defaultPrompt =
  "Create today's GTM signal brief for Nimble's GTM team across AI search APIs, web scraping infrastructure, web data platforms, and production AI agent tooling.";

const defaultCompetitors =
  "Tavily, Exa, Bright Data, Oxylabs, Zyte, Apify, Firecrawl, SerpApi";

export default function Home() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [competitors, setCompetitors] = useState(defaultCompetitors);
  const [brief, setBrief] = useState<NewsletterBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  async function generateBrief(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSendStatus(null);

    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, competitors })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Brief generation failed.");
      setBrief(data.brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function sendBrief() {
    if (!brief) return;
    setSending(true);
    setError(null);
    setSendStatus(null);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Newsletter delivery failed.");
      setSendStatus(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  function resetDemo() {
    setBrief(null);
    setError(null);
    setSendStatus(null);
    setPrompt(defaultPrompt);
    setCompetitors(defaultCompetitors);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          Nimble
        </div>
        <div>
          <h1>Morning Signal</h1>
          <p>
            A real-time GTM intelligence agent that turns live web data into an
            action-ready newsletter for Nimble's go-to-market team.
          </p>
        </div>

        <form className="control-panel" onSubmit={generateBrief}>
          <div className="field">
            <label htmlFor="prompt">Brief objective</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="competitors">Tracked competitors</label>
            <input
              id="competitors"
              value={competitors}
              onChange={(event) => setCompetitors(event.target.value)}
            />
          </div>
          <div className="button-row">
            <button className="primary-button" disabled={loading} type="submit">
              <Play size={17} />
              {loading ? "Tracking signals" : "Generate brief"}
            </button>
            <button className="secondary-button" type="button" onClick={resetDemo}>
              <RotateCcw size={17} />
              Reset
            </button>
          </div>
        </form>

        <div className="status-grid">
          <div className="status-item">
            <strong>Live web layer</strong>
            <span>Nimble Search + Extract, with demo-mode fallback.</span>
          </div>
          <div className="status-item">
            <strong>Agent workflow</strong>
            <span>LangGraph steps traceable in LangSmith.</span>
          </div>
          <div className="status-item">
            <strong>Delivery</strong>
            <span>Newsletter rendering plus optional Resend email.</span>
          </div>
        </div>
      </aside>

      <section className="main">
        <div className="topbar">
          <h2>Daily GTM Intelligence Brief</h2>
          <span className="pill">{brief ? brief.generatedAt : "Ready"}</span>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {sendStatus ? <div className="status-item">{sendStatus}</div> : null}

        {brief ? (
          <article className="newsletter">
            <header className="newsletter-header">
              <h3>{brief.title}</h3>
              <p>{brief.subtitle}</p>
            </header>
            <div className="newsletter-body">
              <section className="section">
                <h4>Good morning, Nimble GTM.</h4>
                <p>{brief.intro}</p>
              </section>

              <SignalSection title="Today's Top GTM Signal" signals={[brief.topSignal]} />
              <SignalSection title="Industry News In 24 Hours" signals={brief.industryNews} />
              <SignalSection title="What Competitors Are Up To" signals={brief.competitorSignals} />

              <section className="section">
                <h4>Nimble's Take</h4>
                <p>{brief.nimbleTake}</p>
              </section>

              <section className="section">
                <h4>Your Moves Today</h4>
                <div className="signal-list">
                  {brief.movesToday.map((move) => (
                    <div className="signal-card" key={move.title}>
                      <h5>{move.title}</h5>
                      <p>{move.action}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="button-row">
                <button className="secondary-button" disabled={sending} onClick={sendBrief}>
                  <Send size={17} />
                  {sending ? "Sending" : "Send newsletter"}
                </button>
              </div>
            </div>
          </article>
        ) : (
          <div className="empty-state">
            <div>
              <Mail size={42} />
              <h3>No brief generated yet</h3>
              <p>
                Start a run to collect live signals, score GTM relevance, and
                render the Morning Signal newsletter.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SignalSection({ title, signals }: { title: string; signals: NewsletterBrief["industryNews"] }) {
  return (
    <section className="section">
      <h4>{title}</h4>
      <div className="signal-list">
        {signals.map((signal) => (
          <div className="signal-card" key={`${title}-${signal.title}`}>
            <h5>{signal.title}</h5>
            <div className="signal-meta">
              <span className={`tag ${signal.urgency.toLowerCase()}`}>{signal.urgency} urgency</span>
              <span className="tag">{signal.category}</span>
              <span className="tag">{signal.timeframe}</span>
            </div>
            <p>{signal.summary}</p>
            <p>
              <strong>Why now: </strong>
              {signal.whyNow}
            </p>
            <p>
              <strong>Recommended action: </strong>
              {signal.recommendedAction}
            </p>
            {signal.sources.length ? (
              <ul className="source-list">
                {signal.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title || source.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
