"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
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

type Step = "website" | "profile" | "report";

export default function Home() {
  const [step, setStep] = useState<Step>("website");
  const [website, setWebsite] = useState("https://www.nimbleway.com");
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [brief, setBrief] = useState<NewsletterBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<string | null>(null);

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

    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Brief generation failed.");
      setBrief(data.brief);
      setStep("report");
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
          <StepItem number={2} label="GTM profile" active={step === "profile"} complete={step === "report"} />
          <span className="step-line" />
          <StepItem number={3} label="Morning Signal" active={step === "report"} complete={false} />
        </div>
        <span className="mode-badge">Powered by Nimble</span>
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

      {step === "report" && brief ? (
        <ReportScreen
          brief={brief}
          loading={loading}
          sending={sending}
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

function ReportScreen({
  brief,
  loading,
  sending,
  onSend,
  onEdit,
  onRefresh
}: {
  brief: NewsletterBrief;
  loading: boolean;
  sending: boolean;
  onSend: () => void;
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
          <button className="primary-button" type="button" disabled={sending} onClick={onSend}>
            {sending ? <Loader2 className="spin" size={17} /> : <Send size={17} />}
            {sending ? "Creating newsletter" : "Create daily newsletter"}
          </button>
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
          <SignalSection title="Top GTM Signal" signals={[brief.topSignal]} featured />
          <SignalSection title="Industry News" signals={brief.industryNews} />
          <SignalSection title="What Competitors Are Up To" signals={brief.competitorSignals} />
          <section className="section take-section yellow-section">
            <p className="section-label">Point of view</p>
            <h3>{brief.companyName}&apos;s Take</h3>
            <p>{brief.companyTake}</p>
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

function SignalSection({
  title,
  signals,
  featured = false
}: {
  title: string;
  signals: NewsletterBrief["industryNews"];
  featured?: boolean;
}) {
  return (
    <section className={`section ${featured ? "yellow-section" : ""}`}>
      <p className="section-label">{featured ? "Priority signal" : "Live intelligence"}</p>
      <h3>{title}</h3>
      <div className="signal-list">
        {signals.map((signal) => (
          <div className={`signal-card ${featured ? "featured" : ""}`} key={`${title}-${signal.title}`}>
            <div className="signal-title-row">
              <h4>{signal.title}</h4>
              <span className={`urgency ${signal.urgency.toLowerCase()}`}>{signal.urgency}</span>
            </div>
            <div className="signal-meta">
              <span>{signal.category}</span>
              <span>{signal.timeframe}</span>
            </div>
            <p>{signal.summary}</p>
            <div className="signal-analysis">
              <p><strong>Why it matters</strong>{signal.whyNow}</p>
              <p><strong>Recommended action</strong>{signal.recommendedAction}</p>
            </div>
            {signal.sources.length ? (
              <div className="sources">
                <span>Sources</span>
                {signal.sources.map((source) => (
                  <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                    {source.title || source.url} <ArrowRight size={13} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}
