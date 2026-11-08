/**
 * Admin user administration (P05-T03, BR-21).
 *
 * Role changes, bans and impersonation audit. Self-targeting is refused, and the last active admin
 * can neither be demoted nor banned — otherwise the platform could become unadministrable.
 */

import "server-only";

import { conflict, notFound } from "@/lib/errors";
import { db } from "@/server/db";

type TargetUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  status: "ACTIVE" | "BANNED" | "DELETED";
  locale: "AR" | "EN";
};

async function loadTarget(targetId: string): Promise<TargetUser> {
  const user = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, email: true, role: true, status: true, locale: true },
  });
  if (user === null) throw notFound("User not found");
  return user;
}

function assertNotSelf(adminId: string, targetId: string): void {
  if (adminId === targetId) throw conflict("SELF_ACTION_FORBIDDEN");
}

async function assertNotLastAdmin(target: TargetUser): Promise<void> {
  if (target.role !== "ADMIN") return;
  const otherAdmins = await db.user.count({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
      deletedAt: null,
      id: { not: target.id },
    },
  });
  if (otherAdmins === 0) throw conflict("LAST_ADMIN");
}

export async function setUserRole(
  adminId: string,
  targetId: string,
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN",
): Promise<void> {
  assertNotSelf(adminId, targetId);
  const target = await loadTarget(targetId);
  if (target.role === role) return;
  if (target.role === "ADMIN" && role !== "ADMIN") await assertNotLastAdmin(target);

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: targetId }, data: { role } });
    if (role === "INSTRUCTOR") {
      await tx.instructorProfile.upsert({
        where: { userId: targetId },
        create: { userId: targetId, approvedAt: new Date() },
        update: { approvedAt: new Date() },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "user.roleChanged",
        entity: "User",
        entityId: targetId,
        before: { role: target.role },
        after: { role },
      },
    });
    await tx.notification.create({
      data: {
        userId: targetId,
        type: "SYSTEM",
        title: target.locale === "EN" ? "Your account role changed" : "تغيّر دور حسابك",
        body:
          target.locale === "EN"
            ? `Your account role is now ${role}.`
            : `أصبح دور حسابك الآن ${role === "ADMIN" ? "مديرًا" : role === "INSTRUCTOR" ? "مدربًا" : "طالبًا"}.`,
        linkPath: "/settings",
      },
    });
  });
}

export async function banUser(adminId: string, targetId: string, reason: string): Promise<void> {
  assertNotSelf(adminId, targetId);
  const target = await loadTarget(targetId);
  if (target.status === "BANNED") return;
  await assertNotLastAdmin(target);
  const cleanReason = reason.trim();
  if (cleanReason.length < 10) throw conflict("REASON_TOO_SHORT");

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetId },
      data: {
        status: "BANNED",
        banned: true,
        banReason: cleanReason,
        bannedAt: new Date(),
        banExpires: null,
      },
    });
    // BR-21: existing sessions end immediately; the session hook stops a new sign-in.
    await tx.session.deleteMany({ where: { userId: targetId } });
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "user.banned",
        entity: "User",
        entityId: targetId,
        before: { status: target.status },
        after: { status: "BANNED", reason: cleanReason },
      },
    });
    await tx.notification.create({
      data: {
        userId: targetId,
        type: "SYSTEM",
        title: target.locale === "EN" ? "Your account was suspended" : "تم إيقاف حسابك",
        body:
          target.locale === "EN"
            ? `Your account was suspended: ${cleanReason}`
            : `تم إيقاف حسابك: ${cleanReason}`,
        linkPath: null,
      },
    });
  });
}

export async function unbanUser(adminId: string, targetId: string): Promise<void> {
  const target = await loadTarget(targetId);
  if (target.status !== "BANNED") return;

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetId },
      data: { status: "ACTIVE", banned: false, banReason: null, bannedAt: null, banExpires: null },
    });
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "user.unbanned",
        entity: "User",
        entityId: targetId,
        before: { status: target.status },
        after: { status: "ACTIVE" },
      },
    });
    await tx.notification.create({
      data: {
        userId: targetId,
        type: "SYSTEM",
        title: target.locale === "EN" ? "Your account is active again" : "أُعيد تفعيل حسابك",
        body:
          target.locale === "EN"
            ? "The suspension was lifted and you can sign in again."
            : "رُفع الإيقاف عن حسابك ويمكنك تسجيل الدخول مجددًا.",
        linkPath: "/login",
      },
    });
  });
}

/** Audit row written before Better Auth creates the impersonation session (P05-T03). */
export async function recordImpersonation(adminId: string, targetId: string): Promise<void> {
  const target = await loadTarget(targetId);
  if (target.role === "ADMIN") throw conflict("CANNOT_IMPERSONATE_ADMIN");
  await db.auditLog.create({
    data: {
      actorId: adminId,
      action: "user.impersonationStarted",
      entity: "User",
      entityId: targetId,
      after: { targetEmail: target.email },
    },
  });
}

/** The banner greeting needs the target name; the session only carries ids. */
export async function getImpersonationTargetName(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  return user?.name ?? null;
}

export async function userAdminSummary(): Promise<{ admins: number; banned: number }> {
  const [admins, banned] = await Promise.all([
    db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } }),
    db.user.count({ where: { status: "BANNED" } }),
  ]);
  return { admins, banned };
}
