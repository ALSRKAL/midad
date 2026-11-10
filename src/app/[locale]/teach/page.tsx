import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { InstructorApplicationForm } from "@/features/instructor/components/application-form";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { seoAlternates } from "@/lib/seo";
import { listInstructorApplications, type ApplicationStatus } from "@/server/instructor";
import { getCurrentSession } from "@/server/session";

/**
 * "Become an instructor" (the product requirements).
 *
 * The form is shown to a signed-in student with no active application. A PENDING or APPROVED
 * application replaces the form with its status; after a rejection the applicant sees the admin's
 * reason and the form again. Every application stays in the history below.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Instructor" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: seoAlternates(locale === "en" ? "en" : "ar", "/teach"),
  };
}

function statusLabelKey(
  status: ApplicationStatus,
): "statusPending" | "statusApproved" | "statusRejected" {
  switch (status) {
    case "APPROVED":
      return "statusApproved";
    case "REJECTED":
      return "statusRejected";
    default:
      return "statusPending";
  }
}

function statusClasses(status: ApplicationStatus): string {
  switch (status) {
    case "APPROVED":
      return "border-success text-success";
    case "REJECTED":
      return "border-danger text-danger";
    default:
      return "border-warning text-warning";
  }
}

export default async function TeachPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/teach`)}`);
  }

  const t = await getTranslations({ locale, namespace: "Instructor" });
  const localeValue = locale === "en" ? "en" : "ar";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="border-b border-border pb-4">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      {user.role !== "STUDENT" ? (
        <section className="mt-8 rounded-md border border-success bg-surface p-6">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("alreadyTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("alreadyBody")}</p>
          <Link
            href="/instructor"
            className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("goToDashboard")}
          </Link>
        </section>
      ) : (
        <TeachContent locale={localeValue} userId={user.id} />
      )}
    </div>
  );
}

async function TeachContent({ locale, userId }: { locale: "ar" | "en"; userId: string }) {
  const t = await getTranslations({ locale, namespace: "Instructor" });
  const applications = await listInstructorApplications(userId);
  const active = applications.find(
    (application) => application.status === "PENDING" || application.status === "APPROVED",
  );
  const latest = applications[0];

  return (
    <div className="mt-8 space-y-8">
      {active === undefined ? (
        <>
          {latest?.status === "REJECTED" && (
            <section className="rounded-md border border-danger bg-surface p-6">
              <h2 className="font-heading text-lg font-semibold text-danger">
                {t("statusRejectedTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("statusRejectedBody")}</p>
              {latest.reason !== null && (
                <p className="mt-3 rounded-sm border border-border bg-muted px-3 py-2 text-sm text-foreground">
                  {`${t("rejectionReason")}: ${latest.reason}`}
                </p>
              )}
            </section>
          )}

          <section className="rounded-md border border-border bg-surface p-6">
            <h2 className="font-heading text-xl font-semibold text-foreground">{t("formTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("formDescription")}</p>
            <div className="mt-5">
              <InstructorApplicationForm />
            </div>
          </section>
        </>
      ) : (
        <section
          className={
            active.status === "APPROVED"
              ? "rounded-md border border-success bg-surface p-6"
              : "rounded-md border border-warning bg-surface p-6"
          }
        >
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {active.status === "APPROVED" ? t("statusApprovedTitle") : t("statusPendingTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {active.status === "APPROVED" ? t("statusApprovedBody") : t("statusPendingBody")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {`${t("submittedOn")}: ${formatDate(active.createdAt, locale)}`}
          </p>

          <div className="mt-5 rounded-sm border border-border bg-muted p-4">
            <h3 className="font-medium text-foreground">{t("applicationDetails")}</h3>
            <p className="mt-2 text-sm text-foreground">{`${t("field")}: ${active.field}`}</p>
            <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
              {active.experience}
            </p>
            {active.portfolioUrl !== null && (
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">{`${t("portfolioUrl")}: `}</span>
                <a
                  href={active.portfolioUrl}
                  dir="ltr"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {active.portfolioUrl}
                </a>
              </p>
            )}
            {active.sampleVideoUrl !== null && (
              <p className="mt-1 text-sm">
                <span className="text-muted-foreground">{`${t("sampleVideoUrl")}: `}</span>
                <a
                  href={active.sampleVideoUrl}
                  dir="ltr"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {active.sampleVideoUrl}
                </a>
              </p>
            )}
          </div>
        </section>
      )}

      {applications.length > 0 && (
        <section aria-labelledby="application-history">
          <h2
            id="application-history"
            className="font-heading text-xl font-semibold text-foreground"
          >
            {t("historyTitle")}
          </h2>
          <ul className="mt-4 divide-y divide-border rounded-md border border-border">
            {applications.map((application) => (
              <li key={application.id} className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{application.field}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {`${t("submittedOn")}: ${formatDate(application.createdAt, locale)}`}
                  </p>
                  {application.reviewedAt !== null && (
                    <p className="text-sm text-muted-foreground">
                      {`${t("reviewedOn")}: ${formatDate(application.reviewedAt, locale)}`}
                    </p>
                  )}
                  {application.status === "REJECTED" && application.reason !== null && (
                    <p className="mt-1 text-sm text-danger">
                      {`${t("rejectionReason")}: ${application.reason}`}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-sm border px-2 py-0.5 text-xs ${statusClasses(application.status)}`}
                >
                  {t(statusLabelKey(application.status))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
