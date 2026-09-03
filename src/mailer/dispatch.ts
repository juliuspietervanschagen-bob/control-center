import fs from "node:fs";
import path from "node:path";
import type { CliOptions, GeneratedEmail, Lead } from "../config/types";
import { config, ensureDir } from "../config/env";
import { hasBeenEmailed, recordSend } from "../db/campaignState";
import { formatDuration, randomJitterMs, wait } from "./jitter";
import { createTransport } from "./transport";
import { signatureAttachment } from "../../lib/signature";

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function writeDryRunEmail(email: GeneratedEmail): string {
  ensureDir(config.testEmailsDir);
  const filename = `${slug(email.lead.companyName) || "lead"}-${email.lead.languagePreference}.html`;
  const filePath = path.join(config.testEmailsDir, filename);
  fs.writeFileSync(filePath, email.html, "utf8");
  return filePath;
}

export async function dispatchEmail(
  email: GeneratedEmail,
  options: Pick<CliOptions, "dryRun" | "force">,
): Promise<{ status: "sent" | "dry-run" | "skipped"; path?: string; messageId?: string }> {
  if (!options.force && !options.dryRun && hasBeenEmailed(email.lead.contactEmail)) {
    return { status: "skipped" };
  }

  if (options.dryRun) {
    const filePath = writeDryRunEmail(email);
    recordSend({
      contactEmail: email.lead.contactEmail,
      companyName: email.lead.companyName,
      subject: email.subject,
      sentAt: new Date().toISOString(),
      dryRun: true,
      dashboardId: email.lead.dashboardId,
    });
    return { status: "dry-run", path: filePath };
  }

  const transport = createTransport();
  const info = await transport.sendMail({
    from: config.smtpFrom,
    to: email.lead.contactEmail,
    subject: email.subject,
    text: email.bodyText,
    html: email.html,
    attachments: [signatureAttachment()],
    headers: {
      "X-JR-Campaign": "b2b-outreach",
      "List-Unsubscribe": `<mailto:${config.optOutEmail}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  recordSend({
    contactEmail: email.lead.contactEmail,
    companyName: email.lead.companyName,
    subject: email.subject,
    sentAt: new Date().toISOString(),
    dryRun: false,
    messageId: info.messageId,
    dashboardId: email.lead.dashboardId,
  });

  return { status: "sent", messageId: info.messageId };
}

export async function pauseBetweenSends(
  index: number,
  total: number,
  skipJitter: boolean,
): Promise<void> {
  if (skipJitter || index >= total - 1) return;
  const delay = randomJitterMs(config.jitterMinMinutes, config.jitterMaxMinutes);
  console.log(`Waiting ${formatDuration(delay)} before the next send (${index + 1}/${total}).`);
  await wait(delay);
}

export function writeGalleryIndex(emails: GeneratedEmail[]): string {
  ensureDir(config.testEmailsDir);
  const cards = emails
    .map((email) => {
      const href = `${slug(email.lead.companyName) || "lead"}-${email.lead.languagePreference}.html`;
      return `
        <article class="card">
          <div class="meta">
            <span>${escape(email.lead.companyName)}</span>
            <span>${email.lead.languagePreference.toUpperCase()}</span>
            <span>${email.wordCount} words</span>
          </div>
          <h2>${escape(email.subject)}</h2>
          <p>${escape(email.lead.industry)} · ${escape(email.lead.contactEmail)}</p>
          <iframe title="${escape(email.subject)}" src="${href}"></iframe>
          <a href="${href}">Open full email</a>
        </article>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>JR Intelligence — dry-run emails</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; background: #fafafa; color: #18181b; }
    header { padding: 32px 24px 8px; max-width: 1100px; margin: 0 auto; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .lede { color: #52525b; margin: 0; }
    main { display: grid; gap: 24px; padding: 24px; max-width: 1100px; margin: 0 auto; }
    .card { background: #fff; border: 1px solid #e4e4e7; padding: 16px; }
    .meta { display: flex; gap: 12px; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: #71717a; }
    h2 { font-size: 18px; margin: 10px 0 6px; }
    iframe { width: 100%; height: 520px; border: 1px solid #f4f4f5; background: #fff; }
    a { color: #18181b; }
    @media (max-width: 720px) {
      iframe { height: 420px; }
      .meta { flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <header>
    <h1>JR Intelligence dry-run</h1>
    <p class="lede">${emails.length} generated email${emails.length === 1 ? "" : "s"} ready for review. Nothing was sent.</p>
  </header>
  <main>
    ${cards}
  </main>
</body>
</html>`;

  const filePath = path.join(config.testEmailsDir, "index.html");
  fs.writeFileSync(filePath, html, "utf8");
  return filePath;
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type { Lead };
