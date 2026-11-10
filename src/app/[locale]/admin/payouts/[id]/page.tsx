import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PayoutDecisionPanel } from "@/features/admin/components/payout-decision-panel";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getAdminPayout } from "@/server/admin/payouts";

/** Admin payout detail (P10-T04). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminPayoutDetail" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AdminPayoutDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [payout, t, adminT] = await Promise.all([
    getAdminPayout(id),
    getTranslations({ locale, namespace: "AdminPayoutDetail" }),
    getTranslations({ locale, namespace: "Admin" }),
  ]);
  if (payout === null) notFound();
  const localeValue: Locale = locale === "en" ? "en" : "ar";
  const currency = payout.currency === "USD" ? "USD" : "SAR";
  const statusLabel =
    payout.status === "REQUESTED"
      ? adminT("payoutStatusRequested")
      : payout.status === "APPROVED"
        ? adminT("payoutStatusApproved")
        : payout.status === "PAID"
          ? adminT("payoutStatusPaid")
          : adminT("payoutStatusRejected");

  return (
    <div className="min-w-0">
      <Link href="/admin/payouts" className="text-sm font-medium text-primary hover:underline">
        {t("back")}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">{t("title")}</h2>
        <Badge
          variant={
            payout.status === "PAID"
              ? "success"
              : payout.status === "REJECTED"
                ? "danger"
                : "warning"
          }
        >
          {statusLabel}
        </Badge>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-sm text-muted-foreground">{t("instructor")}</dt>
          <dd className="mt-1 font-medium text-foreground">{payout.instructorName}</dd>
          <dd className="text-sm text-muted-foreground" dir="ltr">
            {payout.instructorEmail}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-sm text-muted-foreground">{t("amount")}</dt>
          <dd className="tabular mt-1 font-heading text-xl font-semibold text-foreground" dir="ltr">
            {formatMoney({ amount: payout.amountCents, currency }, localeValue, {
              showDecimals: true,
            })}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-sm text-muted-foreground">{t("requested")}</dt>
          <dd className="mt-1 text-sm text-foreground">
            {formatDate(payout.createdAt, localeValue)}
          </dd>
          {payout.decidedByName !== null && payout.decidedAt !== null && (
            <dd className="mt-1 text-xs text-muted-foreground">
              {t("decidedBy", {
                name: payout.decidedByName,
                date: formatDate(payout.decidedAt, localeValue),
              })}
            </dd>
          )}
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-sm text-muted-foreground">{t("reference")}</dt>
          <dd className="mt-1 text-sm text-foreground" dir="ltr">
            {payout.transferReference ?? t("noReference")}
          </dd>
          {payout.paidAt !== null && (
            <dd className="mt-1 text-xs text-muted-foreground">
              {t("paidOn", { date: formatDate(payout.paidAt, localeValue) })}
            </dd>
          )}
        </div>
      </dl>

      <section className="mt-5 rounded-md border border-border bg-surface p-5">
        <h3 className="font-heading text-lg font-semibold text-foreground">{t("ledgerTitle")}</h3>
        {payout.ledger.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("ledgerEmpty")}</p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-sm">
            {payout.ledger.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-muted-foreground">
                  {formatDate(entry.createdAt, localeValue)}
                </span>
                <span className="tabular text-foreground" dir="ltr">
                  {formatMoney({ amount: entry.amountCents, currency }, localeValue, {
                    showDecimals: true,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-5">
        <PayoutDecisionPanel payoutId={payout.id} status={payout.status} />
      </div>
    </div>
  );
}
