import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { getOrderForUser } from "@/server/checkout";
import { getCurrentSession } from "@/server/session";

/** Payment failure/cancel page (P06-T05). The cart was never cleared, so retrying is real. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Checkout" });
  return { title: t("failedTitle"), robots: { index: false, follow: false } };
}

export default async function CheckoutFailedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { locale } = await params;
  const { order_id: orderId } = await searchParams;
  setRequestLocale(locale);

  const [user, t] = await Promise.all([
    getCurrentSession(),
    getTranslations({ locale, namespace: "Checkout" }),
  ]);
  const order =
    user === null || orderId === undefined ? null : await getOrderForUser(user.id, orderId);
  const currency = order?.currency === "USD" ? "USD" : "SAR";

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-16 text-center">
      <XCircle className="mx-auto size-12 text-danger" aria-hidden="true" />
      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
        {t("failedTitle")}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("failedBody")}</p>
      {order !== null && (
        <p className="mt-3 text-xs text-muted-foreground">
          {`${t("orderRef", { id: order.id })} · ${formatMoney(
            { amount: order.totalCents, currency },
            locale === "en" ? "en" : "ar",
          )}`}
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{t("failureHint")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/cart">{t("tryAgain")}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/purchases">{t("viewPurchases")}</Link>
        </Button>
      </div>
    </div>
  );
}
