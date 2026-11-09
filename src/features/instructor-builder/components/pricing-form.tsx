"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateCoursePricingAction } from "@/features/instructor-builder/actions";
import { useRouter } from "@/i18n/navigation";
import { parseMoneyInput } from "@/lib/money";

/** Pricing (P04-T06). The input is SAR text; the server receives integer halala. */
export function PricingForm({
  courseId,
  initialIsFree,
  initialPriceCents,
}: {
  courseId: string;
  initialIsFree: boolean;
  initialPriceCents: number;
}) {
  const t = useTranslations("Publish");
  const router = useRouter();
  const [isFree, setIsFree] = useState(initialIsFree);
  const [price, setPrice] = useState(
    initialPriceCents === 0 ? "" : (initialPriceCents / 100).toFixed(2),
  );
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setState("idle");

    let priceCents = 0;
    if (!isFree) {
      try {
        priceCents = parseMoneyInput(price, "SAR");
      } catch {
        setError(t("priceInvalid"));
        setState("error");
        return;
      }
      if (priceCents <= 0) {
        setError(t("priceRequired"));
        setState("error");
        return;
      }
    }

    setPending(true);
    const result = await updateCoursePricingAction({ courseId, isFree, priceCents });
    setPending(false);

    if (!result.ok) {
      const code =
        result.error.fields === undefined ? undefined : Object.values(result.error.fields)[0]?.[0];
      setError(
        code === "PRICE_REQUIRED"
          ? t("priceRequired")
          : code === "PRICE_TOO_LARGE"
            ? t("priceTooLarge")
            : code === "PRICE_INVALID"
              ? t("priceInvalid")
              : t("genericError"),
      );
      setState("error");
      return;
    }
    setState("saved");
    // The checklist is server-computed; refresh so the price item turns green immediately.
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-4"
      noValidate
    >
      <div className="flex items-center gap-3">
        <Switch
          id="course-free"
          aria-label={t("freeToggle")}
          checked={isFree}
          onCheckedChange={(checked) => {
            setIsFree(checked);
            setState("idle");
          }}
        />
        <Label htmlFor="course-free">{t("freeToggle")}</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="course-price">{t("priceLabel")}</Label>
        <Input
          id="course-price"
          dir="ltr"
          inputMode="decimal"
          value={price}
          disabled={isFree}
          onChange={(event) => {
            setPrice(event.target.value);
            setState("idle");
          }}
        />
        <p className="text-sm text-muted-foreground">{t("priceHint")}</p>
      </div>

      {error !== null && (
        <p role="alert" className="rounded-sm border border-danger px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {state === "saved" && (
        <p
          role="status"
          className="rounded-sm border border-success px-3 py-2 text-sm text-success"
        >
          {t("pricingSaved")}
        </p>
      )}

      <Button type="submit" loading={pending}>
        {pending ? t("savingPricing") : t("savePricing")}
      </Button>
    </form>
  );
}
