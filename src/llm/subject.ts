import type { Lead } from "../config/types";
import { adviceSubject, inferSiteKind } from "./siteKind";

export async function generateSubjectLine(lead: Lead): Promise<{
  subject: string;
  composer: "local";
}> {
  const kind = inferSiteKind(lead);
  return {
    subject: adviceSubject(lead.languagePreference, kind),
    composer: "local",
  };
}
