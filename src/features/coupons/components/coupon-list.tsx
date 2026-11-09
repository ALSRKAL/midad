"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleCouponAction } from "@/features/coupons/actions";
import type { Locale } from "@/config/site";
import { useRouter } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export type CouponListRow = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  percentage: number | null;
  amountOffCents: number | null;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  startsAt: string;
  endsAt: string;
  maxRedemptions: number | null;
  redemptionCount: number;
  isActive: boolean;
  createdByName: string;
};

/** Coupon list with an activation toggle. Server actions re-check ownership. */
export function CouponList({
  rows,
  locale,
  showCreator,
}: {
  rows: CouponListRow[];
  locale: Locale;
  showCreator: boolean;
}) {
  const t = useTranslations("Coupons");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(row: CouponListRow) {
    setPendingId(row.id);
    setError(null);
    const result = await toggleCouponAction({ couponId: row.id, isActive: !row.isActive });
    setPendingId(null);
    if (!result.ok) {
      setError(t("errors.default"));
      return;
    }
    router.refresh();
  }

  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="mt-4">
      {error !== null && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-start">
              <th scope="col" className="px-3 py-2.5 text-start font-medium text-muted-foreground">
                {t("colCode")}
              </th>
              <th scope="col" className="px-3 py-2.5 text-start font-medium text-muted-foreground">
                {t("colScope")}
              </th>
              <th scope="col" className="px-3 py-2.5 text-start font-medium text-muted-foreground">
                {t("colValue")}
              </th>
              <th scope="col" className="px-3 py-2.5 text-start font-medium text-muted-foreground">
                {t("colWindow")}
              </th>
              <th scope="col" className="px-3 py-2.5 text-start font-medium text-muted-foreground">
                {t("colUses")}
              </th>
              <th scope="col" className="px-3 py-2.5 text-start font-medium text-muted-foreground">
                {t("colStatus")}
              </th>
              <th scope="col" className="px-3 py-2.5 text-end font-medium text-muted-foreground">
                {t("colActions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const scope =
                row.courseTitleAr === null && row.courseTitleEn === null
                  ? t("allCourses")
                  : locale === "en"
                    ? (row.courseTitleEn ?? row.courseTitleAr ?? t("allCourses"))
                    : (row.courseTitleAr ?? row.courseTitleEn ?? t("allCourses"));
              const value =
                row.type === "PERCENTAGE"
                  ? `${row.percentage ?? 0}%`
                  : formatMoney({ amount: row.amountOffCents ?? 0, currency: "SAR" }, locale);
              return (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-3" dir="ltr">
                    <span className="font-medium text-foreground">{row.code}</span>
                    {showCreator && (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {t("creator", { name: row.createdByName })}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-foreground">{scope}</td>
                  <td className="tabular px-3 py-3 text-foreground">{value}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {`${formatDate(new Date(row.startsAt), locale)} — ${formatDate(
                      new Date(row.endsAt),
                      locale,
                    )}`}
                  </td>
                  <td className="tabular px-3 py-3 text-foreground">
                    {row.maxRedemptions === null
                      ? t("uses", { count: row.redemptionCount, max: "∞" })
                      : t("uses", { count: row.redemptionCount, max: row.maxRedemptions })}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={row.isActive ? "success" : "neutral"}>
                      {row.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      loading={pendingId === row.id}
                      onClick={() => {
                        void toggle(row);
                      }}
                    >
                      {row.isActive ? t("deactivate") : t("activate")}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
