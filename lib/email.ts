import { Resend } from "resend";
import { optionalEnv, requiredEnv } from "@/lib/config";
import type { NewsletterBrief, Signal } from "@/lib/types";

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
    subject: `${brief.title}: ${brief.topSignal.title}`,
    html: renderEmail(brief)
  });

  return { message: `Newsletter sent to ${to}.` };
}

function renderEmail(brief: NewsletterBrief) {
  return `
    <main style="font-family: Arial, sans-serif; color: #132033; line-height: 1.55;">
      <h1>${escapeHtml(brief.title)}</h1>
      <p>${escapeHtml(brief.subtitle)}</p>
      <p><strong>Generated:</strong> ${escapeHtml(brief.generatedAt)}</p>
      <p>${escapeHtml(brief.intro)}</p>
      ${renderSignal("Today's Top GTM Signal", brief.topSignal)}
      ${renderSignals("Industry News In 24 Hours", brief.industryNews)}
      ${renderSignals("What Competitors Are Up To", brief.competitorSignals)}
      <h2>${escapeHtml(brief.companyName)}'s Take</h2>
      <p>${escapeHtml(brief.companyTake)}</p>
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
  return `<h2>${escapeHtml(title)}</h2>${signals.map((signal) => renderSignal("", signal)).join("")}`;
}

function renderSignal(title: string, signal: Signal) {
  return `
    ${title ? `<h2>${escapeHtml(title)}</h2>` : ""}
    <section style="border-top: 1px solid #dbe3ee; padding-top: 12px; margin-top: 12px;">
      <h3>${escapeHtml(signal.title)}</h3>
      <p><strong>${signal.urgency} urgency</strong> | ${escapeHtml(signal.category)} | ${escapeHtml(signal.timeframe)}</p>
      <p>${escapeHtml(signal.summary)}</p>
      <p><strong>Why now:</strong> ${escapeHtml(signal.whyNow)}</p>
      <p><strong>Recommended action:</strong> ${escapeHtml(signal.recommendedAction)}</p>
      <ul>
        ${signal.sources
          .map((source) => `<li><a href="${source.url}">${escapeHtml(source.title || source.url)}</a></li>`)
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
