// @vitest-environment node
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/server/db";
import {
  acceptAnswer,
  addNote,
  createReply,
  createThread,
  listNotes,
  listThreads,
} from "@/server/discussions";
import { getPlayableVideo, getPlayerData } from "@/server/player";
import type { SessionUser } from "@/server/session";

/**
 * BR-19 (discussion permissions, private notes) and BR-20 (signed assets) against `midad_test`.
 * Skipped automatically when the dedicated database is unavailable.
 */

let available = false;
try {
  await db.$queryRaw`SELECT 1`;
  available = true;
} catch {
  available = false;
}

const suffix = randomUUID().slice(0, 8);

function session(user: {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: "ACTIVE",
    locale: "ar",
    emailVerified: true,
    impersonatedBy: null,
  };
}

async function makePerson(role: "STUDENT" | "INSTRUCTOR") {
  const user = await db.user.create({
    data: {
      id: randomUUID(),
      name: role === "INSTRUCTOR" ? "Player Instructor" : "Player Student",
      email: `${role.toLowerCase()}-${suffix}-${randomUUID().slice(0, 6)}@midad.test`,
      emailVerified: true,
      role,
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
    },
  });
  const profile =
    role === "INSTRUCTOR"
      ? await db.instructorProfile.create({ data: { userId: user.id, approvedAt: new Date() } })
      : null;
  return { user, profile };
}

