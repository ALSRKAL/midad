"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { GoogleButton } from "@/features/auth/components/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { signIn } from "@/lib/auth-client";

/**
 * Sign-in form.
 *
 * Deliberately reports one message for a wrong email and a wrong password: distinguishing them
 * would tell an attacker which addresses exist (the product requirements). The unverified case is separate
 * because the user needs an actionable next step, and it only appears when the password was right.
 */
/** FormData values are `string | File`; only text inputs are read here. */
function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function SignInForm({
  locale,
  next,
  googleEnabled,
}: {
  locale: string;
  next?: string;
  googleEnabled: boolean;
}) {
  const t = useTranslations("Auth");
  const passwordT = useTranslations("Password");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(() => next ?? `/${locale}`, [next, locale]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await signIn.email({
      email: textField(formData, "email"),
      password: textField(formData, "password"),
      callbackURL: redirectTo,
    });

    if (result.error !== null && result.error !== undefined) {
      /**
       * Map by status plus text: the client wrapper does not always surface `code`, and matching
       * only on a code can silently fall back to the generic message (observed in P02-T01).
       * 401 always means "wrong email or password" — deliberately the same for both.
       */
      const detail = `${result.error.code ?? ""} ${result.error.message ?? ""} ${result.error.statusText ?? ""}`;
      const isDeleted = detail.includes("ACCOUNT_DELETED");
      const isBanned = detail.includes("ACCOUNT_BANNED");
      const isUnverified = detail.includes("EMAIL_NOT_VERIFIED") || detail.includes("not verified");
      const isCredentialFailure =
        result.error.status === 401 || detail.includes("INVALID_EMAIL_OR_PASSWORD");

      setError(
        isDeleted
          ? t("deleted")
          : isBanned
            ? t("banned")
            : isUnverified
              ? t("unverified")
              : result.error.status === 429
                ? t("rateLimited")
                : isCredentialFailure
                  ? t("invalidCredentials")
                  : t("genericError"),
      );
      setPending(false);
      return;
    }

    /**
     * Apply the saved locale preference on a new device (the product requirements precedence: preference → cookie
     * → Accept-Language). The login page has no access to the account before authentication, so this
     * is the first point where the preference can be honoured (closes KI-03).
     */
    const preferred = (result.data?.user as { locale?: string } | undefined)?.locale?.toLowerCase();
    if (preferred === "ar" || preferred === "en") {
      document.cookie = `MIDAD_LOCALE=${preferred}; path=/; max-age=31536000; samesite=lax`;
      if (preferred !== locale) {
        const segments = redirectTo.split("/");
        if (segments[1] === "ar" || segments[1] === "en") segments[1] = preferred;
        else segments.splice(1, 0, preferred);
        window.location.assign(segments.join("/"));
        return;
      }
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <GoogleButton enabled={googleEnabled} callbackURL={redirectTo} />

      <form
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        className="space-y-5"
        noValidate
      >
        {error !== null && (
          <p role="alert" className="rounded-sm border border-danger px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" dir="ltr" autoComplete="email" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" className="w-full" loading={pending}>
          {pending ? t("signingIn") : t("submitSignIn")}
        </Button>

        <div className="flex flex-col gap-2 text-center text-sm">
          <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            {passwordT("forgotLink")}
          </Link>
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            {t("toSignUp")}
          </Link>
        </div>
      </form>
    </div>
  );
}
