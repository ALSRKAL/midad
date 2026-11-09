"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlatformSettingsAction } from "@/features/admin/settings-actions";
import { useRouter } from "@/i18n/navigation";

/** Platform settings form (P10-T04). Percentages are entered as humans read them. */
export function PlatformSettingsForm({
  initial,
}: {
  initial: {
    commissionBps: number;
    vatBps: number;
    defaultCurrency: "SAR" | "USD";
    refundWindowDays: number;
    refundMaxProgressPct: number;
    reviewMinProgressPct: number;
    payoutMinimumMinor: number;
    signedUrlTtlSec: number;
    maintenanceMode: boolean;
  };
}) {
  const t = useTranslations("AdminSettings");
  const router = useRouter();
  const [commission, setCommission] = useState(String(initial.commissionBps / 100));
  const [vat, setVat] = useState(String(initial.vatBps / 100));
  const [currency, setCurrency] = useState(initial.defaultCurrency);
  const [refundDays, setRefundDays] = useState(String(initial.refundWindowDays));
  const [refundProgress, setRefundProgress] = useState(String(initial.refundMaxProgressPct));
  const [reviewProgress, setReviewProgress] = useState(String(initial.reviewMinProgressPct));
  const [payoutMinimum, setPayoutMinimum] = useState(String(initial.payoutMinimumMinor / 100));
  const [signedTtl, setSignedTtl] = useState(String(initial.signedUrlTtlSec));
  const [maintenance, setMaintenance] = useState(initial.maintenanceMode);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    setStatus(null);
    const result = await updatePlatformSettingsAction({
      commissionBps: Math.round(Number(commission) * 100),
      vatBps: Math.round(Number(vat) * 100),
      defaultCurrency: currency,
      refundWindowDays: Number(refundDays),
      refundMaxProgressPct: Number(refundProgress),
      reviewMinProgressPct: Number(reviewProgress),
      payoutMinimumMinor: Math.round(Number(payoutMinimum) * 100),
      signedUrlTtlSec: Number(signedTtl),
      maintenanceMode: maintenance,
    });
    setPending(false);
    if (result.ok) {
      setStatus(t("saved"));
      router.refresh();
      return;
    }
    setError(t("error"));
  }

  return (
    <form
      className="max-w-3xl space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="setting-commission">{t("commission")}</Label>
          <Input
            id="setting-commission"
            type="number"
            min={0}
            max={100}
            step="0.01"
            dir="ltr"
            value={commission}
            onChange={(event) => setCommission(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("commissionHint")}</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="setting-vat">{t("vat")}</Label>
          <Input
            id="setting-vat"
            type="number"
            min={0}
            max={100}
            step="0.01"
            dir="ltr"
            value={vat}
            onChange={(event) => setVat(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("vatHint")}</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="setting-currency">{t("currency")}</Label>
          <select
            id="setting-currency"
            className="h-10 w-full rounded-sm border border-border-strong bg-surface px-3 text-sm text-foreground"
            value={currency}
            onChange={(event) => setCurrency(event.target.value === "USD" ? "USD" : "SAR")}
          >
            <option value="SAR">{t("currencySar")}</option>
            <option value="USD">{t("currencyUsd")}</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="setting-refund-days">{t("refundDays")}</Label>
          <Input
            id="setting-refund-days"
            type="number"
            min={0}
            max={365}
            dir="ltr"
            value={refundDays}
            onChange={(event) => setRefundDays(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="setting-refund-progress">{t("refundProgress")}</Label>
          <Input
            id="setting-refund-progress"
            type="number"
            min={0}
            max={100}
            dir="ltr"
            value={refundProgress}
            onChange={(event) => setRefundProgress(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="setting-review-progress">{t("reviewProgress")}</Label>
          <Input
            id="setting-review-progress"
            type="number"
            min={0}
            max={100}
            dir="ltr"
            value={reviewProgress}
            onChange={(event) => setReviewProgress(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="setting-payout-minimum">{t("payoutMinimum")}</Label>
          <Input
            id="setting-payout-minimum"
            type="number"
            min={0}
            step="0.01"
            dir="ltr"
            value={payoutMinimum}
            onChange={(event) => setPayoutMinimum(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="setting-signed-ttl">{t("signedTtl")}</Label>
          <Input
            id="setting-signed-ttl"
            type="number"
            min={60}
            max={86400}
            dir="ltr"
            value={signedTtl}
            onChange={(event) => setSignedTtl(event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border p-4">
        <label className="flex items-start gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--primary)]"
            checked={maintenance}
            onChange={(event) => setMaintenance(event.target.checked)}
            aria-label={t("maintenanceMode")}
          />
          <span>
            <span className="font-medium">{t("maintenanceMode")}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{t("maintenanceHint")}</span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
        {error !== null && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {status !== null && (
          <p role="status" className="text-sm text-success">
            {status}
          </p>
        )}
      </div>
    </form>
  );
}
