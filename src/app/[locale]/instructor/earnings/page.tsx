import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PayoutRequestForm } from "@/features/earnings/components/payout-request-form";
import { NoInstructorProfile } from "@/features/instructor-builder/components/no-instructor-profile";
import type { Locale } from "@/config/site";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getInstructorEarnings } from "@/server/earnings";
import { getInstructorProfileId } from "@/server/instructor-courses";
import { getCurrentSession } from "@/server/session";

/** Instructor earnings, ledger statement and payout requests (P10-T02, BR-11/12/13). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Earnings" });
  return { title: t("title") };
}

export default async function InstructorEarningsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) return null;
  const instructorId = await getInstructorProfileId(user.id);
  const t = await getTranslations({ locale, namespace: "Earnings" });
  const localeValue: Locale = locale === "en" ? "en" : "ar";
  const statusLabel = (status: "REQUESTED" | "APPROVED" | "PAID" | "REJECTED") => {
    if (status === "REQUESTED") return t("statusRequested");
    if (status === "APPROVED") return t("statusApproved");
    if (status === "PAID") return t("statusPaid");
    return t("statusRejected");
  };
  const typeLabel = (type: "SALE" | "REFUND" | "PAYOUT") => {
    if (type === "SALE") return t("typeSale");
    if (type === "REFUND") return t("typeRefund");
    return t("typePayout");
  };

  if (instructorId === null) {
    return (
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">{t("title")}</h2>
        <div className="mt-4">
          <NoInstructorProfile />
        </div>
      </div>
    );
  }

  const earnings = await getInstructorEarnings(instructorId);
  const money = (cents: number) =>
    formatMoney({ amount: cents, currency: "SAR" }, localeValue, { showDecimals: true });

  const cards = [
    { label: t("available"), value: money(earnings.availableCents), tone: "text-success" },
    { label: t("pending"), value: money(earnings.pendingPayoutCents), tone: "text-foreground" },
    { label: t("eligible"), value: money(earnings.eligibleNetCents), tone: "text-foreground" },
    { label: t("lifetime"), value: money(earnings.lifetimeNetCents), tone: "text-foreground" },
  ];

  return (
    <div className="min-w-0">
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <dl className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-surface p-4">
            <dt className="text-sm text-muted-foreground">{card.label}</dt>
            <dd
              className={`tabular mt-1 font-heading text-xl font-semibold ${card.tone}`}
              dir="ltr"
            >
              {card.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        {t("windowNote", { days: earnings.refundWindowDays })}
      </p>

      <div className="mt-6">
        <PayoutRequestForm
          availableCents={earnings.availableCents}
          minimumCents={earnings.minimumCents}
          pending={earnings.pendingPayoutId !== null}
          locale={localeValue}
        />
      </div>

      <section aria-labelledby="payouts-title" className="mt-8">
        <h3 id="payouts-title" className="font-heading text-lg font-semibold text-foreground">
          {t("payoutsTitle")}
        </h3>
        {earnings.payouts.length === 0 ? (
          <p className="mt-2 rounded-md border border-border bg-surface p-5 text-sm text-muted-foreground">
            {t("payoutsEmpty")}
          </p>
        ) : (
          <div
            role="region"
            aria-label={t("payoutsTitle")}
            tabIndex={0}
            className="mt-3 overflow-x-auto rounded-md border border-border bg-surface"
          >
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-muted/50 text-start text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("date")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("amount")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("status")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("reference")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {earnings.payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(payout.createdAt, localeValue)}
                    </td>
                    <td className="tabular px-4 py-3 text-foreground" dir="ltr">
                      {money(payout.amountCents)}
                    </td>
                    <td className="px-4 py-3 text-foreground">{statusLabel(payout.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                      {payout.transferReference ?? t("noReference")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="statement-title" className="mt-8">
        <h3 id="statement-title" className="font-heading text-lg font-semibold text-foreground">
          {t("statementTitle")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("statementHint")}</p>
        {earnings.ledger.length === 0 ? (
          <p className="mt-2 rounded-md border border-border bg-surface p-5 text-sm text-muted-foreground">
            {t("statementEmpty")}
          </p>
        ) : (
          <div
            role="region"
            aria-label={t("statementTitle")}
            tabIndex={0}
            className="mt-3 overflow-x-auto rounded-md border border-border bg-surface"
          >
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-muted/50 text-start text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("date")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("type")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("amount")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {earnings.ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(entry.createdAt, localeValue)}
                    </td>
                    <td className="px-4 py-3 text-foreground">{typeLabel(entry.type)}</td>
                    <td
                      className={`tabular px-4 py-3 ${entry.amountCents < 0 ? "text-danger" : "text-success"}`}
                      dir="ltr"
                    >
                      {money(entry.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
