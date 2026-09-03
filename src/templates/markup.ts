import type { LanguagePreference, Lead } from "../config/types";
import { config } from "../config/env";
import { geometricPatternDataUri } from "./pattern";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphsFromBody(bodyText: string): string {
  return bodyText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const html = escapeHtml(block).replace(/\n/g, "<br>");
      return `<p class="body-copy">${html}</p>`;
    })
    .join("\n");
}

function optOutCopy(language: LanguagePreference): { label: string; line: string } {
  if (language === "nl") {
    return {
      label: "Afmelden",
      line: `Wil je geen e-mails meer van JR Intelligence? Antwoord met "unsubscribe" of stuur een bericht naar ${config.optOutEmail}.`,
    };
  }
  return {
    label: "Opt out",
    line: `If you would prefer not to receive emails from JR Intelligence, reply with "unsubscribe" or write to ${config.optOutEmail}.`,
  };
}

export function buildEmailMarkup(input: {
  lead: Lead;
  subject: string;
  bodyText: string;
}): string {
  const pattern = geometricPatternDataUri();
  const optOut = optOutCopy(input.lead.languagePreference);
  const bodyHtml = paragraphsFromBody(input.bodyText);
  const previewText =
    input.lead.languagePreference === "nl"
      ? `Kort bericht van JR Intelligence voor ${input.lead.companyName}.`
      : `A short note from JR Intelligence for ${input.lead.companyName}.`;

  return `<!DOCTYPE html>
<html lang="${input.lead.languagePreference}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${escapeHtml(input.subject)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      background-image: url("${pattern}");
      background-repeat: repeat;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #18181b;
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
      background-color: #ffffff;
      background-image: url("${pattern}");
      background-repeat: repeat;
    }
    .card {
      width: 100%;
      max-width: 600px;
      background-color: #ffffff;
      border: 1px solid #f4f4f5;
    }
    .brand {
      font-size: 13px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #3f3f46;
      font-weight: 600;
    }
    .rule {
      border-top: 1px solid #e4e4e7;
      font-size: 1px;
      line-height: 1px;
    }
    .body-copy {
      margin: 0 0 16px 0;
      font-size: 16px;
      line-height: 1.6;
      color: #18181b;
    }
    .footer-copy {
      margin: 0 0 8px 0;
      font-size: 12px;
      line-height: 1.5;
      color: #71717a;
    }
    .optout a {
      color: #52525b;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="preheader">${escapeHtml(previewText)}</div>
  <table class="shell" role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table class="card" role="presentation" width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 28px 36px 12px 36px;">
              <p class="brand">JR Intelligence</p>
            </td>
          </tr>
          <tr>
            <td class="rule" style="padding: 0 36px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 24px 36px 8px 36px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="rule" style="padding: 8px 36px 0 36px;">&nbsp;</td>
          </tr>
          <tr>
            <td class="optout" style="padding: 16px 36px 28px 36px;">
              <p class="footer-copy">${escapeHtml(optOut.line)}</p>
              <p class="footer-copy">
                <a href="mailto:${escapeHtml(config.optOutEmail)}?subject=${encodeURIComponent(optOut.label)}">${escapeHtml(optOut.label)}</a>
                ·
                <a href="${escapeHtml(config.agencyUrl)}">${escapeHtml(config.agencyUrl.replace(/^https?:\/\//, ""))}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
