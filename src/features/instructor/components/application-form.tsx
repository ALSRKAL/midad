"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitInstructorApplicationAction } from "@/features/instructor/actions";
import { useApplicationError } from "@/features/instructor/components/use-application-error";
import { useRouter } from "@/i18n/navigation";

/**
 * Instructor application form (the product requirements).
 *
 * The applicant writes their experience, field and two links. Submitting stores a PENDING row that
 * the admin queue reads; the page then re-renders as the status view, so the form disappears rather
 * than inviting a duplicate.
 */

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function InstructorApplicationForm() {
  const t = useTranslations("Instructor");
  const errorMessage = useApplicationError();
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const experience = textField(formData, "experience").trim();
    const field = textField(formData, "field").trim();
    const portfolioUrl = textField(formData, "portfolioUrl").trim();
    const sampleVideoUrl = textField(formData, "sampleVideoUrl").trim();

    if (experience.length < 50) {
      setError(t("experienceTooShort"));
      return;
    }
    if (field.length < 2) {
      setError(t("fieldTooShort"));
      return;
    }
    if (portfolioUrl !== "" && !isHttpUrl(portfolioUrl)) {
      setError(t("urlInvalid"));
      return;
    }
    if (sampleVideoUrl !== "" && !isHttpUrl(sampleVideoUrl)) {
      setError(t("urlInvalid"));
      return;
    }

    setPending(true);
    const result = await submitInstructorApplicationAction({
      experience,
      field,
      portfolioUrl,
      sampleVideoUrl,
    });
    setPending(false);

    if (!result.ok) {
      setError(errorMessage(result.error));
      return;
    }

    // The server now returns an active application, so the page renders the status view.
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

      <div className="space-y-2">
        <Label htmlFor="application-field">{t("field")}</Label>
        <Input
          id="application-field"
          name="field"
          maxLength={120}
          placeholder={t("fieldPlaceholder")}
          required
        />
        <p className="text-sm text-muted-foreground">{t("fieldHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="application-experience">{t("experience")}</Label>
        <Textarea
          id="application-experience"
          name="experience"
          rows={6}
          maxLength={2000}
          required
          aria-describedby="application-experience-hint"
        />
        <p id="application-experience-hint" className="text-sm text-muted-foreground">
          {t("experienceHint")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="application-portfolio">{t("portfolioUrl")}</Label>
        <Input
          id="application-portfolio"
          name="portfolioUrl"
          type="url"
          dir="ltr"
          inputMode="url"
          placeholder="https://"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="application-video">{t("sampleVideoUrl")}</Label>
        <Input
          id="application-video"
          name="sampleVideoUrl"
          type="url"
          dir="ltr"
          inputMode="url"
          placeholder="https://"
        />
        <p className="text-sm text-muted-foreground">{t("sampleVideoHint")}</p>
      </div>

      <Button type="submit" loading={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
