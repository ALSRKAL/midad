import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { StaticPage, StaticSection } from "@/components/marketing/static-page";
import { seoAlternates } from "@/lib/seo";

/** Terms of use (the product requirements). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Terms" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: seoAlternates(locale === "en" ? "en" : "ar", "/terms"),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Terms" });

  return (
    <StaticPage title={t("title")} intro={t("intro")}>
      <StaticSection title={t("accountTitle")} body={t("accountBody")} />
      <StaticSection title={t("purchasesTitle")} body={t("purchasesBody")} />
      <StaticSection title={t("contentTitle")} body={t("contentBody")} />
      <StaticSection title={t("changesTitle")} body={t("changesBody")} />
    </StaticPage>
  );
}
