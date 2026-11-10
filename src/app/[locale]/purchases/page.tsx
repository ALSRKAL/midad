import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/config/site";
import { RefundRequestForm } from "@/features/refunds/components/refund-request-form";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { listPurchases } from "@/server/purchases";
import { getCurrentSession } from "@/server/session";

/** Purchase history (P06-T06). Owner-only; admins use the audit/orders views instead. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Purchases" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function PurchasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/purchases`)}`);
  }

  const [t, refundT, data] = await Promise.all([
    getTranslations({ locale, namespace: "Purchases" }),
    getTranslations({ locale, namespace: "Refunds" }),
    listPurchases(user.id),
  ]);
  const localeValue: Locale = locale === "en" ? "en" : "ar";

  const refundStatusLabel = (status: "REQUESTED" | "APPROVED" | "COMPLETED" | "REJECTED") =>
    status === "REQUESTED"
      ? refundT("statusRequested")
      : status === "APPROVED"
        ? refundT("statusApproved")
        : status === "COMPLETED"
          ? refundT("statusCompleted")
          : refundT("statusRejected");

  const refundBlockedLabel = (
    reason:
      | "NOT_PAID"
      | "ALREADY_REQUESTED"
      | "WINDOW_EXPIRED"
      | "CERTIFICATE_ISSUED"
      | "PROGRESS_TOO_HIGH",
  ): string =>
    reason === "PROGRESS_TOO_HIGH"
      ? refundT("progressTooHigh", { pct: data.refundPolicy.maxProgressPct })
      : reason === "WINDOW_EXPIRED"
        ? refundT("windowExpired", { days: data.refundPolicy.windowDays })
        : reason === "CERTIFICATE_ISSUED"
          ? refundT("certificateIssued")
          : reason === "ALREADY_REQUESTED"
            ? refundT("alreadyRequested")
            : refundT("notPaid");

  const statusLabel = (status: string): string =>
    status === "PAID"
      ? t("statusPaid")
      : status === "PENDING"
        ? t("statusPending")
        : status === "FAILED"
          ? t("statusFailed")
          : status === "CANCELLED"
            ? t("statusCancelled")
            : status === "REFUNDED"
              ? t("statusRefunded")
              : t("statusPartiallyRefunded");

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <header>
        <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {data.orders.length === 0 && data.free.length === 0 ? (
        <div className="mt-10 rounded-md border border-border bg-surface p-10 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">{t("emptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("emptyBody")}</p>
          <Button asChild className="mt-5">
            <Link href="/courses">{t("browse")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {data.orders.map((order) => {
            const currency = order.currency;
            return (
              <article key={order.id} className="rounded-md border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium text-foreground">
                      {t("orderRef", { id: order.id })}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {`${t("date", { date: formatDate(order.createdAt, localeValue) })} · ${t(
                        "total",
                        {
                          amount: formatMoney({ amount: order.totalCents, currency }, localeValue),
                        },
                      )}`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      order.status === "PAID"
                        ? "success"
                        : order.status === "PENDING"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {statusLabel(order.status)}
                  </Badge>
                </div>

                <h3 className="mt-4 text-sm font-medium text-foreground">{t("items")}</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {order.items.map((item) => (
                    <li key={item.courseId}>
                      <Link href={`/courses/${item.slug}`} className="text-primary hover:underline">
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>

                {order.status === "PAID" && (
                  <a
                    href={`/api/orders/${order.id}/invoice?lang=${localeValue}`}
                    className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    {t("invoice")}
                  </a>
                )}

                {order.refund !== null && order.refund.status !== "REJECTED" && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {refundT("statusLine", {
                      status: refundStatusLabel(order.refund.status),
                    })}
                  </p>
                )}

                {order.refundEligible && (
                  <RefundRequestForm
                    orderId={order.id}
                    windowDays={data.refundPolicy.windowDays}
                    maxProgressPct={data.refundPolicy.maxProgressPct}
                  />
                )}
                {order.status === "PAID" &&
                  order.refund === null &&
                  order.refundBlockedReason !== null && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {refundBlockedLabel(order.refundBlockedReason)}
                    </p>
                  )}
              </article>
            );
          })}

          {data.free.length > 0 && (
            <section
              aria-labelledby="free-title"
              className="rounded-md border border-border bg-surface p-5"
            >
              <h2 id="free-title" className="font-heading text-lg font-semibold text-foreground">
                {t("freeTitle")}
              </h2>
              <ul className="mt-3 divide-y divide-border">
                {data.free.map((enrollment) => {
                  const title =
                    localeValue === "en"
                      ? (enrollment.course.titleEn ??
                        enrollment.course.titleAr ??
                        t("unknownCourse"))
                      : (enrollment.course.titleAr ??
                        enrollment.course.titleEn ??
                        t("unknownCourse"));
                  return (
                    <li
                      key={enrollment.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <span className="text-sm text-foreground">
                        {t("freeEnrolled", { title })}
                      </span>
                      <Link
                        href={`/courses/${enrollment.course.slug}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {t("openCourse")}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
