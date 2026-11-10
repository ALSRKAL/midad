import Image from "next/image";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

import { RatingStars } from "@/components/catalog/rating-stars";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import type { CatalogCourse } from "@/server/catalog";
import { formatMoney } from "@/lib/money";

/**
 * Catalog course card (the product requirements).
 *
 * One link wraps the whole card, so the click target is the card and keyboard users get a single
 * stop. The cover is real bucket content; when a course has none, a category glyph holds the space
 * instead of a broken image.
 */
export function CourseCard({
  course,
  locale,
  coverUrl,
}: {
  course: CatalogCourse;
  locale: Locale;
  coverUrl: string | null;
}) {
  const t = useTranslations("Catalog");

  const title =
    locale === "en"
      ? (course.titleEn ?? course.titleAr ?? "")
      : (course.titleAr ?? course.titleEn ?? "");
  const subtitle =
    locale === "en"
      ? (course.subtitleEn ?? course.subtitleAr ?? "")
      : (course.subtitleAr ?? course.subtitleEn ?? "");
  const categoryName = locale === "en" ? course.category.nameEn : course.category.nameAr;

  const level =
    course.level === "BEGINNER"
      ? t("levelBeginner")
      : course.level === "INTERMEDIATE"
        ? t("levelIntermediate")
        : course.level === "ADVANCED"
          ? t("levelAdvanced")
          : t("levelAll");

  const hours = Math.floor(course.totalDurationSec / 3600);
  const minutes = Math.round((course.totalDurationSec % 3600) / 60);
  const duration = hours > 0 ? t("durationHM", { hours, minutes }) : t("durationM", { minutes });

  const currency = course.currency === "USD" ? "USD" : "SAR";
  const price = course.isFree
    ? t("free")
    : formatMoney({ amount: course.priceCents, currency }, locale);

  return (
    <article className="group h-full">
      <Link
        href={`/courses/${course.slug}`}
        className="flex h-full flex-col rounded-md border border-border bg-surface p-3 transition-colors duration-150 ease-brand hover:border-border-strong"
      >
        <div className="relative aspect-video overflow-hidden rounded-sm bg-muted">
          {coverUrl === null ? (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <span className="font-heading text-3xl" aria-hidden="true">
                {title.charAt(0)}
              </span>
            </div>
          ) : (
            <Image
              src={coverUrl}
              alt={t("coverAlt", { title })}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
              className="object-cover"
            />
          )}
          {course.isFree && (
            <span className="absolute start-2 top-2 rounded-sm bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
              {t("free")}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-1 flex-col">
          <p className="text-xs text-muted-foreground">{`${categoryName} · ${level}`}</p>
          <h3 className="mt-1 line-clamp-2 font-heading text-lg leading-snug text-foreground group-hover:text-primary">
            {title}
          </h3>
          {subtitle !== "" && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">{course.instructorName}</p>

          <RatingStars
            ratingAvg={course.ratingAvg}
            ratingCount={course.ratingCount}
            locale={locale}
            label={t("rating")}
            className="mt-2"
          />

          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <span className="tabular font-medium text-foreground">{price}</span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              {duration}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("students", { count: course.studentsCount })}
          </p>
        </div>
      </Link>
    </article>
  );
}
