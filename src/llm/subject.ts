import type { Lead } from "../config/types";
import { MAX_SUBJECT_WORDS } from "../config/constants";
import { completePrompt } from "./client";
import { assertSubjectConstraints, sanitizeSubject } from "./constraints";

const INDUSTRY_SUBJECTS: Record<string, { en: string; nl: string }> = {
  florist: { en: "Your shop window online", nl: "Jullie etalage, online" },
  outdoor: { en: "Your outdoor catalog site", nl: "Jullie outdoor webshop" },
  ceramic: { en: "A note on your studio site", nl: "Over jullie atelier-site" },
  logistic: { en: "Your logistics web presence", nl: "Jullie logistieke website" },
  baker: { en: "Your bakery on the web", nl: "Jullie bakkerij online" },
  light: { en: "Your lighting product pages", nl: "Jullie verlichtingspagina's" },
};

function fallbackSubject(lead: Lead): string {
  const industry = lead.industry.toLowerCase();
  for (const [key, value] of Object.entries(INDUSTRY_SUBJECTS)) {
    if (industry.includes(key)) return value[lead.languagePreference];
  }
  return lead.languagePreference === "nl"
    ? "Over jullie website"
    : "A note on your website";
}

function subjectSystemPrompt(): string {
  return [
    "You write B2B cold-email subject lines for JR Intelligence.",
    `Return only the subject line. No quotes. Under ${MAX_SUBJECT_WORDS + 1} words (max ${MAX_SUBJECT_WORDS} words).`,
    "It must sound like a person, not a campaign. No clickbait, no emoji, no exclamation marks.",
    "Ground it in the company's industry or website, not in a sales pitch.",
    "Banned: delve, testament, tapestry, seamless, unlock, game-changer, limited time.",
  ].join(" ");
}

export async function generateSubjectLine(lead: Lead): Promise<{
  subject: string;
  composer: "openai" | "local";
}> {
  const user = [
    `Company: ${lead.companyName}`,
    `Industry: ${lead.industry}`,
    `Language: ${lead.languagePreference === "nl" ? "Dutch" : "English"}`,
  ].join("\n");

  const llm = await completePrompt(subjectSystemPrompt(), user);
  if (llm) {
    try {
      const subject = sanitizeSubject(llm);
      assertSubjectConstraints(subject);
      return { subject, composer: "openai" };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`OpenAI subject rejected (${reason}). Using local composer.`);
    }
  }

  const subject = fallbackSubject(lead);
  assertSubjectConstraints(subject);
  return { subject, composer: "local" };
}
