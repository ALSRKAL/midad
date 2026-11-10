import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { ClientMessages } from "@/components/client-messages";
import { AccessDenied } from "@/components/shared/access-denied";
import { InstructorNav } from "@/features/instructor-builder/components/instructor-nav";
import { getCurrentSession } from "@/server/session";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Instructor area guard and shell (P02-T04, P04-T01).
 *
 * Authentication first, then role. Students see access denied rather than a redirect loop;
 * anonymous visitors are sent to the login form and brought back. The shell adds the builder
 * navigation and keeps it sticky beside the page content.
 */
export default async function InstructorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/instructor`)}`);
  }
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return <AccessDenied locale={locale} />;
  }

  const t = await getTranslations({ locale, namespace: "Dashboard" });

  return (
    <ClientMessages
      locale={locale}
      namespaces={[
        "Common",
        "InstructorDashboard",
        "Instructor",
        "InstructorAnalytics",
        "CourseBuilder",
        "Curriculum",
        "LessonContent",
        "Publish",
        "Video",
        "Quiz",
        "Coupons",
        "Earnings",
        "Announcements",
        "Catalog",
      ]}
    >
      <div className="mx-auto w-full max-w-(--container-page) px-6 py-8">
        <header className="border-b border-border pb-4">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            {t("instructorTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("signedInAs", { name: user.name })}
          </p>
        </header>
        <div className="mt-6 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <div className="h-fit lg:sticky lg:top-24">
            <InstructorNav />
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </ClientMessages>
  );
}
