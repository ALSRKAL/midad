"use client";

import { Bell, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import { Link, useRouter } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";

export type NotificationItemRow = {
  id: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationList({
  rows,
  locale,
}: {
  rows: NotificationItemRow[];
  locale: "ar" | "en";
}) {
  const t = useTranslations("Notifications");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markRead(id: string) {
    setPendingId(id);
    setError(null);
    const result = await markNotificationReadAction({ id });
    setPendingId(null);
    if (result.ok) router.refresh();
    else setError(t("error"));
  }

  async function markAll() {
    setPendingId("all");
    setError(null);
    const result = await markAllNotificationsReadAction();
    setPendingId(null);
    if (result.ok) router.refresh();
    else setError(t("error"));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={pendingId === "all"}
          onClick={() => {
            void markAll();
          }}
        >
          {t("markAll")}
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      {error !== null && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-8 rounded-md border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
          {rows.map((row) => (
            <li
              key={row.id}
              className={`flex flex-wrap items-start gap-3 p-4 ${row.readAt === null ? "bg-muted/40" : ""}`}
            >
              <span className="mt-0.5 rounded-full bg-muted p-2 text-primary">
                <Bell className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-48 flex-1">
                <p className="font-medium text-foreground">
                  {row.readAt === null && (
                    <span
                      className="me-2 inline-block size-2 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  {row.title}
                </p>
                {row.body !== null && (
                  <p className="mt-1 text-sm text-muted-foreground">{row.body}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(new Date(row.createdAt), locale)}
                </p>
                {row.linkPath !== null && (
                  <Link
                    href={row.linkPath}
                    className="mt-1 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    {t("open")}
                  </Link>
                )}
              </div>
              {row.readAt === null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={pendingId === row.id}
                  onClick={() => {
                    void markRead(row.id);
                  }}
                >
                  <Check className="size-4" aria-hidden="true" />
                  {t("markRead")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
