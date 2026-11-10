import type { Metadata } from "next";
import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CourseDetailView } from "@/components/catalog/course-detail-view";
import type { Locale } from "@/config/site";
import { getPurchaseState } from "@/server/cart";
import { getReviewContext } from "@/server/reviews";
import { getCoursePage, getSimilarCourses } from "@/server/catalog";
import { seoAlternates } from "@/lib/seo";
import { getCurrentSession } from "@/server/session";
import { publicAssetUrl } from "@/server/storage";
import { isCourseWishlisted } from "@/server/wishlist";

/** Public course detail (P03-T03). The view itself is shared with the instructor preview. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await getCoursePage(slug);
  if (course === null) return {};

  const title =
    locale === "en"
      ? (course.titleEn ?? course.titleAr ?? course.slug)
      : (course.titleAr ?? course.titleEn ?? course.slug);
  const description =
    locale === "en"
      ? (course.subtitleEn ?? course.subtitleAr ?? course.descriptionEn ?? "")
      : (course.subtitleAr ?? course.subtitleEn ?? course.descriptionAr ?? "");
  const localeValue: Locale = locale === "en" ? "en" : "ar";

  return {
    title,
    description,
    alternates: seoAlternates(localeValue, `/courses/${course.slug}`),
    openGraph: {
      type: "article",
      siteName: "Midad",
      locale: localeValue === "ar" ? "ar_SA" : "en_US",
      url: `/${localeValue}/courses/${course.slug}`,
      title,
      description,
      ...(course.coverImageKey === null ? {} : { images: [publicAssetUrl(course.coverImageKey)] }),
    },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const course = await getCoursePage(slug);
  if (course === null) notFound();

  const [user, similar, requestHeaders] = await Promise.all([
    getCurrentSession(),
    getSimilarCourses(course.id, course.category.slug, 3),
    headers(),
  ]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const [wishlisted, purchase, reviewContext] = await Promise.all([
    user === null ? Promise.resolve(false) : isCourseWishlisted(user.id, course.id),
    getPurchaseState(user, course.id),
    getReviewContext(user, course.id),
  ]);
  const localeValue: Locale = locale === "en" ? "en" : "ar";

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-8">
      <CourseDetailView
        course={course}
        similar={similar}
        locale={localeValue}
        isAuthenticated={user !== null}
        wishlisted={wishlisted}
        preview={false}
        purchase={purchase}
        currentUserId={user?.id ?? null}
        isInstructor={
          user !== null && (user.id === course.instructor.user.id || user.role === "ADMIN")
        }
        reviewContext={reviewContext}
        nonce={nonce}
      />
    </div>
  );
}
