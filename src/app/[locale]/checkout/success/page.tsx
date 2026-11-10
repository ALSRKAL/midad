import type { Metadata } from "next";
import { Check, CheckCircle2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { LottiePlayer } from "@/components/shared/lottie-player";
import { Button } from "@/components/ui/button";
import { CheckoutPoller } from "@/features/checkout/components/checkout-poller";
import { ClearCouponOnMount } from "@/features/checkout/components/clear-coupon-on-mount";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { getCheckoutOrder } from "@/server/checkout";
import { getCurrentSession } from "@/server/session";

/** Payment success (P06-T05, BR-08). It only reads; the webhook owns enrolment. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Checkout" });
  return { title: t("successTitle"), robots: { index: false, follow: false } };
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) {
    const next = `/${locale}/checkout/success?session_id=${encodeURIComponent(sessionId ?? "")}`;
    redirect(`/${locale}/login?next=${encodeURIComponent(next)}`);
  }

  const t = await getTranslations({ locale, namespace: "Checkout" });
  const order = sessionId === undefined ? null : await getCheckoutOrder(user.id, sessionId);

  if (order === null) {
    return (
      <div className="mx-auto w-full max-w-xl px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t("invalidTitle")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("invalidBody")}</p>
        <Button asChild className="mt-6">
          <Link href="/purchases">{t("viewPurchases")}</Link>
        </Button>
      </div>
    );
  }

  const currency = order.currency === "USD" ? "USD" : "SAR";
  const paid = order.status === "PAID";
  const failed = order.status === "FAILED" || order.status === "CANCELLED";

  if (failed) {
    return (
      <div className="mx-auto w-full max-w-xl px-6 py-16 text-center">
        <LottiePlayer
          src="/lottie/payment-failed.json"
          width={180}
          height={180}
          className="mx-auto"
        />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
          {t("failedTitle")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("failedBody")}</p>
        <Button asChild className="mt-6">
          <Link href="/cart">{t("backToCart")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      {paid ? <ClearCouponOnMount /> : null}
      <div className="text-center">
        {paid ? (
          <div className="relative mx-auto size-[180px]">
            <LottiePlayer
              src="/lottie/payment-success.json"
              width={180}
              height={180}
              className="absolute inset-0"
            />
            <Check
              className="absolute inset-0 m-auto size-16 text-background"
              strokeWidth={3}
              aria-hidden="true"
            />
          </div>
        ) : (
          <CheckCircle2 className="mx-auto size-12 text-muted-foreground" aria-hidden="true" />
        )}
        <h1 className="mt-4 font-heading text-3xl font-semibold text-foreground">
          {paid ? t("successTitle") : t("verifyingTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          {paid ? t("successBody") : t("verifyingBody")}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">{t("orderRef", { id: order.id })}</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {t("totalPaid", {
            amount: formatMoney(
              { amount: order.totalCents, currency },
              locale === "en" ? "en" : "ar",
            ),
          })}
        </p>
        {!paid && <CheckoutPoller />}
      </div>

      {paid && (
        <section aria-labelledby="purchased-title" className="mt-10">
          <h2 id="purchased-title" className="font-heading text-lg font-semibold text-foreground">
            {t("itemsTitle")}
          </h2>
          <ul className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
            {order.items.map((item) => (
              <li
                key={item.courseId}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <span className="font-medium text-foreground">{item.title}</span>
                <Link
                  href={`/courses/${item.slug}#curriculum-title`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t("goToCourse")}
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild variant="secondary" className="mt-5">
            <Link href="/purchases">{t("viewPurchases")}</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
