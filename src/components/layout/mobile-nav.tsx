"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ThemeSwitch } from "@/components/layout/theme-switch";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

/**
 * Mobile navigation.
 *
 * A start-side drawer, not a full-screen overlay: the page stays visible on the other side, so the
 * visitor keeps their place. Radix supplies the focus trap, Escape handling and focus restoration;
 * the drawer position uses logical `start` so it opens from the correct edge in both languages.
 */
export function MobileNav({
  items,
  otherLocale,
  signedInName,
  cartCount,
  notificationCount,
  initialOpen = false,
}: {
  items: NavItem[];
  otherLocale: "ar" | "en";
  signedInName: string | null;
  cartCount: number;
  notificationCount: number;
  initialOpen?: boolean;
}) {
  const t = useTranslations("Layout");
  const pathname = usePathname();
  const localeT = useTranslations("Locale");
  const authT = useTranslations("Auth");
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("openMenu")} className="lg:hidden">
          <Menu aria-hidden="true" />
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-foreground/40",
            "motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0",
            "motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 start-0 z-50 flex h-full w-[min(20rem,85vw)] flex-col",
            "border-e border-border bg-surface p-6 shadow-md",
            "motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-start",
            "motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:slide-out-to-start",
          )}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="font-heading text-lg font-semibold">
              {t("menuTitle")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label={t("closeMenu")}>
                <X aria-hidden="true" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <nav aria-label={t("menuTitle")} className="mt-6 flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-sm px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-sm px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
            >
              {t("navCart")}
              <span className="text-sm text-muted-foreground">
                {t("cartItems", { count: cartCount })}
              </span>
            </Link>
            <Link
              href={pathname}
              locale={otherLocale}
              hrefLang={otherLocale}
              onClick={() => setOpen(false)}
              className="rounded-sm px-3 py-2.5 text-base font-medium text-primary hover:bg-muted"
            >
              {localeT("switchTo")}
              <span className="sr-only">{` — ${localeT("switchLabel")}`}</span>
            </Link>
          </nav>

          <div className="mt-6 border-t border-border pt-4">
            {signedInName === null ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-sm px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                >
                  {authT("signInTitle")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-primary px-3 py-2.5 text-center text-base font-medium text-primary-foreground"
                >
                  {authT("signUpTitle")}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="px-3 text-sm text-muted-foreground">
                  {`${authT("signedInAs")} ${signedInName}`}
                </p>
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-sm px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                >
                  {t("navNotifications")}
                  {notificationCount > 0 && (
                    <span className="tabular rounded-full bg-danger px-2 text-xs font-semibold text-danger-foreground">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-sm px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                >
                  {t("navDashboard")}
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setOpen(false)}
                  className="rounded-sm px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                >
                  {t("navWishlist")}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="rounded-sm px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                >
                  {t("navSettings")}
                </Link>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    void (async () => {
                      await signOut();
                      setOpen(false);
                      router.refresh();
                      router.push("/");
                    })();
                  }}
                >
                  {authT("signOut")}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">{t("appearance")}</span>
            <ThemeSwitch />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
