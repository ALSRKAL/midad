// @vitest-environment node
import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { generateCertificatePdf } from "@/lib/certificate-pdf";
import { db } from "@/server/db";
import { getCertificateByCode, issueCertificateIfEligible } from "@/server/certificates";
import { setLessonCompleted } from "@/server/progress";
import { getQuizAttemptForTaking, submitQuizAttempt, startQuizAttempt } from "@/server/quizzes";
import type { SessionUser } from "@/server/session";

/** BR-16 grading/attempts/timer and BR-17 certificate issuance, against `midad_test`. */

let available = false;
try {
  await db.$queryRaw`SELECT 1`;
  available = true;
} catch {
  available = false;
}

const suffix = randomUUID().slice(0, 8);

function session(user: { id: string; name: string; email: string }): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "STUDENT",
    status: "ACTIVE",
    locale: "ar",
    emailVerified: true,
    impersonatedBy: null,
  };
}

async function makeCourse(input: { textLesson?: boolean } = {}) {
  const instructorUser = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Quiz Instructor",
      email: `quiz-instructor-${suffix}-${randomUUID().slice(0, 6)}@midad.test`,
      emailVerified: true,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
    },
  });
  const profile = await db.instructorProfile.create({
    data: { userId: instructorUser.id, approvedAt: new Date() },
  });
  const category = await db.category.upsert({
    where: { slug: `quiz-${suffix}` },
    create: { slug: `quiz-${suffix}`, nameAr: "اختبارات", nameEn: "Quizzes" },
    update: {},
    select: { id: true },
  });
  const course = await db.course.create({
    data: {
      slug: `quiz-course-${suffix}-${randomUUID().slice(0, 6)}`,
      instructorId: profile.id,
      categoryId: category.id,
      titleAr: "دورة اختبار",
      titleEn: "Quiz course",
      status: "PUBLISHED",
      priceCents: 0,
      isFree: true,
    },
    select: { id: true },
  });
  const section = await db.section.create({
    data: { courseId: course.id, titleAr: "قسم", titleEn: "Section", sortOrder: 0 },
    select: { id: true },
  });
  const quizLesson = await db.lesson.create({
    data: { sectionId: section.id, type: "QUIZ", titleAr: "اختبار", titleEn: "Quiz", sortOrder: 1 },
    select: { id: true },
  });
  const quiz = await db.quiz.create({
    data: {
      lessonId: quizLesson.id,
      titleAr: "اختبار الدورة",
      titleEn: "Course quiz",
      passPct: 70,
      maxAttempts: 2,
      timeLimitSec: 60,
    },
    select: { id: true },
  });
  const question = await db.question.create({
    data: {
      quizId: quiz.id,
      type: "SINGLE_CHOICE",
      promptAr: "٢ + ٢",
      promptEn: "2 + 2",
      points: 10,
      sortOrder: 0,
      options: {
        create: [
          { textAr: "٤", textEn: "4", isCorrect: true, sortOrder: 0 },
          { textAr: "٥", textEn: "5", isCorrect: false, sortOrder: 1 },
        ],
      },
    },
    select: { id: true, options: { select: { id: true, isCorrect: true } } },
  });
  const textLesson = input.textLesson
    ? await db.lesson.create({
        data: {
          sectionId: section.id,
          type: "TEXT",
          titleAr: "قراءة",
          titleEn: "Reading",
          contentAr: "<p>نص</p>",
          contentEn: "<p>Text</p>",
          sortOrder: 0,
        },
        select: { id: true },
      })
    : null;

  return {
    course,
    section,
    quizLesson,
    quiz,
    question,
    textLesson,
    instructorUser,
    correctOptionId: question.options.find((option) => option.isCorrect)?.id ?? "",
  };
}

async function makeLearner(courseId: string) {
  const user = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Quiz Learner",
      email: `quiz-learner-${suffix}-${randomUUID().slice(0, 6)}@midad.test`,
      emailVerified: true,
      role: "STUDENT",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
    },
  });
  await db.enrollment.create({
    data: { userId: user.id, courseId, source: "FREE", status: "ACTIVE" },
  });
  return session(user);
}

