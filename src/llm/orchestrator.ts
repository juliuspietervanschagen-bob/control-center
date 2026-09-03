import type { GeneratedEmail, Lead } from "../config/types";
import { compileEmailHtml } from "../templates/compile";
import { generateEmailBody, bodyWordCount } from "./copywriter";
import { generateSubjectLine } from "./subject";

export async function orchestrateEmail(lead: Lead): Promise<GeneratedEmail> {
  const subjectResult = await generateSubjectLine(lead);
  const bodyResult = await generateEmailBody(lead);
  const html = await compileEmailHtml({
    lead,
    subject: subjectResult.subject,
    bodyText: bodyResult.bodyText,
  });

  return {
    lead,
    subject: subjectResult.subject,
    bodyText: bodyResult.bodyText,
    html,
    wordCount: bodyWordCount(bodyResult.bodyText),
    composer:
      subjectResult.composer === "openai" || bodyResult.composer === "openai"
        ? "openai"
        : "local",
  };
}
