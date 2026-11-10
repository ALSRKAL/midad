import type { Metadata } from "next";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { CouponForm } from "@/features/cart/components/coupon-form";
import { RemoveFromCartButton } from "@/features/cart/components/remove-from-cart-button";
import { CheckoutButton } from "@/features/checkout/components/checkout-button";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { getCartView } from "@/server/cart";
import { getCurrentSession } from "@/server/session";
import { publicAssetUrl } from "@/server/storage";

/** Cart page (P06-T01). Server-rendered from the cookie or the database; no price comes from the client. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cart" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [user, t] = await Promise.all([
    getCurrentSession(),
    getTranslations({ locale, namespace: "Cart" }),
  ]);
  const cart = await getCartView(user);
  const localeValue: Locale = locale === "en" ? "en" : "ar";
  const currency = cart.quote.currency;
  const money = (amount: number) => formatMoney({ amount, currency }, localeValue);

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("itemCount", { count: cart.items.length })}
        </p>
      </header>

      {cart.items.length === 0 ? (
        <div className="mt-12 rounded-md border border-border bg-surface p-10 text-center">
          <ShoppingBag className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">
            {t("emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("emptyBody")}</p>
          <Button asChild className="mt-5">
            <Link href="/courses">{t("browse")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ul className="divide-y divide-border rounded-md border border-border bg-surface">
            {cart.items.map((item) => {
              const title =
                localeValue === "en"
                  ? (item.titleEn ?? item.titleAr ?? item.slug)
                  : (item.titleAr ?? item.titleEn ?? item.slug);
              const coverUrl =
                item.coverImageKey === null ? null : publicAssetUrl(item.coverImageKey);
              const availabilityLabel =
                item.availability === "UNAVAILABLE"
                  ? t("availabilityUnavailable")
                  : item.availability === "ENROLLED"
                    ? t("availabilityEnrolled")
                    : item.availability === "OWN_COURSE"
                      ? t("availabilityOwn")
                      : item.availability === "FREE"
                        ? t("availabilityFree")
                        : null;

              return (
                <li key={item.id} className="flex flex-wrap items-start gap-4 p-4">
                  <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-sm bg-muted">
                    {coverUrl === null ? (
                      <span className="flex size-full items-center justify-center font-heading text-xl text-muted-foreground">
                        {title.charAt(0)}
                      </span>
                    ) : (
                      <Image src={coverUrl} alt="" fill sizes="128px" className="object-cover" />
                    )}
                  </div>

                  <div className="min-w-48 flex-1">
                    <Link
                      href={`/courses/${item.slug}`}
                      className="font-heading text-lg font-medium text-foreground hover:text-primary"
                    >
                      {title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{item.instructorName}</p>
                    {availabilityLabel !== null && (
                      <p className="mt-2 text-xs font-medium text-warning">{availabilityLabel}</p>
                    )}
                    <div className="mt-2">
                      <RemoveFromCartButton courseId={item.id} title={title} />
                    </div>
                  </div>

                  <p className="tabular text-sm font-medium text-foreground">
                    {item.isFree ? t("availabilityFree") : money(item.priceCents)}
                  </p>
                </li>
              );
            })}
          </ul>

          <aside
            aria-labelledby="summary-title"
            className="rounded-md border border-border bg-surface p-5"
          >
            <h2 id="summary-title" className="font-heading text-lg font-semibold text-foreground">
              {t("summaryTitle")}
            </h2>

            <CouponForm state={cart.coupon} locale={localeValue} currency={currency} />

            <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{t("subtotal")}</dt>
                <dd className="tabular text-foreground">{money(cart.quote.subtotalCents)}</dd>
              </div>
              {cart.quote.discountCents > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{t("discount")}</dt>
                  <dd className="tabular text-success">{`− ${money(cart.quote.discountCents)}`}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{t("vat")}</dt>
                <dd className="tabular text-foreground">{money(cart.quote.taxCents)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
                <dt className="text-foreground">{t("total")}</dt>
                <dd className="tabular text-foreground">{money(cart.quote.totalCents)}</dd>
              </div>
            </dl>

            <p className="mt-3 text-xs text-muted-foreground">{t("taxNote")}</p>

            {cart.pricingError !== null && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {t(`checkoutErrors.${cart.pricingError}`)}
              </p>
            )}

            {user === null && (
              <Button asChild className="mt-5 w-full">
                <Link href="/login?next=%2Fcart">{t("signInToCheckout")}</Link>
              </Button>
            )}

            {user !== null &&
              cart.pricingError === null &&
              cart.items.some((item) => item.availability === null) && (
                <CheckoutButton locale={localeValue} />
              )}
          </aside>
        </div>
      )}
    </div>
  );
}
