"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessageAction } from "@/features/contact/actions";
import type { SerializedError } from "@/lib/errors";

/**
 * Contact form (the product requirements).
 *
 * The hidden honeypot field is a real form field for bots and invisible to people and assistive
 * tech (`hidden` removes it from the accessibility tree). The server validates the same rules again;
 * the client checks are for a fast, translated message.
 */

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function messageFor(
  t: ReturnType<typeof useTranslations<"Contact">>,
  error: SerializedError,
): string {
  const code = error.fields === undefined ? undefined : Object.values(error.fields)[0]?.[0];
  switch (code) {
    case "NAME_TOO_SHORT":
    case "NAME_TOO_LONG":
      return t("nameTooShort");
    case "EMAIL_INVALID":
      return t("emailInvalid");
    case "SUBJECT_TOO_SHORT":
    case "SUBJECT_TOO_LONG":
      return t("subjectTooShort");
    case "MESSAGE_TOO_SHORT":
    case "MESSAGE_TOO_LONG":
      return t("messageTooShort");
    default:
      break;
  }
  return error.kind === "RATE_LIMITED" ? t("rateLimited") : t("genericError");
}

export function ContactForm() {
  const t = useTranslations("Contact");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = textField(formData, "name").trim();
    const email = textField(formData, "email").trim();
    const subject = textField(formData, "subject").trim();
    const message = textField(formData, "message").trim();
    const website = textField(formData, "website");

    if (name.length < 2) {
      setError(t("nameTooShort"));
      return;
    }
    if (!email.includes("@")) {
      setError(t("emailInvalid"));
      return;
    }
    if (subject.length < 4) {
      setError(t("subjectTooShort"));
      return;
    }
    if (message.length < 20) {
      setError(t("messageTooShort"));
      return;
    }

    setPending(true);
    const result = await submitContactMessageAction({ name, email, subject, message, website });
    setPending(false);

    if (!result.ok) {
      setError(messageFor(t, result.error));
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="rounded-md border border-success bg-surface p-6">
        <p className="font-heading text-lg font-semibold text-success">{t("sentTitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("sentBody")}</p>
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">{t("name")}</Label>
          <Input id="contact-name" name="name" autoComplete="name" maxLength={80} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">{t("email")}</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            maxLength={160}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject">{t("subject")}</Label>
        <Input id="contact-subject" name="subject" maxLength={120} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">{t("message")}</Label>
        <Textarea id="contact-message" name="message" rows={6} maxLength={2000} required />
      </div>

      <input type="text" name="website" hidden tabIndex={-1} autoComplete="off" />

      <Button type="submit" loading={pending}>
        {pending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
