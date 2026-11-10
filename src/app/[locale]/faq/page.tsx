import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { seoAlternates } from "@/lib/seo";

/** FAQ (the product requirements). Native disclosure elements: keyboard-operable and searchable text. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Faq" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: seoAlternates(locale === "en" ? "en" : "ar", "/faq"),
  };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Faq" });

  const items = [
    { question: t("q1"), answer: t("a1") },
    { question: t("q2"), answer: t("a2") },
    { question: t("q3"), answer: t("a3") },
    { question: t("q4"), answer: t("a4") },
    { question: t("q5"), answer: t("a5") },
    { question: t("q6"), answer: t("a6") },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <header className="border-b border-border pb-5">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("intro")}</p>
      </header>

      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-md border border-border bg-surface p-5"
          >
            <summary className="cursor-pointer font-medium text-foreground">
              {item.question}
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
