import "server-only";

// Server-side quiz truth: questions with correctness never leave this module before submission.
import { conflict, forbidden, notFound } from "@/lib/errors";
import { gradeAttempt, gradeQuestion, type AnswerInput } from "@/lib/quiz";
import { issueCertificateIfEligible } from "@/server/certificates";
import { db } from "@/server/db";
import { recordStreak, recomputeEnrollmentProgress } from "@/server/progress";
import type { SessionUser } from "@/server/session";

/**
 * Quiz attempts and grading (P08-T02, BR-16).
 *
 * The take payload never selects `isCorrect`, `acceptedAnswers` or explanations. Those are loaded
 * only inside submission and review, after the attempt is owned and submitted. The server enforces
 * the attempt cap and the timer (with a ten-second grace) regardless of what the client sends.
 */

const GRACE_SEC = 10;

function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let state = 2166136261;
  for (const character of seed) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619) >>> 0;
  }
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swap = state % (index + 1);
    const current = copy[index];
    const other = copy[swap];
    if (current !== undefined && other !== undefined) {
      copy[index] = other;
      copy[swap] = current;
    }
  }
  return copy;
}

async function enrollmentForLesson(user: SessionUser, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      type: true,
      section: { select: { courseId: true, course: { select: { slug: true } } } },
      quiz: { select: { id: true } },
    },
  });
  if (lesson === null) throw notFound("Lesson not found");
  if (lesson.type !== "QUIZ" || lesson.quiz === null) throw conflict("NOT_A_QUIZ_LESSON");
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: lesson.section.courseId } },
    select: { id: true, status: true },
  });
  if (enrollment?.status !== "ACTIVE") throw forbidden("ENROLLMENT_REQUIRED");
  return { lesson, quizId: lesson.quiz.id, enrollmentId: enrollment.id };
}

export type QuizOverview = {
  quizTitleAr: string;
  quizTitleEn: string;
  passPct: number;
  maxAttempts: number;
  timeLimitSec: number | null;
  attemptsUsed: number;
  bestPercentage: number | null;
  hasInProgressAttempt: boolean;
  passed: boolean;
  attempts: Array<{ id: string; percentage: number; passed: boolean; submittedAt: Date | null }>;
};

export async function getQuizOverview(user: SessionUser, lessonId: string): Promise<QuizOverview> {
  const { quizId } = await enrollmentForLesson(user, lessonId);
  const quiz = await db.quiz.findUniqueOrThrow({
    where: { id: quizId },
    select: {
      titleAr: true,
      titleEn: true,
      passPct: true,
      maxAttempts: true,
      timeLimitSec: true,
      attempts: {
        where: { userId: user.id },
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          score: true,
          maxScore: true,
          passed: true,
          submittedAt: true,
        },
      },
    },
  });

  const finished = quiz.attempts.filter(
    (attempt) => attempt.status === "SUBMITTED" || attempt.status === "EXPIRED",
  );
  const percentages = finished.map((attempt) =>
    attempt.maxScore === 0 ? 0 : Math.round((attempt.score / attempt.maxScore) * 100),
  );
  const now = Date.now();

  return {
    quizTitleAr: quiz.titleAr,
    quizTitleEn: quiz.titleEn,
    passPct: quiz.passPct,
    maxAttempts: quiz.maxAttempts,
    timeLimitSec: quiz.timeLimitSec,
    attemptsUsed: finished.length,
    bestPercentage: percentages.length === 0 ? null : Math.max(...percentages),
    hasInProgressAttempt: quiz.attempts.some(
      (attempt) =>
        attempt.status === "IN_PROGRESS" &&
        (attempt.expiresAt === null || attempt.expiresAt.getTime() + 10_000 > now),
    ),
    passed: finished.some((attempt) => attempt.passed),
    attempts: finished.map((attempt) => ({
      id: attempt.id,
      percentage: attempt.maxScore === 0 ? 0 : Math.round((attempt.score / attempt.maxScore) * 100),
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
    })),
  };
}

