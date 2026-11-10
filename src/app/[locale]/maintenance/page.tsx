import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * Maintenance page (the product requirements).
 *
 * Reached through the middleware when MAINTENANCE_MODE is on. It is deliberately a normal page
 * rather than a 503 error boundary, so it can explain that enrolled courses are safe — the most
 * common worry during maintenance.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "System" });
  return { title: t("maintenanceTitle"), robots: { index: false, follow: false } };
}

export default async function MaintenancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "System" });

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-24">
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <div className="mx-auto w-fit rounded-full border border-warning px-3 py-1 text-sm font-medium text-warning">
          {t("maintenanceTitle")}
        </div>
        <h1 className="font-heading text-3xl">{t("maintenanceTitle")}</h1>
        <p className="text-muted-foreground">{t("maintenanceBody")}</p>
      </div>
    </div>
  );
}
