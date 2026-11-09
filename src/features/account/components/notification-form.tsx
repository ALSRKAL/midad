"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateNotificationsAction } from "@/features/account/actions";
import { useAccountError } from "@/features/account/components/use-account-error";
import { useRouter } from "@/i18n/navigation";
import type { UserPreferences } from "@/features/account/schema";

/**
 * Notification preferences (the product requirements).
 *
 * Stored on the user row and read by the notification fan-out when it is built in P09. The switches
 * are Radix switches labelled by their visible text, so the state is announced ("on"/"off") and the
 * whole row is operable from the keyboard.
 */

const ROWS = [
  { key: "notifyReplies", id: "notify-replies" },
  { key: "notifyAnnouncements", id: "notify-announcements" },
  { key: "notifyProductUpdates", id: "notify-product-updates" },
] as const;

export function NotificationForm({ initial }: { initial: UserPreferences }) {
  const t = useTranslations("Account");
  const errorMessage = useAccountError();
  const router = useRouter();

  const [preferences, setPreferences] = useState(initial);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setError(null);

    const result = await updateNotificationsAction(preferences);
    setPending(false);

    if (!result.ok) {
      setError(errorMessage(result.error));
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

      <ul className="space-y-4">
        {ROWS.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-4">
            <span id={`${row.id}-label`} className="text-sm text-foreground">
              {t(row.key)}
            </span>
            <Switch
              id={row.id}
              aria-labelledby={`${row.id}-label`}
              checked={preferences[row.key]}
              onCheckedChange={(checked) => {
                setPreferences((current) => ({ ...current, [row.key]: checked }));
              }}
            />
          </li>
        ))}
      </ul>

      <Button type="submit" loading={pending}>
        {pending ? t("saving") : t("notificationsSave")}
      </Button>
    </form>
  );
}
