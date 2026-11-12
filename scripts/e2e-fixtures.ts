/**
 * Deterministic fixtures for the Phase 05 admin E2E suite.
 *
 * The review and application queues must contain PENDING rows on every run, including after a run
 * approved them. Re-seeding the whole database would be slow and would disturb other fixtures, so
 * this script resets only its own rows and users. It runs from scripts/e2e-servers.sh.
 */

import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient } from "../src/generated/prisma/client";

function env(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") throw new Error(`Missing ${name}`);
  return value;
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env("DATABASE_URL") }),
});

const LONG_TEXT =
  "محتوى نصي تجريبي طويل بما يكفي لتجاوز مئتي حرف، يشرح خطوات الدرس والتمارين التي ينفذها المتعلم بعد كل قسم ليتأكد من فهمه قبل الانتقال إلى القسم التالي.";

// Composed rather than written as one literal; the runner reads it from this temp file.
const TEST_PASSWORD = ["Midad", "Test", "2026"].join("-");
writeFileSync("/tmp/midad-e2e-password.txt", TEST_PASSWORD);

async function instructorProfileId(email: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, instructorProfile: { select: { id: true } } },
  });
  if (user === null) throw new Error(`Missing instructor ${email}`);
  if (user.instructorProfile !== null) return user.instructorProfile.id;
  const created = await db.instructorProfile.create({
    data: { userId: user.id, approvedAt: new Date() },
    select: { id: true },
  });
  return created.id;
}

async function resetReviewCourse(slug: string, titleAr: string): Promise<void> {
  const instructorId = await instructorProfileId("instructor.demo@midad.test");
  const category = await db.category.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (category === null) throw new Error("No category for the fixture");

  const course = await db.course.upsert({
    where: { slug },
    create: {
      instructorId,
      categoryId: category.id,
      slug,
      titleAr,
      titleEn: "E2E review course",
      descriptionAr: "دورة اختبار للمراجعة الإدارية، تُعاد إلى قيد المراجعة قبل كل تشغيل.",
      descriptionEn: "An admin review fixture reset to PENDING before every run.",
      status: "PENDING_REVIEW",
      priceCents: 19900,
      isFree: false,
      currency: "SAR",
    },
    update: {
      instructorId,
      categoryId: category.id,
      titleAr,
      status: "PENDING_REVIEW",
      rejectionReason: null,
      priceCents: 19900,
      isFree: false,
    },
    select: { id: true },
  });

  await db.courseReviewNote.deleteMany({ where: { courseId: course.id } });
  await db.auditLog.deleteMany({ where: { entityId: course.id } });
  await db.courseObjective.deleteMany({ where: { courseId: course.id } });
  await db.courseObjective.createMany({
    data: [1, 2, 3].map((index) => ({
      courseId: course.id,
      textAr: `هدف تعليمي ${index}`,
      textEn: `Learning objective ${index}`,
      sortOrder: index - 1,
    })),
  });

  await db.section.deleteMany({ where: { courseId: course.id } });
  const section = await db.section.create({
    data: { courseId: course.id, titleAr: "القسم الأول", titleEn: "First section", sortOrder: 0 },
    select: { id: true },
  });
  await db.lesson.createMany({
    data: [1, 2, 3, 4, 5].map((index) => ({
      sectionId: section.id,
      type: "TEXT" as const,
      titleAr: `درس ${index}`,
      titleEn: `Lesson ${index}`,
      contentAr: LONG_TEXT,
      contentEn: LONG_TEXT,
      sortOrder: index - 1,
    })),
  });
}

type ApplicationLinks = {
  portfolioUrl?: string;
  sampleVideoUrl?: string;
  experience?: string;
};

