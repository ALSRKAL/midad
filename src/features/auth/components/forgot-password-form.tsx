"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { requestPasswordReset } from "@/lib/auth-client";

/**
 * "Forgot password" form.
 *
 * Always reports the same confirmation, whether or not the address exists: the API deliberately
 * does not reveal that, and a different message here would undo its work (the product requirements).
 */
export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("Password");
  const authT = useTranslations("Auth");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const emailValue = formData.get("email");
    const email = typeof emailValue === "string" ? emailValue : "";

    const result = await requestPasswordReset({
      email,
      redirectTo: `/${locale}/reset-password`,
    });

    /**
     * Success and "address not found" stay indistinguishable on purpose. A 429 is different: the
     * request was refused, so claiming an email was sent would be a lie the learner would wait on.
     */
    if (result.error !== null && result.error !== undefined && result.error.status === 429) {
      setError(authT("rateLimited"));
      setPending(false);
      return;
    }

    setSent(true);
    setPending(false);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div role="status" className="rounded-md border border-success p-4">
          <p className="font-medium text-success">{t("sentTitle")}</p>
          <p className="mt-1 text-sm text-success">{t("sentBody")}</p>
        </div>
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            {t("backToLogin")}
          </Link>
        </p>
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
        <Label htmlFor="email">{authT("email")}</Label>
        <Input id="email" name="email" type="email" dir="ltr" autoComplete="email" required />
      </div>

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? t("sending") : t("sendLink")}
      </Button>

      <p className="text-center text-sm">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