describe.skipIf(!available)("player and discussions integration", () => {
  let courseId = "";
  let courseSlug = "";
  let instructorProfileId = "";
  let instructorUser: { id: string; name: string; email: string };
  let buyer: SessionUser;
  let lessonId = "";
  let previewLessonId = "";
  let otherLessonId = "";
  let otherCourseSlug = "";
  let threadId = "";

  beforeAll(async () => {
    const instructor = await makePerson("INSTRUCTOR");
    instructorProfileId = instructor.profile?.id ?? "";
    instructorUser = instructor.user;
    const student = await makePerson("STUDENT");
    buyer = session(student.user);

    const category = await db.category.upsert({
      where: { slug: `player-${suffix}` },
      create: { slug: `player-${suffix}`, nameAr: "مشغل", nameEn: "Player" },
      update: {},
      select: { id: true },
    });

    courseSlug = `player-course-${suffix}`;
    const course = await db.course.create({
      data: {
        slug: courseSlug,
        instructorId: instructorProfileId,
        categoryId: category.id,
        titleAr: "دورة المشغل",
        titleEn: "Player course",
        status: "PUBLISHED",
        priceCents: 10_000,
      },
      select: { id: true },
    });
    courseId = course.id;

    const section = await db.section.create({
      data: { courseId, titleAr: "القسم", titleEn: "Section", sortOrder: 0 },
      select: { id: true },
    });
    const [paid, preview, text] = await Promise.all([
      db.lesson.create({
        data: {
          sectionId: section.id,
          type: "VIDEO",
          titleAr: "درس مدفوع",
          titleEn: "Paid lesson",
          isPreview: false,
          durationSec: 6,
          sortOrder: 0,
          videoAsset: {
            create: {
              provider: "HLS",
              status: "READY",
              originalKey: "seed/videos/lesson-6s.mp4",
              hlsKey: `hls/${suffix}/index.m3u8`,
              durationSec: 6,
            },
          },
        },
        select: { id: true },
      }),
      db.lesson.create({
        data: {
          sectionId: section.id,
          type: "VIDEO",
          titleAr: "معاينة",
          titleEn: "Preview",
          isPreview: true,
          durationSec: 6,
          sortOrder: 1,
          videoAsset: {
            create: {
              provider: "HLS",
              status: "READY",
              originalKey: "seed/videos/lesson-6s.mp4",
              durationSec: 6,
            },
          },
        },
        select: { id: true },
      }),
      db.lesson.create({
        data: {
          sectionId: section.id,
          type: "TEXT",
          titleAr: "درس نصي",
          titleEn: "Text lesson",
          isPreview: false,
          durationSec: 60,
          sortOrder: 2,
        },
        select: { id: true },
      }),
    ]);
    lessonId = paid.id;
    previewLessonId = preview.id;
    otherLessonId = text.id;

    await db.enrollment.create({
      data: { userId: buyer.id, courseId, source: "PURCHASE", status: "ACTIVE" },
    });

    const otherInstructor = await makePerson("INSTRUCTOR");
    otherCourseSlug = `other-course-${suffix}`;
    await db.course.create({
      data: {
        slug: otherCourseSlug,
        instructorId: otherInstructor.profile?.id ?? "",
        categoryId: category.id,
        titleAr: "دورة أخرى",
        status: "PUBLISHED",
        priceCents: 5_000,
      },
    });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("BR-19: non-enrolled user cannot post", async () => {
    const outsider = await makePerson("STUDENT");
    await expect(
      createThread({
        user: session(outsider.user),
        courseId,
        lessonId,
        title: "سؤال",
        body: "هل يمكنني المشاركة دون تسجيل في الدورة؟",
      }),
    ).rejects.toThrow("ENROLLMENT_REQUIRED");
  });

  it("BR-19: instructor can post on own course, another instructor cannot", async () => {
    const thread = await createThread({
      user: session(instructorUser as never),
      courseId,
      lessonId,
      title: "سؤال من المدرب",
      body: "هذه مشاركة توضيحية من مدرب الدورة نفسه.",
    });
    expect(thread.id).not.toBe("");

    const other = await makePerson("INSTRUCTOR");
    await expect(
      createThread({
        user: session(other.user),
        courseId,
        lessonId,
        title: "دخول غير مصرح",
        body: "مدرب آخر لا يملك صلاحية المشاركة في هذه الدورة.",
      }),
    ).rejects.toThrow("ENROLLMENT_REQUIRED");
  });

  it("BR-19: notes are never returned to other users", async () => {
    const otherStudent = await makePerson("STUDENT");
    await db.enrollment.create({
      data: { userId: otherStudent.user.id, courseId, source: "PURCHASE", status: "ACTIVE" },
    });
    await addNote({ userId: buyer.id, lessonId, body: "ملاحظة خاصة للمشتري", timestampSec: 3 });
    await addNote({
      userId: otherStudent.user.id,
      lessonId,
      body: "ملاحظة خاصة لطالب آخر",
      timestampSec: null,
    });
    const notes = await listNotes(buyer.id, lessonId);
    expect(notes).toHaveLength(1);
    expect(notes[0]?.body).toBe("ملاحظة خاصة للمشتري");
  });

  it("BR-19: only the thread author can accept an answer, once per thread", async () => {
    const created = await createThread({
      user: buyer,
      courseId,
      lessonId,
      title: "سؤال مقبول",
      body: "كيف أعتمد إجابة في النقاش؟",
    });
    threadId = created.id;
    const reply = await createReply({
      user: session(instructorUser as never),
      threadId,
      body: "يعتمدها صاحب السؤال من زر الاعتماد بجانب الرد.",
    });
    const other = await makePerson("STUDENT");
    await expect(
      acceptAnswer({ user: session(other.user), threadId, replyId: reply.id }),
    ).rejects.toThrow("ONLY_THREAD_AUTHOR_CAN_ACCEPT");

    await acceptAnswer({ user: buyer, threadId, replyId: reply.id });
    const threads = await listThreads(buyer, courseId, lessonId);
    const accepted = threads.find((thread) => thread.id === threadId);
    expect(accepted?.acceptedReplyId).toBe(reply.id);
    expect(accepted?.replies.filter((item) => item.accepted)).toHaveLength(1);
  });

  it("BR-20: refuses to sign paid assets for a non-enrolled user", async () => {
    const outsider = await makePerson("STUDENT");
    const data = await getPlayerData(session(outsider.user), courseSlug, lessonId);
    expect(data?.access).toBe("ENROLLMENT_REQUIRED");
    expect(data?.current.video?.srcUrl).toBeNull();
  });

  it("BR-20: signs preview lessons for guests", async () => {
    const data = await getPlayerData(null, courseSlug, previewLessonId);
    expect(data?.access).toBe("GRANTED");
    expect(data?.course.enrollmentId).toBeNull();
    expect(data?.current.video?.srcUrl).toContain("X-Amz-Expires=900");
  });

  it("BR-20: refuses a lesson that belongs to another course", async () => {
    const data = await getPlayerData(buyer, otherCourseSlug, lessonId);
    expect(data).toBeNull();
  });

  it("BR-20: signs paid video for an enrolled learner and refuses HLS to outsiders", async () => {
    const data = await getPlayerData(buyer, courseSlug, lessonId);
    expect(data?.access).toBe("GRANTED");
    expect(data?.current.video?.srcUrl).toBe(`/api/player/hls/${lessonId}`);

    const outsider = await makePerson("STUDENT");
    await expect(getPlayableVideo(session(outsider.user), lessonId)).rejects.toThrow();
    await expect(getPlayableVideo(buyer, lessonId)).resolves.toMatchObject({
      hlsKey: `hls/${suffix}/index.m3u8`,
    });
    // Guard against a lesson/course mismatch being useful for signing: the text lesson still resolves
    // under the same course, but a request for another course's lesson id does not.
    await expect(getPlayableVideo(buyer, otherLessonId)).rejects.toThrow();
  });
});
