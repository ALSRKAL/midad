import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { StaticPage, StaticSection } from "@/components/marketing/static-page";
import { seoAlternates } from "@/lib/seo";

/** About page (the product requirements). Content lives in the message catalogs, not in JSX literals. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: seoAlternates(locale === "en" ? "en" : "ar", "/about"),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "About" });

  return (
    <StaticPage title={t("title")} intro={t("intro")}>
      <StaticSection title={t("missionTitle")} body={t("missionBody")} />
      <StaticSection title={t("methodTitle")} body={t("methodBody")} />
      <StaticSection title={t("verifyTitle")} body={t("verifyBody")} />
      <StaticSection title={t("teamTitle")} body={t("teamBody")} />
    </StaticPage>
  );
}
