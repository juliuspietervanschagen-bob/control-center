import nodemailer from "nodemailer";
import { config, contactEmailFor, fromAddressFor } from "../src/config/env";
import { signatureAttachment } from "./signature";
import { logoAttachment } from "./logo";

export class SmtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmtpError";
  }
}

function createTransport() {
  if (config.smtpMock) {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  if (!config.smtpHost || config.smtpHost.includes("example.com")) {
    throw new SmtpError("SMTP is not configured. Add SMTP_HOST, SMTP_USER and SMTP_PASS in .env.");
  }
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth:
      config.smtpUser && config.smtpPass
        ? { user: config.smtpUser, pass: config.smtpPass }
        : undefined,
  });
}

export async function sendApprovedEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  language?: string;
}): Promise<{ messageId: string; mocked: boolean }> {
  try {
    const transport = createTransport();
    const language = input.language === "nl" ? "nl" : "en";
    const info = await transport.sendMail({
      from: fromAddressFor(language),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: [logoAttachment(), signatureAttachment()],
      headers: {
        "X-JR-Campaign": "b2b-outreach",
        "List-Unsubscribe": `<mailto:${contactEmailFor(language)}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    return { messageId: info.messageId, mocked: config.smtpMock };
  } catch (error) {
    if (error instanceof SmtpError) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    throw new SmtpError(`The mail server rejected this send. ${reason}`);
  }
}
