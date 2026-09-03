import { FAILED_LEAD_STATUS, PENDING_LEAD_STATUSES, SUCCESS_LEAD_STATUS } from "../config/constants";
import { config } from "../config/env";
import { parseDashboardLeadList } from "./mapLead";
import type { DashboardLead, LeadStatusUpdate, OutreachUpdateStatus } from "./types";

function leadsUrl(statusFilter = true): string {
  const base = config.dashboardApiUrl.replace(/\/+$/, "");
  const path = config.dashboardLeadsPath.startsWith("/")
    ? config.dashboardLeadsPath
    : `/${config.dashboardLeadsPath}`;
  const url = new URL(`${base}${path}`);
  if (statusFilter) {
    url.searchParams.set("status", PENDING_LEAD_STATUSES.join(","));
  }
  return url.toString();
}

function leadUrl(id: string): string {
  return `${leadsUrl(false).replace(/\?.*$/, "")}/${encodeURIComponent(id)}`;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (config.dashboardApiKey) {
    headers.Authorization = `Bearer ${config.dashboardApiKey}`;
    headers["X-API-Key"] = config.dashboardApiKey;
  }
  return headers;
}

async function dashboardFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.dashboardTimeoutMs);
  try {
    return await fetch(url, {
      ...init,
      headers: { ...authHeaders(), ...(init.headers ?? {}) },
      signal: controller.signal,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Dashboard request failed (${url}): ${reason}`);
  } finally {
    clearTimeout(timer);
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Dashboard returned non-JSON (${response.status}): ${text.slice(0, 180)}`);
  }
}

export async function fetchLeads(
  statuses: string[] = [...PENDING_LEAD_STATUSES],
): Promise<DashboardLead[]> {
  const base = config.dashboardApiUrl.replace(/\/+$/, "");
  const path = config.dashboardLeadsPath.startsWith("/")
    ? config.dashboardLeadsPath
    : `/${config.dashboardLeadsPath}`;
  const url = new URL(`${base}${path}`);
  if (statuses.length > 0) {
    url.searchParams.set("status", statuses.join(","));
  }
  const response = await dashboardFetch(url.toString());
  if (response.status === 401 || response.status === 403) {
    throw new Error("Dashboard rejected the API key. Check DASHBOARD_API_KEY.");
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`fetchLeads failed (${response.status}): ${body.slice(0, 180)}`);
  }
  const payload = await readJson(response);
  const leads = parseDashboardLeadList(payload);
  if (statuses.length === 0) return leads;
  return leads.filter((lead) => statuses.includes(lead.status));
}

export async function extractPendingLeads(): Promise<DashboardLead[]> {
  return fetchLeads([...PENDING_LEAD_STATUSES]);
}

function dashboardStatus(status: OutreachUpdateStatus): "CONTACTED" | "FAILED" {
  if (status === "FAILED") return FAILED_LEAD_STATUS;
  return SUCCESS_LEAD_STATUS;
}

export async function updateLeadStatus(
  id: string,
  status: OutreachUpdateStatus,
  extra: Omit<LeadStatusUpdate, "status"> = {},
): Promise<void> {
  const contacted_at = extra.contacted_at ?? new Date().toISOString();
  const body = {
    status: dashboardStatus(status),
    outreach_status: status,
    subject: extra.subject,
    contacted_at,
    error: extra.error,
    error_reason: extra.error,
  };

  const response = await dashboardFetch(leadUrl(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  if (response.status === 405) {
    const retry = await dashboardFetch(leadUrl(id), {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!retry.ok) {
      const text = await retry.text();
      throw new Error(`updateLeadStatus PUT failed (${retry.status}): ${text.slice(0, 180)}`);
    }
    return;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`updateLeadStatus failed (${response.status}): ${text.slice(0, 180)}`);
  }
}
