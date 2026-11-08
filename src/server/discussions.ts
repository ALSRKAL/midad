import "server-only";

import { conflict, forbidden, notFound } from "@/lib/errors";
import { env } from "@/env";
import { db } from "@/server/db";
import { enqueueEmail } from "@/server/email-queue";
import { createNotification } from "@/server/notifications";
import type { SessionUser } from "@/server/session";

/**
 * Private lesson notes and course discussion (BR-19).
 *
 * Notes are always filtered by author: no endpoint returns another learner's notes. Discussions are
 * writable only by an actively enrolled learner or the course's own instructor; another instructor
 * is refused even though they have the INSTRUCTOR role.
 */

async function courseRole(user: SessionUser, courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, instructor: { select: { userId: true } } },
  });
  if (course === null) throw notFound("Course not found");
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { status: true },
  });
  return {
    isInstructor: course.instructor.userId === user.id,
    enrolled: enrollment?.status === "ACTIVE",
  };
}

async function assertCanParticipate(
  user: SessionUser,
  courseId: string,
): Promise<{ instructor: boolean }> {
  const role = await courseRole(user, courseId);
  if (!role.enrolled && !role.isInstructor) throw forbidden("ENROLLMENT_REQUIRED");
  return { instructor: role.isInstructor };
}

export type LessonNote = { id: string; body: string; timestampSec: number | null; createdAt: Date };

export async function listNotes(userId: string, lessonId: string): Promise<LessonNote[]> {
  return db.note.findMany({
    where: { userId, lessonId },
    orderBy: { createdAt: "desc" },
    select: { id: true, body: true, timestampSec: true, createdAt: true },
  });
}

export async function addNote(input: {
  userId: string;
  lessonId: string;
  body: string;
  timestampSec: number | null;
}): Promise<{ id: string }> {
  const lesson = await db.lesson.findUnique({
    where: { id: input.lessonId },
    select: { id: true, section: { select: { courseId: true } } },
  });
  if (lesson === null) throw notFound("Lesson not found");
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: input.userId, courseId: lesson.section.courseId } },
    select: { status: true },
  });
  if (enrollment?.status !== "ACTIVE") throw forbidden("ENROLLMENT_REQUIRED");

  const note = await db.note.create({
    data: {
      userId: input.userId,
      lessonId: input.lessonId,
      body: input.body.trim(),
      timestampSec: input.timestampSec,
    },
    select: { id: true },
  });
  return note;
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const deleted = await db.note.deleteMany({ where: { id: noteId, userId } });
  if (deleted.count === 0) throw notFound("Note not found");
}

export type ThreadView = {
  id: string;
  title: string;
  body: string;
  isResolved: boolean;
  acceptedReplyId: string | null;
  createdAt: Date;
  authorName: string;
  authorId: string;
  replies: Array<{
    id: string;
    body: string;
    createdAt: Date;
    authorId: string;
    authorName: string;
    isInstructorAnswer: boolean;
    accepted: boolean;
  }>;
};

export async function listThreads(
  user: SessionUser,
  courseId: string,
  lessonId: string | null,
): Promise<ThreadView[]> {
  await assertCanParticipate(user, courseId);
  const threads = await db.thread.findMany({
    where: {
      courseId,
      isHidden: false,
      ...(lessonId === null ? {} : { OR: [{ lessonId }, { lessonId: null }] }),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      isResolved: true,
      acceptedReplyId: true,
      createdAt: true,
      authorId: true,
      author: { select: { name: true } },
      replies: {
        where: { isHidden: false },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          authorId: true,
          isInstructorAnswer: true,
          author: { select: { name: true } },
        },
      },
    },
  });

  return threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    body: thread.body,
    isResolved: thread.isResolved,
    acceptedReplyId: thread.acceptedReplyId,
    createdAt: thread.createdAt,
    authorId: thread.authorId,
    authorName: thread.author.name,
    replies: thread.replies.map((reply) => ({
      id: reply.id,
      body: reply.body,
      createdAt: reply.createdAt,
      authorId: reply.authorId,
      authorName: reply.author.name,
      isInstructorAnswer: reply.isInstructorAnswer,
      accepted: thread.acceptedReplyId === reply.id,
    })),
  }));
}

