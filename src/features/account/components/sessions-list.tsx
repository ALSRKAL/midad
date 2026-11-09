"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  revokeAllSessionsAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/features/account/actions";
import { useAccountError } from "@/features/account/components/use-account-error";
import { useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/auth-client";
import { formatDateTime } from "@/lib/dates";
import { describeUserAgent } from "@/lib/user-agent";

/**
 * Active sessions (the product requirements).
 *
 * Lists this account's unexpired sessions from the database, marks the current one, and offers the
 * three operations §2.3 asks for: end one, end the others, or sign out everywhere. Ending the
 * current session behaves like sign-out: the cookie is cleared and the visitor lands on the login
 * page.
 */

export type SessionItem = {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export function SessionsList({
  sessions,
  totalSessions,
  currentSessionId,
  locale,
}: {
  sessions: SessionItem[];
  totalSessions: number;
  currentSessionId: string;
  locale: "ar" | "en";
}) {
  const t = useTranslations("Account");
  const errorMessage = useAccountError();
  const router = useRouter();

  const [items, setItems] = useState(sessions);
  const [total, setTotal] = useState(totalSessions);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function finishSession(sessionId: string) {
    setPendingId(sessionId);
    setError(null);
    setNotice(null);
    const result = await revokeSessionAction({ sessionId });
    setPendingId(null);

    if (!result.ok) {
      setError(errorMessage(result.error));
      return;
    }

    if (sessionId === currentSessionId) {
      await signOut().catch(() => undefined);
      router.push("/login");
      router.refresh();
      return;
    }

    setItems((current) => current.filter((item) => item.id !== sessionId));
    setTotal((current) => Math.max(1, current - 1));
    setNotice(t("sessionRevoked"));
  }

  async function finishOthers() {
    setPendingId("others");
    setError(null);
    setNotice(null);
    const result = await revokeOtherSessionsAction();
    setPendingId(null);

    if (!result.ok) {
      setError(errorMessage(result.error));
      return;
    }

    setItems((current) => current.filter((item) => item.id === currentSessionId));
    setTotal(1);
    setNotice(t("sessionsRevokeOthersDone"));
    router.refresh();
  }

  async function finishAll() {
    setPendingId("all");
    setError(null);
    setNotice(null);
    const result = await revokeAllSessionsAction();
    setPendingId(null);

    if (!result.ok) {
      setError(errorMessage(result.error));
      return;
    }

    await signOut().catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error !== null && (
        <p role="alert" className="rounded-sm border border-danger px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {notice !== null && (
        <p
          role="status"
          className="rounded-sm border border-success px-3 py-2 text-sm text-success"
        >
          {notice}
        </p>
      )}

      <ul className="divide-y divide-border rounded-md border border-border">
        {items.map((item) => {
          const device = describeUserAgent(item.userAgent);
          const deviceLabel =
            device === null ? t("sessionUnknownDevice") : `${device.browser} · ${device.os}`;
          const isCurrent = item.id === currentSessionId;

          return (
            <li key={item.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                  <span>{deviceLabel}</span>
                  {isCurrent && (
                    <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {t("currentSession")}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {`${t("sessionStarted")}: ${formatDateTime(new Date(item.createdAt), locale)}`}
                </p>
                {item.ipAddress !== null && (
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    {item.ipAddress}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={pendingId === item.id}
                onClick={() => {
                  void finishSession(item.id);
                }}
              >
                {t("sessionRevoke")}
                <span className="sr-only">{` — ${deviceLabel}`}</span>
              </Button>
            </li>
          );
        })}
      </ul>

      {total > items.length && (
        <p className="text-sm text-muted-foreground">
          {t("sessionsShown", { shown: items.length, total })}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          loading={pendingId === "others"}
          disabled={items.length <= 1}
          onClick={() => {
            void finishOthers();
          }}
        >
          {t("sessionsRevokeOthers")}
        </Button>
        <Button
          type="button"
          variant="danger"
          loading={pendingId === "all"}
          onClick={() => {
            void finishAll();
          }}
        >
          {t("signOutEverywhere")}
        </Button>
      </div>
    </div>
  );
}
