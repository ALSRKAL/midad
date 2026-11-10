import type { MetadataRoute } from "next";

import { publicEnv } from "@/env";
import { db } from "@/server/db";

/**
 * Public sitemap (P11-T01). Only indexable surfaces are listed: published courses, active
 * categories, approved instructors and the static marketing pages, each with both locales and an
 * hreflang alternate set. Private areas are excluded here and in robots.txt.
 */

export const dynamic = "force-dynamic";

const STATIC_PATHS = ["", "/courses", "/about", "/faq", "/contact", "/terms", "/privacy", "/teach"];

function entry(
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"],
) {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const suffix = path === "" ? "" : path;
  return {
    url: `${base}/ar${suffix}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: {
        ar: `${base}/ar${suffix}`,
        en: `${base}/en${suffix}`,
        "x-default": `${base}/ar${suffix}`,
      },
    },
  } satisfies MetadataRoute.Sitemap[0];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, categories, instructors] = await Promise.all([
    db.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, updatedAt: true },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true },
    }),
    db.instructorProfile.findMany({
      where: { approvedAt: { not: null }, user: { status: "ACTIVE" } },
      select: { user: { select: { username: true } } },
    }),
  ]);

  const staticEntries = STATIC_PATHS.map((path, index) =>
    entry(path, index === 0 ? 1 : 0.6, "weekly"),
  );
  const courseEntries = courses.map((course) => ({
    ...entry(`/courses/${course.slug}`, 0.8, "weekly"),
    lastModified: course.updatedAt,
  }));
  const categoryEntries = categories.map((category) =>
    entry(`/categories/${category.slug}`, 0.5, "weekly"),
  );
  const instructorEntries = instructors
    .map((profile) => profile.user.username)
    .filter((username): username is string => username !== null && username !== "")
    .map((username) => entry(`/instructors/${username}`, 0.5, "monthly"));

  return [...staticEntries, ...courseEntries, ...categoryEntries, ...instructorEntries];
}
