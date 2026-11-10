import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

/**
 * Site footer.
 *
 * The columns grow with the product: only pages that exist are listed. The support address is a real
 * `mailto:` (the contact form arrives in P03-T04 with server-side storage and rate limiting).
 */
export async function SiteFooter({ locale }: { locale: "ar" | "en" }) {
  const t = await getTranslations({ locale, namespace: "Layout" });
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-(--container-page) gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <p className="font-heading text-lg font-semibold text-foreground">
            {siteConfig.name[locale]}
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("footerTagline")}</p>
        </div>

        <nav aria-label={t("footerNav")} className="text-sm">
          <p className="font-medium text-foreground">{t("footerLearn")}</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                {t("navHome")}
              </Link>
            </li>
            <li>
              <Link href="/teach" className="text-muted-foreground hover:text-foreground">
                {t("footerTeach")}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label={t("footerPlatform")} className="text-sm">
          <p className="font-medium text-foreground">{t("footerPlatform")}</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/about" className="text-muted-foreground hover:text-foreground">
                {t("footerAbout")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                {t("footerFaq")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                {t("footerContactLink")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                {t("footerTerms")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                {t("footerPrivacy")}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="text-sm">
          <p className="font-medium text-foreground">{t("footerContact")}</p>
          <ul className="mt-3 space-y-2">
            <li>
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                dir="ltr"
              >
                <Mail className="size-4" aria-hidden="true" />
                {siteConfig.supportEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-(--container-page) px-6 py-4 text-xs text-muted-foreground">
          {t("footerRights", { year })}
        </p>
      </div>
    </footer>
  );
}
