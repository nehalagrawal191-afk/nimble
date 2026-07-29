"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Globe2,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Sparkles
} from "lucide-react";
import type { CompanyProfile, NewsletterBrief } from "@/lib/types";

type Step = "website" | "profile" | "working" | "report";
type WorkPhase = "planning" | "searching" | "extracting" | "verifying" | "synthesizing";

const sourceLogos = [
  { name: "Google", file: "google.svg" },
  { name: "LinkedIn", file: "linkedin.svg" },
  { name: "Reddit", file: "reddit.svg" },
  { name: "YouTube", file: "youtube.svg" },
  { name: "TikTok", file: "tiktok.svg" },
  { name: "Amazon", file: "amazon.svg" },
  { name: "Walmart", file: "walmart.svg" },
  { name: "Google Maps", file: "googlemaps.svg" },
  { name: "Zillow", file: "zillow.svg" },
  { name: "Airbnb", file: "airbnb.svg" },
  { name: "Tripadvisor", file: "tripadvisor.svg" },
  { name: "CNN", file: "cnn.svg" }
] as const;

const workSourcePositions = [
  { x: 9, y: 17 },
  { x: 27, y: 8 },
  { x: 52, y: 7 },
  { x: 75, y: 10 },
  { x: 92, y: 20 },
  { x: 95, y: 49 },
  { x: 90, y: 78 },
  { x: 72, y: 91 },
  { x: 49, y: 93 },
  { x: 27, y: 90 },
  { x: 9, y: 75 },
  { x: 5, y: 46 }
] as const;

const agentStages: Array<{ key: WorkPhase; label: string; x: number; y: number }> = [
  { key: "planning", label: "Plan", x: 50, y: 19 },
  { key: "searching", label: "Search", x: 72, y: 38 },
  { key: "extracting", label: "Extract", x: 65, y: 72 },
  { key: "verifying", label: "Verify", x: 35, y: 72 },
  { key: "synthesizing", label: "Synthesize", x: 28, y: 38 }
];

export default function Home() {
  const [step, setStep] = useState<Step>("website");
  const [website, setWebsite] = useState("https://www.nimbleway.com");
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [brief, setBrief] = useState<NewsletterBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [workPhase, setWorkPhase] = useState<WorkPhase>("planning");
  const [sourceCount, setSourceCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  async function researchCompany(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Company research failed.");
      setProfile(data.profile);
      setStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function generateBrief() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    setSendStatus(null);
    setWorkPhase("planning");
    setSourceCount(0);
    setStep("working");

    try {
      const response = await fetch("/api/brief/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile })
      });
      if (!response.ok || !response.body) {
        const data = await response.json();
        throw new Error(data.error ?? "Brief generation failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completedBrief: NewsletterBrief | null = null;

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line) as {
            type: "progress" | "complete" | "error";
            phase?: WorkPhase;
            sourceCount?: number;
            brief?: NewsletterBrief;
            message?: string;
          };

          if (event.type === "error") throw new Error(event.message ?? "Agent run failed.");
          if (event.sourceCount !== undefined) setSourceCount(event.sourceCount);

          if (event.type === "progress" && event.phase) {
            setWorkPhase(event.phase);
            await wait(550);
          }

          if (event.type === "complete" && event.brief) {
            completedBrief = event.brief;
          }
        }

        if (done) break;
      }

      if (!completedBrief) throw new Error("Agent completed without a newsletter.");
      setBrief(completedBrief);
      await wait(650);
      setStep("report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("profile");
    } finally {
      setLoading(false);
    }
  }

  async function sendBrief(event: FormEvent) {
    event.preventDefault();
    if (!brief) return;
    setSending(true);
    setError(null);
    setSendStatus(null);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, recipient: recipientEmail })
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

  function restart() {
    setStep("website");
    setProfile(null);
    setBrief(null);
    setError(null);
    setSendStatus(null);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <button className="wordmark" type="button" onClick={restart} aria-label="Start over">
          <Image
            className="brand-logo"
            src="/nimble-logo.png"
            width={36}
            height={36}
            alt=""
            priority
          />
          <span>Nimble&apos;s Takes</span>
        </button>
        <div className="stepper" aria-label="Progress">
          <StepItem number={1} label="Company" active={step === "website"} complete={step !== "website"} />
          <span className="step-line" />
          <StepItem number={2} label="GTM profile" active={step === "profile"} complete={step === "working" || step === "report"} />
          <span className="step-line" />
          <StepItem number={3} label="Agents" active={step === "working"} complete={step === "report"} />
          <span className="step-line" />
          <StepItem number={4} label="Morning Signal" active={step === "report"} complete={false} />
        </div>
        <a className="mode-badge deck-link" href="/slides/index.html">
          Open keynote deck →
        </a>
      </header>

      {error ? <div className="global-message error">{error}</div> : null}
      {sendStatus ? <div className="global-message success">{sendStatus}</div> : null}

      {step === "website" ? (
        <WebsiteScreen
          website={website}
          setWebsite={setWebsite}
          loading={loading}
          onSubmit={researchCompany}
        />
      ) : null}

      {step === "profile" && profile ? (
        <ProfileScreen
          profile={profile}
          setProfile={setProfile}
          loading={loading}
          onBack={() => setStep("website")}
          onSubmit={generateBrief}
        />
      ) : null}

      {step === "working" && profile ? (
        <WorkingScreen
          companyName={profile.companyName}
          phase={workPhase}
          sourceCount={sourceCount}
        />
      ) : null}

      {step === "report" && brief ? (
        <ReportScreen
          brief={brief}
          loading={loading}
          sending={sending}
          recipientEmail={recipientEmail}
          setRecipientEmail={setRecipientEmail}
          onSend={sendBrief}
          onEdit={() => setStep("profile")}
          onRefresh={generateBrief}
        />
      ) : null}
    </main>
  );
}

