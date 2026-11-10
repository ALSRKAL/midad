import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/**
 * Shown instead of a protected page when the visitor is signed in but has the wrong role.
 *
 * A dedicated screen rather than a redirect: the user is authenticated, so sending them back to the
 * login form would be confusing and would loop. The status stays 200 because the page renders, but
 * it is marked noindex so it never becomes a search result.
 */
export async function AccessDenied({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-24">
      <meta name="robots" content="noindex" />
      <div className="space-y-3 text-center">
        <p className="font-mono text-sm text-muted-foreground">{`403`}</p>
        <h1 className="font-heading text-2xl">{t("accessDeniedTitle")}</h1>
        <p className="text-muted-foreground">{t("accessDeniedBody")}</p>
        <Link
          href="/"
          className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
