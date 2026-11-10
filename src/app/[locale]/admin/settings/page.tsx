import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlatformSettingsForm } from "@/features/admin/components/platform-settings-form";
import { getPlatformSettings } from "@/server/platform-settings";

/** Platform settings (P10-T04). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminSettings" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [settings, t] = await Promise.all([
    getPlatformSettings(),
    getTranslations({ locale, namespace: "AdminSettings" }),
  ]);

  return (
    <div className="min-w-0">
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-5">
        <PlatformSettingsForm initial={settings} />
      </div>
    </div>
  );
}