function WebsiteScreen({
  website,
  setWebsite,
  loading,
  onSubmit
}: {
  website: string;
  setWebsite: (value: string) => void;
  loading: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section className="onboarding-screen">
      <div className="source-logo-field" aria-hidden="true">
        {sourceLogos.map((logo, index) => (
          <span className={`source-logo source-logo-${index + 1}`} key={logo.name}>
            <Image
              src={`/source-logos/${logo.file}`}
              width={40}
              height={40}
              alt=""
              unoptimized
            />
          </span>
        ))}
      </div>
      <div className="onboarding-content">
        <h1>Your Market, Clearly Signaled</h1>
        <p className="url-hint">Add your company URL</p>
        <form className="url-form" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="website">Company website</label>
          <div className="url-control">
            <Globe2 size={20} />
            <input
              id="website"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://company.com"
              required
            />
            <button className="primary-button" disabled={loading} type="submit">
              {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              {loading ? "Researching" : "Research company"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function ProfileScreen({
  profile,
  setProfile,
  loading,
  onBack,
  onSubmit
}: {
  profile: CompanyProfile;
  setProfile: (profile: CompanyProfile) => void;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const update = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) =>
    setProfile({ ...profile, [key]: value });

  return (
    <section className="profile-screen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Review the research</p>
          <h1>Define the GTM lens</h1>
          <p>
            Confirm what the agent found and sharpen the ICP and markets it should
            prioritize. Your edits become the research brief.
          </p>
        </div>
        <a className="website-link" href={profile.website} target="_blank" rel="noreferrer">
          <Globe2 size={16} /> {new URL(profile.website).hostname}
        </a>
      </div>

      <form
        className="profile-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="profile-grid">
          <div className="profile-column">
            <h2><Building2 size={19} /> Company context</h2>
            <FormField label="Company name">
              <input
                value={profile.companyName}
                onChange={(event) => update("companyName", event.target.value)}
                required
              />
            </FormField>
            <FormField label="About">
              <textarea
                value={profile.overview}
                onChange={(event) => update("overview", event.target.value)}
                rows={4}
                required
              />
            </FormField>
            <FormField label="Products" hint="One per line">
              <textarea
                value={profile.products.join("\n")}
                onChange={(event) => update("products", lines(event.target.value))}
                rows={4}
                required
              />
            </FormField>
            <FormField label="Coverage">
              <textarea
                value={profile.coverage}
                onChange={(event) => update("coverage", event.target.value)}
                rows={3}
                required
              />
            </FormField>
          </div>

          <div className="profile-column">
            <h2><Sparkles size={19} /> GTM context</h2>
            <FormField label="Competitors" hint="One per line">
              <textarea
                value={profile.competitors.join("\n")}
                onChange={(event) => update("competitors", lines(event.target.value))}
                rows={5}
                required
              />
            </FormField>
            <FormField label="Ideal customer profile (ICP)">
              <textarea
                value={profile.icp}
                onChange={(event) => update("icp", event.target.value)}
                rows={5}
                required
              />
            </FormField>
            <FormField label="Target markets">
              <textarea
                value={profile.targetMarkets}
                onChange={(event) => update("targetMarkets", event.target.value)}
                rows={5}
                required
              />
            </FormField>
          </div>
        </div>

        <div className="approval-bar">
          <div>
            <strong>Ready to track the market?</strong>
            <span>The agent will use this approved context to plan its live research.</span>
          </div>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={onBack}>
              <ArrowLeft size={17} /> Back
            </button>
            <button className="primary-button" disabled={loading} type="submit">
              {loading ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
              {loading ? "Tracking live signals" : "Approve & generate"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function WorkingScreen({
  companyName,
  phase,
  sourceCount
}: {
  companyName: string;
  phase: WorkPhase;
  sourceCount: number;
}) {
  const phaseIndex = agentStages.findIndex((stage) => stage.key === phase);
  const phaseLabel = agentStages[phaseIndex]?.label ?? "Plan";

  return (
    <section className="working-screen">
      <div className="working-heading">
        <h1>Nimble agents at work</h1>
        <span className="live-status"><i /> Live</span>
      </div>

      <div className={`agent-map phase-${phase}`}>
        <svg
          className="connection-map"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {workSourcePositions.map((position, index) => (
            <line
              className={phaseIndex > 0 ? "source-line active" : "source-line"}
              key={`line-${sourceLogos[index].name}`}
              x1={position.x * 10}
              y1={position.y * 6}
              x2="500"
              y2="300"
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </svg>

        {sourceLogos.map((logo, index) => {
          const position = workSourcePositions[index];
          return (
            <span
              className={`work-source ${phaseIndex > 0 ? "active" : ""}`}
              key={`work-${logo.name}`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              title={logo.name}
            >
              <Image
                src={`/source-logos/${logo.file}`}
                width={24}
                height={24}
                alt={logo.name}
                unoptimized
              />
            </span>
          );
        })}

        {agentStages.map((stage, index) => (
          <span
            className={`agent-node ${index === phaseIndex ? "active" : ""} ${index < phaseIndex ? "complete" : ""}`}
            key={stage.key}
            style={{ left: `${stage.x}%`, top: `${stage.y}%` }}
          >
            <i>{index < phaseIndex ? <Check size={11} /> : null}</i>
            {stage.label}
          </span>
        ))}

        <div className="signal-core">
          <Image src="/nimble-logo.png" width={62} height={62} alt="" priority />
          <strong>Morning Signal</strong>
          <div className="core-progress" aria-hidden="true">
            {agentStages.map((stage, index) => (
              <i className={index <= phaseIndex ? "filled" : ""} key={stage.key} />
            ))}
          </div>
        </div>
      </div>

      <div className="working-footer">
        <strong>{phaseLabel}</strong>
        <span>{sourceCount ? `${sourceCount} sources` : companyName}</span>
      </div>
    </section>
  );
}

function ReportScreen({
  brief,
  loading,
  sending,
  recipientEmail,
  setRecipientEmail,
  onSend,
  onEdit,
  onRefresh
}: {
  brief: NewsletterBrief;
  loading: boolean;
  sending: boolean;
  recipientEmail: string;
  setRecipientEmail: (value: string) => void;
  onSend: (event: FormEvent) => void;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  return (
    <section className="report-screen">
      <div className="report-toolbar">
        <div>
          <p className="eyebrow">{brief.companyName} GTM intelligence</p>
          <h1>{brief.title}</h1>
        </div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={onEdit}>
            <ArrowLeft size={17} /> Edit profile
          </button>
          <button
            className="icon-button"
            type="button"
            title="Regenerate report"
            aria-label="Regenerate report"
            disabled={loading}
            onClick={onRefresh}
          >
            {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          </button>
          <form className="delivery-control" onSubmit={onSend}>
            <input
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="you@company.com"
              aria-label="Newsletter recipient"
              autoComplete="email"
              required
              disabled={sending}
            />
            <button className="primary-button" type="submit" disabled={sending}>
              {sending ? <Loader2 className="spin" size={17} /> : <Send size={17} />}
              {sending ? "Sending newsletter" : "Create daily newsletter"}
            </button>
          </form>
        </div>
      </div>

      <article className="newsletter">
        <header className="newsletter-header">
          <div className="newsletter-kicker">
            <span><Mail size={16} /> Daily brief</span>
            <span>{brief.generatedAt}</span>
          </div>
          <h2>{brief.title}</h2>
          <p>{brief.subtitle}</p>
        </header>
        <div className="newsletter-body">
          <section className="section greeting">
            <h3>Good morning.</h3>
            <p>{brief.intro}</p>
          </section>
          <ProspectSection prospect={brief.topProspect} />
          <SignalSection title="Industry News In 24 Hours" signals={brief.industryNews} />
          <SignalSection title="What Competitors Are Up To" signals={brief.competitorSignals} />
          <section className="section take-section yellow-section">
            <p className="section-label">Competitive response</p>
            <h3>Nimble&apos;s Take</h3>
            <p>{brief.competitorTake}</p>
          </section>
          <section className="section">
            <p className="section-label">Action plan</p>
            <h3>Your Moves Today</h3>
            <div className="moves-list">
              {brief.movesToday.map((move, index) => (
                <div className="move-row" key={move.title}>
                  <span>{index + 1}</span>
                  <div>
                    <h4>{move.title}</h4>
                    <p>{move.action}</p>
                  </div>
                  <ArrowRight size={18} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </article>
    </section>
  );
}

function StepItem({
  number,
  label,
  active,
  complete
}: {
  number: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className={`step-item ${active ? "active" : ""} ${complete ? "complete" : ""}`}>
      <span>{complete ? <Check size={13} /> : number}</span>
      <strong>{label}</strong>
    </div>
  );
}

function FormField({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}{hint ? <small>{hint}</small> : null}</span>
      {children}
    </label>
  );
}

function ProspectSection({
  prospect
}: {
  prospect: NewsletterBrief["topProspect"];
}) {
  return (
    <section className="section yellow-section">
      <p className="section-label">Priority account</p>
      <h3>Today&apos;s Top Prospect</h3>
      <div className="signal-card featured">
        <div className="signal-title-row">
          <h4>{prospect.companyName}</h4>
        </div>
        <p>{prospect.trigger}</p>
        <div className="signal-analysis">
          <p><strong>Why they fit</strong>{prospect.fit}</p>
          <p><strong>Why now</strong>{prospect.whyNow}</p>
          <p><strong>Recommended action</strong>{prospect.recommendedAction}</p>
        </div>
        <SourceLinks sources={prospect.sources} />
      </div>
    </section>
  );
}

function SignalSection({
  title,
  signals
}: {
  title: string;
  signals: NewsletterBrief["industryNews"];
}) {
  return (
    <section className="section">
      <p className="section-label">Live intelligence</p>
      <h3>{title}</h3>
      <div className="signal-list">
        {signals.map((signal) => (
          <div className="signal-card" key={`${title}-${signal.title}`}>
            <div className="signal-title-row">
              <h4>{signal.title}</h4>
            </div>
            <p>{signal.summary}</p>
            <div className="signal-analysis">
              <p><strong>Why it matters</strong>{signal.whyItMatters}</p>
              {signal.nimbleTake ? <p><strong>Nimble&apos;s Take</strong>{signal.nimbleTake}</p> : null}
            </div>
            <SourceLinks sources={signal.sources} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SourceLinks({
  sources
}: {
  sources: NewsletterBrief["industryNews"][number]["sources"];
}) {
  return sources.length ? (
    <div className="sources">
      <span>Sources</span>
      {sources.map((source) => (
        <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
          {source.title || source.url} <ArrowRight size={13} />
        </a>
      ))}
    </div>
  ) : null;
}

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
