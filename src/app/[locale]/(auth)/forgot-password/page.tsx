import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Password" });
  return { title: t("forgotTitle"), robots: { index: false, follow: false } };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Password" });

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="font-heading text-3xl">{t("forgotTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("forgotSubtitle")}</p>

      <div className="mt-8">
        <ForgotPasswordForm locale={locale} />
      </div>
    </div>
  );
}
