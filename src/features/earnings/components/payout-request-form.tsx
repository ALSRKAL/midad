"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPayoutAction } from "@/features/earnings/actions";
import { useRouter } from "@/i18n/navigation";

/** Payout request form (P10-T02). The server re-computes the balance; the UI only explains it. */
export function PayoutRequestForm({
  availableCents,
  minimumCents,
  pending,
  locale,
}: {
  availableCents: number;
  minimumCents: number;
  pending: boolean;
  locale: "ar" | "en";
}) {
  const t = useTranslations("Earnings");
  const router = useRouter();
  const [amount, setAmount] = useState((availableCents / 100).toFixed(2));
  const [pendingRequest, setPendingRequest] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const money = (cents: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 2,
    }).format(cents / 100);

  async function submit() {
    setPendingRequest(true);
    setError(null);
    setStatus(null);
    const result = await requestPayoutAction({ amount });
    setPendingRequest(false);
    if (result.ok) {
      setStatus(t("requested"));
      router.refresh();
      return;
    }
    const code = result.error.message;
    setError(
      code.includes("PENDING_PAYOUT_EXISTS")
        ? t("pendingExists")
        : code.includes("AMOUNT_BELOW_MINIMUM")
          ? t("belowMinimum", { minimum: money(minimumCents) })
          : code.includes("AMOUNT_EXCEEDS_AVAILABLE")
            ? t("exceedsAvailable")
            : code.includes("INVALID_AMOUNT")
              ? t("invalidAmount")
              : t("error"),
    );
  }

  return (
    <form
      className="rounded-md border border-border bg-surface p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h3 className="font-heading text-lg font-semibold text-foreground">{t("requestTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("requestHint", { available: money(availableCents), minimum: money(minimumCents) })}
      </p>
      <div className="mt-3 max-w-xs space-y-1">
        <Label htmlFor="payout-amount">{t("amount")}</Label>
        <Input
          id="payout-amount"
          inputMode="decimal"
          dir="ltr"
          className="tabular"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          disabled={pending}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pendingRequest} disabled={pending}>
          {pendingRequest ? t("requesting") : t("requestAction")}
        </Button>
        {pending && <p className="text-sm text-muted-foreground">{t("onePending")}</p>}
      </div>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      {status !== null && (
        <p role="status" className="mt-2 text-sm text-success">
          {status}
        </p>
      )}
    </form>
  );
}
