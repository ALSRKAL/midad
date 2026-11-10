import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { ClientMessages } from "@/components/client-messages";
import { getCurrentSession } from "@/server/session";

/**
 * Settings guard (P02-T05).
 *
 * The page itself also refuses to render without a session; this layout is the outer lock that
 * keeps the redirect in one place, exactly like the admin and instructor areas. Any signed-in,
 * active role may open their own settings.
 */
export default async function SettingsLayout({
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
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/settings`)}`);
  }

  return (
    <ClientMessages locale={locale} namespaces={["Common", "Account", "Auth", "Password"]}>
      {children}
    </ClientMessages>
  );
}
