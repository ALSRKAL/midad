import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { StaticPage, StaticSection } from "@/components/marketing/static-page";
import { seoAlternates } from "@/lib/seo";

/** Privacy policy (the product requirements). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: seoAlternates(locale === "en" ? "en" : "ar", "/privacy"),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Privacy" });

  return (
    <StaticPage title={t("title")} intro={t("intro")}>
      <StaticSection title={t("dataTitle")} body={t("dataBody")} />
      <StaticSection title={t("useTitle")} body={t("useBody")} />
      <StaticSection title={t("sharingTitle")} body={t("sharingBody")} />
      <StaticSection title={t("rightsTitle")} body={t("rightsBody")} />
    </StaticPage>
  );
}
