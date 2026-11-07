/**
 * Database seeder — `pnpm db:seed`.
 *
 * Goals (P01-T02):
 *   • real, bilingual content instead of placeholders: 8 categories, 10 instructors, 30 courses with
 *     genuine curricula, 200 learners with believable activity;
 *   • every state the UI must handle exists in the data (draft/pending/rejected/published/archived
 *     courses, a pending instructor application, a refund request, a payout request, an open question,
 *     a certificate, a banned user);
 *   • reproducible: the same run produces identical data and byte-identical generated media;
 *   • safe: refuses to touch a production database, and truncates only the app's own tables.
 *
 * The fixed accounts and the shared test password are documented in README § Test accounts.
 */

import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import { parseServerEnv } from "@/env-schema";
import { PrismaClient } from "@/generated/prisma/client";
import { normalizeBilingual } from "@/lib/search-normalize";
import { createStorage, storageConfigFromEnv, type Storage } from "@/server/storage-core";

import { categories } from "./data/categories";
import { courses } from "./data/courses";
import { instructors } from "./data/instructors";
import { SEED_PASSWORD, buildStudents, fixedAccounts } from "./data/students";
import {
  cleanMediaDir,
  generateCover,
  generateHandout,
  generateVideos,
  pick,
  readBytes,
} from "./media";

const STUDENT_COUNT = 200;
const INSTRUCTOR_COUNT = 10;

type Logger = (message: string) => void;

/* ------------------------------------------------------------------ *
 * Small deterministic helpers                                         *
 * ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000;

/** A date N days in the past, anchored to the start of the current day for reproducibility. */
function daysAgo(days: number): Date {
  const anchor = new Date();
  anchor.setUTCHours(12, 0, 0, 0);
  return new Date(anchor.getTime() - days * DAY_MS);
}

function chance(key: string, salt: string, percent: number): boolean {
  return pick(key, salt, 0, 99) < percent;
}

/* ------------------------------------------------------------------ *
 * Media                                                              *
 * ------------------------------------------------------------------ */

type SeedMedia = {
  /** Videos now include a demo VTT caption file uploaded beside each clip. */
  videos: Awaited<ReturnType<typeof generateVideos>>;
  covers: Map<string, string>;
  handouts: Map<string, { key: string; slug: string; titleEn: string }>;
};

async function buildMedia(storage: Storage, log: Logger): Promise<SeedMedia> {
  await cleanMediaDir();

  const videos = await generateVideos(log);
  for (const video of videos) {
    await storage.putObject({
      bucket: "private",
      key: video.key,
      body: await readBytes(video.path),
      contentType: "video/mp4",
      cacheControl: "public, max-age=31536000, immutable",
    });
    await storage.putObject({
      bucket: "private",
      key: video.captionsKey,
      body: await readBytes(video.captionsPath),
      contentType: "text/vtt; charset=utf-8",
      cacheControl: "public, max-age=31536000, immutable",
    });
  }

  const covers = new Map<string, string>();
  for (const course of courses) {
    const cover = await generateCover(course.slug);
    await storage.putObject({
      bucket: "public",
      key: cover.key,
      body: await readBytes(cover.path),
      contentType: "image/png",
      cacheControl: "public, max-age=31536000, immutable",
    });
    covers.set(course.slug, cover.key);
  }

  // One handout per course that has a FILE lesson, uploaded once and shared by its lessons.
  const handouts = new Map<string, { key: string; slug: string; titleEn: string }>();
  for (const course of courses) {
    const fileLesson = course.sections
      .flatMap((section) => section.lessons)
      .find((lesson) => lesson.type === "FILE");
    if (!fileLesson) continue;

    const slug = `${course.slug}-handout`;
    const handout = await generateHandout(slug, fileLesson.titleEn);
    await storage.putObject({
      bucket: "private",
      key: handout.key,
      body: await readBytes(handout.path),
      contentType: "application/pdf",
      cacheControl: "public, max-age=31536000, immutable",
    });
    handouts.set(course.slug, { key: handout.key, slug, titleEn: fileLesson.titleEn });
  }

  log(`media: ${videos.length} videos · ${covers.size} covers · ${handouts.size} handouts`);
  return { videos, covers, handouts };
}

/* ------------------------------------------------------------------ *
 * Wipe                                                               *
 * ------------------------------------------------------------------ */

