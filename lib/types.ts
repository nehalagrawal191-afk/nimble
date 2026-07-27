import { z } from "zod";

export const sourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  publisher: z.string().optional(),
  date: z.string().optional()
});

export const signalSchema = z.object({
  title: z.string(),
  category: z.string(),
  urgency: z.enum(["High", "Medium", "Low"]),
  timeframe: z.string(),
  summary: z.string(),
  whyNow: z.string(),
  recommendedAction: z.string(),
  sources: z.array(sourceSchema)
});

export const moveSchema = z.object({
  title: z.string(),
  action: z.string()
});

export const newsletterBriefSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  generatedAt: z.string(),
  intro: z.string(),
  topSignal: signalSchema,
  industryNews: z.array(signalSchema),
  competitorSignals: z.array(signalSchema),
  nimbleTake: z.string(),
  movesToday: z.array(moveSchema)
});

export type Source = z.infer<typeof sourceSchema>;
export type Signal = z.infer<typeof signalSchema>;
export type NewsletterBrief = z.infer<typeof newsletterBriefSchema>;

export type AgentInput = {
  prompt: string;
  competitors: string[];
};

export type SearchResult = {
  title: string;
  url: string;
  description: string;
  publisher?: string;
  date?: string;
};

export type ExtractedPage = {
  url: string;
  title: string;
  text: string;
};
