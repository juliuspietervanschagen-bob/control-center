import { compileEmailHtml } from "../src/templates/compile";
import { orchestrateEmail } from "../src/llm/orchestrator";
import { wordCount } from "../src/llm/constraints";
import type { Lead } from "../src/config/types";
import type { LanguagePreference } from "../src/config/types";
import { analyzeWebsite } from "./scraper";

export async function generateDraft(input: {
  companyName: string;
  email: string;
  industry: string;
  language: string;
  website?: string | null;
  dashboardId: string;
}) {
  const analysis = await analyzeWebsite(input.website);
  const lead: Lead = {
    companyName: input.companyName,
    contactEmail: input.email,
    industry: input.industry,
    languagePreference: input.language === "nl" ? "nl" : "en",
    website: analysis.url ?? input.website ?? undefined,
    dashboardId: input.dashboardId,
    siteMarkdown: analysis.markdown,
  };
  const generated = await orchestrateEmail(lead);
  return {
    subject: generated.subject,
    bodyText: generated.bodyText,
    html: generated.html,
    wordCount: generated.wordCount,
    composer: generated.composer,
    analysisSource: analysis.source,
  };
}

export async function compileEditedEmail(input: {
  companyName: string;
  email: string;
  industry: string;
  language: string;
  website?: string | null;
  dashboardId: string;
  subject: string;
  bodyText: string;
}) {
  const language: LanguagePreference = input.language === "nl" ? "nl" : "en";
  const html = await compileEmailHtml({
    lead: {
      companyName: input.companyName,
      contactEmail: input.email,
      industry: input.industry,
      languagePreference: language,
      website: input.website ?? undefined,
      dashboardId: input.dashboardId,
    },
    subject: input.subject,
    bodyText: input.bodyText,
  });
  return {
    html,
    wordCount: wordCount(input.bodyText),
  };
}
