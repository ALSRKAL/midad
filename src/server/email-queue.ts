import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { EmailData, EmailLocale, EmailTemplate } from "@/lib/email-templates";
import { db } from "@/server/db";

/**
 * Durable email queue (P09-T03). The web process only writes a row; the worker renders and sends it,
 * so a slow SMTP server can never block a purchase, a review or an auth request.
 */
export async function enqueueEmail(input: {
  to: string;
  template: EmailTemplate;
  locale: EmailLocale;
  data: EmailData;
}): Promise<void> {
  await db.emailJob.create({
    data: {
      to: input.to,
      template: input.template,
      locale: input.locale,
      data: input.data as Prisma.InputJsonValue,
    },
  });
}