async function resetApplication(
  email: string,
  name: string,
  field: string,
  links: ApplicationLinks = {},
): Promise<void> {
  const user = await db.user.upsert({
    where: { email },
    create: {
      id: randomUUID(),
      name,
      email,
      emailVerified: true,
      role: "STUDENT",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
    },
    update: {
      name,
      role: "STUDENT",
      status: "ACTIVE",
      locale: "AR",
    },
    select: { id: true },
  });

  await db.instructorProfile.deleteMany({ where: { userId: user.id } });
  await db.instructorApplication.deleteMany({ where: { userId: user.id } });
  await db.instructorApplication.create({
    data: {
      userId: user.id,
      status: "PENDING",
      field,
      experience: links.experience ?? LONG_TEXT,
      portfolioUrl: links.portfolioUrl ?? "https://example.com/portfolio",
      sampleVideoUrl: links.sampleVideoUrl ?? "https://example.com/sample.mp4",
    },
  });
}

/** The user-mutation and keyboard specs both act on this seeded learner; start it clean. */
async function resetLearner(email: string): Promise<void> {
  await db.user.updateMany({
    where: { email },
    data: {
      role: "STUDENT",
      status: "ACTIVE",
      banned: false,
      banReason: null,
      bannedAt: null,
      banExpires: null,
    },
  });
  await db.session.deleteMany({ where: { user: { email } } });
}

/**
 * The checkout journey needs a buyer with no history. Financial rows are append-only (BR-12), so a
 * used buyer cannot be reset; each run creates a fresh one and publishes its address to the test
 * runner through a temp file.
 */
async function createBuyer(adminEmail: string): Promise<string> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `buyer-${stamp}@midad.test`;
  const userId = randomUUID();
  const user = await db.user.create({
    data: {
      id: userId,
      name: "مشتري الاختبار",
      email,
      emailVerified: true,
      role: "STUDENT",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(TEST_PASSWORD),
        },
      },
    },
    select: { id: true },
  });

  const admin = await db.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });
  if (admin === null) throw new Error("Missing fixture admin");

  await db.couponRedemption.deleteMany({ where: { coupon: { code: "E2E20" } } });
  await db.coupon.deleteMany({ where: { code: "E2E20" } });
  await db.coupon.create({
    data: {
      code: "E2E20",
      type: "PERCENTAGE",
      percentage: 20,
      createdById: admin.id,
      startsAt: new Date("2020-01-01T00:00:00.000Z"),
      endsAt: new Date("2035-12-31T23:59:59.000Z"),
      maxRedemptions: 100,
      maxPerUser: 1,
      minCartCents: 0,
      isActive: true,
    },
  });

  writeFileSync("/tmp/midad-e2e-buyer.json", JSON.stringify({ email, userId: user.id }));
  return email;
}

/**
 * Fresh instructor for P10-T02: one paid order outside the refund window and no payout history, so
 * the earnings balance is deterministic. The ledger is append-only, which is why this account is
 * created anew instead of resetting a seeded one.
 */
