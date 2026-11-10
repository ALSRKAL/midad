import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RefundDecisionPanel } from "@/features/admin/components/refund-decision-panel";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getAdminRefund } from "@/server/admin/refunds";

/** Admin refund detail and execution (P10-T03). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminRefundDetail" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AdminRefundDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [refund, t, adminT] = await Promise.all([
    getAdminRefund(id),
    getTranslations({ locale, namespace: "AdminRefundDetail" }),
    getTranslations({ locale, namespace: "Admin" }),
  ]);
  if (refund === null) notFound();
  const localeValue: Locale = locale === "en" ? "en" : "ar";
  const currency = refund.currency === "USD" ? "USD" : "SAR";

  const statusLabel =
    refund.status === "REQUESTED"
      ? adminT("refundStatusRequested")
      : refund.status === "APPROVED"
        ? adminT("refundStatusApproved")
        : refund.status === "COMPLETED"
          ? adminT("refundStatusCompleted")
          : adminT("refundStatusRejected");

  return (
    <div className="min-w-0">
      <Link href="/admin/refunds" className="text-sm font-medium text-primary hover:underline">
        {t("back")}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">{t("title")}</h2>
        <Badge
          variant={
            refund.status === "COMPLETED"
              ? "success"
              : refund.status === "REJECTED"
                ? "danger"
                : "warning"
          }
        >
          {statusLabel}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
        {refund.id}
      </p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-sm text-muted-foreground">{t("learner")}</dt>
          <dd className="mt-1 font-medium text-foreground">{refund.learnerName}</dd>
          <dd className="text-sm text-muted-foreground" dir="ltr">
            {refund.learnerEmail}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-sm text-muted-foreground">{t("amount")}</dt>
          <dd className="tabular mt-1 font-heading text-xl font-semibold text-foreground" dir="ltr">
            {formatMoney({ amount: refund.amountCents, currency }, localeValue, {
              showDecimals: true,
            })}
          </dd>
          <dd className="text-xs text-muted-foreground">
            {t("orderTotal", {
              amount: formatMoney({ amount: refund.orderTotalCents, currency }, localeValue, {
                showDecimals: true,
              }),
            })}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-sm text-muted-foreground">{t("order")}</dt>
          <dd className="mt-1 text-sm text-foreground" dir="ltr">
            {refund.orderId}
          </dd>
          <dd className="text-xs text-muted-foreground">
            {refund.orderPaidAt === null
              ? t("notPaid")
              : t("paidAt", { date: formatDate(refund.orderPaidAt, localeValue) })}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-sm text-muted-foreground">{t("requested")}</dt>
          <dd className="mt-1 text-sm text-foreground">
            {t("requestedBy", {
              name: refund.requestedByName,
              date: formatDate(refund.createdAt, localeValue),
            })}
          </dd>
          {refund.decidedByName !== null && refund.decidedAt !== null && (
            <dd className="mt-1 text-xs text-muted-foreground">
              {t("decidedBy", {
                name: refund.decidedByName,
                date: formatDate(refund.decidedAt, localeValue),
              })}
            </dd>
          )}
          {refund.stripeRefundId !== null && (
            <dd className="mt-1 text-xs text-muted-foreground" dir="ltr">
              {refund.stripeRefundId}
            </dd>
          )}
        </div>
      </dl>

      <section className="mt-5 rounded-md border border-border bg-surface p-5">
        <h3 className="font-heading text-lg font-semibold text-foreground">{t("courses")}</h3>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-foreground">
          {refund.courses.map((course) => (
            <li key={course}>{course}</li>
          ))}
        </ul>
        <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{t("reason")}</h3>
        <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{refund.reason}</p>
        {refund.decisionNote !== null && (
          <>
            <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
              {t("decisionNote")}
            </h3>
            <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
              {refund.decisionNote}
            </p>
          </>
        )}
      </section>

      {refund.status === "REQUESTED" && refund.paymentStatus === "SUCCEEDED" ? (
        <div className="mt-5">
          <RefundDecisionPanel refundId={refund.id} note={refund.decisionNote} />
        </div>
      ) : (
        <p className="mt-5 rounded-md border border-border bg-surface p-5 text-sm text-muted-foreground">
          {refund.status === "REQUESTED" ? t("paymentNotReady") : t("alreadyDecided")}
        </p>
      )}
    </div>
  );
}
