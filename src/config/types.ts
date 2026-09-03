export type LanguagePreference = "en" | "nl";

export interface Lead {
  companyName: string;
  contactEmail: string;
  industry: string;
  languagePreference: LanguagePreference;
  dashboardId?: string;
  website?: string;
}

export interface GeneratedEmail {
  lead: Lead;
  subject: string;
  bodyText: string;
  html: string;
  wordCount: number;
  composer: "openai" | "local";
}

export interface CampaignRecord {
  contactEmail: string;
  companyName: string;
  subject: string;
  sentAt: string;
  dryRun: boolean;
  messageId?: string;
  dashboardId?: string;
}

export type WorkerCommand = "csv" | "worker" | "test-dashboard";

export interface CliOptions {
  command: WorkerCommand;
  dryRun: boolean;
  preview: boolean;
  force: boolean;
  leadsPath?: string;
  limit?: number;
  skipJitter: boolean;
}