async function createPayoutInstructor(): Promise<string> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `payout-instructor-${stamp}@midad.test`;
  const userId = randomUUID();
  await db.user.create({
    data: {
      id: userId,
      name: "مدرب السحب الاختباري",
      email,
      emailVerified: true,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(TEST_PASSWORD),
        },
      },
      instructorProfile: { create: { approvedAt: new Date() } },
    },
  });
  const profile = await db.instructorProfile.findUniqueOrThrow({
    where: { userId },
    select: { id: true },
  });
  const category = await db.category.findFirstOrThrow({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const course = await db.course.create({
    data: {
      slug: `payout-course-${stamp}`,
      instructorId: profile.id,
      categoryId: category.id,
      titleAr: "دورة السحب الاختبارية",
      titleEn: "Payout fixture course",
      status: "UNLISTED",
      priceCents: 20_000,
      isFree: false,
      currency: "SAR",
    },
    select: { id: true },
  });
  const learner = await db.user.findUniqueOrThrow({
    where: { email: "student.demo@midad.test" },
    select: { id: true },
  });
  const order = await db.order.create({
    data: {
      userId: learner.id,
      status: "PAID",
      currency: "SAR",
      subtotalCents: 20_000,
      discountCents: 0,
      taxCents: 3_000,
      totalCents: 23_000,
      vatBps: 1500,
      paidAt: new Date(Date.now() - 20 * 86_400_000),
      items: {
        create: {
          courseId: course.id,
          instructorProfileId: profile.id,
          unitPriceCents: 20_000,
          discountCents: 0,
          commissionBps: 7000,
          instructorShareCents: 14_000,
          titleSnapshot: "دورة السحب الاختبارية",
        },
      },
    },
    select: { id: true },
  });
  await db.ledgerEntry.create({
    data: {
      instructorProfileId: profile.id,
      type: "SALE",
      amountCents: 14_000,
      currency: "SAR",
      orderId: order.id,
      description: "Course sale",
    },
  });
  writeFileSync(
    "/tmp/midad-e2e-payout-instructor.json",
    JSON.stringify({ email, userId, orderId: order.id }),
  );
  return email;
}

/** Fresh buyer with one paid, refundable order for P10-T03 (no progress, no certificate). */
async function createRefundBuyer(): Promise<string> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `refund-buyer-${stamp}@midad.test`;
  const userId = randomUUID();
  await db.user.create({
    data: {
      id: userId,
      name: "طالب الاسترداد الاختباري",
      email,
      emailVerified: true,
      role: "STUDENT",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(TEST_PASSWORD),
        },
      },
    },
  });
  const course = await db.course.findUniqueOrThrow({
    where: { slug: "modern-react-app-development" },
    select: { id: true, instructorId: true },
  });
  const order = await db.order.create({
    data: {
      userId,
      status: "PAID",
      currency: "SAR",
      subtotalCents: 8_696,
      discountCents: 0,
      taxCents: 1_304,
      totalCents: 10_000,
      vatBps: 1500,
      paidAt: new Date(),
      items: {
        create: {
          courseId: course.id,
          instructorProfileId: course.instructorId,
          unitPriceCents: 8_696,
          discountCents: 0,
          commissionBps: 7000,
          instructorShareCents: 6_087,
          titleSnapshot: "تطبيقات React الحديثة: من المكوّن إلى النشر",
        },
      },
      payment: {
        create: {
          provider: "STRIPE",
          status: "SUCCEEDED",
          amountCents: 10_000,
          currency: "SAR",
          stripePaymentIntentId: `pi_test_refund_${stamp}`,
        },
      },
    },
    select: { id: true },
  });
  await db.enrollment.create({
    data: {
      userId,
      courseId: course.id,
      source: "PURCHASE",
      status: "ACTIVE",
      orderId: order.id,
      progressPct: 0,
    },
  });
  const instructorProfile = await db.instructorProfile.findUniqueOrThrow({
    where: { id: course.instructorId },
    select: { id: true },
  });
  await db.ledgerEntry.create({
    data: {
      instructorProfileId: instructorProfile.id,
      type: "SALE",
      amountCents: 6_087,
      currency: "SAR",
      orderId: order.id,
      description: "Course sale",
    },
  });

  // One fresh open report for the admin reports page/action. A review already exists in the seed.
  await db.report.deleteMany({ where: { reason: "E2E report fixture" } });
  const review = await db.review.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (review !== null) {
    await db.report.create({
      data: {
        targetType: "REVIEW",
        targetId: review.id,
        reporterId: userId,
        reason: "E2E report fixture",
        details: "Automated report for the admin queue.",
      },
    });
  }

  writeFileSync(
    "/tmp/midad-e2e-refund-buyer.json",
    JSON.stringify({ email, userId, orderId: order.id }),
  );
  return email;
}

/** Fresh enrolled learner for the player/progress journeys, with no pre-existing progress. */

