import { z } from "zod";

export const sourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  publisher: z.string().optional(),
  date: z.string().optional()
});

export const prospectSchema = z.object({
  companyName: z.string(),
  trigger: z.string(),
  fit: z.string(),
  whyNow: z.string(),
  recommendedAction: z.string(),
  sources: z.array(sourceSchema).min(1)
});

export const signalSchema = z.object({
  title: z.string(),
  summary: z.string(),
  whyItMatters: z.string(),
  nimbleTake: z.string().optional(),
  sources: z.array(sourceSchema).min(1)
});

export const competitorSignalSchema = signalSchema.extend({
  companyName: z.string()
});

export const moveSchema = z.object({
  title: z.string(),
  action: z.string()
});

export const companyProfileSchema = z.object({
  website: z.string().url(),
  companyName: z.string().min(1),
  overview: z.string().min(1),
  products: z.array(z.string()).min(1),
  competitors: z.array(z.string()).min(1),
  coverage: z.string().min(1),
  icp: z.string().min(1),
  targetMarkets: z.string().min(1)
});

export const newsletterBriefSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  title: z.string(),
  subtitle: z.string(),
  generatedAt: z.string(),
  intro: z.string(),
  topProspect: prospectSchema,
  industryNews: z.array(signalSchema).length(3),
  competitorSignals: z.array(competitorSignalSchema).length(3),
  competitorTake: z.string(),
  movesToday: z.array(moveSchema).length(3)
});

export type Source = z.infer<typeof sourceSchema>;
export type Prospect = z.infer<typeof prospectSchema>;
export type Signal = z.infer<typeof signalSchema>;
export type CompetitorSignal = z.infer<typeof competitorSignalSchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type NewsletterBrief = z.infer<typeof newsletterBriefSchema>;

export type AgentInput = {
  profile: CompanyProfile;
};

export type SearchResult = {
  title: string;
  url: string;
  description: string;
  publisher?: string;
  date?: string;
  theme?: "prospect" | "industry" | "competitor";
};

export type ExtractedPage = {
  url: string;
  title: string;
  text: string;
};
