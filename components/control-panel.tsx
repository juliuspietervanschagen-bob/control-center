"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

const STAGES = [
  { key: "PENDING_GENERATION", label: "Pending generation" },
  { key: "READY_FOR_REVIEW", label: "Ready for review" },
  { key: "SENT", label: "Sent" },
] as const;

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
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");

  const active = leads.find((lead) => lead.id === activeId) ?? null;

  const grouped = useMemo(() => {
    return {
      PENDING_GENERATION: leads.filter((lead) => lead.stage === "PENDING_GENERATION"),
      READY_FOR_REVIEW: leads.filter((lead) => lead.stage === "READY_FOR_REVIEW"),
      SENT: leads.filter((lead) => lead.stage === "SENT"),
    };
  }, [leads]);

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
        setActiveId(id);
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

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <div>
            <p className="text-[11px] font-medium tracking-[0.22em] text-zinc-500 uppercase">
              JR Intelligence
            </p>
            <h1 className="mt-1 text-xl font-medium tracking-tight text-zinc-950">Control Center</h1>
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" />
            Loading leads
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {STAGES.map((stage) => (
              <section key={stage.key} className="min-h-[70vh] rounded-lg border border-zinc-200 bg-white">
                <div className="flex items-baseline justify-between border-b border-zinc-100 px-4 py-3">
                  <h2 className="text-sm font-medium text-zinc-950">{stage.label}</h2>
                  <span className="text-xs text-zinc-400">{grouped[stage.key].length}</span>
                </div>
                <div className="space-y-2 p-3">
                  {grouped[stage.key].length === 0 ? (
                    <p className="px-2 py-10 text-center text-sm text-zinc-400">
                      Nothing in this stage.
                    </p>
                  ) : (
                    grouped[stage.key].map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => setActiveId(lead.id)}
                        className={cn(
                          "w-full rounded-md border border-zinc-200 bg-white px-3 py-3 text-left transition-colors hover:border-zinc-400 hover:bg-zinc-50",
                          activeId === lead.id && "border-zinc-950",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-zinc-950">{lead.companyName}</p>
                          <span className="text-[10px] tracking-wide text-zinc-400 uppercase">
                            {lead.language}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-zinc-500">{lead.industry}</p>
                        <p className="mt-2 truncate text-xs text-zinc-400">{lead.email}</p>
                      </button>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Sheet open={Boolean(active)} onOpenChange={(open) => !open && setActiveId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {active ? (
            <div className="flex h-full flex-col">
              <SheetHeader className="text-left">
                <SheetTitle className="text-lg font-medium">{active.companyName}</SheetTitle>
                <SheetDescription>
                  {active.industry} · {active.email}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex flex-wrap gap-2">
                {active.stage !== "SENT" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void generateDraft(active.id)}
                    disabled={generatingId === active.id}
                    className="rounded-md"
                  >
                    {generatingId === active.id ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {generatingId === active.id
                      ? "Analyzing webshop & generating..."
                      : "Generate draft"}
                  </Button>
                ) : null}
                {active.stage !== "SENT" && (active.bodyText || bodyText) ? (
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
                ) : null}
                {active.stage !== "SENT" && bodyText ? (
                  <Button
                    size="sm"
                    onClick={() => void sendComplete()}
                    disabled={sending}
                    className="rounded-md"
                  >
                    {sending ? <Loader2 className="animate-spin" /> : <Send />}
                    Send & complete
                  </Button>
                ) : null}
              </div>

              {generatingId === active.id ? (
                <p className="mt-4 text-sm leading-6 text-zinc-500">
                  Analyzing webshop & generating...
                </p>
              ) : null}

              {active.error && generatingId !== active.id ? (
                <p className="mt-4 border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  {active.error}
                </p>
              ) : null}

              <Separator className="my-6" />

              {generatingId === active.id ? (
                <p className="text-sm leading-6 text-zinc-500">
                  Analyzing webshop & generating...
                </p>
              ) : active.stage === "PENDING_GENERATION" && !bodyText ? (
                <p className="text-sm leading-6 text-zinc-500">
                  Generate a draft to audit this site in {active.language === "nl" ? "Dutch" : "English"}:
                  greeting, JR Intelligence intro, three specific bullets, a short solution, then a soft CTA.
                  Target 85–150 words.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                      Subject
                    </label>
                    <Input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      disabled={active.stage === "SENT"}
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
                      disabled={active.stage === "SENT"}
                      className="min-h-48 rounded-md font-[inherit] text-sm leading-6"
                    />
                  </div>
                  {active.html ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                        Preview
                      </p>
                      <ScrollArea className="h-80 rounded-md border border-zinc-200 bg-white">
                        <iframe
                          title="Email preview"
                          className="h-[640px] w-full bg-white"
                          srcDoc={active.html}
                        />
                      </ScrollArea>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