async function truncateAll(prisma: PrismaClient, log: Logger): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (rows.length === 0) {
    log("wipe: nothing to truncate");
    return;
  }
  const list = rows.map((row) => `"public"."${row.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  log(`wipe: ${rows.length} tables truncated`);
}

/* ------------------------------------------------------------------ *
 * Main                                                               *
 * ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const log: Logger = (message) => console.log(`  ${message}`);

  const env = parseServerEnv(process.env);
  if (env.NODE_ENV === "production" && !env.ALLOW_SEED_IN_PRODUCTION) {
    throw new Error(
      "Refusing to seed a production database: set ALLOW_SEED_IN_PRODUCTION=true if you really mean it.",
    );
  }

  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const storage = createStorage(storageConfigFromEnv(env));

  console.log("Midad seed — starting");

  /* 1. Clean slate ------------------------------------------------- */
  await truncateAll(prisma, log);

  /* 2. Media ------------------------------------------------------- */
  const media = await buildMedia(storage, log);

  /* 3. Platform settings ------------------------------------------- */
  const settings: Array<[string, unknown]> = [
    ["commissionBps", 7000],
    ["vatBps", 1500],
    ["refundWindowDays", 14],
    ["refundMaxProgressPct", 30],
    ["payoutMinimumMinor", 10_000],
    ["quizPassPct", 70],
    ["quizMaxAttempts", 3],
    ["reviewMinProgressPct", 20],
    ["signedUrlTtlSec", 900],
    ["maintenanceMode", false],
    ["defaultCurrency", "SAR"],
    ["supportedCurrencies", ["SAR", "USD"]],
  ];
  await prisma.platformSetting.createMany({
    data: settings.map(([key, value]) => ({ key, value: value as never })),
  });
  log(`settings: ${settings.length} keys`);

  /* 4. People: admin, instructors, learners ------------------------ */
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const adminId = randomUUID();
  const admin = await prisma.user.create({
    data: {
      id: adminId,
      name: fixedAccounts.admin.nameAr,
      email: fixedAccounts.admin.email,
      username: fixedAccounts.admin.username,
      emailVerified: true,
      role: "ADMIN",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
      createdAt: daysAgo(900),
      accounts: {
        create: {
          id: randomUUID(),
          accountId: adminId,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });

  const instructorProfiles = new Map<string, { id: string; userId: string }>();

  for (const [index, instructor] of instructors.slice(0, INSTRUCTOR_COUNT).entries()) {
    const instructorUserId = randomUUID();
    const user = await prisma.user.create({
      data: {
        id: instructorUserId,
        name: instructor.nameAr,
        email: instructor.email,
        username: instructor.username,
        emailVerified: true,
        role: "INSTRUCTOR",
        status: "ACTIVE",
        locale: index % 5 === 4 ? "EN" : "AR",
        theme: "SYSTEM",
        createdAt: daysAgo(pick(instructor.username, "joined", 400, 1200)),
        accounts: {
          create: {
            id: randomUUID(),
            accountId: instructorUserId,
            providerId: "credential",
            password: passwordHash,
          },
        },
        instructorProfile: {
          create: {
            id: randomUUID(),
            headline: instructor.headlineAr,
            bioAr: instructor.bioAr,
            bioEn: instructor.bioEn,
            ...(instructor.websiteUrl === undefined ? {} : { websiteUrl: instructor.websiteUrl }),
            ...(instructor.twitterUrl === undefined ? {} : { twitterUrl: instructor.twitterUrl }),
            ...(instructor.linkedinUrl === undefined
              ? {}
              : { linkedinUrl: instructor.linkedinUrl }),
            approvedAt: daysAgo(pick(instructor.username, "approved", 200, 380)),
          },
        },
      },
      include: { instructorProfile: true },
    });
    if (user.instructorProfile === null) {
      throw new Error(`instructor profile missing for ${instructor.username}`);
    }
    instructorProfiles.set(instructor.username, {
      id: user.instructorProfile.id,
      userId: user.id,
    });
  }
  log(`instructors: ${instructorProfiles.size}`);

  const studentSeeds = buildStudents(STUDENT_COUNT);
  const studentIds = new Map<string, string>();

  for (const student of studentSeeds) {
    const studentUserId = randomUUID();
    const user = await prisma.user.create({
      data: {
        id: studentUserId,
        name: student.locale === "AR" ? student.nameAr : student.nameEn,
        email: student.email,
        username: student.username,
        emailVerified: !chance(student.username, "unverified", 8),
        role: "STUDENT",
        status: "ACTIVE",
        locale: student.locale,
        theme: student.theme,
        createdAt: daysAgo(student.joinedDaysAgo),
        accounts: {
          create: {
            id: randomUUID(),
            accountId: studentUserId,
            providerId: "credential",
            password: passwordHash,
          },
        },
      },
    });
    studentIds.set(student.username, user.id);
  }

  // Fixed accounts used by the test suite.
  const demoStudentId = randomUUID();
  const demoStudent = await prisma.user.create({
    data: {
      id: demoStudentId,
      name: fixedAccounts.studentWithProgress.nameAr,
      email: fixedAccounts.studentWithProgress.email,
      username: fixedAccounts.studentWithProgress.username,
      emailVerified: true,
      role: "STUDENT",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
      createdAt: daysAgo(120),
      accounts: {
        create: {
          id: randomUUID(),
          accountId: demoStudentId,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });
  studentIds.set(fixedAccounts.studentWithProgress.username, demoStudent.id);

  const newStudentId = randomUUID();
  const newStudent = await prisma.user.create({
    data: {
      id: newStudentId,
      name: fixedAccounts.brandNewStudent.nameAr,
      email: fixedAccounts.brandNewStudent.email,
      username: fixedAccounts.brandNewStudent.username,
      emailVerified: true,
      role: "STUDENT",
      status: "ACTIVE",
      locale: "AR",
      theme: "LIGHT",
      createdAt: daysAgo(1),
      accounts: {
        create: {
          id: randomUUID(),
          accountId: newStudentId,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });
  studentIds.set(fixedAccounts.brandNewStudent.username, newStudent.id);

  const bannedStudentId = randomUUID();
  const bannedStudent = await prisma.user.create({
    data: {
      id: bannedStudentId,
      name: fixedAccounts.bannedStudent.nameAr,
      email: fixedAccounts.bannedStudent.email,
      username: fixedAccounts.bannedStudent.username,
      emailVerified: true,
      role: "STUDENT",
      status: "BANNED",
      banReason: "رسائل مزعجة متكررة في نقاش الدورات",
      bannedAt: daysAgo(9),
      locale: "AR",
      theme: "SYSTEM",
      createdAt: daysAgo(200),
      accounts: {
        create: {
          id: randomUUID(),
          accountId: bannedStudentId,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });
  studentIds.set(fixedAccounts.bannedStudent.username, bannedStudent.id);

  const applicantId = randomUUID();
  const applicant = await prisma.user.create({
    data: {
      id: applicantId,
      name: fixedAccounts.pendingApplicant.nameAr,
      email: fixedAccounts.pendingApplicant.email,
      username: fixedAccounts.pendingApplicant.username,
      emailVerified: true,
      role: "STUDENT",
      status: "ACTIVE",
      locale: "AR",
      theme: "DARK",
      createdAt: daysAgo(30),
      accounts: {
        create: {
          id: randomUUID(),
          accountId: applicantId,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });

  await prisma.instructorApplication.create({
    data: {
      id: randomUUID(),
      userId: applicant.id,
      status: "PENDING",
      experience: "خمس سنوات في تدريب فرق الدعم الفني على أنظمة التذاكر وإدارة المعرفة.",
      field: "إدارة المعرفة وخدمة العملاء",
      portfolioUrl: "https://afnan-albaqami.example/portfolio",
      sampleVideoUrl: "https://example.com/sample-lesson.mp4",
      createdAt: daysAgo(6),
    },
  });

  log(`learners: ${studentSeeds.length} + 5 fixed accounts`);

  /* 5. Categories -------------------------------------------------- */
  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const created = await prisma.category.create({
      data: {
        id: randomUUID(),
        slug: category.slug,
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        icon: category.icon,
        sortOrder: category.sortOrder,
      },
    });
    categoryIds.set(category.slug, created.id);
  }
  log(`categories: ${categoryIds.size}`);

  /* 6. Courses ----------------------------------------------------- */
  type CourseRef = {
    id: string;
    slug: string;
    priceCents: number;
    instructorProfileId: string;
    instructorUserId: string;
    language: "AR" | "EN";
    chapterLessonIds: string[];
    videoLessonIds: string[];
    quizLessonIds: string[];
    published: boolean;
  };

  const courseRefs: CourseRef[] = [];

  for (const [index, course] of courses.entries()) {
    // Realistic review queue: the majority published, plus one of each other state.
    const status = (():
      "DRAFT" | "PENDING_REVIEW" | "REJECTED" | "PUBLISHED" | "UNLISTED" | "ARCHIVED" => {
      if (index === 3) return "PENDING_REVIEW";
      if (index === 11) return "REJECTED";
      if (index === 19) return "DRAFT";
      if (index === 24) return "UNLISTED";
      if (index === 27) return "ARCHIVED";
      return "PUBLISHED";
    })();

    const instructor = instructorProfiles.get(course.instructorUsername);
    const categoryId = categoryIds.get(course.categorySlug);
    if (instructor === undefined || categoryId === undefined) {
      throw new Error(`course ${course.slug} references an unknown instructor/category`);
    }

    const chapterLessonIds: string[] = [];
    const videoLessonIds: string[] = [];
    const quizLessonIds: string[] = [];
    let totalDurationSec = 0;

    const published = status === "PUBLISHED" || status === "UNLISTED" || status === "ARCHIVED";

    const created = await prisma.course.create({
      data: {
        id: randomUUID(),
        slug: course.slug,
        instructorId: instructor.id,
        categoryId,
        titleAr: course.titleAr,
        titleEn: course.titleEn,
        subtitleAr: course.subtitleAr ?? null,
        subtitleEn: course.subtitleEn ?? null,
        descriptionAr: course.descriptionAr,
        descriptionEn: course.descriptionEn,
        titleNormalized: normalizeBilingual(course.titleAr, course.titleEn),
        descriptionNormalized: normalizeBilingual(
          course.subtitleAr,
          course.descriptionAr,
          course.descriptionEn,
        ),
        level: course.level,
        language: course.language,
        priceCents: course.priceCents,
        isFree: course.priceCents === 0,
        currency: "SAR",
        status,
        coverImageKey: media.covers.get(course.slug) ?? null,
        publishedAt: published ? daysAgo(pick(course.slug, "published", 20, 300)) : null,
        archivedAt: status === "ARCHIVED" ? daysAgo(5) : null,
        rejectionReason:
          status === "REJECTED"
            ? "الملخص لا يوضح المتعلّم المستهدف، وأوصاف الفيديو في الوحدة الثانية ناقصة."
            : null,
        objectives: {
          create: course.objectives.map((objective, order) => ({
            id: randomUUID(),
            sortOrder: order,
            textAr: objective.textAr,
            textEn: objective.textEn,
          })),
        },
        requirements: {
          create: course.requirements.map((requirement, order) => ({
            id: randomUUID(),
            sortOrder: order,
            textAr: requirement.textAr,
            textEn: requirement.textEn,
          })),
        },
      },
    });

    for (const [sectionIndex, section] of course.sections.entries()) {
      const createdSection = await prisma.section.create({
        data: {
          id: randomUUID(),
          courseId: created.id,
          titleAr: section.titleAr,
          titleEn: section.titleEn,
          sortOrder: sectionIndex,
        },
      });

      for (const [lessonIndex, lesson] of section.lessons.entries()) {
        const durationSec =
          lesson.type === "VIDEO"
            ? (lesson.durationSec ?? 420)
            : lesson.type === "TEXT"
              ? 300
              : lesson.type === "QUIZ"
                ? 480
                : 240;
        totalDurationSec += durationSec;

        const createdLesson = await prisma.lesson.create({
          data: {
            id: randomUUID(),
            sectionId: createdSection.id,
            type: lesson.type,
            titleAr: lesson.titleAr,
            titleEn: lesson.titleEn,
            sortOrder: lessonIndex,
            isPreview: lesson.isPreview ?? false,
            durationSec,
            contentAr: lesson.contentAr ?? null,
            contentEn: lesson.contentEn ?? null,
          },
        });
        chapterLessonIds.push(createdLesson.id);

        if (lesson.type === "VIDEO") {
          videoLessonIds.push(createdLesson.id);
          const asset = media.videos[lessonIndex % media.videos.length];
          if (asset === undefined) throw new Error("no generated video available");
          await prisma.videoAsset.create({
            data: {
              id: randomUUID(),
              lessonId: createdLesson.id,
              provider: "HLS",
              status: "READY",
              originalKey: asset.key,
              hlsKey: null,
              captionsKey: asset.captionsKey,
              thumbnailKey: media.covers.get(course.slug) ?? null,
              durationSec: asset.durationSec,
              sizeBytes: asset.sizeBytes,
              processedAt: daysAgo(pick(course.slug, `processed-${lessonIndex}`, 5, 60)),
            },
          });
        }

        if (lesson.type === "FILE") {
          const handout = media.handouts.get(course.slug);
          if (handout !== undefined) {
            await prisma.attachment.create({
              data: {
                id: randomUUID(),
                lessonId: createdLesson.id,
                titleAr: lesson.attachmentAr ?? lesson.titleAr,
                titleEn: lesson.attachmentEn ?? lesson.titleEn,
                fileKey: handout.key,
                mimeType: "application/pdf",
                sizeBytes: 40_000,
              },
            });
          }
        }

        if (lesson.type === "QUIZ" && lesson.quiz !== undefined) {
          quizLessonIds.push(createdLesson.id);
          const createdQuiz = await prisma.quiz.create({
            data: {
              id: randomUUID(),
              lessonId: createdLesson.id,
              titleAr: lesson.quiz.titleAr,
              titleEn: lesson.quiz.titleEn,
              passPct: lesson.quiz.passPct ?? 70,
              maxAttempts: lesson.quiz.maxAttempts ?? 3,
              timeLimitSec: lesson.quiz.timeLimitSec ?? null,
            },
          });

          for (const [questionIndex, question] of lesson.quiz.questions.entries()) {
            const createdQuestion = await prisma.question.create({
              data: {
                id: randomUUID(),
                quizId: createdQuiz.id,
                type: question.type,
                promptAr: question.promptAr,
                promptEn: question.promptEn,
                explanationAr: question.explanationAr ?? null,
                explanationEn: question.explanationEn ?? null,
                points: question.points ?? 1,
                sortOrder: questionIndex,
                acceptedAnswers: (question.acceptedAnswers ?? null) as never,
              },
            });

            if (question.options !== undefined) {
              await prisma.option.createMany({
                data: question.options.map((option, optionIndex) => ({
                  id: randomUUID(),
                  questionId: createdQuestion.id,
                  textAr: option.textAr,
                  textEn: option.textEn,
                  isCorrect: option.isCorrect,
                  sortOrder: optionIndex,
                })),
              });
            }
          }
        }
      }
    }

    await prisma.course.update({
      where: { id: created.id },
      data: { totalDurationSec },
    });

    courseRefs.push({
      id: created.id,
      slug: course.slug,
      priceCents: course.priceCents,
      instructorProfileId: instructor.id,
      instructorUserId: instructor.userId,
      language: course.language,
      chapterLessonIds,
      videoLessonIds,
      quizLessonIds,
      published,
    });
  }

  const publishedCourses = courseRefs.filter((course) => course.published);
  const paidCourses = publishedCourses.filter((course) => course.priceCents > 0);
  log(
    `courses: ${courseRefs.length} (${publishedCourses.length} sellable, ${paidCourses.length} paid)`,
  );

  /* 7. Coupons ----------------------------------------------------- */
  const wideCoupon = await prisma.coupon.create({
    data: {
      id: randomUUID(),
      code: "MIDAD15",
      type: "PERCENTAGE",
      percentage: 15,
      createdById: admin.id,
      startsAt: daysAgo(30),
      endsAt: daysAgo(-60),
      maxRedemptions: 500,
      maxPerUser: 1,
      minCartCents: 0,
    },
  });

  const scopedCourse = publishedCourses[0];
  if (scopedCourse !== undefined) {
    await prisma.coupon.create({
      data: {
        id: randomUUID(),
        code: "FIRSTCOURSE50",
        type: "FIXED",
        amountOffCents: 5000,
        courseId: scopedCourse.id,
        createdById: instructorProfiles.get(instructors[0]?.username ?? "")?.userId ?? admin.id,
        startsAt: daysAgo(14),
        endsAt: daysAgo(-14),
        maxRedemptions: 50,
        maxPerUser: 1,
        minCartCents: 9900,
      },
    });
  }
  log("coupons: 2");

  /* 8. Enrollment, orders and the ledger --------------------------- */
  type EnrollmentRef = {
    id: string;
    /** Stable "username:course-slug" key used to derive every seeded decision, so runs are reproducible. */
    key: string;
    userId: string;
    course: CourseRef;
    progressPct: number;
    persona: string;
    createdAt: Date;
  };

  const enrollmentRefs: EnrollmentRef[] = [];
  let orderSeq = 1000;

  for (const student of studentSeeds) {
    const userId = studentIds.get(student.username);
    if (userId === undefined) continue;

    const courseCount =
      student.persona === "newcomer"
        ? pick(student.username, "count", 0, 1)
        : student.persona === "browser"
          ? pick(student.username, "count", 1, 2)
          : pick(student.username, "count", 2, 4);

    const usedSlugs = new Set<string>();
    for (let slot = 0; slot < courseCount; slot += 1) {
      const course =
        publishedCourses[pick(student.username, `course-${slot}`, 0, publishedCourses.length - 1)];
      if (course === undefined || usedSlugs.has(course.slug)) continue;
      usedSlugs.add(course.slug);

      const createdAt = daysAgo(
        Math.max(1, student.joinedDaysAgo - pick(student.username, `enroll-${slot}`, 1, 90)),
      );
      const orderId = await createPurchaseIfNeeded({
        prisma,
        userId,
        course,
        createdAt,
        sequence: orderSeq,
        couponId: wideCoupon.id,
        useCoupon: chance(student.username, `coupon-${slot}`, 18),
        adminId: admin.id,
      });
      if (orderId !== null) orderSeq += 1;

      const progressPct =
        student.persona === "graduate"
          ? 100
          : student.persona === "active"
            ? pick(student.username, `progress-${slot}`, 15, 85)
            : student.persona === "browser"
              ? pick(student.username, `progress-${slot}`, 0, 20)
              : 0;

      const enrollment = await prisma.enrollment.create({
        data: {
          id: randomUUID(),
          userId,
          courseId: course.id,
          source: course.priceCents === 0 ? "FREE" : "PURCHASE",
          status: "ACTIVE",
          progressPct,
          orderId,
          createdAt,
          completedAt: progressPct === 100 ? daysAgo(pick(student.username, "done", 1, 30)) : null,
        },
      });
      enrollmentRefs.push({
        id: enrollment.id,
        key: `${student.username}:${course.slug}`,
        userId,
        course,
        progressPct,
        persona: student.persona,
        createdAt,
      });
    }
  }

  // The demo student owns a paid course they are mid-way through, which every E2E journey needs.
  const demoCourse = paidCourses[0];
  if (demoCourse === undefined) throw new Error("no paid course to attach to the demo student");
  const demoOrderId = await createPurchaseIfNeeded({
    prisma,
    userId: demoStudent.id,
    course: demoCourse,
    createdAt: daysAgo(45),
    sequence: orderSeq,
    couponId: wideCoupon.id,
    useCoupon: true,
    adminId: admin.id,
  });
  const demoEnrollment = await prisma.enrollment.create({
    data: {
      id: randomUUID(),
      userId: demoStudent.id,
      courseId: demoCourse.id,
      source: "PURCHASE",
      status: "ACTIVE",
      progressPct: 40,
      orderId: demoOrderId,
      createdAt: daysAgo(45),
    },
  });
  enrollmentRefs.push({
    id: demoEnrollment.id,
    key: `${fixedAccounts.studentWithProgress.username}:${demoCourse.slug}`,
    userId: demoStudent.id,
    course: demoCourse,
    progressPct: 40,
    persona: "active",
    createdAt: daysAgo(45),
  });

  // A free course the demo student finished, so a certificate exists to verify (BR-17).
  const freeCourse = publishedCourses.find((course) => course.priceCents === 0);
  if (freeCourse === undefined) throw new Error("no free course in the catalogue");
  const freeEnrollment = await prisma.enrollment.create({
    data: {
      id: randomUUID(),
      userId: demoStudent.id,
      courseId: freeCourse.id,
      source: "FREE",
      status: "ACTIVE",
      progressPct: 100,
      createdAt: daysAgo(30),
      completedAt: daysAgo(12),
    },
  });
  enrollmentRefs.push({
    id: freeEnrollment.id,
    key: `${fixedAccounts.studentWithProgress.username}:${freeCourse.slug}`,
    userId: demoStudent.id,
    course: freeCourse,
    progressPct: 100,
    persona: "graduate",
    createdAt: daysAgo(30),
  });

  log(`enrollments: ${enrollmentRefs.length}`);

  /* 9. Lesson progress, streaks, certificates ---------------------- */
  let progressRows = 0;
  let certificates = 0;
  /** (userId, day) pairs already written: a learner with two courses must not duplicate streak days. */
  const streakKeys = new Set<string>();

  for (const enrollment of enrollmentRefs) {
    const completedCount = Math.floor(
      (enrollment.course.chapterLessonIds.length * enrollment.progressPct) / 100,
    );

    for (const [lessonIndex, lessonId] of enrollment.course.chapterLessonIds.entries()) {
      const completed = lessonIndex < completedCount;
      if (!completed && lessonIndex > completedCount + 2) continue;

      const lastPositionSec = completed ? 0 : pick(enrollment.key, `pos-${lessonIndex}`, 30, 200);
      await prisma.lessonProgress.create({
        data: {
          id: randomUUID(),
          enrollmentId: enrollment.id,
          lessonId,
          completedAt: completed ? daysAgo(pick(enrollment.key, `c-${lessonIndex}`, 1, 40)) : null,
          lastPositionSec,
          watchedSegments: [[0, lastPositionSec]] as never,
        },
      });
      progressRows += 1;
    }

    // Streaks: consecutive days of activity, longer for the more engaged personas.
    const streakLength =
      enrollment.persona === "graduate"
        ? 14
        : enrollment.persona === "active"
          ? pick(enrollment.key, "streak", 3, 12)
          : 0;
    for (let day = 0; day < streakLength; day += 1) {
      const key = `${enrollment.userId}:${day}`;
      if (streakKeys.has(key)) continue;
      streakKeys.add(key);
      await prisma.streakDay.create({
        data: {
          id: randomUUID(),
          userId: enrollment.userId,
          day: daysAgo(day),
          activityCount: pick(enrollment.key, `act-${day}`, 1, 6),
        },
      });
    }

    // Quiz attempts: graduates have a passing attempt on every quiz (BR-17 requires it), active
    // learners have a mix of passes and one failed attempt to review.
    if (enrollment.progressPct >= 40) {
      for (const quizLessonId of enrollment.course.quizLessonIds) {
        const quiz = await prisma.quiz.findUnique({
          where: { lessonId: quizLessonId },
          include: { questions: { select: { points: true } } },
        });
        if (quiz === null) continue;

        const maxScore = quiz.questions.reduce((sum, question) => sum + question.points, 0) || 1;
        const passed = enrollment.progressPct === 100 || chance(enrollment.key, "quiz-pass", 65);
        const score = passed
          ? Math.max(1, Math.ceil((maxScore * (quiz.passPct + 8)) / 100))
          : Math.floor((maxScore * Math.max(0, quiz.passPct - 18)) / 100);
        const startedAt = daysAgo(pick(enrollment.key, `quiz-${quizLessonId}`, 2, 30));

        await prisma.quizAttempt.create({
          data: {
            id: randomUUID(),
            quizId: quiz.id,
            userId: enrollment.userId,
            enrollmentId: enrollment.id,
            status: "SUBMITTED",
            startedAt,
            expiresAt: new Date(startedAt.getTime() + 30 * 60 * 1000),
            submittedAt: new Date(startedAt.getTime() + 18 * 60 * 1000),
            score,
            maxScore,
            passed,
            answers: {} as never,
          },
        });
      }
    }

    if (enrollment.progressPct === 100) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: enrollment.userId } });
      const code = `MD-${randomCode(enrollment.key)}`;
      await prisma.certificate.create({
        data: {
          id: randomUUID(),
          userId: enrollment.userId,
          courseId: enrollment.course.id,
          enrollmentId: enrollment.id,
          code,
          recipientName: user.name,
          issuedAt: daysAgo(pick(enrollment.key, "issued", 1, 20)),
          pdfKey: null,
        },
      });
      certificates += 1;
    }
  }

  log(`progress rows: ${progressRows} · certificates: ${certificates}`);

  /* 10. Reviews, wishlists, notes, discussions --------------------- */
  let reviews = 0;
  let threads = 0;

  for (const enrollment of enrollmentRefs) {
    if (enrollment.progressPct < 20) continue; // BR-18
    if (!chance(enrollment.key, "reviews", 45)) continue;

    const rating = pick(enrollment.key, "rating", 3, 5);
    const course = enrollment.course;

    await prisma.review.create({
      data: {
        id: randomUUID(),
        userId: enrollment.userId,
        courseId: course.id,
        rating,
        body:
          rating >= 5
            ? "شرح مرتب من الأساسيات، والأمثلة قريبة من العمل الفعلي. أنهيت الوحدة الثالثة وطبقتها مباشرة في مشروعي."
            : "المحتوى مفيد والتمارين جيدة، لكن أتمنى تفصيلًا أكثر في آخر قسم من المشروع.",
        createdAt: daysAgo(pick(enrollment.key, "review-date", 1, 60)),
        ...(chance(enrollment.key, "reply", 30)
          ? {
              instructorReply: "شكرًا على الملاحظة، أضفت فيديو إضافيًا يشرح هذه النقطة بالتفصيل.",
              instructorRepliedAt: daysAgo(pick(enrollment.key, "reply-date", 1, 20)),
            }
          : {}),
      },
    });
    reviews += 1;

    if (chance(enrollment.key, "wishlist", 25)) {
      const other = publishedCourses[pick(enrollment.key, "wish", 0, publishedCourses.length - 1)];
      if (other !== undefined && other.id !== course.id) {
        await prisma.wishlist
          .create({
            data: { id: randomUUID(), userId: enrollment.userId, courseId: other.id },
          })
          .catch(() => undefined);
      }
    }

    if (chance(enrollment.key, "note", 30)) {
      const lessonId =
        course.chapterLessonIds[
          pick(enrollment.key, "note-lesson", 0, course.chapterLessonIds.length - 1)
        ];
      if (lessonId !== undefined) {
        await prisma.note.create({
          data: {
            id: randomUUID(),
            userId: enrollment.userId,
            lessonId,
            body: "أعد تشغيل هذا الجزء عند التنفيذ: الترتيب هنا مختلف عن التوثيق الرسمي.",
            timestampSec: pick(enrollment.key, "note-time", 30, 400),
          },
        });
      }
    }

    if (chance(enrollment.key, "thread", 12)) {
      const lessonId = course.videoLessonIds[0];
      const thread = await prisma.thread.create({
        data: {
          id: randomUUID(),
          courseId: course.id,
          lessonId: lessonId ?? null,
          authorId: enrollment.userId,
          title: "سؤال عن الفرق بين الطريقتين في المثال الثاني",
          body: "طبّقت الطريقة الأولى ونجحت، ولم أفهم متى أستخدم الثانية. هل الفرق في الأداء فقط؟",
          createdAt: daysAgo(pick(enrollment.key, "thread-date", 1, 40)),
        },
      });
      const reply = await prisma.reply.create({
        data: {
          id: randomUUID(),
          threadId: thread.id,
          authorId: course.instructorUserId,
          body: "الفرق في الأداء لا في النتيجة. الطريقة الثانية تتجنب إعادة الحساب عند تغيّر المدخل، لذلك هي الأنسب داخل الحلقات الطويلة.",
          isInstructorAnswer: true,
          createdAt: daysAgo(pick(enrollment.key, "reply-date2", 1, 20)),
        },
      });
      await prisma.thread.update({
        where: { id: thread.id },
        data: { acceptedReplyId: reply.id, isResolved: true },
      });
      threads += 1;
    }
  }

  log(`reviews: ${reviews} · threads: ${threads}`);

  /* 11. Notifications and announcements ---------------------------- */
  const notificationSamples: Array<{
    userId: string;
    type: "WELCOME" | "CERTIFICATE_ISSUED" | "QUESTION_ANSWERED" | "NEW_LESSON";
    title: string;
    body: string;
  }> = [
    {
      userId: newStudent.id,
      type: "WELCOME",
      title: "أهلًا بك في مِداد",
      body: "ابدأ بدورة مجانية ثم أكمل التقييم لتحصل على شهادتك الأولى.",
    },
    {
      userId: demoStudent.id,
      type: "CERTIFICATE_ISSUED",
      title: "صدرت شهادتك",
      body: "شهادتك في الدورة المجانية جاهزة للتنزيل والتحقق.",
    },
    {
      userId: demoStudent.id,
      type: "QUESTION_ANSWERED",
      title: "ردّ المدرّب على سؤالك",
      body: "أضاف المدرّب توضيحًا لسؤالك عن الفرق بين الطريقتين.",
    },
  ];
  await prisma.notification.createMany({
    data: notificationSamples.map((sample, index) => ({
      id: randomUUID(),
      userId: sample.userId,
      type: sample.type,
      title: sample.title,
      body: sample.body,
      readAt: index === 0 ? null : daysAgo(2),
      createdAt: daysAgo(index + 1),
    })),
  });

  for (const course of publishedCourses.slice(0, 4)) {
    await prisma.announcement.create({
      data: {
        id: randomUUID(),
        courseId: course.id,
        authorId: course.instructorUserId,
        title: "تحديث على مشروع الوحدة الأخيرة",
        body: "أضفت قائمة تحقق قبل التسليم، وستناقشها في الجلسة القادمة من التعليقات.",
        createdAt: daysAgo(pick(course.slug, "announce", 1, 25)),
      },
    });
  }

  /* 12. Commerce edge states: refund request, payout request ------ */
  const refundableOrder = await prisma.order.findFirst({
    where: { status: "PAID" },
    orderBy: { createdAt: "desc" },
  });
  if (refundableOrder !== null) {
    await prisma.refund.create({
      data: {
        id: randomUUID(),
        orderId: refundableOrder.id,
        requestedById: refundableOrder.userId,
        status: "REQUESTED",
        reason: "اشتريت الدورة بالخطأ، كنت أبحث عن دورة أخرى في نفس المجال.",
        amountCents: refundableOrder.totalCents,
        createdAt: daysAgo(2),
      },
    });
  }

  const topInstructor = instructorProfiles.get(instructors[0]?.username ?? "");
  if (topInstructor !== undefined) {
    const balance = await prisma.ledgerEntry.aggregate({
      where: { instructorProfileId: topInstructor.id },
      _sum: { amountCents: true },
    });
    const available = balance._sum.amountCents ?? 0;
    if (available >= 10_000) {
      await prisma.payout.create({
        data: {
          id: randomUUID(),
          instructorProfileId: topInstructor.id,
          amountCents: Math.min(available, 250_000),
          status: "REQUESTED",
          createdAt: daysAgo(3),
        },
      });
    }
  }

  /* 13. Denormalized aggregates ----------------------------------- */
  const publishedIds = publishedCourses.map((course) => course.id);

  await prisma.$executeRawUnsafe(
    `
    UPDATE courses c
    SET "studentsCount" = (SELECT COUNT(*) FROM enrollments e WHERE e."courseId" = c.id AND e.status = 'ACTIVE')
    WHERE c.id = ANY($1::text[])
  `,
    publishedIds,
  );

  await prisma.$executeRawUnsafe(`
    UPDATE courses c
    SET "ratingCount" = agg.count, "ratingAvg" = agg.avg
    FROM (
      SELECT "courseId", COUNT(*)::int AS count, ROUND(AVG(rating) * 100)::int AS avg
      FROM reviews WHERE "isHidden" = false GROUP BY "courseId"
    ) agg
    WHERE c.id = agg."courseId"
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE enrollments e
    SET "progressPct" = LEAST(100, GREATEST(0,
      (SELECT COUNT(*) FROM lesson_progress lp WHERE lp."enrollmentId" = e.id AND lp."completedAt" IS NOT NULL) * 100
      / GREATEST(1, (SELECT COUNT(*) FROM lessons l JOIN sections s ON s.id = l."sectionId" WHERE s."courseId" = e."courseId" AND l."isPublished" = true))
    ))
  `);

  const summary = await prisma.$queryRaw<Array<{ table: string; count: bigint }>>`
    SELECT 'users' AS table, COUNT(*) AS count FROM users
    UNION ALL SELECT 'instructor_profiles', COUNT(*) FROM instructor_profiles
    UNION ALL SELECT 'courses', COUNT(*) FROM courses
    UNION ALL SELECT 'sections', COUNT(*) FROM sections
    UNION ALL SELECT 'lessons', COUNT(*) FROM lessons
    UNION ALL SELECT 'quizzes', COUNT(*) FROM quizzes
    UNION ALL SELECT 'questions', COUNT(*) FROM questions
    UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
    UNION ALL SELECT 'lesson_progress', COUNT(*) FROM lesson_progress
    UNION ALL SELECT 'orders', COUNT(*) FROM orders
    UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
    UNION ALL SELECT 'ledger_entries', COUNT(*) FROM ledger_entries
    UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
    UNION ALL SELECT 'certificates', COUNT(*) FROM certificates
    UNION ALL SELECT 'threads', COUNT(*) FROM threads
    UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
  `;

  console.log("Midad seed — done");
  for (const row of summary) {
    console.log(`  ${row.table.padEnd(20)} ${row.count.toString()}`);
  }

  await prisma.$disconnect();
}

/* ------------------------------------------------------------------ *
 * Purchase helper                                                    *
 * ------------------------------------------------------------------ */

/**
 * Creates Order → OrderItem → Payment → LedgerEntry for a paid course inside one transaction,
 * and returns the order id. Free courses return null: BR-09 allows a FREE enrollment without an order.
 * The instructor share and commission are frozen on the line (BR-11).
 */
async function createPurchaseIfNeeded(input: {
  prisma: PrismaClient;
  userId: string;
  course: { id: string; slug: string; priceCents: number; instructorProfileId: string };
  createdAt: Date;
  sequence: number;
  couponId: string;
  useCoupon: boolean;
  adminId: string;
}): Promise<string | null> {
  const { prisma, userId, course, createdAt, sequence, couponId, useCoupon } = input;
  if (course.priceCents === 0) return null;

  const commissionBps = 7000;
  const discountCents = useCoupon ? Math.round((course.priceCents * 15) / 100) : 0;
  const subtotalCents = course.priceCents;
  const taxableCents = subtotalCents - discountCents;
  const taxCents = Math.round(taxableCents * 0.15);
  const totalCents = taxableCents + taxCents;
  const instructorShareCents = Math.round((taxableCents * commissionBps) / 10_000);

  const orderId = randomUUID();
  const courseTitle = await prisma.course.findUniqueOrThrow({
    where: { id: course.id },
    select: { titleAr: true, titleEn: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.order.create({
      data: {
        id: orderId,
        userId,
        status: "PAID",
        currency: "SAR",
        subtotalCents,
        discountCents,
        taxCents,
        totalCents,
        vatBps: 1500,
        stripeSessionId: `cs_test_seed_${sequence}`,
        createdAt,
        paidAt: createdAt,
      },
    });

    await tx.orderItem.create({
      data: {
        id: randomUUID(),
        orderId,
        courseId: course.id,
        instructorProfileId: course.instructorProfileId,
        unitPriceCents: subtotalCents,
        discountCents,
        commissionBps,
        instructorShareCents,
        titleSnapshot: courseTitle.titleAr || courseTitle.titleEn || course.slug,
        createdAt,
      },
    });

    await tx.payment.create({
      data: {
        id: randomUUID(),
        orderId,
        provider: "STRIPE",
        status: "SUCCEEDED",
        amountCents: totalCents,
        currency: "SAR",
        stripePaymentIntentId: `pi_test_seed_${sequence}`,
        stripeEventId: `evt_test_seed_${sequence}`,
        createdAt,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        id: randomUUID(),
        instructorProfileId: course.instructorProfileId,
        type: "SALE",
        amountCents: instructorShareCents,
        currency: "SAR",
        orderId,
        description: `بيع دورة: ${courseTitle.titleAr}`,
        createdAt,
      },
    });

    if (discountCents > 0) {
      await tx.couponRedemption.create({
        data: {
          id: randomUUID(),
          couponId,
          userId,
          orderId,
          amountOffCents: discountCents,
          createdAt,
        },
      });
    }
  });

  return orderId;
}

/** MD-XXXX-XXXX verification code derived deterministically from a stable id (BR-17 format). */
function randomCode(seed: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = 0;
  for (const character of seed) value = (value * 31 + character.charCodeAt(0)) % 1_000_000_000;
  const digits = value.toString().padStart(9, "0");
  const pickCharacter = (index: number): string =>
    alphabet[Number(digits[index]) % alphabet.length] ?? "A";
  return `${pickCharacter(0)}${pickCharacter(1)}${pickCharacter(2)}${pickCharacter(3)}-${pickCharacter(4)}${pickCharacter(5)}${pickCharacter(6)}${pickCharacter(7)}`;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
