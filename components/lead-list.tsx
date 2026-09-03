"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadRecord } from "@/components/lead-types";

const STAGES = [
  { key: "PENDING_GENERATION", label: "Pending generation" },
  { key: "READY_FOR_REVIEW", label: "Ready for review" },
  { key: "SENT", label: "Sent" },
] as const;

function statusLabel(stage: string): string {
  if (stage === "PENDING_GENERATION") return "Pending";
  if (stage === "READY_FOR_REVIEW") return "Ready";
  if (stage === "SENT") return "Sent";
  return stage;
}

type LeadListProps = {
  leads: LeadRecord[];
  activeId: string | null;
  generatingId: string | null;
  onSelect: (id: string) => void;
};

export function LeadList({ leads, activeId, generatingId, onSelect }: LeadListProps) {
  return (
    <div className="flex h-full flex-col">
      {STAGES.map((stage) => {
        const items = leads.filter((lead) => lead.stage === stage.key);
        return (
          <section key={stage.key} className="border-b border-zinc-100 last:border-b-0">
            <div className="sticky top-0 z-10 flex items-baseline justify-between bg-white/95 px-4 py-2.5 backdrop-blur">
              <h2 className="text-[11px] font-medium tracking-[0.16em] text-zinc-500 uppercase">
                {stage.label}
              </h2>
              <span className="text-[11px] text-zinc-400">{items.length}</span>
            </div>
            {items.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-zinc-400">Nothing here yet.</p>
            ) : (
              <ul className="px-2 pb-2">
                {items.map((lead) => {
                  const selected = lead.id === activeId;
                  return (
                    <li key={lead.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(lead.id)}
                        aria-current={selected ? "true" : undefined}
                        className={cn(
                          "mb-1 w-full rounded-md border px-3 py-2.5 text-left transition-colors",
                          selected
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-transparent bg-white hover:bg-zinc-50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className={cn(
                              "truncate text-sm font-medium",
                              selected ? "text-white" : "text-zinc-950",
                            )}
                          >
                            {lead.companyName}
                          </p>
                          <span
                            className={cn(
                              "shrink-0 text-[10px] tracking-wide uppercase",
                              selected ? "text-zinc-300" : "text-zinc-400",
                            )}
                          >
                            {generatingId === lead.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              statusLabel(lead.stage)
                            )}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-1 truncate text-xs",
                            selected ? "text-zinc-300" : "text-zinc-500",
                          )}
                        >
                          {lead.subject || "No subject yet"}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