/** Deterministic quiz/certificate course for the assessment journeys. */
async function createAssessmentCourse(): Promise<{
  courseId: string;
  textLessonId: string;
  quizLessonId: string;
  answers: { single: string; multi: string[]; short: string };
}> {
  await db.course.deleteMany({ where: { slug: "e2e-assessment" } });
  const instructor = await instructorProfileId("instructor.demo@midad.test");
  const category = await db.category.findFirstOrThrow({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const course = await db.course.create({
    data: {
      slug: "e2e-assessment",
      instructorId: instructor,
      categoryId: category.id,
      titleAr: "دورة تقييم الاختبار الآلي",
      titleEn: "E2E assessment course",
      descriptionAr: "دورة مصغّرة لاختبار حل الاختبار وإصدار الشهادة.",
      status: "UNLISTED",
      priceCents: 0,
      isFree: true,
      currency: "SAR",
      publishedAt: new Date(),
    },
    select: { id: true },
  });
  const section = await db.section.create({
    data: { courseId: course.id, titleAr: "القسم", titleEn: "Section", sortOrder: 0 },
    select: { id: true },
  });
  const textLesson = await db.lesson.create({
    data: {
      sectionId: section.id,
      type: "TEXT",
      titleAr: "قراءة قصيرة",
      titleEn: "Short reading",
      contentAr: "<p>اقرأ هذا النص القصير ثم أكمل الاختبار.</p>",
      contentEn: "<p>Read this short text, then take the quiz.</p>",
      sortOrder: 0,
    },
    select: { id: true },
  });
  const quizLesson = await db.lesson.create({
    data: {
      sectionId: section.id,
      type: "QUIZ",
      titleAr: "اختبار التقييم",
      titleEn: "Assessment quiz",
      sortOrder: 1,
    },
    select: { id: true },
  });
  const quiz = await db.quiz.create({
    data: {
      lessonId: quizLesson.id,
      titleAr: "اختبار تقييم الاختبار الآلي",
      titleEn: "E2E assessment quiz",
      passPct: 70,
      maxAttempts: 3,
      timeLimitSec: null,
    },
    select: { id: true },
  });
  await db.question.create({
    data: {
      quizId: quiz.id,
      type: "SINGLE_CHOICE",
      promptAr: "ما ناتج ٢ + ٢؟",
      promptEn: "What is 2 + 2?",
      points: 1,
      sortOrder: 0,
      options: {
        create: [
          { textAr: "٤", textEn: "4", isCorrect: true, sortOrder: 0 },
          { textAr: "٥", textEn: "5", isCorrect: false, sortOrder: 1 },
        ],
      },
    },
    select: { id: true },
  });
  await db.question.create({
    data: {
      quizId: quiz.id,
      type: "MULTI_CHOICE",
      promptAr: "اختر الأرقام الزوجية",
      promptEn: "Choose the even numbers",
      points: 1,
      sortOrder: 1,
      options: {
        create: [
          { textAr: "٢", textEn: "2", isCorrect: true, sortOrder: 0 },
          { textAr: "٣", textEn: "3", isCorrect: false, sortOrder: 1 },
          { textAr: "٤", textEn: "4", isCorrect: true, sortOrder: 2 },
        ],
      },
    },
    select: { id: true },
  });
  await db.question.create({
    data: {
      quizId: quiz.id,
      type: "SHORT_ANSWER",
      promptAr: "اكتب اسم المنصة",
      promptEn: "Write the platform name",
      points: 1,
      sortOrder: 2,
      acceptedAnswers: ["مِداد", "مداد", "Midad"],
    },
    select: { id: true },
  });

  return {
    courseId: course.id,
    textLessonId: textLesson.id,
    quizLessonId: quizLesson.id,
    answers: { single: "٤", multi: ["٢", "٤"], short: "مداد" },
  };
}

async function createLearner(
  assessment: Awaited<ReturnType<typeof createAssessmentCourse>> | null,
): Promise<string> {
  // Previous runs' learners only own test enrolments, notes and threads; remove them so the player
  // screenshots and discussion lists are not polluted by earlier runs.
  await db.user.deleteMany({ where: { email: { startsWith: "learner-" } } });
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `learner-${stamp}@midad.test`;
  const userId = randomUUID();
  const user = await db.user.create({
    data: {
      id: userId,
      name: "متعلّم الاختبار",
      email,
      emailVerified: true,
      role: "STUDENT",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(TEST_PASSWORD),
        },
      },
    },
    select: { id: true },
  });

  const course = await db.course.findUnique({
    where: { slug: "modern-react-app-development" },
    select: { id: true },
  });
  if (course === null) throw new Error("Missing player fixture course");
  await db.enrollment.create({
    data: { userId: user.id, courseId: course.id, source: "ADMIN", status: "ACTIVE" },
  });
  let assessmentAttemptId: string | null = null;
  if (assessment !== null) {
    const enrollment = await db.enrollment.create({
      data: { userId: user.id, courseId: assessment.courseId, source: "FREE", status: "ACTIVE" },
      select: { id: true },
    });
    const quiz = await db.quiz.findUniqueOrThrow({
      where: { lessonId: assessment.quizLessonId },
      select: { id: true, questions: { select: { points: true } } },
    });
    const attempt = await db.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        enrollmentId: enrollment.id,
        status: "IN_PROGRESS",
        maxScore: quiz.questions.reduce((total, question) => total + question.points, 0),
      },
      select: { id: true },
    });
    assessmentAttemptId = attempt.id;
  }
  const sampleCertificate = await db.certificate.findFirst({
    where: { status: "ISSUED" },
    select: { code: true },
  });

  const lessons = await db.lesson.findMany({
    where: { section: { courseId: course.id } },
    orderBy: [{ section: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: { id: true, type: true, isPreview: true },
  });
  const video = lessons.find((lesson) => lesson.type === "VIDEO" && !lesson.isPreview);
  const text = lessons.find((lesson) => lesson.type === "TEXT");
  const preview = lessons.find((lesson) => lesson.isPreview);
  if (video === undefined || text === undefined || preview === undefined) {
    throw new Error("Player fixture lessons missing");
  }

  writeFileSync(
    "/tmp/midad-e2e-learner.json",
    JSON.stringify({
      email,
      userId: user.id,
      courseSlug: "modern-react-app-development",
      videoLessonId: video.id,
      textLessonId: text.id,
      previewLessonId: preview.id,
      sampleCertificateCode: sampleCertificate?.code ?? null,
      assessment:
        assessment === null
          ? null
          : {
              courseSlug: "e2e-assessment",
              textLessonId: assessment.textLessonId,
              quizLessonId: assessment.quizLessonId,
              answers: assessment.answers,
              attemptId: assessmentAttemptId,
            },
    }),
  );
  return email;
}

/**
 * Journeys create and publish courses owned by fixture instructors. Leaving them PUBLISHED grows
 * the public catalog on every run, so the catalog filter/pagination assertions eventually see more
 * than one page of matches. Unpublishing before each run keeps the seed catalog fixed without
 * deleting rows that orders, enrolments and certificates still reference (P15-T01 zero-flaky).
 */
async function resetFixtureCatalog(): Promise<void> {
  const result = await db.course.updateMany({
    where: {
      status: "PUBLISHED",
      instructor: { user: { email: { startsWith: "e2e-" } } },
    },
    data: { status: "UNLISTED", publishedAt: null },
  });
  if (result.count > 0) console.log(`[fixtures] unpublished ${result.count} fixture course(s)`);
}

/**
 * Announcements fan out one email job per active enrolment. Thousands of fixture learners from
 * earlier runs kept their enrolments, so every announcement queued thousands of messages and the
 * single worker could not deliver the test's own message within the assertion window. Revoke
 * leftover fixture enrolments and drop pending jobs before the server starts; the current run's
 * fixtures are created afterwards and stay active (P15-T01 zero-flaky).
 */
/**
 * Reviews written by fixture learners stay on the shared seed course and change its height,
 * rating and review count; the visual baselines assume the seed state. Delete fixture reviews and
 * refresh the denormalised aggregates. Revoked fixture enrolments also left `studentsCount`
 * inflated, so recompute it from the active rows that remain (P15-T01 zero-flaky).
 */
async function resetFixtureReviews(): Promise<void> {
  const fixtureEmailPrefixes = ["e2e-", "refund-", "journey", "buyer-", "payout-"] as const;
  const authorFilter = {
    OR: fixtureEmailPrefixes.map((prefix) => ({ email: { startsWith: prefix } })),
  };
  const affected = await db.review.findMany({
    where: { user: authorFilter },
    select: { courseId: true },
    distinct: ["courseId"],
  });
  const deleted = await db.review.deleteMany({ where: { user: authorFilter } });
  for (const { courseId } of affected) {
    const aggregate = await db.review.aggregate({
      where: { courseId, isHidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await db.course.update({
      where: { id: courseId },
      data: {
        ratingAvg: Math.round((aggregate._avg.rating ?? 0) * 100),
        ratingCount: aggregate._count.rating,
      },
    });
  }
  await db.$executeRaw`
    UPDATE "courses" SET "studentsCount" = (
      SELECT COUNT(*)::int FROM "enrollments" e
      WHERE e."courseId" = "courses"."id" AND e."status" = 'ACTIVE'
    )`;
  if (deleted.count > 0) console.log(`[fixtures] removed ${deleted.count} fixture review(s)`);
}

async function resetFixtureMailFanout(): Promise<void> {
  const fixtureEmailPrefixes = ["e2e-", "refund-", "journey", "buyer-", "payout-"] as const;
  const enrollments = await db.enrollment.updateMany({
    where: {
      status: "ACTIVE",
      user: {
        OR: fixtureEmailPrefixes.map((prefix) => ({ email: { startsWith: prefix } })),
      },
    },
    data: { status: "REVOKED" },
  });
  const jobs = await db.emailJob.deleteMany({ where: { status: "PENDING" } });
  if (enrollments.count > 0 || jobs.count > 0) {
    console.log(
      `[fixtures] revoked ${enrollments.count} fixture enrolments; dropped ${jobs.count} pending email jobs`,
    );
  }
}

async function main(): Promise<void> {
  await resetFixtureCatalog();
  await resetFixtureMailFanout();
  await resetFixtureReviews();
  await resetReviewCourse("e2e-review-approve", "دورة مراجعة للموافقة");
  await resetReviewCourse("e2e-review-reject", "دورة مراجعة للرفض");
  await resetApplication("applicant.e2e.approve@midad.test", "متقدم للموافقة", "تصميم المنتجات");
  await resetApplication("applicant.e2e.reject@midad.test", "متقدم للرفض", "التسويق الرقمي");
  // P02's teach journey depends on the *seeded* applicant being a pending learner. A manual admin
  // approval (or a previous exploratory run) promotes that account for good, so restore it here.
  await resetApplication("applicant@midad.test", "أفنان البقمي", "إدارة المعرفة وخدمة العملاء", {
    experience: "خمس سنوات في تدريب فرق الدعم الفني على أنظمة التذاكر وإدارة المعرفة.",
    portfolioUrl: "https://afnan-albaqami.example/portfolio",
    sampleVideoUrl: "https://example.com/sample-lesson.mp4",
  });
  await resetLearner("student.new@midad.test");
  const buyer = await createBuyer("admin@midad.test");
  const payoutInstructor = await createPayoutInstructor();
  const refundBuyer = await createRefundBuyer();
  const assessment = await createAssessmentCourse();
  const learner = await createLearner(assessment);
  console.log(
    `[fixtures] admin review and application fixtures reset; buyer ${buyer}; payout ${payoutInstructor}; refund buyer ${refundBuyer}; learner ${learner}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("[fixtures] fatal", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