export async function createThread(input: {
  user: SessionUser;
  courseId: string;
  lessonId: string | null;
  title: string;
  body: string;
}): Promise<{ id: string }> {
  await assertCanParticipate(input.user, input.courseId);
  if (input.lessonId !== null) {
    const lesson = await db.lesson.findFirst({
      where: { id: input.lessonId, section: { courseId: input.courseId } },
      select: { id: true },
    });
    if (lesson === null) throw notFound("Lesson not found");
  }
  const course = await db.course.findUniqueOrThrow({
    where: { id: input.courseId },
    select: { slug: true, instructor: { select: { userId: true } } },
  });
  const thread = await db.thread.create({
    data: {
      courseId: input.courseId,
      lessonId: input.lessonId,
      authorId: input.user.id,
      title: input.title.trim(),
      body: input.body.trim(),
    },
    select: { id: true, title: true },
  });

  // The owning instructor sees a new question without polling the course page (the product requirements).
  if (course.instructor.userId !== input.user.id) {
    await createNotification({
      userId: course.instructor.userId,
      type: "QUESTION_ANSWERED",
      title: { ar: "سؤال جديد في دورتك", en: "A new question in your course" },
      body: { ar: thread.title, en: thread.title },
      linkPath: `/courses/${course.slug}`,
    });
  }

  return { id: thread.id };
}

export async function createReply(input: {
  user: SessionUser;
  threadId: string;
  body: string;
}): Promise<{ id: string }> {
  const thread = await db.thread.findUnique({
    where: { id: input.threadId },
    select: {
      id: true,
      courseId: true,
      isHidden: true,
      authorId: true,
      title: true,
      author: { select: { email: true, locale: true, notifyReplies: true } },
      course: { select: { slug: true } },
    },
  });
  if (thread === null || thread.isHidden) throw notFound("Thread not found");
  const { instructor } = await assertCanParticipate(input.user, thread.courseId);
  const reply = await db.reply.create({
    data: {
      threadId: thread.id,
      authorId: input.user.id,
      body: input.body.trim(),
      isInstructorAnswer: instructor,
    },
    select: { id: true },
  });

  if (thread.authorId !== input.user.id) {
    const linkPath = `/courses/${thread.course.slug}`;
    await createNotification({
      userId: thread.authorId,
      type: "QUESTION_ANSWERED",
      title: { ar: "ردّ جديد على سؤالك", en: "A new reply to your question" },
      body: { ar: thread.title, en: thread.title },
      linkPath,
    });
    if (thread.author.notifyReplies) {
      await enqueueEmail({
        to: thread.author.email,
        template: "question_answered",
        locale: thread.author.locale === "EN" ? "en" : "ar",
        data: {
          name: "",
          threadTitle: thread.title,
          url: `${env.APP_URL}/ar${linkPath}`,
        },
      });
    }
  }
  return reply;
}

export async function acceptAnswer(input: {
  user: SessionUser;
  threadId: string;
  replyId: string;
}): Promise<void> {
  const thread = await db.thread.findUnique({
    where: { id: input.threadId },
    select: { id: true, authorId: true, replies: { select: { id: true } } },
  });
  if (thread === null) throw notFound("Thread not found");
  if (thread.authorId !== input.user.id) throw forbidden("ONLY_THREAD_AUTHOR_CAN_ACCEPT");
  if (!thread.replies.some((reply) => reply.id === input.replyId)) {
    throw conflict("REPLY_NOT_IN_THREAD");
  }
  await db.thread.update({
    where: { id: thread.id },
    data: { acceptedReplyId: input.replyId, isResolved: true },
  });
}