describe.skipIf(!available)("quizzes and certificates integration", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("BR-16: attempt payload has no correctness and attempts obey the cap and timer", async () => {
    const fixture = await makeCourse();
    const learner = await makeLearner(fixture.course.id);

    const { attemptId } = await startQuizAttempt(learner, fixture.quizLesson.id);
    const taking = await getQuizAttemptForTaking(learner, attemptId);
    expect(taking).not.toBeNull();
    const serialised = JSON.stringify(taking);
    expect(serialised).not.toContain("isCorrect");
    expect(serialised).not.toContain("acceptedAnswers");
    expect(serialised).not.toContain("explanation");

    const failed = await submitQuizAttempt(learner, attemptId, [
      { questionId: fixture.question.id, optionId: "wrong" },
    ]);
    expect(failed.passed).toBe(false);
    await expect(
      submitQuizAttempt(learner, attemptId, [
        { questionId: fixture.question.id, optionId: fixture.correctOptionId },
      ]),
    ).rejects.toThrow("ATTEMPT_ALREADY_SUBMITTED");

    const second = await startQuizAttempt(learner, fixture.quizLesson.id);
    await db.quizAttempt.update({
      where: { id: second.attemptId },
      data: { expiresAt: new Date(Date.now() - 20_000) },
    });
    await expect(
      submitQuizAttempt(learner, second.attemptId, [
        { questionId: fixture.question.id, optionId: fixture.correctOptionId },
      ]),
    ).rejects.toThrow("ATTEMPT_EXPIRED");
    const expired = await db.quizAttempt.findUniqueOrThrow({
      where: { id: second.attemptId },
      select: { status: true },
    });
    expect(expired.status).toBe("EXPIRED");

    await expect(startQuizAttempt(learner, fixture.quizLesson.id)).rejects.toThrow(
      "MAX_ATTEMPTS_REACHED",
    );
  });

  it("BR-17: passing all lessons issues one frozen, verifiable certificate", async () => {
    const fixture = await makeCourse({ textLesson: true });
    if (fixture.textLesson === null) throw new Error("missing text lesson");
    const learner = await makeLearner(fixture.course.id);

    const { attemptId } = await startQuizAttempt(learner, fixture.quizLesson.id);
    const result = await submitQuizAttempt(learner, attemptId, [
      { questionId: fixture.question.id, optionId: fixture.correctOptionId },
    ]);
    expect(result.passed).toBe(true);

    await setLessonCompleted({
      userId: learner.id,
      lessonId: fixture.textLesson.id,
      completed: true,
    });

    const certificate = await issueCertificateIfEligible(learner.id, fixture.course.id);
    expect(certificate).not.toBeNull();
    expect(certificate?.code).toMatch(/^MD-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(certificate?.recipientName).toBe("Quiz Learner");

    const again = await issueCertificateIfEligible(learner.id, fixture.course.id);
    expect(again?.id).toBe(certificate?.id);

    await db.user.update({ where: { id: learner.id }, data: { name: "Renamed Learner" } });
    const frozen = await getCertificateByCode(certificate?.code ?? "");
    expect(frozen?.recipientName).toBe("Quiz Learner");

    // Adding a lesson lowers progress but never revokes the issued certificate.
    await db.lesson.create({
      data: {
        sectionId: fixture.section.id,
        type: "TEXT",
        titleAr: "درس إضافي",
        titleEn: "Extra lesson",
        sortOrder: 9,
      },
    });
    expect(await db.certificate.count({ where: { user: { id: learner.id } } })).toBe(1);
  });

  it("BR-17: the certificate PDF is a real bilingual document", async () => {
    const bytes = await generateCertificatePdf({
      code: "MD-TEST-2026",
      recipientName: "أفنان البقمي",
      courseTitleAr: "دورة تجريبية",
      courseTitleEn: "Sample course",
      issuedAt: new Date("2026-11-10T12:00:00.000Z"),
      instructorName: "نور المطيري",
      verifyUrl: "https://midad.example/ar/verify/MD-TEST-2026",
    });
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(10_000);
  });
});
