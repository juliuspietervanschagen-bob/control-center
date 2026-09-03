import fs from "node:fs";
import path from "node:path";
import type { CampaignRecord } from "../config/types";
import { config, ensureDir } from "../config/env";

interface CampaignStateFile {
  sent: CampaignRecord[];
}

function emptyState(): CampaignStateFile {
  return { sent: [] };
}

function readState(): CampaignStateFile {
  if (!fs.existsSync(config.campaignStatePath)) {
    return emptyState();
  }
  const raw = fs.readFileSync(config.campaignStatePath, "utf8");
  if (!raw.trim()) return emptyState();
  const parsed = JSON.parse(raw) as CampaignStateFile;
  return {
    sent: Array.isArray(parsed.sent) ? parsed.sent : [],
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
  writeState(state);
}

export function listSent(): CampaignRecord[] {
  return readState().sent;
}
