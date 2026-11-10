import type { Metadata } from "next";
import { Award, Check, Share2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LottiePlayer } from "@/components/shared/lottie-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { getCertificateByCode } from "@/server/certificates";

/** Public certificate verification (P08-T04). No login; the code is the capability. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Certificate" });
  return { title: t("verifyTitle"), robots: { index: false, follow: true } };
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Certificate" });
  const certificate = await getCertificateByCode(code);
  const localeValue: Locale = locale === "en" ? "en" : "ar";

  if (certificate === null) {
    return (
      <div className="mx-auto w-full max-w-xl px-6 py-16 text-center">
        <Award className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
          {t("invalidTitle")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("invalidBody")}</p>
        <Button asChild className="mt-6">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    );
  }

  const courseTitle =
    localeValue === "en"
      ? (certificate.course.titleEn ?? certificate.course.titleAr ?? "")
      : (certificate.course.titleAr ?? certificate.course.titleEn ?? "");
  const shareUrl = `${env.APP_URL}/${locale}/verify/${certificate.code}`;
  const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="rounded-md border border-border bg-surface p-8 text-center">
        <div className="relative mx-auto size-[140px]">
          <LottiePlayer
            src="/lottie/payment-success.json"
            width={140}
            height={140}
            className="absolute inset-0"
          />
          <Check
            className="absolute inset-0 m-auto size-12 text-background"
            strokeWidth={3}
            aria-hidden="true"
          />
        </div>
        <Badge variant={certificate.status === "ISSUED" ? "success" : "danger"} className="mt-2">
          {certificate.status === "ISSUED" ? t("verified") : t("revoked")}
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-semibold text-foreground">
          {certificate.recipientName}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">{courseTitle}</p>

        <dl className="mx-auto mt-6 grid max-w-md gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">{t("instructor")}</dt>
            <dd className="font-medium text-foreground">{certificate.instructorName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("issuedOn")}</dt>
            <dd className="font-medium text-foreground">
              {formatDate(certificate.issuedAt, localeValue)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">{t("code")}</dt>
            <dd className="font-mono text-sm font-medium text-foreground" dir="ltr">
              {certificate.code}
            </dd>
          </div>
        </dl>

        <p className="mx-auto mt-5 max-w-md text-xs text-muted-foreground">{t("hint")}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <a href={`/api/certificates/${certificate.code}/pdf`}>{t("download")}</a>
          </Button>
          <Button asChild variant="secondary">
            <a href={linkedIn} target="_blank" rel="noopener noreferrer">
              <Share2 className="size-4" aria-hidden="true" />
              {t("linkedin")}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
