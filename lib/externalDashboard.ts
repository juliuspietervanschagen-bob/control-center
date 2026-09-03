import { fetchLeads as pullLeads, updateLeadStatus as pushLeadStatus } from "../src/api/dashboardClient";
import { toPipelineLead } from "../src/api/mapLead";
import type { DashboardLead, OutreachUpdateStatus } from "../src/api/types";
import { prisma } from "./db";

export type PipelineStage = "PENDING_GENERATION" | "READY_FOR_REVIEW" | "SENT";

function stageFromDashboard(lead: DashboardLead, existingStage?: string | null): PipelineStage {
  if (lead.status === "CONTACTED" || lead.status === "SENT") return "SENT";
  if (existingStage === "READY_FOR_REVIEW" || existingStage === "SENT") {
    return existingStage;
  }
  return "PENDING_GENERATION";
}

export async function fetchLeads(): Promise<DashboardLead[]> {
  return pullLeads(["PENDING", "UNCONTACTED", "CONTACTED", "FAILED", "SENT"]);
}

export async function updateLeadStatus(
  id: string,
  status: OutreachUpdateStatus,
  extra: { subject?: string; error?: string; contacted_at?: string } = {},
): Promise<void> {
  await pushLeadStatus(id, status, extra);
}

export async function syncLeadsFromDashboard(): Promise<{ upserted: number }> {
  const remote = await fetchLeads();
  let upserted = 0;

  for (const lead of remote) {
    const existing = await prisma.lead.findUnique({ where: { dashboardId: lead.id } });
    const pipeline = toPipelineLead(lead);
    const stage = stageFromDashboard(lead, existing?.stage);

    await prisma.lead.upsert({
      where: { dashboardId: lead.id },
      create: {
        id: lead.id,
        dashboardId: lead.id,
        companyName: pipeline.companyName,
        email: pipeline.contactEmail,
        industry: pipeline.industry,
        language: pipeline.languagePreference,
        website: pipeline.website,
        dashboardStatus: lead.status,
        stage,
        syncedAt: new Date(),
      },
      update: {
        companyName: pipeline.companyName,
        email: pipeline.contactEmail,
        industry: pipeline.industry,
        language: pipeline.languagePreference,
        website: pipeline.website,
        dashboardStatus: lead.status,
        stage: existing?.stage === "SENT" ? "SENT" : stage,
        syncedAt: new Date(),
        ...(stage === "SENT" && !existing?.sentAt ? { sentAt: new Date() } : {}),
      },
    });
    upserted += 1;
  }

  return { upserted };
}
