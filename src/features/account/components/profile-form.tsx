"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/features/account/actions";
import { useAccountError } from "@/features/account/components/use-account-error";
import { useRouter } from "@/i18n/navigation";

/**
 * Profile, language and appearance form (the product requirements).
 *
 * Saving the preferred language navigates to the same page in that language, which is what "اللغة
 * المفضلة" means in practice; next-intl's middleware then remembers the choice in the locale
 * cookie. The theme is applied immediately through next-themes after the server accepted it.
 */

type ProfileValues = {
  name: string;
  bio: string;
  locale: "ar" | "en";
  theme: "light" | "dark" | "system";
};

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function ProfileForm({
  email,
  initial,
  currentLocale,
}: {
  email: string;
  initial: ProfileValues;
  currentLocale: "ar" | "en";
}) {
  const t = useTranslations("Account");
  const errorMessage = useAccountError();
  const router = useRouter();
  const { setTheme } = useTheme();

  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = textField(formData, "name").trim();
    const bio = textField(formData, "bio").trim();
    const locale = textField(formData, "locale") === "en" ? "en" : "ar";
    const rawTheme = textField(formData, "theme");
    const theme =
      rawTheme === "light" || rawTheme === "dark" || rawTheme === "system" ? rawTheme : "system";

    // Immediate feedback for the two rules a learner can fix without a round trip.
    if (name.length < 2) {
      setError(t("nameTooShort"));
      return;
    }
    if (name.length > 80) {
      setError(t("nameTooLong"));
      return;
    }
    if (bio.length > 500) {
      setError(t("bioTooLong"));
      return;
    }

    setPending(true);
    const result = await updateProfileAction({ name, bio, locale, theme });
    setPending(false);

    if (!result.ok) {
      setError(errorMessage(result.error));
      return;
    }

    setTheme(theme);
    if (locale !== currentLocale) {
      // Land on the same page in the newly chosen language; the server already stored the pref.
      router.replace("/settings", { locale });
      return;
    }

    setSaved(true);
    router.refresh();
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
      {saved && (
        <p
          role="status"
          className="rounded-sm border border-success px-3 py-2 text-sm text-success"
        >
          {t("saved")}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="profile-name">{t("name")}</Label>
        <Input
          id="profile-name"
          name="name"
          defaultValue={initial.name}
          autoComplete="name"
          maxLength={80}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-email">{t("email")}</Label>
        <Input id="profile-email" type="email" dir="ltr" value={email} readOnly disabled />
        <p className="text-sm text-muted-foreground">{t("emailHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-bio">{t("bio")}</Label>
        <Textarea
          id="profile-bio"
          name="bio"
          defaultValue={initial.bio ?? ""}
          maxLength={500}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">{t("bioHint")}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-locale">{t("language")}</Label>
          <Select id="profile-locale" name="locale" defaultValue={initial.locale}>
            <option value="ar">{t("languageAr")}</option>
            <option value="en">{t("languageEn")}</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-theme">{t("theme")}</Label>
          <Select id="profile-theme" name="theme" defaultValue={initial.theme}>
            <option value="system">{t("themeSystem")}</option>
            <option value="light">{t("themeLight")}</option>
            <option value="dark">{t("themeDark")}</option>
          </Select>
        </div>
      </div>

      <Button type="submit" loading={pending}>
        {pending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
