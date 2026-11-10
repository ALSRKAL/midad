import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { AvatarPicker } from "@/features/account/components/avatar-picker";
import { DeleteAccountDialog } from "@/features/account/components/delete-account-dialog";
import { ExportDataButton } from "@/features/account/components/export-data-button";
import { NotificationForm } from "@/features/account/components/notification-form";
import { PasswordForm } from "@/features/account/components/password-form";
import { ProfileForm } from "@/features/account/components/profile-form";
import { SessionsList } from "@/features/account/components/sessions-list";
import { getAccountProfile, listAccountSessions } from "@/server/account";
import { getCurrentSessionWithId } from "@/server/session";

/**
 * Account settings (the product requirements).
 *
 * A server component: every value on the page is read from the database for the signed-in user,
 * and each section is a small client form that calls an action. No setting is accepted from the URL
 * or from local storage before the server has stored it.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("title") };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getCurrentSessionWithId();
  if (session === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/settings`)}`);
  }

  const t = await getTranslations({ locale, namespace: "Account" });
  const [profile, sessions] = await Promise.all([
    getAccountProfile(session.user.id),
    listAccountSessions(session.user.id),
  ]);

  const sessionItems = sessions.sessions.map((item) => ({
    id: item.id,
    createdAt: item.createdAt.toISOString(),
    expiresAt: item.expiresAt.toISOString(),
    ipAddress: item.ipAddress,
    userAgent: item.userAgent,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="border-b border-border pb-4">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mt-8 space-y-8">
        <section
          aria-labelledby="profile-heading"
          className="rounded-md border border-border bg-surface p-6"
        >
          <h2 id="profile-heading" className="font-heading text-xl font-semibold text-foreground">
            {t("profileTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("profileDescription")}</p>

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-foreground">{t("avatar")}</p>
            <AvatarPicker imageUrl={profile.image} name={profile.name} />
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {t("preferencesTitle")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("preferencesDescription")}</p>
            <div className="mt-5">
              <ProfileForm
                email={profile.email}
                initial={{
                  name: profile.name,
                  bio: profile.bio ?? "",
                  locale: profile.locale,
                  theme: profile.theme,
                }}
                currentLocale={locale === "en" ? "en" : "ar"}
              />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="password-heading"
          className="rounded-md border border-border bg-surface p-6"
        >
          <h2 id="password-heading" className="font-heading text-xl font-semibold text-foreground">
            {t("passwordTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("passwordDescription")}</p>
          <div className="mt-5">
            <PasswordForm />
          </div>
        </section>

        <section
          aria-labelledby="sessions-heading"
          className="rounded-md border border-border bg-surface p-6"
        >
          <h2 id="sessions-heading" className="font-heading text-xl font-semibold text-foreground">
            {t("sessionsTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("sessionsDescription")}</p>
          <div className="mt-5">
            <SessionsList
              sessions={sessionItems}
              totalSessions={sessions.total}
              currentSessionId={session.sessionId}
              locale={locale === "en" ? "en" : "ar"}
            />
          </div>
        </section>

        <section
          aria-labelledby="notifications-heading"
          className="rounded-md border border-border bg-surface p-6"
        >
          <h2
            id="notifications-heading"
            className="font-heading text-xl font-semibold text-foreground"
          >
            {t("notificationsTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("notificationsDescription")}</p>
          <div className="mt-5">
            <NotificationForm initial={profile.preferences} />
          </div>
        </section>

        <section
          aria-labelledby="data-heading"
          className="rounded-md border border-border bg-surface p-6"
        >
          <h2 id="data-heading" className="font-heading text-xl font-semibold text-foreground">
            {t("dataTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("dataDescription")}</p>
          <div className="mt-5">
            <ExportDataButton />
          </div>
        </section>

        <section
          aria-labelledby="delete-heading"
          className="rounded-md border border-danger/40 bg-surface p-6"
        >
          <h2 id="delete-heading" className="font-heading text-xl font-semibold text-danger">
            {t("dangerTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("dangerDescription")}</p>
          <div className="mt-5">
            <DeleteAccountDialog email={profile.email} />
          </div>
        </section>
      </div>
    </div>
  );
}
