import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/config/site";
import { CouponForm } from "@/features/coupons/components/coupon-form";
import { CouponList } from "@/features/coupons/components/coupon-list";
import { listCoupons, listCouponCourses } from "@/server/coupons-admin";
import { getCurrentSession } from "@/server/session";

/** Instructor coupon management (P06-T02, BR-07). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Coupons" });
  return { title: t("title") };
}

export default async function InstructorCouponsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) return null;

  const [t, rows, courses] = await Promise.all([
    getTranslations({ locale, namespace: "Coupons" }),
    listCoupons(user),
    listCouponCourses(user),
  ]);
  const localeValue: Locale = locale === "en" ? "en" : "ar";

  return (
    <div className="min-w-0">
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {user.role === "ADMIN" ? t("subtitleAdmin") : t("subtitleInstructor")}
      </p>

      <div className="mt-5 space-y-6">
        <CouponForm
          role={user.role === "ADMIN" ? "ADMIN" : "INSTRUCTOR"}
          courses={courses}
          locale={localeValue}
        />

        <section
          aria-labelledby="coupon-list-title"
          className="rounded-md border border-border bg-surface p-5"
        >
          <h2 id="coupon-list-title" className="font-heading text-lg font-semibold text-foreground">
            {t("listTitle")}
          </h2>
          <CouponList
            rows={rows.map((row) => ({
              ...row,
              startsAt: row.startsAt.toISOString(),
              endsAt: row.endsAt.toISOString(),
            }))}
            locale={localeValue}
            showCreator={false}
          />
        </section>
      </div>
    </div>
  );
}
