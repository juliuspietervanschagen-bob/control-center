import cron from "node-cron";
import { extractPendingLeads, updateLeadStatus } from "./api/dashboardClient";
import { toPipelineLead } from "./api/mapLead";
import type { DashboardLead } from "./api/types";
import { config, hasOpenAiKey } from "./config/env";
import type { GeneratedEmail } from "./config/types";
import { hasBeenEmailed, markProcessedLeadId } from "./db/campaignState";
import { isProcessed, loadIdempotencyCache, rememberProcessed } from "./db/idempotency";
import { orchestrateEmail } from "./llm/orchestrator";
import { dispatchEmail, writeGalleryIndex } from "./mailer/dispatch";
import { formatDuration, randomInterval, wait } from "./mailer/jitter";
import { dashboardIsReachable, startMockDashboard } from "./mock/dashboardServer";

const JITTER_MIN_MS = 180_000;
const JITTER_MAX_MS = 540_000;

async function ensureDashboard(): Promise<void> {
  if (await dashboardIsReachable()) return;
  if (!config.dashboardUseMock) {
    throw new Error(
      `Dashboard is not reachable at ${config.dashboardApiUrl}. Set DASHBOARD_API_URL or enable DASHBOARD_USE_MOCK.`,
    );
  }
  startMockDashboard(config.dashboardMockPort);
  await wait(200);
  if (!(await dashboardIsReachable())) {
    throw new Error(`Mock dashboard failed to start on port ${config.dashboardMockPort}.`);
  }
  console.log(`Mock dashboard listening on ${config.dashboardApiUrl}`);
}

function isDue(lead: DashboardLead): boolean {
  if (isProcessed(lead.id)) return false;
  if (hasBeenEmailed(lead.email)) {
    rememberProcessed(lead.id);
    markProcessedLeadId(lead.id);
    return false;
  }
  return true;
}

async function processLead(
  lead: DashboardLead,
  dryRun: boolean,
): Promise<{ outcome: "sent" | "dry-run" | "failed"; email?: GeneratedEmail }> {
  const pipelineLead = toPipelineLead(lead);
  console.log(`Processing ${lead.company_name} <${lead.email}> [${lead.id}]`);

  try {
    const email = await orchestrateEmail(pipelineLead);
    const result = await dispatchEmail(email, { dryRun, force: false });

    if (result.status === "skipped") {
      if (!dryRun) {
        rememberProcessed(lead.id);
        markProcessedLeadId(lead.id);
      }
      console.log("Skipped: already in local send log.");
      return { outcome: "failed" };
    }

    if (!dryRun) {
      rememberProcessed(lead.id);
      markProcessedLeadId(lead.id);
      await updateLeadStatus(lead.id, "SENT", {
        subject: email.subject,
        contacted_at: new Date().toISOString(),
      });
    }

    console.log(
      `${result.status === "dry-run" ? "Generated" : "Sent"} · ${email.subject} · ${email.wordCount} words${
        result.path ? ` · ${result.path}` : ""
      }`,
    );
    return {
      outcome: result.status === "dry-run" ? "dry-run" : "sent",
      email,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`FAILED ${lead.id}: ${reason}`);
    if (!dryRun) {
      rememberProcessed(lead.id);
      markProcessedLeadId(lead.id);
      try {
        await updateLeadStatus(lead.id, "FAILED", { error: reason });
      } catch (syncError) {
        const syncReason = syncError instanceof Error ? syncError.message : String(syncError);
        console.error(`Could not report FAILED status for ${lead.id}: ${syncReason}`);
      }
    }
    return { outcome: "failed" };
  }
}

async function runQueue(options: { dryRun: boolean; limit?: number }): Promise<GeneratedEmail[]> {
  loadIdempotencyCache();
  const pending = await extractPendingLeads();
  const due = pending.filter(isDue);
  const batch =
    typeof options.limit === "number" ? due.slice(0, Math.max(0, options.limit)) : due;

  console.log(`Dashboard pending: ${pending.length} · due after idempotency: ${batch.length}`);

  const generated: GeneratedEmail[] = [];
  for (const [index, lead] of batch.entries()) {
    const { outcome, email } = await processLead(lead, options.dryRun);
    if (email) generated.push(email);
    const hasMore = index < batch.length - 1;
    if (outcome !== "failed" && hasMore && !options.dryRun) {
      const delay = randomInterval(JITTER_MIN_MS, JITTER_MAX_MS);
      console.log(`Waiting ${formatDuration(delay)} before the next send.`);
      await wait(delay);
    }
  }
  return generated;
}

export async function runDashboardTest(): Promise<void> {
  await ensureDashboard();
  console.log("JR Intelligence dashboard test");
  console.log(`Dashboard: ${config.dashboardApiUrl}`);
  console.log(`Composer: ${hasOpenAiKey() ? `OpenAI (${config.openaiModel})` : "local fallback"}`);
  const generated = await runQueue({ dryRun: true, limit: 1 });
  if (generated.length === 0) {
    console.log("No pending uncontacted leads to preview.");
    return;
  }
  const gallery = writeGalleryIndex(generated);
  console.log(`Gallery: ${gallery}`);
  console.log("Test complete. Email saved locally. Dashboard status was not updated. Nothing was sent.");
}

export async function startWorker(): Promise<void> {
  await ensureDashboard();
  loadIdempotencyCache();

  const minutes = Math.min(15, Math.max(10, config.dashboardPollMinutes));
  console.log("JR Intelligence outreach worker");
  console.log(`Dashboard: ${config.dashboardApiUrl}`);
  console.log(`Poll every ${minutes} minutes · sequential sends · jitter 3–9 minutes`);
  console.log(`Composer: ${hasOpenAiKey() ? `OpenAI (${config.openaiModel})` : "local fallback"}`);

  let ticking = false;
  const tick = async (): Promise<void> => {
    if (ticking) {
      console.log("Previous poll still running; skipping this interval.");
      return;
    }
    ticking = true;
    try {
      await runQueue({ dryRun: false });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Poll failed: ${reason}`);
    } finally {
      ticking = false;
    }
  };

  await tick();
  cron.schedule(`*/${minutes} * * * *`, () => {
    void tick();
  });

  console.log("Worker is running. Press Ctrl+C to stop.");
}
