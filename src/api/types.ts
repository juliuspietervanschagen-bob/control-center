import { PENDING_LEAD_STATUSES } from "../config/constants";

export type DashboardLeadStatus =
  | "PENDING"
  | "UNCONTACTED"
  | "CONTACTED"
  | "SENT"
  | "FAILED";

export type PendingLeadStatus = (typeof PENDING_LEAD_STATUSES)[number];

export type OutreachUpdateStatus = "SENT" | "FAILED" | "CONTACTED";

export interface DashboardLead {
  id: string;
  company_name: string;
  email: string;
  industry: string;
  language?: string;
  language_preference?: string;
  website?: string;
  status: DashboardLeadStatus;
  subject?: string;
  contacted_at?: string;
  error?: string;
}

export interface LeadStatusUpdate {
  status: OutreachUpdateStatus;
  subject?: string;
  contacted_at?: string;
  error?: string;
}

export interface DashboardListResponse {
  leads: DashboardLead[];
}
