import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { compileEmailHtml } from "../src/templates/compile";
import { generateEmailBody } from "../src/llm/copywriter";
import { adviceSubject, inferSiteKind } from "../src/llm/siteKind";
import type { LanguagePreference } from "../src/config/types";

const prisma = new PrismaClient();

const previews: Array<{
  id: string;
  companyName: string;
  email: string;
  industry: string;
  language: LanguagePreference;
  website?: string;
  stage: "PENDING_GENERATION" | "READY_FOR_REVIEW" | "SENT";
  siteMarkdown?: string;
}> = [
  {
    id: "lead-bloemenhuis-van-dijk",
    companyName: "Bloemenhuis Van Dijk",
    email: "iris.vandijk@example.com",
    industry: "independent florist",
    language: "nl",
    website: "https://bloemenhuisvandijk.example",
    stage: "READY_FOR_REVIEW",
    siteMarkdown: "# Boeketten\n# Seizoensboeketten\n# Bezorgen",
  },
  {
    id: "lead-gouden-korrel",
    companyName: "Bakkerij De Gouden Korrel",
    email: "info@goudenkorrel.example",
    industry: "artisan bakery",
    language: "nl",
    website: "https://goudenkorrel.example",
    stage: "READY_FOR_REVIEW",
    siteMarkdown: "# Brood van vandaag\n# Bestellen\n# Winkelwagen",
  },
  {
    id: "lead-harbor-logistics",
    companyName: "Harbor & Co Logistics",
    email: "contact@harborco.example",
    industry: "regional logistics",
    language: "en",
    website: "https://harborco.example",
    stage: "READY_FOR_REVIEW",
    siteMarkdown: "# Freight\n# Track shipment\n# Contact",
  },
  {
    id: "lead-lumen-studio",
    companyName: "Lumen Studio Lighting",
    email: "studio@lumenlighting.example",
    industry: "interior lighting",
    language: "en",
    website: "https://lumenlighting.example",
    stage: "SENT",
    siteMarkdown: "# Pendants\n# Shop lights\n# Checkout",
  },
  {
    id: "lead-nordic-outdoor",
    companyName: "Nordic Outdoor Co",
    email: "ops@nordic-outdoor.example",
    industry: "outdoor retail",
    language: "en",
    website: "https://nordic-outdoor.example",
    stage: "PENDING_GENERATION",
  },
];

async function main() {
  for (const row of previews) {
    const lead = {
      companyName: row.companyName,
      contactEmail: row.email,
      industry: row.industry,
      languagePreference: row.language,
      website: row.website,
      dashboardId: row.id,
      siteMarkdown: row.siteMarkdown,
    };

    let subject: string | null = null;
    let bodyText: string | null = null;
    let html: string | null = null;
    let generatedAt: Date | null = null;
    let sentAt: Date | null = null;

    if (row.stage !== "PENDING_GENERATION") {
      const kind = inferSiteKind(lead);
      subject = adviceSubject(row.language, kind);
      bodyText = (await generateEmailBody(lead)).bodyText;
      html = await compileEmailHtml({ lead, subject, bodyText });
      generatedAt = new Date();
      if (row.stage === "SENT") sentAt = new Date();
    }

    await prisma.lead.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        dashboardId: row.id,
        companyName: row.companyName,
        email: row.email,
        industry: row.industry,
        language: row.language,
        website: row.website,
        dashboardStatus: row.stage === "SENT" ? "CONTACTED" : "PENDING",
        stage: row.stage,
        subject,
        bodyText,
        html,
        generatedAt,
        sentAt,
        syncedAt: new Date(),
      },
      update: {
        companyName: row.companyName,
        email: row.email,
        industry: row.industry,
        language: row.language,
        website: row.website,
        dashboardStatus: row.stage === "SENT" ? "CONTACTED" : "PENDING",
        stage: row.stage,
        subject,
        bodyText,
        html,
        generatedAt,
        sentAt,
        error: null,
        syncedAt: new Date(),
      },
    });
    console.log(row.companyName, row.stage, subject ?? "(no draft)");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
