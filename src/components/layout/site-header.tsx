import { useTranslations } from "next-intl";
import { Bell, ShoppingBag } from "lucide-react";

import { AccountMenu } from "@/components/layout/account-menu";
import { HeaderUtilities } from "@/components/layout/header-utilities";
import { MobileNavLoader } from "@/components/layout/mobile-nav-loader";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import type { SessionUser } from "@/server/session";

/**
 * Site header.
 *
 * Only destinations that exist are rendered: the search box, the category menu, the cart and the
 * account settings page join in P03, P06 and P02-T05 respectively, once their pages exist. A header
 * link that 404s would violate the product requirements ("either it works or it does not appear").
 */
export function SiteHeader({
  locale,
  user,
  cartCount,
  notificationCount,
}: {
  locale: "ar" | "en";
  user: SessionUser | null;
  cartCount: number;
  notificationCount: number;
}) {
  const t = useTranslations("Layout");
  const notificationT = useTranslations("Notifications");
  const auth = useTranslations("Auth");
  const otherLocale = locale === "ar" ? "en" : "ar";
  // The badges cap at "99+"; the accessible name must contain that visible text (axe
  // label-content-name-mismatch). Announce the same capped value the eye sees.
  const notificationBadge = notificationCount > 99 ? "99+" : notificationCount;
  const cartBadge = cartCount > 99 ? "99+" : t("cartItems", { count: cartCount });

  const items = [{ href: "/", label: t("navHome") }];
  if (process.env.NODE_ENV !== "production") {
    items.push({ href: "/design-system", label: t("navDesignSystem") });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-(--header-height) w-full max-w-(--container-page) items-center gap-3 px-6">
        <Link
          href="/"
          className="font-heading text-xl font-semibold text-foreground"
          aria-label={siteConfig.name[locale]}
        >
          {siteConfig.name[locale]}
        </Link>

        <nav aria-label={t("primaryNav")} className="ms-4 hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {user !== null && (
            <Link
              href="/notifications"
              aria-label={notificationT("bell", { count: notificationBadge })}
              className="relative rounded-sm p-2 text-foreground hover:bg-muted"
            >
              <Bell className="size-5" aria-hidden="true" />
              {notificationCount > 0 && (
                <span
                  aria-hidden="true"
                  className="tabular absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-danger text-[0.65rem] font-semibold text-danger-foreground"
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>
          )}
          <Link
            href="/cart"
            aria-label={`${t("navCart")} — ${cartBadge}`}
            className="relative rounded-sm p-2 text-foreground hover:bg-muted"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="tabular absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <HeaderUtilities targetLocale={otherLocale} />

          {user === null ? (
            <div className="hidden items-center gap-1 lg:flex">
              <Link
                href="/login"
                className="rounded-sm px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {auth("signInTitle")}
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 ease-brand hover:bg-primary/90"
              >
                {auth("signUpTitle")}
              </Link>
            </div>
          ) : (
            <div className="hidden lg:block">
              <AccountMenu name={user.name} />
            </div>
          )}

          <MobileNavLoader
            items={items}
            otherLocale={otherLocale}
            signedInName={user === null ? null : user.name}
            cartCount={cartCount}
            notificationCount={notificationCount}
          />
        </div>
      </div>
    </header>
  );
}
