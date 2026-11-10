import Image from "next/image";
import {
  BarChart3,
  Check,
  Clock,
  FileText,
  Globe2,
  Heart,
  HelpCircle,
  PlayCircle,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { CourseCard } from "@/components/catalog/course-card";
import { RatingStars } from "@/components/catalog/rating-stars";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import { ReportReviewButton } from "@/features/reviews/components/report-review-button";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { ReviewReplyForm } from "@/features/reviews/components/review-reply-form";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { siteConfig, type Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { ReviewContext } from "@/server/reviews";
import type { CatalogCourse, CoursePageData } from "@/server/catalog";
import { publicAssetUrl } from "@/server/storage";

/**
 * Course detail view shared by the public page and the instructor preview (P04-T06).
 *
 * The same component renders both, so "what the learner sees" cannot drift from what the instructor
 * previews. Preview mode removes the JSON-LD and the purchase/wishlist actions and states why.
 */
export function CourseDetailView({
  course,
  similar,
  locale,
  isAuthenticated,
  wishlisted,
  preview,
  headingLevel = 1,
  purchase = { inCart: false, enrolled: false, ownCourse: false },
  currentUserId = null,
  isInstructor = false,
  reviewContext = null,
  nonce,
}: {
  course: CoursePageData;
  similar: CatalogCourse[];
  locale: Locale;
  isAuthenticated: boolean;
  wishlisted: boolean;
  preview: boolean;
  /** CSP nonce for the JSON-LD block; previews render no structured data. */
  nonce?: string | undefined;
  /** The admin review page embeds this view under its own h1, so the title becomes an h2 there. */
  headingLevel?: 1 | 2;
  /** Server-read eligibility (P06-T01); preview pages default to no purchase state. */
  purchase?: { inCart: boolean; enrolled: boolean; ownCourse: boolean };
  currentUserId?: string | null;
  isInstructor?: boolean;
  reviewContext?: ReviewContext | null;
}) {
  const t = useTranslations("Course");
  const catalogT = useTranslations("Catalog");
  const wishlistT = useTranslations("Wishlist");
  const publishT = useTranslations("Publish");
  const reviewT = useTranslations("Reviews");

  const title =
    locale === "en"
      ? (course.titleEn ?? course.titleAr ?? "")
      : (course.titleAr ?? course.titleEn ?? "");
  const subtitle =
    locale === "en"
      ? (course.subtitleEn ?? course.subtitleAr ?? "")
      : (course.subtitleAr ?? course.subtitleEn ?? "");
  const description =
    locale === "en"
      ? (course.descriptionEn ?? course.descriptionAr ?? "")
      : (course.descriptionAr ?? course.descriptionEn ?? "");
  const categoryName = locale === "en" ? course.category.nameEn : course.category.nameAr;
  const instructorBio =
    locale === "en"
      ? (course.instructor.bioEn ?? course.instructor.bioAr ?? "")
      : (course.instructor.bioAr ?? course.instructor.bioEn ?? "");

  const coverUrl = course.coverImageKey === null ? null : publicAssetUrl(course.coverImageKey);
  const instructorImage =
    course.instructor.user.image === null ? null : course.instructor.user.image;

  const totalLessons = course.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const hours = Math.floor(course.totalDurationSec / 3600);
  const minutes = Math.round((course.totalDurationSec % 3600) / 60);
  const durationLabel =
    hours > 0 ? catalogT("durationHM", { hours, minutes }) : catalogT("durationM", { minutes });
  const levelLabel =
    course.level === "BEGINNER"
      ? catalogT("levelBeginner")
      : course.level === "INTERMEDIATE"
        ? catalogT("levelIntermediate")
        : course.level === "ADVANCED"
          ? catalogT("levelAdvanced")
          : catalogT("levelAll");
  const languageLabel =
    course.language === "AR" ? catalogT("courseLanguageAr") : catalogT("courseLanguageEn");

  const currency = course.currency === "USD" ? "USD" : "SAR";
  const priceLabel = course.isFree
    ? catalogT("free")
    : formatMoney({ amount: course.priceCents, currency }, locale);
  const nextPath = encodeURIComponent(`/${locale}/courses/${course.slug}`);
  const TitleTag = headingLevel === 2 ? "h2" : "h1";

  const lessonTypeLabel = (type: "VIDEO" | "TEXT" | "FILE" | "QUIZ"): string => {
    if (type === "VIDEO") return t("lessonVideo");
    if (type === "QUIZ") return t("lessonQuiz");
    if (type === "FILE") return t("lessonPdf");
    return t("lessonText");
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: title,
    description: subtitle !== "" ? subtitle : description.slice(0, 300),
    inLanguage: course.language === "AR" ? "ar" : "en",
    ...(coverUrl === null ? {} : { image: coverUrl }),
    provider: {
      "@type": "Organization",
      name: siteConfig.name[locale],
      url: siteConfig.url,
    },
    instructor: { "@type": "Person", name: course.instructor.user.name },
    ...(course.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (course.ratingAvg / 100).toFixed(1),
            reviewCount: course.ratingCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: (course.priceCents / 100).toFixed(2),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      url: `${siteConfig.url}/${locale}/courses/${course.slug}`,
    },
  };

  return (
    <>
      {!preview && (
        <script
          type="application/ld+json"
          nonce={nonce}
          // Escaping `<` keeps a title containing markup from closing the script element.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <nav aria-label={t("breadcrumbLabel")} className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground hover:underline">
              {t("breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/courses" className="hover:text-foreground hover:underline">
              {t("breadcrumbCourses")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/courses?category=${course.category.slug}`}
              className="hover:text-foreground hover:underline"
            >
              {categoryName}
            </Link>
          </li>
        </ol>
      </nav>

      <header className="mt-5 max-w-3xl">
        <p className="text-sm font-medium text-primary">{categoryName}</p>
        <TitleTag className="mt-2 font-heading text-3xl leading-tight font-semibold text-foreground sm:text-4xl">
          {title}
        </TitleTag>
        {subtitle !== "" && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <RatingStars
            ratingAvg={course.ratingAvg}
            ratingCount={course.ratingCount}
            locale={locale}
            label={t("reviewsAverage", { rating: (course.ratingAvg / 100).toFixed(1) })}
          />
          <span className="inline-flex items-center gap-1">
            <Users className="size-4" aria-hidden="true" />
            {t("studentsCount", { count: course.studentsCount })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" aria-hidden="true" />
            {durationLabel}
          </span>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {t("byInstructor", { name: course.instructor.user.name })}
          <span aria-hidden="true"> · </span>
          {t("lastUpdated", { date: formatDate(course.updatedAt, locale) })}
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <aside className="self-start lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
          <div className="rounded-md border border-border bg-surface p-5">
            <p className="tabular font-heading text-3xl font-semibold text-foreground">
              {priceLabel}
            </p>

            {preview ? (
              <p className="mt-4 rounded-sm border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                {publishT("previewNoPurchase")}
              </p>
            ) : (
              <AddToCartButton
                courseId={course.id}
                slug={course.slug}
                isFree={course.isFree}
                isAuthenticated={isAuthenticated}
                initialInCart={purchase.inCart}
                initialEnrolled={purchase.enrolled}
                ownCourse={purchase.ownCourse}
                unavailable={course.status === "ARCHIVED"}
              />
            )}

            {!preview && (
              <div className="mt-3">
                {isAuthenticated ? (
                  <WishlistButton courseId={course.id} initialWishlisted={wishlisted} />
                ) : (
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/login?next=${nextPath}`}>
                      <Heart className="size-4" aria-hidden="true" />
                      {wishlistT("add")}
                    </Link>
                  </Button>
                )}
              </div>
            )}

            <div className="mt-5 border-t border-border pt-4">
              <h2 className="text-sm font-medium text-foreground">{t("includesTitle")}</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <PlayCircle className="size-4 shrink-0" aria-hidden="true" />
                  {t("includesLessons", { count: totalLessons })}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" aria-hidden="true" />
                  {t("includesDuration", { duration: durationLabel })}
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="size-4 shrink-0" aria-hidden="true" />
                  {t("includesLevel", { level: levelLabel })}
                </li>
                <li className="flex items-center gap-2">
                  <Globe2 className="size-4 shrink-0" aria-hidden="true" />
                  {t("includesLanguage", { language: languageLabel })}
                </li>
              </ul>
            </div>
          </div>
        </aside>

        <div className="space-y-8 lg:col-start-1 lg:row-start-1">
          {coverUrl !== null && (
            <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted">
              <Image
                src={coverUrl}
                alt={catalogT("coverAlt", { title })}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          )}

          {course.objectives.length > 0 && (
            <section
              aria-labelledby="learn-title"
              className="rounded-md border border-border bg-surface p-6"
            >
              <h2 id="learn-title" className="font-heading text-xl font-semibold text-foreground">
                {t("learnTitle")}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.objectives.map((objective) => (
                  <li key={objective.id} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{locale === "en" ? objective.textEn : objective.textAr}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {description !== "" && (
            <section aria-labelledby="description-title">
              <h2
                id="description-title"
                className="font-heading text-xl font-semibold text-foreground"
              >
                {t("descriptionTitle")}
              </h2>
              <p className="mt-3 whitespace-pre-line text-foreground">{description}</p>
            </section>
          )}

          {course.requirements.length > 0 && (
            <section aria-labelledby="requirements-title">
              <h2
                id="requirements-title"
                className="font-heading text-xl font-semibold text-foreground"
              >
                {t("requirementsTitle")}
              </h2>
              <ul className="mt-3 space-y-2">
                {course.requirements.map((requirement) => (
                  <li
                    key={requirement.id}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong"
                    />
                    <span>{locale === "en" ? requirement.textEn : requirement.textAr}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="curriculum-title">
            <h2
              id="curriculum-title"
              className="font-heading text-xl font-semibold text-foreground"
            >
              {t("curriculumTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("curriculumSummary", {
                sections: course.sections.length,
                lessons: totalLessons,
                duration: durationLabel,
              })}
            </p>

            <div className="mt-4 space-y-3">
              {course.sections.map((section, index) => (
                <details
                  key={section.id}
                  open={index === 0}
                  className="group rounded-md border border-border bg-surface"
                >
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4 font-medium text-foreground">
                    <span>{locale === "en" ? section.titleEn : section.titleAr}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {t("sectionLessons", { count: section.lessons.length })}
                    </span>
                  </summary>
                  <ul className="divide-y divide-border border-t border-border">
                    {section.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm"
                      >
                        {lesson.type === "VIDEO" ? (
                          <PlayCircle
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        ) : lesson.type === "QUIZ" ? (
                          <HelpCircle
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        ) : (
                          <FileText
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                        <span className="sr-only">{`${lessonTypeLabel(lesson.type)}: `}</span>
                        <span className="min-w-0 flex-1 text-foreground">
                          {locale === "en" ? lesson.titleEn : lesson.titleAr}
                        </span>
                        {lesson.isPreview && (
                          <span className="rounded-sm border border-accent-strong px-2 py-0.5 text-xs text-accent-strong">
                            {t("preview")}
                          </span>
                        )}
                        {lesson.durationSec > 0 && (
                          <span className="tabular text-muted-foreground" dir="ltr">
                            {catalogT("durationM", {
                              minutes: Math.max(1, Math.round(lesson.durationSec / 60)),
                            })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="instructor-title"
            className="rounded-md border border-border bg-surface p-6"
          >
            <h2
              id="instructor-title"
              className="font-heading text-xl font-semibold text-foreground"
            >
              {t("instructorTitle")}
            </h2>
            <div className="mt-4 flex flex-wrap items-start gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                {instructorImage === null ? (
                  <span
                    aria-hidden="true"
                    className="flex size-full items-center justify-center font-heading text-xl text-muted-foreground"
                  >
                    {course.instructor.user.name.charAt(0)}
                  </span>
                ) : (
                  <Image
                    src={instructorImage}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{course.instructor.user.name}</p>
                {course.instructor.user.username !== null && (
                  <Link
                    href={`/instructors/${course.instructor.user.username}`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {t("viewInstructorProfile")}
                  </Link>
                )}
                {course.instructor.headline !== null && (
                  <p className="text-sm text-muted-foreground">{course.instructor.headline}</p>
                )}
                {instructorBio !== "" && (
                  <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                    {instructorBio}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section aria-labelledby="reviews-title">
            <h2 id="reviews-title" className="font-heading text-xl font-semibold text-foreground">
              {t("reviewsTitle")}
            </h2>

            <div className="mt-4 grid gap-6 rounded-md border border-border bg-surface p-6 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <div>
                <p
                  className="tabular font-heading text-4xl font-semibold text-foreground"
                  dir="ltr"
                >
                  {(course.ratingAvg / 100).toFixed(1)}
                </p>
                <RatingStars
                  ratingAvg={course.ratingAvg}
                  ratingCount={course.ratingCount}
                  locale={locale}
                  label={t("reviewsBasedOn", { count: course.ratingCount })}
                  showCount={false}
                  className="mt-2"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("reviewsBasedOn", { count: course.ratingCount })}
                </p>
              </div>

              <ul className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = course.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5];
                  const percent =
                    course.ratingCount === 0 ? 0 : Math.round((count / course.ratingCount) * 100);
                  return (
                    <li key={stars} className="flex items-center gap-3 text-sm">
                      <span className="w-16 shrink-0 text-muted-foreground">
                        {t("ratingRow", { stars })}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-accent-strong"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span
                        className="tabular w-8 shrink-0 text-end text-muted-foreground"
                        dir="ltr"
                      >
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {reviewContext !== null &&
              isAuthenticated &&
              (reviewContext.review !== null ||
                (reviewContext.enrolled &&
                  reviewContext.progressPct >= reviewContext.minProgressPct)) && (
                <ReviewForm
                  courseId={course.id}
                  existing={
                    reviewContext.review === null
                      ? null
                      : {
                          id: reviewContext.review.id,
                          rating: reviewContext.review.rating,
                          body: reviewContext.review.body,
                        }
                  }
                />
              )}
            {reviewContext !== null &&
              isAuthenticated &&
              reviewContext.review === null &&
              reviewContext.enrolled &&
              reviewContext.progressPct < reviewContext.minProgressPct && (
                <p className="mt-4 rounded-sm border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {reviewT("eligibility", { pct: reviewContext.minProgressPct })}
                </p>
              )}

            {course.reviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{t("noReviews")}</p>
            ) : (
              <ul className="mt-4 divide-y divide-border rounded-md border border-border bg-surface">
                {course.reviews.map((review) => (
                  <li key={review.id} className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{review.authorName}</p>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(review.createdAt, locale)}
                      </span>
                    </div>
                    <RatingStars
                      ratingAvg={review.rating * 100}
                      ratingCount={1}
                      locale={locale}
                      label={t("ratingRow", { stars: review.rating })}
                      showCount={false}
                      className="mt-1"
                    />
                    {review.body !== null && (
                      <p className="mt-2 text-sm whitespace-pre-line text-foreground">
                        {review.body}
                      </p>
                    )}
                    {review.instructorReply !== null && (
                      <div className="mt-3 rounded-sm border-s-2 border-accent-strong bg-muted px-3 py-2 text-sm">
                        <p className="font-medium text-foreground">{course.instructor.user.name}</p>
                        <p className="mt-1 text-muted-foreground">{review.instructorReply}</p>
                      </div>
                    )}
                    {isInstructor && (
                      <ReviewReplyForm reviewId={review.id} initialReply={review.instructorReply} />
                    )}
                    {currentUserId !== null && currentUserId !== review.authorId && !preview && (
                      <div className="mt-2">
                        <ReportReviewButton reviewId={review.id} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {similar.length > 0 && (
            <section aria-labelledby="similar-title">
              <h2 id="similar-title" className="font-heading text-xl font-semibold text-foreground">
                {t("similarTitle")}
              </h2>
              <ul className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {similar.map((item) => (
                  <li key={item.id}>
                    <CourseCard
                      course={item}
                      locale={locale}
                      coverUrl={
                        item.coverImageKey === null ? null : publicAssetUrl(item.coverImageKey)
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
