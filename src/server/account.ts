/**
 * Account settings service (the product requirements).
 *
 * Everything here acts on one user id that the caller has already taken from the session; no
 * function accepts an arbitrary "who to change" argument, which is what keeps the settings actions
 * free of an IDOR surface. Authorization (signed-in, active account) happens in `createAction`
 * before these functions are reached.
 *
 * Soft delete follows §2.3 literally: the row, its orders and its learning history stay, the status
 * becomes DELETED, and every session row is removed. `getCurrentSession` and the Better Auth session
 * hook already refuse any non-ACTIVE account, so a deleted user cannot sign back in.
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { db } from "@/server/db";
import { conflict, notFound, validationFailed } from "@/lib/errors";
import { detectImageType } from "@/lib/image-signature";
import { logger } from "@/server/logger";
import { storage } from "@/server/storage";
import type { UserPreferences, ProfileInput } from "@/features/account/schema";

/** 2 MiB; the client compresses to a 512 px square, so a larger upload is a mistake, not a photo. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const AVATAR_PREFIX = "avatars/";

export type SaveAvatarResult = { image: string };

export async function saveAvatar(userId: string, file: File): Promise<SaveAvatarResult> {
  if (file.size === 0) {
    throw validationFailed({ avatar: ["AVATAR_EMPTY"] });
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw validationFailed({ avatar: ["AVATAR_TOO_LARGE"] });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (detected === null) {
    throw validationFailed({ avatar: ["AVATAR_UNSUPPORTED"] });
  }

  const previous = await db.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  if (previous === null) throw notFound("Account not found");

  const key = `${AVATAR_PREFIX}${userId}/${randomUUID()}.${detected.extension}`;
  await storage.putObject({
    bucket: "public",
    key,
    body: bytes,
    contentType: detected.mime,
    // The key contains a UUID, so replacing an avatar never reuses a URL that a CDN has cached.
    cacheControl: "public, max-age=31536000, immutable",
  });

  const image = storage.publicUrl(key);
  await db.user.update({ where: { id: userId }, data: { image } });

  // Best effort: an orphaned previous avatar is harmless, a failed settings save is not.
  const publicPrefix = storage.publicUrl("");
  if (previous.image !== null && previous.image.startsWith(`${publicPrefix}${AVATAR_PREFIX}`)) {
    const oldKey = previous.image.slice(publicPrefix.length);
    await storage.deleteObject("public", oldKey).catch((error: unknown) => {
      logger.warn({ err: error, key: oldKey }, "could not delete replaced avatar");
    });
  }

  return { image };
}

export type AccountProfile = {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  image: string | null;
  locale: "ar" | "en";
  theme: "light" | "dark" | "system";
  preferences: UserPreferences;
};

/** Reads the settings form's initial values straight from the row, never from the session cookie. */
export async function getAccountProfile(userId: string): Promise<AccountProfile> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      image: true,
      locale: true,
      theme: true,
      notifyReplies: true,
      notifyAnnouncements: true,
      notifyProductUpdates: true,
    },
  });
  if (user === null) throw notFound("Account not found");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    image: user.image,
    locale: user.locale === "EN" ? "en" : "ar",
    theme: user.theme === "LIGHT" ? "light" : user.theme === "DARK" ? "dark" : "system",
    preferences: {
      notifyReplies: user.notifyReplies,
      notifyAnnouncements: user.notifyAnnouncements,
      notifyProductUpdates: user.notifyProductUpdates,
    },
  };
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
  const updated = await db.user.updateMany({
    where: { id: userId, status: "ACTIVE" },
    data: {
      name: input.name,
      bio: input.bio === undefined || input.bio.length === 0 ? null : input.bio,
      locale: input.locale === "en" ? "EN" : "AR",
      theme: input.theme === "light" ? "LIGHT" : input.theme === "dark" ? "DARK" : "SYSTEM",
    },
  });
  if (updated.count === 0) throw notFound("Account not found");
}

export async function updateNotifications(
  userId: string,
  preferences: UserPreferences,
): Promise<void> {
  const updated = await db.user.updateMany({
    where: { id: userId, status: "ACTIVE" },
    data: {
      notifyReplies: preferences.notifyReplies,
      notifyAnnouncements: preferences.notifyAnnouncements,
      notifyProductUpdates: preferences.notifyProductUpdates,
    },
  });
  if (updated.count === 0) throw notFound("Account not found");
}

export type AccountSession = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

/** How many session rows the settings page renders; older ones are still revoked by "end others". */
export const SESSION_LIST_LIMIT = 10;

export type AccountSessionList = {
  sessions: AccountSession[];
  total: number;
};

export async function listAccountSessions(userId: string): Promise<AccountSessionList> {
  const where = { userId, expiresAt: { gt: new Date() } };
  const [sessions, total] = await Promise.all([
    db.session.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: SESSION_LIST_LIMIT,
      select: { id: true, createdAt: true, expiresAt: true, ipAddress: true, userAgent: true },
    }),
    db.session.count({ where }),
  ]);
  return { sessions, total };
}

/** Revokes one of *this user's* sessions; another user's id is a 404, never a 403. */
export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  const result = await db.session.deleteMany({ where: { id: sessionId, userId } });
  if (result.count === 0) throw notFound("Session not found");
}

export async function revokeOtherSessions(userId: string, currentSessionId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId, id: { not: currentSessionId } } });
}

