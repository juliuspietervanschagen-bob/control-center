import fs from "node:fs";
import path from "node:path";
import type { CampaignRecord } from "../config/types";
import { config, ensureDir } from "../config/env";

interface CampaignStateFile {
  sent: CampaignRecord[];
  processedLeadIds: string[];
}

function emptyState(): CampaignStateFile {
  return { sent: [], processedLeadIds: [] };
}

function readState(): CampaignStateFile {
  if (!fs.existsSync(config.campaignStatePath)) {
    return emptyState();
  }
  const raw = fs.readFileSync(config.campaignStatePath, "utf8");
  if (!raw.trim()) return emptyState();
  const parsed = JSON.parse(raw) as Partial<CampaignStateFile>;
  return {
    sent: Array.isArray(parsed.sent) ? parsed.sent : [],
    processedLeadIds: Array.isArray(parsed.processedLeadIds) ? parsed.processedLeadIds : [],
  };
}

function writeState(state: CampaignStateFile): void {
  ensureDir(path.dirname(config.campaignStatePath));
  fs.writeFileSync(
    config.campaignStatePath,
    JSON.stringify(state, null, 2) + "\n",
    "utf8",
  );
}

export function hasBeenEmailed(contactEmail: string): boolean {
  const needle = contactEmail.trim().toLowerCase();
  return readState().sent.some(
    (record) => record.contactEmail === needle && record.dryRun === false,
  );
}

export function recordSend(record: CampaignRecord): void {
  const state = readState();
  state.sent.push({
    ...record,
    contactEmail: record.contactEmail.trim().toLowerCase(),
  });
  if (record.dashboardId && record.dryRun === false) {
    const id = record.dashboardId.trim();
    if (id && !state.processedLeadIds.includes(id)) {
      state.processedLeadIds.push(id);
    }
  }
  writeState(state);
}

export function listSent(): CampaignRecord[] {
  return readState().sent;
}

export function hasProcessedLeadId(id: string): boolean {
  return readState().processedLeadIds.includes(id.trim());
}

export function markProcessedLeadId(id: string): void {
  const state = readState();
  const normalized = id.trim();
  if (!normalized || state.processedLeadIds.includes(normalized)) return;
  state.processedLeadIds.push(normalized);
  writeState(state);
}

export function processedLeadIdSet(): Set<string> {
  return new Set(readState().processedLeadIds);
}
