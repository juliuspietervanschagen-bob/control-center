import type { LanguagePreference, Lead } from "../config/types";
import { JR_INTRO_EN, JR_INTRO_NL } from "../config/constants";
import { completePrompt } from "./client";
import { assertBodyConstraints, wordCount } from "./constraints";
import { loadOutreachSkills } from "./skills";

function industryObservation(lead: Lead): string {
  const industry = lead.industry.toLowerCase();
  const nl = lead.languagePreference === "nl";

  if (industry.includes("florist") || industry.includes("flower") || industry.includes("bloem")) {
    return nl
      ? "Bij een bloemenwinkel telt de eerste indruk zwaarder dan bij de meeste shops: seizoen, kleur en beschikbaarheid moeten in een oogopslag kloppen. Veel florist-sites blijven een visitekaartje, terwijl de echte verkoop nog via WhatsApp of de toonbank loopt."
      : "For a florist, the first screen has to do more work than a typical shop: season, colour and what is actually in the cooler. A lot of florist sites still behave like a calling card, while the real orders move over WhatsApp or the counter.";
  }
  if (industry.includes("outdoor")) {
    return nl
      ? "Outdoor retail vraagt duidelijke productpagina's: maat, materiaal, seizoen en voorraad. Als die laag rommelig is, haken kopers af voordat ze de jas of de tent serieus bekijken."
      : "Outdoor retail lives or dies on product pages: size, material, season, stock. If that layer is messy, people bounce before they take the jacket or the tent seriously.";
  }
  if (industry.includes("ceramic") || industry.includes("keramiek")) {
    return nl
      ? "Een atelier verkoopt werk dat je wilt vasthouden. Foto's, series en een rustige checkout doen daar meer dan een drukke homepage. Dat is precies het soort site waar wij scherp op zijn."
      : "A ceramics studio sells work people want to hold. Photos, series and a calm checkout do more there than a busy homepage. That is the kind of site we spend time on.";
  }
  if (industry.includes("logistic") || industry.includes("logistiek")) {
    return nl
      ? "In logistiek is de website vaak het eerste filter voor nieuwe klanten: lanes, doorlooptijd, contact. Als dat vaag blijft, gaat de aanvraag naar een concurrent met een rustiger formulier."
      : "In logistics the site is often the first filter for new accounts: lanes, lead time, a clear contact path. If that stays vague, the request goes to whoever looks easier to brief.";
  }
  if (industry.includes("baker") || industry.includes("bakker")) {
    return nl
      ? "Voor een bakkerij is de site geen catalogus van 4.000 SKUs, maar wel de plek waar openingstijden, bestellingen en seizoensproducten moeten kloppen. Dat klinkt simpel. Het is het meestal niet."
      : "A bakery site is not a 4,000 SKU catalog, but it does have to get opening hours, orders and seasonal product right. That sounds simple. It usually is not.";
  }
  if (industry.includes("light") || industry.includes("verlicht")) {
    return nl
      ? "Verlichting is lastig te kopen zonder goede foto's, afmetingen en sfeer. Productpagina's die dat half doen, kosten jullie de kopers die al bijna klaar waren."
      : "Lighting is hard to buy without honest photos, dimensions and atmosphere. Product pages that half-do that job lose the people who were almost ready.";
  }

  return nl
    ? `In ${lead.industry} is de website vaak het eerste serieuze contact. Als die traag, onduidelijk of lastig te gebruiken is, merken jullie dat niet in Analytics maar in gemiste aanvragen.`
    : `In ${lead.industry}, the website is often the first serious contact. If it is slow, unclear or awkward to use, you feel that in missed enquiries, not in a dashboard.`;
}

function localBody(lead: Lead): string {
  const nl = lead.languagePreference === "nl";
  const intro = nl ? JR_INTRO_NL : JR_INTRO_EN;
  const greeting = nl
    ? `Beste team van ${lead.companyName},`
    : `Dear ${lead.companyName} team,`;
  const observation = industryObservation(lead);
  const bridge = nl
    ? `Daarom mail ik jullie kort. Wij bouwen webshops en websites die rustig ogen en wel het werk doen: heldere structuur, snelle pagina's, en een pad naar contact of checkout dat niet in de weg zit. Geen extra laag marketing. Gewoon een site die doet wat jullie beloven.`
    : `That is why I am writing. We build webshops and websites that look calm and still do the work: clear structure, fast pages, and a path to contact or checkout that does not get in the way. No extra marketing layer. Just a site that does what you already promise.`;
  const cta = nl
    ? `Zouden jullie ergens in de komende weken 15 minuten hebben voor een kort kennismakingsgesprek? Geen pitch-deck. Gewoon even kijken of er iets zinnigs te verbeteren valt aan jullie huidige site. Als het niet past, is een kort antwoord ook prima.`
    : `Would you have 15 minutes in the coming weeks for a short introductory chat? No deck. Just a look at whether something useful can be improved on your current site. If the timing is off, a short reply is enough.`;
  const signoff = nl
    ? `Met vriendelijke groet,\nRik en Julius\nJR Intelligence`
    : `Kind regards,\nRik and Julius\nJR Intelligence`;

  return [greeting, intro, observation, bridge, cta, signoff].join("\n\n");
}

function bodySystemPrompt(copywriterSkill: string, contextSkill: string): string {
  return [
    "You write one B2B cold email for JR Intelligence.",
    "Follow the two skills below exactly. They override any other style habit.",
    "",
    copywriterSkill,
    "",
    contextSkill,
    "",
    "Output rules:",
    "- Return only the email body. No subject line. No markdown.",
    "- Use short paragraphs. Write as if typed by a person, not a marketing team.",
    "- English emails must include this sentence verbatim:",
    `  ${JR_INTRO_EN}`,
    "- Dutch emails must include this sentence verbatim:",
    `  ${JR_INTRO_NL}`,
    "- Soft CTA: ask for a brief introductory chat. Do not push a meeting link or a discount.",
    "- Sign off as Rik and Julius, JR Intelligence.",
  ].join("\n");
}

function bodyUserPrompt(lead: Lead): string {
  return [
    `CompanyName: ${lead.companyName}`,
    `Industry: ${lead.industry}`,
    `LanguagePreference: ${lead.languagePreference}`,
    `ContactEmail: ${lead.contactEmail}`,
    "",
    "Write one email for this lead.",
  ].join("\n");
}

export async function generateEmailBody(lead: Lead): Promise<{
  bodyText: string;
  composer: "openai" | "local";
}> {
  const skills = loadOutreachSkills();
  const llm = await completePrompt(
    bodySystemPrompt(skills.copywriter, skills.context),
    bodyUserPrompt(lead),
  );

  if (llm) {
    try {
      assertBodyConstraints(llm);
      assertIntroPresent(llm, lead.languagePreference);
      return { bodyText: llm, composer: "openai" };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`OpenAI body rejected (${reason}). Using local composer.`);
    }
  }

  const bodyText = localBody(lead);
  assertBodyConstraints(bodyText);
  return { bodyText, composer: "local" };
}

function assertIntroPresent(body: string, language: LanguagePreference): void {
  const intro = language === "nl" ? JR_INTRO_NL : JR_INTRO_EN;
  if (!body.includes(intro)) {
    throw new Error("Generated body is missing the mandatory JR Intelligence introduction.");
  }
}

export function bodyWordCount(body: string): number {
  return wordCount(body);
}
