// @vitest-environment node
import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { EMPTY_CATALOG_FILTERS } from "@/lib/catalog-filters";
import { db } from "@/server/db";
import { getCourseChecklist } from "@/server/course-checklist";
import { updateCourseBasics } from "@/server/instructor-courses";
import { searchCatalog } from "@/server/catalog";
import { getCoursePage } from "@/server/catalog";

/** BR-02 checklist, BR-03 published-content edits, BR-04 archived visibility vs access. */

let available = false;
try {
  await db.$queryRaw`SELECT 1`;
  available = true;
} catch {
  available = false;
}

const suffix = randomUUID().slice(0, 8);
const LONG_TEXT =
  "<p>" +
  "هذا نص درس تجريبي طويل بما يكفي لتجاوز مئتي حرف، يشرح الفكرة خطوة بخطوة ثم يطلب من المتعلم تطبيقها في تمرين قصير قبل الانتقال إلى الدرس التالي.".repeat(
    3,
  ) +
  "</p>";

async function fixture() {
  const instructor = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Lifecycle Instructor",
      email: `lifecycle-${suffix}-${randomUUID().slice(0, 5)}@midad.test`,
      emailVerified: true,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
      instructorProfile: { create: { approvedAt: new Date() } },
    },
    select: { id: true, instructorProfile: { select: { id: true } } },
  });
  const profileId = instructor.instructorProfile?.id ?? "";
  const category = await db.category.upsert({
    where: { slug: `lifecycle-${suffix}` },
    create: { slug: `lifecycle-${suffix}`, nameAr: "دورة حياة", nameEn: "Lifecycle" },
    update: {},
    select: { id: true },
  });
  const courseSlug = `lifecycle-${suffix}-${randomUUID().slice(0, 5)}`;
  const course = await db.course.create({
    data: {
      slug: courseSlug,
      instructorId: profileId,
      categoryId: category.id,
      titleAr: "دورة دورة الحياة",
      titleEn: "Lifecycle course",
      descriptionAr: "وصف كافٍ للدورة.",
      descriptionEn: "Enough description.",
      coverImageKey: `covers/${suffix}.png`,
      status: "PUBLISHED",
      priceCents: 10_000,
      isFree: false,
      objectives: {
        create: [
          { textAr: "هدف أول", textEn: "First objective" },
          { textAr: "هدف ثان", textEn: "Second objective" },
          { textAr: "هدف ثالث", textEn: "Third objective" },
        ],
      },
      sections: {
        create: {
          titleAr: "القسم الأول",
          titleEn: "First section",
          sortOrder: 0,
          lessons: {
            create: Array.from({ length: 5 }, (_, index) => ({
              titleAr: `درس ${index + 1}`,
              titleEn: `Lesson ${index + 1}`,
              type: "TEXT" as const,
              sortOrder: index,
              contentAr: LONG_TEXT,
              contentEn: LONG_TEXT,
            })),
          },
        },
      },
    },
    select: { id: true },
  });
  return {
    instructor,
    profileId,
    categoryId: category.id,
    courseId: course.id,
    courseSlug,
  };
}

describe.skipIf(!available)("course lifecycle integration", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("BR-02: the submission checklist reflects every required item", async () => {
    const data = await fixture();
    const ready = await getCourseChecklist(data.profileId, data.courseId);
    expect(ready.ready).toBe(true);
    expect(ready.items.map((item) => item.key)).toEqual([
      "basics",
      "cover",
      "objectives",
      "sections",
      "lessons",
      "price",
    ]);

    await db.course.update({
      where: { id: data.courseId },
      data: { coverImageKey: null },
    });
    const withoutCover = await getCourseChecklist(data.profileId, data.courseId);
    expect(withoutCover.ready).toBe(false);
    expect(withoutCover.items.find((item) => item.key === "cover")?.passed).toBe(false);
  });

  it("BR-03: editing a published course keeps it published and audits a title change", async () => {
    const data = await fixture();
    await updateCourseBasics(data.profileId, data.instructor.id, data.courseId, {
      titleAr: "دورة دورة الحياة المعدلة",
      titleEn: "Lifecycle course edited",
      subtitleAr: "",
      subtitleEn: "",
      descriptionAr: "وصف كافٍ للدورة.",
      descriptionEn: "Enough description.",
      categoryId: data.categoryId,
      level: "BEGINNER",
      language: "AR",
    });
    const course = await db.course.findUniqueOrThrow({
      where: { id: data.courseId },
      select: { status: true },
    });
    expect(course.status).toBe("PUBLISHED");
    expect(
      await db.auditLog.count({
        where: { entityId: data.courseId, action: "course.titleUpdated" },
      }),
    ).toBe(1);
  });

  it("BR-04: an archived course leaves search but existing enrolments retain access", async () => {
    const data = await fixture();
    const learner = await db.user.create({
      data: {
        id: randomUUID(),
        name: "Archived Learner",
        email: `archived-${suffix}-${randomUUID().slice(0, 5)}@midad.test`,
        emailVerified: true,
        role: "STUDENT",
        status: "ACTIVE",
        locale: "AR",
        theme: "SYSTEM",
      },
      select: { id: true },
    });
    const enrollment = await db.enrollment.create({
      data: { userId: learner.id, courseId: data.courseId, source: "PURCHASE", status: "ACTIVE" },
      select: { id: true },
    });

    await db.course.update({ where: { id: data.courseId }, data: { status: "ARCHIVED" } });
    const search = await searchCatalog({ ...EMPTY_CATALOG_FILTERS, page: 1 });
    expect(search.courses.some((course) => course.id === data.courseId)).toBe(false);
    // BR-04: direct access remains for people who already have the link/enrolment.
    expect(await getCoursePage(data.courseSlug)).not.toBeNull();
    expect(
      await db.enrollment.findUniqueOrThrow({
        where: { id: enrollment.id },
        select: { status: true },
      }),
    ).toEqual({ status: "ACTIVE" });
  });
});
