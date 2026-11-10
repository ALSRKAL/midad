import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { isGoogleOAuthEnabled } from "@/env";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("signUpTitle"), robots: { index: false, follow: false } };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Auth" });

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="font-heading text-3xl">{t("signUpTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("signUpSubtitle")}</p>

      <div className="mt-8">
        <SignUpForm locale={locale} googleEnabled={isGoogleOAuthEnabled} />
      </div>
    </div>
  );
}
