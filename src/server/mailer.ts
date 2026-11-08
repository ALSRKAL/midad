/**
 * Transactional email.
 *
 * Locally every message goes to Mailpit (SMTP on 1025, UI on 8025), so templates can be inspected
 * without a real inbox. In production the same interface is backed by Resend; switching is an
 * environment variable, never a code change. Transactional mail is queued in the durable `EmailJob`
 * outbox and sent by `worker/` (ADR-0016), so a slow SMTP server never holds up a request; this
 * module is the transport and the health probe.
 */

import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { env } from "@/env";
import { logger } from "@/server/logger";

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** For reply routing (threads, support). */
  replyTo?: string;
  /** Structured tag for Mailpit filtering and log correlation. */
  tag?: string;
};

export type Mailer = {
  send(message: MailMessage): Promise<{ messageId: string }>;
};

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (transporter !== undefined) return transporter;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER === undefined || env.SMTP_PASSWORD === undefined
      ? {}
      : { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }),
  });

  return transporter;
}

export const mailer: Mailer = {
  async send(message) {
    const info = await getTransporter().sendMail({
      from: env.AUTH_EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo === undefined ? {} : { replyTo: message.replyTo }),
      ...(message.tag === undefined ? {} : { headers: { "X-Midad-Tag": message.tag } }),
    });

    logger.info(
      { messageId: info.messageId, to: message.to, tag: message.tag ?? "none" },
      "mail sent",
    );

    return { messageId: info.messageId };
  },
};

/** Startup check used by /api/health (P01-T08): the SMTP server must answer. */
export async function verifyMailTransport(): Promise<boolean> {
  try {
    await getTransporter().verify();
    return true;
  } catch (error) {
    logger.warn({ err: error }, "SMTP transport verification failed");
    return false;
  }
}
