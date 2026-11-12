/**
 * Test-only fixture API (P14-T01).
 *
 * Playwright projects run in parallel and each must own its users, courses, coupons and orders.
 * Shared seed rows made browser-conditional skips necessary; this loopback-only server replaces that
 * coupling with per-call factories. It refuses to start unless NODE_ENV is exactly "test" and binds
 * to 127.0.0.1, so it cannot be reached from a deployed application.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient } from "../src/generated/prisma/client";
import { normalizeText } from "../src/lib/search-normalize";

if (process.env.NODE_ENV !== "test") {
  throw new Error("The fixture API only runs with NODE_ENV=test");
}

const PORT = Number(process.env["E2E_FIXTURE_PORT"] ?? 3201);
const PASSWORD = process.env["E2E_TEST_PASSWORD"] ?? "Midad-Test-2026";

function databaseUrl(): string {
  const value = process.env["DATABASE_URL"];
  if (value === undefined || value === "") throw new Error("Missing DATABASE_URL");
  return value;
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) });

const LONG_TEXT =
  "محتوى نصي تجريبي طويل بما يكفي لتجاوز مئتي حرف، يشرح خطوات الدرس والتمارين التي ينفذها المتعلم بعد كل قسم ليتأكد من فهمه قبل الانتقال إلى القسم التالي، مع مثال عملي قصير في نهاية كل فقرة.\n\nنضيف في هذا الجزء ملاحظات عن الأخطاء الشائعة، وخطوات التحقق من النتيجة، وسؤالًا قصيرًا يراجع به المتعلم ما تعلمه قبل المتابعة إلى الدرس التالي.";

type JsonBody = Record<string, unknown>;

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage): Promise<JsonBody> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk as Uint8Array));
  }
  if (chunks.length === 0) return {};
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Body must be a JSON object");
  }
  return parsed as JsonBody;
}

function stringField(body: JsonBody, key: string, fallback: string): string {
  const value = body[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function optionalString(body: JsonBody, key: string): string | undefined {
  const value = body[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberField(body: JsonBody, key: string, fallback: number): number {
  const value = body[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stamp(): string {
  return `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
}

async function activeCategoryId(): Promise<string> {
  const category = await db.category.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (category === null) throw new Error("No active category in the seed");
  return category.id;
}

async function createUser(input: {
  role?: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  locale?: "AR" | "EN";
  name?: string;
  verified?: boolean;
}): Promise<{ id: string; email: string; name: string; role: string }> {
  const suffix = stamp();
  const role = input.role ?? "STUDENT";
  const name = input.name ?? `E2E ${role} ${suffix}`;
  const email = `e2e-${role.toLowerCase()}-${suffix}@midad.test`;
  const id = randomUUID();
  await db.user.create({
    data: {
      id,
      name,
      email,
      emailVerified: input.verified ?? true,
      role,
      status: "ACTIVE",
      locale: input.locale ?? "AR",
      theme: "SYSTEM",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(PASSWORD),
        },
      },
    },
  });
  return { id, email, name, role };
}

async function createInstructor(): Promise<{ id: string; email: string; profileId: string }> {
  const user = await createUser({ role: "INSTRUCTOR" });
  const profile = await db.instructorProfile.create({
    data: { userId: user.id, approvedAt: new Date() },
    select: { id: true },
  });
  return { id: user.id, email: user.email, profileId: profile.id };
}

async function createCourse(input: {
  instructorProfileId?: string;
  status?: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "UNLISTED";
  priceCents?: number;
  isFree?: boolean;
  titleAr?: string;
  titleEn?: string;
  slug?: string;
}): Promise<{ id: string; slug: string; titleAr: string; titleEn: string }> {
  const instructorId = input.instructorProfileId ?? (await createInstructor()).profileId;
  const slug = input.slug ?? `e2e-course-${stamp()}`;
  const titleAr = input.titleAr ?? `دورة اختبار ${stamp()}`;
  const titleEn = input.titleEn ?? `E2E course ${stamp()}`;
  const priceCents = input.priceCents ?? 0;
  const course = await db.course.create({
    data: {
      slug,
      instructorId,
      categoryId: await activeCategoryId(),
      titleAr,
      titleEn,
      descriptionAr: LONG_TEXT,
      descriptionEn: LONG_TEXT,
      titleNormalized: normalizeText(titleAr),
      descriptionNormalized: normalizeText(LONG_TEXT),
      status: input.status ?? "PENDING_REVIEW",
      priceCents,
      isFree: input.isFree ?? priceCents === 0,
      currency: "SAR",
      publishedAt: (input.status ?? "PENDING_REVIEW") === "PUBLISHED" ? new Date() : null,
    },
    select: { id: true, slug: true, titleAr: true, titleEn: true },
  });
  await db.courseObjective.createMany({
    data: [1, 2, 3].map((index) => ({
      courseId: course.id,
      textAr: `هدف تعليمي ${index}`,
      textEn: `Learning objective ${index}`,
      sortOrder: index - 1,
    })),
  });
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
  return {
    id: course.id,
    slug: course.slug,
    titleAr: course.titleAr ?? "",
    titleEn: course.titleEn ?? "",
  };
}

async function createPaidOrder(input: {
  userId: string;
  courseId: string;
  paidDaysAgo?: number;
  progressPct?: number;
}): Promise<{ id: string }> {
  const course = await db.course.findUniqueOrThrow({
    where: { id: input.courseId },
    select: { priceCents: true, instructorId: true, titleAr: true },
  });
  const subtotal = course.priceCents > 0 ? course.priceCents : 10_000;
  const tax = Math.round((subtotal * 1500) / 10_000);
  const total = subtotal + tax;
  const share = Math.round((subtotal * 7000) / 10_000);
  const paidAt = new Date(Date.now() - (input.paidDaysAgo ?? 0) * 86_400_000);
  const order = await db.order.create({
    data: {
      userId: input.userId,
      status: "PAID",
      currency: "SAR",
      subtotalCents: subtotal,
      discountCents: 0,
      taxCents: tax,
      totalCents: total,
      vatBps: 1500,
      paidAt,
      items: {
        create: {
          courseId: input.courseId,
          instructorProfileId: course.instructorId,
          unitPriceCents: subtotal,
          discountCents: 0,
          commissionBps: 7000,
          instructorShareCents: share,
          titleSnapshot: course.titleAr ?? "E2E course",
        },
      },
      payment: {
        create: {
          provider: "STRIPE",
          status: "SUCCEEDED",
          amountCents: total,
          currency: "SAR",
          stripePaymentIntentId: `pi_e2e_${stamp()}`,
        },
      },
    },
    select: { id: true },
  });
  await db.enrollment.upsert({
    where: { userId_courseId: { userId: input.userId, courseId: input.courseId } },
    create: {
      userId: input.userId,
      courseId: input.courseId,
      source: "PURCHASE",
      status: "ACTIVE",
      orderId: order.id,
      progressPct: input.progressPct ?? 0,
    },
    update: { progressPct: input.progressPct ?? 0 },
  });
  await db.ledgerEntry.create({
    data: {
      instructorProfileId: course.instructorId,
      type: "SALE",
      amountCents: share,
      currency: "SAR",
      orderId: order.id,
      description: "E2E fixture sale",
    },
  });
  return { id: order.id };
}

async function enroll(input: {
  userId: string;
  courseId: string;
  progressPct?: number;
}): Promise<{ id: string }> {
  const enrollment = await db.enrollment.upsert({
    where: { userId_courseId: { userId: input.userId, courseId: input.courseId } },
    create: {
      userId: input.userId,
      courseId: input.courseId,
      source: "ADMIN",
      status: "ACTIVE",
      progressPct: input.progressPct ?? 0,
    },
    update: { progressPct: input.progressPct ?? 0 },
    select: { id: true },
  });
  return enrollment;
}

async function createAssessment(includeVideo = false): Promise<{
  courseId: string;
  courseSlug: string;
  videoLessonId: string | null;
  textLessonId: string;
  quizLessonId: string;
  answers: { single: string; multi: string[]; short: string };
}> {
  const instructor = await createInstructor();
  const course = await createCourse({
    instructorProfileId: instructor.profileId,
    status: "UNLISTED",
    priceCents: 0,
    isFree: true,
    titleAr: "دورة تقييم E2E",
    titleEn: "E2E assessment course",
  });
  // Replace the generic lessons with one text lesson and one quiz lesson.
  await db.lesson.deleteMany({ where: { section: { courseId: course.id } } });
  const section = await db.section.findFirstOrThrow({
    where: { courseId: course.id },
    select: { id: true },
  });
  let videoLessonId: string | null = null;
  if (includeVideo) {
    const template = await db.videoAsset.findFirstOrThrow({
      where: { status: "READY", hlsKey: { not: null } },
      orderBy: { createdAt: "asc" },
      select: {
        provider: true,
        originalKey: true,
        hlsKey: true,
        thumbnailKey: true,
        durationSec: true,
        captionsKey: true,
      },
    });
    const videoLesson = await db.lesson.create({
      data: {
        sectionId: section.id,
        type: "VIDEO",
        titleAr: "فيديو قصير",
        titleEn: "Short video",
        durationSec: template.durationSec,
        sortOrder: 0,
        videoAsset: {
          create: {
            provider: template.provider,
            status: "READY",
            originalKey: template.originalKey,
            hlsKey: template.hlsKey,
            thumbnailKey: template.thumbnailKey,
            captionsKey: template.captionsKey,
            durationSec: template.durationSec,
            processedAt: new Date(),
          },
        },
      },
      select: { id: true },
    });
    videoLessonId = videoLesson.id;
  }
  const textLesson = await db.lesson.create({
    data: {
      sectionId: section.id,
      type: "TEXT",
      titleAr: "قراءة قصيرة",
      titleEn: "Short reading",
      contentAr: "<p>اقرأ هذا النص القصير ثم أكمل الاختبار.</p>",
      contentEn: "<p>Read this short text, then take the quiz.</p>",
      sortOrder: includeVideo ? 1 : 0,
    },
    select: { id: true },
  });
  const quizLesson = await db.lesson.create({
    data: {
      sectionId: section.id,
      type: "QUIZ",
      titleAr: "اختبار التقييم",
      titleEn: "Assessment quiz",
      sortOrder: includeVideo ? 2 : 1,
    },
    select: { id: true },
  });
  const quiz = await db.quiz.create({
    data: {
      lessonId: quizLesson.id,
      titleAr: "اختبار تقييم E2E",
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
  });
  return {
    courseId: course.id,
    courseSlug: course.slug,
    videoLessonId,
    textLessonId: textLesson.id,
    quizLessonId: quizLesson.id,
    answers: { single: "٤", multi: ["٢", "٤"], short: "مداد" },
  };
}

async function completeCourse(courseId: string): Promise<{ lessonCount: number }> {
  const course = await db.course.findUniqueOrThrow({
    where: { id: courseId },
    select: { id: true },
  });
  await db.courseObjective.deleteMany({ where: { courseId: course.id } });
  await db.courseObjective.createMany({
    data: [1, 2, 3].map((index) => ({
      courseId: course.id,
      textAr: `هدف تعليمي ${index}`,
      textEn: `Learning objective ${index}`,
      sortOrder: index - 1,
    })),
  });
  let section = await db.section.findFirst({
    where: { courseId: course.id },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (section === null) {
    section = await db.section.create({
      data: { courseId: course.id, titleAr: "القسم الأول", titleEn: "First section", sortOrder: 0 },
      select: { id: true },
    });
  }
  const existing = await db.lesson.count({ where: { sectionId: section.id } });
  const needed = Math.max(0, 5 - existing);
  if (needed > 0) {
    await db.lesson.createMany({
      data: Array.from({ length: needed }, (_, index) => ({
        sectionId: section.id,
        type: "TEXT" as const,
        titleAr: `درس نصي ${existing + index + 1}`,
        titleEn: `Text lesson ${existing + index + 1}`,
        contentAr: LONG_TEXT,
        contentEn: LONG_TEXT,
        sortOrder: existing + index,
      })),
    });
  }
  const lessonCount = await db.lesson.count({ where: { sectionId: section.id } });
  return { lessonCount };
}

const s3Endpoint = process.env["S3_ENDPOINT"];
const s3 = new S3Client({
  ...(s3Endpoint === undefined ? {} : { endpoint: s3Endpoint }),
  region: process.env["S3_REGION"] ?? "us-east-1",
  forcePathStyle: process.env["S3_FORCE_PATH_STYLE"] === "true",
  credentials: {
    accessKeyId: process.env["S3_ACCESS_KEY_ID"] ?? "",
    secretAccessKey: process.env["S3_SECRET_ACCESS_KEY"] ?? "",
  },
});

async function route(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);
  if (request.method === "GET" && url.pathname === "/health") {
    json(response, 200, { status: "ok" });
    return;
  }
  if (request.method !== "POST") {
    json(response, 404, { error: "NOT_FOUND" });
    return;
  }
  const body = await readBody(request);

  switch (url.pathname) {
    case "/user": {
      const role = stringField(body, "role", "STUDENT");
      if (role !== "STUDENT" && role !== "INSTRUCTOR" && role !== "ADMIN") {
        json(response, 400, { error: "INVALID_ROLE" });
        return;
      }
      const locale = stringField(body, "locale", "AR") === "EN" ? "EN" : "AR";
      const requestedName = optionalString(body, "name");
      const user = await createUser({
        role,
        locale,
        ...(requestedName === undefined ? {} : { name: requestedName }),
      });
      json(response, 200, { ...user, password: PASSWORD });
      return;
    }
    case "/application": {
      const user = await createUser({ role: "STUDENT" });
      await db.instructorApplication.create({
        data: {
          userId: user.id,
          status: "PENDING",
          experience: LONG_TEXT,
          field: stringField(body, "field", "تطوير الويب"),
          portfolioUrl: "https://example.com/portfolio",
          sampleVideoUrl: "https://example.com/sample.mp4",
        },
      });
      json(response, 200, { ...user, password: PASSWORD });
      return;
    }
    case "/pending-course": {
      const instructor = await createInstructor();
      const course = await createCourse({
        instructorProfileId: instructor.profileId,
        status: "PENDING_REVIEW",
        titleAr: stringField(body, "titleAr", `دورة مراجعة ${stamp()}`),
        titleEn: stringField(body, "titleEn", `Review course ${stamp()}`),
      });
      json(response, 200, { ...course, instructorEmail: instructor.email, password: PASSWORD });
      return;
    }
    case "/published-course": {
      const instructor = await createInstructor();
      const course = await createCourse({
        instructorProfileId: instructor.profileId,
        status: "PUBLISHED",
        priceCents: numberField(body, "priceCents", 20_000),
        isFree: false,
        titleAr: stringField(body, "titleAr", `دورة منشورة ${stamp()}`),
        titleEn: stringField(body, "titleEn", `Published course ${stamp()}`),
      });
      json(response, 200, {
        ...course,
        instructorEmail: instructor.email,
        instructorId: instructor.id,
        password: PASSWORD,
      });
      return;
    }
    case "/buyer": {
      const user = await createUser({ role: "STUDENT" });
      const admin = await db.user.findFirstOrThrow({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      const code = `E2E${stamp().replaceAll("-", "").toUpperCase().slice(0, 10)}`;
      await db.coupon.create({
        data: {
          code,
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
      json(response, 200, { ...user, password: PASSWORD, couponCode: code });
      return;
    }
    case "/learner": {
      const user = await createUser({ role: "STUDENT" });
      const slug = stringField(body, "courseSlug", "modern-react-app-development");
      const course = await db.course.findUniqueOrThrow({
        where: { slug },
        select: { id: true, slug: true },
      });
      const enrollment = await enroll({
        userId: user.id,
        courseId: course.id,
        progressPct: numberField(body, "progressPct", 0),
      });
      let seededLessonId: string | null = null;
      if (body["seedProgress"] === true) {
        const videoLessons = await db.lesson.findMany({
          where: {
            section: { courseId: course.id },
            type: "VIDEO",
            videoAsset: { status: "READY", durationSec: { gt: 0 } },
          },
          select: { id: true },
        });
        await db.lessonProgress.createMany({
          data: videoLessons.map((lesson) => ({
            enrollmentId: enrollment.id,
            lessonId: lesson.id,
            watchedSegments: [[0, 1]],
            lastPositionSec: 1,
          })),
          skipDuplicates: true,
        });
        const seeded = await db.lessonProgress.findFirst({
          where: { enrollmentId: enrollment.id },
          orderBy: { lessonId: "asc" },
          select: { lessonId: true },
        });
        seededLessonId = seeded?.lessonId ?? null;
      }
      const minimumVideoDuration = numberField(body, "minVideoDurationSec", 0);
      const lessons = await db.lesson.findMany({
        where: { section: { courseId: course.id }, isPublished: true },
        orderBy: [{ section: { sortOrder: "asc" } }, { sortOrder: "asc" }],
        select: {
          id: true,
          type: true,
          isPreview: true,
          videoAsset: { select: { durationSec: true } },
        },
      });
      // Journey 4 needs enough tail to pause before the clip ends; the default first video is
      // only eight seconds, so it asks for a longer one (P15-T01).
      const videoLesson =
        lessons.find(
          (lesson) =>
            lesson.type === "VIDEO" &&
            !lesson.isPreview &&
            (lesson.videoAsset?.durationSec ?? 0) >= minimumVideoDuration,
        ) ??
        lessons.find((lesson) => lesson.type === "VIDEO" && !lesson.isPreview) ??
        lessons.find((lesson) => lesson.type === "VIDEO");
      const textLesson = lessons.find((lesson) => lesson.type === "TEXT");
      const previewLesson = lessons.find((lesson) => lesson.isPreview) ?? videoLesson;
      json(response, 200, {
        ...user,
        password: PASSWORD,
        courseId: course.id,
        courseSlug: course.slug,
        enrollmentId: enrollment.id,
        videoLessonId: videoLesson?.id ?? null,
        textLessonId: textLesson?.id ?? null,
        previewLessonId: previewLesson?.id ?? videoLesson?.id ?? null,
        seededLessonId,
      });
      return;
    }
    case "/assessment": {
      const user = await createUser({ role: "STUDENT" });
      const assessment = await createAssessment(body["video"] === true);
      await enroll({ userId: user.id, courseId: assessment.courseId });
      json(response, 200, { ...user, password: PASSWORD, ...assessment });
      return;
    }
    case "/refundable": {
      const user = await createUser({ role: "STUDENT" });
      const slug = stringField(body, "courseSlug", "modern-react-app-development");
      const course = await db.course.findUniqueOrThrow({
        where: { slug },
        select: { id: true },
      });
      const order = await createPaidOrder({
        userId: user.id,
        courseId: course.id,
        progressPct: numberField(body, "progressPct", 0),
      });
      json(response, 200, { ...user, password: PASSWORD, orderId: order.id });
      return;
    }
    case "/payout": {
      const instructor = await createInstructor();
      const course = await createCourse({
        instructorProfileId: instructor.profileId,
        status: "PUBLISHED",
        priceCents: 20_000,
        titleAr: "دورة السحب E2E",
        titleEn: "Payout fixture course",
      });
      const learner = await createUser({ role: "STUDENT" });
      const order = await createPaidOrder({
        userId: learner.id,
        courseId: course.id,
        paidDaysAgo: numberField(body, "paidDaysAgo", 20),
      });
      const recentLearner = await createUser({ role: "STUDENT" });
      const pendingOrder = await createPaidOrder({
        userId: recentLearner.id,
        courseId: course.id,
      });
      json(response, 200, {
        ...instructor,
        password: PASSWORD,
        orderId: order.id,
        pendingOrderId: pendingOrder.id,
        learnerEmail: learner.email,
      });
      return;
    }
    case "/report": {
      const reporter = await createUser({ role: "STUDENT" });
      const review = await db.review.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (review === null) throw new Error("No review to report");
      const reason = `E2E report ${stamp()}`;
      const report = await db.report.create({
        data: {
          targetType: "REVIEW",
          targetId: review.id,
          reporterId: reporter.id,
          reason,
          details: "Automated report for the admin queue.",
        },
        select: { id: true },
      });
      json(response, 200, { ...reporter, password: PASSWORD, reportId: report.id, reason });
      return;
    }
    case "/contact": {
      const message = await db.contactMessage.create({
        data: {
          name: `E2E contact ${stamp()}`,
          email: `contact-${stamp()}@midad.test`,
          subject: `E2E contact subject ${stamp()}`,
          message: "رسالة اختبار آلي لصندوق رسائل التواصل.",
        },
        select: { id: true },
      });
      json(response, 200, { id: message.id });
      return;
    }
    case "/enroll": {
      const userId = stringField(body, "userId", "");
      const courseId = stringField(body, "courseId", "");
      const enrollment = await enroll({
        userId,
        courseId,
        progressPct: numberField(body, "progressPct", 0),
      });
      json(response, 200, { enrollmentId: enrollment.id });
      return;
    }
    case "/complete-course": {
      const result = await completeCourse(stringField(body, "courseId", ""));
      json(response, 200, result);
      return;
    }
    case "/order": {
      const order = await createPaidOrder({
        userId: stringField(body, "userId", ""),
        courseId: stringField(body, "courseId", ""),
        paidDaysAgo: numberField(body, "paidDaysAgo", 0),
        progressPct: numberField(body, "progressPct", 0),
      });
      json(response, 200, { orderId: order.id });
      return;
    }
    case "/expired-url": {
      const key = stringField(body, "key", "");
      const bucket = process.env["S3_BUCKET_PRIVATE"] ?? "";
      const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
        expiresIn: 1,
      });
      json(response, 200, { url });
      return;
    }
    case "/queue-email": {
      const job = await db.emailJob.create({
        data: {
          to: stringField(body, "to", ""),
          template: "welcome",
          locale: "ar",
          data: { name: "Chaos resume" },
        },
        select: { id: true },
      });
      json(response, 200, { id: job.id });
      return;
    }
    case "/expire-sessions": {
      const email = stringField(body, "email", "");
      const result = await db.session.deleteMany({ where: { user: { email } } });
      json(response, 200, { deleted: result.count });
      return;
    }
    case "/huge-course": {
      const instructor = await createInstructor();
      const course = await createCourse({
        instructorProfileId: instructor.profileId,
        status: "PUBLISHED",
        priceCents: 0,
        isFree: true,
        titleAr: "دورة ضخمة E2E",
        titleEn: "Huge E2E course",
      });
      await db.lesson.deleteMany({ where: { section: { courseId: course.id } } });
      const section = await db.section.findFirstOrThrow({
        where: { courseId: course.id },
        select: { id: true },
      });
      await db.lesson.createMany({
        data: Array.from({ length: 300 }, (_, index) => ({
          sectionId: section.id,
          type: "TEXT" as const,
          titleAr: `درس ${index + 1}`,
          titleEn: `Lesson ${index + 1}`,
          contentAr: LONG_TEXT,
          contentEn: LONG_TEXT,
          sortOrder: index,
        })),
      });
      json(response, 200, { courseId: course.id, courseSlug: course.slug, lessons: 300 });
      return;
    }
    case "/asset": {
      const asset = await db.videoAsset.findFirstOrThrow({
        where: { status: "READY", hlsKey: { not: null } },
        orderBy: { createdAt: "asc" },
        select: { originalKey: true, hlsKey: true },
      });
      json(response, 200, asset);
      return;
    }
    case "/visual-reset": {
      // The visual project runs last; reviews written by earlier suites change the course page
      // height even when the review block is masked. Restore the seed review set first (P15-T01).
      const prefixes = ["e2e-", "refund-", "journey", "buyer-", "payout-"];
      const author = { OR: prefixes.map((prefix) => ({ email: { startsWith: prefix } })) };
      const affected = await db.review.findMany({
        where: { user: author },
        select: { courseId: true },
        distinct: ["courseId"],
      });
      const removed = await db.review.deleteMany({ where: { user: author } });
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
      json(response, 200, { removed: removed.count });
      return;
    }
    default:
      json(response, 404, { error: "NOT_FOUND" });
  }
}

const server = createServer((request, response) => {
  void route(request, response).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "unknown fixture error";
    console.error("[fixtures]", message);
    json(response, 500, { error: "FIXTURE_FAILED", message });
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[fixtures] listening on http://127.0.0.1:${PORT}`);
});

function shutdown(): void {
  server.close(() => {
    void db.$disconnect().finally(() => process.exit(0));
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
