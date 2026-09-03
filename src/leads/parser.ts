import fs from "node:fs";
import csv from "csv-parser";
import type { LanguagePreference, Lead } from "../config/types";

const REQUIRED_COLUMNS = [
  "CompanyName",
  "ContactEmail",
  "Industry",
  "LanguagePreference",
] as const;

function normalizeLanguage(value: string): LanguagePreference {
  const normalized = value.trim().toLowerCase();
  if (normalized === "nl" || normalized === "dutch" || normalized === "nederlands") {
    return "nl";
  }
  if (normalized === "en" || normalized === "english" || normalized === "engels") {
    return "en";
  }
  throw new Error(
    `Unsupported LanguagePreference "${value}". Use en or nl.`,
  );
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function rowToLead(row: Record<string, string>, index: number): Lead {
  for (const column of REQUIRED_COLUMNS) {
    if (!row[column] || String(row[column]).trim().length === 0) {
      throw new Error(`Row ${index + 2} is missing ${column}.`);
    }
  }

  const contactEmail = row.ContactEmail.trim().toLowerCase();
  if (!isEmail(contactEmail)) {
    throw new Error(`Row ${index + 2} has an invalid ContactEmail: ${row.ContactEmail}`);
  }

  return {
    companyName: row.CompanyName.trim(),
    contactEmail,
    industry: row.Industry.trim(),
    languagePreference: normalizeLanguage(row.LanguagePreference),
  };
}

export function parseLeadsCsv(filePath: string): Promise<Lead[]> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`Leads file not found: ${filePath}`));
      return;
    }

    const leads: Lead[] = [];
    let index = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: Record<string, string>) => {
        try {
          leads.push(rowToLead(row, index));
          index += 1;
        } catch (error) {
          reject(error);
        }
      })
      .on("end", () => {
        if (leads.length === 0) {
          reject(new Error(`No leads found in ${filePath}.`));
          return;
        }

        const seen = new Set<string>();
        const unique: Lead[] = [];
        for (const lead of leads) {
          if (seen.has(lead.contactEmail)) continue;
          seen.add(lead.contactEmail);
          unique.push(lead);
        }
        resolve(unique);
      })
      .on("error", reject);
  });
}
