import "server-only";

import { randomInt } from "node:crypto";

import { env } from "@/env";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { enqueueEmail } from "@/server/email-queue";
import { createNotification } from "@/server/notifications";

/**
 * Certificate issuance (P08-T03, BR-17).
 *
 * Issued exactly once per (user, course) when progress is 100% and every quiz attempt has a pass.
 * The code is cryptographically random from an unambiguous alphabet; the recipient name is frozen.
 */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCertificateCode(): string {
  const block = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(0, ALPHABET.length)]).join("");
  return `MD-${block()}-${block()}`;
}

export type IssuedCertificate = {
  id: string;
  code: string;
  issuedAt: Date;
  recipientName: string;
  pdfKey: string | null;
  course: { slug: string; titleAr: string | null; titleEn: string | null };
};

export async function issueCertificateIfEligible(
  userId: string,
  courseId: string,
): Promise<IssuedCertificate | null> {
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, status: true, progressPct: true },
  });
  if (enrollment?.status !== "ACTIVE" || enrollment.progressPct < 100) return null;

  const quizzes = await db.lesson.findMany({
    where: { section: { courseId }, type: "QUIZ" },
    select: { id: true },
  });
  if (quizzes.length > 0) {
    const passedQuizzes = await db.quizAttempt.findMany({
      where: {
        userId,
        passed: true,
        quiz: { lesson: { section: { courseId } } },
      },
      select: { quiz: { select: { lessonId: true } } },
      distinct: ["quizId"],
    });
    const passedLessonIds = new Set(passedQuizzes.map((attempt) => attempt.quiz.lessonId));
    if (quizzes.some((quiz) => !passedLessonIds.has(quiz.id))) return null;
  }

  const existing = await db.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: certificateSelect,
  });
  if (existing !== null) return existing;

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, locale: true },
  });

  try {
    const certificate = await db.certificate.create({
      data: {
        userId,
        courseId,
        enrollmentId: enrollment.id,
        code: generateCertificateCode(),
        recipientName: user.name,
        status: "ISSUED",
      },
      select: certificateSelect,
    });
    const locale = user.locale === "EN" ? "en" : "ar";
    await createNotification({
      userId,
      type: "CERTIFICATE_ISSUED",
      title: { ar: "شهادتك جاهزة", en: "Your certificate is ready" },
      body: {
        ar: `أصدرنا شهادة دورة ${certificate.course.titleAr ?? certificate.course.titleEn ?? ""}.`,
        en: `Your certificate for ${certificate.course.titleEn ?? certificate.course.titleAr ?? ""} was issued.`,
      },
      linkPath: `/verify/${certificate.code}`,
    });
    await enqueueEmail({
      to: user.email,
      template: "certificate_issued",
      locale,
      data: {
        name: user.name,
        courseTitle:
          locale === "en"
            ? (certificate.course.titleEn ?? certificate.course.titleAr ?? "")
            : (certificate.course.titleAr ?? certificate.course.titleEn ?? ""),
        code: certificate.code,
        url: `${env.APP_URL}/${locale}/verify/${certificate.code}`,
      },
    });
    return certificate;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return db.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: certificateSelect,
      });
    }
    throw error;
  }
}

const certificateSelect = {
  id: true,
  code: true,
  issuedAt: true,
  recipientName: true,
  pdfKey: true,
  course: { select: { slug: true, titleAr: true, titleEn: true } },
} as const;

export type PublicCertificate = {
  code: string;
  issuedAt: Date;
  recipientName: string;
  status: "ISSUED" | "REVOKED";
  course: { slug: string; titleAr: string | null; titleEn: string | null };
  instructorName: string;
  pdfKey: string | null;
};

export async function getCertificateByCode(code: string): Promise<PublicCertificate | null> {
  const certificate = await db.certificate.findUnique({
    where: { code },
    select: {
      code: true,
      issuedAt: true,
      recipientName: true,
      status: true,
      pdfKey: true,
      course: {
        select: {
          slug: true,
          titleAr: true,
          titleEn: true,
          instructor: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });
  if (certificate === null) return null;
  return {
    code: certificate.code,
    issuedAt: certificate.issuedAt,
    recipientName: certificate.recipientName,
    status: certificate.status,
    pdfKey: certificate.pdfKey,
    course: {
      slug: certificate.course.slug,
      titleAr: certificate.course.titleAr,
      titleEn: certificate.course.titleEn,
    },
    instructorName: certificate.course.instructor.user.name,
  };
}

export async function getCertificateForUser(
  userId: string,
  code: string,
): Promise<PublicCertificate | null> {
  const certificate = await db.certificate.findFirst({
    where: { code, userId },
    select: { code: true },
  });
  if (certificate === null) return null;
  return getCertificateByCode(code);
}
