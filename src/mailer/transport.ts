import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { assertSmtpConfigured, config } from "../config/env";

export function createTransport(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
  assertSmtpConfigured();
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
