"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { GoogleButton } from "@/features/auth/components/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { signUp } from "@/lib/auth-client";

/**
 * Registration form.
 *
 * On success the account exists but is unverified (P02-T01 sends the verification email through
 * Mailpit). The form does not sign the user in: `requireEmailVerification` is on, so the honest next
 * step is "open your inbox", which is exactly what it says.
 */
/** FormData values are `string | File`; only text inputs are read here. */
function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function SignUpForm({ locale, googleEnabled }: { locale: string; googleEnabled: boolean }) {
  const t = useTranslations("Auth");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = textField(formData, "email");
    const password = textField(formData, "password");
    const name = textField(formData, "name");

    if (password.length < 8) {
      setError(t("passwordHint"));
      setPending(false);
      return;
    }

    const result = await signUp.email({
      email,
      password,
      name,
      // The database stores the Prisma enum in upper case ("AR" | "EN"); the UI works in lower case.
      locale: locale === "en" ? "EN" : "AR",
      callbackURL: `/${locale}/login?verified=1`,
    });

    if (result.error !== null && result.error !== undefined) {
      const detail = `${result.error.code ?? ""} ${result.error.message ?? ""} ${result.error.statusText ?? ""}`;
      setError(
        result.error.status === 429
          ? t("rateLimited")
          : detail.includes("USER_ALREADY_EXISTS") || result.error.status === 422
            ? t("emailTaken")
            : t("genericError"),
      );
      setPending(false);
      return;
    }

    setSentTo(email);
    setPending(false);
  }

  if (sentTo !== null) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-md border border-success p-4 text-sm text-success">
          {t("verificationSent")}
        </p>
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            {t("toSignIn")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GoogleButton enabled={googleEnabled} callbackURL={`/${locale}`} />

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
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" name="name" autoComplete="name" required minLength={2} />
        </div>

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
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="text-sm text-muted-foreground">
            {t("passwordHint")}
          </p>
        </div>

        <Button type="submit" className="w-full" loading={pending}>
          {pending ? t("creating") : t("submitSignUp")}
        </Button>

        <p className="text-center text-sm">
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            {t("toSignIn")}
          </Link>
        </p>
      </form>
    </div>
  );
}
