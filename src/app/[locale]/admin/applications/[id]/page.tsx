import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ApplicationDecisionPanel } from "@/features/admin/components/application-decision-panel";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { getApplicationDetail } from "@/server/admin/applications";

/** One instructor application (P05-T03). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("applicationsTitle") };
}

export default async function AdminApplicationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const application = await getApplicationDetail(id);
  if (application === null) notFound();

  const t = await getTranslations({ locale, namespace: "Admin" });
  const localeValue = locale === "en" ? "en" : "ar";
  const statusLabel =
    application.status === "APPROVED"
      ? t("applicationApproved")
      : application.status === "REJECTED"
        ? t("applicationRejected")
        : t("applicationPending");

  return (
    <div>
      <Link href="/admin/applications" className="text-sm font-medium text-primary hover:underline">
        {t("applicationBack")}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          {application.applicantName}
        </h2>
        <Badge
          variant={
            application.status === "APPROVED"
              ? "success"
              : application.status === "REJECTED"
                ? "danger"
                : "warning"
          }
        >
          {statusLabel}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
        {application.applicantEmail}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("reviewSubmittedBy", {
          name: application.applicantName,
          date: formatDate(application.createdAt, localeValue),
        })}
      </p>
      {application.reviewedAt !== null && application.reviewerName !== null && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("reviewedByLine", {
            name: application.reviewerName,
            date: formatDate(application.reviewedAt, localeValue),
          })}
        </p>
      )}

      <div className="mt-6 space-y-6">
        <section
          aria-labelledby="application-details-title"
          className="rounded-md border border-border bg-surface p-5"
        >
          <h3
            id="application-details-title"
            className="font-heading text-lg font-semibold text-foreground"
          >
            {t("applicantDetails")}
          </h3>

          <dl className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-foreground">{t("colField")}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{application.field}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-foreground">{t("portfolioLabel")}</dt>
              <dd className="mt-1 text-sm">
                {application.portfolioUrl === null ? (
                  <span className="text-muted-foreground">{t("noLink")}</span>
                ) : (
                  <a
                    href={application.portfolioUrl}
                    dir="ltr"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {application.portfolioUrl}
                  </a>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-foreground">{t("videoLabel")}</dt>
              <dd className="mt-1 text-sm">
                {application.sampleVideoUrl === null ? (
                  <span className="text-muted-foreground">{t("noLink")}</span>
                ) : (
                  <a
                    href={application.sampleVideoUrl}
                    dir="ltr"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {application.sampleVideoUrl}
                  </a>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-foreground">{t("experienceLabel")}</h4>
            <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
              {application.experience}
            </p>
          </div>

          {application.reason !== null && (
            <p className="mt-4 rounded-sm border border-danger px-3 py-2 text-sm text-danger">
              {t("applicationRejectedReason", { reason: application.reason })}
            </p>
          )}
        </section>

        {application.status === "PENDING" ? (
          <ApplicationDecisionPanel applicationId={application.id} />
        ) : (
          <p className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">
            {t("applicationNoDecision")}
          </p>
        )}
      </div>
    </div>
  );
}
