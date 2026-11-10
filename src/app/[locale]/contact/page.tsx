import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ContactForm } from "@/features/contact/components/contact-form";
import { siteConfig } from "@/config/site";
import { seoAlternates } from "@/lib/seo";

/** Contact page (the product requirements). The form stores a real message that the admin inbox reads. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: seoAlternates(locale === "en" ? "en" : "ar", "/contact"),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Contact" });

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-12">
      <header className="max-w-2xl border-b border-border pb-5">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("intro")}</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section
          aria-labelledby="contact-form-title"
          className="rounded-md border border-border bg-surface p-6"
        >
          <h2
            id="contact-form-title"
            className="font-heading text-xl font-semibold text-foreground"
          >
            {t("formTitle")}
          </h2>
          <div className="mt-5">
            <ContactForm />
          </div>
        </section>

        <aside className="h-fit rounded-md border border-border bg-surface p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {t("supportTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("supportBody")}</p>
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            dir="ltr"
            className="mt-3 inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            <Mail className="size-4" aria-hidden="true" />
            {siteConfig.supportEmail}
          </a>
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
            {t("responseTime")}
          </p>
        </aside>
      </div>
    </div>
  );
}