export async function startQuizAttempt(
  user: SessionUser,
  lessonId: string,
): Promise<{ attemptId: string }> {
  const { quizId, enrollmentId } = await enrollmentForLesson(user, lessonId);
  const quiz = await db.quiz.findUniqueOrThrow({
    where: { id: quizId },
    select: {
      maxAttempts: true,
      timeLimitSec: true,
      questions: { select: { points: true } },
      attempts: {
        where: { userId: user.id },
        select: { id: true, status: true, expiresAt: true, submittedAt: true },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  const now = new Date();
  for (const attempt of quiz.attempts) {
    if (attempt.status === "IN_PROGRESS") {
      if (
        attempt.expiresAt !== null &&
        now.getTime() > attempt.expiresAt.getTime() + GRACE_SEC * 1000
      ) {
        await db.quizAttempt.update({
          where: { id: attempt.id },
          data: { status: "EXPIRED", submittedAt: attempt.expiresAt },
        });
      } else {
        return { attemptId: attempt.id };
      }
    }
  }

  const used = quiz.attempts.filter((attempt) => attempt.status !== "IN_PROGRESS").length;
  if (used >= quiz.maxAttempts) throw conflict("MAX_ATTEMPTS_REACHED");

  const maxScore = quiz.questions.reduce((total, question) => total + question.points, 0);
  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      userId: user.id,
      enrollmentId,
      status: "IN_PROGRESS",
      maxScore,
      expiresAt:
        quiz.timeLimitSec === null ? null : new Date(now.getTime() + quiz.timeLimitSec * 1000),
    },
    select: { id: true },
  });
  return { attemptId: attempt.id };
}

export type TakingQuestion = {
  id: string;
  type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  promptAr: string;
  promptEn: string;
  points: number;
  options: Array<{ id: string; textAr: string; textEn: string }>;
};

export type QuizTakingData = {
  attemptId: string;
  lessonId: string;
  courseSlug: string;
  titleAr: string;
  titleEn: string;
  passPct: number;
  maxAttempts: number;
  expiresAt: Date | null;
  questions: TakingQuestion[];
};

export async function getQuizAttemptForTaking(
  user: SessionUser,
  attemptId: string,
): Promise<QuizTakingData | null> {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      status: true,
      expiresAt: true,
      quiz: {
        select: {
          titleAr: true,
          titleEn: true,
          passPct: true,
          maxAttempts: true,
          shuffleQuestions: true,
          shuffleOptions: true,
          lessonId: true,
          lesson: { select: { section: { select: { course: { select: { slug: true } } } } } },
          questions: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              type: true,
              promptAr: true,
              promptEn: true,
              points: true,
              options: {
                orderBy: { sortOrder: "asc" },
                select: { id: true, textAr: true, textEn: true },
              },
            },
          },
        },
      },
    },
  });
  if (attempt === null || attempt.userId !== user.id) throw notFound("Attempt not found");
  if (attempt.status !== "IN_PROGRESS") return null;
  if (attempt.expiresAt !== null && Date.now() > attempt.expiresAt.getTime() + GRACE_SEC * 1000) {
    await db.quizAttempt.update({
      where: { id: attempt.id },
      data: { status: "EXPIRED", submittedAt: attempt.expiresAt },
    });
    return null;
  }

  const questions = attempt.quiz.shuffleQuestions
    ? seededShuffle(attempt.quiz.questions, attempt.id)
    : attempt.quiz.questions;
  return {
    attemptId: attempt.id,
    lessonId: attempt.quiz.lessonId,
    courseSlug: attempt.quiz.lesson.section.course.slug,
    titleAr: attempt.quiz.titleAr,
    titleEn: attempt.quiz.titleEn,
    passPct: attempt.quiz.passPct,
    maxAttempts: attempt.quiz.maxAttempts,
    expiresAt: attempt.expiresAt,
    questions: questions.map((question) => ({
      id: question.id,
      type: question.type,
      promptAr: question.promptAr,
      promptEn: question.promptEn,
      points: question.points,
      options: attempt.quiz.shuffleOptions
        ? seededShuffle(question.options, `${attempt.id}:${question.id}`)
        : question.options,
    })),
  };
}

export type SubmitResult = {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
};

export async function submitQuizAttempt(
  user: SessionUser,
  attemptId: string,
  answers: AnswerInput[],
): Promise<SubmitResult> {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      enrollmentId: true,
      status: true,
      expiresAt: true,
      enrollment: { select: { courseId: true } },
      quiz: {
        select: {
          passPct: true,
          lessonId: true,
          questions: {
            select: {
              id: true,
              type: true,
              points: true,
              acceptedAnswers: true,
              options: { select: { id: true, isCorrect: true } },
            },
          },
        },
      },
    },
  });
  if (attempt === null || attempt.userId !== user.id) throw notFound("Attempt not found");
  if (attempt.status !== "IN_PROGRESS") throw conflict("ATTEMPT_ALREADY_SUBMITTED");

  const now = new Date();
  if (
    attempt.expiresAt !== null &&
    now.getTime() > attempt.expiresAt.getTime() + GRACE_SEC * 1000
  ) {
    await db.quizAttempt.update({
      where: { id: attempt.id },
      data: { status: "EXPIRED", submittedAt: attempt.expiresAt },
    });
    throw conflict("ATTEMPT_EXPIRED");
  }

  const questions = attempt.quiz.questions.map((question) => ({
    id: question.id,
    type: question.type,
    points: question.points,
    correctOptionIds: question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id),
    acceptedAnswers: Array.isArray(question.acceptedAnswers)
      ? question.acceptedAnswers.filter((value): value is string => typeof value === "string")
      : [],
  }));
  const graded = gradeAttempt(questions, answers, attempt.quiz.passPct);

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.quizAttempt.updateMany({
      where: { id: attempt.id, status: "IN_PROGRESS" },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        score: graded.score,
        maxScore: graded.maxScore,
        passed: graded.passed,
        answers,
      },
    });
    if (updated.count === 0) throw conflict("ATTEMPT_ALREADY_SUBMITTED");

    if (graded.passed) {
      const enrollment = await tx.enrollment.findUniqueOrThrow({
        where: { id: attempt.enrollmentId },
        select: { courseId: true },
      });
      await tx.lessonProgress.upsert({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: attempt.enrollmentId,
            lessonId: attempt.quiz.lessonId,
          },
        },
        create: {
          enrollmentId: attempt.enrollmentId,
          lessonId: attempt.quiz.lessonId,
          completedAt: now,
        },
        update: { completedAt: now },
      });
      await recomputeEnrollmentProgress(tx, user.id, enrollment.courseId);
      await recordStreak(tx, user.id);
    }

    return {
      score: graded.score,
      maxScore: graded.maxScore,
      percentage: graded.percentage,
      passed: graded.passed,
    };
  });

  if (result.passed) {
    await issueCertificateIfEligible(user.id, attempt.enrollment.courseId);
  }
  return result;
}

