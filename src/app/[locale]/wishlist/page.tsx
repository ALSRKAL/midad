import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { CourseCard } from "@/components/catalog/course-card";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { Link } from "@/i18n/navigation";
import { listWishlist } from "@/server/wishlist";
import { getCurrentSession } from "@/server/session";
import { publicAssetUrl } from "@/server/storage";

/** Wishlist page (the product requirements). Anonymous visitors are sent to sign in and returned here. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Wishlist" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/wishlist`)}`);
  }

  const [t, courses] = await Promise.all([
    getTranslations({ locale, namespace: "Wishlist" }),
    listWishlist(user.id),
  ]);
  const localeValue = locale === "en" ? "en" : "ar";

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-10">
      <header className="border-b border-border pb-4">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        {courses.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("count", { count: courses.length })}
          </p>
        )}
      </header>

      {courses.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-md border border-border bg-surface px-6 py-12 text-center">
          <Heart className="size-10 text-muted-foreground" aria-hidden="true" />
          <div className="max-w-md space-y-2">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {t("emptyTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
          </div>
          <Link
            href="/courses"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("browse")}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id}>
              <CourseCard
                course={course}
                locale={localeValue}
                coverUrl={
                  course.coverImageKey === null ? null : publicAssetUrl(course.coverImageKey)
                }
              />
              <WishlistButton courseId={course.id} initialWishlisted className="mt-2" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