/** "Sign out of all devices" (§2.3): every session row, including the one making the request. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

/**
 * Soft-deletes the account and revokes every session in one transaction.
 *
 * The last remaining active admin cannot delete themselves: that would leave the platform with no
 * one able to reach the admin area, and no way to undo it from inside the product.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });
  if (user === null || user.status === "DELETED") throw notFound("Account not found");

  if (user.role === "ADMIN") {
    const remainingAdmins = await db.user.count({
      where: { role: "ADMIN", status: "ACTIVE", deletedAt: null, id: { not: userId } },
    });
    if (remainingAdmins === 0) {
      throw conflict("LAST_ADMIN");
    }
  }

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { status: "DELETED", deletedAt: new Date() },
    }),
    db.session.deleteMany({ where: { userId } }),
  ]);
}

/**
 * "Export my data" (§2.3).
 *
 * Personal data only: profile, purchases, learning record and the content the user wrote. Password
 * hashes, OAuth account rows (provider tokens) and other users' data are deliberately excluded.
 */
export type AccountExport = {
  schemaVersion: 1;
  exportedAt: string;
  profile: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    bio: string | null;
    image: string | null;
    locale: string;
    theme: string;
    role: string;
    createdAt: string;
    preferences: UserPreferences;
  };
  enrollments: Array<{
    course: string;
    status: string;
    progressPct: number;
    createdAt: string;
    completedAt: string | null;
  }>;
  orders: Array<{
    id: string;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: string;
    paidAt: string | null;
    items: Array<{ title: string; unitPriceCents: number; discountCents: number }>;
  }>;
  certificates: Array<{ code: string; course: string; issuedAt: string }>;
  reviews: Array<{ course: string; rating: number; body: string | null; createdAt: string }>;
  notes: Array<{ lesson: string; body: string; timestampSec: number | null; createdAt: string }>;
  threads: Array<{
    title: string;
    body: string;
    createdAt: string;
    replies: Array<{ body: string; createdAt: string }>;
  }>;
  quizAttempts: Array<{
    quiz: string;
    status: string;
    score: number;
    maxScore: number;
    passed: boolean;
    submittedAt: string | null;
  }>;
  wishlist: Array<{ course: string; createdAt: string }>;
};

export async function exportAccountData(userId: string): Promise<AccountExport> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      bio: true,
      image: true,
      locale: true,
      theme: true,
      role: true,
      createdAt: true,
      notifyReplies: true,
      notifyAnnouncements: true,
      notifyProductUpdates: true,
      enrollments: {
        orderBy: { createdAt: "desc" },
        select: {
          status: true,
          progressPct: true,
          createdAt: true,
          completedAt: true,
          course: { select: { titleAr: true, titleEn: true, slug: true } },
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          totalCents: true,
          currency: true,
          createdAt: true,
          paidAt: true,
          items: {
            select: { titleSnapshot: true, unitPriceCents: true, discountCents: true },
          },
        },
      },
      certificates: {
        orderBy: { issuedAt: "desc" },
        select: {
          code: true,
          issuedAt: true,
          course: { select: { titleAr: true, titleEn: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          rating: true,
          body: true,
          createdAt: true,
          course: { select: { titleAr: true, titleEn: true } },
        },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        select: {
          body: true,
          timestampSec: true,
          createdAt: true,
          lesson: { select: { titleAr: true, titleEn: true } },
        },
      },
      threads: {
        orderBy: { createdAt: "desc" },
        select: {
          title: true,
          body: true,
          createdAt: true,
          replies: {
            orderBy: { createdAt: "asc" },
            select: { body: true, createdAt: true },
          },
        },
      },
      quizAttempts: {
        orderBy: { startedAt: "desc" },
        select: {
          status: true,
          score: true,
          maxScore: true,
          passed: true,
          submittedAt: true,
          quiz: { select: { titleAr: true, titleEn: true } },
        },
      },
      wishlist: {
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          course: { select: { titleAr: true, titleEn: true } },
        },
      },
    },
  });
  if (user === null) throw notFound("Account not found");

  const courseName = (course: { titleAr: string | null; titleEn: string | null }): string =>
    course.titleEn ?? course.titleAr ?? "";

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      bio: user.bio,
      image: user.image,
      locale: user.locale,
      theme: user.theme,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      preferences: {
        notifyReplies: user.notifyReplies,
        notifyAnnouncements: user.notifyAnnouncements,
        notifyProductUpdates: user.notifyProductUpdates,
      },
    },
    enrollments: user.enrollments.map((enrollment) => ({
      course: courseName(enrollment.course),
      status: enrollment.status,
      progressPct: enrollment.progressPct,
      createdAt: enrollment.createdAt.toISOString(),
      completedAt: enrollment.completedAt?.toISOString() ?? null,
    })),
    orders: user.orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
      items: order.items.map((item) => ({
        title: item.titleSnapshot,
        unitPriceCents: item.unitPriceCents,
        discountCents: item.discountCents,
      })),
    })),
    certificates: user.certificates.map((certificate) => ({
      code: certificate.code,
      course: courseName(certificate.course),
      issuedAt: certificate.issuedAt.toISOString(),
    })),
    reviews: user.reviews.map((review) => ({
      course: courseName(review.course),
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
    })),
    notes: user.notes.map((note) => ({
      lesson: courseName(note.lesson),
      body: note.body,
      timestampSec: note.timestampSec,
      createdAt: note.createdAt.toISOString(),
    })),
    threads: user.threads.map((thread) => ({
      title: thread.title,
      body: thread.body,
      createdAt: thread.createdAt.toISOString(),
      replies: thread.replies.map((reply) => ({
        body: reply.body,
        createdAt: reply.createdAt.toISOString(),
      })),
    })),
    quizAttempts: user.quizAttempts.map((attempt) => ({
      quiz: attempt.quiz.titleEn ?? attempt.quiz.titleAr ?? "",
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
    })),
    wishlist: user.wishlist.map((entry) => ({
      course: courseName(entry.course),
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}
