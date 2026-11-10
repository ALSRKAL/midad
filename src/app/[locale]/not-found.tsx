import { useTranslations } from "next-intl";

import { LottiePlayer } from "@/components/shared/lottie-player";
import { Link } from "@/i18n/navigation";

/**
 * 404 page (the product requirements).
 *
 * A client component so the message follows the active locale even though Next's `not-found`
 * boundary does not receive route params. The Lottie is decorative and the sentence beside it says
 * what happened and offers the only useful action.
 */
export default function NotFoundPage() {
  const t = useTranslations("System");

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-20">
      <div className="flex flex-col items-center gap-6 text-center">
        <LottiePlayer src="/lottie/empty-search.json" width={280} height={210} />
        <div className="max-w-md space-y-3">
          <p className="font-mono text-sm text-muted-foreground">{`404`}</p>
          <h1 className="font-heading text-3xl">{t("notFoundTitle")}</h1>
          <p className="text-muted-foreground">{t("notFoundBody")}</p>
        </div>
        <Link
          href="/"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-150 ease-brand hover:bg-primary/90"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
