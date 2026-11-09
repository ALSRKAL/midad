"use client";

import { Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyCouponAction, removeCouponAction } from "@/features/cart/actions";
import { useRouter } from "@/i18n/navigation";
import type { Currency } from "@/config/site";
import { formatMoney } from "@/lib/money";

export type CouponFormState =
  | { status: "NONE" }
  | { status: "INVALID"; code: string; reason: string }
  | { status: "VALID"; code: string; discountCents: number };

/**
 * Coupon entry (P06-T02). The discount shown here is the server's evaluation; typing a code never
 * changes a price locally. Applying stores the code in an httpOnly cookie so it survives checkout.
 */
export function CouponForm({
  state,
  locale,
  currency,
}: {
  state: CouponFormState;
  locale: "ar" | "en";
  currency: Currency;
}) {
  const t = useTranslations("Cart");
  const router = useRouter();
  const [code, setCode] = useState(state.status === "NONE" ? "" : state.code);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    state.status === "INVALID" ? couponError(state.reason) : null,
  );

  function couponError(reason: string): string {
    const key = `couponErrors.${reason}`;
    return t.has(key) ? t(key) : t("couponErrors.default");
  }

  async function apply() {
    setPending(true);
    setError(null);
    const result = await applyCouponAction({ code });
    setPending(false);
    if (!result.ok) {
      setError(couponError(result.error.message));
      return;
    }
    router.refresh();
  }

  async function remove() {
    setPending(true);
    setError(null);
    const result = await removeCouponAction();
    setPending(false);
    if (!result.ok) {
      setError(t("error"));
      return;
    }
    setCode("");
    router.refresh();
  }

  if (state.status === "VALID") {
    return (
      <div className="mt-4 rounded-sm border border-success bg-success/5 p-3">
        <p className="flex items-center gap-2 text-sm font-medium text-success">
          <Tag className="size-4" aria-hidden="true" />
          {t("couponApplied", { code: state.code })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {`− ${formatMoney({ amount: state.discountCents, currency }, locale)}`}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          loading={pending}
          onClick={() => {
            void remove();
          }}
        >
          <X className="size-4" aria-hidden="true" />
          {t("couponRemove")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <Label htmlFor="coupon-code">{t("couponTitle")}</Label>
      <div className="flex items-end gap-2">
        <Input
          id="coupon-code"
          name="coupon"
          dir="ltr"
          autoComplete="off"
          maxLength={40}
          placeholder={t("couponPlaceholder")}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void apply();
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          loading={pending}
          disabled={code.trim() === ""}
          onClick={() => {
            void apply();
          }}
        >
          {pending ? t("couponApplying") : t("couponApply")}
        </Button>
      </div>
      {error !== null && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
