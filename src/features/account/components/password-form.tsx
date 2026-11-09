"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/auth-client";

/**
 * Change password (the product requirements).
 *
 * Runs through Better Auth so the hash, the policy and the session revocation are the library's
 * responsibility, not a second implementation. `revokeOtherSessions` is on: if a password was
 * changed because someone else knew it, every other session must end as part of the same action.
 */

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function PasswordForm() {
  const t = useTranslations("Account");
  const authT = useTranslations("Auth");
  const formRef = useRef<HTMLFormElement>(null);

  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const currentPassword = textField(formData, "currentPassword");
    const newPassword = textField(formData, "newPassword");
    const confirmPassword = textField(formData, "confirmPassword");

    if (newPassword.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setPending(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);

    if (result.error !== null && result.error !== undefined) {
      const detail = `${result.error.code ?? ""} ${result.error.message ?? ""}`;
      setError(
        /INVALID_PASSWORD|invalid password|incorrect/i.test(detail)
          ? t("passwordWrong")
          : result.error.status === 429
            ? t("rateLimited")
            : authT("genericError"),
      );
      return;
    }

    formRef.current?.reset();
    setSaved(true);
  }

  return (
    <form
      ref={formRef}
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
      {saved && (
        <p
          role="status"
          className="rounded-sm border border-success px-3 py-2 text-sm text-success"
        >
          {t("passwordSaved")}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="current-password">{t("currentPassword")}</Label>
        <Input
          id="current-password"
          name="currentPassword"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-password">{t("newPassword")}</Label>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </div>

      <Button type="submit" loading={pending}>
        {pending ? t("passwordSaving") : t("passwordSave")}
      </Button>
    </form>
  );
}
