import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { isGoogleOAuthEnabled } from "@/env";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("signInTitle"), robots: { index: false, follow: false } };
}

/**
 * Sign-in page. `?verified=1` is set as the callback of the verification link, so the visitor gets a
 * confirmation instead of silently landing on a form.
 */
export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ verified?: string; next?: string }>;
}) {
  const { locale } = await params;
  const { verified, next } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Auth" });

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="font-heading text-3xl">{t("signInTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("signInSubtitle")}</p>

      {verified === "1" && (
        <p role="status" className="mt-6 rounded-md border border-success p-3 text-sm text-success">
          {t("verified")}
        </p>
      )}

      <div className="mt-8">
        <SignInForm
          locale={locale}
          googleEnabled={isGoogleOAuthEnabled}
          {...(next === undefined ? {} : { next })}
        />
      </div>
    </div>
  );
}
