import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { ClientMessages } from "@/components/client-messages";
import { AccessDenied } from "@/components/shared/access-denied";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { getCurrentSession } from "@/server/session";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Admin area guard and shell (P02-T04, P05-T01).
 *
 * The middleware only routes. This server layout is the authority: an anonymous visitor is sent to
 * the login form with a `next` back to where they were, and a signed-in non-admin sees access
 * denied instead of the content. Nothing renders before the check completes.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/admin`)}`);
  if (user.role !== "ADMIN") return <AccessDenied locale={locale} />;

  const t = await getTranslations({ locale, namespace: "Dashboard" });

  return (
    <ClientMessages
      locale={locale}
      namespaces={[
        "Common",
        "Admin",
        "AdminPayoutDetail",
        "AdminRefundDetail",
        "AdminSettings",
        "Coupons",
      ]}
    >
      <div className="mx-auto w-full max-w-(--container-page) px-6 py-8">
        <header className="border-b border-border pb-4">
          <h1 className="font-heading text-2xl font-semibold text-foreground">{t("adminTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("signedInAs", { name: user.name })}
          </p>
        </header>
        <div className="mt-6 grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <div className="h-fit lg:sticky lg:top-24">
            <AdminNav />
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </ClientMessages>
  );
}
