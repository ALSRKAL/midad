import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Arabic, Readex_Pro } from "next/font/google";
import { Direction } from "radix-ui";

import "@/styles/globals.css";
import { direction, htmlLang } from "@/config/site";
import { publicEnv } from "@/env";
import { ClientMessages } from "@/components/client-messages";
import { HydrationMarker } from "@/components/hydration-marker";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ImpersonationBanner } from "@/features/admin/components/impersonation-banner";
import { MergeGuestCart } from "@/features/cart/components/merge-guest-cart";
import { getImpersonationTargetName } from "@/server/admin/users-admin";
import { getCartCount, readGuestCartIds } from "@/server/cart";
import { getUnreadNotificationCount } from "@/server/notifications";
import { getCurrentSession } from "@/server/session";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";

/**
 * Self-hosted typefaces (the product requirements). `next/font` downloads and self-hosts them at build time, so
 * the app makes no request to a font CDN at runtime and there is no shift from a late swap.
 * Only the three weights the design system allows are loaded: 400 / 500 / 600.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const readexPro = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-readex",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const fontVariables = [
  plexArabic.variable,
  plexSans.variable,
  readexPro.variable,
  plexMono.variable,
].join(" ");

/**
 * Locale-aware root layout.
 *
 * `<html lang dir>` is decided on the server from the route segment, so the first paint already has
 * the right direction — the product requirements. The theme class is applied before paint by next-themes' inline
 * script; `suppressHydrationWarning` is required because that script intentionally changes the
 * element before React hydrates.
 */
export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
    applicationName: "Midad",
    formatDetection: { telephone: false, email: false, address: false },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
    openGraph: {
      type: "website",
      siteName: "Midad",
      title: t("title"),
      description: t("description"),
      locale: locale === "en" ? "en_US" : "ar_SA",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Common" });
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const user = await getCurrentSession();
  const [cartCount, guestCartIds, impersonatedName, notificationCount] = await Promise.all([
    getCartCount(user),
    user === null ? Promise.resolve([]) : readGuestCartIds(),
    user?.impersonatedBy === undefined || user.impersonatedBy === null
      ? Promise.resolve(null)
      : getImpersonationTargetName(user.id),
    user === null ? Promise.resolve(0) : getUnreadNotificationCount(user.id),
  ]);
  // The banner is rendered by the global shell, outside the admin layout's message provider, so its
  // two labels are resolved on the server and passed as plain strings.
  const impersonationT =
    impersonatedName === null ? null : await getTranslations({ locale, namespace: "Admin" });

  return (
    <html
      lang={htmlLang[locale]}
      dir={direction[locale]}
      className={fontVariables}
      suppressHydrationWarning
    >
      <body>
        <HydrationMarker />
        <ThemeProvider {...(nonce === undefined ? {} : { nonce })}>
          <ClientMessages
            locale={locale}
            namespaces={["Common", "Layout", "Locale", "Theme", "Auth", "Notifications"]}
          >
            {/*
             * Radix primitives read direction from this provider, not from <html dir>. Without it,
             * arrow keys inside Tabs, Sliders and menus would keep LTR semantics in Arabic pages —
             * a real defect found by the keyboard audit in P01-T05.
             */}
            <Direction.Provider dir={direction[locale]}>
              <a className="skip-link" href="#main-content">
                {t("skipToContent")}
              </a>
              {impersonatedName !== null && impersonationT !== null && (
                <ImpersonationBanner
                  message={impersonationT("impersonationBanner", { name: impersonatedName })}
                  actionLabel={impersonationT("stopImpersonating")}
                />
              )}
              {user !== null && guestCartIds.length > 0 && <MergeGuestCart />}
              <div className="flex min-h-dvh flex-col">
                <SiteHeader
                  locale={locale}
                  user={user}
                  cartCount={cartCount}
                  notificationCount={notificationCount}
                />
                {/*
                 * One main landmark for the whole shell — the skip link's target. Pages render
                 * inside it and therefore must not open a second <main>.
                 */}
                <main id="main-content" className="flex-1">
                  {children}
                </main>
                <SiteFooter locale={locale} />
              </div>
            </Direction.Provider>
          </ClientMessages>
        </ThemeProvider>
      </body>
    </html>
  );
}
