"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

/**
 * 500 boundary.
 *
 * Shows a reference the user can quote to support (Next's error digest, which maps to the request id
 * in the server log), never the exception message. `reset()` retries the segment without a full page
 * reload, so a transient failure does not lose the surrounding layout.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("System");

  useEffect(() => {
    // The server already logged the failure with its request id; this keeps the browser console
    // useful during development without rendering internals to the visitor.
    console.error("route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-20">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <p className="font-mono text-sm text-muted-foreground">{`500`}</p>
        <h1 className="font-heading text-3xl">{t("errorTitle")}</h1>
        <p className="text-muted-foreground">{t("errorBody")}</p>

        {error.digest !== undefined && (
          <p className="text-sm text-muted-foreground">
            {`${t("errorReference")}: `}
            <span className="font-mono" dir="ltr">
              {error.digest}
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-150 ease-brand hover:bg-primary/90"
        >
          {t("retry")}
        </button>
      </div>
    </div>
  );
}
