"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

/**
 * Google sign-in button.
 *
 * Rendered only when both Google keys are configured — the server decides and passes `enabled`, so a
 * deployment without OAuth never shows a button that could fail (the product requirements).
 *
 * The Google mark is an inline SVG rather than an icon-library import: brand marks must not be
 * recoloured by the theme, and the product requirements allows offline SVG assets for brand logos.
 */
export function GoogleButton({ enabled, callbackURL }: { enabled: boolean; callbackURL: string }) {
  const t = useTranslations("Auth");
  const [pending, setPending] = useState(false);

  if (!enabled) return null;

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2"
        loading={pending}
        onClick={() => {
          setPending(true);
          void signIn.social({ provider: "google", callbackURL }).finally(() => setPending(false));
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
          />
        </svg>
        {t("google")}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        {t("or")}
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
    </div>
  );
}
