import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { NotificationList } from "@/features/notifications/components/notification-list";
import { listNotifications } from "@/server/notifications";
import { getCurrentSession } from "@/server/session";

/** Notification centre (P09-T02). Owner-only, read state persisted server-side. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Notifications" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/notifications`)}`);
  }
  const { rows } = await listNotifications(user.id, locale === "en" ? "en" : "ar");

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <NotificationList
        locale={locale === "en" ? "en" : "ar"}
        rows={rows.map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          linkPath: row.linkPath,
          readAt: row.readAt === null ? null : row.readAt.toISOString(),
          createdAt: row.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
