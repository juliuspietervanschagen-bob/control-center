import type { LanguagePreference, Lead } from "../config/types";
import { JR_INTRO_EN, JR_INTRO_NL } from "../config/constants";
import { completePrompt } from "./client";
import { assertBodyConstraints } from "./constraints";
import { loadEmailGenerationSkill } from "./skills";

function headingHints(markdown: string): string[] {
  const hashed = markdown
    .split("\n")
    .map((line) => line.match(/^#{1,3}\s+(.+)/)?.[1]?.trim())
    .filter((line): line is string => Boolean(line));
  const title = markdown.match(/^Title:\s*(.+)$/m)?.[1]?.trim();
  const combined = [...hashed, title].filter((line): line is string => Boolean(line));
  return combined
    .map((line) => line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "").trim())
    .filter((line) => line.length > 6 && line.length < 72)
    .filter((line) => !/^https?:/i.test(line))
    .slice(0, 6);
}

function auditBullets(lead: Lead, markdown: string): [string, string, string] {
  const nl = lead.languagePreference === "nl";
  const hints = headingHints(markdown);
  const named = hints[0]?.split(/\s+/).slice(0, 5).join(" ");

  if (nl) {
    return [
      named
        ? `${named} is zichtbaar, maar de volgende stap (bestellen of contact) ligt niet voor de hand.`
        : "De eerste pagina maakt de volgende stap niet duidelijk: kijken, kiezen of contact opnemen.",
      "Product- of dienstpagina's laten te veel over aan de bezoeker: bewijs, varianten en voorraad.",
      "Checkout of het contactformulier zit een paar klikken verder dan nodig. Dat kost aanvragen.",
    ];
  }

  return [
    named
      ? `${named} is on the site, but the next step (buy or get in touch) is not obvious.`
      : "The first screen does not make the next step obvious: browse, choose, or get in touch.",
    "Product or service pages leave proof, variants, and stock for the visitor to chase.",
    "Checkout or contact sits a few clicks further than it should, so requests leak away.",
  ];
}

function localBody(lead: Lead, markdown: string): string {
  const nl = lead.languagePreference === "nl";
  const intro = nl ? JR_INTRO_NL : JR_INTRO_EN;
  const greeting = nl
    ? `Beste team van ${lead.companyName},`
    : `Dear ${lead.companyName} team,`;
  const [a, b, c] = auditBullets(lead, markdown);
  const bullets = `- ${a}\n- ${b}\n- ${c}`;
  const solution = nl
    ? "Wij pakken precies die drie lagen aan: een rustige homepage, productpagina's die het werk doen, en een kort pad naar checkout of contact, zodat meer bezoekers omzetten."
    : "We would rebuild those three layers: a calmer homepage, product pages that do the work, and a short path to checkout or contact, so more visitors convert.";
  const cta = nl
    ? "Zouden jullie 15 minuten hebben voor een kort gesprek hierover?"
    : "Would you have 15 minutes for a short chat about this?";
  const signoff = nl
    ? `Met vriendelijke groet,\nRik en Julius\nJR Intelligence`
    : `Kind regards,\nRik and Julius\nJR Intelligence`;

  return [
    greeting,
    intro,
    bullets,
    solution,
    cta,
    signoff,
  ].join("\n\n");
}

function bodySystemPrompt(skill: string): string {
  return [
    "You write one B2B cold email for JR Intelligence.",
    "Follow this skill exactly:",
    "",
    skill,
    "",
    "Output rules:",
    "- Return only the email body. No subject. No markdown fences.",
    "- 85 to 150 words. Punchy. No robotic words: delve, seamless, tapestry, testament.",
    "- After the intro, output exactly three audit points as consecutive lines starting with '- ' (no blank lines between the three).",
    "- Then one short solution paragraph. Then a soft CTA. Then sign off as Rik and Julius, JR Intelligence.",
    "- English emails must include this sentence verbatim:",
    `  ${JR_INTRO_EN}`,
    "- Dutch emails must include this sentence verbatim:",
    `  ${JR_INTRO_NL}`,
    "- Ground the three bullets in the website markdown when it is present. If it is missing, use industry and company name only.",
  ].join("\n");
}

function bodyUserPrompt(lead: Lead, markdown: string): string {
  return [
    `CompanyName: ${lead.companyName}`,
    `Industry: ${lead.industry}`,
    `LanguagePreference: ${lead.languagePreference}`,
    `Website: ${lead.website ?? "unknown"}`,
    "",
    markdown
      ? `Website markdown (truncated):\n${markdown}`
      : "No website markdown. Use industry and company name only.",
    "",
    "Write one email for this lead.",
  ].join("\n");
}

function hasThreeBullets(body: string): boolean {
  const bullets = body.split("\n").filter((line) => /^\s*[-*•]\s+\S/.test(line));
  return bullets.length >= 3;
}

export async function generateEmailBody(lead: Lead): Promise<{
  bodyText: string;
  composer: "openai" | "local";
}> {
  const markdown = lead.siteMarkdown ?? "";
  const skill = loadEmailGenerationSkill();
  const llm = await completePrompt(bodySystemPrompt(skill), bodyUserPrompt(lead, markdown));

  if (llm) {
    try {
      assertBodyConstraints(llm);
      assertIntroPresent(llm, lead.languagePreference);
      if (!hasThreeBullets(llm)) {
        throw new Error("Generated body is missing three audit bullets.");
      }
      return { bodyText: llm, composer: "openai" };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`OpenAI body rejected (${reason}). Using local composer.`);
    }
  }

  const bodyText = localBody(lead, markdown);
  assertBodyConstraints(bodyText);
  return { bodyText, composer: "local" };
}

function assertIntroPresent(body: string, language: LanguagePreference): void {
  const intro = language === "nl" ? JR_INTRO_NL : JR_INTRO_EN;
  if (!body.includes(intro)) {
    throw new Error("Generated body is missing the mandatory JR Intelligence introduction.");
  }
}

export { wordCount as bodyWordCount } from "./constraints";
