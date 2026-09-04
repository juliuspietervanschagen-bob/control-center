"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, RefreshCw, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmailPreview } from "@/components/email-preview";
import { LeadList } from "@/components/lead-list";
import type { LeadRecord } from "@/components/lead-types";
import { cn } from "@/lib/utils";

function countWords(text: string): number {
  return text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
}

function wordCountOk(count: number): boolean {
  return count >= 85 && count <= 150;
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export function ControlPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("leadId");

  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");

  const active = leads.find((lead) => lead.id === activeId) ?? null;

  const selectLead = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("leadId", id);
      else params.delete("leadId");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      setEditing(false);
    },
    [pathname, router, searchParams],
  );

  const refresh = useCallback(async () => {
    const response = await fetch("/api/leads", { cache: "no-store" });
    if (!response.ok) throw new Error(await readError(response));
    const data = (await response.json()) as { leads: LeadRecord[] };
    setLeads(data.leads);
  }, []);

  useEffect(() => {
    refresh()
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Could not load leads.");
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!active) return;
    setSubject(active.subject ?? "");
    setBodyText(active.bodyText ?? "");
  }, [active]);

  async function syncLeads() {
    setSyncing(true);
    try {
      const response = await fetch("/api/leads/sync", { method: "POST" });
      const data = (await response.json()) as { leads?: LeadRecord[]; upserted?: number; error?: string };
      if (!response.ok) throw new Error(data.error || "Sync failed.");
      setLeads(data.leads ?? []);
      toast.success(`Synced ${data.upserted ?? 0} lead${data.upserted === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function generateDraft(id: string) {
    setGeneratingId(id);
    const toastId = toast.loading("Analyzing webshop & generating...");
    const started = Date.now();
    try {
      const response = await fetch(`/api/leads/${id}/generate`, { method: "POST" });
      const data = (await response.json()) as { lead?: LeadRecord; error?: string };
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      if (data.lead) {
        setLeads((current) => current.map((lead) => (lead.id === id ? data.lead! : lead)));
        selectLead(id);
        setSubject(data.lead.subject ?? "");
        setBodyText(data.lead.bodyText ?? "");
      }
      const hold = 900 - (Date.now() - started);
      if (hold > 0) await new Promise((resolve) => setTimeout(resolve, hold));
      toast.success("Draft ready for review.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed.", { id: toastId });
    } finally {
      setGeneratingId(null);
    }
  }

  async function saveDraft() {
    if (!active) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, bodyText }),
      });
      const data = (await response.json()) as { lead?: LeadRecord; error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save draft.");
      if (data.lead) {
        setLeads((current) => current.map((lead) => (lead.id === active.id ? data.lead! : lead)));
      }
      toast.success("Draft saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function sendComplete() {
    if (!active) return;
    setSending(true);
    try {
      const response = await fetch(`/api/leads/${active.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, bodyText }),
      });
      const data = (await response.json()) as {
        lead?: LeadRecord;
        error?: string;
        warning?: string;
        mocked?: boolean;
      };
      if (!response.ok) throw new Error(data.error || "Send failed.");
      if (data.lead) {
        setLeads((current) => current.map((lead) => (lead.id === active.id ? data.lead! : lead)));
      } else {
        await refresh();
      }
      setEditing(false);
      if (data.warning) {
        toast.error(data.warning);
      } else if (data.mocked) {
        toast.success("Marked sent. SMTP mock is on — set SMTP_MOCK=false for live delivery.");
      } else {
        toast.success("Sent and marked contacted.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }

  const words = countWords(bodyText);
  const wordOk = wordCountOk(words);
  const canEdit = Boolean(active && active.stage !== "SENT");
  const isGenerating = Boolean(active && generatingId === active.id);

  return (
    <div className="flex h-svh min-h-0 flex-col bg-white">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 md:px-6">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-zinc-500 uppercase">
            JR Intelligence
          </p>
          <h1 className="text-base font-medium tracking-tight text-zinc-950">Control Center</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => void syncLeads()}
          disabled={syncing}
          className="rounded-md border-zinc-200"
        >
          {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Sync leads
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "min-h-0 w-full shrink-0 overflow-y-auto border-zinc-200 bg-white md:w-[36%] md:border-r lg:w-[32%]",
            active ? "hidden md:block" : "block",
          )}
        >
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-zinc-500">
              <Loader2 className="size-4 animate-spin" />
              Loading leads
            </div>
          ) : leads.length === 0 ? (
            <p className="px-4 py-10 text-sm text-zinc-500">
              No leads yet. Sync to pull pending contacts from the dashboard.
            </p>
          ) : (
            <LeadList
              leads={leads}
              activeId={activeId}
              generatingId={generatingId}
              onSelect={selectLead}
            />
          )}
        </aside>

        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-50",
            active ? "flex" : "hidden md:flex",
          )}
        >
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <p className="text-[11px] font-medium tracking-[0.18em] text-zinc-400 uppercase">
                Inbox
              </p>
              <p className="mt-3 text-sm text-zinc-500">Select a lead to view</p>
            </div>
          ) : (
            <>
              <div className="sticky top-0 z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="md:hidden"
                      onClick={() => selectLead(null)}
                      aria-label="Back to leads"
                    >
                      <ArrowLeft />
                    </Button>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-950">{active.companyName}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {active.industry} · {active.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canEdit ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void generateDraft(active.id)}
                      disabled={isGenerating}
                      className="rounded-md"
                    >
                      {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                      {isGenerating ? "Analyzing webshop & generating..." : "Regenerate"}
                    </Button>
                  ) : null}
                  {canEdit && (active.bodyText || bodyText) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing((open) => !open)}
                      className="rounded-md"
                    >
                      <Pencil />
                      {editing ? "Close editor" : "Edit Email"}
                    </Button>
                  ) : null}
                  {canEdit && bodyText ? (
                    <Button
                      size="sm"
                      onClick={() => void sendComplete()}
                      disabled={sending}
                      className="rounded-md"
                    >
                      {sending ? <Loader2 className="animate-spin" /> : <Send />}
                      Send via SMTP
                    </Button>
                  ) : null}
                </div>
              </div>

              {isGenerating ? (
                <p className="border-b border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500 md:px-6">
                  Analyzing webshop & generating...
                </p>
              ) : null}

              {active.error && !isGenerating ? (
                <p className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 md:px-6">
                  {active.error}
                </p>
              ) : null}

              {editing && canEdit ? (
                <div className="shrink-0 space-y-3 border-b border-zinc-200 bg-white px-4 py-4 md:px-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                      Subject
                    </label>
                    <Input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      className="rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                        Body
                      </label>
                      <span className={cn("text-xs", wordOk ? "text-zinc-400" : "text-zinc-950")}>
                        {words} / 85–150
                      </span>
                    </div>
                    <Textarea
                      value={bodyText}
                      onChange={(event) => setBodyText(event.target.value)}
                      className="min-h-36 rounded-md font-[inherit] text-sm leading-6"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void saveDraft()}
                    disabled={saving}
                    className="rounded-md"
                  >
                    {saving ? <Loader2 className="animate-spin" /> : null}
                    Save edits
                  </Button>
                </div>
              ) : null}

              <div className="min-h-0 flex-1 overflow-y-auto">
                {isGenerating ? (
                  <div className="flex h-full items-center justify-center px-8 text-sm text-zinc-500">
                    Analyzing webshop & generating...
                  </div>
                ) : active.html ? (
                  <EmailPreview
                    key={`${active.id}-${active.generatedAt ?? ""}-${active.html.length}`}
                    html={active.html}
                    title={`${active.companyName} email`}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                    <p className="text-sm text-zinc-600">
                      No draft yet. Generate one to audit this site in{" "}
                      {active.language === "nl" ? "Dutch" : "English"}.
                    </p>
                    <p className="mt-2 max-w-md text-xs leading-5 text-zinc-400">
                      Greeting, JR Intelligence intro, three specific bullets, a short solution, then a
                      soft CTA. Target 85–150 words.
                    </p>
                    {canEdit ? (
                      <Button
                        className="mt-5 rounded-md"
                        onClick={() => void generateDraft(active.id)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        Generate draft
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
