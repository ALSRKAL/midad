import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Password" });
  return { title: t("resetTitle"), robots: { index: false, follow: false } };
}

/**
 * The emailed link lands here with `?token=…`. The token is passed to the client form, which sends
 * it back to the API; the API is the only place that decides whether it is still valid.
 */
export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Password" });

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="font-heading text-3xl">{t("resetTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("resetSubtitle")}</p>

      <div className="mt-8">
        <ResetPasswordForm token={token ?? ""} />
      </div>
    </div>
  );
}
