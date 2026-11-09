"use client";

import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { startCheckoutAction } from "@/features/checkout/actions";

/**
 * Checkout entry. The browser never sends a price or a course list; the server recomputes the cart,
 * creates the PENDING order, then redirects to the Stripe-hosted page.
 */
export function CheckoutButton({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("Cart");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    const result = await startCheckoutAction({ locale });
    if (!result.ok) {
      const code = result.error.message;
      const key = `checkoutErrors.${code}`;
      setError(t.has(key) ? t(key) : t("checkoutErrors.default"));
      setPending(false);
      return;
    }
    // A full navigation leaves the app for Stripe; the back URL returns here after payment.
    window.location.assign(result.value.url);
  }

  return (
    <div className="mt-5">
      <Button
        type="button"
        className="w-full"
        loading={pending}
        onClick={() => {
          void start();
        }}
      >
        <CreditCard className="size-4" aria-hidden="true" />
        {pending ? t("checkingOut") : t("checkout")}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">{t("checkoutHint")}</p>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
