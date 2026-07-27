import { Resend } from "resend";
import { optionalEnv, requiredEnv } from "@/lib/config";
import type { NewsletterBrief, Prospect, Signal } from "@/lib/types";

export async function sendNewsletter(brief: NewsletterBrief) {
  const to = optionalEnv("NEWSLETTER_TO");
  if (!to) {
    return {
      message:
        "Newsletter rendered successfully. Set NEWSLETTER_TO and RESEND_API_KEY to enable email delivery."
    };
  }

  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  const from = optionalEnv("NEWSLETTER_FROM") ?? "Nimble GTM Signal <onboarding@resend.dev>";
  await resend.emails.send({
    from,
    to,
    subject: `${brief.title}: ${brief.topProspect.companyName}`,
    html: renderEmail(brief)
  });

  return { message: `Newsletter sent to ${to}.` };
}

function renderEmail(brief: NewsletterBrief) {
  return `
    <main style="font-family: Arial, sans-serif; color: #171717; line-height: 1.55;">
      <h1>${escapeHtml(brief.title)}</h1>
      <p>${escapeHtml(brief.subtitle)}</p>
      <p><strong>Generated:</strong> ${escapeHtml(brief.generatedAt)}</p>
      <p>${escapeHtml(brief.intro)}</p>
      ${renderProspect(brief.topProspect)}
      ${renderSignals("Industry News In 24 Hours", brief.industryNews)}
      ${renderSignals("What Competitors Are Up To", brief.competitorSignals)}
      <section style="background: #ffe75f; border-left: 7px solid #171717; padding: 22px 24px; margin-top: 24px;">
        <h2 style="margin-top: 0;">Nimble's Take</h2>
        <p style="margin-bottom: 0;">${escapeHtml(brief.competitorTake)}</p>
      </section>
      <h2>Your Moves Today</h2>
      <ul>
        ${brief.movesToday
          .map((move) => `<li><strong>${escapeHtml(move.title)}:</strong> ${escapeHtml(move.action)}</li>`)
          .join("")}
      </ul>
    </main>
  `;
}

function renderSignals(title: string, signals: Signal[]) {
  return `<h2>${escapeHtml(title)}</h2>${signals.map(renderSignal).join("")}`;
}

function renderProspect(prospect: Prospect) {
  return `
    <h2>Today's Top Prospect</h2>
    <section style="background: #ffe75f; border-left: 7px solid #171717; padding: 22px 24px; margin-top: 12px;">
      <h3>${escapeHtml(prospect.companyName)}</h3>
      <p>${escapeHtml(prospect.trigger)}</p>
      <p><strong>Why they fit:</strong> ${escapeHtml(prospect.fit)}</p>
      <p><strong>Why now:</strong> ${escapeHtml(prospect.whyNow)}</p>
      <p><strong>Recommended action:</strong> ${escapeHtml(prospect.recommendedAction)}</p>
      <ul>
        ${prospect.sources
          .map((source) => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.title || source.url)}</a></li>`)
          .join("")}
      </ul>
    </section>
  `;
}

function renderSignal(signal: Signal) {
  return `
    <section style="border-top: 1px solid #deded5; padding-top: 12px; margin-top: 12px;">
      <h3>${escapeHtml(signal.title)}</h3>
      <p>${escapeHtml(signal.summary)}</p>
      <p><strong>Why it matters:</strong> ${escapeHtml(signal.whyItMatters)}</p>
      ${signal.nimbleTake ? `<p><strong>Nimble's Take:</strong> ${escapeHtml(signal.nimbleTake)}</p>` : ""}
      <ul>
        ${signal.sources
          .map((source) => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.title || source.url)}</a></li>`)
          .join("")}
      </ul>
    </section>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
