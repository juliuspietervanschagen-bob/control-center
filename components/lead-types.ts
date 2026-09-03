export type LeadRecord = {
  id: string;
  dashboardId: string;
  companyName: string;
  email: string;
  industry: string;
  language: string;
  website: string | null;
  stage: "PENDING_GENERATION" | "READY_FOR_REVIEW" | "SENT" | string;
  subject: string | null;
  bodyText: string | null;
  html: string | null;
  error: string | null;
  generatedAt: string | null;
  sentAt: string | null;
};
