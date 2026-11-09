"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { resetPassword } from "@/lib/auth-client";

/**
 * Reset-password form.
 *
 * The token comes from the emailed link (`?token=…`) and is single-use with a one-hour expiry
 * (P02-T02). The two fields are compared on the client for a fast, specific error, and the API is
 * still the authority on whether the token is valid.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("Password");
  const authT = useTranslations("Auth");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const passwordValue = formData.get("password");
    const confirmValue = formData.get("confirm");
    const password = typeof passwordValue === "string" ? passwordValue : "";
    const confirm = typeof confirmValue === "string" ? confirmValue : "";

    if (password !== confirm) {
      setError(t("mismatch"));
      return;
    }
    if (password.length < 8) {
      setError(t("resetInvalid"));
      return;
    }

    setPending(true);
    const result = await resetPassword({ newPassword: password, token });
    setPending(false);

    if (result.error !== null && result.error !== undefined) {
      setError(result.error.status === 429 ? authT("rateLimited") : t("resetInvalid"));
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-md border border-success p-4 text-sm text-success">
          {t("resetDone")}
        </p>
        <Link
          href="/login"
          className="block rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
        >
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  if (token === "") {
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded-md border border-danger p-4 text-sm text-danger">
          {t("resetInvalid")}
        </p>
        <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
          {t("sendLink")}
        </Link>
      </div>
    );
  }

  return (
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
        <Label htmlFor="password">{t("newPassword")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">{t("confirmPassword")}</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? t("resetting") : t("resetSubmit")}
      </Button>
    </form>
  );
}
