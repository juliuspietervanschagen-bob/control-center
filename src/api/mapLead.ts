import type { LanguagePreference, Lead } from "../config/types";
import type { DashboardLead, DashboardLeadStatus } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function normalizeLanguage(value: string): LanguagePreference {
  const normalized = value.trim().toLowerCase();
  if (["nl", "dutch", "nederlands"].includes(normalized)) return "nl";
  return "en";
}

function normalizeStatus(value: string): DashboardLeadStatus {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (normalized === "UNCONTACTED" || normalized === "NEW") return "UNCONTACTED";
  if (normalized === "CONTACTED" || normalized === "SENT") return "CONTACTED";
  if (normalized === "FAILED" || normalized === "ERROR") return "FAILED";
  return "PENDING";
}

export function parseDashboardLead(raw: unknown): DashboardLead {
  const row = asRecord(raw);
  if (!row) {
    throw new Error("Dashboard lead payload is not an object.");
  }

  const id = stringField(row, "id", "lead_id", "uuid");
  const company_name = stringField(row, "company_name", "companyName", "company", "name");
  const email = stringField(row, "email", "contact_email", "contactEmail", "email_address");
  const industry = stringField(row, "industry", "sector", "vertical");

  if (!id) throw new Error("Dashboard lead is missing id.");
  if (!company_name) throw new Error(`Dashboard lead ${id} is missing company_name.`);
  if (!email) throw new Error(`Dashboard lead ${id} is missing email.`);

  return {
    id,
    company_name,
    email: email.toLowerCase(),
    industry: industry || "unspecified",
    language: stringField(row, "language") || undefined,
    language_preference:
      stringField(row, "language_preference", "languagePreference") || undefined,
    website: stringField(row, "website", "url", "site") || undefined,
    status: normalizeStatus(stringField(row, "status", "outreach_status") || "PENDING"),
  };
}

export function parseDashboardLeadList(payload: unknown): DashboardLead[] {
  if (Array.isArray(payload)) {
    return payload.map(parseDashboardLead);
  }
  const row = asRecord(payload);
  if (!row) return [];
  const list = row.leads ?? row.data ?? row.results ?? row.items;
  if (!Array.isArray(list)) return [];
  return list.map(parseDashboardLead);
}

export function toPipelineLead(lead: DashboardLead): Lead {
  const languageSource = lead.language_preference || lead.language || "en";
  return {
    dashboardId: lead.id,
    companyName: lead.company_name,
    contactEmail: lead.email,
    industry: lead.industry,
    languagePreference: normalizeLanguage(languageSource),
    website: lead.website,
  };
}
