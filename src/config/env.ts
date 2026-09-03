import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

function envString(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export const config = {
  openaiApiKey: envString("OPENAI_API_KEY", ""),
  openaiModel: envString("OPENAI_MODEL", "gpt-4o-mini"),
  smtpHost: envString("SMTP_HOST", ""),
  smtpPort: envNumber("SMTP_PORT", 587),
  smtpSecure: envBool("SMTP_SECURE", false),
  smtpUser: envString("SMTP_USER", ""),
  smtpPass: envString("SMTP_PASS", ""),
  smtpFrom: envString("SMTP_FROM", "JR Intelligence <hello@jrintelligence.com>"),
  leadsCsv: path.resolve(process.cwd(), envString("LEADS_CSV", "./leads.csv")),
  campaignStatePath: path.resolve(
    process.cwd(),
    envString("CAMPAIGN_STATE_PATH", "./campaign_state.json"),
  ),
  testEmailsDir: path.resolve(
    process.cwd(),
    envString("TEST_EMAILS_DIR", "./dist/test-emails"),
  ),
  optOutEmail: envString("OPTOUT_EMAIL", "optout@jrintelligence.com"),
  agencyUrl: envString("AGENCY_URL", "https://jrintelligence.com"),
  jitterMinMinutes: envNumber("JITTER_MIN_MINUTES", 3),
  jitterMaxMinutes: envNumber("JITTER_MAX_MINUTES", 9),
  previewPort: envNumber("PREVIEW_PORT", 43147),
};

export function hasOpenAiKey(): boolean {
  return config.openaiApiKey.length > 0;
}

export function assertSmtpConfigured(): void {
  const missing: string[] = [];
  if (!config.smtpHost) missing.push("SMTP_HOST");
  if (!config.smtpFrom) missing.push("SMTP_FROM");
  if (missing.length > 0) {
    throw new Error(
      `Live dispatch requires ${missing.join(", ")}. Copy .env.example to .env or use --dry-run.`,
    );
  }
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
