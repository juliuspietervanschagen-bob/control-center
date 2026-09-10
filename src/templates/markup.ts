import type { LanguagePreference, Lead } from "../config/types";
import { config, contactEmailFor } from "../config/env";
import {
  BODY_TEXT_COLOR,
  CARD_BACKGROUND,
  CARD_BORDER,
  PATTERN_BASE_COLOR,
  PATTERN_TILE_PX,
  geometricPatternDataUri,
  shellBackgroundStyle,
} from "./pattern";
import { signatureBlock } from "../../lib/signature";
import { logoImgTag } from "../../lib/logo";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isAuditHeading(line: string): boolean {
  return /^(verbeterpunten|points for improvement)\s*:?$/i.test(line.trim());
}

function auditHeading(language: LanguagePreference): string {
  return language === "nl" ? "Verbeterpunten" : "Points for improvement";
}

function bodyToHtml(bodyText: string, language: LanguagePreference): string {
  const lines = bodyText.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const inner = escapeHtml(paragraph.join("\n")).replace(/\n/g, "<br>");
    html.push(`<p class="body-copy">${inner}</p>`);
    paragraph = [];
  };

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    html.push(
      `<p class="audit-heading">${escapeHtml(auditHeading(language))}</p>`,
      `<ul class="audit-list">${items}</ul>`,
    );
    bullets = [];
  };

  for (const raw of lines) {
    if (isAuditHeading(raw)) {
      continue;
    }
    const match = raw.match(/^\s*[-*•]\s+(.+)$/);
    if (match?.[1]) {
      flushParagraph();
      bullets.push(match[1]);
      continue;
    }
    if (raw.trim() === "") {
      flushParagraph();
      flushBullets();
      continue;
    }
    flushBullets();
    paragraph.push(raw);
  }
  flushParagraph();
  flushBullets();
  return html.join("\n");
}

function stripTrailingSignoff(bodyText: string): string {
  return bodyText
    .replace(
      /\n+(?:kind regards|best regards|met vriendelijke groet)[\s\S]*$/i,
      "",
    )
    .trim();
}

function optOutCopy(language: LanguagePreference): { label: string; line: string; email: string } {
  const email = contactEmailFor(language);
  if (language === "nl") {
    return {
      label: "Afmelden",
      email,
      line: `Wil je geen e-mails meer van JR Intelligence? Antwoord met "unsubscribe" of stuur een bericht naar ${email}.`,
    };
  }
  return {
    label: "Opt out",
    email,
    line: `If you would prefer not to receive emails from JR Intelligence, reply with "unsubscribe" or write to ${email}.`,
  };
}

export function buildEmailMarkup(input: {
  lead: Lead;
  subject: string;
  bodyText: string;
}): string {
  const pattern = geometricPatternDataUri();
  const shellStyle = shellBackgroundStyle();
  const optOut = optOutCopy(input.lead.languagePreference);
  const bodyHtml = bodyToHtml(stripTrailingSignoff(input.bodyText), input.lead.languagePreference);
  const previewText =
    input.lead.languagePreference === "nl"
      ? `Kort bericht van JR Intelligence voor ${input.lead.companyName}.`
      : `A short note from JR Intelligence for ${input.lead.companyName}.`;

  return `<!DOCTYPE html>
<html lang="${input.lead.languagePreference}" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(input.subject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${PATTERN_BASE_COLOR};
      background-image: url('${pattern}');
      background-repeat: repeat;
      background-size: ${PATTERN_TILE_PX}px ${PATTERN_TILE_PX}px;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: ${BODY_TEXT_COLOR};
    }
    .preheader {
      display: none;
      font-size: 1px;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }
    .shell {
      width: 100%;
      background-color: ${PATTERN_BASE_COLOR};
      background-image: url('${pattern}');
      background-repeat: repeat;
      background-size: ${PATTERN_TILE_PX}px ${PATTERN_TILE_PX}px;
    }
    .card {
      width: 100%;
      max-width: 600px;
      background-color: ${CARD_BACKGROUND};
      border: 1px solid ${CARD_BORDER};
      border-radius: 8px;
    }
    .brand {
      font-size: 13px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
    }
    .rule {
      border-top: 1px solid ${CARD_BORDER};
      font-size: 1px;
      line-height: 1px;
    }
    .body-copy {
      margin: 0 0 16px 0;
      font-size: 16px;
      line-height: 1.6;
      color: ${BODY_TEXT_COLOR};
    }
    .audit-heading {
      margin: 0 0 8px 0;
      font-size: 16px;
      line-height: 1.6;
      color: ${BODY_TEXT_COLOR};
      font-weight: 600;
    }
    .audit-list {
      margin: 0 0 16px 0;
      padding: 0 0 0 20px;
    }
    .audit-list li {
      margin: 0 0 8px 0;
      font-size: 16px;
      line-height: 1.55;
      color: ${BODY_TEXT_COLOR};
    }
    .signoff {
      margin: 8px 0 0 0;
      font-size: 16px;
      line-height: 1.6;
      color: ${BODY_TEXT_COLOR};
    }
    .footer-copy {
      margin: 0 0 8px 0;
      font-size: 12px;
      line-height: 1.5;
      color: #6b7280;
    }
    .optout a {
      color: #4b5563;
      text-decoration: underline;
    }
  </style>
</head>
<body bgcolor="${PATTERN_BASE_COLOR}" style="${shellStyle};margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${BODY_TEXT_COLOR};">
  <div class="preheader">${escapeHtml(previewText)}</div>
  <table class="shell" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PATTERN_BASE_COLOR}" style="${shellStyle};width:100%;">
    <tr>
      <td align="center" valign="top" bgcolor="${PATTERN_BASE_COLOR}" style="${shellStyle};padding:20px 16px;">
        <!--[if mso]>
        <table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td width="600" bgcolor="${CARD_BACKGROUND}">
        <![endif]-->
        <table class="card" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD_BACKGROUND}" style="width:100%;max-width:600px;margin:0 auto;background-color:${CARD_BACKGROUND};border:1px solid ${CARD_BORDER};border-radius:8px;">
          <tr>
            <td align="center" style="padding:32px 40px 16px 40px;background-color:${CARD_BACKGROUND};border-radius:8px 8px 0 0;">
              ${logoImgTag()}
            </td>
          </tr>
          <tr>
            <td class="rule" style="padding:0 40px;background-color:${CARD_BACKGROUND};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:24px 40px 8px 40px;background-color:${CARD_BACKGROUND};">
              ${bodyHtml}
              ${signatureBlock(input.lead.languagePreference)}
            </td>
          </tr>
          <tr>
            <td class="rule" style="padding:8px 40px 0 40px;background-color:${CARD_BACKGROUND};">&nbsp;</td>
          </tr>
          <tr>
            <td class="optout" style="padding:16px 40px 40px 40px;background-color:${CARD_BACKGROUND};border-radius:0 0 8px 8px;">
              <p class="footer-copy">${escapeHtml(optOut.line)}</p>
              <p class="footer-copy">
                <a href="mailto:${escapeHtml(optOut.email)}?subject=${encodeURIComponent(optOut.label)}">${escapeHtml(optOut.label)}</a>
                ·
                <a href="${escapeHtml(config.agencyUrl)}">${escapeHtml(config.agencyUrl.replace(/^https?:\/\//, ""))}</a>
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
