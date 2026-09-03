import { config, hasOpenAiKey } from "./config/env";
import { parseCliArgs } from "./cli";
import { parseLeadsCsv } from "./leads/parser";
import { orchestrateEmail } from "./llm/orchestrator";
import {
  dispatchEmail,
  pauseBetweenSends,
  writeGalleryIndex,
} from "./mailer/dispatch";
import { startPreviewServer } from "./preview/server";

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const leadsPath = options.leadsPath ?? config.leadsCsv;
  const allLeads = await parseLeadsCsv(leadsPath);
  const leads =
    typeof options.limit === "number" && Number.isFinite(options.limit)
      ? allLeads.slice(0, Math.max(0, options.limit))
      : allLeads;

  console.log(`JR Intelligence outreach`);
  console.log(`Leads: ${leads.length} from ${leadsPath}`);
  console.log(`Composer: ${hasOpenAiKey() ? `OpenAI (${config.openaiModel})` : "local fallback (no OPENAI_API_KEY)"}`);
  console.log(`Mode: ${options.dryRun ? "dry-run" : "live SMTP"}`);

  const generated = [];
  for (const [index, lead] of leads.entries()) {
    console.log(`\n[${index + 1}/${leads.length}] ${lead.companyName} <${lead.contactEmail}> (${lead.languagePreference})`);
    const email = await orchestrateEmail(lead);
    const result = await dispatchEmail(email, options);

    if (result.status === "skipped") {
      console.log("Skipped: already sent. Use --force to override.");
      continue;
    }

    generated.push(email);
    console.log(`Subject: ${email.subject}`);
    console.log(`Words: ${email.wordCount} · composer: ${email.composer}`);

    if (result.status === "dry-run") {
      console.log(`Wrote ${result.path}`);
    } else {
      console.log(`Sent ${result.messageId ?? ""}`.trim());
    }

    if (!options.dryRun) {
      await pauseBetweenSends(index, leads.length, options.skipJitter);
    }
  }

  if (options.dryRun && generated.length > 0) {
    const gallery = writeGalleryIndex(generated);
    console.log(`\nGallery: ${gallery}`);
  }

  if (options.preview) {
    startPreviewServer();
    console.log(`Preview: http://127.0.0.1:${config.previewPort}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nFailed: ${message}`);
  process.exit(1);
});