export type ReviewQuestion = {
  id: string;
  type: string;
  promptAr: string;
  promptEn: string;
  points: number;
  earned: number;
  explanationAr: string | null;
  explanationEn: string | null;
  options: Array<{ id: string; textAr: string; textEn: string; isCorrect: boolean }>;
  acceptedAnswers: string[];
  selectedOptionIds: string[];
  textAnswer: string | null;
};

export type AttemptReview = {
  attemptId: string;
  lessonId: string;
  courseSlug: string;
  titleAr: string;
  titleEn: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  submittedAt: Date | null;
  questions: ReviewQuestion[];
};

function parseAnswers(value: unknown): AnswerInput[] {
  if (!Array.isArray(value)) return [];
  const answers: AnswerInput[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.questionId !== "string") continue;
    answers.push({
      questionId: record.questionId,
      ...(typeof record.optionId === "string" ? { optionId: record.optionId } : {}),
      ...(Array.isArray(record.optionIds)
        ? { optionIds: record.optionIds.filter((id): id is string => typeof id === "string") }
        : {}),
      ...(typeof record.text === "string" ? { text: record.text } : {}),
    });
  }
  return answers;
}

export async function getAttemptReview(
  user: SessionUser,
  attemptId: string,
): Promise<AttemptReview | null> {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      status: true,
      score: true,
      maxScore: true,
      passed: true,
      submittedAt: true,
      answers: true,
      quiz: {
        select: {
          titleAr: true,
          titleEn: true,
          lessonId: true,
          lesson: { select: { section: { select: { course: { select: { slug: true } } } } } },
          questions: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              type: true,
              promptAr: true,
              promptEn: true,
              explanationAr: true,
              explanationEn: true,
              points: true,
              acceptedAnswers: true,
              options: {
                orderBy: { sortOrder: "asc" },
                select: { id: true, textAr: true, textEn: true, isCorrect: true },
              },
            },
          },
        },
      },
    },
  });
  if (attempt === null || attempt.userId !== user.id) throw notFound("Attempt not found");
  if (attempt.status === "IN_PROGRESS") return null;

  const answers = parseAnswers(attempt.answers);
  const byQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  const percentage =
    attempt.maxScore === 0 ? 0 : Math.round((attempt.score / attempt.maxScore) * 100);

  return {
    attemptId: attempt.id,
    lessonId: attempt.quiz.lessonId,
    courseSlug: attempt.quiz.lesson.section.course.slug,
    titleAr: attempt.quiz.titleAr,
    titleEn: attempt.quiz.titleEn,
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt,
    questions: attempt.quiz.questions.map((question) => {
      const answer = byQuestion.get(question.id);
      const selectedOptionIds =
        answer?.optionIds !== undefined && answer.optionIds !== null
          ? answer.optionIds
          : answer?.optionId !== undefined && answer.optionId !== null
            ? [answer.optionId]
            : [];
      const acceptedAnswers = Array.isArray(question.acceptedAnswers)
        ? question.acceptedAnswers.filter((value): value is string => typeof value === "string")
        : [];
      const graded = gradeQuestion(
        {
          id: question.id,
          type: question.type,
          points: question.points,
          correctOptionIds: question.options
            .filter((option) => option.isCorrect)
            .map((option) => option.id),
          acceptedAnswers,
        },
        answer,
      );
      return {
        id: question.id,
        type: question.type,
        promptAr: question.promptAr,
        promptEn: question.promptEn,
        points: question.points,
        earned: graded.earned,
        explanationAr: question.explanationAr,
        explanationEn: question.explanationEn,
        options: question.options,
        acceptedAnswers,
        selectedOptionIds,
        textAnswer: answer?.text ?? null,
      };
    }),
  };
}
