import "server-only";

import { db } from "@/server/db";

/**
 * In-app notifications (P09-T02).
 *
 * Titles/bodies are stored in Arabic in the legacy columns and in both languages inside `data`, so a
 * learner who switches the interface language sees the notification in that language.
 */

export type NotificationTypeValue =
  | "WELCOME"
  | "EMAIL_VERIFIED"
  | "PURCHASE_RECEIPT"
  | "QUESTION_ANSWERED"
  | "CERTIFICATE_ISSUED"
  | "NEW_LESSON"
  | "COURSE_REVIEW_DECISION"
  | "INSTRUCTOR_APPLICATION_DECISION"
  | "ANNOUNCEMENT"
  | "REFUND_DECISION"
  | "PAYOUT_DECISION"
  | "SYSTEM";

export type NotificationText = { ar: string; en: string };

export async function createNotification(input: {
  userId: string;
  type: NotificationTypeValue;
  title: NotificationText;
  body?: NotificationText | null;
  linkPath?: string | null;
  data?: Record<string, unknown>;
}): Promise<void> {
  await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title.ar,
      body: input.body?.ar ?? null,
      linkPath: input.linkPath ?? null,
      data: {
        ...(input.data ?? {}),
        titleEn: input.title.en,
        ...(input.body === undefined || input.body === null ? {} : { bodyEn: input.body.en }),
      },
    },
  });
}

export type NotificationRow = {
  id: string;
  type: NotificationTypeValue;
  title: string;
  body: string | null;
  linkPath: string | null;
  readAt: Date | null;
  createdAt: Date;
};

function localise(row: { title: string; body: string | null; data: unknown }): {
  title: string;
  body: string | null;
} {
  if (typeof row.data !== "object" || row.data === null) {
    return { title: row.title, body: row.body };
  }
  const data = row.data as Record<string, unknown>;
  return {
    title: typeof data.titleEn === "string" ? data.titleEn : row.title,
    body: typeof data.bodyEn === "string" ? data.bodyEn : row.body,
  };
}

export async function listNotifications(
  userId: string,
  locale: "ar" | "en",
  limit = 50,
): Promise<{ rows: NotificationRow[]; unread: number }> {
  const [notifications, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        data: true,
        linkPath: true,
        readAt: true,
        createdAt: true,
      },
    }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);

  return {
    rows: notifications.map((row) => {
      const localised = localise(row);
      return {
        id: row.id,
        type: row.type,
        title: locale === "en" ? localised.title : row.title,
        body:
          locale === "en"
            ? localised.body
            : typeof row.data === "object" &&
                row.data !== null &&
                typeof (row.data as Record<string, unknown>).bodyAr === "string"
              ? ((row.data as Record<string, unknown>).bodyAr as string)
              : row.body,
        linkPath: row.linkPath,
        readAt: row.readAt,
        createdAt: row.createdAt,
      };
    }),
    unread,
  };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(userId: string, id: string): Promise<void> {
  await db.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
