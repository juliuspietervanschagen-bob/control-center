import { processedLeadIdSet } from "./campaignState";

const memoryIds = new Set<string>();

export function loadIdempotencyCache(): Set<string> {
  for (const id of processedLeadIdSet()) {
    memoryIds.add(id);
  }
  return memoryIds;
}

export function isProcessed(id: string): boolean {
  return memoryIds.has(id) || processedLeadIdSet().has(id);
}

export function rememberProcessed(id: string): void {
  memoryIds.add(id);
}
